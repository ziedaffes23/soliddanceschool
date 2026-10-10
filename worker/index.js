// Cloudflare Worker entry: /api/* → shared API core (api/_core.js), everything else → static assets (dist/).
let corePromise = null;

async function loadCore(env) {
  if (!corePromise) {
    globalThis.process = globalThis.process || { env: {} };
    process.env = process.env || {};
    for (const [k, v] of Object.entries(env || {})) if (typeof v === 'string') process.env[k] = v;
    corePromise = import('../api/_core.js').then(m => m.default || m);
  }
  return corePromise;
}

function toNodeReq(request, bodyText) {
  const headers = {};
  request.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
  const url = new URL(request.url);
  headers['x-forwarded-proto'] = url.protocol.replace(':', '');
  headers['x-forwarded-for'] = headers['cf-connecting-ip'] || headers['x-forwarded-for'] || 'unknown';
  if (bodyText) headers['content-length'] = String(new TextEncoder().encode(bodyText).length);
  return { method: request.method, url: url.pathname + url.search, headers, body: bodyText || undefined, socket: {} };
}

async function handleApi(request, env) {
  const core = await loadCore(env);
  const bodyText = ['GET', 'HEAD'].includes(request.method) ? '' : await request.text();
  const req = toNodeReq(request, bodyText);
  return new Promise(resolve => {
    const headers = new Headers(); let status = 200;
    const res = {
      setHeader(k, v) { headers.append(k, v); },
      writeHead(code, h = {}) { status = code; Object.entries(h).forEach(([k, v]) => headers.set(k, v)); },
      end(body) { resolve(new Response(body ?? null, { status, headers })); }
    };
    Promise.resolve(core(req, res)).catch(() => resolve(new Response('{"ok":false}', { status: 500, headers: { 'content-type': 'application/json' } })));
  });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api' || pathname.startsWith('/api/')) return handleApi(request, env);
    return env.ASSETS.fetch(request);
  }
};

// Kept so redeploying over the previous worker never deletes its legacy Durable Object class (and its stored data).
export class SolidDataStore { constructor(state) { this.state = state; } async fetch() { return new Response('legacy', { status: 410 }); } }
