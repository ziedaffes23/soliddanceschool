// Copies only the public site into dist/ for Cloudflare Pages (server code stays out).
const fs = require('node:fs'), path = require('node:path');
const root = path.join(__dirname, '..'), out = path.join(root, 'dist');
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out);
const entries = ['admin', 'assets', 'css', 'js'];
fs.readdirSync(root).filter(f => /\.html$/.test(f) || ['manifest.json', 'robots.txt', 'sitemap.xml', '_headers'].includes(f)).forEach(f => entries.push(f));
entries.forEach(e => { if (fs.existsSync(path.join(root, e))) fs.cpSync(path.join(root, e), path.join(out, e), { recursive: true }); });
fs.appendFileSync(path.join(out, '_headers'), '\n/api/*\n  Cache-Control: no-store\n/js/*\n  Cache-Control: public, max-age=0, must-revalidate\n/css/*\n  Cache-Control: public, max-age=0, must-revalidate\n');
console.log('dist ready:', fs.readdirSync(out).length, 'entries');
