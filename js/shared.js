// World contract shared with the server (backend/src/server.js).
// The street grid, elevation function and seeded city RNG must stay identical so this client can
// join the same multiplayer server: bots drive the same streets and laser/building collisions agree.

export const WORLD_SIZE = 1200;
export const GRID_STEPS = 12;
export const BLOCK_SIZE = 70;
export const STREET_WIDTH = 30;
export const CELL_SIZE = BLOCK_SIZE + STREET_WIDTH; // 100
export const OFFSET = (GRID_STEPS * CELL_SIZE) / 2;  // 600
export const SHORE_X = 395;                          // cars can't drive past the eastern shoreline
export const WATER_Y = -2.2;

// Golden Gate Park: a strip of grid cells on the west side (gx 0-3) in row gz 4
export const GG_PARK_GZ = 4;
export const GG_PARK_GX_MAX = 3;
export function isGoldenGatePark(gx, gz) {
    return gz === GG_PARK_GZ && gx >= 0 && gx <= GG_PARK_GX_MAX;
}
export function isDowntown(gx, gz) {
    return gx >= 6 && gz >= 4 && gz <= 8;
}

export const SPAWN_PROTECTION = 2.0;
export const STATE_SEND_MS = 50;

export function mulberry32(seed) {
    return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// SF hills. Must match getElevation() in backend/src/server.js exactly (multiplayer contract)
export function getElevation(x, z) {
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

export function getTerrainNormal(x, z) {
    const d = 1.0;
    const hL = getElevation(x - d, z), hR = getElevation(x + d, z);
    const hD = getElevation(x, z - d), hU = getElevation(x, z + d);
    return new BABYLON.Vector3(hL - hR, 2.0 * d, hD - hU).normalize();
}

export function normalizeAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
}

// True when (x, z) is on a street or intersection (props must stay on sidewalks)
export function isInsideRoadway(x, z, margin = 1.2) {
    const relX = ((x + OFFSET) % CELL_SIZE + CELL_SIZE) % CELL_SIZE;
    const relZ = ((z + OFFSET) % CELL_SIZE + CELL_SIZE) % CELL_SIZE;
    return relX < STREET_WIDTH + margin || relX > CELL_SIZE - margin ||
           relZ < STREET_WIDTH + margin || relZ > CELL_SIZE - margin;
}

export function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
export function lerp(a, b, t) { return a + (b - a) * t; }

// Mutable game state shared between modules
export const G = {
    engine: null,
    scene: null,
    camera: null,
    shadows: null,        // CascadedShadowGenerator
    glow: null,           // GlowLayer
    quality: 'high',
    player: null,
    buildings: [],        // collision AABBs {minX,maxX,minZ,maxZ,maxY}, same order/values as the original three.js game
    obstacles: [],        // local-only AABBs (parked cars): block our car and our lasers
    lasers: [],
    remoteVehicles: new Set(),
    roster: new Map(),    // id -> { id, name, kills, deaths, bot, vehicle }
    myId: null,
    myName: '',
    gameActive: false,
    connected: false,
    time: 0,              // seconds since start (replaces THREE.Clock)
    keys: { w: false, a: false, s: false, d: false, space: false, shift: false },
    joy: { throttle: 0, steer: 0 },
    isTouch: false,
};
