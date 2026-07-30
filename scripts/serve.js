'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const publicRoot = path.resolve(__dirname, '..', 'out', 'html');
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || process.argv[2] || 8000);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.tsv': 'text/tab-separated-values; charset=utf-8',
  '.wav': 'audio/wav',
  '.webp': 'image/webp',
};

function sendError(response, statusCode, message) {
  response.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
  });
  response.end(message + '\n');
}

function resolveRequestPath(requestUrl) {
  let pathname;

  try {
    pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  } catch (_error) {
    return null;
  }

  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = path.resolve(publicRoot, relativePath);

  if (filePath !== publicRoot && !filePath.startsWith(publicRoot + path.sep)) {
    return null;
  }

  return filePath;
}

function serveFile(filePath, response) {
  fs.stat(filePath, function(error, stats) {
    if (error || !stats.isFile()) {
      sendError(response, 404, 'Not found');
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      'Cache-Control': 'no-cache',
      'Content-Type': contentTypes[extension] || 'application/octet-stream',
    });

    const stream = fs.createReadStream(filePath);
    stream.on('error', function() {
      if (!response.headersSent) {
        sendError(response, 500, 'Could not read file');
      } else {
        response.destroy();
      }
    });
    stream.pipe(response);
  });
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT must be an integer between 1 and 65535.');
  process.exit(1);
}

if (!fs.existsSync(path.join(publicRoot, 'index.html'))) {
  console.error('out/html/index.html is missing. Run npm run build first.');
  process.exit(1);
}

const server = http.createServer(function(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendError(response, 405, 'Method not allowed');
    return;
  }

  const filePath = resolveRequestPath(request.url);
  if (!filePath) {
    sendError(response, 400, 'Invalid path');
    return;
  }

  if (request.method === 'HEAD') {
    fs.stat(filePath, function(error, stats) {
      if (error || !stats.isFile()) {
        sendError(response, 404, 'Not found');
        return;
      }
      response.writeHead(200, {
        'Cache-Control': 'no-cache',
        'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] ||
          'application/octet-stream',
      });
      response.end();
    });
    return;
  }

  serveFile(filePath, response);
});

server.listen(port, host, function() {
  console.log('DSS Poland is available at http://' + host + ':' + port + '/');
  console.log('Press Ctrl+C to stop the server.');
});
