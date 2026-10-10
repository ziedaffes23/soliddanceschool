const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const handleApi = require('./api/_core.js');
function text(res, status, body, headers = {}) { res.writeHead(status, headers); res.end(body); }
function responseError(res, err) { console.error('[Solid]', err); res.writeHead(500, { 'content-type': 'application/json' }); res.end('{"ok":false}'); }

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
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res);
    if (req.method !== 'GET' && req.method !== 'HEAD') return text(res, 405, 'Method not allowed');
    return staticFile(url.pathname, res);
  } catch (err) { responseError(res, err); }
});
server.listen(PORT, '0.0.0.0', () => console.log(`Solid Dance School server listening on ${PORT}`));
