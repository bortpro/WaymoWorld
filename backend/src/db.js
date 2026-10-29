// Postgres persistence for counters, the event log, and daily-user metrics.
// With no DATABASE_URL (local dev) everything stays in memory, as before.
import pg from 'pg';

export const METRICS_TZ = 'America/Los_Angeles'; // DAU days roll over at local midnight
const EVENT_FLUSH_MS = 2000;
const STATS_SAVE_MS = 10_000;
const EVENT_RETENTION_DAYS = 30;
const EVENT_QUEUE_MAX = 5000;    // drop the oldest unsaved events past this while the DB is down

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS server_stats (
    id int PRIMARY KEY,
    stats jsonb NOT NULL,
    next_id int NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS events (
    id bigserial PRIMARY KEY,
    t timestamptz NOT NULL,
    kind text NOT NULL,
    data jsonb NOT NULL
  );
  CREATE INDEX IF NOT EXISTS events_t_idx ON events (t);
  CREATE TABLE IF NOT EXISTS daily_users (
    day date NOT NULL,
    uid text NOT NULL,
    joins int NOT NULL DEFAULT 1,
    PRIMARY KEY (day, uid)
  );
`;

let pool = null;
let eventQueue = [];
let timers = [];
let getSnapshot = null; // () => ({ stats, nextId }), supplied by the server
const memDaily = new Map(); // day -> Map(uid -> joins), used only without a DB
const status = { enabled: false, connected: false, lastFlushAt: null, lastError: null, lastErrorAt: null, droppedEvents: 0 };

function fail(where, err) {
  status.lastError = `${where}: ${err.message}`;
  status.lastErrorAt = Date.now();
  console.error(`db ${where} failed:`, err.message);
}

function localDay(t = Date.now()) {
  return new Date(t).toLocaleDateString('en-CA', { timeZone: METRICS_TZ }); // YYYY-MM-DD
}

// Connects, creates tables, and returns what was saved last run:
// { stats, nextId, events } (all null/empty when there's no DB or it's unreachable).
export async function initDb(url, eventLimit) {
  const restored = { stats: null, nextId: null, events: [] };
  if (!url) {
    console.log('DATABASE_URL not set: metrics and events are in memory only');
    return restored;
  }
  status.enabled = true;
  // Render's external hostnames require TLS; internal ones don't.
  const ssl = /\.render\.com(:|\/)/.test(url) ? { rejectUnauthorized: false } : undefined;
  const p = new pg.Pool({ connectionString: url, ssl, max: 4 });
  p.on('error', (err) => fail('pool', err));
  try {
    await p.query(SCHEMA);
    const { rows: [saved] } = await p.query('SELECT stats, next_id FROM server_stats WHERE id = 1');
    if (saved) {
      restored.stats = saved.stats;
      restored.nextId = saved.next_id;
    }
    const { rows } = await p.query(
      'SELECT t, kind, data FROM (SELECT * FROM events ORDER BY id DESC LIMIT $1) e ORDER BY id',
      [eventLimit],
    );
    restored.events = rows.map((r) => ({ t: r.t.getTime(), kind: r.kind, ...r.data }));
  } catch (err) {
    // Don't run against a half-working DB: periodic saves would overwrite the
    // real totals with this run's fresh counters.
    fail('init', err);
    await p.end().catch(() => {});
    return restored;
  }
  pool = p;
  status.connected = true;
  console.log(`db connected, restored ${restored.events.length} events, nextId ${restored.nextId ?? '(none)'}`);
  return restored;
}

// Starts the periodic flush/save/prune loops. `snapshot` returns { stats, nextId }.
export function startPersistence(snapshot) {
  getSnapshot = snapshot;
  if (!pool) return;
  timers = [
    setInterval(flushEvents, EVENT_FLUSH_MS),
    setInterval(saveStats, STATS_SAVE_MS),
    setInterval(pruneEvents, 3600_000),
  ];
  pruneEvents();
}

export function queueEvent(event) {
  if (!pool) return;
  eventQueue.push(event);
  if (eventQueue.length > EVENT_QUEUE_MAX) {
    status.droppedEvents += eventQueue.length - EVENT_QUEUE_MAX;
    eventQueue = eventQueue.slice(-EVENT_QUEUE_MAX);
  }
}

async function flushEvents() {
  if (!pool || eventQueue.length === 0) return;
  const batch = eventQueue;
  eventQueue = [];
  const ts = [], kinds = [], datas = [];
  for (const { t, kind, ...data } of batch) {
    ts.push(t);
    kinds.push(kind);
    datas.push(JSON.stringify(data));
  }
  try {
    await pool.query(
      `INSERT INTO events (t, kind, data)
       SELECT to_timestamp(t / 1000.0), kind, data FROM unnest($1::float8[], $2::text[], $3::jsonb[]) AS x(t, kind, data)`,
      [ts, kinds, datas],
    );
    status.lastFlushAt = Date.now();
  } catch (err) {
    fail('flushEvents', err);
    eventQueue = batch.concat(eventQueue); // retry next flush
  }
}

async function saveStats() {
  if (!pool || !getSnapshot) return;
  const { stats, nextId } = getSnapshot();
  try {
    await pool.query(
      `INSERT INTO server_stats (id, stats, next_id, updated_at) VALUES (1, $1, $2, now())
       ON CONFLICT (id) DO UPDATE SET stats = EXCLUDED.stats, next_id = EXCLUDED.next_id, updated_at = now()`,
      [JSON.stringify(stats), nextId],
    );
  } catch (err) {
    fail('saveStats', err);
  }
}

async function pruneEvents() {
  try {
    await pool.query(`DELETE FROM events WHERE t < now() - make_interval(days => $1)`, [EVENT_RETENTION_DAYS]);
  } catch (err) {
    fail('pruneEvents', err);
  }
}

// One join by `uid` (a browser ID, or "ip:<addr>" when the client didn't send one).
export async function recordJoin(uid) {
  if (!pool) {
    const day = localDay();
    if (!memDaily.has(day)) memDaily.set(day, new Map());
    const users = memDaily.get(day);
    users.set(uid, (users.get(uid) || 0) + 1);
    return;
  }
  try {
    await pool.query(
      `INSERT INTO daily_users (day, uid) VALUES ((now() AT TIME ZONE $1)::date, $2)
       ON CONFLICT (day, uid) DO UPDATE SET joins = daily_users.joins + 1`,
      [METRICS_TZ, uid],
    );
  } catch (err) {
    fail('recordJoin', err);
  }
}

// The last `days` days (oldest first, today last, zero-filled):
// [{ day: 'YYYY-MM-DD', dau: joins, udau: unique players }]
export async function dailyUsers(days) {
  if (!pool) {
    const out = [];
    for (let k = days - 1; k >= 0; k--) {
      const day = localDay(Date.now() - k * 86_400_000);
      const users = memDaily.get(day) ?? new Map();
      out.push({ day, dau: [...users.values()].reduce((a, b) => a + b, 0), udau: users.size });
    }
    return out;
  }
  const { rows } = await pool.query(
    `WITH today AS (SELECT (now() AT TIME ZONE $1)::date AS d)
     SELECT to_char(s.d, 'YYYY-MM-DD') AS day,
            coalesce(sum(u.joins), 0)::int AS dau,
            count(u.uid)::int AS udau
     FROM today, generate_series(today.d - ($2::int - 1), today.d, interval '1 day') AS s(d)
     LEFT JOIN daily_users u ON u.day = s.d::date
     GROUP BY s.d ORDER BY s.d`,
    [METRICS_TZ, days],
  );
  return rows;
}

export function dbStatus() {
  return { ...status, queuedEvents: eventQueue.length };
}

// Final flush on shutdown.
export async function closeDb() {
  if (!pool) return;
  timers.forEach(clearInterval);
  await flushEvents();
  await saveStats();
  await pool.end().catch(() => {});
  pool = null;
}
