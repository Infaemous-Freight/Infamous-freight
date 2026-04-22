const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 3000);
const distDir = path.join(__dirname, 'apps', 'web', 'dist');

const sendFile = (res, filePath, contentType = 'text/html') => {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
};

const mime = {
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

http
  .createServer((req, res) => {
    const pathname = new URL(req.url || '/', 'http://localhost').pathname;

    if (pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    const rawPath = pathname !== '/' ? pathname : '/index.html';
    const safePath = path.normalize(rawPath).replace(/^(\.\.[/\\])+/, '');
    const relativeSafePath = safePath.replace(/^[/\\]+/, '');
    const distDirResolved = path.resolve(distDir);
    const filePath = path.resolve(distDirResolved, relativeSafePath);
    const ext = path.extname(filePath).toLowerCase();

    if (filePath !== distDirResolved && !filePath.startsWith(distDirResolved + path.sep)) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Bad request');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isFile()) {
        sendFile(res, filePath, mime[ext] || 'application/octet-stream');
        return;
      }
      sendFile(res, path.join(distDir, 'index.html'));
    });
  })
  .listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
  });
