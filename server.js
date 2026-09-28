/**
 * Servidor estático local ultra-ligero para Windows / AsTeRICS Grid PWA
 * No requiere librerías externas obligatorias (utiliza los módulos nativos de Node.js).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 9095;
const HOST = '0.0.0.0';
const ROOT_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf',
    '.txt': 'text/plain; charset=utf-8',
    '.grd': 'application/json; charset=utf-8',
    '.pdf': 'application/pdf'
};

const server = http.createServer((req, res) => {
    // Añadir cabeceras de seguridad y CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
        return;
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(req.url, `http://${HOST}:${PORT}`);
    } catch (e) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Bad Request');
        return;
    }

    let safePath = decodeURIComponent(parsedUrl.pathname);
    if (safePath === '/' || safePath === '') {
        safePath = '/index.html';
    }

    let filePath = path.join(ROOT_DIR, safePath);

    // Evitar ataques de Directory Traversal
    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Si el archivo no existe, intentar fallback a index.html para rutas SPA
            const fallbackPath = path.join(ROOT_DIR, 'index.html');
            fs.readFile(fallbackPath, (fallbackErr, data) => {
                if (fallbackErr) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Not Found');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(data);
                }
            });
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stats.size,
            'Cache-Control': 'no-cache'
        });

        if (req.method === 'HEAD') {
            res.end();
            return;
        }

        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
    });
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`[INFO] El puerto ${PORT} ya esta en uso. La aplicacion reutilizara la instancia activa.`);
        process.exit(0);
    } else {
        console.error('Error del servidor:', err);
    }
});

server.listen(PORT, HOST, () => {
    const url = `http://${HOST}:${PORT}/`;
    console.log('=====================================================');
    console.log('  AsTeRICS Grid PWA - Servidor Local Windows');
    console.log(`  Acceso local: ${url}`);
    console.log('=====================================================');
    console.log('Presiona Ctrl + C en esta ventana para detener el servidor.');
});

