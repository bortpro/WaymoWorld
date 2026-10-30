// Street furniture and vegetation: Poly Haven lamps / utility boxes (glTF), procedural trees,
// palms and cypresses (alpha-tested leaf cards), traffic signals with live phases, parked cars.
// Everything repeated is instanced: thin instances for vegetation, InstancedMesh (with distance
// culling) for the high-poly scanned models.

import { G, mulberry32, getElevation, getTerrainNormal } from './shared.js';
import { GeometryBatch } from './geo.js';
import { createParkedCarTemplates } from './car.js';

const V = (x, y, z) => new BABYLON.Vector3(x, y, z);

function matricesFor(list, yOffset = 0, baseScale = 1) {
    const buf = new Float32Array(list.length * 16);
    const rnd = mulberry32(list.length * 7 + 3);
    const m = new BABYLON.Matrix();
    list.forEach((p, i) => {
        const s = (p.s || 1) * baseScale;
        const y = p.y ?? getElevation(p.x, p.z) + 0.15;
        const rot = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, p.ry ?? rnd() * Math.PI * 2);
        BABYLON.Matrix.ComposeToRef(new BABYLON.Vector3(s, s, s), rot, V(p.x, y + yOffset, p.z), m);
        m.copyToArray(buf, i * 16);
    });
    return buf;
}

function thinInstance(mesh, buf) {
    mesh.thinInstanceSetBuffer('matrix', buf, 16, true);
    mesh.thinInstanceRefreshBoundingInfo(false);
    mesh.isPickable = false;
    mesh.alwaysSelectAsActiveMesh = false;
    G.shadows?.addShadowCaster(mesh);
    mesh.receiveShadows = true;
}

// --- Vegetation templates -----------------------------------------------------------------

function leafCard(b, c, size, rnd) {
    // two crossed quads with random orientation
    const yaw = rnd() * Math.PI, tilt = (rnd() - 0.5) * 0.9;
    for (let k = 0; k < 2; k++) {
        const a = yaw + k * Math.PI / 2;
        const ux = V(Math.cos(a), 0, Math.sin(a)).scale(size / 2);
        const uy = V(-Math.sin(a) * Math.sin(tilt), Math.cos(tilt), Math.cos(a) * Math.sin(tilt)).scale(size / 2);
        const p0 = c.subtract(ux).subtract(uy), p1 = c.add(ux).subtract(uy), p2 = c.add(ux).add(uy), p3 = c.subtract(ux).add(uy);
        b.quad(p0, p1, p2, p3, [0, 0, 1, 1]);
    }
}

function taperedLimb(b, p0, p1, r0, r1, sides = 7) {
    const dir = p1.subtract(p0).normalize();
    const ref = Math.abs(dir.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
    const u = BABYLON.Vector3.Cross(dir, ref).normalize(), w = BABYLON.Vector3.Cross(u, dir).normalize();
    const ring = (p, r) => {
        const pts = [];
        for (let i = 0; i < sides; i++) {
            const a = -i / sides * Math.PI * 2;
            pts.push(p.add(u.scale(Math.cos(a) * r)).add(w.scale(Math.sin(a) * r)));
        }
        return pts;
    };
    const a = ring(p0, r0), c = ring(p1, r1);
    for (let i = 0; i < sides; i++) {
        const j = (i + 1) % sides;
        b.quad(a[i], a[j], c[j], c[i], [i / sides, 0, (i + 1) / sides, 1]);
    }
}

function makeTree(seed, kind) {
    const rnd = mulberry32(seed);
    const wood = new GeometryBatch('treeWood' + seed), leaves = new GeometryBatch('treeLeaves' + seed);
    if (kind === 'cypress') {
        // Monterey cypress: dark, wind-shaped layered canopy
        taperedLimb(wood, V(0, -0.5, 0), V(0, 9, 0), 0.55, 0.25);
        for (let i = 0; i < 70; i++) {
            const t = rnd(), y = 3 + t * 9, r = (1 - t * 0.7) * 4.2;
            const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r;
            leafCard(leaves, V(Math.cos(a) * d + 1.2 * t, y, Math.sin(a) * d * 0.8), 3.4 - t, rnd);
        }
    } else {
        // Deciduous street tree (London plane / ficus): trunk, a few limbs, rounded leaf canopy
        const h = 4.2 + rnd() * 1.2;
        taperedLimb(wood, V(0, -0.5, 0), V(0, h, 0), 0.32, 0.22);
        const tips = [];
        for (let k = 0; k < 4; k++) {
            const a = k / 4 * Math.PI * 2 + rnd();
            const tip = V(Math.cos(a) * (1.6 + rnd()), h + 2 + rnd() * 1.5, Math.sin(a) * (1.6 + rnd()));
            taperedLimb(wood, V(0, h - 0.3, 0), tip, 0.18, 0.07, 5);
            tips.push(tip);
        }
        const cy = h + 3.2, rx = 3.6 + rnd() * 0.8, ry = 2.8 + rnd() * 0.6;
        for (let i = 0; i < 60; i++) {
            const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, rr = Math.cbrt(0.35 + rnd() * 0.65);
            const sx = Math.sqrt(1 - u * u) * Math.cos(th), sz = Math.sqrt(1 - u * u) * Math.sin(th);
            leafCard(leaves, V(sx * rx * rr, cy + u * ry * rr, sz * rx * rr), 2.6 + rnd() * 0.9, rnd);
        }
    }
    return { wood, leaves };
}

function makePalm(seed) {
    // Canary Island date palm along the Embarcadero: thick curved trunk, crown of drooping fronds
    const rnd = mulberry32(seed);
    const wood = new GeometryBatch('palmTrunk' + seed), fronds = new GeometryBatch('palmFronds' + seed);
    const H = 9 + rnd() * 2, lean = V((rnd() - 0.5) * 1.2, 0, (rnd() - 0.5) * 1.2);
    let prev = V(0, -0.5, 0);
    for (let k = 1; k <= 8; k++) {
        const t = k / 8;
        const p = V(lean.x * t * t, -0.5 + t * H, lean.z * t * t);
        taperedLimb(wood, prev, p, 0.5 - (k - 1) * 0.02, 0.5 - k * 0.02, 9);
        prev = p;
    }
    const top = prev;
    for (let i = 0; i < 18; i++) {
        const a = i / 18 * Math.PI * 2 + rnd() * 0.3;
        const dir = V(Math.cos(a), 0, Math.sin(a)), side = V(-Math.sin(a), 0, Math.cos(a));
        const len = 4.8 + rnd() * 1.2, up = 0.4 + rnd() * 0.8, width = 1.6;
        // 4-segment arched frond ribbon
        for (let s = 0; s < 4; s++) {
            const t0 = s / 4, t1 = (s + 1) / 4;
            const pos = (t) => top.add(dir.scale(len * t)).add(V(0, up * Math.sin(t * Math.PI * 0.8) * 2 - t * t * 2.6, 0));
            const a0 = pos(t0), a1 = pos(t1);
            const w0 = width * Math.sin(Math.PI * (0.15 + t0 * 0.85)) + 0.1, w1 = width * Math.sin(Math.PI * (0.15 + t1 * 0.85)) + 0.1;
            fronds.quad(a0.subtract(side.scale(w0 / 2)), a0.add(side.scale(w0 / 2)), a1.add(side.scale(w1 / 2)), a1.subtract(side.scale(w1 / 2)),
                [0, t0, 1, t1]);
        }
    }
    // pineapple-like knob under the crown
    taperedLimb(wood, top.add(V(0, -0.6, 0)), top.add(V(0, 0.4, 0)), 0.85, 0.5, 10);
    return { wood, leaves: fronds };
}

// One thin-instance mesh pair per (variant, 300 m chunk) so trees can be frustum culled
function plantVariants(list, variants, M, leafMat, woodMat, name) {
    if (!list.length) return;
    variants.forEach((v, i) => {
        const mine = list.filter((_, k) => k % variants.length === i);
        if (!mine.length) return;
        const chunks = new Map();
        for (const p of mine) {
            const key = Math.floor((p.x + 600) / 300) + ',' + Math.floor((p.z + 600) / 300);
            if (!chunks.has(key)) chunks.set(key, []);
            chunks.get(key).push(p);
        }
        const wood = v.wood.build(G.scene, woodMat, { castShadows: true });
        const leaves = v.leaves.build(G.scene, leafMat, { castShadows: true });
        // thin-instance buffers live on the geometry, so every chunk needs its own geometry copy
        const entries = [...chunks];
        const copies = entries.map(([key], k) => [wood, leaves].map(src => {
            if (k === 0) return src;
            const c = src.clone(`${name}${i}_${key}`);
            c.makeGeometryUnique();
            return c;
        }));
        entries.forEach(([, pts], k) => {
            const buf = matricesFor(pts);
            for (const m of copies[k]) { m.unfreezeWorldMatrix(); thinInstance(m, buf); }
        });
    });
}

// --- Traffic signals ------------------------------------------------------------------------

function buildSignals(list, M) {
    if (!list.length) return null;
    const pole = new GeometryBatch('signalPole');
    const housing = new GeometryBatch('signalHousing');
    // pole + two mast arms: one reaching over the east-west street (north), one over the north-south (west)
    pole.box(0, 3.2, 0, 0.28, 6.4, 0.28, { uv: 1 });
    pole.box(0, 6.1, -4.5, 0.16, 0.16, 9, { uv: 1 });
    pole.box(-4.5, 5.8, 0, 9, 0.16, 0.16, { uv: 1 });
    // Heads at the arm tips and low on the pole; ns heads have lenses on their +-z faces (seen by
    // north-south traffic), the others on +-x faces (east-west traffic)
    const heads = [
        { x: 0, z: -8.2, ns: false }, { x: -8.2, z: 0, ns: true },
        { x: 0.25, z: 0.25, ns: true, low: true }, { x: 0.25, z: 0.25, ns: false, low: true },
    ];
    const lens = { red: new GeometryBatch('lensR'), amber: new GeometryBatch('lensA'), green: new GeometryBatch('lensG') };
    const lensNS = { red: new GeometryBatch('lensRns'), amber: new GeometryBatch('lensAns'), green: new GeometryBatch('lensGns') };
    for (const h of heads) {
        const y = h.low ? 3.4 : 5.1;
        housing.box(h.x, y, h.z, h.ns ? 0.4 : 0.42, 1.25, h.ns ? 0.42 : 0.4, { uv: 1 });
        const set = h.ns ? lensNS : lens;
        ['red', 'amber', 'green'].forEach((c, k) => {
            const ly = y + 0.38 - k * 0.38;
            // lenses on both faces of the head so traffic from either direction sees them
            if (h.ns) { set[c].box(h.x, ly, h.z - 0.22, 0.24, 0.24, 0.04, { uv: 1 }); set[c].box(h.x, ly, h.z + 0.22, 0.24, 0.24, 0.04, { uv: 1 }); }
            else { set[c].box(h.x - 0.22, ly, h.z, 0.04, 0.24, 0.24, { uv: 1 }); set[c].box(h.x + 0.22, ly, h.z, 0.04, 0.24, 0.24, { uv: 1 }); }
        });
    }
    const buf = matricesFor(list.map(p => ({ ...p, ry: 0 })), 0);
    const meshes = [];
    const m1 = pole.build(G.scene, M.poleGreen); m1.unfreezeWorldMatrix(); thinInstance(m1, buf); meshes.push(m1);
    const m2 = housing.build(G.scene, M.signalYellow); m2.unfreezeWorldMatrix(); thinInstance(m2, buf); meshes.push(m2);
    const lensMat = (name, hex) => {
        const m = new BABYLON.PBRMaterial(name, G.scene);
        m.albedoColor = BABYLON.Color3.FromHexString(hex).scale(0.15);
        m.emissiveColor = BABYLON.Color3.FromHexString(hex);
        m.roughness = 0.2;
        return m;
    };
    const phases = {};
    for (const [setName, set] of [['ew', lens], ['ns', lensNS]]) {
        phases[setName] = {};
        for (const [c, hex] of [['red', '#ff2a1f'], ['amber', '#ffb020'], ['green', '#35ff7a']]) {
            const mat = lensMat(`lens_${setName}_${c}`, hex);
            const m = set[c].build(G.scene, mat, { castShadows: false });
            m.unfreezeWorldMatrix();
            G.glow?.addIncludedOnlyMesh(m);
            m.thinInstanceSetBuffer('matrix', buf, 16, true);
            m.thinInstanceRefreshBoundingInfo(false);
            phases[setName][c] = mat;
        }
    }
    return phases;
}

// Cycle: N-S green 14 s, amber 3 s, all red 1 s, then E-W
export function updateSignals(phases, t) {
    if (!phases) return;
    const cycle = 36, p = t % cycle;
    const state = (offset) => {
        const q = (p - offset + cycle) % cycle;
        return q < 14 ? 'green' : q < 17 ? 'amber' : 'red';
    };
    const ns = state(0), ew = state(18);
    for (const [set, s] of [['ns', ns], ['ew', ew]]) {
        for (const c of ['red', 'amber', 'green']) phases[set][c].emissiveIntensity = c === s ? 3.2 : 0.04;
    }
}

// --- glTF props ---------------------------------------------------------------------------

async function loadModel(folder, file) {
    const res = await BABYLON.SceneLoader.ImportMeshAsync('', `assets/models/${folder}/`, file, G.scene);
    const meshes = res.meshes.filter(m => m.getTotalVertices() > 0);
    meshes.forEach(m => m.computeWorldMatrix(true));
    const merged = BABYLON.Mesh.MergeMeshes(meshes, true, true, undefined, false, true);
    res.meshes.forEach(m => { if (!m.isDisposed()) m.dispose(); });
    merged.isPickable = false;
    merged.receiveShadows = true;
    return merged;
}

function instanceAll(template, list, scale, lodDistance, castShadow = true) {
    if (!list.length) { template.setEnabled(false); return []; }
    template.addLODLevel(lodDistance, null);
    const out = [];
    list.forEach((p, i) => {
        const inst = i === 0 ? template : template.createInstance(template.name + i);
        inst.position.set(p.x, p.y, p.z);
        inst.rotation = V(0, p.ry || 0, 0);
        inst.scaling.setAll(scale);
        inst.isPickable = false;
        inst.freezeWorldMatrix();
        if (castShadow) G.shadows?.addShadowCaster(inst);
        out.push(inst);
    });
    return out;
}

export async function buildProps(props, M) {
    const low = G.quality === 'low';
    const thin = (list, keep) => (low ? list.filter((_, i) => i % keep === 0) : list);

    // Vegetation
    plantVariants(thin(props.trees, 2), [makeTree(11, 'tree'), makeTree(12, 'tree'), makeTree(13, 'tree')], M, M.leaves, M.bark, 'tree');
    plantVariants(thin(props.palms, 2), [makePalm(21), makePalm(22), makePalm(23)], M, M.palmFronds, M.palmBark, 'palm');
    plantVariants(props.cypress, [makeTree(31, 'cypress'), makeTree(32, 'cypress')], M, M.cypressLeaves || M.leaves, M.bark, 'cypress');

    const signals = buildSignals(props.signals, M);

    // Parked cars (one InstancedMesh source per paint colour)
    const templates = createParkedCarTemplates(G.scene);
    const byColor = templates.map(() => []);
    for (const p of thin(props.parked, 2)) byColor[p.c % templates.length].push(p);
    byColor.forEach((list, i) => {
        const placed = list.map(p => ({ x: p.x, y: getElevation(p.x, p.z), z: p.z, ry: p.a }));
        instanceAll(templates[i], placed, 1, low ? 160 : 320);
        for (const p of list) G.obstacles.push({ minX: p.x - (Math.abs(Math.sin(p.a)) > 0.5 ? 2.4 : 1.05), maxX: p.x + (Math.abs(Math.sin(p.a)) > 0.5 ? 2.4 : 1.05),
            minZ: p.z - (Math.abs(Math.sin(p.a)) > 0.5 ? 1.05 : 2.4), maxZ: p.z + (Math.abs(Math.sin(p.a)) > 0.5 ? 1.05 : 2.4), maxY: getElevation(p.x, p.z) + 1.7 });
    });

    // Scanned street lamps and utility cabinets
    try {
        const lamp = await loadModel('street_lamp_01', 'street_lamp_01.gltf');
        instanceAll(lamp, props.lamps, 1.75, low ? 110 : 220);
    } catch (e) { console.warn('street lamps unavailable', e); }
    try {
        const box = await loadModel('utility_box_01', 'utility_box_01.gltf');
        instanceAll(box, props.utility, 1.3, low ? 90 : 160);
    } catch (e) { console.warn('utility boxes unavailable', e); }

    return { signals };
}


// --- Cable cars ------------------------------------------------------------------------------

export function buildCableCars(M) {
    const scene = G.scene;
    const maroon = M.solid('cableMaroon', '#7a1f2b', 0.35);
    maroon.clearCoat.isEnabled = true;
    const cream = M.solid('cableCream', '#eadfc2', 0.45);
    const wood = M.solid('cableWood', '#7a5130', 0.6);
    const gold = M.solid('cableGold', '#c9a04a', 0.3, 0.9);
    const template = (() => {
        const b = { maroon: new GeometryBatch('ccMaroon'), cream: new GeometryBatch('ccCream'), wood: new GeometryBatch('ccWood'), gold: new GeometryBatch('ccGold'), glass: new GeometryBatch('ccGlass') };
        b.maroon.box(0, 0.95, 0, 2.5, 1.1, 8.2, { uv: 1, bottom: true });
        b.cream.box(0, 2.15, 0, 2.3, 1.3, 7.4, { uv: 1 });
        for (let z = -3.2; z <= 3.2; z += 0.8) b.glass.box(0, 2.25, z, 2.34, 0.85, 0.62, { uv: 1, top: false });
        b.maroon.box(0, 2.95, 0, 2.6, 0.3, 8.0, { uv: 1 });
        b.wood.box(0, 3.25, 0, 1.6, 0.35, 7.2, { uv: 1 });
        b.gold.box(0, 1.55, 0, 2.52, 0.08, 8.22, { uv: 1, top: false });
        for (const z of [-3.9, 3.9]) b.wood.box(0, 0.55, z, 2.5, 0.12, 1.2, { uv: 1 });
        for (const z of [-2.8, 2.8]) for (const x of [-0.9, 0.9]) b.maroon.box(x, 0.3, z, 0.25, 0.6, 0.6, { uv: 1 });
        const mats = { maroon, cream, wood, gold, glass: M.towerGlass };
        const meshes = Object.entries(b).map(([k, batch]) => { const m = batch.build(scene, mats[k]); m.unfreezeWorldMatrix(); return m; });
        const merged = BABYLON.Mesh.MergeMeshes(meshes, true, true, undefined, false, true);
        merged.receiveShadows = true;
        return merged;
    })();
    const cars = [];
    [[-185, -120, 1], [115, 120, -1], [-185, 220, -1]].forEach(([x, z, dir], i) => {
        const mesh = i === 0 ? template : template.createInstance('cableCar' + i);
        mesh.rotationQuaternion = BABYLON.Quaternion.Identity();
        G.shadows?.addShadowCaster(mesh);
        cars.push({ mesh, x, z, dir });
    });
    return (dt) => {
        for (const c of cars) {
            c.z += c.dir * 9 * dt;
            if (c.z > 560) c.dir = -1;
            if (c.z < -560) c.dir = 1;
            const y = getElevation(c.x, c.z);
            c.mesh.position.set(c.x, y, c.z);
            const n = getTerrainNormal(c.x, c.z);
            const f = new BABYLON.Vector3(0, 0, c.dir);
            const pf = f.subtract(n.scale(BABYLON.Vector3.Dot(f, n))).normalize();
            const r = BABYLON.Vector3.Cross(n, pf).normalize();
            const m = BABYLON.Matrix.Identity();
            BABYLON.Matrix.FromXYZAxesToRef(r, n, pf, m);
            BABYLON.Quaternion.FromRotationMatrixToRef(m, c.mesh.rotationQuaternion);
        }
    };
}
