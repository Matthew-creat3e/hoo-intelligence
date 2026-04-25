/**
 * HOO demo static server
 * Serves the demos/ folder so relative image paths resolve correctly.
 *
 * RUN: node demos/serve.js
 * THEN open: http://localhost:8765/hoo-front-header-v1.html
 */
const http = require('http');
const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = 8765;
const MIME = {
  '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'application/javascript',
  '.json':'application/json', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png',
  '.webp':'image/webp', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.txt':'text/plain',
  '.woff':'font/woff', '.woff2':'font/woff2',
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/hoo-front-header-v1.html';
  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }

  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('not found: ' + urlPath); }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream',
                         'Cache-Control': 'no-store' });
    fs.createReadStream(filePath).pipe(res);
  });
}).listen(PORT, () => {
  console.log('HOO demo server running:');
  console.log('  http://localhost:' + PORT + '/hoo-front-header-v1.html');
  console.log('Press Ctrl+C to stop.');
});
