import http from 'node:http';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT) || 8080;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, clients: wss.clients.size }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server, path: '/ws' });

function broadcast(data, except) {
  const payload = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client !== except && client.readyState === client.OPEN) {
      client.send(payload);
    }
  }
}

wss.on('connection', (ws, req) => {
  console.log(`client connected (${req.socket.remoteAddress}), total: ${wss.clients.size}`);
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.send(JSON.stringify({ type: 'welcome' }));

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      ws.send(JSON.stringify({ type: 'error', error: 'invalid JSON' }));
      return;
    }
    // Default behavior: relay messages to every other client.
    broadcast(msg, ws);
  });

  ws.on('close', () => {
    console.log(`client disconnected, total: ${wss.clients.size}`);
  });
});

// Drop connections that stop responding to pings.
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) {
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    ws.ping();
  }
}, 30_000);

wss.on('close', () => clearInterval(heartbeat));

server.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT} (ws at /ws)`);
});

function shutdown() {
  console.log('shutting down');
  wss.close();
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
