// Materials: Poly Haven PBR textures + procedurally painted facade atlases.
//
// Facades are drawn on canvases at load time: a real Poly Haven surface (clapboard, plaster,
// brick, sandstone) is the wall, and windows / trim / storefronts are painted on top, together
// with matching normal and AO-roughness-metal maps. Glass gets low roughness so it reflects
// the HDRI sky, and per-pane variation breaks up the reflections the way real windows do.
//
// Every facade atlas reserves its bottom band (v in [0, TRIM_V1]) as solid trim colour, so
// cornices, bay-window frames and parapets can sample it and share the wall's draw call.

import { G, mulberry32 } from './shared.js';

const TEX = 'assets/textures/';
export const TRIM_V = 0.012;        // UV v for solid trim colour inside every facade atlas
export const ACCENT_V = 0.033;      // UV v for the accent pin-stripe (Victorians)

let loadTracker = { total: 0, done: 0, onProgress: null };
export function setLoadProgressHandler(fn) { loadTracker.onProgress = fn; }
function track(promise) {
    loadTracker.total++;
    loadTracker.onProgress?.(loadTracker.done, loadTracker.total);
    return promise.finally(() => {
        loadTracker.done++;
        loadTracker.onProgress?.(loadTracker.done, loadTracker.total);
    });
}

export function loadImage(url) {
    return track(new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        // A missing asset (e.g. a deploy that skipped scripts/fetch_assets.py) must not stop the
        // game from booting and connecting: paint with a plain light surface instead
        img.onerror = () => {
            console.warn('failed to load ' + url + ', using a plain surface');
            const c = makeCanvas(64);
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#d9d6cf';
            ctx.fillRect(0, 0, 64, 64);
            resolve(c);
        };
        img.src = url;
    }));
}

function anisotropy() { return G.quality === 'low' ? 4 : 16; }

// 4x4 single-colour stand-ins for a Poly Haven map: neutral albedo, flat normal, AO 1 / rough / non-metal
const FLAT_MAPS = { diff: '#9a9890', nor: 'rgb(128,128,255)', arm: 'rgb(255,235,0)' };
const flatMapURLs = {};
function flatMapURL(suffix) {
    if (!flatMapURLs[suffix]) {
        const c = makeCanvas(4);
        const ctx = c.getContext('2d');
        ctx.fillStyle = FLAT_MAPS[suffix];
        ctx.fillRect(0, 0, 4, 4);
        flatMapURLs[suffix] = c.toDataURL('image/png');
    }
    return flatMapURLs[suffix];
}

// Poly Haven texture set as a Babylon texture (waits for load so the start button knows when we're ready)
export function phTexture(name, suffix, { linear = false } = {}) {
    const scene = G.scene;
    let tex;
    const p = new Promise((resolve) => {
        tex = new BABYLON.Texture(`${TEX}${name}_${suffix}.jpg`, scene, {
            noMipmap: false,
            invertY: true,
            samplingMode: BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
            onLoad: resolve,
            onError: () => {
                // missing asset: a flat map instead of Babylon's red/black error checkerboard
                console.warn(`failed to load ${TEX}${name}_${suffix}.jpg, using a flat map`);
                setTimeout(() => tex.updateURL(flatMapURL(suffix)));
                resolve();
            },
        });
    });
    track(p);
    tex.anisotropicFilteringLevel = anisotropy();
    tex.gammaSpace = !linear;
    tex.wrapU = tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
    return tex;
}

// Full PBR material from a Poly Haven set. UVs are expected in world units / uvScale already.
export function phMaterial(name, { tint = null, bump = 1.0, roughness = 1.0, metallic = 0, uScale = 1, vScale = 1, albedoBoost = 1 } = {}) {
    const m = new BABYLON.PBRMaterial(name, G.scene);
    m.albedoTexture = phTexture(name, 'diff');
    m.bumpTexture = phTexture(name, 'nor', { linear: true });
    m.metallicTexture = phTexture(name, 'arm', { linear: true });
    for (const t of [m.albedoTexture, m.bumpTexture, m.metallicTexture]) { t.uScale = uScale; t.vScale = vScale; }
    m.useAmbientOcclusionFromMetallicTextureRed = true;
    m.useRoughnessFromMetallicTextureGreen = true;
    m.useMetallnessFromMetallicTextureBlue = true;
    m.metallic = metallic;
    m.roughness = roughness;
    m.bumpTexture.level = bump;
    if (tint) m.albedoColor = BABYLON.Color3.FromHexString(tint).scale(albedoBoost);
    return m;
}

export function canvasTexture(name, canvas, { linear = false, wrap = true } = {}) {
    const tex = new BABYLON.DynamicTexture(name, canvas, G.scene, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
    tex.update(true);
    tex.gammaSpace = !linear;
    tex.anisotropicFilteringLevel = anisotropy();
    tex.wrapU = tex.wrapV = wrap ? BABYLON.Texture.WRAP_ADDRESSMODE : BABYLON.Texture.CLAMP_ADDRESSMODE;
    return tex;
}

function makeCanvas(w, h = w) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
}

// Sobel a grayscale height canvas into a tangent-space normal map (OpenGL convention, +Y up)
export function heightToNormal(height, strength = 2.0) {
    const w = height.width, h = height.height;
    const src = height.getContext('2d').getImageData(0, 0, w, h).data;
    const out = makeCanvas(w, h);
    const octx = out.getContext('2d');
    const img = octx.createImageData(w, h);
    const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const dx = (H(x + 1, y) - H(x - 1, y)) * strength;
            const dy = (H(x, y + 1) - H(x, y - 1)) * strength;
            // canvas y runs down, texture v runs up: flip dy for +Y-up normals
            let nx = -dx, ny = dy, nz = 1;
            const l = Math.hypot(nx, ny, nz);
            const i = (y * w + x) * 4;
            img.data[i] = (nx / l * 0.5 + 0.5) * 255;
            img.data[i + 1] = (ny / l * 0.5 + 0.5) * 255;
            img.data[i + 2] = (nz / l * 0.5 + 0.5) * 255;
            img.data[i + 3] = 255;
        }
    }
    octx.putImageData(img, 0, 0);
    return out;
}

// ARM colour helper: AO, roughness, metallic in 0..1
const arm = (ao, r, m) => `rgb(${Math.round(ao * 255)},${Math.round(r * 255)},${Math.round(m * 255)})`;
const grey = (v) => { const c = Math.round(v * 255); return `rgb(${c},${c},${c})`; };

function shade(hex, f) {
    const c = BABYLON.Color3.FromHexString(hex);
    const to = (v) => Math.round(Math.min(1, Math.max(0, v)) * 255);
    return `rgb(${to(c.r * f)},${to(c.g * f)},${to(c.b * f)})`;
}

// A facade painter works in metres inside a tile of tileW x tileH metres (v = 0 at the bottom)
function painter(size, tileW, tileH) {
    const albedo = makeCanvas(size), height = makeCanvas(size), armC = makeCanvas(size);
    const A = albedo.getContext('2d'), Hh = height.getContext('2d'), M = armC.getContext('2d');
    const sx = size / tileW, sy = size / tileH;
    const rect = (ctx, x, y, w, h) => ctx.fillRect(x * sx, size - (y + h) * sy, w * sx, h * sy);
    return {
        albedo, height, arm: armC, A, Hh, M, sx, sy, size,
        // paint all three maps at once: colour, height (0..1), [ao, rough, metal]
        fill(x, y, w, h, color, hgt, armv) {
            if (color) { A.fillStyle = color; rect(A, x, y, w, h); }
            if (hgt !== null && hgt !== undefined) { Hh.fillStyle = grey(hgt); rect(Hh, x, y, w, h); }
            if (armv) { M.fillStyle = arm(...armv); rect(M, x, y, w, h); }
        },
        rect,
    };
}

// Tile a source image across the albedo canvas, optionally rotated 90 degrees (planks -> clapboard)
function tileImage(ctx, img, size, repeats, rotate = false, tint = null) {
    ctx.save();
    if (rotate) {
        ctx.translate(size, 0);
        ctx.rotate(Math.PI / 2);
    }
    const step = size / repeats;
    for (let i = 0; i < repeats; i++) for (let j = 0; j < repeats; j++) ctx.drawImage(img, i * step, j * step, step + 1, step + 1);
    ctx.restore();
    if (tint) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = tint;
        ctx.fillRect(0, 0, size, size);
        ctx.restore();
    }
}

// Greyscale copy of a photo texture normalised to a light mean, so multiplying a paint colour by it
// keeps the surface detail without darkening or tinting the paint (raw siding photos are ~70% beige)
function detailImage(img, mean = 0.94, contrast = 0.8) {
    const c = makeCanvas(img.width, img.height);
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height);
    const px = d.data;
    let sum = 0;
    for (let i = 0; i < px.length; i += 4) sum += 0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2];
    const avg = sum / (px.length / 4) / 255;
    for (let i = 0; i < px.length; i += 4) {
        const l = (0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2]) / 255;
        px[i] = px[i + 1] = px[i + 2] = Math.round(Math.min(1, Math.max(0, mean + (l - avg) * contrast)) * 255);
    }
    ctx.putImageData(d, 0, 0);
    return c;
}

// Recolour Poly Haven's leafy_grass (mostly dead brown leaves) into a lush, watered lawn: luminance
// detail is kept, hue goes to greens, with fresh yellow-green where the photo was already green
function lushGrass(img) {
    const c = makeCanvas(img.width, img.height);
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height);
    const px = d.data;
    let sum = 0;
    for (let i = 0; i < px.length; i += 4) sum += 0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2];
    const avg = sum / (px.length / 4) / 255;
    const dark = [38, 92, 26], light = [118, 178, 54], fresh = [150, 196, 60];
    for (let i = 0; i < px.length; i += 4) {
        const r = px[i], g = px[i + 1], b = px[i + 2];
        const l = (0.3 * r + 0.59 * g + 0.11 * b) / 255;
        const t = Math.min(1, Math.max(0, 0.5 + (l - avg) * 2.4));
        const green = Math.min(1, Math.max(0, (g - r) / 40));     // was this pixel grass in the photo?
        for (let k = 0; k < 3; k++) {
            const base = dark[k] + (light[k] - dark[k]) * t;
            px[i + k] = Math.round(base + (fresh[k] * (0.6 + 0.4 * t) - base) * green * 0.5);
        }
    }
    ctx.putImageData(d, 0, 0);
    return c;
}

// Window glass with interior variation: blinds, curtains, dark rooms, the odd lamp
function paintGlass(p, x, y, w, h, rnd, { tint = '#1d2a33', metal = 0.35, rough = 0.06 } = {}) {
    const r = rnd();
    let col = tint;
    if (r < 0.18) col = '#3a4048';          // lighter interior
    else if (r < 0.3) col = '#121820';      // dark room
    p.fill(x, y, w, h, col, 0.18, [0.9, rough, metal]);
    if (r > 0.55 && r < 0.8) {
        // blinds pulled part-way down
        const bh = h * (0.25 + rnd() * 0.5);
        p.fill(x, y + h - bh, w, bh, '#cfc8b8', 0.2, [0.95, 0.6, 0]);
        for (let k = 0; k < bh / 0.08; k++) p.fill(x, y + h - k * 0.08, w, 0.015, '#9f998c', null, null);
    } else if (r >= 0.8) {
        // curtains at the sides
        const cw = w * (0.18 + rnd() * 0.12);
        const cc = ['#e9e1cf', '#b8574a', '#4f6e8a', '#d9c27a'][Math.floor(rnd() * 4)];
        p.fill(x, y, cw, h, cc, 0.2, [0.95, 0.85, 0]);
        p.fill(x + w - cw, y, cw, h, cc, 0.2, [0.95, 0.85, 0]);
    }
}

// --- Victorian / Edwardian row house facade (2 bays x 2 floors per tile) ---
export const VICTORIAN_TILE = { w: 9.0, h: 9.2 };
function victorianFacade(pal, imgs, seed) {
    const T = VICTORIAN_TILE, S = 1024;
    const p = painter(S, T.w, T.h);
    const rnd = mulberry32(seed);
    const floorH = T.h / 2, bayW = T.w / 2;

    // Wall: clapboard (planks rotated to run horizontally) or smooth stucco, tinted to the body colour
    if (pal.siding === 'plaster') {
        tileImage(p.A, imgs.plasterDetail, S, 3, false, pal.base);
        p.fill(0, 0, T.w, T.h, null, 0.5, [1, 0.78, 0]);
    } else {
        tileImage(p.A, imgs.planksDetail, S, 4, true, pal.base);
        // clapboard profile: each board's bottom edge overlaps the next, giving a saw-tooth height
        const board = 0.19;
        for (let y = 0; y < T.h; y += board) {
            for (let k = 0; k < 6; k++) {
                const t = k / 6;
                p.Hh.fillStyle = grey(0.35 + t * 0.3);
                p.rect(p.Hh, 0, y + t * board, T.w, board / 6 + 0.01);
            }
            p.A.fillStyle = 'rgba(0,0,0,0.13)';
            p.rect(p.A, 0, y, T.w, 0.025);
        }
        p.M.fillStyle = arm(1, 0.55, 0);
        p.M.fillRect(0, 0, S, S);
    }

    for (let fl = 0; fl < 2; fl++) {
        const fy = fl * floorH;
        // belt course at each floor line (also the solid trim band at v ~ 0 that geometry samples)
        p.fill(0, fy, T.w, 0.22, pal.trim, 0.75, [1, 0.42, 0]);
        p.fill(0, fy + 0.22, T.w, 0.06, pal.accent, 0.7, [1, 0.42, 0]);
        p.fill(0, fy + 0.28, T.w, 0.05, shade(pal.trim, 0.8), 0.62, [0.85, 0.5, 0]);

        for (let b = 0; b < 2; b++) {
            const cx = b * bayW + bayW / 2;
            const ww = 1.35, wh = 2.6, sill = fy + 1.05;
            const x0 = cx - ww / 2;
            // frame / casing
            p.fill(x0 - 0.24, sill - 0.16, ww + 0.48, wh + 0.32, pal.trim, 0.8, [1, 0.42, 0]);
            // sill and decorative head (pediment) in trim + accent
            p.fill(x0 - 0.38, sill - 0.26, ww + 0.76, 0.14, pal.trim, 0.9, [1, 0.4, 0]);
            p.fill(x0 - 0.34, sill + wh + 0.16, ww + 0.68, 0.32, pal.trim, 0.92, [1, 0.4, 0]);
            p.fill(x0 - 0.24, sill + wh + 0.22, ww + 0.48, 0.07, pal.accent, 0.95, [1, 0.42, 0]);
            for (let k = 0; k < 7; k++) {
                // little dentils under the head
                p.fill(x0 - 0.2 + k * (ww + 0.4) / 6.5, sill + wh + 0.12, 0.08, 0.06, pal.trim, 0.95, null);
            }
            // recessed sash: accent-coloured frame around the glass
            p.fill(x0, sill, ww, wh, pal.accent, 0.4, [0.7, 0.45, 0]);
            const g = 0.07;
            paintGlass(p, x0 + g, sill + g, ww - 2 * g, wh / 2 - 1.5 * g, rnd);
            paintGlass(p, x0 + g, sill + wh / 2 + g * 0.5, ww - 2 * g, wh / 2 - 1.5 * g, rnd);
            // meeting rail
            p.fill(x0, sill + wh / 2 - g * 0.5, ww, g, pal.accent, 0.42, [0.8, 0.45, 0]);
        }
    }
    // the very bottom rows are the solid trim band used by cornices / frames
    p.fill(0, 0, T.w, 0.18, pal.trim, 0.75, [1, 0.42, 0]);

    return { albedo: p.albedo, normal: heightToNormal(p.height, 3.5), arm: p.arm };
}

// --- Downtown office facades ---
export const DOWNTOWN_TILES = {
    glass: { w: 9.0, h: 8.0 },      // 3 panels x 2 floors
    precast: { w: 8.0, h: 8.0 },    // 2 punched windows x 2 floors
    brick: { w: 8.0, h: 8.4 },
    stone: { w: 8.0, h: 9.0 },
};

function downtownFacade(style, imgs, seed) {
    const T = DOWNTOWN_TILES[style], S = 1024;
    const p = painter(S, T.w, T.h);
    const rnd = mulberry32(seed);
    if (style === 'glass') {
        const panelW = 3.0, floorH = 4.0;
        // aluminium mullion base
        p.fill(0, 0, T.w, T.h, '#9aa3ab', 0.8, [1, 0.32, 1]);
        for (let f = 0; f < 2; f++) {
            const fy = f * floorH;
            // spandrel: dark fritted glass across the slab edge
            p.fill(0, fy, T.w, 0.95, '#1e2a33', 0.6, [1, 0.18, 0.7]);
            for (let k = 0; k < T.w / 0.06; k++) p.fill(k * 0.06, fy + 0.1, 0.02, 0.75, '#2b3944', null, null);
            for (let c = 0; c < 3; c++) {
                const x = c * panelW + 0.06, y = fy + 1.0;
                const v = 0.85 + rnd() * 0.3;
                const col = `rgb(${Math.round(70 * v)},${Math.round(104 * v)},${Math.round(124 * v)})`;
                p.fill(x, y, panelW - 0.12, floorH - 1.06, col, 0.5 + (rnd() - 0.5) * 0.06, [1, 0.03 + rnd() * 0.03, 0.85]);
                // faint interior silhouettes behind the glass
                if (rnd() < 0.4) p.fill(x + 0.4, y + 0.2, panelW * 0.4, 1.2, 'rgba(10,16,22,0.35)', null, null);
            }
        }
        p.fill(0, 0, T.w, 0.18, '#aab3bb', 0.85, [1, 0.3, 1]);
        return { albedo: p.albedo, normal: heightToNormal(p.height, 2.5), arm: p.arm };
    }

    const wall = style === 'brick' ? imgs.brick : style === 'stone' ? imgs.sandstone : imgs.plaster;
    const tint = style === 'precast' ? '#e4ddd0' : style === 'stone' ? '#efe4cf' : null;
    tileImage(p.A, wall, S, style === 'brick' ? 3 : 2, false, tint);
    p.fill(0, 0, T.w, T.h, null, 0.6, [1, 0.8, 0]);
    const floorH = T.h / 2, bays = 2, bayW = T.w / bays;
    const trimCol = style === 'brick' ? '#d8cbb0' : style === 'stone' ? '#f3ead6' : '#d9d2c4';
    for (let f = 0; f < 2; f++) {
        const fy = f * floorH;
        if (style !== 'brick') p.fill(0, fy, T.w, 0.3, trimCol, 0.72, [1, 0.6, 0]);
        for (let b = 0; b < bays; b++) {
            const cx = b * bayW + bayW / 2;
            const ww = style === 'stone' ? 1.7 : 2.3, wh = style === 'stone' ? 2.9 : 2.3;
            const x0 = cx - ww / 2, y0 = fy + (floorH - wh) / 2 + 0.15;
            // reveal (deep recess -> AO), lintel and sill
            p.fill(x0 - 0.12, y0 - 0.12, ww + 0.24, wh + 0.24, shade(trimCol, 0.55), 0.25, [0.55, 0.7, 0]);
            p.fill(x0 - 0.25, y0 - 0.28, ww + 0.5, 0.18, trimCol, 0.78, [1, 0.55, 0]);
            p.fill(x0 - 0.15, y0 + wh + 0.08, ww + 0.3, 0.3, trimCol, 0.75, [1, 0.55, 0]);
            const frame = style === 'brick' ? '#2d3236' : '#4a5258';
            p.fill(x0, y0, ww, wh, frame, 0.22, [0.6, 0.35, 0.8]);
            const panes = style === 'brick' ? 3 : 2;
            const pw = (ww - 0.08 * (panes + 1)) / panes;
            for (let k = 0; k < panes; k++) {
                const px = x0 + 0.08 + k * (pw + 0.08);
                paintGlass(p, px, y0 + 0.08, pw, wh - 0.16, rnd, { tint: '#1e272e', metal: 0.4 });
                if (style === 'brick') p.fill(px, y0 + wh * 0.55, pw, 0.06, frame, 0.22, [0.6, 0.35, 0.8]);
            }
        }
    }
    p.fill(0, 0, T.w, 0.18, trimCol, 0.75, [1, 0.55, 0]);
    return { albedo: p.albedo, normal: heightToNormal(p.height, 3), arm: p.arm };
}

// --- Ground-floor shopfronts: 4 different shops side by side (6 m each), 5 m tall ---
export const STOREFRONT_TILE = { w: 24.0, h: 5.0 };
function storefrontFacade(imgs) {
    const T = STOREFRONT_TILE, S = 1024;
    const p = painter(S, T.w, T.h);
    const rnd = mulberry32(77);
    tileImage(p.A, imgs.sandstone, S, 6, false, '#d8ccb6');
    p.fill(0, 0, T.w, T.h, null, 0.7, [1, 0.75, 0]);
    const signs = ['#1f4e5f', '#8c2f39', '#2f5d3a', '#3b3355'];
    for (let s = 0; s < 4; s++) {
        const x = s * 6;
        p.fill(x + 0.3, 0.35, 5.4, 3.35, '#2a2f33', 0.3, [0.7, 0.35, 1]);      // mullion frame
        paintGlass(p, x + 0.4, 0.75, 2.4, 2.85, rnd, { tint: '#1a2328', metal: 0.3, rough: 0.04 });
        paintGlass(p, x + 3.2, 0.75, 2.4, 2.85, rnd, { tint: '#1a2328', metal: 0.3, rough: 0.04 });
        p.fill(x + 0.3, 0.35, 5.4, 0.4, '#3a3f44', 0.35, [0.8, 0.4, 0.9]);      // kick plate
        p.fill(x + 0.2, 3.85, 5.6, 0.9, signs[s], 0.85, [1, 0.45, 0.1]);       // sign band
        p.fill(x + 0.8, 4.12, 4.4, 0.36, '#efe6cf', 0.9, [1, 0.5, 0]);          // lettering strip
    }
    p.fill(0, 0, T.w, 0.18, '#cfc3ab', 0.75, [1, 0.6, 0]);
    return { albedo: p.albedo, normal: heightToNormal(p.height, 2.5), arm: p.arm };
}

function facadeMaterial(name, maps, { clearCoat = false } = {}) {
    const m = new BABYLON.PBRMaterial(name, G.scene);
    m.albedoTexture = canvasTexture(name + '_a', maps.albedo);
    m.bumpTexture = canvasTexture(name + '_n', maps.normal, { linear: true });
    m.metallicTexture = canvasTexture(name + '_m', maps.arm, { linear: true });
    m.useAmbientOcclusionFromMetallicTextureRed = true;
    m.useRoughnessFromMetallicTextureGreen = true;
    m.useMetallnessFromMetallicTextureBlue = true;
    m.metallic = 1;
    m.roughness = 1;
    m.bumpTexture.level = 1.0;
    if (clearCoat) {
        m.clearCoat.isEnabled = true;
        m.clearCoat.intensity = 0.4;
        m.clearCoat.roughness = 0.15;
    }
    return m;
}

// Seamless water normal map: sum of periodic waves
function waterNormalCanvas(size = 512) {
    const h = makeCanvas(size);
    const ctx = h.getContext('2d');
    const img = ctx.createImageData(size, size);
    const rnd = mulberry32(9);
    const waves = [];
    for (let i = 0; i < 14; i++) {
        const kx = Math.round((rnd() - 0.5) * 16), ky = Math.round((rnd() - 0.5) * 16) || 1;
        waves.push({ kx, ky, a: 1 / (1 + Math.hypot(kx, ky) * 0.35), ph: rnd() * 6.28 });
    }
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        let v = 0;
        for (const w of waves) v += w.a * Math.sin((w.kx * x + w.ky * y) / size * 2 * Math.PI + w.ph);
        const c = Math.round(128 + v * 22);
        const i = (y * size + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = c;
        img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return heightToNormal(h, 1.6);
}

// Alpha-tested leaf cluster card for street trees
function leafCanvas(size = 512, palm = false) {
    const c = makeCanvas(size);
    const ctx = c.getContext('2d');
    const rnd = mulberry32(palm ? 31 : 17);
    if (palm) {
        // a single palm frond: central rib with leaflets fanning out, tips drooping
        ctx.translate(size / 2, 0);
        ctx.strokeStyle = '#6f7d3a';
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, size); ctx.stroke();
        for (let i = 0; i < 46; i++) {
            const t = i / 46, y = 12 + t * (size - 24);
            const len = size * 0.48 * Math.sin(Math.PI * (0.15 + t * 0.85)) ;
            for (const side of [-1, 1]) {
                const g = 90 + rnd() * 50;
                ctx.strokeStyle = `rgb(${Math.round(g * 0.42)},${Math.round(g)},${Math.round(g * 0.36)})`;
                ctx.lineWidth = 5 + rnd() * 3;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.quadraticCurveTo(side * len * 0.5, y + 10, side * len, y + 30 + rnd() * 20);
                ctx.stroke();
            }
        }
    } else {
        for (let i = 0; i < 520; i++) {
            const r = Math.sqrt(rnd()) * size * 0.46;
            const a = rnd() * Math.PI * 2;
            const x = size / 2 + Math.cos(a) * r, y = size / 2 + Math.sin(a) * r;
            const g = 70 + rnd() * 80, s = 9 + rnd() * 14;
            ctx.fillStyle = `rgb(${Math.round(g * 0.55)},${Math.round(g)},${Math.round(g * 0.4)})`;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rnd() * Math.PI);
            ctx.beginPath();
            ctx.ellipse(0, 0, s, s * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    return c;
}

// Soft round blob (contact shadows under cars, particle sprites)
export function radialCanvas(size, stops) {
    const c = makeCanvas(size);
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (const [o, col] of stops) g.addColorStop(o, col);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return c;
}

// Victorian palettes: body, trim, accent. 0-5 are Painted Ladies clapboard (the Postcard Row block
// uses them in order), 6-9 are Outer Sunset pastel stucco with bold doors and trim.
export const VICTORIAN_PALETTES = [
    { base: '#f2c14e', trim: '#ffffff', accent: '#2f6f8f', siding: 'planks' },  // butter yellow / teal
    { base: '#7cc6b4', trim: '#fffaf0', accent: '#c2414b', siding: 'planks' },  // mint / cherry
    { base: '#f08a9c', trim: '#fff4ec', accent: '#3b6e8f', siding: 'planks' },  // bubblegum rose / slate blue
    { base: '#78a7e0', trim: '#ffffff', accent: '#e8a33a', siding: 'planks' },  // periwinkle / gold
    { base: '#b59ad8', trim: '#fbf7ff', accent: '#2e8c7a', siding: 'planks' },  // lavender / jade
    { base: '#f4a36c', trim: '#fff8ee', accent: '#5a3d7a', siding: 'planks' },  // apricot / plum
    { base: '#cfe8d0', trim: '#ffffff', accent: '#e2574c', siding: 'plaster' }, // Sunset mint / coral door
    { base: '#fbe3a8', trim: '#ffffff', accent: '#2a7f8f', siding: 'plaster' }, // Sunset butter / teal
    { base: '#f6c3b5', trim: '#ffffff', accent: '#355c7d', siding: 'plaster' }, // Sunset salmon / navy
    { base: '#bfe0f2', trim: '#ffffff', accent: '#f2b134', siding: 'plaster' }, // Sunset sky / mustard
];

export async function createMaterials() {
    const scene = G.scene;
    const img = (n) => loadImage(`${TEX}${n}_diff.jpg`);
    const [planks, plaster, brick, sandstone, grass] = await Promise.all([
        img('white_planks_clean'), img('painted_plaster_wall'), img('red_brick_03'), img('white_sandstone_blocks_02'),
        img('leafy_grass'),
    ]);
    const imgs = { planks, plaster, brick, sandstone, planksDetail: detailImage(planks), plasterDetail: detailImage(plaster, 0.96, 0.6) };

    const M = {};
    M.victorian = VICTORIAN_PALETTES.map((pal, i) => facadeMaterial('victorian' + i, victorianFacade(pal, imgs, 100 + i)));
    M.downtown = {};
    for (const [i, style] of ['glass', 'precast', 'brick', 'stone'].entries()) {
        M.downtown[style] = facadeMaterial('downtown_' + style, downtownFacade(style, imgs, 200 + i));
    }
    M.storefront = facadeMaterial('storefront', storefrontFacade(imgs));

    M.asphalt = phMaterial('asphalt_02', { bump: 0.8, tint: '#ffffff', albedoBoost: 1.3 });
    M.asphalt.useVertexColors = true;    // large-scale patching variation baked into terrain colours
    M.sidewalk = phMaterial('concrete_pavement', { bump: 0.7, tint: '#d6d2c8', albedoBoost: 1.1 });
    M.roofShingle = phMaterial('grey_roof_01', { bump: 1.0, tint: '#b3aca3', albedoBoost: 1.3 });
    M.grass = phMaterial('leafy_grass', { bump: 0.9 });
    M.grass.albedoTexture.dispose();
    M.grass.albedoTexture = canvasTexture('grass_a', lushGrass(grass));
    M.sand = phMaterial('coast_sand_01', { bump: 0.6, tint: '#e9dcc0', albedoBoost: 1.15 });
    M.sand.useVertexColors = true;
    M.sandstone = phMaterial('white_sandstone_blocks_02', { bump: 0.8 });
    M.brick = phMaterial('red_brick_03', { bump: 0.9 });
    M.plaster = phMaterial('painted_plaster_wall', { bump: 0.5, tint: '#e8e2d6' });

    M.flatRoof = new BABYLON.PBRMaterial('flatRoof', scene);
    M.flatRoof.albedoTexture = phTexture('asphalt_02', 'diff');
    M.flatRoof.albedoColor = new BABYLON.Color3(0.8, 0.79, 0.77);    // light tar-and-gravel
    M.flatRoof.bumpTexture = phTexture('asphalt_02', 'nor', { linear: true });
    M.flatRoof.metallic = 0;
    M.flatRoof.roughness = 0.92;

    const solid = (name, hex, rough, metal = 0, opts = {}) => {
        const m = new BABYLON.PBRMaterial(name, scene);
        m.albedoColor = BABYLON.Color3.FromHexString(hex);
        m.roughness = rough;
        m.metallic = metal;
        if (opts.emissive) {
            m.emissiveColor = BABYLON.Color3.FromHexString(opts.emissive);
            m.emissiveIntensity = opts.emissiveIntensity ?? 1;
        }
        return m;
    };
    M.solid = solid;
    M.intlOrange = solid('intlOrange', '#b8352a', 0.48, 0.25);
    M.steelGrey = solid('steelGrey', '#8c9399', 0.45, 0.7);
    M.darkMetal = solid('darkMetal', '#2a2e31', 0.5, 0.8);
    M.white = solid('whiteTrim', '#eeeae2', 0.45, 0);
    M.signalYellow = solid('signalYellow', '#d8b021', 0.5, 0.1);
    M.poleGreen = solid('poleGreen', '#2d3a33', 0.55, 0.6);
    M.craneYellow = solid('craneYellow', '#e2b22a', 0.45, 0.4);
    M.copper = solid('copper', '#6d8f7d', 0.55, 0.6);
    M.redBeacon = solid('redBeacon', '#ff2a1a', 0.4, 0, { emissive: '#ff2a1a', emissiveIntensity: 2 });

    // Glass for towers & conservatory: mirror-like dielectric with slight blue
    M.towerGlass = new BABYLON.PBRMaterial('towerGlass', scene);
    M.towerGlass.albedoColor = new BABYLON.Color3(0.32, 0.45, 0.54);
    M.towerGlass.metallic = 0.85;
    M.towerGlass.roughness = 0.05;

    // Water: deep blue-green, very smooth, animated normal map
    const water = new BABYLON.PBRMaterial('water', scene);
    water.albedoColor = new BABYLON.Color3(0.03, 0.12, 0.16);
    water.metallic = 0.0;
    water.roughness = 0.07;
    water.reflectivityColor = new BABYLON.Color3(0.05, 0.05, 0.05);
    water.bumpTexture = canvasTexture('waterNormal', waterNormalCanvas(), { linear: true });
    water.bumpTexture.uScale = water.bumpTexture.vScale = 220;
    water.bumpTexture.level = 0.45;
    water.environmentIntensity = 1.2;
    M.water = water;

    // Foliage: alpha-tested leaf cards with light passing through
    const foliage = (name, canvas, tint) => {
        const m = new BABYLON.PBRMaterial(name, scene);
        m.albedoTexture = canvasTexture(name + '_a', canvas, { wrap: false });
        m.albedoTexture.hasAlpha = true;
        m.useAlphaFromAlbedoTexture = true;
        m.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHATEST;
        m.alphaCutOff = 0.4;
        m.backFaceCulling = false;
        m.twoSidedLighting = true;
        m.albedoColor = BABYLON.Color3.FromHexString(tint);
        m.metallic = 0;
        m.roughness = 0.75;
        m.subSurface.isTranslucencyEnabled = true;
        m.subSurface.translucencyIntensity = 0.6;
        m.subSurface.tintColor = new BABYLON.Color3(0.6, 0.9, 0.3);
        return m;
    };
    M.leaves = foliage('leaves', leafCanvas(512, false), '#d6efc0');
    M.palmFronds = foliage('palmFronds', leafCanvas(512, true), '#e4f0c8');
    M.cypressLeaves = foliage('cypressLeaves', leafCanvas(512, false), '#98c084');
    M.bark = solid('bark', '#4f4136', 0.9);
    M.palmBark = solid('palmBark', '#7d6a52', 0.85);
    return M;
}
