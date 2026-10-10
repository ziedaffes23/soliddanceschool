// Cloudflare Pages Function: runs the shared API core (api/_core.js) on Workers.
// Requires the `nodejs_compat` compatibility flag (set in wrangler.toml).
let core = null;

function toNodeReq(request, bodyText) {
  const headers = {};
  request.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
  const url = new URL(request.url);
  headers['x-forwarded-proto'] = headers['x-forwarded-proto'] || url.protocol.replace(':', '');
  headers['x-forwarded-for'] = headers['cf-connecting-ip'] || headers['x-forwarded-for'] || 'unknown';
  if (bodyText) headers['content-length'] = String(bodyText.length);
  return { method: request.method, url: url.pathname + url.search, headers, body: bodyText || undefined, socket: {} };
}

export async function onRequest({ request, env }) {
  // Expose Pages env vars/secrets to the shared core before it loads.
  if (!core) {
    globalThis.process = globalThis.process || { env: {} };
    process.env = process.env || {};
    for (const [k, v] of Object.entries(env || {})) if (typeof v === 'string') process.env[k] = v;
    core = require('../../api/_core.js');
  }
  const bodyText = ['GET', 'HEAD'].includes(request.method) ? '' : await request.text();
  const req = toNodeReq(request, bodyText);
  return new Promise(resolve => {
    const headers = new Headers();
    let status = 200;
    const res = {
      setHeader(k, v) { headers.append(k, v); },
      writeHead(code, h = {}) { status = code; Object.entries(h).forEach(([k, v]) => headers.set(k, v)); },
      end(body) { resolve(new Response(body ?? null, { status, headers })); }
    };
    Promise.resolve(core(req, res)).catch(() => resolve(new Response('{"ok":false}', { status: 500, headers: { 'content-type': 'application/json' } })));
  });
}
