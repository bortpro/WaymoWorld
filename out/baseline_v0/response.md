```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Waymo World: SF Laser Tag</title>
    <style>
        body {
            margin: 0;
            overflow: hidden;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #000;
            user-select: none;
        }
        #canvas-container {
            width: 100vw;
            height: 100vh;
            position: absolute;
            top: 0;
            left: 0;
            z-index: 1;
        }
        #ui-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 2;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        .hud-top {
            display: flex;
            justify-content: space-between;
            padding: 20px 40px;
            background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
            color: #fff;
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        .title-box h1 {
            margin: 0;
            font-size: 28px;
            letter-spacing: 2px;
            color: #00f0ff;
            text-transform: uppercase;
        }
        .title-box p {
            margin: 0;
            font-size: 12px;
            color: #aaa;
        }
        .stats-box {
            display: flex;
            gap: 30px;
            font-size: 24px;
            font-weight: bold;
            align-items: center;
        }
        .stat {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .stat span {
            font-size: 12px;
            color: #00f0ff;
            text-transform: uppercase;
        }
        .hud-bottom {
            padding: 30px 40px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
        }
        .bars {
            width: 300px;
        }
        .bar-container {
            margin-bottom: 10px;
        }
        .bar-label {
            color: #fff;
            font-size: 12px;
            margin-bottom: 4px;
            display: flex;
            justify-content: space-between;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .bar-bg {
            width: 100%;
            height: 12px;
            background: rgba(255,255,255,0.2);
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.3);
        }
        #health-bar {
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, #00ff88, #00b8ff);
            transition: width 0.2s;
        }
        #energy-bar {
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, #ff0055, #ff00ff);
            transition: width 0.1s;
        }
        #radar {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            border: 2px solid #00f0ff;
            background: rgba(0, 20, 40, 0.6);
            position: relative;
            overflow: hidden;
            box-shadow: 0 0 15px rgba(0, 240, 255, 0.3);
        }
        #radar::after {
            content: '';
            position: absolute;
            top: 50%; left: 50%;
            width: 6px; height: 6px;
            background: #fff;
            border-radius: 50%;
            transform: translate(-50%, -50%);
        }
        #radar-sweep {
            position: absolute;
            top: 50%; left: 50%;
            width: 75px; height: 75px;
            background: linear-gradient(45deg, rgba(0, 240, 255, 0.5) 0%, transparent 70%);
            transform-origin: 0 0;
            animation: sweep 2s infinite linear;
        }
        @keyframes sweep {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        #crosshair {
            position: absolute;
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40px;
            height: 40px;
            border: 1px dashed rgba(0, 240, 255, 0.6);
            border-radius: 50%;
        }
        #crosshair::before, #crosshair::after {
            content: '';
            position: absolute;
            background: #00f0ff;
        }
        #crosshair::before { top: 19px; left: -5px; width: 10px; height: 2px; }
        #crosshair::after { top: 19px; right: -5px; width: 10px; height: 2px; }
        
        #overlay {
            position: absolute;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(5, 10, 20, 0.85);
            backdrop-filter: blur(10px);
            z-index: 10;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #fff;
            text-align: center;
        }
        #overlay h1 {
            font-size: 64px;
            margin: 0;
            background: linear-gradient(45deg, #00f0ff, #ff00aa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-transform: uppercase;
            letter-spacing: 4px;
        }
        #overlay p {
            font-size: 18px;
            color: #ccc;
            max-width: 600px;
            line-height: 1.6;
            margin: 20px 0 40px 0;
        }
        .controls-grid {
            display: grid;
            grid-template-columns: auto auto;
            gap: 15px 30px;
            text-align: left;
            background: rgba(255,255,255,0.05);
            padding: 20px 40px;
            border-radius: 10px;
            border: 1px solid rgba(0, 240, 255, 0.2);
            margin-bottom: 40px;
        }
        .key {
            background: #222;
            border: 1px solid #00f0ff;
            padding: 4px 10px;
            border-radius: 4px;
            color: #00f0ff;
            font-weight: bold;
            text-align: center;
        }
        button {
            padding: 15px 50px;
            font-size: 20px;
            font-weight: bold;
            color: #fff;
            background: linear-gradient(90deg, #00b8ff, #00ff88);
            border: none;
            border-radius: 30px;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 2px;
            box-shadow: 0 0 20px rgba(0, 240, 255, 0.5);
            transition: transform 0.2s, box-shadow 0.2s;
            pointer-events: auto;
        }
        button:hover {
            transform: scale(1.05);
            box-shadow: 0 0 30px rgba(0, 240, 255, 0.8);
        }
        #kill-feed {
            position: absolute;
            top: 100px;
            right: 40px;
            display: flex;
            flex-direction: column;
            gap: 5px;
            align-items: flex-end;
        }
        .feed-item {
            background: rgba(0,0,0,0.6);
            border-right: 3px solid #00f0ff;
            color: #fff;
            padding: 5px 15px;
            font-size: 14px;
            border-radius: 4px 0 0 4px;
            animation: fadeOut 4s forwards;
        }
        @keyframes fadeOut {
            0% { opacity: 1; transform: translateX(20px); }
            10% { transform: translateX(0); }
            80% { opacity: 1; }
            100% { opacity: 0; }
        }
        .damage-flash {
            position: absolute;
            top: 0; left: 0; width: 100vw; height: 100vh;
            box-shadow: inset 0 0 100px rgba(255, 0, 50, 0.8);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.1s;
            z-index: 5;
        }
    </style>
    <script type="importmap">
        {
            "imports": {
                "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
                "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
            }
        }
    </script>
</head>
<body>
    <div id="canvas-container"></div>
    <div class="damage-flash" id="damage-flash"></div>
    
    <div id="ui-layer">
        <div class="hud-top">
            <div class="title-box">
                <h1>Waymo World</h1>
                <p>Autonomous SF Laser Tag Division</p>
            </div>
            <div class="stats-box">
                <div class="stat">
                    <div id="score-val">0</div>
                    <span>Tags (Kills)</span>
                </div>
                <div class="stat">
                    <div id="bots-val">15</div>
                    <span>Active Units</span>
                </div>
                <div class="stat">
                    <div id="speed-val">0</div>
                    <span>MPH</span>
                </div>
            </div>
        </div>
        
        <div id="crosshair"></div>
        <div id="kill-feed"></div>

        <div class="hud-bottom">
            <div class="bars">
                <div class="bar-container">
                    <div class="bar-label"><span>LIDAR Integrity (Armor)</span><span id="hp-text">100%</span></div>
                    <div class="bar-bg"><div id="health-bar"></div></div>
                </div>
                <div class="bar-container">
                    <div class="bar-label"><span>Laser Capacitor</span><span id="en-text">100%</span></div>
                    <div class="bar-bg"><div id="energy-bar"></div></div>
                </div>
            </div>
            <div id="radar">
                <div id="radar-sweep"></div>
                <div id="radar-dots"></div>
            </div>
        </div>
    </div>

    <div id="overlay">
        <h1>Waymo World</h1>
        <p>Welcome to San Francisco. The humans are asleep, and the autonomous fleet has engaged in a city-wide game of high-voltage Laser Tag. Navigate the hills, dodge the Transamerica Pyramid, and tag rogue units using your roof-mounted LiDAR cannon.</p>
        <div class="controls-grid">
            <div class="key">W / S or ↑ / ↓</div><div>Throttle / Brake & Reverse</div>
            <div class="key">A / D or ← / →</div><div>Steer Left / Right</div>
            <div class="key">SPACE or CLICK</div><div>Fire Roof Laser</div>
            <div class="key">SHIFT</div><div>Overclock Motor (Boost)</div>
        </div>
        <button id="start-btn">Initialize System</button>
    </div>

    <script type="module">
        import * as THREE from 'three';
        import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
        import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
        import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

        // --- SOUND ENGINE (Web Audio API) ---
        class SoundEngine {
            constructor() {
                this.ctx = null;
                this.engineOsc = null;
                this.engineGain = null;
            }
            init() {
                if (this.ctx) return;
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                
                // EV Hum
                this.engineOsc = this.ctx.createOscillator();
                this.engineGain = this.ctx.createGain();
                this.engineOsc.type = 'sine';
                this.engineOsc.frequency.value = 100;
                this.engineGain.gain.value = 0.02;
                this.engineOsc.connect(this.engineGain);
                this.engineGain.connect(this.ctx.destination);
                this.engineOsc.start();
            }
            updateEngine(speedRatio) {
                if (!this.ctx) return;
                this.engineOsc.frequency.setTargetAtTime(80 + Math.abs(speedRatio) * 300, this.ctx.currentTime, 0.1);
                this.engineGain.gain.setTargetAtTime(0.02 + Math.abs(speedRatio) * 0.05, this.ctx.currentTime, 0.1);
            }
            playLaser(isPlayer = true) {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(isPlayer ? 800 : 600, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.15);
                
                gain.gain.setValueAtTime(isPlayer ? 0.15 : 0.05, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
                
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.15);
            }
            playHit() {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(150, this.ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.2);
                
                gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
                
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.2);
            }
            playExplosion() {
                if (!this.ctx) return;
                const bufferSize = this.ctx.sampleRate * 0.5;
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;
                
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800, this.ctx.currentTime);
                filter.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.5);

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);
                noise.start();
            }
        }
        const sound = new SoundEngine();

        // --- WORLD CONFIG & GLOBALS ---
        const WORLD_SIZE = 1200;
        const GRID_STEPS = 12; // Number of blocks
        const BLOCK_SIZE = 70;
        const STREET_WIDTH = 30;
        const CELL_SIZE = BLOCK_SIZE + STREET_WIDTH; // 100
        const OFFSET = (GRID_STEPS * CELL_SIZE) / 2;

        let scene, camera, renderer, composer;
        let player;
        let bots = [];
        let lasers = [];
        let particles = [];
        let buildings = []; // Bounding boxes for collision
        let gameActive = false;
        let score = 0;
        let clock = new THREE.Clock();

        // Inputs
        const keys = { w: false, a: false, s: false, d: false, space: false, shift: false };

        // --- PROCEDURAL TEXTURES ---
        function createBuildingTexture(baseColor) {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            
            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, 256, 512);
            
            const rows = 16;
            const cols = 8;
            const padX = 8;
            const padY = 10;
            const w = (256 - padX * (cols + 1)) / cols;
            const h = (512 - padY * (rows + 1)) / rows;
            
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (Math.random() > 0.3) {
                        // Lit window
                        ctx.fillStyle = Math.random() > 0.8 ? '#cceeff' : (Math.random() > 0.5 ? '#ffeebb' : '#557799');
                        if (Math.random() > 0.95) ctx.fillStyle = '#00f0ff'; // Cyberpunk accent
                    } else {
                        ctx.fillStyle = '#111520';
                    }
                    ctx.fillRect(padX + c * (w + padX), padY + r * (h + padY), w, h);
                }
            }
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            return tex;
        }

        function createRoadTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            
            // Sidewalk
            ctx.fillStyle = '#3a3a40';
            ctx.fillRect(0, 0, 512, 512);

            // Road base
            const roadPx = (STREET_WIDTH / CELL_SIZE) * 512;
            const blockPx = 512 - roadPx;

            ctx.fillStyle = '#1a1a22';
            // Horizontal road
            ctx.fillRect(0, 0, 512, roadPx);
            // Vertical road
            ctx.fillRect(0, 0, roadPx, 512);

            // Double yellow lines
            ctx.strokeStyle = '#dca820';
            ctx.lineWidth = 2;
            const mid = roadPx / 2;
            
            ctx.beginPath();
            ctx.moveTo(roadPx, mid - 2); ctx.lineTo(512, mid - 2);
            ctx.moveTo(roadPx, mid + 2); ctx.lineTo(512, mid + 2);
            ctx.moveTo(mid - 2, roadPx); ctx.lineTo(mid - 2, 512);
            ctx.moveTo(mid + 2, roadPx); ctx.lineTo(mid + 2, 512);
            ctx.stroke();

            // Crosswalks
            ctx.fillStyle = '#cccccc';
            for(let i=10; i<roadPx-10; i+=12) {
                ctx.fillRect(roadPx + 4, i, 15, 6);
                ctx.fillRect(i, roadPx + 4, 6, 15);
            }

            // Building Plot
            ctx.fillStyle = '#25252a';
            ctx.fillRect(roadPx + 10, roadPx + 10, blockPx - 20, blockPx - 20);

            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(GRID_STEPS, GRID_STEPS);
            tex.anisotropy = 16;
            return tex;
        }

        // --- SF ELEVATION FUNCTION ---
        function getElevation(x, z) {
            // Bay on the East side (x > 400)
            if (x > 450) return -8;
            
            // Smooth transition to bay
            let bayFactor = 1;
            if (x > 300) {
                bayFactor = 1 - ((x - 300) / 150);
            }

            // Iconic SF Hills (Nob Hill, Russian Hill, Telegraph Hill)
            let h = 0;
            // Base rolling hills
            h += (Math.sin(x * 0.008) * Math.cos(z * 0.008) + 1) * 25;
            // Steep central hill
            const dist1 = Math.sqrt((x + 100)**2 + (z - 100)**2);
            h += Math.max(0, 60 - dist1 * 0.2);
            // Secondary hill
            const dist2 = Math.sqrt((x - 100)**2 + (z + 200)**2);
            h += Math.max(0, 45 - dist2 * 0.15);

            return h * bayFactor;
        }

        function getTerrainNormal(x, z) {
            const d = 1.0;
            const hL = getElevation(x - d, z);
            const hR = getElevation(x + d, z);
            const hD = getElevation(x, z - d);
            const hU = getElevation(x, z + d);
            const normal = new THREE.Vector3(hL - hR, 2.0 * d, hD - hU);
            normal.normalize();
            return normal;
        }

        // --- WAYMO CAR GENERATOR ---
        function createWaymoMesh(isPlayer = false) {
            const group = new THREE.Group();

            // Materials
            const bodyMat = new THREE.MeshStandardMaterial({ 
                color: 0xffffff, 
                roughness: 0.1, 
                metalness: 0.1 
            });
            const glassMat = new THREE.MeshStandardMaterial({ 
                color: 0x050510, 
                roughness: 0.0, 
                metalness: 0.9 
            });
            const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
            const lidarMat = new THREE.MeshStandardMaterial({ 
                color: isPlayer ? 0x00f0ff : 0xff0055, 
                emissive: isPlayer ? 0x00f0ff : 0xff0055,
                emissiveIntensity: 2
            });
            const headlightMat = new THREE.MeshStandardMaterial({ 
                color: 0xffffff, emissive: 0xccffff, emissiveIntensity: 3 
            });
            const taillightMat = new THREE.MeshStandardMaterial({ 
                color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2 
            });

            // Main Chassis (Jaguar I-Pace SUV style)
            const chassisGeo = new THREE.BoxGeometry(2.2, 0.9, 4.6);
            const chassis = new THREE.Mesh(chassisGeo, bodyMat);
            chassis.position.y = 0.65;
            chassis.castShadow = true;
            chassis.receiveShadow = true;
            group.add(chassis);

            // Cabin
            const cabinGeo = new THREE.BoxGeometry(1.9, 0.7, 2.6);
            const cabin = new THREE.Mesh(cabinGeo, glassMat);
            cabin.position.set(0, 1.4, -0.2);
            cabin.castShadow = true;
            group.add(cabin);

            // Roof (White top)
            const roofGeo = new THREE.BoxGeometry(1.85, 0.1, 2.4);
            const roof = new THREE.Mesh(roofGeo, bodyMat);
            roof.position.set(0, 1.75, -0.2);
            group.add(roof);

            // Waymo "Blue" Accent stripes
            const stripeGeo = new THREE.BoxGeometry(2.22, 0.15, 3.0);
            const stripeMat = new THREE.MeshBasicMaterial({ color: isPlayer ? 0x00f0ff : 0xff0055 });
            const stripe = new THREE.Mesh(stripeGeo, stripeMat);
            stripe.position.set(0, 0.6, 0);
            group.add(stripe);

            // --- WAYMO SENSORS (The iconic look) ---
            // Top LiDAR Dome
            const lidarBaseGeo = new THREE.CylinderGeometry(0.3, 0.4, 0.2, 16);
            const lidarBase = new THREE.Mesh(lidarBaseGeo, darkMat);
            lidarBase.position.set(0, 1.9, 0);
            group.add(lidarBase);

            const lidarDomeGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.25, 16);
            const lidarDome = new THREE.Mesh(lidarDomeGeo, lidarMat);
            lidarDome.position.set(0, 2.1, 0);
            group.add(lidarDome);

            // Spinning Laser Turret inside LiDAR
            const turretGeo = new THREE.BoxGeometry(0.1, 0.1, 0.6);
            const turret = new THREE.Mesh(turretGeo, darkMat);
            turret.position.set(0, 2.25, 0.1);
            group.add(turret);
            group.userData.turret = lidarDome;

            // Side/Front Bumper Sensors
            const sensorGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 8);
            const positions = [
                [0.9, 0.9, 2.2], [-0.9, 0.9, 2.2], // Front corners
                [1.1, 1.1, 1.0], [-1.1, 1.1, 1.0], // Side mirrors
                [0, 1.1, -2.3] // Rear
            ];
            positions.forEach(pos => {
                const s = new THREE.Mesh(sensorGeo, darkMat);
                s.position.set(...pos);
                group.add(s);
            });

            // Lights
            const hlGeo = new THREE.BoxGeometry(0.4, 0.15, 0.1);
            const hlL = new THREE.Mesh(hlGeo, headlightMat);
            hlL.position.set(0.7, 0.8, 2.3);
            const hlR = hlL.clone();
            hlR.position.x = -0.7;
            group.add(hlL, hlR);

            const tlGeo = new THREE.BoxGeometry(2.0, 0.15, 0.1);
            const tl = new THREE.Mesh(tlGeo, taillightMat);
            tl.position.set(0, 0.9, -2.3);
            group.add(tl);

            // Wheels
            const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
            wheelGeo.rotateZ(Math.PI / 2);
            const wheelPositions = [
                [1.0, 0.4, 1.5], [-1.0, 0.4, 1.5],
                [1.0, 0.4, -1.5], [-1.0, 0.4, -1.5]
            ];
            wheelPositions.forEach(pos => {
                const w = new THREE.Mesh(wheelGeo, darkMat);
                w.position.set(...pos);
                w.castShadow = true;
                group.add(w);
            });

            return group;
        }

        // --- ENTITY CLASSES ---
        class Vehicle {
            constructor(x, z, isPlayer = false) {
                this.isPlayer = isPlayer;
                this.mesh = createWaymoMesh(isPlayer);
                scene.add(this.mesh);
                
                this.pos = new THREE.Vector3(x, getElevation(x, z), z);
                this.vel = new THREE.Vector3();
                this.speed = 0;
                this.angle = Math.random() * Math.PI * 2;
                
                this.maxSpeed = isPlayer ? 55 : 40;
                this.accel = 35;
                this.handling = 2.5;
                
                this.hp = 100;
                this.energy = 100;
                this.lastShot = 0;

                // AI specifics
                this.aiState = 'wander';
                this.targetAngle = this.angle;
                this.aiTimer = 0;
            }

            update(dt) {
                // Energy regen
                this.energy = Math.min(100, this.energy + 25 * dt);

                if (this.isPlayer) {
                    this.handlePlayerInput(dt);
                } else {
                    this.handleAI(dt);
                }

                // Physics & Movement
                // Apply friction
                this.speed *= Math.pow(0.4, dt);

                // Calculate velocity vector
                const forward = new THREE.Vector3(Math.sin(this.angle), 0, Math.cos(this.angle));
                
                // Proposed new position
                const nextX = this.pos.x + forward.x * this.speed * dt;
                const nextZ = this.pos.z + forward.z * this.speed * dt;

                // World Bounds & Bay Collision
                if (nextX > -OFFSET + 20 && nextX < 420 && nextZ > -OFFSET + 20 && nextZ < OFFSET - 20) {
                    // Building Collision
                    if (!this.checkBuildingCollision(nextX, nextZ)) {
                        this.pos.x = nextX;
                        this.pos.z = nextZ;
                    } else {
                        this.speed *= -0.5; // Bounce off building
                        if (this.isPlayer) sound.playHit();
                        this.aiTimer = 0; // Force AI to rethink
                    }
                } else {
                    this.speed *= -0.5;
                    this.angle += Math.PI; // Turn around at edge
                }

                // Terrain Following
                const targetY = getElevation(this.pos.x, this.pos.z);
                this.pos.y = targetY;
                this.mesh.position.copy(this.pos);

                // Orientation on hills
                const normal = getTerrainNormal(this.pos.x, this.pos.z);
                
                // Project forward vector onto terrain plane
                const projForward = forward.clone().projectOnPlane(normal).normalize();
                const right = new THREE.Vector3().crossVectors(normal, projForward).normalize();
                
                const rotMatrix = new THREE.Matrix4();
                rotMatrix.makeBasis(right, normal, projForward);
                
                // Smooth rotation
                const targetQuat = new THREE.Quaternion().setFromRotationMatrix(rotMatrix);
                this.mesh.quaternion.slerp(targetQuat, 15 * dt);

                // Spin LiDAR
                this.mesh.userData.turret.rotation.y += 10 * dt;
            }

            handlePlayerInput(dt) {
                let currentMax = keys.shift && this.energy > 5 ? this.maxSpeed * 1.4 : this.maxSpeed;
                if (keys.shift && Math.abs(this.speed) > 10) {
                    this.energy = Math.max(0, this.energy - 30 * dt);
                    // Boost particles
                    if (Math.random() > 0.5) {
                        const back = this.pos.clone().sub(new THREE.Vector3(Math.sin(this.angle)*2, -0.5, Math.cos(this.angle)*2));
                        createParticles(back, 0x00f0ff, 1, 2);
                    }
                }

                if (keys.w) this.speed += this.accel * dt;
                if (keys.s) this.speed -= this.accel * dt;
                
                this.speed = THREE.MathUtils.clamp(this.speed, -currentMax * 0.5, currentMax);

                // Steering (only when moving)
                if (Math.abs(this.speed) > 0.5) {
                    const dir = this.speed > 0 ? 1 : -1;
                    const turnFactor = Math.min(1, Math.abs(this.speed) / 10);
                    if (keys.a) this.angle += this.handling * dt * dir * turnFactor;
                    if (keys.d) this.angle -= this.handling * dt * dir * turnFactor;
                }

                if (keys.space) this.shoot();

                sound.updateEngine(this.speed / this.maxSpeed);
            }

            handleAI(dt) {
                this.aiTimer -= dt;
                
                // Find nearest target (Player or other bot)
                let nearestDist = 9999;
                let target = null;

                // Check player
                if (player) {
                    const d = this.pos.distanceTo(player.pos);
                    if (d < nearestDist) { nearestDist = d; target = player; }
                }
                // Check other bots
                bots.forEach(b => {
                    if (b !== this) {
                        const d = this.pos.distanceTo(b.pos);
                        if (d < nearestDist) { nearestDist = d; target = b; }
                    }
                });

                if (target && nearestDist < 120) {
                    // Chase & Attack
                    const dx = target.pos.x - this.pos.x;
                    const dz = target.pos.z - this.pos.z;
                    this.targetAngle = Math.atan2(dx, dz);

                    // Shoot if lined up
                    const angleDiff = Math.abs(this.normalizeAngle(this.angle - this.targetAngle));
                    if (angleDiff < 0.3 && nearestDist < 90) {
                        this.shoot();
                    }
                } else if (this.aiTimer <= 0) {
                    // Wander along grid (mostly 90 degree turns)
                    const dirs = [0, Math.PI/2, Math.PI, -Math.PI/2];
                    this.targetAngle = dirs[Math.floor(Math.random() * dirs.length)] + (Math.random()*0.2 - 0.1);
                    this.aiTimer = 2 + Math.random() * 3;
                }

                // Raycast/Lookahead for buildings
                const lookAheadDist = 12;
                const lookX = this.pos.x + Math.sin(this.angle) * lookAheadDist;
                const lookZ = this.pos.z + Math.cos(this.angle) * lookAheadDist;
                if (this.checkBuildingCollision(lookX, lookZ)) {
                    this.targetAngle += Math.PI / 2;
                    this.speed *= 0.8;
                }

                // Steer towards targetAngle
                const diff = this.normalizeAngle(this.targetAngle - this.angle);
                this.angle += Math.sign(diff) * Math.min(Math.abs(diff), this.handling * dt);

                this.speed += this.accel * 0.8 * dt;
                this.speed = Math.min(this.speed, this.maxSpeed);
            }

            normalizeAngle(a) {
                while (a > Math.PI) a -= Math.PI * 2;
                while (a < -Math.PI) a += Math.PI * 2;
                return a;
            }

            checkBuildingCollision(x, z) {
                const carRadius = 1.8;
                for (let b of buildings) {
                    if (x + carRadius > b.minX && x - carRadius < b.maxX &&
                        z + carRadius > b.minZ && z - carRadius < b.maxZ) {
                        return true;
                    }
                }
                return false;
            }

            shoot() {
                const now = clock.getElapsedTime();
                if (now - this.lastShot < 0.25 || this.energy < 15) return;
                
                this.lastShot = now;
                this.energy -= 15;
                sound.playLaser(this.isPlayer);

                // Spawn laser from LiDAR dome
                const spawnPos = this.pos.clone();
                spawnPos.y += 2.1;

                // Aim vector (follows terrain pitch slightly, or aims at crosshair for player)
                const forward = new THREE.Vector3(Math.sin(this.angle), 0, Math.cos(this.angle));
                const normal = getTerrainNormal(this.pos.x, this.pos.z);
                const dir = forward.projectOnPlane(normal).normalize();

                // Auto-aim assist in Y axis towards targets
                let bestTarget = null;
                let minAngle = 0.25; // Cone of ~15 degrees

                const potentialTargets = this.isPlayer ? bots : [player, ...bots.filter(b => b !== this)];
                potentialTargets.forEach(t => {
                    if (!t) return;
                    const toTarget = t.pos.clone().sub(this.pos);
                    const dist = toTarget.length();
                    if (dist < 120) {
                        toTarget.normalize();
                        const angle = dir.angleTo(toTarget);
                        if (angle < minAngle) {
                            minAngle = angle;
                            bestTarget = t;
                        }
                    }
                });

                if (bestTarget) {
                    // Adjust pitch (Y) to hit target on hills, plus slight horizontal magnetism
                    const aimPos = bestTarget.pos.clone();
                    aimPos.y += 1.0; // Aim at center mass
                    const exactDir = aimPos.sub(spawnPos).normalize();
                    dir.lerp(exactDir, 0.7).normalize();
                }

                lasers.push(new Laser(spawnPos, dir, this));
            }

            takeDamage(amount, attacker) {
                this.hp -= amount;
                createParticles(this.pos.clone().add(new THREE.Vector3(0,1,0)), this.isPlayer ? 0x00f0ff : 0xff0055, 10, 5);
                
                if (this.isPlayer) {
                    sound.playHit();
                    const flash = document.getElementById('damage-flash');
                    flash.style.opacity = 1;
                    setTimeout(() => flash.style.opacity = 0, 150);
                }

                if (this.hp <= 0) {
                    this.die(attacker);
                }
            }

            die(attacker) {
                sound.playExplosion();
                createParticles(this.pos.clone().add(new THREE.Vector3(0,1,0)), 0xffaa00, 40, 15);
                createParticles(this.pos.clone().add(new THREE.Vector3(0,1,0)), 0x00f0ff, 20, 10);

                if (this.isPlayer) {
                    addKillFeed("SYSTEM FAILURE: Your Waymo was tagged out!");
                    this.respawn();
                } else {
                    if (attacker && attacker.isPlayer) {
                        score++;
                        document.getElementById('score-val').innerText = score;
                        addKillFeed(`Tagged Rogue Waymo #${Math.floor(Math.random()*900+100)}!`);
                        // Heal player slightly on kill
                        player.hp = Math.min(100, player.hp + 25);
                    } else {
                        addKillFeed(`Waymo Unit tagged another Waymo Unit`);
                    }
                    this.respawn();
                }
            }

            respawn() {
                this.hp = 100;
                this.energy = 100;
                this.speed = 0;
                // Find valid street position
                const gx = Math.floor(Math.random() * (GRID_STEPS - 2)) + 1;
                const gz = Math.floor(Math.random() * (GRID_STEPS - 2)) + 1;
                this.pos.x = -OFFSET + gx * CELL_SIZE + STREET_WIDTH / 2;
                this.pos.z = -OFFSET + gz * CELL_SIZE + STREET_WIDTH / 2;
                if (this.pos.x > 350) this.pos.x = 0; // Keep out of bay
                this.pos.y = getElevation(this.pos.x, this.pos.z);
            }
        }

        class Laser {
            constructor(pos, dir, owner) {
                this.pos = pos.clone();
                this.dir = dir.normalize();
                this.owner = owner;
                this.speed = 250;
                this.life = 1.0; // seconds

                const geo = new THREE.CylinderGeometry(0.08, 0.08, 4, 8);
                geo.rotateX(Math.PI / 2);
                const color = owner.isPlayer ? 0x00ff88 : 0xff0055;
                const mat = new THREE.MeshBasicMaterial({ color: color });
                this.mesh = new THREE.Mesh(geo, mat);
                
                this.mesh.position.copy(this.pos);
                this.mesh.lookAt(this.pos.clone().add(this.dir));
                scene.add(this.mesh);
            }

            update(dt) {
                this.life -= dt;
                const moveDist = this.speed * dt;
                this.pos.addScaledVector(this.dir, moveDist);
                this.mesh.position.copy(this.pos);

                // Check terrain collision
                if (this.pos.y < getElevation(this.pos.x, this.pos.z)) {
                    createParticles(this.pos, 0xffff00, 5, 3);
                    return false;
                }

                // Check building collision
                for (let b of buildings) {
                    if (this.pos.x > b.minX && this.pos.x < b.maxX &&
                        this.pos.z > b.minZ && this.pos.z < b.maxZ &&
                        this.pos.y < b.maxY) {
                        createParticles(this.pos, 0xffff00, 5, 3);
                        return false;
                    }
                }

                // Check vehicle collision
                const targets = this.owner.isPlayer ? bots : [player, ...bots.filter(b => b !== this.owner)];
                for (let t of targets) {
                    if (!t) continue;
                    // Simple bounding sphere/cylinder check
                    const dx = this.pos.x - t.pos.x;
                    const dz = this.pos.z - t.pos.z;
                    const dy = this.pos.y - (t.pos.y + 1.0);
                    if (dx*dx + dz*dz < 4.5 && Math.abs(dy) < 1.5) {
                        t.takeDamage(25, this.owner);
                        return false;
                    }
                }

                return this.life > 0;
            }

            destroy() {
                scene.remove(this.mesh);
                this.mesh.geometry.dispose();
                this.mesh.material.dispose();
            }
        }

        // --- PARTICLE SYSTEM ---
        function createParticles(pos, color, count, speed) {
            const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
            const mat = new THREE.MeshBasicMaterial({ color: color });
            
            for (let i = 0; i < count; i++) {
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.copy(pos);
                
                const vel = new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    Math.random() * 1.5,
                    (Math.random() - 0.5) * 2
                ).normalize().multiplyScalar(Math.random() * speed);

                scene.add(mesh);
                particles.push({ mesh, vel, life: 0.5 + Math.random() * 0.5 });
            }
        }

        function updateParticles(dt) {
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.life -= dt;
                p.vel.y -= 25 * dt; // Gravity
                p.mesh.position.addScaledVector(p.vel, dt);
                p.mesh.rotation.x += 5 * dt;
                p.mesh.rotation.y += 5 * dt;
                p.mesh.scale.setScalar(p.life);

                if (p.life <= 0) {
                    scene.remove(p.mesh);
                    p.mesh.geometry.dispose();
                    particles.splice(i, 1);
                }
            }
        }

        // --- WORLD GENERATION ---
        function buildSanFrancisco() {
            // 1. Terrain (Road Grid & Hills)
            const terrainGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 240, 240);
            terrainGeo.rotateX(-Math.PI / 2);
            
            const posAttr = terrainGeo.attributes.position;
            for (let i = 0; i < posAttr.count; i++) {
                const x = posAttr.getX(i);
                const z = posAttr.getZ(i);
                posAttr.setY(i, getElevation(x, z));
            }
            terrainGeo.computeVertexNormals();

            const terrainMat = new THREE.MeshStandardMaterial({ 
                map: createRoadTexture(),
                roughness: 0.8,
                metalness: 0.1
            });
            const terrain = new THREE.Mesh(terrainGeo, terrainMat);
            terrain.receiveShadow = true;
            scene.add(terrain);

            // 2. San Francisco Bay (Water)
            const waterGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE);
            waterGeo.rotateX(-Math.PI / 2);
            const waterMat = new THREE.MeshStandardMaterial({
                color: 0x003355,
                roughness: 0.1,
                metalness: 0.8
            });
            const water = new THREE.Mesh(waterGeo, waterMat);
            water.position.y = -2;
            scene.add(water);

            // 3. Golden Gate / Bay Bridge in distance
            buildBridge();

            // 4. City Blocks & Landmarks
            const texColors = ['#dcdcdc', '#a0b0c0', '#d8c8b8', '#8899aa', '#e0e5ff'];
            const bTextures = texColors.map(c => createBuildingTexture(c));
            const victorianColors = [0xff88aa, 0x88ffaa, 0x88ccff, 0xffdd88, 0xcc99ff];

            for (let gx = 0; gx < GRID_STEPS; gx++) {
                for (let gz = 0; gz < GRID_STEPS; gz++) {
                    const cellX = -OFFSET + gx * CELL_SIZE;
                    const cellZ = -OFFSET + gz * CELL_SIZE;
                    
                    // Center of the building plot
                    const bx = cellX + STREET_WIDTH + BLOCK_SIZE / 2;
                    const bz = cellZ + STREET_WIDTH + BLOCK_SIZE / 2;

                    // Skip if in the Bay
                    if (bx > 380) continue;

                    const groundY = getElevation(bx, bz);

                    // Special Landmark: Transamerica Pyramid
                    if (gx === 7 && gz === 6) {
                        const pyrH = 180;
                        const pyrGeo = new THREE.ConeGeometry(30, pyrH, 4);
                        pyrGeo.rotateY(Math.PI / 4);
                        const pyrMat = new THREE.MeshStandardMaterial({ 
                            color: 0xffffff, roughness: 0.3, map: bTextures[0] 
                        });
                        const pyr = new THREE.Mesh(pyrGeo, pyrMat);
                        pyr.position.set(bx, groundY + pyrH/2 - 10, bz);
                        pyr.castShadow = true;
                        pyr.receiveShadow = true;
                        scene.add(pyr);

                        // Wings
                        const wingGeo = new THREE.BoxGeometry(15, 60, 45);
                        const wing = new THREE.Mesh(wingGeo, pyrMat);
                        wing.position.set(bx, groundY + 30, bz);
                        scene.add(wing);

                        // Glowing Spire
                        const spireGeo = new THREE.ConeGeometry(2, 20, 4);
                        const spireMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
                        const spire = new THREE.Mesh(spireGeo, spireMat);
                        spire.position.set(bx, groundY + pyrH - 5, bz);
                        scene.add(spire);

                        buildings.push({ minX: bx-25, maxX: bx+25, minZ: bz-25, maxZ: bz+25, maxY: groundY + pyrH });
                        continue;
                    }

                    // Special Landmark: Coit Tower (on top of hill)
                    if (gx === 4 && gz === 7) {
                        const coitH = 70;
                        const coitGeo = new THREE.CylinderGeometry(10, 12, coitH, 16);
                        const coitMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
                        const coit = new THREE.Mesh(coitGeo, coitMat);
                        coit.position.set(bx, groundY + coitH/2 - 5, bz);
                        coit.castShadow = true;
                        scene.add(coit);
                        buildings.push({ minX: bx-12, maxX: bx+12, minZ: bz-12, maxZ: bz+12, maxY: groundY + coitH });
                        continue;
                    }

                    // Downtown Skyscrapers (East/Center) vs Victorian Houses (West/Hills)
                    const isDowntown = gx >= 6 && gz >= 4 && gz <= 8;

                    if (isDowntown) {
                        // 1 or 2 big skyscrapers per block
                        const w = BLOCK_SIZE - 16;
                        const d = BLOCK_SIZE - 16;
                        const h = 50 + Math.random() * 90;
                        
                        const bGeo = new THREE.BoxGeometry(w, h + 30, d);
                        const tex = bTextures[Math.floor(Math.random() * bTextures.length)];
                        const bMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.2, metalness: 0.3 });
                        
                        const bMesh = new THREE.Mesh(bGeo, bMat);
                        // Sink by 15 to prevent floating on steep hills
                        bMesh.position.set(bx, groundY + h/2 - 15, bz);
                        bMesh.castShadow = true;
                        bMesh.receiveShadow = true;
                        scene.add(bMesh);

                        buildings.push({ minX: bx - w/2, maxX: bx + w/2, minZ: bz - d/2, maxZ: bz + d/2, maxY: groundY + h });
                    } else {
                        // Painted Ladies / SF Row Houses (Subdivide block)
                        const subSize = (BLOCK_SIZE - 16) / 2;
                        for (let sx = -0.5; sx <= 0.5; sx += 1) {
                            for (let sz = -0.5; sz <= 0.5; sz += 1) {
                                const hx = bx + sx * (subSize + 4);
                                const hz = bz + sz * (subSize + 4);
                                const hy = getElevation(hx, hz);
                                const hh = 15 + Math.random() * 15;

                                const hGeo = new THREE.BoxGeometry(subSize, hh + 20, subSize);
                                const color = victorianColors[Math.floor(Math.random() * victorianColors.length)];
                                const hMat = new THREE.MeshStandardMaterial({ 
                                    color: color, 
                                    map: bTextures[0],
                                    roughness: 0.6 
                                });
                                const hMesh = new THREE.Mesh(hGeo, hMat);
                                hMesh.position.set(hx, hy + hh/2 - 10, hz);
                                hMesh.castShadow = true;
                                hMesh.receiveShadow = true;
                                scene.add(hMesh);

                                // Pitched roof
                                const rGeo = new THREE.ConeGeometry(subSize * 0.7, 6, 4);
                                rGeo.rotateY(Math.PI / 4);
                                const rMat = new THREE.MeshStandardMaterial({ color: 0x333344 });
                                const rMesh = new THREE.Mesh(rGeo, rMat);
                                rMesh.position.set(hx, hy + hh + 3, hz);
                                scene.add(rMesh);

                                buildings.push({ 
                                    minX: hx - subSize/2, maxX: hx + subSize/2, 
                                    minZ: hz - subSize/2, maxZ: hz + subSize/2, 
                                    maxY: hy + hh + 5 
                                });
                            }
                        }
                    }

                    // Streetlights & Trees on corners
                    addStreetProps(cellX + STREET_WIDTH, cellZ + STREET_WIDTH);
                }
            }
        }

        function addStreetProps(x, z) {
            if (x > 380) return;
            const y = getElevation(x, z);
            
            // Cyberpunk Neon Streetlight
            const poleGeo = new THREE.CylinderGeometry(0.15, 0.2, 8, 8);
            const poleMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.set(x + 2, y + 4, z + 2);
            scene.add(pole);

            const lightGeo = new THREE.BoxGeometry(2, 0.2, 0.4);
            const lightMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
            const light = new THREE.Mesh(lightGeo, lightMat);
            light.position.set(x + 1, y + 8, z + 2);
            scene.add(light);
        }

        function buildBridge() {
            const bridgeGroup = new THREE.Group();
            const redMat = new THREE.MeshStandardMaterial({ color: 0xc0362c, roughness: 0.4 }); // International Orange
            const cableMat = new THREE.MeshBasicMaterial({ color: 0xffaa55 });

            // Two massive towers in the bay
            for (let z of [-250, 250]) {
                const towerGeo = new THREE.BoxGeometry(15, 220, 25);
                const tower = new THREE.Mesh(towerGeo, redMat);
                tower.position.set(520, 100, z);
                bridgeGroup.add(tower);

                // Crossbeams
                for(let y of [60, 120, 180]) {
                    const beam = new THREE.Mesh(new THREE.BoxGeometry(16, 8, 35), redMat);
                    beam.position.set(520, y, z);
                    bridgeGroup.add(beam);
                }
            }

            // Road deck
            const deckGeo = new THREE.BoxGeometry(20, 4, 1200);
            const deck = new THREE.Mesh(deckGeo, redMat);
            deck.position.set(520, 40, 0);
            bridgeGroup.add(deck);

            scene.add(bridgeGroup);
        }

        // --- INITIALIZATION & LOOP ---
        function init() {
            const container = document.getElementById('canvas-container');
            
            scene = new THREE.Scene();
            // Golden Hour / Cyberpunk Dusk Sky & Fog
            scene.background = new THREE.Color(0x151025);
            scene.fog = new THREE.FogExp2(0x151025, 0.0018);

            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
            
            renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.1;
            container.appendChild(renderer.domElement);

            // Post-Processing (Bloom for Lasers & Neon)
            const renderScene = new RenderPass(scene, camera);
            const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
            bloomPass.threshold = 0.6;
            bloomPass.strength = 1.2;
            bloomPass.radius = 0.5;

            composer = new EffectComposer(renderer);
            composer.addPass(renderScene);
            composer.addPass(bloomPass);

            // Lighting
            const ambientLight = new THREE.HemisphereLight(0x443366, 0x111122, 1.5);
            scene.add(ambientLight);

            const sunLight = new THREE.DirectionalLight(0xffaa66, 2.5);
            sunLight.position.set(-300, 250, -200);
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 2048;
            sunLight.shadow.mapSize.height = 2048;
            sunLight.shadow.camera.near = 10;
            sunLight.shadow.camera.far = 1000;
            const d = 400;
            sunLight.shadow.camera.left = -d;
            sunLight.shadow.camera.right = d;
            sunLight.shadow.camera.top = d;
            sunLight.shadow.camera.bottom = -d;
            sunLight.shadow.bias = -0.0005;
            scene.add(sunLight);

            // Build World
            buildSanFrancisco();

            // Spawn Player
            player = new Vehicle(-50, 50, true);
            player.respawn();

            // Spawn Autonomous Fleet (Bots)
            const botCount = 15;
            for (let i = 0; i < botCount; i++) {
                const bot = new Vehicle(0, 0, false);
                bot.respawn();
                bots.push(bot);
            }
            document.getElementById('bots-val').innerText = botCount + 1;

            // Event Listeners
            window.addEventListener('resize', onWindowResize);
            window.addEventListener('keydown', e => handleKey(e, true));
            window.addEventListener('keyup', e => handleKey(e, false));
            window.addEventListener('mousedown', () => { if(gameActive) keys.space = true; });
            window.addEventListener('mouseup', () => keys.space = false);

            document.getElementById('start-btn').addEventListener('click', () => {
                document.getElementById('overlay').style.display = 'none';
                sound.init();
                gameActive = true;
                addKillFeed("SYSTEM ONLINE: Autonomous Laser Tag Engaged.");
            });

            // Start Loop
            animate();
        }

        function handleKey(e, isDown) {
            const code = e.code;
            if (code === 'KeyW' || code === 'ArrowUp') keys.w = isDown;
            if (code === 'KeyS' || code === 'ArrowDown') keys.s = isDown;
            if (code === 'KeyA' || code === 'ArrowLeft') keys.a = isDown;
            if (code === 'KeyD' || code === 'ArrowRight') keys.d = isDown;
            if (code === 'Space') keys.space = isDown;
            if (code === 'ShiftLeft' || code === 'ShiftRight') keys.shift = isDown;
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
        }

        function addKillFeed(text) {
            const feed = document.getElementById('kill-feed');
            const item = document.createElement('div');
            item.className = 'feed-item';
            item.innerText = text;
            feed.appendChild(item);
            setTimeout(() => {
                if (feed.contains(item)) feed.removeChild(item);
            }, 4000);
        }

        function updateHUD() {
            if (!player) return;
            document.getElementById('speed-val').innerText = Math.floor(Math.abs(player.speed) * 1.5);
            
            const hpPct = Math.max(0, Math.floor(player.hp));
            document.getElementById('health-bar').style.width = hpPct + '%';
            document.getElementById('hp-text').innerText = hpPct + '%';

            const enPct = Math.max(0, Math.floor(player.energy));
            document.getElementById('energy-bar').style.width = enPct + '%';
            document.getElementById('en-text').innerText = enPct + '%';

            // Radar Update
            const radarDots = document.getElementById('radar-dots');
            radarDots.innerHTML = '';
            const radarScale = 75 / 200; // 200 units range = 75px radius

            bots.forEach(b => {
                const dx = b.pos.x - player.pos.x;
                const dz = b.pos.z - player.pos.z;
                const dist = Math.sqrt(dx*dx + dz*dz);
                
                if (dist < 200) {
                    // Rotate relative to player heading
                    const angle = Math.atan2(dx, dz) - player.angle;
                    const rx = Math.sin(angle) * dist * radarScale;
                    const ry = -Math.cos(angle) * dist * radarScale; // -Y is up on screen

                    const dot = document.createElement('div');
                    dot.style.position = 'absolute';
                    dot.style.width = '5px';
                    dot.style.height = '5px';
                    dot.style.background = '#ff0055';
                    dot.style.borderRadius = '50%';
                    dot.style.boxShadow = '0 0 5px #ff0055';
                    dot.style.left = (75 + rx - 2.5) + 'px';
                    dot.style.top = (75 + ry - 2.5) + 'px';
                    radarDots.appendChild(dot);
                }
            });
        }

        function updateCamera(dt) {
            if (!player) return;
            
            // Chase camera calculation
            const forward = new THREE.Vector3(Math.sin(player.angle), 0, Math.cos(player.angle));
            const desiredPos = player.pos.clone()
                .sub(forward.multiplyScalar(11))
                .add(new THREE.Vector3(0, 4.5, 0));

            // Prevent camera from clipping into steep SF hills behind the car
            const terrainH = getElevation(desiredPos.x, desiredPos.z);
            if (desiredPos.y < terrainH + 2.0) {
                desiredPos.y = terrainH + 2.0;
            }

            camera.position.lerp(desiredPos, 10 * dt);

            // Look ahead of the car
            const lookTarget = player.pos.clone()
                .add(new THREE.Vector3(Math.sin(player.angle) * 15, 2.0, Math.cos(player.angle) * 15));
            
            // Smooth lookAt
            const currentLook = new THREE.Vector3();
            camera.getWorldDirection(currentLook);
            const targetDir = lookTarget.sub(camera.position).normalize();
            currentLook.lerp(targetDir, 12 * dt);
            camera.lookAt(camera.position.clone().add(currentLook));
        }

        function animate() {
            requestAnimationFrame(animate);
            
            const dt = Math.min(clock.getDelta(), 0.1);

            if (gameActive) {
                player.update(dt);
                bots.forEach(b => b.update(dt));

                // Vehicle-to-Vehicle Collisions
                const allVehicles = [player, ...bots];
                for (let i = 0; i < allVehicles.length; i++) {
                    for (let j = i + 1; j < allVehicles.length; j++) {
                        const v1 = allVehicles[i];
                        const v2 = allVehicles[j];
                        const dx = v2.pos.x - v1.pos.x;
                        const dz = v2.pos.z - v1.pos.z;
                        const distSq = dx*dx + dz*dz;
                        const minDist = 3.2;
                        if (distSq < minDist * minDist && distSq > 0.001) {
                            const dist = Math.sqrt(distSq);
                            const overlap = (minDist - dist) * 0.5;
                            const nx = dx / dist;
                            const nz = dz / dist;
                            v1.pos.x -= nx * overlap;
                            v1.pos.z -= nz * overlap;
                            v2.pos.x += nx * overlap;
                            v2.pos.z += nz * overlap;
                            // Bounce speeds slightly
                            const temp = v1.speed;
                            v1.speed = v2.speed * 0.8;
                            v2.speed = temp * 0.8;
                        }
                    }
                }

                // Update Lasers
                for (let i = lasers.length - 1; i >= 0; i--) {
                    if (!lasers[i].update(dt)) {
                        lasers[i].destroy();
                        lasers.splice(i, 1);
                    }
                }

                updateParticles(dt);
                updateCamera(dt);
                updateHUD();
            } else {
                // Cinematic menu camera orbiting Transamerica Pyramid
                const t = clock.getElapsedTime() * 0.2;
                camera.position.set(150 + Math.cos(t) * 180, 120, 50 + Math.sin(t) * 180);
                camera.lookAt(150, 60, 50);
            }

            composer.render();
        }

        // Boot up
        init();
    </script>
</body>
</html>
```