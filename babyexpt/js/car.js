// Procedural robotaxi: an I-PACE-style electric crossover with a roof sensor dome.
// The body is lofted from cross-sections (smooth ribbons, not boxes) and painted with a
// clear-coated PBR white that picks up the HDRI sky. Forward is +z, up is +y, origin on the ground.

import { G } from './shared.js';

const V = (x, y, z) => new BABYLON.Vector3(x, y, z);
let MATS = null;

function makeMaterials(scene) {
    if (MATS) return MATS;
    const pbr = (name, hex, rough, metal = 0) => {
        const m = new BABYLON.PBRMaterial(name, scene);
        m.albedoColor = BABYLON.Color3.FromHexString(hex);
        m.roughness = rough;
        m.metallic = metal;
        return m;
    };
    const paint = (name, hex) => {
        const m = pbr(name, hex, 0.32, 0.0);
        m.clearCoat.isEnabled = true;
        m.clearCoat.intensity = 1.0;
        m.clearCoat.roughness = 0.03;
        return m;
    };
    MATS = {
        paint: paint('carPaint', '#f3f5f7'),
        glass: (() => { const m = pbr('carGlass', '#05070a', 0.02, 0.15); m.environmentIntensity = 1.3; return m; })(),
        trim: pbr('carTrim', '#141517', 0.55, 0.1),
        gloss: (() => { const m = pbr('carGlossBlack', '#08090a', 0.12, 0.2); m.clearCoat.isEnabled = true; return m; })(),
        tire: pbr('carTire', '#151515', 0.88),
        rim: pbr('carRim', '#9aa0a6', 0.28, 1.0),
        rimDark: pbr('carRimDark', '#2b2e31', 0.35, 0.9),
        sensorGlass: (() => { const m = pbr('sensorGlass', '#0b0e12', 0.05, 0.3); return m; })(),
        head: (() => { const m = pbr('headlight', '#ffffff', 0.1); m.emissiveColor = new BABYLON.Color3(1, 0.98, 0.94); m.emissiveIntensity = 2.2; return m; })(),
        tail: (() => { const m = pbr('taillight', '#300000', 0.2); m.emissiveColor = new BABYLON.Color3(1, 0.05, 0.08); m.emissiveIntensity = 1.6; return m; })(),
        accent: {},
        parkedPaint: ['#1c2530', '#8b1e24', '#c9ccd1', '#2d4a37', '#e8e6e1', '#3a3d42'].map((c, i) => paint('parkedPaint' + i, c)),
    };
    return MATS;
}

function accentMaterial(scene, hex) {
    const M = makeMaterials(scene);
    if (M.accent[hex]) return M.accent[hex];
    const m = new BABYLON.PBRMaterial('accent' + hex, scene);
    const c = BABYLON.Color3.FromHexString(hex);
    m.albedoColor = c.scale(0.3);
    m.emissiveColor = c;
    m.emissiveIntensity = 2.5;
    m.roughness = 0.3;
    M.accent[hex] = m;
    return m;
}

// --- body loft ---------------------------------------------------------------------------
// Side profile, rear to front: [z, halfWidth, bottomY, topY]
const BODY = [
    [-2.40, 0.02, 0.66, 0.66],
    [-2.39, 0.62, 0.52, 0.86],
    [-2.34, 0.84, 0.46, 0.95],
    [-2.22, 0.94, 0.43, 1.00],
    [-1.95, 0.985, 0.41, 1.02],
    [-1.40, 1.00, 0.40, 1.02],
    [-0.60, 1.00, 0.40, 1.00],
    [0.20, 1.00, 0.40, 0.99],
    [0.95, 0.995, 0.40, 0.97],
    [1.50, 0.985, 0.41, 0.91],
    [1.90, 0.965, 0.42, 0.86],
    [2.16, 0.925, 0.45, 0.80],
    [2.31, 0.84, 0.50, 0.73],
    [2.39, 0.66, 0.55, 0.66],
    [2.41, 0.02, 0.60, 0.60],
];
const CLAD_Y = 0.6;   // black lower cladding below this line

// Half outlines (2D, x >= 0). Lower cladding runs from bottom centre out to the side at the clad
// line; upper paint runs from the side at the clad line over the shoulder to the top centre.
function lowerOutline(hw, yb, c) {
    const h = Math.max(0.001, c - yb);
    return [[0, yb], [hw * 0.78, yb], [hw * 0.95, yb + Math.min(0.05, h / 3)], [hw, yb + Math.min(0.16, h * 0.8)], [hw, c]];
}
function upperOutline(hw, c, yt) {
    const sh = Math.max(0, Math.min(0.16, (yt - c) * 0.35));
    return [[hw, c], [hw, Math.max(c + 0.005, yt - sh - 0.08)], [hw * 0.985, yt - sh], [hw * 0.93, yt - 0.035], [hw * 0.78, yt], [0, yt]];
}

// Build a ribbon from per-section outlines (mirrored to a full cross-section)
function loft(name, sections, scene, mat) {
    const paths = sections.map(({ z, pts }) => {
        const L = (p) => V(-p[0], p[1], z), R = (p) => V(p[0], p[1], z);
        // Outlines either start at the centre line (cladding: go round underneath) or at the side
        // (paint, glass: go round over the top). Either way the path runs left side -> right side.
        if (pts[0][0] === 0) return pts.slice().reverse().map(L).concat(pts.slice(1).map(R));
        return pts.map(L).concat(pts.slice().reverse().slice(1).map(R));
    });
    const m = BABYLON.MeshBuilder.CreateRibbon(name, { pathArray: paths, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
    m.material = mat;
    return m;
}

// Resample a polyline outline to N points so every section has the same vertex count
function resample(pts, n) {
    const seg = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
        const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        seg.push(l); total += l;
    }
    const out = [];
    for (let k = 0; k < n; k++) {
        let d = total * k / (n - 1), i = 0;
        while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
        const t = seg[i] ? Math.min(1, d / seg[i]) : 0;
        out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t]);
    }
    return out;
}

function lerpProfile(z) {
    for (let i = 1; i < BODY.length; i++) {
        if (z <= BODY[i][0]) {
            const a = BODY[i - 1], b = BODY[i], t = (z - a[0]) / (b[0] - a[0]);
            return a.map((v, k) => v + (b[k] - v) * t);
        }
    }
    return BODY[BODY.length - 1];
}

// Greenhouse: [z, halfWidthAtBelt, halfWidthAtRoof, roofY]; belt follows the body top
const GREENHOUSE = [
    [-2.02, 0.86, 0.84, null],
    [-1.90, 0.90, 0.74, 1.22],
    [-1.62, 0.93, 0.70, 1.45],
    [-1.25, 0.94, 0.70, 1.55],
    [-0.50, 0.945, 0.70, 1.585],
    [0.15, 0.945, 0.70, 1.57],
    [0.42, 0.945, 0.72, 1.48],
    [0.72, 0.945, 0.80, 1.26],
    [0.98, 0.94, 0.90, 1.04],
    [1.06, 0.93, 0.92, null],
];

function greenhouseSections(inset = 0, zMin = -9, zMax = 9, roofOnly = false) {
    const out = [];
    for (const [z, hwb, hwt, ry] of GREENHOUSE) {
        if (z < zMin || z > zMax) continue;
        const belt = lerpProfile(z)[3] - 0.012;
        const roof = ry === null ? belt + 0.012 : ry;
        let pts;
        if (roofOnly) {
            const w = hwt * 0.9 - inset;
            out.push({ z, pts: resample([[w, roof - 0.03], [w * 0.8, roof + 0.008], [0, roof + 0.012]], 6) });
            continue;
        }
        pts = [[hwb, belt], [hwt + 0.02, roof - 0.09], [hwt * 0.86, roof - 0.01], [0, roof]];
        out.push({ z, pts: resample(pts, 9) });
    }
    return out;
}

function buildBody(scene, M, paint) {
    const parts = [];
    const lower = [], upper = [];
    for (const [z, hw, yb, yt] of BODY) {
        const c = Math.max(yb + 0.002, Math.min(CLAD_Y, yt - 0.002));
        lower.push({ z, pts: resample(lowerOutline(hw, yb, c), 9) });
        upper.push({ z, pts: resample(upperOutline(hw, c, yt), 14) });
    }
    // the outlines run bottom->top; loft mirrors them into left + right halves
    parts.push(loft('bodyUpper', upper, scene, paint));
    parts.push(loft('bodyCladding', lower, scene, M.trim));
    parts.push(loft('greenhouse', greenhouseSections(), scene, M.glass));
    // floating white roof panel over the glass
    const roof = greenhouseSections(0.02, -1.5, 0.3, true);
    parts.push(loft('roofPanel', roof, scene, paint));
    return parts;
}

function wheel(scene, M, name, dark = false) {
    const node = new BABYLON.TransformNode(name, scene);
    // tyre: lathe a rounded profile around the axle
    const r = 0.375, w = 0.25;
    const prof = [];
    for (let i = 0; i <= 10; i++) {
        const a = -Math.PI / 2 + i / 10 * Math.PI;
        prof.push(V(r - 0.07 + Math.cos(a) * 0.07, Math.sin(a) * w / 2, 0));
    }
    const tire = BABYLON.MeshBuilder.CreateLathe(name + 'Tire', { shape: [V(0.25, -w / 2, 0), ...prof, V(0.25, w / 2, 0)], tessellation: 28, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
    tire.rotation.z = Math.PI / 2;
    tire.material = M.tire;
    tire.parent = node;
    // aero rim: dished disc + five spokes
    const disc = BABYLON.MeshBuilder.CreateCylinder(name + 'Rim', { diameterTop: 0.5, diameterBottom: 0.56, height: 0.04, tessellation: 28 }, scene);
    disc.rotation.z = Math.PI / 2;
    disc.position.x = w / 2 - 0.02;
    disc.material = dark ? M.rimDark : M.rim;
    disc.parent = node;
    for (let k = 0; k < 5; k++) {
        const sp = BABYLON.MeshBuilder.CreateBox(name + 'Spoke', { width: 0.03, height: 0.2, depth: 0.06 }, scene);
        sp.position.set(w / 2 + 0.005, 0, 0);
        sp.rotation.x = k / 5 * Math.PI * 2;
        sp.setPivotPoint(V(0, 0, 0));
        sp.locallyTranslate(V(0, 0.12, 0));
        sp.material = M.rimDark;
        sp.parent = node;
    }
    const hub = BABYLON.MeshBuilder.CreateCylinder(name + 'Hub', { diameter: 0.12, height: 0.06, tessellation: 16 }, scene);
    hub.rotation.z = Math.PI / 2;
    hub.position.x = w / 2 + 0.01;
    hub.material = M.rim;
    hub.parent = node;
    // one multi-material mesh per wheel (fewer draw calls in every shadow cascade)
    const parts = node.getChildMeshes();
    parts.forEach(m => m.computeWorldMatrix(true));
    const merged = BABYLON.Mesh.MergeMeshes(parts, true, true, undefined, false, true);
    merged.name = name + 'Merged';
    merged.parent = node;
    return node;
}

// Black wheel-arch flare: half ring around the top of the wheel
function archFlare(scene, M, x, z) {
    const path = [];
    for (let i = 0; i <= 16; i++) {
        const a = Math.PI * 0.08 + i / 16 * Math.PI * 0.84;
        path.push(V(x, 0.38 + Math.sin(a) * 0.47, z + Math.cos(a) * 0.47));
    }
    const t = BABYLON.MeshBuilder.CreateTube('arch', { path, radius: 0.055, tessellation: 8 }, scene);
    t.material = M.trim;
    return t;
}

function decalTexture(scene) {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 1024, 256);
    ctx.font = 'bold 92px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1b2a3a';
    ctx.fillText('SF LASER', 40, 96);
    ctx.fillStyle = '#00a7c7';
    ctx.fillText('TAXI', 520, 96);
    ctx.fillStyle = '#5b6b78';
    ctx.font = '600 46px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.fillText('AUTONOMOUS · ZERO EMISSION', 44, 190);
    const t = new BABYLON.DynamicTexture('decalTex', c, scene, true);
    t.hasAlpha = true;
    t.update(true);
    return t;
}

let decalMat = null;

// Build one complete taxi. accentHex colours the roof light ring (team colour).
export function createTaxi(scene, { accentHex = '#00e5ff', sensors = true, paintMat = null, name = 'taxi' } = {}) {
    const M = makeMaterials(scene);
    const root = new BABYLON.TransformNode(name, scene);
    const paint = paintMat || M.paint;
    const meshes = [], wheelMeshes = [], movingMeshes = [];
    const add = (m) => { m.parent = root; meshes.push(m); return m; };

    buildBody(scene, M, paint).forEach(add);

    // Front grille, lower intake, rear diffuser in gloss black
    const grille = add(BABYLON.MeshBuilder.CreateBox('grille', { width: 1.05, height: 0.26, depth: 0.08 }, scene));
    grille.position.set(0, 0.68, 2.345); grille.material = M.gloss;
    const intake = add(BABYLON.MeshBuilder.CreateBox('intake', { width: 1.5, height: 0.12, depth: 0.06 }, scene));
    intake.position.set(0, 0.5, 2.36); intake.material = M.trim;
    // Headlights (slim LED strips) and full-width tail bar
    for (const s of [-1, 1]) {
        const hl = add(BABYLON.MeshBuilder.CreateBox('headlight', { width: 0.42, height: 0.05, depth: 0.05 }, scene));
        hl.position.set(s * 0.66, 0.8, 2.24); hl.rotation.y = s * -0.32; hl.material = M.head;
        const drl = add(BABYLON.MeshBuilder.CreateBox('drl', { width: 0.05, height: 0.16, depth: 0.05 }, scene));
        drl.position.set(s * 0.86, 0.73, 2.14); drl.rotation.y = s * -0.55; drl.material = M.head;
    }
    const tail = add(BABYLON.MeshBuilder.CreateBox('tailbar', { width: 1.72, height: 0.05, depth: 0.05 }, scene));
    tail.position.set(0, 0.93, -2.33); tail.material = M.tail;
    for (const s of [-1, 1]) {
        const tl = add(BABYLON.MeshBuilder.CreateBox('taillight', { width: 0.3, height: 0.09, depth: 0.05 }, scene));
        tl.position.set(s * 0.78, 0.9, -2.29); tl.rotation.y = s * 0.35; tl.material = M.tail;
    }
    // Side mirrors (with camera pods on sensor cars) and door handles
    for (const s of [-1, 1]) {
        const mirror = add(BABYLON.MeshBuilder.CreateBox('mirror', { width: 0.2, height: 0.12, depth: 0.22 }, scene));
        mirror.position.set(s * 1.05, 1.03, 0.82); mirror.material = M.gloss;
        const stalk = add(BABYLON.MeshBuilder.CreateBox('mirrorStalk', { width: 0.14, height: 0.05, depth: 0.08 }, scene));
        stalk.position.set(s * 0.96, 1.0, 0.85); stalk.material = M.gloss;
        for (const z of [0.25, -0.85]) {
            const h = add(BABYLON.MeshBuilder.CreateBox('handle', { width: 0.03, height: 0.035, depth: 0.22 }, scene));
            h.position.set(s * 1.0, 0.92, z); h.material = M.trim;
        }
    }
    // Wheels and arch flares
    const wheels = [];
    for (const [x, z, front] of [[-0.86, 1.5, true], [0.86, 1.5, true], [-0.86, -1.48, false], [0.86, -1.48, false]]) {
        const steer = new BABYLON.TransformNode('steer', scene);
        steer.parent = root;
        steer.position.set(x, 0.375, z);
        const wh = wheel(scene, M, 'wheel', !sensors);
        wh.parent = steer;
        if (x < 0) wh.rotation.y = Math.PI;   // rim faces outward on both sides
        wheels.push({ steer, spin: wh, front, side: Math.sign(x) });
        wheelMeshes.push(...wh.getChildMeshes());
        add(archFlare(scene, M, Math.sign(x) * 0.985, z));
    }

    let turret = null, ring = null;
    if (sensors) {
        // Roof sensor dome: white base, dark glass lidar band, white cap, team-colour light ring
        const base = add(BABYLON.MeshBuilder.CreateCylinder('domeBase', { diameterTop: 0.6, diameterBottom: 0.78, height: 0.13, tessellation: 32 }, scene));
        base.position.set(0, 1.655, -0.35); base.material = paint;
        ring = add(BABYLON.MeshBuilder.CreateTorus('accentRing', { diameter: 0.64, thickness: 0.035, tessellation: 40 }, scene));
        ring.position.set(0, 1.725, -0.35); ring.material = accentMaterial(scene, accentHex);
        const band = add(BABYLON.MeshBuilder.CreateCylinder('lidarBand', { diameter: 0.5, height: 0.24, tessellation: 32 }, scene));
        band.position.set(0, 1.85, -0.35); band.material = M.sensorGlass;
        const cap = add(BABYLON.MeshBuilder.CreateSphere('domeCap', { diameter: 0.54, segments: 16, slice: 0.5 }, scene));
        cap.position.set(0, 1.96, -0.35); cap.scaling.y = 0.55; cap.material = paint;
        // spinning lidar head visible through the band
        turret = new BABYLON.TransformNode('turret', scene);
        turret.parent = root;
        turret.position.set(0, 1.85, -0.35);
        const head = BABYLON.MeshBuilder.CreateBox('lidarHead', { width: 0.12, height: 0.16, depth: 0.5 }, scene);
        head.material = accentMaterial(scene, accentHex);
        head.scaling.set(1, 0.6, 0.98);
        head.parent = turret;
        movingMeshes.push(head);
        // fender, bumper and mirror sensor pods
        for (const s of [-1, 1]) {
            const pod = add(BABYLON.MeshBuilder.CreateBox('fenderPod', { width: 0.16, height: 0.2, depth: 0.2 }, scene));
            pod.position.set(s * 0.9, 0.93, 1.9); pod.material = paint;
            const lens = add(BABYLON.MeshBuilder.CreateBox('fenderLens', { width: 0.17, height: 0.1, depth: 0.12 }, scene));
            lens.position.set(s * 0.9, 0.95, 1.96); lens.material = M.sensorGlass;
            const cam = add(BABYLON.MeshBuilder.CreateBox('mirrorCam', { width: 0.12, height: 0.12, depth: 0.14 }, scene));
            cam.position.set(s * 1.06, 1.14, 0.8); cam.material = M.sensorGlass;
            const rear = add(BABYLON.MeshBuilder.CreateBox('rearPod', { width: 0.18, height: 0.14, depth: 0.14 }, scene));
            rear.position.set(s * 0.82, 1.05, -2.2); rear.material = M.sensorGlass;
        }
        const nose = add(BABYLON.MeshBuilder.CreateSphere('noseLidar', { diameter: 0.2, segments: 12 }, scene));
        nose.position.set(0, 0.52, 2.38); nose.scaling.z = 0.6; nose.material = M.sensorGlass;

        // Door decals
        if (!decalMat) {
            decalMat = new BABYLON.PBRMaterial('decalMat', scene);
            decalMat.albedoTexture = decalTexture(scene);
            decalMat.useAlphaFromAlbedoTexture = true;
            decalMat.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
            decalMat.roughness = 0.3;
            decalMat.metallic = 0;
            decalMat.zOffset = -2;
            decalMat.backFaceCulling = false;
        }
        for (const s of [-1, 1]) {
            const d = add(BABYLON.MeshBuilder.CreatePlane('decal', { width: 1.6, height: 0.4 }, scene));
            d.position.set(s * 1.006, 0.78, -0.35);
            d.rotation.y = s * -Math.PI / 2;
            if (s > 0) d.scaling.x = -1;   // keep the lettering readable on both sides
            d.material = decalMat;
        }
    }

    // Soft contact shadow under the car (grounds it on every surface)
    const blob = add(BABYLON.MeshBuilder.CreateGround('contactShadow', { width: 2.6, height: 5.4 }, scene));
    blob.position.y = 0.03;
    blob.material = contactShadowMaterial(scene);
    blob.isPickable = false;

    // Merge every static part into one multi-material body mesh
    const statics = meshes.filter(m => m !== blob);
    root.computeWorldMatrix(true);
    statics.forEach(m => m.computeWorldMatrix(true));
    const body = BABYLON.Mesh.MergeMeshes(statics, true, true, undefined, false, true);
    body.name = name + 'Body';
    body.parent = root;
    const all = [body, ...wheelMeshes, ...movingMeshes];
    for (const m of [...all, blob]) { m.isPickable = false; m.receiveShadows = true; }
    return { root, meshes: all, wheels, turret, ring: null, blob, glowMeshes: [body, ...movingMeshes] };
}

let blobMat = null;
function contactShadowMaterial(scene) {
    if (blobMat) return blobMat;
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, 'rgba(0,0,0,0.75)');
    g.addColorStop(0.6, 'rgba(0,0,0,0.35)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new BABYLON.DynamicTexture('blobTex', c, scene, true);
    tex.hasAlpha = true;
    tex.update(true);
    blobMat = new BABYLON.StandardMaterial('blobMat', scene);
    blobMat.diffuseTexture = tex;
    blobMat.useAlphaFromDiffuseTexture = true;
    blobMat.diffuseColor = BABYLON.Color3.Black();
    blobMat.specularColor = BABYLON.Color3.Black();
    blobMat.disableLighting = true;
    blobMat.zOffset = -3;
    return blobMat;
}

// One merged, instanceable mesh per paint colour for parked cars (no sensors, no animation)
export function createParkedCarTemplates(scene) {
    const M = makeMaterials(scene);
    return M.parkedPaint.map((paint, i) => {
        const car = createTaxi(scene, { sensors: false, paintMat: paint, name: 'parked' + i });
        car.root.computeWorldMatrix(true);
        const merged = BABYLON.Mesh.MergeMeshes(car.meshes.map(m => { m.computeWorldMatrix(true); return m; }), true, true, undefined, false, true);
        car.blob.dispose();
        car.root.dispose();
        merged.name = 'parkedTemplate' + i;
        merged.isPickable = false;
        merged.receiveShadows = true;
        merged.setEnabled(true);
        return merged;
    });
}

export function carMaterials(scene) { return makeMaterials(scene); }
