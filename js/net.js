// Multiplayer client (see README "Message protocol").

import { G, getElevation } from './shared.js';
import { sound } from './sound.js';

const SERVER_URL = new URLSearchParams(location.search).get('server') ||
    (['localhost', '127.0.0.1', ''].includes(location.hostname)
        ? 'ws://localhost:8080/ws'
        : 'wss://waymoworld-server.onrender.com/ws');

// Anonymous per-browser ID so the server can count unique daily players
const CLIENT_ID = (() => {
    try {
        let id = localStorage.getItem('sflasertaxi-cid');
        if (!id) {
            id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
            localStorage.setItem('sflasertaxi-cid', id);
        }
        return id;
    } catch { return null; }
})();

let ws = null;
let hooks = null;   // UI / game callbacks provided by main.js

export function netSend(msg) {
    if (G.connected && G.myId !== null && ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

export function sendJoin() {
    if (G.connected && ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'join', name: G.myName, cid: CLIENT_ID }));
}

export function sendState() {
    const p = G.player;
    if (!G.gameActive || !p) return;
    netSend({ type: 'state', x: +p.pos.x.toFixed(2), z: +p.pos.z.toFixed(2), a: +p.angle.toFixed(3), s: +p.speed.toFixed(2) });
}

export function connect(h) {
    hooks = h || hooks;
    hooks.status('Connecting to server… (can take ~30 s if it was asleep)', '#e0b400');
    hooks.roster();
    try { ws = new WebSocket(SERVER_URL); } catch { return; }

    ws.onopen = () => {
        G.connected = true;
        hooks.status('Connected', '#2fe38a');
        if (G.gameActive) sendJoin();
    };
    ws.onmessage = (e) => {
        let msg;
        try { msg = JSON.parse(e.data); } catch { return; }
        handlers[msg.type]?.(msg);
    };
    ws.onclose = () => {
        const was = G.connected;
        G.connected = false;
        G.myId = null;
        clearRoster();
        hooks.status('Disconnected. Retrying…', '#ff3b5c');
        if (was) hooks.feed('Lost connection to server. Reconnecting…');
        setTimeout(() => connect(), 2000);
    };
}

function addRosterPlayer(p) {
    if (G.roster.has(p.id)) return G.roster.get(p.id);
    const entry = { id: p.id, name: p.name, kills: p.kills, deaths: p.deaths, bot: !!p.bot, vehicle: null };
    if (p.id !== G.myId) {
        const v = hooks.makeRemote(p);
        v.id = p.id;
        v.isBot = !!p.bot;
        v.angle = p.a;
        v.pos.set(p.x, getElevation(p.x, p.z), p.z);
        v.applySnapshot(p.x, p.z, p.a, p.s);
        v.setHp(p.hp);
        entry.vehicle = v;
        G.remoteVehicles.add(v);
    }
    G.roster.set(p.id, entry);
    return entry;
}

function removeRosterPlayer(id) {
    const entry = G.roster.get(id);
    if (!entry) return;
    if (entry.vehicle) {
        hooks.removeRemote(entry.vehicle);
        entry.vehicle.destroy();
        G.remoteVehicles.delete(entry.vehicle);
    }
    G.roster.delete(id);
}

function clearRoster() {
    [...G.roster.keys()].forEach(removeRosterPlayer);
    hooks.roster();
}

const handlers = {
    welcome(msg) {
        clearRoster();
        msg.players.forEach(addRosterPlayer);
        hooks.roster();
    },
    joined(msg) {
        G.myId = msg.id;
        G.myName = msg.name;
        hooks.stats();
        hooks.roster();
    },
    join(msg) {
        const entry = addRosterPlayer(msg.player);
        if (entry.vehicle) {
            entry.vehicle.spawnTime = G.time;
            if (G.gameActive) hooks.feed(`${entry.name} joined the fleet`);
        }
        hooks.roster();
    },
    leave(msg) {
        removeRosterPlayer(msg.id);
        hooks.roster();
    },
    snap(msg) {
        for (const [id, x, z, a, s, hp] of msg.p) {
            if (id === G.myId) { if (G.player) G.player.hp = hp; continue; }
            const v = G.roster.get(id)?.vehicle;
            if (!v) continue;
            v.applySnapshot(x, z, a, s);
            if (v.hp !== hp) v.setHp(hp);
        }
    },
    shoot(msg) {
        const v = G.roster.get(msg.id)?.vehicle;
        if (!v) return;
        hooks.remoteShot(v, msg.p, msg.d);
    },
    hp(msg) {
        if (msg.id === G.myId) {
            const tookDamage = msg.hp < G.player.hp;
            G.player.hp = msg.hp;
            if (tookDamage) hooks.damaged();
            return;
        }
        const v = G.roster.get(msg.id)?.vehicle;
        if (!v) return;
        if (msg.hp < v.hp) hooks.remoteDamaged(v);
        v.setHp(msg.hp);
    },
    kill(msg) {
        const killer = G.roster.get(msg.killer), victim = G.roster.get(msg.victim);
        if (killer) killer.kills = msg.killerKills;
        if (victim) victim.deaths = msg.victimDeaths;
        const victimVehicle = msg.victim === G.myId ? G.player : victim?.vehicle;
        if (victimVehicle && (G.gameActive || victimVehicle !== G.player)) hooks.boom(victimVehicle);

        const killerName = killer?.name ?? 'Someone', victimName = victim?.name ?? 'someone';
        if (msg.victim === G.myId) {
            hooks.feed(`SYSTEM FAILURE: ${killerName} tagged you out!`, 'bad');
            G.player.respawn();
        } else if (msg.killer === G.myId) {
            hooks.feed(`You tagged ${victimName}!`, 'good');
        } else if (G.gameActive) {
            hooks.feed(`${killerName} tagged ${victimName}`);
        }
        if (victim?.vehicle) victim.vehicle.spawnTime = G.time;
        hooks.stats();
        hooks.roster();
    },
};

export { sound };
