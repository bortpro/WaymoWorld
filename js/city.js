// San Francisco: terrain, streets, sidewalks, Victorian rows, downtown towers and landmarks.
//
// Building placement replays the original three.js game's seeded generator call-for-call (cityRandom, seed 415),
// so G.buildings matches every other client exactly. Everything visual on top of that is free to
// be richer: real facades, bay windows, cornices, setbacks, rooftop clutter.

import {
    G, OFFSET, CELL_SIZE, STREET_WIDTH, BLOCK_SIZE, GRID_STEPS, WATER_Y, SHORE_X,
    mulberry32, getElevation, isGoldenGatePark, isDowntown, isInsideRoadway,
} from './shared.js';
import { GeometryBatch } from './geo.js';
import { VICTORIAN_TILE, DOWNTOWN_TILES, STOREFRONT_TILE, TRIM_V, ACCENT_V, VICTORIAN_PALETTES } from './materials.js';

const V = (x, y, z) => new BABYLON.Vector3(x, y, z);
const SIDEWALK_H = 0.18;
const sidewalkY = (x, z) => getElevation(x, z) + SIDEWALK_H;

// Which faces of a footprint are drawn by wall(): outward-facing order helpers
// north (-z), south (+z), east (+x), west (-x)
function faceWalls(b, x0, z0, x1, z1, yb, yt, tile, vOrigin, which = 'nsew') {
    if (which.includes('n')) b.wall(x1, z0, x0, z0, yb, yt, tile.w, tile.h, 0, vOrigin);
    if (which.includes('s')) b.wall(x0, z1, x1, z1, yb, yt, tile.w, tile.h, 0, vOrigin);
    if (which.includes('e')) b.wall(x1, z1, x1, z0, yb, yt, tile.w, tile.h, 0, vOrigin);
    if (which.includes('w')) b.wall(x0, z0, x0, z1, yb, yt, tile.w, tile.h, 0, vOrigin);
}

// Ring of boxes around a footprint (cornices, parapets, belt courses) sampling the trim band
function trimRing(b, cx, cz, sx, sz, y, h, overhang, thick = 0.9, uv = [0.5, TRIM_V]) {
    const hx = sx / 2 + overhang, hz = sz / 2 + overhang;
    b.box(cx, y + h / 2, cz - hz + thick / 2, sx + overhang * 2, h, thick, { fixedUV: uv, bottom: true });
    b.box(cx, y + h / 2, cz + hz - thick / 2, sx + overhang * 2, h, thick, { fixedUV: uv, bottom: true });
    b.box(cx - hx + thick / 2, y + h / 2, cz, thick, h, sz + overhang * 2 - thick * 2, { fixedUV: uv, bottom: true });
    b.box(cx + hx - thick / 2, y + h / 2, cz, thick, h, sz + overhang * 2 - thick * 2, { fixedUV: uv, bottom: true });
}

export function buildCity(M) {
    const scene = G.scene;
    const cityRandom = mulberry32(415);   // multiplayer contract: same call order as the original three.js game
    const rnd = mulberry32(2718);          // cosmetic only

    const B = {
        terrain: new GeometryBatch('terrain', { colors: true, chunked: true }),
        sidewalk: new GeometryBatch('sidewalk', { chunked: true }),
        curb: new GeometryBatch('curb', { chunked: true }),
        paint: new GeometryBatch('roadPaint', { colors: true, chunked: true }),
        victorian: VICTORIAN_PALETTES.map((_, i) => new GeometryBatch('victorian' + i, { chunked: true })),
        roofShingle: new GeometryBatch('roofShingle', { chunked: true }),
        flatRoof: new GeometryBatch('flatRoof', { chunked: true }),
        downtown: { glass: new GeometryBatch('dt_glass', { chunked: true }), precast: new GeometryBatch('dt_precast', { chunked: true }), brick: new GeometryBatch('dt_brick', { chunked: true }), stone: new GeometryBatch('dt_stone', { chunked: true }) },
        storefront: new GeometryBatch('storefront', { chunked: true }),
        awning: new GeometryBatch('awning', { colors: true, chunked: true }),
        steel: new GeometryBatch('rooftopSteel', { chunked: true }),
        darkMetal: new GeometryBatch('darkMetal', { chunked: true }),
        white: new GeometryBatch('whiteTrim', { chunked: true }),
        sandstone: new GeometryBatch('sandstone', { chunked: true }),
        grass: new GeometryBatch('grass', { colors: true, chunked: true }),
        sand: new GeometryBatch('sand', { colors: true, chunked: true }),
        intlOrange: new GeometryBatch('intlOrange', { chunked: true }),
        steelGrey: new GeometryBatch('steelGrey', { chunked: true }),
        crane: new GeometryBatch('crane', { chunked: true }),
        brick: new GeometryBatch('brick', { chunked: true }),
        towerGlass: new GeometryBatch('towerGlass', { chunked: true }),
        redBeacon: new GeometryBatch('beacons', { chunked: true }),
        hedge: new GeometryBatch('hedge', { colors: true, chunked: true }),
    };

    const props = { lamps: [], signals: [], trees: [], palms: [], cypress: [], utility: [], parked: [] };

    buildTerrain(B);
    buildShoreAprons(B);

    const parkBlocks = [];

    for (let gx = 0; gx < GRID_STEPS; gx++) {
        for (let gz = 0; gz < GRID_STEPS; gz++) {
            const cellX = -OFFSET + gx * CELL_SIZE;
            const cellZ = -OFFSET + gz * CELL_SIZE;
            const bx = cellX + STREET_WIDTH + BLOCK_SIZE / 2;
            const bz = cellZ + STREET_WIDTH + BLOCK_SIZE / 2;
            if (bx > 380) continue;
            const groundY = getElevation(bx, bz);
            const park = isGoldenGatePark(gx, gz);

            buildSidewalkBlock(B, cellX + STREET_WIDTH, cellZ + STREET_WIDTH, park);

            if (gx === 7 && gz === 6) {
                buildTransamerica(B, bx, bz, groundY);
                G.buildings.push({ minX: bx - 25, maxX: bx + 25, minZ: bz - 25, maxZ: bz + 25, maxY: groundY + 285 });
                continue;
            }
            if (gx === 4 && gz === 7) {
                buildCoitTower(B, bx, bz, groundY);
                G.buildings.push({ minX: bx - 12, maxX: bx + 12, minZ: bz - 12, maxZ: bz + 12, maxY: groundY + 135 });
                continue;
            }

            if (park) {
                for (let k = 0; k < 8; k++) cityRandom();
                parkBlocks.push({ gx, bx, bz });
            } else if (isDowntown(gx, gz)) {
                const rH = cityRandom();
                const rTex = cityRandom();
                const w = BLOCK_SIZE - 16, d = BLOCK_SIZE - 16;
                const h = 50 + rH * 90;
                if (gx === 7 && gz === 5) buildSalesforceTower(B, bx, bz, groundY);
                else buildOfficeTower(B, bx, bz, groundY, w, d, h, rTex, rnd);
                G.buildings.push({ minX: bx - w / 2, maxX: bx + w / 2, minZ: bz - d / 2, maxZ: bz + d / 2, maxY: groundY + h });
            } else {
                const subSize = (BLOCK_SIZE - 16) / 2; // 27
                const paintedLadies = gx === 4 && gz === 5;
                let subIdx = 0;
                for (let sx = -0.5; sx <= 0.5; sx += 1) {
                    for (let sz = -0.5; sz <= 0.5; sz += 1) {
                        const hx = bx + sx * (subSize + 4);
                        const hz = bz + sz * (subSize + 4);
                        const hy = getElevation(hx, hz);
                        const rH = cityRandom();
                        const rCol = cityRandom();
                        const hh = paintedLadies ? 24 : (15 + rH * 15);
                        const pal = paintedLadies ? (subIdx % 6) : Math.floor(rCol * VICTORIAN_PALETTES.length);
                        subIdx++;
                        buildVictorian(B, hx, hz, hy, hh, subSize, sx, sz, pal, rnd, paintedLadies);
                        G.buildings.push({
                            minX: hx - subSize / 2, maxX: hx + subSize / 2,
                            minZ: hz - subSize / 2, maxZ: hz + subSize / 2,
                            maxY: hy + hh + 5,
                        });
                    }
                }
            }

            collectStreetProps(props, gx, gz, cellX, cellZ, rnd, park);
        }
    }

    buildRoadMarkings(B);
    buildGoldenGatePark(B, parkBlocks, props, rnd);
    buildOceanBeach(B);
    buildGoldenGateBridge(B);
    buildBayBridge(B);
    buildFerryBuilding(B);
    buildSutroTower(B);
    buildLombardStreet(B);
    buildCrane(B);

    // --- Materialise all batches ---
    const meshes = [];
    const add = (batch, mat, opts) => { const ms = batch.build(scene, mat, opts); meshes.push(...ms); return ms; };
    add(B.terrain, M.asphalt, { castShadows: false });
    add(B.sidewalk, M.sidewalk, { castShadows: false });
    add(B.curb, M.sidewalk, { castShadows: false });
    const paint = new BABYLON.PBRMaterial('roadPaintMat', scene);
    paint.albedoColor = new BABYLON.Color3(1, 1, 1);
    paint.useVertexColors = true;
    paint.roughness = 0.62;
    paint.metallic = 0;
    paint.zOffset = -2;
    add(B.paint, paint, { castShadows: false });
    B.victorian.forEach((b, i) => add(b, M.victorian[i]));
    add(B.roofShingle, M.roofShingle);
    add(B.flatRoof, M.flatRoof);
    for (const k of Object.keys(B.downtown)) add(B.downtown[k], M.downtown[k]);
    add(B.storefront, M.storefront);
    const awningMat = M.solid('awningMat', '#ffffff', 0.85);
    awningMat.useVertexColors = true;
    awningMat.backFaceCulling = false;
    awningMat.twoSidedLighting = true;
    add(B.awning, awningMat);
    add(B.steel, M.steelGrey);
    add(B.darkMetal, M.darkMetal);
    add(B.white, M.white);
    add(B.sandstone, M.sandstone);
    M.grass.useVertexColors = true;
    add(B.grass, M.grass, { castShadows: false });
    add(B.sand, M.sand, { castShadows: false });
    add(B.intlOrange, M.intlOrange);
    add(B.steelGrey, M.steelGrey);
    add(B.crane, M.craneYellow);
    add(B.brick, M.brick);
    add(B.towerGlass, M.towerGlass);
    add(B.redBeacon, M.redBeacon, { castShadows: false }).forEach(m => G.glow?.addIncludedOnlyMesh(m));
    const hedgeMat = M.solid('hedgeMat', '#ffffff', 0.85);
    hedgeMat.useVertexColors = true;
    add(B.hedge, hedgeMat);

    buildWater(M);

    for (const m of meshes) {
        if (m.metadata?.castShadows) G.shadows?.addShadowCaster(m);
    }
    return { props, meshes };
}

// ---------------------------------------------------------------------------------------------
// Ground

function buildTerrain(B) {
    // Asphalt everywhere (streets); blocks get raised sidewalks on top. Vertex colour carries
    // large-scale patching so the road surface isn't a uniform repeat.
    const noise = (x, z) => 0.5 + 0.25 * Math.sin(x * 0.031 + Math.sin(z * 0.017) * 2) +
        0.25 * Math.sin(z * 0.027 + Math.cos(x * 0.013) * 2);
    const tile = 300;
    for (let x = -OFFSET; x < OFFSET; x += tile) {
        for (let z = -OFFSET; z < OFFSET; z += tile) {
            B.terrain.drapedGrid(x, z, x + tile, z + tile, 75, 75, getElevation, 9, (px, pz) => {
                const v = 0.86 + noise(px, pz) * 0.16;
                return [v, v, v * 1.01, 1];
            });
        }
    }
}

// Sloping aprons beyond the north and south edges so the city meets the water naturally
function buildShoreAprons(B) {
    const depth = 90;
    for (const side of [-1, 1]) {
        const edgeZ = side * OFFSET;
        const zA = side < 0 ? edgeZ - depth : edgeZ, zB = side < 0 ? edgeZ : edgeZ + depth;
        B.grass.drapedGrid(-OFFSET, zA, 450, zB, 105, 18, (x, z) => {
            const t = Math.min(1, Math.abs(z - edgeZ) / depth);
            const top = getElevation(x, edgeZ);
            return top + (WATER_Y - 5 - top) * Math.pow(t, 1.6);
        }, 8, (x, z, y) => {
            // grass -> rocky shoreline near the water
            const k = Math.min(1, Math.max(0, (WATER_Y + 3.5 - y) / 3));
            return [0.85 - k * 0.35, 0.9 - k * 0.5, 0.75 - k * 0.35, 1];
        });
    }
}

function buildSidewalkBlock(B, x0, z0, park) {
    const x1 = x0 + BLOCK_SIZE, z1 = z0 + BLOCK_SIZE;
    if (park) {
        // just a 3 m sidewalk ring around the lawn
        const r = 3;
        B.sidewalk.drapedGrid(x0, z0, x1, z0 + r, 10, 1, sidewalkY, 3);
        B.sidewalk.drapedGrid(x0, z1 - r, x1, z1, 10, 1, sidewalkY, 3);
        B.sidewalk.drapedGrid(x0, z0 + r, x0 + r, z1 - r, 1, 10, sidewalkY, 3);
        B.sidewalk.drapedGrid(x1 - r, z0 + r, x1, z1 - r, 1, 10, sidewalkY, 3);
    } else {
        B.sidewalk.drapedGrid(x0, z0, x1, z1, 12, 12, sidewalkY, 3);
    }
    // Curbs: one segment every 5 m, top follows the sidewalk, bottom sinks into the asphalt
    const segs = 14;
    const curb = (xa, za, xb, zb) => {
        for (let i = 0; i < segs; i++) {
            const t0 = i / segs, t1 = (i + 1) / segs;
            const ax = xa + (xb - xa) * t0, az = za + (zb - za) * t0;
            const bx = xa + (xb - xa) * t1, bz = za + (zb - za) * t1;
            B.curb.slopedWall(ax, az, bx, bz, getElevation(ax, az) - 0.1, getElevation(bx, bz) - 0.1,
                sidewalkY(ax, az), sidewalkY(bx, bz), 3);
        }
    };
    curb(x1, z0, x0, z0); // north, faces -z
    curb(x0, z1, x1, z1); // south
    curb(x1, z1, x1, z0); // east
    curb(x0, z0, x0, z1); // west
}

function buildRoadMarkings(B) {
    const P = B.paint;
    const white = [0.93, 0.93, 0.9, 1], yellow = [0.95, 0.74, 0.16, 1], rail = [0.33, 0.33, 0.35, 1];
    const h = getElevation;
    const strip = (x0, z0, x1, z1, w, lift = 0.05) => P.drapedStrip(x0, z0, x1, z1, w, h, lift);
    const dashed = (ax, az, bx, bz, dash = 3, gap = 6, w = 0.15) => {
        const len = Math.hypot(bx - ax, bz - az);
        for (let s = 1.5; s + dash < len; s += dash + gap) {
            const t0 = s / len, t1 = (s + dash) / len;
            strip(ax + (bx - ax) * t0, az + (bz - az) * t0, ax + (bx - ax) * t1, az + (bz - az) * t1, w);
        }
    };

    // North-south streets: centre x = -585 + 100 i. Segments between intersections.
    for (let i = 0; i <= 9; i++) {
        const cx = -OFFSET + STREET_WIDTH / 2 + i * CELL_SIZE;
        for (let j = 0; j < GRID_STEPS; j++) {
            const zs = -OFFSET + j * CELL_SIZE + STREET_WIDTH, ze = zs + BLOCK_SIZE;
            P.setColor(...yellow);
            strip(cx - 0.2, zs + 5, cx - 0.2, ze - 5, 0.13);
            strip(cx + 0.2, zs + 5, cx + 0.2, ze - 5, 0.13);
            P.setColor(...white);
            dashed(cx - 7.2, zs + 5, cx - 7.2, ze - 5);
            dashed(cx + 7.2, zs + 5, cx + 7.2, ze - 5);
            strip(cx + 11.5, zs + 5, cx + 11.5, ze - 5, 0.12);   // parking lane lines
            strip(cx - 11.5, zs + 5, cx - 11.5, ze - 5, 0.12);
            // stop bars (right-hand traffic: +z traffic is on the +x side)
            strip(cx, ze - 4.6, cx + 14.5, ze - 4.6, 0.45);
            strip(cx - 14.5, zs + 4.6, cx, zs + 4.6, 0.45);
            // continental crosswalks at both ends
            for (let x = cx - 13.5; x <= cx + 13.5; x += 1.5) {
                strip(x, zs + 0.4, x, zs + 3.8, 0.7);
                strip(x, ze - 3.8, x, ze - 0.4, 0.7);
            }
            // cable car rails down Powell (-185) and California (115)
            if (Math.abs(cx + 185) < 1 || Math.abs(cx - 115) < 1) {
                P.setColor(...rail);
                for (const o of [-3.9, -2.4, 2.4, 3.9]) strip(cx + o, zs, cx + o, ze, 0.12, 0.04);
                strip(cx - 3.15, zs, cx - 3.15, ze, 0.05, 0.04);
                strip(cx + 3.15, zs, cx + 3.15, ze, 0.05, 0.04);
            }
        }
    }
    // East-west streets: centre z = -585 + 100 j
    for (let j = 0; j < GRID_STEPS; j++) {
        const cz = -OFFSET + STREET_WIDTH / 2 + j * CELL_SIZE;
        for (let i = 0; i <= 9; i++) {
            const xs = -OFFSET + i * CELL_SIZE + STREET_WIDTH, xe = Math.min(xs + BLOCK_SIZE, SHORE_X);
            if (xe - xs < 20) continue;
            P.setColor(...yellow);
            strip(xs + 5, cz - 0.2, xe - 5, cz - 0.2, 0.13);
            strip(xs + 5, cz + 0.2, xe - 5, cz + 0.2, 0.13);
            P.setColor(...white);
            dashed(xs + 5, cz - 7.2, xe - 5, cz - 7.2);
            dashed(xs + 5, cz + 7.2, xe - 5, cz + 7.2);
            strip(xs + 5, cz + 11.5, xe - 5, cz + 11.5, 0.12);
            strip(xs + 5, cz - 11.5, xe - 5, cz - 11.5, 0.12);
            strip(xe - 4.6, cz - 14.5, xe - 4.6, cz, 0.45);   // +x traffic drives on the -z side
            strip(xs + 4.6, cz, xs + 4.6, cz + 14.5, 0.45);
            for (let z = cz - 13.5; z <= cz + 13.5; z += 1.5) {
                strip(xs + 0.4, z, xs + 3.8, z, 0.7);
                if (xe === xs + BLOCK_SIZE) strip(xe - 3.8, z, xe - 0.4, z, 0.7);
            }
        }
    }
}

function buildWater(M) {
    const water = BABYLON.MeshBuilder.CreateGround('water', { width: 5000, height: 5000, subdivisions: 1 }, G.scene);
    water.position.y = WATER_Y;
    water.material = M.water;
    water.receiveShadows = true;
    water.isPickable = false;
    G.water = water;
}

function buildOceanBeach(B) {
    // Beach slope past the western edge: dry sand -> wet sand -> foam line -> under the Pacific
    const width = 110;
    B.sand.drapedGrid(-OFFSET - width, -OFFSET - 90, -OFFSET, OFFSET + 90, 34, 260, (x, z) => {
        const top = getElevation(-OFFSET, Math.max(-OFFSET, Math.min(OFFSET, z))) + 0.2;
        const t = (-OFFSET - x) / width;
        return top + (WATER_Y - 4 - top) * Math.pow(t, 0.75);
    }, 6, (x, z, y) => {
        let c = [1, 1, 1, 1];
        const wet = Math.min(1, Math.max(0, (WATER_Y + 2.6 - y) / 2.2));
        c = [1 - wet * 0.38, 1 - wet * 0.42, 1 - wet * 0.48, 1];
        if (y < WATER_Y + 0.55 && y > WATER_Y - 0.25) c = [1.25, 1.27, 1.3, 1]; // surf foam line
        return c;
    });
}

// ---------------------------------------------------------------------------------------------
// Victorian / Edwardian row houses

function buildVictorian(B, hx, hz, hy, hh, S, sx, sz, palIdx, rnd, paintedLadies) {
    const b = B.victorian[palIdx];
    const T = VICTORIAN_TILE, floorH = T.h / 2;
    const x0 = hx - S / 2, x1 = hx + S / 2, z0 = hz - S / 2, z1 = hz + S / 2;
    const floors = Math.max(3, Math.floor(hh / floorH));
    const yTop = hy + floors * floorH + 0.35;
    const yb = hy - 20;

    faceWalls(b, x0, z0, x1, z1, yb, yTop + 0.8, T, hy); // walls run up behind the cornice so it never shows a gap

    // Street-facing faces: the outer sides of this quarter of the block
    const faces = [];
    faces.push(sx < 0 ? { o: V(x0, 0, z0), t: V(0, 0, 1), n: V(-1, 0, 0) } : { o: V(x1, 0, z1), t: V(0, 0, -1), n: V(1, 0, 0) });
    faces.push(sz < 0 ? { o: V(x1, 0, z0), t: V(-1, 0, 0), n: V(0, 0, -1) } : { o: V(x0, 0, z1), t: V(1, 0, 0), n: V(0, 0, 1) });

    for (const f of faces) {
        // Two three-sided bay windows per street face, centred on window columns 2 and 5
        for (const along of [6.75, 20.25]) {
            const yBot = hy + (paintedLadies || rnd() < 0.6 ? floorH : 0.4);
            const yTopBay = yTop - 0.5;
            const fw = 2.9, dep = 1.15;
            const c = f.o.add(f.t.scale(along));
            const pL = c.add(f.t.scale(-fw / 2 - dep)), pR = c.add(f.t.scale(fw / 2 + dep));
            const fL = c.add(f.t.scale(-fw / 2)).add(f.n.scale(dep)), fR = c.add(f.t.scale(fw / 2)).add(f.n.scale(dep));
            const wallUV = (a, bb, len) => b.wall(a.x, a.z, bb.x, bb.z, yBot, yTopBay, T.w, T.h, 2.25 - len / 2, hy);
            wallUV(pL, fL, Math.hypot(dep, dep));
            wallUV(fL, fR, fw);
            wallUV(fR, pR, Math.hypot(dep, dep));
            // cap and base of the bay in trim colour
            const mid = c.add(f.n.scale(dep / 2));
            const rot = Math.atan2(f.t.x, f.t.z) - Math.PI / 2;
            b.box(mid.x, yTopBay + 0.25, mid.z, fw + dep * 2 + 0.3, 0.5, dep + 0.4, { fixedUV: [0.5, TRIM_V], rotY: rot });
            b.box(mid.x, yBot - 0.2, mid.z, fw + dep * 2, 0.4, dep + 0.2, { fixedUV: [0.5, TRIM_V], rotY: rot, bottom: true });
        }
        // Front door with stoop on the first street face
        if (f === faces[0]) {
            const c = f.o.add(f.t.scale(13.5)).add(f.n.scale(0.12));
            const rot = Math.atan2(f.t.x, f.t.z) - Math.PI / 2;
            b.box(c.x, hy + 2.45, c.z, 1.6, 2.8, 0.25, { fixedUV: [0.5, ACCENT_V], rotY: rot });
            b.box(c.x, hy + 4.05, c.z, 2.3, 0.4, 0.55, { fixedUV: [0.5, TRIM_V], rotY: rot });
            for (let s = 0; s < 3; s++) {
                const st = c.add(f.n.scale(0.5 + s * 0.45));
                b.box(st.x, hy + 0.15 + (2 - s) * 0.18, st.z, 2.2, 0.36 + (2 - s) * 0.36, 0.45, { fixedUV: [0.5, TRIM_V], rotY: rot, bottom: true });
            }
        }
        // Brackets under the cornice
        for (let a = 1; a < 27; a += 1.6) {
            const p = f.o.add(f.t.scale(a)).add(f.n.scale(0.35));
            const rot = Math.atan2(f.t.x, f.t.z) - Math.PI / 2;
            b.box(p.x, yTop + 0.15, p.z, 0.22, 0.7, 0.7, { fixedUV: [0.5, ACCENT_V], rotY: rot });
        }
    }

    // Cornice, then either a shingled hip roof or an Italianate flat roof behind a tall parapet
    const hip = !paintedLadies && rnd() < 0.45;
    trimRing(b, hx, hz, S, S, yTop + 0.5, 1.0, 0.75, 1.1);
    if (hip) {
        B.roofShingle.hipRoof(hx, hz, yTop + 1.4, S - 1, S - 1, 5.5 + rnd() * 2.5, rnd() * 10, 3.5, 0.4);
    } else {
        trimRing(b, hx, hz, S, S, yTop + 1.5, 1.3, 0.1, 0.5, [0.5, ACCENT_V]);
        B.flatRoof.box(hx, yTop + 1.6, hz, S - 0.4, 0.2, S - 0.4, { uv: 6 });
        if (paintedLadies) {
            // the Postcard Row's steep front gables
            const f = faces[1];
            const c = f.o.add(f.t.scale(13.5)).add(f.n.scale(-3));
            B.roofShingle.hipRoof(c.x, c.z, yTop + 1.5, 16, 8, 7, 8, 3.5, 0.5);
        }
        // a few rooftop vents
        for (let k = 0; k < 2; k++) {
            B.steel.box(hx + (rnd() - 0.5) * 16, yTop + 2.2, hz + (rnd() - 0.5) * 16, 1.2, 1.2, 1.2, { uv: 1 });
        }
    }
}

// ---------------------------------------------------------------------------------------------
// Downtown

function buildOfficeTower(B, bx, bz, groundY, w, d, h, rTex, rnd) {
    let style = ['glass', 'precast', 'brick', 'stone'][Math.floor(rTex * 4)];
    if (style === 'brick' && h > 95) style = 'precast';
    const b = B.downtown[style];
    const T = DOWNTOWN_TILES[style];
    const x0 = bx - w / 2, x1 = bx + w / 2, z0 = bz - d / 2, z1 = bz + d / 2;
    const gmin = Math.min(getElevation(x0, z0), getElevation(x1, z0), getElevation(x0, z1), getElevation(x1, z1));
    const yb = groundY - 30;
    const shopTop = gmin + 5;
    const top = groundY + h;

    // Shops along the ground floor, office floors above
    faceWalls(B.storefront, x0, z0, x1, z1, yb, shopTop, STOREFRONT_TILE, gmin);
    B.storefront.box(bx, shopTop + 0.3, bz, w + 0.8, 0.6, d + 0.8, { fixedUV: [0.5, TRIM_V], top: false, bottom: true });

    const setback = h > 95;
    const shaftTop = setback ? groundY + h * 0.74 : top;
    faceWalls(b, x0, z0, x1, z1, shopTop, shaftTop, T, shopTop);
    let cx0 = x0, cx1 = x1, cz0 = z0, cz1 = z1;
    if (setback) {
        trimRing(b, bx, bz, w, d, shaftTop - 0.2, 1.2, 0.4, 1.2);
        b.box(bx, shaftTop + 0.6, bz, w, 0.2, d, { fixedUV: [0.5, TRIM_V] });
        cx0 += 4; cx1 -= 4; cz0 += 4; cz1 -= 4;
        faceWalls(b, cx0, cz0, cx1, cz1, shaftTop, top, T, shopTop);
    }
    const cw = cx1 - cx0, cd = cz1 - cz0;
    // Crown: cornice for masonry, slim parapet for glass
    if (style === 'stone' || style === 'brick') trimRing(b, bx, bz, cw, cd, top - 0.4, 1.6, 1.1, 1.5);
    else trimRing(b, bx, bz, cw, cd, top, 1.2, 0.05, 0.6);
    B.flatRoof.box(bx, top + 0.1, bz, cw - 1, 0.2, cd - 1, { uv: 8 });

    // Rooftop: mechanical penthouse, AC units, antennas, water tank on brick buildings
    const pw = cw * (0.3 + rnd() * 0.2), pd = cd * (0.3 + rnd() * 0.2);
    const px = bx + (rnd() - 0.5) * (cw - pw) * 0.5, pz = bz + (rnd() - 0.5) * (cd - pd) * 0.5;
    B.downtown.precast.box(px, top + 3.2, pz, pw, 6, pd, { uv: 8, vOrigin: top + 0.2 });
    for (let k = 0; k < 4 + Math.floor(rnd() * 4); k++) {
        const ux = bx + (rnd() - 0.5) * (cw - 8), uz = bz + (rnd() - 0.5) * (cd - 8);
        if (Math.abs(ux - px) < pw / 2 + 2 && Math.abs(uz - pz) < pd / 2 + 2) continue;
        B.steel.box(ux, top + 1.1, uz, 2.6 + rnd() * 2, 1.8, 1.8 + rnd() * 2, { uv: 2 });
        B.darkMetal.box(ux, top + 2.05, uz, 1.4, 0.1, 1.4, { uv: 2 });
    }
    if (h > 110) {
        B.darkMetal.box(px, top + 6.2 + 9, pz, 0.35, 18, 0.35, { uv: 2 });
        B.redBeacon.box(px, top + 24.4, pz, 0.7, 0.7, 0.7, { uv: 1 });
    }
    if (style === 'brick') {
        const tx = x0 + 9, tz = z1 - 9;
        const tank = [];
        for (let k = 0; k < 2; k++) {
            const y = top + 4 + k * 4.5, ring = [];
            for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; ring.push(V(tx + Math.cos(a) * 2.6, y, tz - Math.sin(a) * 2.6)); }
            tank.push(ring);
        }
        B.brick.lathe(tank, 2, 2);
        B.roofShingle.hipRoof(tx, tz, top + 8.5, 4.6, 4.6, 1.6, 0, 2, 0.2);
        for (const [ox, oz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) B.darkMetal.box(tx + ox, top + 2, tz + oz, 0.25, 4, 0.25, { uv: 1 });
    }

    // Canvas awnings over some of the shops
    const awningColors = [[0.55, 0.12, 0.14], [0.12, 0.3, 0.22], [0.12, 0.2, 0.36], [0.6, 0.45, 0.15], [0.15, 0.15, 0.16]];
    const awningFace = (ox, oz, tx, tz, nx, nz, len) => {
        for (let a = 3; a < len - 3; a += 6) {
            if (rnd() < 0.45) continue;
            const col = awningColors[Math.floor(rnd() * awningColors.length)];
            B.awning.setColor(...col, 1);
            const cx = ox + tx * (a + 3), cz = oz + tz * (a + 3);
            const y = getElevation(cx, cz) + 3.6;
            const half = 2.6;
            const p0 = V(cx - tx * half, y + 0.9, cz - tz * half), p1 = V(cx + tx * half, y + 0.9, cz + tz * half);
            const p2 = V(cx + tx * half + nx * 1.8, y, cz + tz * half + nz * 1.8), p3 = V(cx - tx * half + nx * 1.8, y, cz - tz * half + nz * 1.8);
            B.awning.quad(p3, p2, p1, p0);
            B.awning.quad(p3, p2, V(p2.x, p2.y - 0.35, p2.z), V(p3.x, p3.y - 0.35, p3.z));
        }
    };
    awningFace(x0, z0, 1, 0, 0, -1, w);
    awningFace(x0, z1, 1, 0, 0, 1, w);
    awningFace(x0, z0, 0, 1, -1, 0, d);
    awningFace(x1, z0, 0, 1, 1, 0, d);
}

function buildSalesforceTower(B, bx, bz, groundY) {
    // Tapered, rounded obelisk in curtain-wall glass with a white lattice crown
    const H = 315, base = groundY - 10;
    const rings = [];
    const levels = 24, seg = 48;
    const shape = (t) => {
        const taper = 1 - t * 0.26;
        const half = 20 * taper, r = 7 * taper;
        return { half, r };
    };
    for (let k = 0; k <= levels; k++) {
        const t = k / levels, y = base + t * (H - 26);
        const { half, r } = shape(t);
        const ring = [];
        for (let i = 0; i < seg; i++) {
            // rounded square: a superellipse traced with decreasing angle (outward winding)
            const a = -i / seg * Math.PI * 2;
            const c = Math.cos(a), s = Math.sin(a);
            const e = 0.25;
            const x = Math.sign(c) * Math.pow(Math.abs(c), e) * half;
            const z = Math.sign(s) * Math.pow(Math.abs(s), e) * half;
            const l = Math.hypot(x, z) || 1;
            const k2 = Math.min(1, (half + r * 0.4) / l);
            ring.push(V(bx + x * k2, y, bz + z * k2));
        }
        rings.push(ring);
    }
    B.downtown.glass.lathe(rings, DOWNTOWN_TILES.glass.w, DOWNTOWN_TILES.glass.h);
    // crown: vertical white fins forming a lattice cage around a glass core
    const topY = base + H - 26;
    const { half } = shape(1);
    for (let i = 0; i < 40; i++) {
        const a = i / 40 * Math.PI * 2;
        const x = bx + Math.cos(a) * (half + 0.4), z = bz + Math.sin(a) * (half + 0.4);
        B.white.box(x, topY + 13, z, 0.5, 26, 0.9, { rotY: -a, uv: 4 });
    }
    for (let y = 0; y < 26; y += 4.5) trimRing(B.white, bx, bz, half * 2 + 0.4, half * 2 + 0.4, topY + y, 0.35, 0.5, 0.3, [0, 0]);
    B.towerGlass.box(bx, topY + 11, bz, half * 1.6, 22, half * 1.6, { uv: 6 });
    B.flatRoof.box(bx, topY + 0.2, bz, half * 2, 0.4, half * 2, { uv: 6 });
}

function buildTransamerica(B, bx, bz, groundY) {
    const H = 285, base = groundY - 10, a = 24;
    const apex = V(bx, base + H, bz);
    const b = B.downtown.precast, T = DOWNTOWN_TILES.precast;
    const corners = [V(bx - a, base, bz + a), V(bx + a, base, bz + a), V(bx + a, base, bz - a), V(bx - a, base, bz - a)];
    for (let i = 0; i < 4; i++) {
        const p0 = corners[i], p1 = corners[(i + 1) % 4];
        // split each face in horizontal bands so windows keep their real size as the face narrows
        const bands = 30;
        for (let k = 0; k < bands; k++) {
            const t0 = k / bands, t1 = (k + 1) / bands;
            const l0 = BABYLON.Vector3.Lerp(p0, apex, t0), r0 = BABYLON.Vector3.Lerp(p1, apex, t0);
            const l1 = BABYLON.Vector3.Lerp(p0, apex, t1), r1 = BABYLON.Vector3.Lerp(p1, apex, t1);
            const w0 = BABYLON.Vector3.Distance(l0, r0), w1 = BABYLON.Vector3.Distance(l1, r1);
            // u is real metres from the face centre line, so window columns stay vertical and full-size
            const mid = 24 / T.w, v0 = (l0.y - base) / T.h, v1 = (l1.y - base) / T.h;
            const uL0 = mid - w0 / 2 / T.w, uR0 = mid + w0 / 2 / T.w, uL1 = mid - w1 / 2 / T.w, uR1 = mid + w1 / 2 / T.w;
            if (k < bands - 1) {
                b.tri(l0, r0, r1, [uL0, v0], [uR0, v0], [uR1, v1]);
                b.tri(l0, r1, l1, [uL0, v0], [uR1, v1], [uL1, v1]);
            } else {
                b.tri(l0, r0, apex, [uL0, v0], [uR0, v0], [mid, (apex.y - base) / T.h]);
            }
        }
    }
    // the two "wings" (elevator and stair shafts) that rise up the sides
    b.box(bx, groundY + 55, bz, 16, 130, 52, { uv: T.w, vOrigin: base });
    b.box(bx, groundY + 55, bz, 52, 130, 16, { uv: T.w, vOrigin: base });
    // crown spire
    const sp = [];
    for (let k = 0; k <= 1; k++) {
        const r = k === 0 ? 4.5 : 0.3, y = base + H - 34 + k * 40, ring = [];
        for (let i = 0; i < 4; i++) { const an = -i / 4 * Math.PI * 2 + Math.PI / 4; ring.push(V(bx + Math.cos(an) * r, y, bz + Math.sin(an) * r)); }
        sp.push(ring);
    }
    B.white.lathe(sp, 2, 2);
    // plaza
    B.sandstone.box(bx, groundY - 0.5, bz, 66, 1.6, 66, { uv: 4 });
}

function buildCoitTower(B, bx, bz, groundY) {
    const H = 135, base = groundY - 2;
    const rings = [];
    for (let k = 0; k <= 14; k++) {
        const t = k / 14, y = base + t * H;
        const R = 13 - t * 2.5;
        const ring = [];
        for (let i = 0; i < 64; i++) {
            const a = -i / 64 * Math.PI * 2;
            const r = R * (1 + 0.035 * Math.cos(a * 16));   // fluting
            ring.push(V(bx + Math.cos(a) * r, y, bz + Math.sin(a) * r));
        }
        rings.push(ring);
    }
    B.sandstone.lathe(rings, 5, 5);
    // belvedere: ring of arched openings (dark glass) under the crown
    const bel = [];
    for (let k = 0; k <= 1; k++) {
        const ring = [];
        for (let i = 0; i < 48; i++) { const a = -i / 48 * Math.PI * 2; ring.push(V(bx + Math.cos(a) * 10.7, base + H + k * 9, bz + Math.sin(a) * 10.7)); }
        bel.push(ring);
    }
    B.towerGlass.lathe(bel, 3, 3);
    for (let i = 0; i < 16; i++) {
        const a = i / 16 * Math.PI * 2;
        B.sandstone.box(bx + Math.cos(a) * 10.9, base + H + 4.5, bz + Math.sin(a) * 10.9, 1.4, 9, 1.4, { uv: 4, rotY: -a });
    }
    const crown = [];
    for (const [r, y] of [[11.4, H + 9], [11.6, H + 11], [9.5, H + 13], [8, H + 14]]) {
        const ring = [];
        for (let i = 0; i < 48; i++) { const a = -i / 48 * Math.PI * 2; ring.push(V(bx + Math.cos(a) * r, base + y, bz + Math.sin(a) * r)); }
        crown.push(ring);
    }
    B.sandstone.lathe(crown, 5, 5);
    B.sandstone.box(bx, groundY + 4, bz, 26, 12, 26, { uv: 5 });
    B.flatRoof.box(bx, base + H + 14, bz, 15, 0.3, 15, { uv: 4 });
}

// ---------------------------------------------------------------------------------------------
// Parks, waterfront and the rest of the skyline

function buildGoldenGatePark(B, parkBlocks, props, rnd) {
    for (const { gx, bx, bz } of parkBlocks) {
        const half = BLOCK_SIZE / 2 - 3;
        B.grass.drapedGrid(bx - half, bz - half, bx + half, bz + half, 18, 18, (x, z) => getElevation(x, z) + 0.12, 5,
            (x, z) => {
                const n = 0.9 + 0.12 * Math.sin(x * 0.21 + z * 0.13) * Math.cos(z * 0.17 - x * 0.05);
                return [n, n, n * 0.95, 1];
            });
        const keepClear = [];
        if (gx === 0) {
            buildWindmill(B, bx + 12, bz, getElevation(bx + 12, bz));
            buildTulipGarden(B, bx + 12, bz);
            keepClear.push([bx + 12, bz, 15]);
        } else if (gx === 2) {
            // Stow Lake: water disc with a wooded island
            const lake = BABYLON.MeshBuilder.CreateDisc('stowLake', { radius: 20, tessellation: 48, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, G.scene);
            lake.rotation.x = Math.PI / 2;
            lake.position.set(bx, getElevation(bx, bz) + 0.2, bz);
            lake.material = G.materials.water;
            lake.isPickable = false;
            keepClear.push([bx, bz, 22]);
            for (let i = 0; i < 4; i++) props.cypress.push({ x: bx + (rnd() - 0.5) * 6, z: bz + (rnd() - 0.5) * 6, s: 0.7 + rnd() * 0.3 });
        } else if (gx === 3) {
            buildConservatory(B, bx, bz, getElevation(bx, bz));
            buildFlowerParterre(B, bx, bz + 17);
            keepClear.push([bx, bz, 20], [bx, bz + 17, 14]);
        }
        for (let i = 0; i < 26; i++) {
            const x = bx + (rnd() - 0.5) * (half * 2 - 6), z = bz + (rnd() - 0.5) * (half * 2 - 6);
            if (keepClear.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r)) continue;
            const r = rnd();
            if (r < 0.35) props.cypress.push({ x, z, s: 0.8 + rnd() * 0.5 });
            else props.trees.push({ x, z, s: 0.9 + rnd() * 0.6 });
        }
    }
}

const FLOWER_COLORS = [[0.95, 0.12, 0.2], [1.0, 0.55, 0.75], [1.0, 0.82, 0.15], [0.98, 0.45, 0.1], [0.6, 0.3, 0.85], [1, 1, 0.95]];

// A low hedge-bordered bed filled with blooms in one colour (beds are cosmetic: no collision box)
function flowerBed(B, x, z, w, d, color, rotY = 0) {
    const y = getElevation(x, z);
    B.hedge.setColor(0.16, 0.4, 0.12);
    B.hedge.box(x, y + 0.3, z, w + 0.6, 0.6, d + 0.6, { uv: 2, rotY });
    B.hedge.setColor(...color);
    B.hedge.box(x, y + 0.75, z, w, 0.5, d, { uv: 2, rotY });
}

// Queen Wilhelmina Tulip Garden: a ring of beds around the Dutch Windmill
function buildTulipGarden(B, x, z) {
    for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2;
        flowerBed(B, x + Math.cos(a) * 11, z + Math.sin(a) * 11, 4.2, 1.6, FLOWER_COLORS[i % 5], Math.PI / 2 - a);
    }
}

// Formal parterre in front of the Conservatory of Flowers
function buildFlowerParterre(B, x, z) {
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 5; col++) {
            flowerBed(B, x - 16 + col * 8, z - 5 + row * 5, 5.5, 2.6, FLOWER_COLORS[(row * 2 + col) % FLOWER_COLORS.length]);
        }
    }
}

function buildWindmill(B, x, z, y) {
    // Dutch Windmill: tapered octagonal tower, cap, and four lattice sails (G.windmill spins them)
    const rings = [];
    for (const [r, h] of [[7, 0], [6.2, 10], [4.4, 24]]) {
        const ring = [];
        for (let i = 0; i < 8; i++) { const a = -i / 8 * Math.PI * 2; ring.push(V(x + Math.cos(a) * r, y + h, z + Math.sin(a) * r)); }
        rings.push(ring);
    }
    B.white.lathe(rings, 3, 3);
    B.roofShingle.hipRoof(x, z, y + 24, 8, 8, 5, 3, 2, 0.2);
    const sails = new BABYLON.TransformNode('windmillSails', G.scene);
    sails.position.set(x, y + 25, z + 5);
    const mat = G.materials.white;
    for (let k = 0; k < 4; k++) {
        const arm = BABYLON.MeshBuilder.CreateBox('sail', { width: 0.5, height: 15, depth: 0.3 }, G.scene);
        arm.position.y = 7.5;
        const lattice = BABYLON.MeshBuilder.CreateBox('lattice', { width: 2.6, height: 11, depth: 0.12 }, G.scene);
        lattice.position.set(1.4, 8.5, 0);
        lattice.material = G.materials.bark;
        arm.material = mat;
        const pivot = new BABYLON.TransformNode('sailPivot', G.scene);
        pivot.parent = sails;
        pivot.rotation.z = k * Math.PI / 2;
        arm.parent = pivot; lattice.parent = pivot;
        G.shadows?.addShadowCaster(arm); G.shadows?.addShadowCaster(lattice);
    }
    G.windmill = sails;
}

function buildConservatory(B, x, z, y) {
    // Conservatory of Flowers: white frame wings and a central glass dome
    B.white.box(x, y + 3.5, z, 40, 7, 10, { uv: 3 });
    B.towerGlass.box(x, y + 4, z, 38, 6, 10.4, { uv: 3 });
    const dome = [];
    for (let k = 0; k <= 8; k++) {
        const t = k / 8, r = 9 * Math.cos(t * Math.PI / 2) + 0.01, ring = [];
        for (let i = 0; i < 24; i++) { const a = -i / 24 * Math.PI * 2; ring.push(V(x + Math.cos(a) * r, y + 8 + Math.sin(t * Math.PI / 2) * 9, z + Math.sin(a) * r)); }
        dome.push(ring);
    }
    B.towerGlass.lathe(dome, 3, 3);
    for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2;
        B.white.box(x + Math.cos(a) * 9.1, y + 8, z + Math.sin(a) * 9.1, 0.4, 2, 0.4, { uv: 1 });
    }
    B.white.box(x, y + 7.5, z, 19, 1, 19, { uv: 3 });
}

function buildGoldenGateBridge(B) {
    // Backdrop beyond the northern shore: two art-deco towers, deck, catenary cables, suspenders
    const bz = -705, deckY = 76, towers = [-185, 35];
    const O = B.intlOrange;
    for (const tx of towers) {
        B.sandstone.box(tx, 8, bz, 30, 26, 46, { uv: 5 });
        for (const lz of [-14, 14]) {
            // stepped legs: each stage a little slimmer
            const stages = [[12, 10, 0, 90], [11, 9, 90, 170], [10, 8.2, 170, 250], [9, 7.4, 250, 318]];
            for (const [w, d, y0, y1] of stages) O.box(tx, y0 + (y1 - y0) / 2, bz + lz, w, y1 - y0, d, { uv: 4 });
            // vertical recessed ribs
            for (const ox of [-3, 3]) B.darkMetal.box(tx + ox, 200, bz + lz + (lz < 0 ? -4.6 : 4.6), 0.8, 230, 0.4, { uv: 4 });
        }
        for (const y of [deckY + 18, 160, 235, 300]) O.box(tx, y, bz, 10, 12, 30, { uv: 4 });
        B.redBeacon.box(tx, 322, bz - 14, 1.2, 1.2, 1.2);
        B.redBeacon.box(tx, 322, bz + 14, 1.2, 1.2, 1.2);
    }
    // deck with truss stiffening girders
    O.box(-75, deckY, bz, 1100, 3, 30, { uv: 4, bottom: true });
    for (const side of [-15, 15]) O.box(-75, deckY - 4, bz + side, 1100, 6, 1, { uv: 4, bottom: true });
    for (let x = -620; x <= 470; x += 8) O.box(x, deckY - 4, bz, 0.8, 6, 30, { uv: 4 });
    // main cables: catenary between towers and out to the anchorages
    const cableY = (x) => {
        if (x >= towers[0] && x <= towers[1]) {
            const m = (towers[0] + towers[1]) / 2, half = (towers[1] - towers[0]) / 2;
            return deckY + 8 + (312 - deckY - 8) * Math.pow((x - m) / half, 2);
        }
        const tx = x < towers[0] ? towers[0] : towers[1];
        const end = x < towers[0] ? -620 : 470;
        const t = (x - tx) / (end - tx);
        return 312 + (deckY + 2 - 312) * Math.pow(t, 0.8);
    };
    for (const side of [-14, 14]) {
        let seg = 0;
        for (let x = -620; x < 470; x += 6, seg++) {
            const y0 = cableY(x), y1 = cableY(x + 6);
            const len = Math.hypot(6, y1 - y0);
            const ang = Math.atan2(y1 - y0, 6);
            // a short box rotated in the x-y plane
            const cx = x + 3, cy = (y0 + y1) / 2;
            const c = Math.cos(ang), s = Math.sin(ang), hw = len / 2, hh = 0.9;
            const P = (u, v, w) => V(cx + u * c - v * s, cy + u * s + v * c, bz + side + w);
            O.quad(P(-hw, -hh, 0.9), P(hw, -hh, 0.9), P(hw, hh, 0.9), P(-hw, hh, 0.9));
            O.quad(P(hw, -hh, -0.9), P(-hw, -hh, -0.9), P(-hw, hh, -0.9), P(hw, hh, -0.9));
            O.quad(P(-hw, hh, 0.9), P(hw, hh, 0.9), P(hw, hh, -0.9), P(-hw, hh, -0.9));
            O.quad(P(-hw, -hh, -0.9), P(hw, -hh, -0.9), P(hw, -hh, 0.9), P(-hw, -hh, 0.9));
            if (seg % 2 === 0) {
                const sy = cableY(x);
                if (sy > deckY + 3) O.box(x, (deckY + sy) / 2, bz + side, 0.35, sy - deckY, 0.35, { uv: 2 });
            }
        }
    }
}

function buildBayBridge(B) {
    // Western span of the Bay Bridge east of the city: silver-grey suspension towers
    const bx = 560, deckY = 44, towers = [-260, 40, 340];
    const S = B.steelGrey;
    for (const tz of towers) {
        B.sandstone.box(bx, 4, tz, 34, 14, 22, { uv: 5 });
        for (const lx of [-11, 11]) S.box(bx + lx, 95, tz, 5, 190, 7, { uv: 4 });
        for (const y of [deckY + 8, 100, 150, 186]) S.box(bx, y, tz, 26, 4, 5, { uv: 4 });
        B.redBeacon.box(bx - 11, 191, tz, 1.2, 1.2, 1.2);
        B.redBeacon.box(bx + 11, 191, tz, 1.2, 1.2, 1.2);
    }
    S.box(bx, deckY, 0, 30, 4, 1600, { uv: 4, bottom: true });
    for (const side of [-14, 14]) S.box(bx + side, deckY - 4, 0, 1, 6, 1600, { uv: 4, bottom: true });
    for (let i = 0; i < towers.length - 1; i++) {
        const a = towers[i], b = towers[i + 1], m = (a + b) / 2, half = (b - a) / 2;
        for (let z = a; z < b; z += 10) {
            const y = deckY + 6 + (186 - deckY - 6) * Math.pow((z + 5 - m) / half, 2);
            for (const lx of [-11, 11]) {
                S.box(bx + lx, y, z + 5, 1.2, 1.2, 10.4, { uv: 2 });
                S.box(bx + lx, (deckY + y) / 2, z + 5, 0.25, y - deckY, 0.25, { uv: 2 });
            }
        }
    }
}

function buildFerryBuilding(B) {
    const fx = 428, fz = 15, fy = Math.max(1.5, getElevation(fx, fz));
    B.sandstone.box(fx + 8, fy - 2, fz, 46, 4, 160, { uv: 5 });       // pier deck
    B.sandstone.box(fx, fy + 8, fz, 22, 16, 140, { uv: 5, vOrigin: fy });
    B.roofShingle.hipRoof(fx, fz, fy + 16, 22, 140, 4, 120, 4, 0.8);
    for (let z = fz - 66; z <= fz + 66; z += 6) B.towerGlass.box(fx - 11.1, fy + 9, z, 0.3, 7, 3.6, { uv: 2 });
    // clock tower
    B.sandstone.box(fx, fy + 34, fz, 13, 36, 13, { uv: 5, vOrigin: fy });
    B.sandstone.box(fx, fy + 55, fz, 11, 8, 11, { uv: 5 });
    for (const [ox, oz] of [[-5.6, 0], [5.6, 0], [0, -5.6], [0, 5.6]]) {
        B.white.box(fx + ox, fy + 46, fz + oz, ox ? 0.3 : 5, 5, oz ? 0.3 : 5, { uv: 5 });
    }
    B.roofShingle.hipRoof(fx, fz, fy + 59, 11, 11, 14, 0, 3, 0.4);
}

function buildSutroTower(B) {
    // On the southern hills beyond the grid (the original three.js game's spot overlaps a block of houses)
    const sx = -430, sz = 628;
    const top = getElevation(sx, OFFSET), t = (sz - OFFSET) / 90;
    const sy = top + (WATER_Y - 5 - top) * Math.pow(t, 1.6);
    const red = B.intlOrange, white = B.white;
    for (let k = 0; k < 3; k++) {
        const a = k / 3 * Math.PI * 2;
        for (let s = 0; s < 10; s++) {
            const y0 = s * 25, y1 = y0 + 25;
            const r0 = 15 - s * 1.0, r1 = 15 - (s + 1) * 1.0;
            const x = sx + Math.cos(a) * (r0 + r1) / 2, z = sz + Math.sin(a) * (r0 + r1) / 2;
            (s % 2 === 0 ? red : white).box(x, sy + (y0 + y1) / 2, z, 2.2, 25, 2.2, { uv: 3 });
        }
        B.darkMetal.box(sx + Math.cos(a) * 5, sy + 262, sz + Math.sin(a) * 5, 0.8, 24, 0.8, { uv: 3 });
        B.redBeacon.box(sx + Math.cos(a) * 5, sy + 275, sz + Math.sin(a) * 5, 1, 1, 1);
    }
    for (const y of [60, 125, 190, 248]) {
        const r = 15 - y / 25;
        for (let k = 0; k < 3; k++) {
            const a0 = k / 3 * Math.PI * 2, a1 = (k + 1) / 3 * Math.PI * 2;
            const p0 = V(sx + Math.cos(a0) * r, 0, sz + Math.sin(a0) * r), p1 = V(sx + Math.cos(a1) * r, 0, sz + Math.sin(a1) * r);
            const m = p0.add(p1).scale(0.5), len = BABYLON.Vector3.Distance(p0, p1);
            white.box(m.x, sy + y, m.z, len, 2.5, 1.2, { uv: 3, rotY: -Math.atan2(p1.z - p0.z, p1.x - p0.x) });
        }
    }
}

function buildLombardStreet(B) {
    // Flower-lined switchback planters along the crooked block
    for (let i = 0; i < 5; i++) {
        const z = 42 + i * 11;
        for (const sideX of [-102.2, -67.8]) {
            const y = getElevation(sideX, z) + SIDEWALK_H;
            B.brick.box(sideX, y + 0.4, z, 2.4, 0.8, 6.5, { uv: 2, bottom: true });
            B.hedge.setColor(0.2, 0.42, 0.18);
            B.hedge.box(sideX, y + 1.2, z, 2.0, 0.9, 6.0, { uv: 2 });
            for (let f = 0; f < 6; f++) {
                const c = [[0.85, 0.15, 0.3], [0.95, 0.5, 0.7], [0.95, 0.85, 0.3]][f % 3];
                B.hedge.setColor(...c);
                B.hedge.box(sideX + (f % 2 - 0.5) * 0.9, y + 1.75, z - 2.4 + f * 0.95, 0.6, 0.3, 0.6, { uv: 1 });
            }
        }
    }
}

function buildCrane(B) {
    // Tower crane over the block next to the Pyramid: lattice mast, jib, counter-jib, cab
    const cx = 165, cz = 65, cy = getElevation(cx, cz);
    const C = B.crane, H = 112;
    const s = 2.2;
    for (const [ox, oz] of [[-s, -s], [s, -s], [s, s], [-s, s]]) C.box(cx + ox, cy + H / 2, cz + oz, 0.35, H, 0.35, { uv: 2 });
    for (let y = 2; y < H; y += 3.2) {
        C.box(cx, cy + y, cz - s, s * 2, 0.2, 0.2, { uv: 2 });
        C.box(cx, cy + y, cz + s, s * 2, 0.2, 0.2, { uv: 2 });
        C.box(cx - s, cy + y, cz, 0.2, 0.2, s * 2, { uv: 2 });
        C.box(cx + s, cy + y, cz, 0.2, 0.2, s * 2, { uv: 2 });
    }
    C.box(cx + 26, cy + H + 1.2, cz, 62, 1.6, 1.8, { uv: 2 });
    C.box(cx - 12, cy + H + 1.2, cz, 22, 1.6, 2.4, { uv: 2 });
    B.sandstone.box(cx - 19, cy + H - 0.8, cz, 6, 3.5, 3, { uv: 2 });
    C.box(cx, cy + H + 6, cz, 1.2, 10, 1.2, { uv: 2 });
    B.towerGlass.box(cx + 3.5, cy + H - 2, cz, 2.6, 2.6, 2.6, { uv: 2 });
    B.darkMetal.box(cx + 40, cy + H - 22, cz, 0.12, 44, 0.12, { uv: 2 });
    B.darkMetal.box(cx + 40, cy + H - 44.5, cz, 1.4, 1, 1.4, { uv: 2 });
}

// ---------------------------------------------------------------------------------------------
// Street furniture positions (instanced by props.js)

function collectStreetProps(props, gx, gz, cellX, cellZ, rnd, park) {
    const cornerX = cellX + STREET_WIDTH, cornerZ = cellZ + STREET_WIDTH;
    if (cornerX >= 370) return;
    const palmsHere = gx >= 6 || gz === 5;
    const y = (x, z) => getElevation(x, z) + SIDEWALK_H;

    // Lamps at each corner and mid-block on the north & west edges
    for (const [lx, lz] of [[cornerX + 2.2, cornerZ + 2.2], [cornerX + BLOCK_SIZE / 2, cornerZ + 1.6], [cornerX + 1.6, cornerZ + BLOCK_SIZE / 2]]) {
        if (!isInsideRoadway(lx, lz, 0.5)) props.lamps.push({ x: lx, y: y(lx, lz), z: lz, ry: lz === cornerZ + 1.6 ? 0 : Math.PI / 2 });
    }
    // Traffic signal at the north-west corner of every block (heads face both streets)
    const sx = cornerX + 1.4, sz = cornerZ + 1.4;
    props.signals.push({ x: sx, y: y(sx, sz), z: sz });

    // Street trees along all four edges, 2.4 m in from the curb
    const inset = 2.4;
    const edges = [
        (t) => [cornerX + t, cornerZ + inset], (t) => [cornerX + t, cornerZ + BLOCK_SIZE - inset],
        (t) => [cornerX + inset, cornerZ + t], (t) => [cornerX + BLOCK_SIZE - inset, cornerZ + t],
    ];
    if (!park) {
        for (const e of edges) {
            for (const t of [14, 28, 42, 56]) {
                if (rnd() < 0.3) continue;
                const [tx, tz] = e(t + (rnd() - 0.5) * 2);
                const list = palmsHere ? props.palms : props.trees;
                list.push({ x: tx, z: tz, s: 0.85 + rnd() * 0.35 });
            }
        }
        if (rnd() < 0.35) {
            const [ux, uz] = edges[Math.floor(rnd() * 4)](8 + rnd() * 54);
            props.utility.push({ x: ux, y: y(ux, uz), z: uz, ry: Math.floor(rnd() * 4) * Math.PI / 2 });
        }
    }

    // Parking lanes: 12.6 m off the street centre line, on the curb next to this block
    const laneN = cellZ + STREET_WIDTH / 2 + 12.6;   // E-W street north of the block
    const laneW = cellX + STREET_WIDTH / 2 + 12.6;   // N-S street west of the block
    for (let k = 0; k < 3; k++) {
        if (rnd() < 0.45) {
            const x = cornerX + 8 + rnd() * (BLOCK_SIZE - 16);
            props.parked.push({ x, z: laneN, a: Math.PI / 2 + (rnd() < 0.5 ? 0 : Math.PI), c: Math.floor(rnd() * 6) });
        }
        if (rnd() < 0.45) {
            const z = cornerZ + 8 + rnd() * (BLOCK_SIZE - 16);
            props.parked.push({ x: laneW, z, a: rnd() < 0.5 ? 0 : Math.PI, c: Math.floor(rnd() * 6) });
        }
    }
}
