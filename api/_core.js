// Shared API core used by both the Vercel function (api/[...path].js) and the
// standalone Node server (server.js). Files starting with "_" are not routed by Vercel.
const crypto = require('node:crypto');

const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://pnoqggozzybcxfvwjmsr.supabase.co').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const MEMORY_STORE = process.env.SOLID_MEMORY_STORE === '1'; // tests / local demos only
const SECRET_SOURCE = process.env.SESSION_SECRET || SERVICE_KEY || (MEMORY_STORE ? 'solid-memory-test-secret' : '');
const SESSION_SECRET = SECRET_SOURCE ? crypto.createHash('sha256').update('solid-session:' + SECRET_SOURCE).digest() : null;
const SESSION_COOKIE = 'solid_session';
const SESSION_TTL = 8 * 60 * 60;
const MAX_BODY = 4 * 1024 * 1024;
const PUBLIC_KEYS = ['hero', 'classes', 'teachers', 'schedules', 'events', 'news', 'videos', 'gallery', 'siteSettings', 'packs', 'translations', 'pages'];
// Keys a "manager" account may write (everything else is admin-only).
const MANAGER_KEYS = ['registrations', 'notifications'];
const MERGE_KEYS = ['registrations', 'notifications'];
const RESERVED = ['_adminUsers', '_rev'];
// Well-known first-install credentials. Accounts still using them are forced to change password.
const LEGACY_ADMINS = [
  { id: 'Uadmin', username: 'admin', role: 'admin', passwordHash: 'cfd604ca2553893f192e2c5440d49a887cb3d9e62b8432613d88ac64a7e2f21d' },
  { id: 'Umanager', username: 'manager', role: 'manager', passwordHash: '866485796cfa8d7c0cf7111640205b83076433547577511d81f8030ae99ecea5' }
];
const LEGACY_HASHES = new Set(LEGACY_ADMINS.map(x => x.passwordHash));

/* ---------- helpers ---------- */
function json(res, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
  res.end(body);
}
function parseCookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach(part => {
    const i = part.indexOf('='); if (i < 1) return;
    try { out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); } catch { /* ignore */ }
  });
  return out;
}
const b64url = v => Buffer.from(v).toString('base64url');
function sign(value) { return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('base64url'); }
function safeEqual(a, b) { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); }
function isSecure(req) { return String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https' || !!req.socket?.encrypted; }
function clientIp(req) { return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim(); }

function makeSession(user, mustChange) {
  const payload = b64url(JSON.stringify({ sub: user.id, username: user.username, role: user.role, mc: mustChange ? 1 : 0, exp: Math.floor(Date.now() / 1000) + SESSION_TTL }));
  return `${payload}.${sign(payload)}`;
}
function readSession(req) {
  if (!SESSION_SECRET) return null;
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.exp > Math.floor(Date.now() / 1000) ? data : null;
  } catch { return null; }
}
function cookie(req, value, maxAge) {
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${isSecure(req) ? '; Secure' : ''}`;
}
function setSession(req, res, user, mustChange) { res.setHeader('set-cookie', cookie(req, encodeURIComponent(makeSession(user, mustChange)), SESSION_TTL)); }
function clearSession(req, res) { res.setHeader('set-cookie', cookie(req, '', 0)); }

/** Returns the session, or answers 401/403 and returns null. Re-checks the account still exists. */
async function requireUser(req, res, { role = null, allowMustChange = false } = {}) {
  const session = readSession(req);
  if (!session) { json(res, 401, { ok: false, error: 'Authentication required.' }); return null; }
  const data = await getData();
  const account = (data._adminUsers || []).find(x => x.id === session.sub);
  if (!account || account.active === false) { json(res, 401, { ok: false, error: 'This account is no longer active.' }); return null; }
  const live = { ...session, role: account.role, username: account.username, mustChange: !!account.mustChange };
  if (live.mustChange && !allowMustChange) { json(res, 403, { ok: false, code: 'password_change_required', error: 'Please choose a new password before continuing.' }); return null; }
  if (role && live.role !== role) { json(res, 403, { ok: false, error: 'Administrator access required.' }); return null; }
  return live;
}

/** Blocks cross-site writes: Origin (when sent) must match Host, and bodies must be JSON. */
function guardWrite(req, res) {
  const origin = req.headers.origin;
  if (origin) {
    let host = ''; try { host = new URL(origin).host; } catch { /* invalid */ }
    if (host !== String(req.headers.host || '')) { json(res, 403, { ok: false, error: 'Cross-site request blocked.' }); return false; }
  }
  const type = String(req.headers['content-type'] || '').toLowerCase();
  const hasBody = req.method !== 'DELETE' && Number(req.headers['content-length'] || 0) !== 0;
  if (hasBody && !type.startsWith('application/json')) { json(res, 415, { ok: false, error: 'JSON body required.' }); return false; }
  return true;
}

async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {};
    return req.body;
  }
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY) throw Object.assign(new Error('Request too large.'), { status: 413 });
  }
  return raw ? JSON.parse(raw) : {};
}

/* ---------- in-memory throttling (best effort on serverless) ---------- */
const buckets = new Map();
function throttle(key, limit, windowMs) {
  const now = Date.now(); const b = (buckets.get(key) || []).filter(t => now - t < windowMs);
  if (b.length >= limit) { buckets.set(key, b); return false; }
  b.push(now); buckets.set(key, b);
  if (buckets.size > 5000) for (const [k, v] of buckets) if (!v.length || now - v[v.length - 1] > windowMs) buckets.delete(k);
  return true;
}
function failedLogins(key) { return (buckets.get('fail:' + key) || []).filter(t => Date.now() - t < 15 * 60 * 1000).length; }
function noteFailure(key) { const k = 'fail:' + key; const b = (buckets.get(k) || []).filter(t => Date.now() - t < 15 * 60 * 1000); b.push(Date.now()); buckets.set(k, b); }
function clearFailures(key) { buckets.delete('fail:' + key); }

/* ---------- storage ---------- */
let memoryDoc = {};
async function supabase(pathname, options = {}) {
  if (!SERVICE_KEY) throw Object.assign(new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.'), { status: 503 });
  const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'content-type': 'application/json', ...(options.headers || {}) };
  const response = await fetch(`${SUPABASE_URL}${pathname}`, { ...options, headers });
  const raw = await response.text();
  let data = null; try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  if (!response.ok) throw new Error(data?.message || data?.error || raw || `Supabase returned ${response.status}`);
  return data;
}
async function getData() {
  if (MEMORY_STORE) return JSON.parse(JSON.stringify(memoryDoc));
  const rows = await supabase('/rest/v1/site_data?id=eq.default&select=data');
  return rows?.[0]?.data && typeof rows[0].data === 'object' ? rows[0].data : {};
}
async function putData(data) {
  if (MEMORY_STORE) { memoryDoc = JSON.parse(JSON.stringify(data)); return; }
  await supabase('/rest/v1/site_data', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id: 'default', data, updated_at: new Date().toISOString() })
  });
}
// All writes are serialised per instance so read-modify-write cycles don't interleave.
let writeChain = Promise.resolve();
function withLock(fn) { const run = writeChain.then(fn, fn); writeChain = run.catch(() => {}); return run; }

async function ensureAdminSeed(data) {
  if (Array.isArray(data._adminUsers) && data._adminUsers.length) return data;
  const initial = process.env.ADMIN_INITIAL_PASSWORD;
  data._adminUsers = LEGACY_ADMINS.map(x => ({
    ...x, createdAt: new Date().toISOString(), mustChange: true,
    ...(x.role === 'admin' && initial && initial.length >= 10 ? { passwordHash: hashPassword(initial) } : {})
  }));
  await putData(data);
  return data;
}
function publicData(data) {
  const out = {};
  PUBLIC_KEYS.forEach(key => { if (data[key] !== undefined) out[key] = data[key]; });
  return out;
}
const safeUser = u => ({ id: u.id, username: u.username, role: u.role, createdAt: u.createdAt || null, updatedAt: u.updatedAt || null, mustChange: !!u.mustChange });

/* ---------- passwords ---------- */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('base64url'); const iterations = 210000;
  const digest = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('base64url');
  return `pbkdf2$${iterations}$${salt}$${digest}`;
}
function verifyPassword(password, stored) {
  if (!stored) return false;
  if (/^[a-f0-9]{64}$/i.test(stored)) return safeEqual(crypto.createHash('sha256').update(password).digest('hex'), stored);
  const [kind, iterations, salt, expected] = String(stored).split('$');
  if (kind !== 'pbkdf2' || !iterations || !salt || !expected) return false;
  return safeEqual(crypto.pbkdf2Sync(password, salt, Number(iterations), 32, 'sha256').toString('base64url'), expected);
}
const validateUsername = u => /^[a-zA-Z0-9._-]{3,32}$/.test(u);
const validateRole = r => (r === 'manager' ? 'manager' : 'admin');
function passwordProblem(p) {
  if (p.length < 10) return 'Password must contain at least 10 characters.';
  if (!/[a-zA-Z]/.test(p) || !/[0-9]/.test(p)) return 'Use both letters and numbers in the password.';
  return '';
}
async function authUser(username, password) {
  return await withLock(async () => {
    const data = await ensureAdminSeed(await getData());
    const users = data._adminUsers || [];
    const user = users.find(x => x.username.toLowerCase() === String(username || '').trim().toLowerCase() && x.active !== false);
    // Always burn comparable time so unknown usernames can't be told apart by latency.
    if (!user) { verifyPassword(String(password || ''), 'pbkdf2$210000$x$x'); return null; }
    if (!verifyPassword(String(password || ''), user.passwordHash)) return null;
    let dirty = false;
    if (/^[a-f0-9]{64}$/i.test(user.passwordHash)) {
      if (LEGACY_HASHES.has(user.passwordHash)) user.mustChange = true;
      user.passwordHash = hashPassword(String(password)); user.updatedAt = new Date().toISOString(); dirty = true;
    }
    if (dirty) await putData(data);
    return user;
  });
}

/* ---------- sanitising ---------- */
const clip = (v, n) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, n);
const rid = prefix => `${prefix}${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`.toUpperCase();
function sanitizeRegistration(raw, now) {
  const entry = {};
  Object.keys(raw || {}).slice(0, 60).forEach(key => {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,40}$/.test(key) || ['__proto__', 'constructor', 'prototype'].includes(key)) return;
    const v = raw[key];
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') entry[key] = clip(v, /note|message|comment/i.test(key) ? 2000 : 300);
  });
  entry.name = clip(raw.name, 120);
  Object.assign(entry, {
    id: rid('R'), registrationDate: now, date: now, className: '', classId: '', status: 'New',
    interestStatus: 'pending', studentStatus: 'lead', paymentMethod: '', paymentStatus: 'unpaid', packId: '',
    paymentPlan: { total: 0, insurance: 0, classPrice: 0, showFee: 0, payments: [] },
    audit: [{ id: rid('A'), at: now, action: 'Registration created', detail: 'Public registration', actor: 'public' }]
  });
  delete entry.website; delete entry.notes;
  return entry;
}

/* ---------- admin data merge ---------- */
const idOf = x => (x && typeof x === 'object' ? String(x.id ?? '') : '');
/** Applies a client save on top of the stored document without losing concurrent public registrations. */
function mergeAdminSave(existing, incoming, known, role) {
  const next = { ...existing };
  const keys = role === 'admin' ? Object.keys(incoming).filter(k => !RESERVED.includes(k)) : MANAGER_KEYS.filter(k => k in incoming);
  keys.forEach(k => { next[k] = incoming[k]; });
  MERGE_KEYS.forEach(k => {
    const mine = Array.isArray(next[k]) ? next[k] : [], theirs = Array.isArray(existing[k]) ? existing[k] : [];
    const have = new Set(mine.map(idOf)); const knownIds = new Set(Array.isArray(known?.[k]) ? known[k].map(String) : []);
    // Rows that exist on the server, weren't part of the client's snapshot and are missing from its payload were added meanwhile.
    const added = theirs.filter(x => !have.has(idOf(x)) && !knownIds.has(idOf(x)));
    if (added.length) next[k] = [...added, ...mine];
  });
  if (Array.isArray(next.notifications)) next.notifications = next.notifications.slice(0, 200);
  next._rev = (Number(existing._rev) || 0) + 1;
  return next;
}

function responseError(res, err) {
  console.error('[Solid API]', err);
  const status = err?.status === 413 ? 413 : err?.status === 503 ? 503 : err instanceof SyntaxError ? 400 : 500;
  json(res, status, { ok: false, error: status === 413 ? 'Request too large.' : status === 503 ? 'The service is not configured yet.' : status === 400 ? 'Invalid request body.' : 'The server could not complete that operation.' });
}

async function handle(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const method = req.method;
    if (path === '/api/health') return json(res, 200, { ok: true, service: 'solid-dance-school', configured: !!(SERVICE_KEY || MEMORY_STORE) });
    if (method !== 'GET' && method !== 'HEAD' && !guardWrite(req, res)) return;

    if (path === '/api/session' && method === 'GET') {
      const s = readSession(req);
      if (!s) return json(res, 200, { ok: true, user: null });
      const data = await getData(); const u = (data._adminUsers || []).find(x => x.id === s.sub);
      if (!u || u.active === false) return json(res, 200, { ok: true, user: null });
      return json(res, 200, { ok: true, user: { username: u.username, role: u.role, mustChange: !!u.mustChange } });
    }
    if (path === '/api/login' && method === 'POST') {
      if (!SESSION_SECRET) return json(res, 503, { ok: false, error: 'The service is not configured yet.' });
      const body = await readBody(req); const ip = clientIp(req); const ukey = `${ip}|${String(body.username || '').toLowerCase().slice(0, 40)}`;
      if (failedLogins(ukey) >= 6 || failedLogins(ip) >= 20) return json(res, 429, { ok: false, error: 'Too many attempts. Try again in a few minutes.' });
      const user = await authUser(body.username, body.password);
      if (!user) { noteFailure(ukey); noteFailure(ip); await new Promise(r => setTimeout(r, 400)); return json(res, 401, { ok: false, error: 'Invalid username or password.' }); }
      clearFailures(ukey);
      setSession(req, res, user, user.mustChange);
      return json(res, 200, { ok: true, user: safeUser(user) });
    }
    if (path === '/api/logout' && method === 'POST') { clearSession(req, res); return json(res, 200, { ok: true }); }

    if (path === '/api/change-password' && method === 'POST') {
      const actor = await requireUser(req, res, { allowMustChange: true }); if (!actor) return;
      const body = await readBody(req); const current = String(body.currentPassword || ''), next = String(body.newPassword || '');
      const problem = passwordProblem(next); if (problem) return json(res, 400, { ok: false, error: problem });
      if (next === current) return json(res, 400, { ok: false, error: 'Choose a password different from the current one.' });
      if (!throttle('pw:' + actor.sub, 8, 15 * 60 * 1000)) return json(res, 429, { ok: false, error: 'Too many attempts. Try again later.' });
      return await withLock(async () => {
        const data = await ensureAdminSeed(await getData()); const u = (data._adminUsers || []).find(x => x.id === actor.sub);
        if (!u || !verifyPassword(current, u.passwordHash)) return json(res, 400, { ok: false, error: 'Current password is incorrect.' });
        u.passwordHash = hashPassword(next); u.mustChange = false; u.updatedAt = new Date().toISOString();
        await putData(data); setSession(req, res, u, false);
        return json(res, 200, { ok: true, user: safeUser(u) });
      });
    }

    if (path === '/api/data' && method === 'GET') {
      const data = await getData();
      if (url.searchParams.get('scope') === 'admin') {
        const actor = await requireUser(req, res); if (!actor) return;
        const copy = { ...data }; delete copy._adminUsers;
        return json(res, 200, { ok: true, data: copy, rev: Number(data._rev) || 0, role: actor.role });
      }
      return json(res, 200, { ok: true, data: publicData(data) }, { 'cache-control': 'public, max-age=0, s-maxage=15, stale-while-revalidate=60' });
    }
    if (path === '/api/data' && method === 'PUT') {
      const actor = await requireUser(req, res); if (!actor) return;
      const body = await readBody(req);
      if (!body.data || typeof body.data !== 'object' || Array.isArray(body.data)) return json(res, 400, { ok: false, error: 'Data must be an object.' });
      return await withLock(async () => {
        const existing = await getData(); const seeded = await ensureAdminSeed(existing);
        const next = mergeAdminSave(seeded, body.data, body.known, actor.role);
        await putData(next);
        const out = { ...next }; delete out._adminUsers;
        return json(res, 200, { ok: true, rev: next._rev, merged: { registrations: out.registrations, notifications: out.notifications } });
      });
    }

    if (path === '/api/public-registration' && method === 'POST') {
      const body = await readBody(req); const raw = body.entry;
      if (!raw || typeof raw !== 'object') return json(res, 400, { ok: false, error: 'Name and contact details are required.' });
      if (raw.website) return json(res, 200, { ok: true, duplicate: false }); // honeypot
      if (!throttle('reg:' + clientIp(req), 8, 60 * 60 * 1000)) return json(res, 429, { ok: false, error: 'Too many submissions. Please try again later.' });
      const now = new Date().toISOString(); const entry = sanitizeRegistration(raw, now);
      entry.email = clip(entry.email, 160).toLowerCase(); entry.phone = clip(entry.phone, 40);
      if (!entry.name || (!entry.email && !entry.phone)) return json(res, 400, { ok: false, error: 'Name and contact details are required.' });
      if (entry.email && !/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(entry.email)) return json(res, 400, { ok: false, error: 'Please enter a valid email address.' });
      return await withLock(async () => {
        const data = await getData(); data.registrations = Array.isArray(data.registrations) ? data.registrations : []; data.notifications = Array.isArray(data.notifications) ? data.notifications : [];
        if (data.registrations.length >= 5000) return json(res, 429, { ok: false, error: 'Registrations are temporarily closed.' });
        const duplicate = data.registrations.find(r => (entry.email && String(r.email || '').toLowerCase() === entry.email) || (entry.phone && r.phone === entry.phone));
        const note = (action, detail, r) => ({ id: rid('N'), at: now, actor: 'public', action, detail, studentId: r.id, studentName: r.name || entry.name, paymentStatus: r.paymentStatus || '' });
        if (duplicate) {
          duplicate.audit = Array.isArray(duplicate.audit) ? duplicate.audit : [];
          duplicate.audit.unshift({ id: rid('A'), at: now, action: 'Duplicate registration prevented', detail: 'Same email or phone', actor: 'public' });
          data.notifications.unshift(note('Duplicate registration prevented', 'Same email or phone', duplicate));
        } else {
          data.registrations.unshift(entry); data.notifications.unshift(note('New registration received', 'Public registration submitted', entry));
        }
        data.notifications = data.notifications.slice(0, 200);
        data._rev = (Number(data._rev) || 0) + 1;
        await putData(data);
        return json(res, 200, { ok: true, duplicate: !!duplicate });
      });
    }

    if (path === '/api/admin-users' && method === 'GET') {
      if (!await requireUser(req, res, { role: 'admin' })) return;
      const data = await ensureAdminSeed(await getData()); return json(res, 200, { ok: true, users: (data._adminUsers || []).map(safeUser) });
    }
    if (path === '/api/admin-users' && method === 'POST') {
      const actor = await requireUser(req, res, { role: 'admin' }); if (!actor) return;
      const body = await readBody(req); const username = String(body.username || '').trim(); const role = validateRole(body.role); const password = String(body.password || '');
      if (!validateUsername(username)) return json(res, 400, { ok: false, error: 'Use 3–32 letters, numbers, dots, dashes, or underscores.' });
      if (password) { const p = passwordProblem(password); if (p) return json(res, 400, { ok: false, error: p }); }
      return await withLock(async () => {
        const data = await ensureAdminSeed(await getData()); const users = data._adminUsers || []; const existing = users.find(x => x.id === body.id);
        if (users.some(x => x.username.toLowerCase() === username.toLowerCase() && x.id !== body.id)) return json(res, 409, { ok: false, error: 'That username is already in use.' });
        if (!existing && !password) return json(res, 400, { ok: false, error: 'A password is required for a new user.' });
        if (existing && existing.role === 'admin' && role !== 'admin' && users.filter(x => x.role === 'admin' && x.active !== false).length < 2) return json(res, 400, { ok: false, error: 'Keep at least one administrator account.' });
        const record = existing || { id: rid('U'), createdAt: new Date().toISOString() };
        record.username = username; record.role = role; record.active = true; record.updatedAt = new Date().toISOString();
        if (password) { record.passwordHash = hashPassword(password); record.mustChange = record.id !== actor.sub; }
        if (!existing) users.push(record);
        data._adminUsers = users; await putData(data);
        return json(res, 200, { ok: true, user: safeUser(record), users: users.map(safeUser) });
      });
    }
    const del = path.match(/^\/api\/admin-users\/([^/]+)$/);
    if (del && method === 'DELETE') {
      const actor = await requireUser(req, res, { role: 'admin' }); if (!actor) return;
      const id = decodeURIComponent(del[1]);
      return await withLock(async () => {
        const data = await ensureAdminSeed(await getData()); const users = data._adminUsers || []; const target = users.find(x => x.id === id);
        if (!target) return json(res, 404, { ok: false, error: 'User not found.' });
        if (target.id === actor.sub) return json(res, 400, { ok: false, error: 'You cannot remove the account currently in use.' });
        if (target.role === 'admin' && users.filter(x => x.role === 'admin' && x.active !== false).length < 2) return json(res, 400, { ok: false, error: 'Keep at least one administrator account.' });
        data._adminUsers = users.filter(x => x.id !== id); await putData(data);
        return json(res, 200, { ok: true, users: data._adminUsers.map(safeUser) });
      });
    }
    return json(res, 404, { ok: false, error: 'API route not found.' });
  } catch (err) { responseError(res, err); }
}

module.exports = handle;
module.exports.handle = handle;
module.exports._test = { mergeAdminSave, sanitizeRegistration };
