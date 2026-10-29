// Gameplay: vehicles, lasers, effects. Physics, tuning and network behaviour are ported 1:1 from
// the live game so this client plays identically and interoperates on the same server.

import {
    G, OFFSET, CELL_SIZE, STREET_WIDTH, SHORE_X, SPAWN_PROTECTION,
    getElevation, getTerrainNormal, normalizeAngle, clamp,
} from './shared.js';
import { createTaxi } from './car.js';
import { netSend } from './net.js';
import { sound } from './sound.js';
import { radialCanvas } from './materials.js';

const V = (x, y, z) => new BABYLON.Vector3(x, y, z);
const PLAYER_ACCENT = '#00e5ff', ENEMY_ACCENT = '#ff2d6f';

let templates = null;
function taxiTemplate(isPlayer) {
    if (!templates) templates = {};
    const key = isPlayer ? 'player' : 'enemy';
    if (!templates[key]) {
        const t = createTaxi(G.scene, { accentHex: isPlayer ? PLAYER_ACCENT : ENEMY_ACCENT, name: 'taxiTemplate_' + key });
        t.root.setEnabled(false);
        templates[key] = t;
    }
    return templates[key];
}

// Clone a template taxi (geometry shared) and wire up the animated parts
function spawnTaxiMesh(isPlayer) {
    const t = taxiTemplate(isPlayer);
    const root = t.root.clone((isPlayer ? 'player' : 'remote') + 'Taxi', null);
    root.setEnabled(true);
    const find = (name) => root.getChildTransformNodes(false).filter(n => n.name.endsWith(name));
    const steers = find('steer');
    const wheels = steers.map((s, i) => ({ steer: s, spin: s.getChildTransformNodes(true)[0], front: t.wheels[i].front, side: t.wheels[i].side }));
    const turret = find('turret')[0] || null;
    const meshes = root.getChildMeshes(false).filter(m => !m.name.endsWith('contactShadow'));
    for (const m of meshes) {
        G.shadows?.addShadowCaster(m);
        // body carries the emissive lights / accent ring, lidarHead the spinning accent
        if (m.name.endsWith('Body') || m.name.endsWith('lidarHead')) G.glow?.addIncludedOnlyMesh(m);
    }
    return { root, wheels, turret, meshes };
}

export class Vehicle {
    constructor(x, z, isPlayer = false, name = '') {
        this.isPlayer = isPlayer;
        this.isRemote = !isPlayer;
        this.car = spawnTaxiMesh(isPlayer);
        this.root = this.car.root;
        this.root.rotationQuaternion = BABYLON.Quaternion.Identity();

        this.pos = V(x, getElevation(x, z), z);
        this.speed = 0;
        this.angle = Math.random() * Math.PI * 2;
        this.steerVis = 0;

        this.maxSpeed = 72;
        this.accel = 64;
        this.handling = 2.85;

        this.hp = 100;
        this.energy = 100;
        this.lastShot = 0;
        this.spawnTime = -Infinity;
        this.boosting = false;

        if (this.isRemote) {
            this.net = { x, z, a: this.angle, s: 0, t: performance.now() };
            this.name = name;
        }
    }

    get visible() { return this.root.isEnabled(); }
    set visible(v) { this.root.setEnabled(v); }

    update(dt) {
        if (this.isRemote) this.updateRemote(dt);
        else this.updateLocal(dt);

        this.pos.y = getElevation(this.pos.x, this.pos.z);
        this.root.position.copyFrom(this.pos);

        // Align to the hill: right = normal x forward (matches the live game's basis)
        const forward = V(Math.sin(this.angle), 0, Math.cos(this.angle));
        const normal = getTerrainNormal(this.pos.x, this.pos.z);
        const projForward = forward.subtract(normal.scale(BABYLON.Vector3.Dot(forward, normal))).normalize();
        const right = BABYLON.Vector3.Cross(normal, projForward).normalize();
        const m = BABYLON.Matrix.Identity();
        BABYLON.Matrix.FromXYZAxesToRef(right, normal, projForward, m);
        const target = BABYLON.Quaternion.FromRotationMatrix(m);
        BABYLON.Quaternion.SlerpToRef(this.root.rotationQuaternion, target, Math.min(1, 15 * dt), this.root.rotationQuaternion);

        // Wheels roll with speed; fronts steer toward the input
        const steerTarget = this.isPlayer ? this.steerInput * 0.42 : 0;
        this.steerVis += (steerTarget - this.steerVis) * Math.min(1, 10 * dt);
        for (const w of this.car.wheels) {
            w.spin.rotation.x += w.side * this.speed / 0.375 * dt;
            if (w.front) w.steer.rotation.y = this.steerVis;
        }
        if (this.car.turret) this.car.turret.rotation.y += 12 * dt;

        // Spawn protection: blink
        const shielded = G.time - this.spawnTime < SPAWN_PROTECTION;
        const blinkOff = shielded && Math.floor(G.time * 10) % 2 === 0;
        for (const mesh of this.car.meshes) mesh.visibility = blinkOff ? 0.35 : 1;
    }

    get steerInput() {
        const k = G.keys, j = G.joy;
        return clamp((k.a ? 1 : 0) - (k.d ? 1 : 0) + j.steer, -1, 1);
    }

    moveWithSlidingCollision(dt) {
        const vx = Math.sin(this.angle) * this.speed * dt;
        const vz = Math.cos(this.angle) * this.speed * dt;
        const minBound = -OFFSET + 12, maxBoundX = SHORE_X, maxBoundZ = OFFSET - 12;
        const tryX = clamp(this.pos.x + vx, minBound, maxBoundX);
        const tryZ = clamp(this.pos.z + vz, minBound, maxBoundZ);

        if (!this.checkBuildingCollision(tryX, tryZ)) {
            this.pos.x = tryX; this.pos.z = tryZ;
        } else if (!this.checkBuildingCollision(tryX, this.pos.z)) {
            this.pos.x = tryX;
            this.speed *= 0.92;
            const targetA = vx >= 0 ? Math.PI / 2 : -Math.PI / 2;
            this.angle += normalizeAngle(targetA - this.angle) * 4 * dt;
        } else if (!this.checkBuildingCollision(this.pos.x, tryZ)) {
            this.pos.z = tryZ;
            this.speed *= 0.92;
            const targetA = vz >= 0 ? 0 : Math.PI;
            this.angle += normalizeAngle(targetA - this.angle) * 4 * dt;
        } else {
            this.speed *= -0.35;
        }
        this.resolveOverlap();
    }

    resolveOverlap() {
        const r = 2.85;
        const push = (b, rad) => {
            if (this.pos.x + rad > b.minX && this.pos.x - rad < b.maxX && this.pos.z + rad > b.minZ && this.pos.z - rad < b.maxZ) {
                const dLeft = (this.pos.x + rad) - b.minX, dRight = b.maxX - (this.pos.x - rad);
                const dDown = (this.pos.z + rad) - b.minZ, dUp = b.maxZ - (this.pos.z - rad);
                const minD = Math.min(dLeft, dRight, dDown, dUp);
                if (minD === dLeft) this.pos.x = b.minX - rad - 0.08;
                else if (minD === dRight) this.pos.x = b.maxX + rad + 0.08;
                else if (minD === dDown) this.pos.z = b.minZ - rad - 0.08;
                else this.pos.z = b.maxZ + rad + 0.08;
                return true;
            }
            return false;
        };
        for (const b of G.buildings) push(b, r);
        for (const b of G.obstacles) if (push(b, 1.3)) this.speed *= 0.6;
    }

    updateLocal(dt) {
        this.energy = Math.min(100, this.energy + 28 * dt);
        this.handlePlayerInput(dt);
        this.speed *= Math.pow(0.45, dt);
        this.moveWithSlidingCollision(dt);
    }

    updateRemote(dt) {
        const n = this.net;
        if (performance.now() - n.t < 250) {
            n.x += Math.sin(n.a) * n.s * dt;
            n.z += Math.cos(n.a) * n.s * dt;
        }
        const dx = n.x - this.pos.x, dz = n.z - this.pos.z;
        if (dx * dx + dz * dz > 40 * 40) {
            this.pos.x = n.x; this.pos.z = n.z; this.angle = n.a;
        } else {
            const k = 1 - Math.exp(-12 * dt);
            this.pos.x += dx * k;
            this.pos.z += dz * k;
            this.angle += normalizeAngle(n.a - this.angle) * k;
        }
        this.speed = n.s;
    }

    applySnapshot(x, z, a, s) {
        Object.assign(this.net, { x, z, a, s, t: performance.now() });
    }

    setHp(hp) { this.hp = hp; }

    handlePlayerInput(dt) {
        const keys = G.keys;
        const currentMax = keys.shift && this.energy > 5 ? this.maxSpeed * 1.38 : this.maxSpeed;
        this.boosting = keys.shift && Math.abs(this.speed) > 8 && this.energy > 5;
        if (this.boosting) {
            this.energy = Math.max(0, this.energy - 28 * dt);
            if (Math.random() > 0.55) {
                const back = this.pos.add(V(-Math.sin(this.angle) * 2.5, 0.5, -Math.cos(this.angle) * 2.5));
                burst(back, PLAYER_ACCENT, 3, 3, { life: 0.35, size: 0.35 });
            }
        }
        const throttle = clamp((keys.w ? 1 : 0) - (keys.s ? 1 : 0) + G.joy.throttle, -1, 1);
        const steer = this.steerInput;
        this.speed += this.accel * throttle * dt;
        this.speed = clamp(this.speed, -currentMax * 0.55, currentMax);
        if (Math.abs(this.speed) > 0.1 || throttle !== 0) {
            const dir = this.speed >= -0.2 ? 1 : -1;
            const turnFactor = Math.max(0.45, Math.min(1, Math.abs(this.speed) / 8));
            this.angle += this.handling * dt * dir * turnFactor * steer;
        }
        if (keys.space) this.shoot();
        sound.updateEngine(this.speed / this.maxSpeed);
    }

    checkBuildingCollision(x, z) {
        const r = 2.75;
        for (const b of G.buildings) {
            if (x + r > b.minX && x - r < b.maxX && z + r > b.minZ && z - r < b.maxZ) return true;
        }
        return false;
    }

    shoot() {
        const now = G.time;
        if (now - this.lastShot < 0.22 || this.energy < 14) return;
        this.lastShot = now;
        this.energy -= 14;
        sound.playLaser(true);

        const spawnPos = this.pos.add(V(0, 2.02, 0));
        const forward = V(Math.sin(this.angle), 0, Math.cos(this.angle));
        const normal = getTerrainNormal(this.pos.x, this.pos.z);
        const dir = forward.subtract(normal.scale(BABYLON.Vector3.Dot(forward, normal))).normalize();

        // Aim assist, same cone as the live game
        let best = null, minAngle = 0.30;
        G.remoteVehicles.forEach(t => {
            const to = t.pos.subtract(this.pos);
            const dist = to.length();
            if (dist < 140 && dist > 2) {
                const ang = Math.acos(clamp(BABYLON.Vector3.Dot(dir, to.normalize()), -1, 1));
                if (ang < minAngle) { minAngle = ang; best = t; }
            }
        });
        if (best) {
            const exact = best.pos.add(V(0, 1.05, 0)).subtract(spawnPos).normalize();
            dir.copyFrom(BABYLON.Vector3.Lerp(dir, exact, 0.78).normalize());
        }

        burst(spawnPos.add(dir.scale(0.6)), '#7ffcff', 6, 4, { life: 0.18, size: 0.3 });
        G.lasers.push(new Laser(spawnPos, dir, this));
        netSend({ type: 'shoot', p: [spawnPos.x, spawnPos.y, spawnPos.z], d: [dir.x, dir.y, dir.z] });
    }

    respawn() {
        this.hp = 100;
        this.energy = 100;
        this.speed = 0;
        this.spawnTime = G.time;
        const gx = Math.floor(Math.random() * 8) + 2;
        const gz = Math.floor(Math.random() * 8) + 2;
        this.pos.x = -OFFSET + gx * CELL_SIZE + STREET_WIDTH / 2;
        this.pos.z = -OFFSET + gz * CELL_SIZE + 50;
        if (this.pos.x > 315) this.pos.x = -85;
        this.angle = Math.floor(Math.random() * 4) * (Math.PI / 2);
        this.pos.y = getElevation(this.pos.x, this.pos.z);
    }

    destroy() {
        this.root.dispose(false, false);
    }
}

// --- Lasers ---------------------------------------------------------------------------------

let laserAssets = null;
function laserTemplates() {
    if (laserAssets) return laserAssets;
    const scene = G.scene;
    const mk = (name, core, glow) => {
        const coreMat = new BABYLON.StandardMaterial(name + 'Core', scene);
        coreMat.emissiveColor = BABYLON.Color3.FromHexString(core);
        coreMat.disableLighting = true;
        const haloMat = new BABYLON.StandardMaterial(name + 'Halo', scene);
        haloMat.emissiveColor = BABYLON.Color3.FromHexString(glow);
        haloMat.disableLighting = true;
        haloMat.alpha = 0.35;
        haloMat.alphaMode = BABYLON.Engine.ALPHA_ADD;
        haloMat.disableDepthWrite = true;
        const c = BABYLON.MeshBuilder.CreateCylinder(name + 'CoreMesh', { diameter: 0.16, height: 6.5, tessellation: 10 }, scene);
        c.material = coreMat;
        const h = BABYLON.MeshBuilder.CreateCylinder(name + 'HaloMesh', { diameter: 0.55, height: 7.4, tessellation: 12 }, scene);
        h.material = haloMat;
        // instance sources must stay enabled, so park them far below the world
        for (const m of [c, h]) { m.isPickable = false; m.position.y = -5000; G.glow?.addIncludedOnlyMesh(m); }
        return { core: c, halo: h, color: BABYLON.Color3.FromHexString(glow) };
    };
    laserAssets = { player: mk('laserP', '#b8ffff', '#00e5ff'), enemy: mk('laserE', '#ffc0d4', '#ff2d6f') };
    return laserAssets;
}

// Light pool, created once at startup (adding lights later would recompile every material).
// Two lights follow the newest lasers so they light up the street; one flashes for explosions.
const laserLights = [];
let boomLight = null;
export function initFx() {
    laserTemplates();
    particleTextures();
    if (G.quality === 'low') return;
    for (let i = 0; i < 2; i++) {
        const l = new BABYLON.PointLight('laserLight' + i, V(0, -100, 0), G.scene);
        l.range = 24;
        l.intensity = 0;
        laserLights.push({ light: l, owner: null });
    }
    boomLight = new BABYLON.PointLight('boomLight', V(0, -100, 0), G.scene);
    boomLight.diffuse = new BABYLON.Color3(1, 0.6, 0.25);
    boomLight.range = 50;
    boomLight.intensity = 0;
}
function laserLight() {
    if (!laserLights.length) return null;
    return laserLights.reduce((a, b) => ((a.owner?.born ?? -1) <= (b.owner?.born ?? -1) ? a : b));
}

export class Laser {
    constructor(pos, dir, owner) {
        this.pos = pos.clone();
        this.dir = dir.clone().normalize();
        this.owner = owner;
        this.speed = 240;
        this.life = 1.15;
        this.born = G.time;
        const t = laserTemplates()[owner.isPlayer ? 'player' : 'enemy'];
        this.core = t.core.createInstance('laserCore');
        this.halo = t.halo.createInstance('laserHalo');
        const q = new BABYLON.Quaternion();
        BABYLON.Quaternion.FromUnitVectorsToRef(V(0, 1, 0), this.dir, q);
        for (const m of [this.core, this.halo]) { m.rotationQuaternion = q.clone(); m.position.copyFrom(this.pos); }
        this.slot = laserLight();
        if (this.slot) {
            this.slot.owner = this;
            this.slot.light.diffuse = t.color;
            this.slot.light.intensity = 60;
        }
    }

    update(dt) {
        this.life -= dt;
        this.pos.addInPlace(this.dir.scale(this.speed * dt));
        this.core.position.copyFrom(this.pos);
        this.halo.position.copyFrom(this.pos);
        if (this.slot?.owner === this) this.slot.light.position.copyFrom(this.pos);

        if (this.pos.y < getElevation(this.pos.x, this.pos.z)) {
            burst(this.pos, '#7ffcff', 14, 6);
            return false;
        }
        for (const b of G.buildings) {
            if (this.pos.x > b.minX && this.pos.x < b.maxX && this.pos.z > b.minZ && this.pos.z < b.maxZ && this.pos.y < b.maxY) {
                burst(this.pos, '#ffd27a', 16, 7);
                return false;
            }
        }
        for (const b of G.obstacles) {
            if (this.pos.x > b.minX && this.pos.x < b.maxX && this.pos.z > b.minZ && this.pos.z < b.maxZ && this.pos.y < b.maxY) {
                burst(this.pos, '#ffd27a', 12, 6);
                return false;
            }
        }

        // Only our own lasers report hits; the server decides damage
        const targets = [...G.remoteVehicles];
        if (G.gameActive) targets.push(G.player);
        for (const t of targets) {
            if (t === this.owner) continue;
            const dx = this.pos.x - t.pos.x, dz = this.pos.z - t.pos.z, dy = this.pos.y - (t.pos.y + 1.0);
            if (dx * dx + dz * dz < 5.2 && Math.abs(dy) < 1.7) {
                const shielded = G.time - t.spawnTime < SPAWN_PROTECTION;
                burst(this.pos, shielded ? '#9fa8ff' : '#ffb347', 26, 8);
                if (this.owner === G.player && t.isRemote && !shielded) netSend({ type: 'hit', target: t.id });
                else if (t === G.player && this.owner.isBot && !shielded) netSend({ type: 'botHit', bot: this.owner.id });
                return false;
            }
        }
        return this.life > 0;
    }

    destroy() {
        this.core.dispose();
        this.halo.dispose();
        if (this.slot?.owner === this) { this.slot.light.intensity = 0; this.slot.owner = null; }
    }
}

// --- Particles --------------------------------------------------------------------------------

let sparkTex = null, smokeTex = null;
function particleTextures() {
    if (!sparkTex) {
        sparkTex = new BABYLON.DynamicTexture('sparkTex', radialCanvas(64, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,0.85)'], [1, 'rgba(255,255,255,0)']]), G.scene, true);
        sparkTex.hasAlpha = true; sparkTex.update(true);
        smokeTex = new BABYLON.DynamicTexture('smokeTex', radialCanvas(64, [[0, 'rgba(255,255,255,0.55)'], [0.6, 'rgba(255,255,255,0.2)'], [1, 'rgba(255,255,255,0)']]), G.scene, true);
        smokeTex.hasAlpha = true; smokeTex.update(true);
    }
    return { sparkTex, smokeTex };
}

export function burst(pos, hex, count, speed, { life = 0.5, size = 0.4, gravity = -14, smoke = false } = {}) {
    const { sparkTex, smokeTex } = particleTextures();
    const ps = new BABYLON.ParticleSystem('burst', count, G.scene);
    ps.particleTexture = smoke ? smokeTex : sparkTex;
    ps.emitter = pos.clone();
    ps.createSphereEmitter(0.2, 1);
    const c = BABYLON.Color3.FromHexString(hex);
    ps.color1 = new BABYLON.Color4(c.r * 2, c.g * 2, c.b * 2, 1);
    ps.color2 = new BABYLON.Color4(c.r, c.g, c.b, 1);
    ps.colorDead = smoke ? new BABYLON.Color4(0.2, 0.2, 0.2, 0) : new BABYLON.Color4(c.r * 0.3, c.g * 0.3, c.b * 0.3, 0);
    ps.minSize = size * 0.5; ps.maxSize = size * (smoke ? 4 : 1.2);
    ps.minLifeTime = life * 0.5; ps.maxLifeTime = life;
    ps.minEmitPower = speed * 0.4; ps.maxEmitPower = speed;
    ps.gravity = V(0, smoke ? 2 : gravity, 0);
    ps.blendMode = smoke ? BABYLON.ParticleSystem.BLENDMODE_STANDARD : BABYLON.ParticleSystem.BLENDMODE_ADD;
    ps.manualEmitCount = count;
    ps.targetStopDuration = 0.05;
    ps.disposeOnStop = true;
    ps.start();
    return ps;
}

export function explosion(pos) {
    burst(pos, '#ffb347', 90, 18, { life: 0.9, size: 0.7 });
    burst(pos, '#00e5ff', 50, 12, { life: 0.7, size: 0.5 });
    burst(pos, '#555555', 30, 4, { life: 2.2, size: 1.4, smoke: true });
    if (boomLight) {
        boomLight.position.copyFrom(pos.add(V(0, 2, 0)));
        boomFlash = 1;
    }
}

let boomFlash = 0;
export function updateFx(dt) {
    if (boomLight && boomFlash > 0) {
        boomFlash = Math.max(0, boomFlash - dt * 2.2);
        boomLight.intensity = 1200 * boomFlash * boomFlash;
    }
}

export function updateLasers(dt) {
    for (let i = G.lasers.length - 1; i >= 0; i--) {
        if (!G.lasers[i].update(dt)) {
            G.lasers[i].destroy();
            G.lasers.splice(i, 1);
        }
    }
}
