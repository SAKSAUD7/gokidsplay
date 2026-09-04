const spawn = require('child_process').spawn;
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT) || 8080;
const NEXT_PORT = PORT + 1;

console.log('Starting proxy on port ' + PORT);
console.log('Next.js will run on port ' + NEXT_PORT);

const server = http.createServer(function (req, res) {
    if (req.url.indexOf('/_next/static/') === 0) {
        const filePath = path.join(__dirname, req.url);
        fs.readFile(filePath, function (err, data) {
            if (err) {
                proxyToNext(req, res);
            } else {
                const ext = path.extname(filePath);
                const contentType = ext === '.css' ? 'text/css' : ext === '.js' ? 'application/javascript' : 'application/octet-stream';
                res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000, immutable' });
                res.end(data);
            }
        });
    } else if (req.url.indexOf('/_next/') !== 0 && req.url !== '/') {
        const filePath = path.join(__dirname, 'public', req.url);
        fs.readFile(filePath, function (err, data) {
            if (err) {
                proxyToNext(req, res);
            } else {
                res.writeHead(200);
                res.end(data);
            }
        });
    } else {
        proxyToNext(req, res);
    }
});

function proxyToNext(req, res) {
    const proxyReq = http.request({
        hostname: 'localhost',
        port: NEXT_PORT,
        path: req.url,
        method: req.method,
        headers: req.headers
    }, function (proxyRes) {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });
    proxyReq.on('error', function (err) {
        console.error('Proxy error:', err.message);
        res.writeHead(500);
        res.end('Proxy Error: ' + err.message);
    });
    req.pipe(proxyReq);
}

server.listen(PORT, '0.0.0.0', function () {
    console.log('Proxy server running on port ' + PORT);
});

const nextServerPath = path.join(__dirname, '.next/standalone/frontend');
console.log('Starting Next.js from:', nextServerPath);

const nextServer = spawn('node', ['server.js'], {
    env: Object.assign({}, process.env, { PORT: NEXT_PORT }),
    stdio: ['ignore', 'inherit', 'inherit'],
    cwd: nextServerPath
});

nextServer.on('error', function (err) {
    console.error('Next.js startup error:', err);
    process.exit(1);
});

nextServer.on('exit', function (code) {
    console.log('Next.js exited with code ' + code);
    if (code !== 0) {
        process.exit(code);
    }
});
