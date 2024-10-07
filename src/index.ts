import { createServer, request } from 'http';
import { connect } from 'net';
import { URL } from 'url';

const PORT = 8080;

const server = createServer((clientReq, clientRes) => {
  // Parse the request URL
  const url = new URL(clientReq.url || '', `http://${clientReq.headers.host}`);

  const options = {
    hostname: url.hostname,
    port: parseInt(url.port) || 80,
    path: url.pathname + url.search,
    method: clientReq.method,
    headers: clientReq.headers,
  };

  // Forward the request to the target server
  const proxyReq = request(options, (proxyRes) => {
    // Write headers and status code from the proxy response
    clientRes.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
    // Pipe the response data
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy Request Error:', err);
    clientRes.writeHead(500);
    clientRes.end('Internal Server Error');
  });

  // Pipe the client request data to the proxy request
  clientReq.pipe(proxyReq, { end: true });
});

// Handle HTTPS CONNECT method
server.on('connect', (req, clientSocket, head) => {
  const { port, hostname } = new URL(`http://${req.url}`);

  // Establish a connection to the target server
  const serverSocket = connect(Number(port) || 443, hostname, () => {
    // Inform the client that the connection is established
    clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    // Pipe the data between client and server
    serverSocket.write(head);
    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);
  });

  serverSocket.on('error', (err) => {
    console.error('Server Socket Error:', err);
    clientSocket.end();
  });
});

server.listen(PORT, () => {
  console.log(`Proxy server is running on port ${PORT}`);
});
