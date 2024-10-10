import http from 'http';
import https from 'https';
import { createServer } from 'http';

// Function to proxy HTTP requests
function proxyRequest(req, res) {
    const targetHost = req.headers['host'];
    const targetPort = req.url.startsWith('https') ? 443 : 80;

    const options = {
        hostname: targetHost,
        port: targetPort,
        path: req.url,
        method: req.method,
        headers: req.headers,
    };

    const proxyReq = (targetPort === 443 ? https : http).request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
        console.error('Proxy request error:', err);
        res.writeHead(500);
        res.end('Internal server error');
    });

    req.pipe(proxyReq, { end: true });
}

// Create and start the server
const server = createServer((req, res) => {
    console.log(`Proxying request: ${req.url}`);
    proxyRequest(req, res);
});

const PORT = 8080; 
server.listen(PORT, () => {
    console.log(`Bun proxy server is running on http://localhost:${PORT}`);
});