// SF Laser Taxi: boot, rendering pipeline, game loop, camera.

import { G, STATE_SEND_MS, getElevation, clamp, lerp } from './shared.js';
import { createMaterials, setLoadProgressHandler } from './materials.js';
import { buildCity } from './city.js';
import { buildProps, updateSignals, buildCableCars } from './props.js';
import { Vehicle, Laser, initFx, updateLasers, updateFx, burst, explosion } from './game.js';
import { connect, sendState, sendJoin } from './net.js';
import { sound } from './sound.js';
import * as hud from './hud.js';

const V = (x, y, z) => new BABYLON.Vector3(x, y, z);
const HDRI = 'assets/hdri/kloofendal_48d_partly_cloudy_puresky.hdr';

// --- Quality tiers -------------------------------------------------------------------------------
// ultra: SSR + 3x2048 cascaded shadows + MSAA, up to 1.5x pixel density
// high:  3x2048 shadows + MSAA, 1.25x density
// low:   (phones) 2x1024 shadows, FXAA, 1x density
// On top of the tier, dynamic resolution keeps the frame rate up (see the watchdog in main()).
// SSAO2 is wired up but off: in this scene it smears noise over the sky and road (?ssao=1 to try it)
const SSAO_ON = new URLSearchParams(location.search).get('ssao') === '1';
const QUALITY = {
    ultra: { dpr: 1.5, shadowSize: 2048, cascades: 3, ssao: SSAO_ON, ssr: true, msaa: 4, glowSamples: 4 },
    high: { dpr: 1.25, shadowSize: 2048, cascades: 3, ssao: SSAO_ON, ssr: false, msaa: 4, glowSamples: 2 },
    low: { dpr: 1.0, shadowSize: 1024, cascades: 2, ssao: false, ssr: false, msaa: 1, glowSamples: 1 },
};
G.isTouch = (() => {
    const force = new URLSearchParams(location.search).get('touch');
    if (force !== null) return force === '1';
    return matchMedia('(hover: none) and (pointer: coarse)').matches;
})();
if (G.isTouch) document.body.classList.add('touch');
G.quality = (() => {
    const q = new URLSearchParams(location.search).get('q');
    if (QUALITY[q]) return q;
    try { const s = localStorage.getItem('sflt-quality'); if (QUALITY[s]) return s; } catch {}
    return G.isTouch ? 'low' : 'ultra';
})();
const Q = QUALITY[G.quality];

let pipelines = { ssao: null, ssr: null, main: null };

function createEngine() {
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, Q.msaa === 1, {
        powerPreference: 'high-performance', stencil: true, preserveDrawingBuffer: false, useHighPrecisionMatrix: true,
    }, false);
    // Reverse depth would help far-range precision, but SSAO2 reads it wrong (noise everywhere)
    engine.useReverseDepthBuffer = new URLSearchParams(location.search).get('revdepth') === '1';
    engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, Q.dpr));
    window.addEventListener('resize', () => engine.resize());
    return engine;
}

function createScene(engine) {
    const scene = new BABYLON.Scene(engine);
    scene.useRightHandedSystem = true;     // same coordinates as the server and the original three.js game
    scene.clearColor = new BABYLON.Color4(0.55, 0.7, 0.85, 1);
    scene.skipPointerMovePicking = true;
    scene.autoClear = false;               // skybox covers everything
    scene.autoClearDepthAndStencil = true;
    scene.blockMaterialDirtyMechanism = false;

    const cam = new BABYLON.UniversalCamera('cam', V(150, 140, 260), scene);
    cam.minZ = 0.3;
    cam.maxZ = 6000;
    cam.fov = 1.05;
    cam.inputs.clear();
    cam.setTarget(V(150, 60, 50));
    G.camera = cam;
    return scene;
}

// HDRI sky + image-based lighting, sun aligned with the sun in the HDRI
function createLighting(scene) {
    // If the HDRI is missing (a deploy that skipped scripts/fetch_assets.py), drop the sky and IBL
    // and fall back to a flat sky colour and a hemispheric fill, so the scene still becomes ready
    let hdriFailed = false;
    const noHdri = () => {
        if (hdriFailed) return;
        hdriFailed = true;
        console.warn('failed to load ' + HDRI + ', using a flat sky');
        scene.environmentTexture = null;
        sky.dispose(false, true);
        env.dispose();
        scene.autoClear = true;
        const fill = new BABYLON.HemisphericLight('skyFill', V(0, 1, 0), scene);
        fill.intensity = 0.9;
        fill.diffuse = new BABYLON.Color3(0.75, 0.85, 1.0);
        fill.groundColor = new BABYLON.Color3(0.35, 0.32, 0.3);
    };
    const env = new BABYLON.HDRCubeTexture(HDRI, scene, 256, false, true, false, true, null, noHdri);
    scene.environmentTexture = env;
    scene.environmentIntensity = 0.85;
    const skyTex = new BABYLON.HDRCubeTexture(HDRI, scene, 1024, true, false, false, false, null, noHdri);
    const sky = scene.createDefaultSkybox(skyTex, true, 5000, 0, false);
    sky.infiniteDistance = true;
    sky.isPickable = false;
    sky.material.microSurface = 1.0;

    const sun = new BABYLON.DirectionalLight('sun', V(0.45, -0.74, 0.5).normalize(), scene);
    sun.intensity = 3.4;
    sun.diffuse = new BABYLON.Color3(1.0, 0.95, 0.88);
    sun.specular = new BABYLON.Color3(1.0, 0.96, 0.9);
    sun.shadowMinZ = -600;
    sun.shadowMaxZ = 900;
    G.sun = sun;

    // Point the sun where the HDRI's sun is: the first-order spherical harmonics of the sky's
    // radiance point at its brightest region. Elevation is the measured 48 degrees.
    env.onLoadObservable.addOnce(() => {
        const sp = env.sphericalPolynomial;
        if (!sp) return;
        const lum = (c) => 0.2126 * c.x + 0.7152 * c.y + 0.0722 * c.z;   // coefficients are Vector3 (r, g, b in x, y, z)
        const d = V(lum(sp.x), 0, lum(sp.z));
        if (d.length() < 1e-4) return;
        d.normalize();
        const elev = 48 * Math.PI / 180;
        // scene is right-handed: the cube map is sampled with z mirrored
        const toSun = V(d.x * Math.cos(elev), Math.sin(elev), -d.z * Math.cos(elev));
        sun.direction = toSun.scale(-1);
    });

    const csm = new BABYLON.CascadedShadowGenerator(Q.shadowSize, sun);
    csm.numCascades = Q.cascades;
    csm.lambda = 0.82;
    csm.shadowMaxZ = G.quality === 'low' ? 240 : 420;
    csm.stabilizeCascades = true;
    csm.depthClamp = true;
    csm.cascadeBlendPercentage = 0.08;
    csm.usePercentageCloserFiltering = true;
    csm.filteringQuality = G.quality === 'low' ? BABYLON.ShadowGenerator.QUALITY_LOW : BABYLON.ShadowGenerator.QUALITY_HIGH;
    csm.bias = 0.0016;
    csm.normalBias = 0.012;
    csm.darkness = 0.0;
    csm.transparencyShadow = true;
    csm.enableSoftTransparentShadow = true;
    G.shadows = csm;

    const glow = new BABYLON.GlowLayer('glow', scene, { mainTextureRatio: 0.5, mainTextureSamples: Q.glowSamples, blurKernelSize: 48 });
    glow.intensity = 0.55;
    G.glow = glow;
}

function createPipelines(scene) {
    const cam = G.camera;
    for (const k of Object.keys(pipelines)) { pipelines[k]?.dispose(); pipelines[k] = null; }
    if (Q.ssao) {
        try {
            const ssao = new BABYLON.SSAO2RenderingPipeline('ssao', scene, { ssaoRatio: 0.5, blurRatio: 0.5 }, [cam], true);
            ssao.radius = 2.4;
            ssao.totalStrength = 1.15;
            ssao.base = 0.08;
            ssao.samples = G.quality === 'ultra' ? 16 : 12;
            ssao.maxZ = 260;
            ssao.minZAspect = 0.4;
            ssao.expensiveBlur = true;
            ssao.bilateralSoften = 0.02;
            pipelines.ssao = ssao;
        } catch (e) { console.warn('SSAO unavailable', e); }
    }
    if (Q.ssr) {
        try {
            const ssr = new BABYLON.SSRRenderingPipeline('ssr', scene, [cam], false, BABYLON.Constants.TEXTURETYPE_HALF_FLOAT);
            ssr.strength = 0.85;
            ssr.reflectionSpecularFalloffExponent = 1.6;
            ssr.maxDistance = 320;
            ssr.maxSteps = 120;
            ssr.step = 2;
            ssr.thickness = 0.7;
            ssr.roughnessFactor = 0.15;
            ssr.reflectivityThreshold = 0.03;
            ssr.blurDispersionStrength = 0.025;
            ssr.blurDownsample = 1;
            ssr.ssrDownsample = 1;
            ssr.selfCollisionNumSkip = 2;
            ssr.enableSmoothReflections = true;
            ssr.attenuateScreenBorders = true;
            ssr.attenuateIntersectionDistance = true;
            ssr.attenuateFacingCamera = true;
            ssr.useFresnel = true;
            ssr.inputTextureColorIsInGammaSpace = false;
            ssr.generateOutputInGammaSpace = false;
            pipelines.ssr = ssr;
        } catch (e) { console.warn('SSR unavailable', e); }
    }
    const p = new BABYLON.DefaultRenderingPipeline('main', true, scene, [cam]);
    p.samples = Q.msaa;
    p.fxaaEnabled = Q.msaa === 1;
    p.bloomEnabled = true;
    p.bloomThreshold = 0.92;
    p.bloomWeight = 0.22;
    p.bloomKernel = 64;
    p.bloomScale = 0.5;
    p.imageProcessingEnabled = true;
    const ip = p.imageProcessing;
    ip.toneMappingEnabled = true;
    ip.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
    ip.exposure = 1.15;
    ip.contrast = 1.12;
    ip.vignetteEnabled = true;
    ip.vignetteWeight = 1.6;
    ip.vignetteStretch = 0.3;
    ip.vignetteColor = new BABYLON.Color4(0.05, 0.06, 0.08, 0);
    ip.vignetteCameraFov = 0.6;
    p.sharpenEnabled = G.quality !== 'low';
    if (p.sharpenEnabled) { p.sharpen.edgeAmount = 0.22; p.sharpen.colorAmount = 1.0; }
    p.chromaticAberrationEnabled = false;
    p.grainEnabled = false;
    pipelines.main = p;
}

// Step down one tier at runtime when the frame rate can't keep up
function downgrade(reason) {
    if (pipelines.ssr) {
        pipelines.ssr.dispose(); pipelines.ssr = null;
        toast('Screen-space reflections off for smoother play' + reason);
        return true;
    }
    if (pipelines.ssao) {
        pipelines.ssao.dispose(); pipelines.ssao = null;
        toast('Ambient occlusion off for smoother play' + reason);
        return true;
    }
    const lvl = G.engine.getHardwareScalingLevel();
    if (lvl < 1) {
        G.engine.setHardwareScalingLevel(Math.min(1, lvl * 1.25));
        toast('Resolution lowered for smoother play' + reason);
        return true;
    }
    return false;
}

function toast(text) {
    const t = document.getElementById('toast');
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove('show'), 3500);
}

// --- Camera ------------------------------------------------------------------------------------

const camState = { look: V(0, 0, 1), shake: 0, fov: 1.05 };
function updateCamera(dt) {
    const p = G.player, cam = G.camera;
    const forward = V(Math.sin(p.angle), 0, Math.cos(p.angle));
    const speedK = clamp(Math.abs(p.speed) / p.maxSpeed, 0, 1.4);
    const back = 10.5 + speedK * 1.6, up = 4.2 - speedK * 0.35;
    const desired = p.pos.subtract(forward.scale(back)).add(V(0, up, 0));
    // keep the camera out of buildings
    const m = 1.6;
    for (const b of G.buildings) {
        if (desired.x + m > b.minX && desired.x - m < b.maxX && desired.z + m > b.minZ && desired.z - m < b.maxZ) {
            const dl = desired.x + m - b.minX, dr = b.maxX - (desired.x - m), dd = desired.z + m - b.minZ, du = b.maxZ - (desired.z - m);
            const mn = Math.min(dl, dr, dd, du);
            if (mn === dl) desired.x = b.minX - m; else if (mn === dr) desired.x = b.maxX + m;
            else if (mn === dd) desired.z = b.minZ - m; else desired.z = b.maxZ + m;
        }
    }
    const th = getElevation(desired.x, desired.z);
    if (desired.y < th + 2.4) desired.y = th + 2.4;
    cam.position = BABYLON.Vector3.Lerp(cam.position, desired, Math.min(1, 12 * dt));

    const lookTarget = p.pos.add(V(Math.sin(p.angle) * 16, 2.0, Math.cos(p.angle) * 16));
    const targetDir = lookTarget.subtract(cam.position).normalize();
    camState.look = BABYLON.Vector3.Lerp(camState.look, targetDir, Math.min(1, 14 * dt)).normalize();
    let lookAt = cam.position.add(camState.look);
    if (camState.shake > 0) {
        camState.shake = Math.max(0, camState.shake - dt * 2.5);
        const s = camState.shake * camState.shake * 0.12;
        lookAt = lookAt.add(V((Math.random() - 0.5) * s, (Math.random() - 0.5) * s, (Math.random() - 0.5) * s));
    }
    cam.setTarget(lookAt);

    // Speed reads as speed: widen the lens a little as we go faster, more under boost
    const portrait = G.engine.getRenderHeight() > G.engine.getRenderWidth();
    const baseFov = portrait ? 1.25 : 1.05;
    const targetFov = baseFov + speedK * 0.12 + (p.boosting ? 0.08 : 0);
    camState.fov = lerp(camState.fov, targetFov, Math.min(1, 3 * dt));
    cam.fov = camState.fov;
    if (pipelines.main?.imageProcessing && G.quality !== 'low') {
        pipelines.main.imageProcessing.vignetteWeight = 1.6 + (p.boosting ? 1.4 : 0);
    }
}

function updateMenuCamera() {
    // slow aerial orbit around downtown, high enough to clear the towers
    const t = G.time * 0.045 + 2.2;
    const cam = G.camera;
    cam.position.set(60 + Math.cos(t) * 420, 230 + Math.sin(t * 0.7) * 25, 20 + Math.sin(t) * 420);
    cam.setTarget(V(110, 60, 20));
    cam.fov = 0.95;
}

// --- Boot ----------------------------------------------------------------------------------------

async function main() {
    const loadLabel = document.getElementById('load-label'), loadBar = document.getElementById('load-bar');
    setLoadProgressHandler((done, total) => {
        const pct = total ? Math.round(done / total * 100) : 0;
        loadBar.style.width = pct + '%';
        loadLabel.textContent = `Loading San Francisco… ${pct}%`;
    });
    const qSel = document.getElementById('quality-select');
    qSel.value = G.quality;
    qSel.addEventListener('change', () => {
        try { localStorage.setItem('sflt-quality', qSel.value); } catch {}
        const u = new URL(location.href);
        u.searchParams.delete('q');
        location.href = u.toString();
    });

    const engine = createEngine();
    G.engine = engine;
    const scene = createScene(engine);
    G.scene = scene;
    createLighting(scene);

    const M = await createMaterials();
    G.materials = M;
    const { props } = buildCity(M);
    const { signals } = await buildProps(props, M);
    const updateCableCars = buildCableCars(M);
    initFx();
    hud.buildMinimapBase();
    createPipelines(scene);

    G.player = new Vehicle(-85, -45, true);
    G.player.respawn();
    G.player.visible = false;

    hud.setupInput(() => downgrade(''));
    document.getElementById('start-btn').addEventListener('click', startGame);
    const nameInput = document.getElementById('name-input');
    try { nameInput.value = localStorage.getItem('sflasertaxi-name') || ''; } catch {}
    nameInput.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') startGame(); });
    nameInput.addEventListener('keyup', e => e.stopPropagation());
    if (!G.isTouch) nameInput.focus();

    connect({
        status: hud.setConnStatus,
        roster: hud.renderLeaderboard,
        stats: hud.updateMyStats,
        feed: hud.addKillFeed,
        makeRemote: (p) => new Vehicle(p.x, p.z, false, p.name),
        removeRemote: (v) => hud.removeTag(v),
        remoteShot: (v, p, d) => {
            const pos = V(...p);
            G.lasers.push(new Laser(pos, V(...d), v));
            if (G.gameActive && BABYLON.Vector3.Distance(pos, G.player.pos) < 150) sound.playLaser(false);
        },
        damaged: () => {
            burst(G.player.pos.add(V(0, 1.2, 0)), '#00e5ff', 24, 6);
            sound.playHit();
            hud.damageFlash();
            camState.shake = 1;
        },
        remoteDamaged: (v) => burst(v.pos.add(V(0, 1.2, 0)), '#ff2d6f', 24, 6),
        boom: (v) => {
            const at = v.pos.add(V(0, 1, 0));
            explosion(at);
            if (G.gameActive && BABYLON.Vector3.Distance(at, G.player.pos) < 200) { sound.playExplosion(); camState.shake = Math.max(camState.shake, 0.8); }
        },
    });
    setInterval(sendState, STATE_SEND_MS);

    // FPS watchdog / dynamic resolution: every 2 s of play, drop SSR first if we're under 45 fps,
    // then render fewer pixels (down to 0.7x CSS resolution); climb back when there's headroom.
    const baseLevel = engine.getHardwareScalingLevel(), maxLevel = 1 / 0.7;
    let fpsAcc = 0, fpsFrames = 0, fpsWindow = 0;
    let minimapTimer = 0;

    scene.onBeforeRenderObservable.add(() => {
        const dt = Math.min(engine.getDeltaTime() / 1000, 0.1);
        G.time += dt;
        G.remoteVehicles.forEach(v => v.update(dt));
        if (G.gameActive) {
            G.player.update(dt);
            // car-to-car: we only own our car, so only it gets pushed
            const minDist = 3.4;
            G.remoteVehicles.forEach(v => {
                const dx = G.player.pos.x - v.pos.x, dz = G.player.pos.z - v.pos.z, d2 = dx * dx + dz * dz;
                if (d2 < minDist * minDist && d2 > 0.001) {
                    const d = Math.sqrt(d2), o = minDist - d;
                    G.player.pos.x += dx / d * o;
                    G.player.pos.z += dz / d * o;
                    G.player.speed *= 0.5;
                }
            });
        }
        updateLasers(dt);
        updateFx(dt);
        updateSignals(signals, G.time);
        updateCableCars(dt);
        if (G.windmill) G.windmill.rotation.z += dt * 0.35;
        if (M.water.bumpTexture) { M.water.bumpTexture.uOffset += dt * 0.0016; M.water.bumpTexture.vOffset += dt * 0.0011; }

        if (G.gameActive) {
            updateCamera(dt);
            hud.updateHUD();
            minimapTimer -= dt;
            if (minimapTimer <= 0) { hud.drawMinimap(); minimapTimer = 0.1; }
            fpsAcc += 1 / Math.max(dt, 1e-3); fpsFrames++; fpsWindow += dt;
            if (fpsWindow > 2) {
                const avg = fpsAcc / fpsFrames, lvl = engine.getHardwareScalingLevel();
                if (avg < 45) {
                    if (pipelines.ssr) downgrade(` (${Math.round(avg)} fps)`);
                    else if (lvl < maxLevel) engine.setHardwareScalingLevel(Math.min(maxLevel, lvl * 1.12));
                } else if (avg > 58 && lvl > baseLevel) {
                    engine.setHardwareScalingLevel(Math.max(baseLevel, lvl / 1.06));
                }
                fpsAcc = fpsFrames = fpsWindow = 0;
            }
        } else {
            updateMenuCamera();
        }
        hud.updateTags();
    });

    scene.executeWhenReady(() => {
        document.body.classList.add('ready');
        loadLabel.textContent = 'Ready';
        document.getElementById('start-btn').disabled = false;
    });
    engine.runRenderLoop(() => scene.render());

    // expose for debugging in the console
    window.__sflt = { G, scene, engine, pipelines, downgrade };
}

function startGame() {
    if (G.gameActive || document.getElementById('start-btn').disabled) return;
    const nameInput = document.getElementById('name-input');
    G.myName = nameInput.value.trim().slice(0, 16);
    try { localStorage.setItem('sflasertaxi-name', G.myName); } catch {}
    nameInput.blur();
    document.getElementById('overlay').classList.add('hidden');
    sound.init();
    G.player.respawn();
    G.player.visible = true;
    G.gameActive = true;
    document.body.classList.add('playing');
    // snap the camera behind the car
    const p = G.player;
    G.camera.position = p.pos.subtract(V(Math.sin(p.angle), 0, Math.cos(p.angle)).scale(10.5)).add(V(0, 4.2, 0));
    camState.look = V(Math.sin(p.angle), -0.1, Math.cos(p.angle)).normalize();
    hud.addKillFeed('SYSTEM ONLINE: autonomous laser tag engaged.');
    sendJoin();
}

main().catch(err => {
    console.error(err);
    const l = document.getElementById('load-label');
    if (l) l.textContent = 'Failed to load: ' + err.message;
});

