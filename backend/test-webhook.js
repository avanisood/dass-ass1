const http = require('http');
const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    console.log('--- Received Webhook ---');
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);
    console.log('Body:', body);
    res.writeHead(204);
    res.end();
  });
});
server.listen(5001, () => {
  console.log('Webhook server listening on port 5001');
});
