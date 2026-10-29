import http from 'node:http';
import { readFileSync } from 'node:fs';
import { timingSafeEqual } from 'node:crypto';
import { WebSocketServer } from 'ws';
import { initDb, startPersistence, queueEvent, recordJoin, dailyUsers, dbStatus, closeDb, METRICS_TZ } from './db.js';

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
const CLIENT_ID_RE = /^[A-Za-z0-9-]{8,64}$/; // browser ID the client sends in `join`, for daily-user metrics
const DAU_DAYS_MAX = 365;

// Bots: server-driven cars that everyone sees, can shoot, and that show on the leaderboard
const BOT_NAMES = ['LASER-TAXI-1', 'LASER-TAXI-2', 'LASER-TAXI-3', 'LASER-TAXI-4', 'LASER-TAXI-5'];
const BOT_SPEED_MIN = 22;
const BOT_SPEED_MAX = 30;
const BOT_FIRE_MS = 1100;         // min time between a bot's shots
const BOT_FIRE_RANGE = 140;
const BOT_CHASE_RANGE = 450;      // bots steer toward the nearest human within this range
const BOT_CHASE_CHANCE = 0.7;     // ...at this fraction of intersections
const BOT_AIM_SPREAD = 2.0;       // random aim offset (units) so bots don't hit every shot

// City street grid (mirrors index.html: CELL_SIZE 100, STREET_WIDTH 30, OFFSET 600).
// Streets have no collision boxes, so bots drive intersection to intersection
// along street centerlines and never need to know where the buildings are.
const CELL_SIZE = 100;
const STREET_WIDTH = 30;
const OFFSET = 600;
const STREET_I = [1, 9];          // north-south streets x = -585 + 100i (i = 9 is x = 315, inside the shoreline)
const STREET_J = [1, 11];         // east-west streets   z = -585 + 100j
const streetX = (i) => -OFFSET + i * CELL_SIZE + STREET_WIDTH / 2;
const streetZ = (j) => -OFFSET + j * CELL_SIZE + STREET_WIDTH / 2;

// Must match getElevation() in index.html exactly: bot laser origins and aim depend on it.
function getElevation(x, z) {
  if (x > 450) return -8;
  let bayFactor = 1;
  if (x > 300) bayFactor = 1 - ((x - 300) / 150);
  let h = 0;
  h += (Math.sin(x * 0.008) * Math.cos(z * 0.008) + 1) * 25;
  const dist1 = Math.sqrt((x + 100) ** 2 + (z - 100) ** 2);
  h += Math.max(0, 60 - dist1 * 0.2);
  const dist2 = Math.sqrt((x - 100) ** 2 + (z + 200) ** 2);
  h += Math.max(0, 45 - dist2 * 0.15);
  return h * bayFactor;
}

const CONFIG = {
  TICK_MS, MAX_HP, LASER_DAMAGE, KILL_HEAL, SHOT_COOLDOWN_MS, SHOT_TTL_MS,
  MAX_HIT_RANGE, SPAWN_PROTECTION_MS, WORLD_LIMIT, NAME_MAX, EVENT_LOG_MAX,
  BOT_COUNT: BOT_NAMES.length, BOT_FIRE_MS, BOT_FIRE_RANGE, BOT_CHASE_RANGE, BOT_AIM_SPREAD,
};

// Counters, the event log, and nextId survive restarts when DATABASE_URL is set.
const restored = await initDb(process.env.DATABASE_URL, EVENT_LOG_MAX);

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
  botShots: 0,
  hitsAccepted: 0,
  hitsRejected: {},
  kills: 0,
  heartbeatTerminations: 0,
};
Object.assign(stats, restored.stats);
const events = restored.events; // ring buffer of recent notable events

function logEvent(kind, data = {}) {
  const event = { t: Date.now(), kind, ...data };
  events.push(event);
  queueEvent(event);
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
      bots: bots.length,
    },
    config: CONFIG,
    persistence: dbStatus(),
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
    players: allEntities().map((p) => ({
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
    res.end(JSON.stringify({ ok: true, clients: wss.clients.size, players: players.size, bots: bots.length }));
    return;
  }
  // The dashboard is served at / (and /debug, for old links)
  const isDashboard = url.pathname === '/' || url.pathname === '/debug';
  if (isDashboard || url.pathname === '/debug/state' || url.pathname === '/debug/dau') {
    if (!debugAllowed(req, url)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end(DEBUG_TOKEN ? 'Forbidden: bad or missing ?token=\n' : 'Forbidden: set DEBUG_TOKEN to enable the dashboard remotely\n');
      return;
    }
    if (isDashboard) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(debugPage);
    } else if (url.pathname === '/debug/dau') {
      const days = clamp(Math.floor(Number(url.searchParams.get('days')) || 30), 1, DAU_DAYS_MAX);
      dailyUsers(days).then(
        (rows) => {
          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          res.end(JSON.stringify({ tz: METRICS_TZ, days: rows }));
        },
        (err) => {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end(`dau query failed: ${err.message}\n`);
        },
      );
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

// Joined human players, keyed by socket. Connected-but-not-joined sockets
// (sitting on the start modal) still receive broadcasts so they can spectate.
const players = new Map();
// Server-driven bots. They share the player shape (plus `bot: true` and nav state)
// so snapshots, hits, kills, and the leaderboard treat them like anyone else.
const bots = [];
let nextId = restored.nextId ?? 1;

function allEntities() {
  return [...players.values(), ...bots];
}

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
  return { id: p.id, name: p.name, kills: p.kills, deaths: p.deaths, x: p.x, z: p.z, a: p.a, s: p.s, hp: p.hp, bot: !!p.bot };
}

function findEntity(id) {
  for (const p of players.values()) if (p.id === id) return p;
  return bots.find((b) => b.id === id) ?? null;
}

function cleanName(raw, id) {
  const name = String(raw ?? '')
    .replace(/[^\p{L}\p{N} _.\-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX);
  return name || `USER-${String(id % 100).padStart(2, '0')}`;
}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const round2 = (v) => Math.round(v * 100) / 100;
const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

function newEntity(name, extra = {}) {
  const now = Date.now();
  return {
    id: nextId++,
    name,
    kills: 0,
    deaths: 0,
    x: 0, z: 0, a: 0, s: 0,
    hp: MAX_HP,
    joinedAt: now,
    spawnedAt: now,
    lastShotAt: 0,
    lastStateAt: 0,
    shots: [], // timestamps of shots that haven't scored a hit yet
    ...extra,
  };
}

// Common hit path for human->human, human->bot, and bot->human hits, after validation.
// Spends one of the shooter's live shots; returns false (and logs why) if the hit is implausible.
function tryHit(shooter, target, now) {
  const reject = (reason) => {
    bump(stats.hitsRejected, reason);
    logEvent('hit-rejected', { reason, shooter: shooter.id, target: target.id });
    return false;
  };
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
    return true;
  }

  stats.kills++;
  shooter.kills++;
  target.deaths++;
  target.hp = MAX_HP;
  target.spawnedAt = now;
  shooter.hp = Math.min(MAX_HP, shooter.hp + KILL_HEAL);
  logEvent('kill', { killer: shooter.id, killerName: shooter.name, victim: target.id, victimName: target.name });
  // Human victims pick their own respawn point client-side; bots respawn here.
  if (target.bot) respawnBot(target);
  broadcast({
    type: 'kill',
    killer: shooter.id,
    victim: target.id,
    killerKills: shooter.kills,
    victimDeaths: target.deaths,
  });
  broadcast({ type: 'hp', id: shooter.id, hp: shooter.hp });
  return true;
}

const handlers = {
  join(ws, msg) {
    if (players.has(ws)) return;
    const p = newEntity('');
    p.name = cleanName(msg.name, p.id);
    players.set(ws, p);
    // DAU counts joins; uDAU counts distinct browsers (or IPs for clients that don't send an ID).
    recordJoin(typeof msg.cid === 'string' && CLIENT_ID_RE.test(msg.cid) ? msg.cid : `ip:${ws.meta.ip}`);
    console.log(`join #${p.id} "${p.name}", players: ${players.size}`);
    logEvent('join', { id: p.id, name: p.name });
    send(ws, { type: 'joined', id: p.id, name: p.name });
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

  // The shooter's client detects its own laser hitting someone (human or bot) and reports it.
  hit(ws, msg) {
    const shooter = players.get(ws);
    if (!shooter) return bump(stats.hitsRejected, 'not-joined');
    const target = findEntity(msg.target);
    if (!target || target === shooter) return bump(stats.hitsRejected, 'bad-target');
    tryHit(shooter, target, Date.now());
  },

  // Bots can't see lasers, so the victim's client reports a bot laser hitting its own car.
  botHit(ws, msg) {
    const victim = players.get(ws);
    if (!victim) return bump(stats.hitsRejected, 'not-joined');
    const bot = bots.find((b) => b.id === msg.bot);
    if (!bot) return bump(stats.hitsRejected, 'bad-target');
    tryHit(bot, victim, Date.now());
  },
};

// --- Bots ---
function headingOf(di, dj) {
  return Math.atan2(di, dj); // forward is (sin a, cos a) in (x, z)
}

function nodeInGrid(i, j) {
  return i >= STREET_I[0] && i <= STREET_I[1] && j >= STREET_J[0] && j <= STREET_J[1];
}

function respawnBot(bot) {
  bot.i = randInt(STREET_I[0], STREET_I[1]);
  bot.j = randInt(STREET_J[0], STREET_J[1]);
  bot.x = streetX(bot.i);
  bot.z = streetZ(bot.j);
  bot.di = 0;
  bot.dj = 0;
  bot.hp = MAX_HP;
  bot.spawnedAt = Date.now();
  chooseBotDirection(bot);
}

function nearestHuman(bot, range) {
  let best = null;
  let bestDist = range;
  for (const p of players.values()) {
    const d = Math.hypot(p.x - bot.x, p.z - bot.z);
    if (d < bestDist) { bestDist = d; best = p; }
  }
  return best;
}

// At an intersection: pick the next street segment. Mostly head toward the nearest
// human, otherwise wander; avoid U-turns unless it's the only way out.
function chooseBotDirection(bot) {
  const options = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([di, dj]) => nodeInGrid(bot.i + di, bot.j + dj));
  const forwardOptions = options.filter(([di, dj]) => !(di === -bot.di && dj === -bot.dj));
  const pool = forwardOptions.length ? forwardOptions : options;

  let choice = pool[Math.floor(Math.random() * pool.length)];
  const target = nearestHuman(bot, BOT_CHASE_RANGE);
  if (target && Math.random() < BOT_CHASE_CHANCE) {
    const rx = target.x - bot.x;
    const rz = target.z - bot.z;
    choice = pool.reduce((best, d) => (d[0] * rx + d[1] * rz > best[0] * rx + best[1] * rz ? d : best), pool[0]);
  }
  [bot.di, bot.dj] = choice;
  bot.a = headingOf(bot.di, bot.dj);
}

function moveBot(bot, dt) {
  let step = bot.speed * dt;
  // Walk along the grid, turning at each intersection reached this tick
  for (let guard = 0; guard < 4 && step > 0; guard++) {
    const tx = streetX(bot.i + bot.di);
    const tz = streetZ(bot.j + bot.dj);
    const remaining = Math.hypot(tx - bot.x, tz - bot.z);
    if (step < remaining) {
      bot.x += bot.di * step;
      bot.z += bot.dj * step;
      break;
    }
    bot.x = tx;
    bot.z = tz;
    bot.i += bot.di;
    bot.j += bot.dj;
    step -= remaining;
    chooseBotDirection(bot);
  }
  bot.s = bot.speed;
}

// Fire straight down the street the bot is driving on. Streets are building-free,
// so a target inside the same street corridor is in line of sight.
function botMaybeShoot(bot, now) {
  if (now - bot.lastShotAt < bot.fireMs) return;
  if (now - bot.spawnedAt < SPAWN_PROTECTION_MS) return;
  let target = null;
  let bestDist = BOT_FIRE_RANGE;
  for (const p of players.values()) {
    if (now - p.spawnedAt < SPAWN_PROTECTION_MS) continue;
    const rx = p.x - bot.x;
    const rz = p.z - bot.z;
    const along = rx * bot.di + rz * bot.dj;
    const perp = Math.abs(rx * bot.dj - rz * bot.di);
    if (along > 6 && along < bestDist && perp < STREET_WIDTH / 2) {
      bestDist = along;
      target = p;
    }
  }
  if (!target) return;

  const origin = [bot.x, getElevation(bot.x, bot.z) + 2.02, bot.z];
  const aimX = target.x + (Math.random() * 2 - 1) * BOT_AIM_SPREAD;
  const aimZ = target.z + (Math.random() * 2 - 1) * BOT_AIM_SPREAD;
  const aim = [aimX, getElevation(target.x, target.z) + 1.0, aimZ];
  const d = aim.map((v, k) => v - origin[k]);
  const len = Math.hypot(...d);
  if (len < 1e-6) return;

  bot.lastShotAt = now;
  bot.fireMs = BOT_FIRE_MS + Math.random() * 500;
  bot.shots = bot.shots.filter((t) => now - t < SHOT_TTL_MS);
  bot.shots.push(now);
  stats.botShots++;
  broadcast({ type: 'shoot', id: bot.id, p: origin.map(round2), d: d.map((v) => round2(v / len)) });
}

function updateBots(dt) {
  const now = Date.now();
  for (const bot of bots) {
    moveBot(bot, dt);
    botMaybeShoot(bot, now);
  }
}

for (const name of BOT_NAMES) {
  const bot = newEntity(name, {
    bot: true,
    speed: BOT_SPEED_MIN + Math.random() * (BOT_SPEED_MAX - BOT_SPEED_MIN),
    fireMs: BOT_FIRE_MS,
    i: 0, j: 0, di: 0, dj: 0,
  });
  respawnBot(bot);
  bots.push(bot);
}

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

  send(ws, { type: 'welcome', players: allEntities().map(publicPlayer) });

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

// Simulate bots and broadcast every player's and bot's latest state.
// Skipped while nobody is connected, so idle bots cost nothing.
let lastTickAt = Date.now();
const tick = setInterval(() => {
  const now = Date.now();
  const dt = Math.min((now - lastTickAt) / 1000, 0.25);
  lastTickAt = now;
  if (wss.clients.size === 0) return;
  updateBots(dt);
  const snap = [];
  for (const p of allEntities()) {
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

startPersistence(() => ({ stats, nextId }));

server.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT} (ws at /ws, dashboard at /)`);
});

function shutdown() {
  console.log('shutting down');
  wss.close();
  // Save the last few seconds of events and counters before exiting.
  const flushed = closeDb().catch((err) => console.error('final db flush failed:', err.message));
  server.close(() => flushed.then(() => process.exit(0)));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
