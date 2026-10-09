const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://pnoqggozzybcxfvwjmsr.supabase.co').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SESSION_SECRET = crypto.createHash('sha256').update(SERVICE_KEY || 'solid-local-session-secret').digest();
const SESSION_COOKIE = 'solid_session';
const SESSION_TTL = 8 * 60 * 60;
const PUBLIC_KEYS = ['hero', 'classes', 'teachers', 'schedules', 'events', 'news', 'videos', 'gallery', 'siteSettings', 'packs', 'translations', 'pages'];
const LEGACY_ADMINS = [
  { id: 'Uadmin', username: 'admin', role: 'admin', passwordHash: 'cfd604ca2553893f192e2c5440d49a887cb3d9e62b8432613d88ac64a7e2f21d' },
  { id: 'Umanager', username: 'manager', role: 'manager', passwordHash: '866485796cfa8d7c0cf7111640205b83076433547577511d81f8030ae99ecea5' }
];

function json(res, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
  res.end(body);
}
function text(res, status, body, headers = {}) { res.writeHead(status, headers); res.end(body); }
function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie || '').split(';').map(x => x.trim().split('='))
    .filter(x => x.length === 2).map(([k, v]) => [k, decodeURIComponent(v)]));
}
function b64url(value) { return Buffer.from(value).toString('base64url'); }
function sign(value) { return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('base64url'); }
function makeSession(user) {
  const payload = b64url(JSON.stringify({ sub: user.id, username: user.username, role: user.role, exp: Math.floor(Date.now() / 1000) + SESSION_TTL }));
  return `${payload}.${sign(payload)}`;
}
function readSession(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null; const expected=sign(payload); if (signature.length!==expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.exp > Math.floor(Date.now() / 1000) ? data : null;
  } catch { return null; }
}
function setSession(res, user) {
  res.setHeader('set-cookie', `${SESSION_COOKIE}=${encodeURIComponent(makeSession(user))}; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=${SESSION_TTL}`);
}
function clearSession(res) { res.setHeader('set-cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=0`); }
function currentUser(req) { return readSession(req); }
function requireUser(req, res, role = null) {
  const user = currentUser(req);
  if (!user) { json(res, 401, { ok: false, error: 'Authentication required.' }); return null; }
  if (role && user.role !== role) { json(res, 403, { ok: false, error: 'Administrator access required.' }); return null; }
  return user;
}
async function readBody(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 4 * 1024 * 1024) throw new Error('Request too large.');
  }
  return raw ? JSON.parse(raw) : {};
}
async function supabase(pathname, options = {}) {
  if (!SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.');
  const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'content-type': 'application/json', ...(options.headers || {}) };
  const response = await fetch(`${SUPABASE_URL}${pathname}`, { ...options, headers });
  const raw = await response.text();
  let data = null; try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  if (!response.ok) throw new Error(data?.message || data?.error || raw || `Supabase returned ${response.status}`);
  return data;
}
async function getData() {
  const rows = await supabase('/rest/v1/site_data?id=eq.default&select=data');
  return rows?.[0]?.data && typeof rows[0].data === 'object' ? rows[0].data : {};
}
async function putData(data) {
  await supabase('/rest/v1/site_data', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id: 'default', data, updated_at: new Date().toISOString() })
  });
}
async function ensureAdminSeed(data) {
  if (Array.isArray(data._adminUsers) && data._adminUsers.length) return data;
  data._adminUsers = LEGACY_ADMINS.map(x => ({ ...x }));
  await putData(data);
  return data;
}
function publicData(data) {
  const out = {};
  PUBLIC_KEYS.forEach(key => { if (data[key] !== undefined) out[key] = data[key]; });
  return out;
}
function safeUser(user) { return { id: user.id, username: user.username, role: user.role, createdAt: user.createdAt || null, updatedAt: user.updatedAt || null }; }
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const iterations = 210000;
  const digest = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('base64url');
  return `pbkdf2$${iterations}$${salt}$${digest}`;
}
function verifyPassword(password, stored) {
  if (!stored) return false;
  if (/^[a-f0-9]{64}$/i.test(stored)) {
    const digest = crypto.createHash('sha256').update(password).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(stored));
  }
  const [kind, iterations, salt, expected] = String(stored).split('$');
  if (kind !== 'pbkdf2' || !iterations || !salt || !expected) return false;
  const actual = crypto.pbkdf2Sync(password, salt, Number(iterations), 32, 'sha256').toString('base64url');
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}
function validateUsername(username) { return /^[a-zA-Z0-9._-]{3,32}$/.test(username); }
function validateRole(role) { return role === 'manager' ? 'manager' : 'admin'; }
async function authUser(username, password) {
  const data = await ensureAdminSeed(await getData());
  const users = data._adminUsers || [];
  const user = users.find(x => x.username.toLowerCase() === String(username || '').trim().toLowerCase() && x.active !== false);
  if (!user || !verifyPassword(String(password || ''), user.passwordHash)) return null;
  if (/^[a-f0-9]{64}$/i.test(user.passwordHash)) {
    user.passwordHash = hashPassword(String(password));
    user.updatedAt = new Date().toISOString();
    await putData(data);
  }
  return safeUser(user);
}
async function adminUsers() { const data = await ensureAdminSeed(await getData()); return data._adminUsers || []; }
function responseError(res, err) { console.error('[Solid API]', err); json(res, 500, { ok: false, error: 'The server could not complete that operation.' }); }
async function handleApi(req, res, url) {
  if (url.pathname === '/api/health') return json(res, 200, { ok: true, service: 'solid-dance-school' });
  if (url.pathname === '/api/session' && req.method === 'GET') return json(res, 200, { ok: true, user: currentUser(req) ? { username: currentUser(req).username, role: currentUser(req).role } : null });
  if (url.pathname === '/api/login' && req.method === 'POST') {
    const body = await readBody(req); const user = await authUser(body.username, body.password);
    if (!user) return json(res, 401, { ok: false, error: 'Invalid username or password.' });
    setSession(res, user); return json(res, 200, { ok: true, user });
  }
  if (url.pathname === '/api/logout' && req.method === 'POST') { clearSession(res); return json(res, 200, { ok: true }); }
  if (url.pathname === '/api/data' && req.method === 'GET') {
    const data = await getData();
    if (url.searchParams.get('scope') === 'admin') { if (!requireUser(req, res)) return; const copy = { ...data }; delete copy._adminUsers; return json(res, 200, { ok: true, data: copy }); }
    return json(res, 200, { ok: true, data: publicData(data) });
  }
  if (url.pathname === '/api/data' && req.method === 'PUT') {
    if (!requireUser(req, res)) return;
    const body = await readBody(req); if (!body.data || typeof body.data !== 'object') return json(res, 400, { ok: false, error: 'Data must be an object.' });
    const existing = await getData(); const next = { ...body.data, _adminUsers: existing._adminUsers || LEGACY_ADMINS };
    await putData(next); return json(res, 200, { ok: true });
  }
  if (url.pathname === '/api/public-registration' && req.method === 'POST') {
    const body = await readBody(req); const entry = body.entry;
    if (!entry || !entry.name || (!entry.email && !entry.phone)) return json(res, 400, { ok: false, error: 'Name and contact details are required.' });
    const data = await getData(); data.registrations = Array.isArray(data.registrations) ? data.registrations : []; data.notifications = Array.isArray(data.notifications) ? data.notifications : [];
    const duplicate = data.registrations.find(r => (entry.email && r.email === entry.email) || (entry.phone && r.phone === entry.phone));
    const now = new Date().toISOString();
    if (duplicate) { duplicate.audit = Array.isArray(duplicate.audit) ? duplicate.audit : []; duplicate.audit.unshift({ id: `A${Date.now()}`, at: now, action: 'Duplicate registration prevented', detail: 'Same email or phone', actor: 'public' }); data.notifications.unshift({ id: `N${Date.now()}`, at: now, actor: 'public', action: 'Duplicate registration prevented', detail: 'Same email or phone', studentId: duplicate.id, studentName: duplicate.name || entry.name, paymentStatus: duplicate.paymentStatus || '' }); await putData(data); return json(res, 200, { ok: true, duplicate: true }); }
    data.registrations.unshift(entry); data.notifications.unshift({ id: `N${Date.now()}`, at: now, actor: 'public', action: 'New registration received', detail: 'Public registration submitted', studentId: entry.id, studentName: entry.name, paymentStatus: entry.paymentStatus || '' }); await putData(data); return json(res, 200, { ok: true, duplicate: false });
  }
  if (url.pathname === '/api/admin-users' && req.method === 'GET') { if (!requireUser(req, res, 'admin')) return; return json(res, 200, { ok: true, users: (await adminUsers()).map(safeUser) }); }
  if (url.pathname === '/api/admin-users' && req.method === 'POST') {
    const actor = requireUser(req, res, 'admin'); if (!actor) return;
    const body = await readBody(req); const username = String(body.username || '').trim(); const role = validateRole(body.role); const password = String(body.password || '');
    if (!validateUsername(username)) return json(res, 400, { ok: false, error: 'Use 3–32 letters, numbers, dots, dashes, or underscores.' });
    if (password && password.length < 8) return json(res, 400, { ok: false, error: 'Password must contain at least 8 characters.' });
    const data = await ensureAdminSeed(await getData()); const users = data._adminUsers || []; const existing = users.find(x => x.id === body.id);
    if (users.some(x => x.username.toLowerCase() === username.toLowerCase() && x.id !== body.id)) return json(res, 409, { ok: false, error: 'That username is already in use.' });
    if (!existing && !password) return json(res, 400, { ok: false, error: 'A password is required for a new user.' });
    const record = existing || { id: `U${Date.now().toString(36)}`, createdAt: new Date().toISOString() }; record.username = username; record.role = role; record.active = true; record.updatedAt = new Date().toISOString(); if (password) record.passwordHash = hashPassword(password); if (!existing) users.push(record);
    data._adminUsers = users; await putData(data); return json(res, 200, { ok: true, user: safeUser(record), users: users.map(safeUser) });
  }
  const deleteMatch = url.pathname.match(/^\/api\/admin-users\/([^/]+)$/);
  if (deleteMatch && req.method === 'DELETE') {
    const actor = requireUser(req, res, 'admin'); if (!actor) return; const id = decodeURIComponent(deleteMatch[1]); const data = await ensureAdminSeed(await getData()); const users = data._adminUsers || []; const target = users.find(x => x.id === id); if (!target) return json(res, 404, { ok: false, error: 'User not found.' }); if (target.id === actor.sub) return json(res, 400, { ok: false, error: 'You cannot remove the account currently in use.' }); if (target.role === 'admin' && users.filter(x => x.role === 'admin' && x.active !== false).length < 2) return json(res, 400, { ok: false, error: 'Keep at least one administrator account.' }); data._adminUsers = users.filter(x => x.id !== id); await putData(data); return json(res, 200, { ok: true, users: data._adminUsers.map(safeUser) });
  }
  return json(res, 404, { ok: false, error: 'API route not found.' });
}
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.webm': 'video/webm' };
function staticFile(urlPath, res) {
  let pathname = decodeURIComponent(urlPath); if (pathname === '/') pathname = '/index.html';
  const clean = path.normalize(pathname).replace(/^\.\.(?:[\\/]|$)/, ''); let file = path.join(ROOT, clean);
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  // Clean-URL fallback: a route with no file extension (e.g. /cours) resolves to cours.html
  // when there is no literal file or directory for it, so every route has a single source file.
  if ((!fs.existsSync(file) || !fs.statSync(file).isFile()) && !path.extname(clean)) {
    const withHtml = `${file}.html`;
    if (fs.existsSync(withHtml) && fs.statSync(withHtml).isFile()) file = withHtml;
  }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return staticFile.notFound(res);
  const ext = path.extname(file).toLowerCase(); res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream', 'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=300' }); fs.createReadStream(file).pipe(res);
}
staticFile.notFound = function notFound(res) {
  const file = path.join(ROOT, '404.html');
  if (fs.existsSync(file)) { res.writeHead(404, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' }); return fs.createReadStream(file).pipe(res); }
  return text(res, 404, 'Not found', { 'content-type': 'text/plain; charset=utf-8' });
};
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return text(res, 405, 'Method not allowed');
    return staticFile(url.pathname, res);
  } catch (err) { responseError(res, err); }
});
server.listen(PORT, '0.0.0.0', () => console.log(`Solid Dance School server listening on ${PORT}`));
