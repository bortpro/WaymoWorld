// HUD: stats, leaderboard, kill feed, minimap, name tags, damage flash, keyboard + touch input.

import { G, OFFSET, CELL_SIZE, STREET_WIDTH, BLOCK_SIZE, GG_PARK_GZ, GG_PARK_GX_MAX, SHORE_X, clamp } from './shared.js';
import { sound } from './sound.js';

const $ = (id) => document.getElementById(id);

export function setConnStatus(text, color) {
    const el = $('conn-status');
    if (el) el.textContent = text;
    $('lb-online').style.setProperty('--dot', color);
}

export function addKillFeed(text, kind = '') {
    const feed = $('kill-feed');
    const item = document.createElement('div');
    item.className = 'feed-item ' + kind;
    item.textContent = text;
    feed.appendChild(item);
    setTimeout(() => item.remove(), 4200);
}

export function updateMyStats() {
    const me = G.roster.get(G.myId);
    $('score-val').textContent = me ? me.kills : 0;
    $('deaths-val').textContent = me ? me.deaths : 0;
}

export function renderLeaderboard() {
    const header = $('lb-online'), rows = $('lb-rows');
    if (!G.connected) {
        header.textContent = 'Connecting…';
        rows.replaceChildren();
        return;
    }
    const everyone = [...G.roster.values()];
    const n = everyone.filter(p => !p.bot).length, nBots = everyone.length - n;
    header.textContent = `${n} player${n === 1 ? '' : 's'} online` + (nBots ? ` · ${nBots} bots` : '');
    const sorted = everyone.sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
    const shown = sorted.slice(0, 10);
    const meIndex = sorted.findIndex(p => p.id === G.myId);
    if (meIndex >= 10) shown.push(sorted[meIndex]);
    rows.replaceChildren(...shown.map(p => {
        const row = document.createElement('div');
        row.className = 'lb-row' + (p.id === G.myId ? ' me' : '');
        const rank = document.createElement('span'); rank.className = 'rank'; rank.textContent = sorted.indexOf(p) + 1;
        const name = document.createElement('span'); name.className = 'name' + (p.bot ? ' bot' : ''); name.textContent = p.name;
        const kills = document.createElement('span'); kills.className = 'kills'; kills.textContent = p.kills;
        row.append(rank, name, kills);
        return row;
    }));
    if (!shown.length) {
        const empty = document.createElement('div');
        empty.className = 'lb-empty';
        empty.textContent = 'No one driving yet. Be the first!';
        rows.append(empty);
    }
}

export function damageFlash() {
    const f = $('damage-flash');
    f.style.opacity = 1;
    setTimeout(() => (f.style.opacity = 0), 160);
}

export function updateHUD() {
    const p = G.player;
    if (!p) return;
    $('speed-val').textContent = Math.floor(Math.abs(p.speed) * 1.4);
    const hp = Math.max(0, Math.floor(p.hp)), en = Math.max(0, Math.floor(p.energy));
    $('health-bar').style.width = hp + '%';
    $('hp-text').textContent = hp + '%';
    $('energy-bar').style.width = en + '%';
    $('en-text').textContent = en + '%';
    $('hud').classList.toggle('low-hp', hp <= 25);
}

// --- Name tags over remote cars ---------------------------------------------------------------

const tags = new Map();
export function removeTag(v) {
    tags.get(v)?.remove();
    tags.delete(v);
}
export function updateTags() {
    const cam = G.camera, engine = G.engine;
    const w = engine.getRenderWidth(), h = engine.getRenderHeight();
    const scale = (document.body.clientWidth || w) / w;
    const vp = cam.viewport.toGlobal(w, h);
    const tm = G.scene.getTransformMatrix();
    G.remoteVehicles.forEach(v => {
        let el = tags.get(v);
        if (!el) {
            el = document.createElement('div');
            el.className = 'name-tag' + (v.isBot ? ' bot' : '');
            el.innerHTML = '<span class="nt-name"></span><span class="nt-hp"><i></i></span>';
            $('tags').appendChild(el);
            tags.set(v, el);
        }
        const world = v.pos.add(new BABYLON.Vector3(0, 3.1, 0));
        const dist = BABYLON.Vector3.Distance(world, cam.position);
        const p = BABYLON.Vector3.Project(world, BABYLON.Matrix.IdentityReadOnly, tm, vp);
        const visible = v.visible && p.z > 0 && p.z < 1 && dist < 260;
        el.style.display = visible ? '' : 'none';
        if (!visible) return;
        el.style.transform = `translate(${p.x * scale}px, ${p.y * scale}px) translate(-50%, -100%) scale(${clamp(28 / dist, 0.55, 1.15)})`;
        el.firstChild.textContent = v.name;
        el.lastChild.firstChild.style.width = Math.max(0, v.hp) + '%';
        el.lastChild.firstChild.style.background = v.hp > 50 ? '#2fe38a' : v.hp > 25 ? '#ffcc33' : '#ff3b5c';
    });
}

// --- Minimap ---------------------------------------------------------------------------------

const MAP_X0 = -OFFSET, MAP_X1 = SHORE_X + 20, MAP_Z0 = -OFFSET, MAP_Z1 = OFFSET;
const MINIMAP_H = 200;
const MINIMAP_W = Math.round(MINIMAP_H * (MAP_X1 - MAP_X0) / (MAP_Z1 - MAP_Z0));
let minimapBase = null;
const mapX = (x) => (x - MAP_X0) / (MAP_X1 - MAP_X0) * MINIMAP_W;
const mapZ = (z) => (z - MAP_Z0) / (MAP_Z1 - MAP_Z0) * MINIMAP_H;

export function buildMinimapBase() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    const canvas = $('minimap');
    canvas.style.width = MINIMAP_W + 'px';
    canvas.style.height = MINIMAP_H + 'px';
    canvas.width = MINIMAP_W * dpr;
    canvas.height = MINIMAP_H * dpr;
    const base = document.createElement('canvas');
    base.width = canvas.width; base.height = canvas.height;
    const ctx = base.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.fillStyle = 'rgba(32, 38, 46, 0.92)';
    ctx.fillRect(0, 0, MINIMAP_W, MINIMAP_H);
    ctx.fillStyle = 'rgba(40, 92, 128, 0.9)';
    ctx.fillRect(mapX(SHORE_X), 0, MINIMAP_W - mapX(SHORE_X), MINIMAP_H);
    ctx.fillStyle = 'rgba(86, 140, 82, 0.8)';
    for (let gx = 0; gx <= GG_PARK_GX_MAX; gx++) {
        const x0 = -OFFSET + gx * CELL_SIZE + STREET_WIDTH, z0 = -OFFSET + GG_PARK_GZ * CELL_SIZE + STREET_WIDTH;
        ctx.fillRect(mapX(x0), mapZ(z0), mapX(x0 + BLOCK_SIZE) - mapX(x0), mapZ(z0 + BLOCK_SIZE) - mapZ(z0));
    }
    ctx.fillStyle = 'rgba(214, 206, 192, 0.55)';
    for (const b of G.buildings) ctx.fillRect(mapX(b.minX), mapZ(b.minZ), mapX(b.maxX) - mapX(b.minX), mapZ(b.maxZ) - mapZ(b.minZ));
    minimapBase = base;
}

export function drawMinimap() {
    const canvas = $('minimap');
    const ctx = canvas.getContext('2d');
    const dpr = canvas.width / MINIMAP_W;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, MINIMAP_W, MINIMAP_H);
    ctx.drawImage(minimapBase, 0, 0, MINIMAP_W, MINIMAP_H);
    ctx.font = '600 10px Inter, system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    G.remoteVehicles.forEach(v => {
        const x = mapX(v.pos.x), y = mapZ(v.pos.z);
        ctx.fillStyle = '#ff2d6f';
        ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
        const w = ctx.measureText(v.name).width;
        const onLeft = x + 6 + w > MINIMAP_W - 2;
        ctx.textAlign = onLeft ? 'right' : 'left';
        const tx = onLeft ? x - 6 : x + 6, ty = clamp(y, 7, MINIMAP_H - 7);
        ctx.strokeText(v.name, tx, ty);
        ctx.fillStyle = '#ffd6e2';
        ctx.fillText(v.name, tx, ty);
    });
    const p = G.player;
    ctx.save();
    ctx.translate(mapX(p.pos.x), mapZ(p.pos.z));
    ctx.rotate(Math.PI - p.angle);
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 5); ctx.lineTo(0, 2.5); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill();
    ctx.restore();
}

// --- Input -----------------------------------------------------------------------------------

export function setupInput(onCycleQuality) {
    const keys = G.keys;
    const handle = (e, down) => {
        if (down) sound.init();
        const c = e.code;
        if (c === 'KeyW' || c === 'ArrowUp') keys.w = down;
        if (c === 'KeyS' || c === 'ArrowDown') keys.s = down;
        if (c === 'KeyA' || c === 'ArrowLeft') keys.a = down;
        if (c === 'KeyD' || c === 'ArrowRight') keys.d = down;
        if (c === 'Space') keys.space = down;
        if (c === 'ShiftLeft' || c === 'ShiftRight') keys.shift = down;
        if (down && c === 'KeyG' && G.gameActive) onCycleQuality?.();
        if (G.gameActive && (c === 'Space' || c.startsWith('Arrow'))) e.preventDefault();
    };
    window.addEventListener('keydown', e => handle(e, true));
    window.addEventListener('keyup', e => handle(e, false));
    window.addEventListener('blur', () => Object.keys(keys).forEach(k => (keys[k] = false)));
    if (G.isTouch) setupTouchControls();
    else {
        window.addEventListener('mousedown', (e) => { if (e.target.closest('#overlay')) return; sound.init(); if (G.gameActive) keys.space = true; });
        window.addEventListener('mouseup', () => (keys.space = false));
    }
}

// Virtual joystick (left thumb) + Fire / Boost buttons (right thumb), one pointer per finger
function setupTouchControls() {
    const zone = $('joy-zone'), base = $('joy-base'), knob = $('joy-knob');
    const RADIUS = 55, DEADZONE = 0.12;
    let joyPointer = null, cx = 0, cy = 0;
    const moveKnob = (px, py) => {
        let dx = px - cx, dy = py - cy;
        const len = Math.hypot(dx, dy);
        if (len > RADIUS) { dx *= RADIUS / len; dy *= RADIUS / len; }
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
        const axis = (v) => {
            const a = Math.abs(v) / RADIUS;
            return a < DEADZONE ? 0 : Math.sign(v) * (a - DEADZONE) / (1 - DEADZONE);
        };
        G.joy.steer = -axis(dx);
        G.joy.throttle = -axis(dy);
    };
    const release = () => {
        joyPointer = null;
        G.joy.steer = G.joy.throttle = 0;
        knob.style.transform = '';
        base.style.left = base.style.top = base.style.bottom = '';
    };
    zone.addEventListener('pointerdown', e => {
        if (joyPointer !== null) return;
        e.preventDefault();
        sound.init();
        joyPointer = e.pointerId;
        zone.setPointerCapture(e.pointerId);
        const zr = zone.getBoundingClientRect(), half = base.offsetWidth / 2;
        base.style.left = (e.clientX - zr.left - half) + 'px';
        base.style.top = (e.clientY - zr.top - half) + 'px';
        base.style.bottom = 'auto';
        cx = e.clientX; cy = e.clientY;
        moveKnob(e.clientX, e.clientY);
    });
    zone.addEventListener('pointermove', e => { if (e.pointerId === joyPointer) moveKnob(e.clientX, e.clientY); });
    zone.addEventListener('pointerup', e => { if (e.pointerId === joyPointer) release(); });
    zone.addEventListener('pointercancel', e => { if (e.pointerId === joyPointer) release(); });
    const hold = (id, key) => {
        const btn = $(id);
        const set = (e, down) => {
            e.preventDefault();
            if (down) sound.init();
            G.keys[key] = down;
            btn.classList.toggle('active', down);
        };
        btn.addEventListener('pointerdown', e => { btn.setPointerCapture(e.pointerId); set(e, true); });
        btn.addEventListener('pointerup', e => set(e, false));
        btn.addEventListener('pointercancel', e => set(e, false));
    };
    hold('fire-btn', 'space');
    hold('boost-btn', 'shift');
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { release(); G.keys.space = G.keys.shift = false; }
    });
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('dblclick', e => e.preventDefault());
}
