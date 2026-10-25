import http from 'node:http';
import { readFileSync } from 'node:fs';
import { timingSafeEqual } from 'node:crypto';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT) || 8080;
// Required to view /debug from anywhere but localhost (set it on Render).
const DEBUG_TOKEN = process.env.DEBUG_TOKEN || '';

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
const EVENT_LOG_MAX = 200;

const CONFIG = {
  TICK_MS, MAX_HP, LASER_DAMAGE, KILL_HEAL, SHOT_COOLDOWN_MS, SHOT_TTL_MS,
  MAX_HIT_RANGE, SPAWN_PROTECTION_MS, WORLD_LIMIT, NAME_MAX, EVENT_LOG_MAX,
};

// --- Debug instrumentation ---
const startedAt = Date.now();
const stats = {
  connectionsTotal: 0,
  msgsIn: 0,
  bytesIn: 0,
  msgsOut: 0,
  bytesOut: 0,
  msgsInByType: {},
  invalidJson: 0,
  unknownType: 0,
  snapsSent: 0,
  shotsAccepted: 0,
  shotsRejected: {},
  hitsAccepted: 0,
  hitsRejected: {},
  kills: 0,
  heartbeatTerminations: 0,
};
const events = []; // ring buffer of recent notable events

function logEvent(kind, data = {}) {
  events.push({ t: Date.now(), kind, ...data });
  if (events.length > EVENT_LOG_MAX) events.shift();
}

function bump(counter, key) {
  counter[key] = (counter[key] || 0) + 1;
}

const debugPage = readFileSync(new URL('./debug.html', import.meta.url));

function isLocalRequest(req) {
  const addr = req.socket.remoteAddress;
  return !req.headers['x-forwarded-for'] && (addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1');
}

function debugAllowed(req, url) {
  if (!DEBUG_TOKEN) return isLocalRequest(req);
  const given = Buffer.from(url.searchParams.get('token') || '');
  const expected = Buffer.from(DEBUG_TOKEN);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

function debugState() {
  const now = Date.now();
  return {
    now,
    server: {
      startedAt,
      uptimeS: Math.round((now - startedAt) / 1000),
      node: process.version,
      pid: process.pid,
      memory: process.memoryUsage(),
      nextId,
      wsClients: wss.clients.size,
      players: players.size,
    },
    config: CONFIG,
    stats,
    connections: [...wss.clients].map((ws) => ({
      ip: ws.meta.ip,
      userAgent: ws.meta.userAgent,
      connectedAt: ws.meta.connectedAt,
      playerId: players.get(ws)?.id ?? null,
      readyState: ws.readyState,
      isAlive: ws.isAlive,
      bufferedAmount: ws.bufferedAmount,
      msgsIn: ws.meta.msgsIn,
      bytesIn: ws.meta.bytesIn,
      lastMsgAt: ws.meta.lastMsgAt,
      lastMsgType: ws.meta.lastMsgType,
    })),
    players: [...players.values()].map((p) => ({
      ...p,
      spawnProtected: now - p.spawnedAt < SPAWN_PROTECTION_MS,
      liveShots: p.shots.filter((t) => now - t < SHOT_TTL_MS).length,
    })),
    events,
  };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, clients: wss.clients.size, players: players.size }));
    return;
  }
  if (url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WaymoWorld server. Connect via WebSocket at /ws\n');
    return;
  }
  if (url.pathname === '/debug' || url.pathname === '/debug/state') {
    if (!debugAllowed(req, url)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end(DEBUG_TOKEN ? 'Forbidden: bad or missing ?token=\n' : 'Forbidden: set DEBUG_TOKEN to enable /debug remotely\n');
      return;
    }
    if (url.pathname === '/debug') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(debugPage);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(debugState()));
    }
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

function sendRaw(ws, payload) {
  ws.send(payload);
  stats.msgsOut++;
  stats.bytesOut += payload.length;
}

function send(ws, data) {
  if (ws.readyState === ws.OPEN) sendRaw(ws, JSON.stringify(data));
}

function broadcast(data, except = null) {
  const payload = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client !== except && client.readyState === client.OPEN) sendRaw(client, payload);
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
      joinedAt: Date.now(),
      spawnedAt: Date.now(),
      lastShotAt: 0,
      lastStateAt: 0,
      shots: [], // timestamps of shots that haven't scored a hit yet
    };
    players.set(ws, p);
    console.log(`join #${id} "${p.name}", players: ${players.size}`);
    logEvent('join', { id, name: p.name });
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
    p.lastStateAt = Date.now();
  },

  shoot(ws, msg) {
    const p = players.get(ws);
    if (!p) return bump(stats.shotsRejected, 'not-joined');
    if (!Array.isArray(msg.p) || !Array.isArray(msg.d)) return bump(stats.shotsRejected, 'malformed');
    const pos = msg.p.slice(0, 3);
    const dir = msg.d.slice(0, 3);
    if (pos.length !== 3 || dir.length !== 3 || !pos.every(isNum) || !dir.every(isNum)) {
      return bump(stats.shotsRejected, 'malformed');
    }
    const now = Date.now();
    if (now - p.lastShotAt < SHOT_COOLDOWN_MS) return bump(stats.shotsRejected, 'cooldown');
    p.lastShotAt = now;
    p.shots = p.shots.filter((t) => now - t < SHOT_TTL_MS);
    p.shots.push(now);
    stats.shotsAccepted++;
    broadcast({ type: 'shoot', id: p.id, p: pos.map(round2), d: dir.map(round2) }, ws);
  },

  // The shooter's client detects its own laser hitting someone and reports it.
  // The server checks it's plausible and owns the resulting HP / kill state.
  hit(ws, msg) {
    const shooter = players.get(ws);
    const reject = (reason) => {
      bump(stats.hitsRejected, reason);
      logEvent('hit-rejected', { reason, shooter: shooter?.id ?? null, target: msg.target ?? null });
    };
    if (!shooter) return reject('not-joined');
    const target = findPlayer(msg.target);
    if (!target || target === shooter) return reject('bad-target');

    const now = Date.now();
    shooter.shots = shooter.shots.filter((t) => now - t < SHOT_TTL_MS);
    if (shooter.shots.length === 0) return reject('no-unspent-shot');
    shooter.shots.shift();

    const dist = Math.hypot(target.x - shooter.x, target.z - shooter.z);
    if (dist > MAX_HIT_RANGE) return reject('out-of-range');
    if (now - target.spawnedAt < SPAWN_PROTECTION_MS) return reject('spawn-protected');

    stats.hitsAccepted++;
    target.hp -= LASER_DAMAGE;
    logEvent('hit', { shooter: shooter.id, target: target.id, hp: Math.max(0, target.hp), dist: Math.round(dist) });
    if (target.hp > 0) {
      broadcast({ type: 'hp', id: target.id, hp: target.hp, by: shooter.id });
      return;
    }

    stats.kills++;
    shooter.kills++;
    target.deaths++;
    target.hp = MAX_HP;
    target.spawnedAt = now;
    shooter.hp = Math.min(MAX_HP, shooter.hp + KILL_HEAL);
    logEvent('kill', { killer: shooter.id, killerName: shooter.name, victim: target.id, victimName: target.name });
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
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  ws.meta = {
    ip,
    userAgent: req.headers['user-agent'] || '',
    connectedAt: Date.now(),
    msgsIn: 0,
    bytesIn: 0,
    lastMsgAt: null,
    lastMsgType: null,
  };
  stats.connectionsTotal++;
  logEvent('connect', { ip });
  console.log(`client connected (${ip}), total: ${wss.clients.size}`);
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  send(ws, { type: 'welcome', players: [...players.values()].map(publicPlayer) });

  ws.on('message', (raw) => {
    stats.msgsIn++;
    stats.bytesIn += raw.length;
    ws.meta.msgsIn++;
    ws.meta.bytesIn += raw.length;
    ws.meta.lastMsgAt = Date.now();

    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      stats.invalidJson++;
      ws.meta.lastMsgType = '(invalid json)';
      send(ws, { type: 'error', error: 'invalid JSON' });
      return;
    }
    const type = msg?.type;
    ws.meta.lastMsgType = String(type);
    const handler = typeof type === 'string' && Object.hasOwn(handlers, type) ? handlers[type] : null;
    if (!handler) {
      stats.unknownType++;
      return;
    }
    bump(stats.msgsInByType, type);
    handler(ws, msg);
  });

  ws.on('close', (code) => {
    const p = players.get(ws);
    if (p) {
      players.delete(ws);
      broadcast({ type: 'leave', id: p.id });
      logEvent('leave', { id: p.id, name: p.name });
      console.log(`leave #${p.id} "${p.name}", players: ${players.size}`);
    }
    logEvent('disconnect', { ip, code });
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
  stats.snapsSent++;
  broadcast({ type: 'snap', p: snap });
}, TICK_MS);

// Drop connections that stop responding to pings.
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) {
      stats.heartbeatTerminations++;
      logEvent('heartbeat-timeout', { ip: ws.meta.ip });
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
  console.log(`listening on http://localhost:${PORT} (ws at /ws, dashboard at /debug)`);
});

function shutdown() {
  console.log('shutting down');
  wss.close();
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
