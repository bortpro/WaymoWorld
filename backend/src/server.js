import http from 'node:http';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT) || 8080;

// Game tuning (keep in sync with index.html)
const TICK_MS = 50;               // 20 Hz snapshots
const MAX_HP = 100;
const LASER_DAMAGE = 25;
const KILL_HEAL = 25;
const SHOT_COOLDOWN_MS = 150;     // client fires at most every 250 ms; leave slack for jitter
const SHOT_TTL_MS = 2000;         // a shot can score a hit for this long (laser life is 1 s)
const MAX_HIT_RANGE = 320;        // laser travels 250 units in its 1 s life, plus latency slack
const SPAWN_PROTECTION_MS = 2000;
const WORLD_LIMIT = 700;
const NAME_MAX = 16;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, clients: wss.clients.size, players: players.size }));
    return;
  }
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WaymoWorld server. Connect via WebSocket at /ws\n');
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 4 * 1024 });

// Joined players only, keyed by socket. Connected-but-not-joined sockets
// (sitting on the start modal) still receive broadcasts so they can spectate.
const players = new Map();
let nextId = 1;

function send(ws, data) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(data));
}

function broadcast(data) {
  const payload = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(payload);
  }
}

function publicPlayer(p) {
  return { id: p.id, name: p.name, kills: p.kills, deaths: p.deaths, x: p.x, z: p.z, a: p.a, s: p.s, hp: p.hp };
}

function findPlayer(id) {
  for (const p of players.values()) if (p.id === id) return p;
  return null;
}

function cleanName(raw, id) {
  const name = String(raw ?? '')
    .replace(/[^\p{L}\p{N} _.\-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX);
  return name || `Waymo${id}`;
}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const round2 = (v) => Math.round(v * 100) / 100;

const handlers = {
  join(ws, msg) {
    if (players.has(ws)) return;
    const id = nextId++;
    const p = {
      id,
      name: cleanName(msg.name, id),
      kills: 0,
      deaths: 0,
      x: 0, z: 0, a: 0, s: 0,
      hp: MAX_HP,
      spawnedAt: Date.now(),
      lastShotAt: 0,
      shots: [], // timestamps of shots that haven't scored a hit yet
    };
    players.set(ws, p);
    console.log(`join #${id} "${p.name}", players: ${players.size}`);
    send(ws, { type: 'joined', id, name: p.name });
    broadcast({ type: 'join', player: publicPlayer(p) });
  },

  state(ws, msg) {
    const p = players.get(ws);
    if (!p || !isNum(msg.x) || !isNum(msg.z) || !isNum(msg.a) || !isNum(msg.s)) return;
    p.x = clamp(msg.x, -WORLD_LIMIT, WORLD_LIMIT);
    p.z = clamp(msg.z, -WORLD_LIMIT, WORLD_LIMIT);
    p.a = msg.a;
    p.s = clamp(msg.s, -200, 200);
  },

  shoot(ws, msg) {
    const p = players.get(ws);
    if (!p || !Array.isArray(msg.p) || !Array.isArray(msg.d)) return;
    const pos = msg.p.slice(0, 3);
    const dir = msg.d.slice(0, 3);
    if (pos.length !== 3 || dir.length !== 3 || !pos.every(isNum) || !dir.every(isNum)) return;
    const now = Date.now();
    if (now - p.lastShotAt < SHOT_COOLDOWN_MS) return;
    p.lastShotAt = now;
    p.shots = p.shots.filter((t) => now - t < SHOT_TTL_MS);
    p.shots.push(now);
    const payload = JSON.stringify({ type: 'shoot', id: p.id, p: pos.map(round2), d: dir.map(round2) });
    for (const client of wss.clients) {
      if (client !== ws && client.readyState === client.OPEN) client.send(payload);
    }
  },

  // The shooter's client detects its own laser hitting someone and reports it.
  // The server checks it's plausible and owns the resulting HP / kill state.
  hit(ws, msg) {
    const shooter = players.get(ws);
    if (!shooter) return;
    const target = findPlayer(msg.target);
    if (!target || target === shooter) return;

    const now = Date.now();
    shooter.shots = shooter.shots.filter((t) => now - t < SHOT_TTL_MS);
    if (shooter.shots.length === 0) return; // more hits than shots fired
    shooter.shots.shift();

    if (Math.hypot(target.x - shooter.x, target.z - shooter.z) > MAX_HIT_RANGE) return;
    if (now - target.spawnedAt < SPAWN_PROTECTION_MS) return;

    target.hp -= LASER_DAMAGE;
    if (target.hp > 0) {
      broadcast({ type: 'hp', id: target.id, hp: target.hp, by: shooter.id });
      return;
    }

    shooter.kills++;
    target.deaths++;
    target.hp = MAX_HP;
    target.spawnedAt = now;
    shooter.hp = Math.min(MAX_HP, shooter.hp + KILL_HEAL);
    broadcast({
      type: 'kill',
      killer: shooter.id,
      victim: target.id,
      killerKills: shooter.kills,
      victimDeaths: target.deaths,
    });
    broadcast({ type: 'hp', id: shooter.id, hp: shooter.hp });
  },
};

wss.on('connection', (ws, req) => {
  console.log(`client connected (${req.socket.remoteAddress}), total: ${wss.clients.size}`);
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  send(ws, { type: 'welcome', players: [...players.values()].map(publicPlayer) });

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      send(ws, { type: 'error', error: 'invalid JSON' });
      return;
    }
    const handler = msg && handlers[msg.type];
    if (handler) handler(ws, msg);
  });

  ws.on('close', () => {
    const p = players.get(ws);
    if (p) {
      players.delete(ws);
      broadcast({ type: 'leave', id: p.id });
      console.log(`leave #${p.id} "${p.name}", players: ${players.size}`);
    }
    console.log(`client disconnected, total: ${wss.clients.size}`);
  });
});

// Broadcast every joined player's latest state.
const tick = setInterval(() => {
  if (players.size === 0) return;
  const snap = [];
  for (const p of players.values()) {
    snap.push([p.id, round2(p.x), round2(p.z), round2(p.a), round2(p.s), p.hp]);
  }
  broadcast({ type: 'snap', p: snap });
}, TICK_MS);

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

wss.on('close', () => {
  clearInterval(heartbeat);
  clearInterval(tick);
});

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
