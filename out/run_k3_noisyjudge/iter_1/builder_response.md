<<<<<<< SEARCH
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
=======
        let gameActive = false;
        let score = 0;
        let totalLasersFired = 0;
        let lastFps = 60;
        let stuckCounter = 0;
        let lastPlayerPos = new THREE.Vector3();
        let beamTraces = [];
        let clock = new THREE.Clock();

        window.__waymo = {
            player: { x: 0, y: 0, z: 0, speed: 0 },
            enemiesVisible: 0,
            enemiesTotal: 15,
            tags: 0,
            lasersFired: 0,
            fps: 60,
            stuck: false
        };

        // Inputs
        const keys = { w: false, a: false, s: false, d: false, space: false, shift: false };

        // --- PROCEDURAL TEXTURES ---
        function createWaymoDoorTexture(isPlayer) {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#f8f9fb';
            ctx.fillRect(0, 0, 512, 256);

            // Subtle lower body molding line
            ctx.fillStyle = '#d8dde6';
            ctx.fillRect(0, 215, 512, 18);

            // Waymo "W" emblem & wordmark on front doors
            ctx.fillStyle = '#0077ff';
            ctx.font = 'bold 34px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('WAYMO', 256, 125);

            ctx.strokeStyle = '#00e5be';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(195, 140);
            ctx.lineTo(317, 140);
            ctx.stroke();

            // Jaguar I-PACE front fender vent detail
            ctx.fillStyle = '#22262c';
            ctx.fillRect(60, 75, 18, 8);
            ctx.fillRect(434, 75, 18, 8);

            // Unit number
            ctx.fillStyle = isPlayer ? '#0088ff' : '#cc2255';
            ctx.font = 'bold 18px monospace';
            ctx.fillText(isPlayer ? 'UNIT 01' : 'AUTONOMOUS', 256, 168);

            const tex = new THREE.CanvasTexture(canvas);
            tex.anisotropy = 8;
            return tex;
        }

        function createBuildingTexture(baseColor, isBrick = false) {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            
            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, 256, 512);

            // Horizontal cornice bands (SF Edwardian/commercial style like reference photos)
            ctx.fillStyle = 'rgba(255,255,255,0.28)';
            for (let y = 0; y < 512; y += 64) {
                ctx.fillRect(0, y, 256, 5);
            }
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            for (let y = 5; y < 512; y += 64) {
                ctx.fillRect(0, y, 256, 3);
            }
            
            const rows = 8;
            const cols = 4;
            const padX = 12;
            const padY = 14;
            const w = (256 - padX * (cols + 1)) / cols;
            const h = (512 - padY * (rows + 1)) / rows;
            
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const wx = padX + c * (w + padX);
                    const wy = padY + r * (h + padY);
                    // White window trim
                    ctx.fillStyle = '#f0f0ec';
                    ctx.fillRect(wx - 2, wy - 2, w + 4, h + 4);

                    // Daytime reflective sky-tinted glass
                    const glassTone = (r + c) % 3 === 0 ? '#5c7a99' : (Math.random() > 0.4 ? '#425d78' : '#6e8ba8');
                    ctx.fillStyle = glassTone;
                    ctx.fillRect(wx, wy, w, h);

                    // Upper window shade / reflection
                    ctx.fillStyle = 'rgba(225, 240, 255, 0.35)';
                    ctx.fillRect(wx, wy, w, h * 0.35);

                    // Mullion bar
                    ctx.fillStyle = '#e5e5e0';
                    ctx.fillRect(wx, wy + h * 0.5, w, 2);
                }
            }
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.anisotropy = 8;
            return tex;
        }

        function createRoadTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            
            // Concrete Sidewalk
            ctx.fillStyle = '#b4b8be';
            ctx.fillRect(0, 0, 512, 512);

            // Road base (realistic daytime weathered SF asphalt gray)
            const roadPx = (STREET_WIDTH / CELL_SIZE) * 512;
            const blockPx = 512 - roadPx;

            ctx.fillStyle = '#5a6069';
            // Horizontal road
            ctx.fillRect(0, 0, 512, roadPx);
            // Vertical road
            ctx.fillRect(0, 0, roadPx, 512);

            // Asphalt patch & crack variations (like SF reference photos)
            ctx.fillStyle = '#4e545c';
            ctx.fillRect(roadPx * 0.2, roadPx * 0.1, roadPx * 0.6, roadPx * 0.5);
            ctx.fillRect(roadPx + 40, 20, 90, 45);
            ctx.fillRect(25, roadPx + 70, 50, 110);

            // White limit lines at intersections
            ctx.fillStyle = '#e8ecf0';
            ctx.fillRect(roadPx + 4, 6, 4, roadPx - 12);
            ctx.fillRect(6, roadPx + 4, roadPx - 12, 4);

            // Double yellow lines
            ctx.strokeStyle = '#e5b535';
            ctx.lineWidth = 2;
            const mid = roadPx / 2;
            
            ctx.beginPath();
            ctx.moveTo(roadPx + 18, mid - 2); ctx.lineTo(512, mid - 2);
            ctx.moveTo(roadPx + 18, mid + 2); ctx.lineTo(512, mid + 2);
            ctx.moveTo(mid - 2, roadPx + 18); ctx.lineTo(mid - 2, 512);
            ctx.moveTo(mid + 2, roadPx + 18); ctx.lineTo(mid + 2, 512);
            ctx.stroke();

            // Crosswalks & yellow ADA tactile curb ramps
            ctx.fillStyle = '#e8ecf0';
            for(let i = 10; i < roadPx - 10; i += 14) {
                ctx.fillRect(roadPx + 10, i, 16, 7);
                ctx.fillRect(i, roadPx + 10, 7, 16);
            }
            ctx.fillStyle = '#f2c516';
            ctx.fillRect(roadPx + 2, roadPx + 2, 10, 5);
            ctx.fillRect(roadPx + 2, roadPx + 2, 5, 10);

            // Manhole covers & utility markings (like reference photos)
            ctx.fillStyle = '#3d4147';
            ctx.beginPath();
            ctx.arc(mid + 12, mid - 8, 5, 0, Math.PI * 2);
            ctx.arc(roadPx + 80, mid + 14, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#ff6b35';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(mid - 20, mid + 10, 10, 6);

            // Building Foundation Plot
            ctx.fillStyle = '#8d9299';
            ctx.fillRect(roadPx + 14, roadPx + 14, blockPx - 28, blockPx - 28);

            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(GRID_STEPS, GRID_STEPS);
            tex.anisotropy = 16;
            return tex;
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
        // --- WAYMO CAR GENERATOR (Jaguar I-PACE 5th-Gen Waymo Driver) ---
        function createWaymoMesh(isPlayer = false) {
            const group = new THREE.Group();

            // Materials
            const bodyMat = new THREE.MeshStandardMaterial({ 
                color: 0xf8f9fb, 
                roughness: 0.18, 
                metalness: 0.12 
            });
            const doorMat = new THREE.MeshStandardMaterial({
                map: createWaymoDoorTexture(isPlayer),
                roughness: 0.2,
                metalness: 0.1
            });
            const glassMat = new THREE.MeshStandardMaterial({ 
                color: 0x16222f, 
                roughness: 0.08, 
                metalness: 0.85 
            });
            const darkMat = new THREE.MeshStandardMaterial({ color: 0x181a1f, roughness: 0.4, metalness: 0.3 });
            const sensorLensMat = new THREE.MeshStandardMaterial({ color: 0x05070a, roughness: 0.05, metalness: 0.9 });
            const rimMat = new THREE.MeshStandardMaterial({ color: 0xd0d5dd, roughness: 0.25, metalness: 0.8 });
            const accentColor = isPlayer ? 0x00f0ff : 0xff0055;
            const lidarRingMat = new THREE.MeshStandardMaterial({ 
                color: accentColor, 
                emissive: accentColor,
                emissiveIntensity: 2.5
            });
            const headlightMat = new THREE.MeshStandardMaterial({ 
                color: 0xffffff, emissive: 0xd8f0ff, emissiveIntensity: 2.0 
            });
            const taillightMat = new THREE.MeshStandardMaterial({ 
                color: 0xff1122, emissive: 0xff1122, emissiveIntensity: 1.8 
            });

            // Lower Rocker / Underbody
            const underGeo = new THREE.BoxGeometry(2.04, 0.22, 4.45);
            const under = new THREE.Mesh(underGeo, darkMat);
            under.position.set(0, 0.36, 0);
            group.add(under);

            // Main Lower SUV Body with Waymo Door Branding on sides
            const bodyMaterials = [
                doorMat, // Left/Right side
                doorMat,
                bodyMat, // Top
                darkMat, // Bottom
                bodyMat, // Front
                bodyMat  // Rear
            ];
            const chassisGeo = new THREE.BoxGeometry(2.08, 0.68, 4.55);
            const chassis = new THREE.Mesh(chassisGeo, bodyMaterials);
            chassis.position.y = 0.76;
            chassis.castShadow = true;
            chassis.receiveShadow = true;
            group.add(chassis);

            // Sculpted Sloped Front Hood (I-PACE cab-forward aero hood)
            const hoodGeo = new THREE.BoxGeometry(1.96, 0.22, 1.35);
            const hood = new THREE.Mesh(hoodGeo, bodyMat);
            hood.position.set(0, 1.08, 1.55);
            hood.rotation.x = 0.14;
            hood.castShadow = true;
            group.add(hood);

            // Jaguar Front Grille (oval/trapezoid black mesh)
            const grilleGeo = new THREE.BoxGeometry(1.2, 0.28, 0.08);
            const grille = new THREE.Mesh(grilleGeo, darkMat);
            grille.position.set(0, 0.78, 2.29);
            group.add(grille);

            // Coupe-SUV Sloped Cabin Greenhouse
            const cabinGeo = new THREE.BoxGeometry(1.78, 0.56, 2.45);
            const cabin = new THREE.Mesh(cabinGeo, glassMat);
            cabin.position.set(0, 1.32, -0.15);
            cabin.castShadow = true;
            group.add(cabin);

            // Raked Front Windshield
            const frontWindshieldGeo = new THREE.BoxGeometry(1.72, 0.58, 0.95);
            const frontWindshield = new THREE.Mesh(frontWindshieldGeo, glassMat);
            frontWindshield.position.set(0, 1.28, 0.85);
            frontWindshield.rotation.x = 0.52;
            group.add(frontWindshield);

            // Fastback Sloped Rear Glass + White C-Pillars (signature I-PACE coupe silhouette)
            const rearGlassGeo = new THREE.BoxGeometry(1.70, 0.52, 1.15);
            const rearGlass = new THREE.Mesh(rearGlassGeo, glassMat);
            rearGlass.position.set(0, 1.30, -1.25);
            rearGlass.rotation.x = -0.46;
            group.add(rearGlass);

            // White Roof Arch & Spoiler Lip
            const roofGeo = new THREE.BoxGeometry(1.80, 0.10, 2.25);
            const roof = new THREE.Mesh(roofGeo, bodyMat);
            roof.position.set(0, 1.61, -0.15);
            group.add(roof);

            const spoilerGeo = new THREE.BoxGeometry(1.74, 0.08, 0.32);
            const spoiler = new THREE.Mesh(spoilerGeo, bodyMat);
            spoiler.position.set(0, 1.56, -1.42);
            group.add(spoiler);

            // Kammback Rear Tailgate
            const tailgateGeo = new THREE.BoxGeometry(1.98, 0.45, 0.45);
            const tailgate = new THREE.Mesh(tailgateGeo, bodyMat);
            tailgate.position.set(0, 1.05, -2.08);
            group.add(tailgate);

            // --- WAYMO 5TH-GEN ROOF LIDAR & SENSOR SUITE ---
            // White sculpted roof rack / sensor fairing
            const rackGeo = new THREE.CylinderGeometry(0.45, 0.68, 0.16, 20);
            const rack = new THREE.Mesh(rackGeo, bodyMat);
            rack.position.set(0, 1.72, 0.0);
            group.add(rack);

            // Tall Cylindrical Spinning LiDAR Dome (Black optical window + white cap + laser emitter)
            const lidarTurret = new THREE.Group();
            lidarTurret.position.set(0, 1.98, 0.0);

            const lidarDrumGeo = new THREE.CylinderGeometry(0.28, 0.31, 0.38, 24);
            const lidarDrum = new THREE.Mesh(lidarDrumGeo, sensorLensMat);
            lidarTurret.add(lidarDrum);

            const lidarCapGeo = new THREE.CylinderGeometry(0.27, 0.28, 0.07, 24);
            const lidarCap = new THREE.Mesh(lidarCapGeo, bodyMat);
            lidarCap.position.y = 0.22;
            lidarTurret.add(lidarCap);

            // Glowing Laser Tag Emitter Ring & Lens
            const ringGeo = new THREE.CylinderGeometry(0.295, 0.295, 0.08, 24);
            const ring = new THREE.Mesh(ringGeo, lidarRingMat);
            ring.position.y = 0.05;
            lidarTurret.add(ring);

            const barrelGeo = new THREE.CylinderGeometry(0.07, 0.09, 0.45, 12);
            barrelGeo.rotateX(Math.PI / 2);
            const barrel = new THREE.Mesh(barrelGeo, lidarRingMat);
            barrel.position.set(0, 0.08, 0.22);
            lidarTurret.add(barrel);

            group.add(lidarTurret);
            group.userData.turret = lidarTurret;

            // Corner Perimeter LiDARs & Front Fender / Mirror / Bumper Sensor Pods
            const podGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.14, 14);
            const roofPods = [
                [0.62, 1.68, 0.72], [-0.62, 1.68, 0.72],   // Front roof corners
                [0.62, 1.66, -1.05], [-0.62, 1.66, -1.05]  // Rear roof corners
            ];
            roofPods.forEach(pos => {
                const p = new THREE.Mesh(podGeo, darkMat);
                p.position.set(...pos);
                group.add(p);
            });

            // Front fender & side mirror sensor pods (white housings with black cylindrical lidar)
            const fenderSensors = [
                [1.06, 0.98, 1.55], [-1.06, 0.98, 1.55], // Front fenders
                [1.14, 1.15, 0.70], [-1.14, 1.15, 0.70], // Side mirror pods
                [0, 1.12, 2.28], [0, 1.18, -2.28]        // Front nose & rear tailgate radar/lidar
            ];
            fenderSensors.forEach(pos => {
                const podGroup = new THREE.Group();
                podGroup.position.set(...pos);
                const base = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.26), bodyMat);
                const puck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 12), sensorLensMat);
                puck.position.y = 0.06;
                podGroup.add(base, puck);
                group.add(podGroup);
            });

            // Subtle team identification underglow strip
            const stripeGeo = new THREE.BoxGeometry(2.11, 0.06, 3.2);
            const stripe = new THREE.Mesh(stripeGeo, lidarRingMat);
            stripe.position.set(0, 0.42, 0);
            group.add(stripe);

            // Lights
            const hlGeo = new THREE.BoxGeometry(0.38, 0.11, 0.12);
            const hlL = new THREE.Mesh(hlGeo, headlightMat);
            hlL.position.set(0.74, 0.86, 2.26);
            const hlR = hlL.clone();
            hlR.position.x = -0.74;
            group.add(hlL, hlR);

            const tlGeo = new THREE.BoxGeometry(1.85, 0.10, 0.1);
            const tl = new THREE.Mesh(tlGeo, taillightMat);
            tl.position.set(0, 1.05, -2.29);
            group.add(tl);

            // Wheels & Alloy Rims
            const tireGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.28, 20);
            tireGeo.rotateZ(Math.PI / 2);
            const wheelRimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.30, 12);
            wheelRimGeo.rotateZ(Math.PI / 2);

            const wheelPositions = [
                [0.98, 0.42, 1.48], [-0.98, 0.42, 1.48],
                [0.98, 0.42, -1.48], [-0.98, 0.42, -1.48]
            ];
            wheelPositions.forEach(pos => {
                const tire = new THREE.Mesh(tireGeo, darkMat);
                tire.position.set(...pos);
                tire.castShadow = true;
                const rim = new THREE.Mesh(wheelRimGeo, rimMat);
                rim.position.set(...pos);
                group.add(tire, rim);
            });

            return group;
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
                if (target && nearestDist < 135) {
                    const dx = target.pos.x - this.pos.x;
                    const dz = target.pos.z - this.pos.z;
                    const directAngle = Math.atan2(dx, dz);

                    // Combat spacing: strafe/orbit instead of ramming into the back of the player
                    if (nearestDist < 22) {
                        // Too close! Peel off sideways to avoid rear-ending
                        const sideSign = (this.mesh.id % 2 === 0) ? 1 : -1;
                        this.targetAngle = directAngle + sideSign * (Math.PI * 0.65);
                    } else if (nearestDist < 42) {
                        // Strafe at optimal laser tag distance
                        const sideSign = (this.mesh.id % 2 === 0) ? 1 : -1;
                        this.targetAngle = directAngle + sideSign * 0.38;
                    } else {
                        this.targetAngle = directAngle;
                    }

                    // Shoot if within firing arc (turret can aim slightly off-axis)
                    const angleDiff = Math.abs(this.normalizeAngle(this.angle - directAngle));
                    if (angleDiff < 0.65 && nearestDist < 110) {
                        this.shoot();
                    }
                } else if (this.aiTimer <= 0) {
                    // Wander along grid (mostly 90 degree turns)
                    const dirs = [0, Math.PI/2, Math.PI, -Math.PI/2];
                    this.targetAngle = dirs[Math.floor(Math.random() * dirs.length)] + (Math.random()*0.2 - 0.1);
                    this.aiTimer = 2 + Math.random() * 3;
                }

                // Raycast/Lookahead for buildings
                const lookAheadDist = 14;
                const lookX = this.pos.x + Math.sin(this.angle) * lookAheadDist;
                const lookZ = this.pos.z + Math.cos(this.angle) * lookAheadDist;
                if (this.checkBuildingCollision(lookX, lookZ)) {
                    this.targetAngle += Math.PI / 2;
                    this.speed *= 0.8;
                }

                // Steer towards targetAngle
                const diff = this.normalizeAngle(this.targetAngle - this.angle);
                this.angle += Math.sign(diff) * Math.min(Math.abs(diff), this.handling * dt);

                const desiredMax = (target && nearestDist < 18) ? this.maxSpeed * 0.65 : this.maxSpeed;
                this.speed += this.accel * 0.8 * dt;
                this.speed = Math.min(this.speed, desiredMax);
            }
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
            shoot() {
                const now = clock.getElapsedTime();
                if (now - this.lastShot < 0.22 || this.energy < 12) return;
                
                this.lastShot = now;
                this.energy -= 12;
                if (this.isPlayer) totalLasersFired++;
                sound.playLaser(this.isPlayer);

                // Spawn laser from roof LiDAR dome
                const spawnPos = this.pos.clone();
                spawnPos.y += 2.05;

                // Aim vector: for player, aim toward the HUD crosshair ray in 3D space
                const forward = new THREE.Vector3(Math.sin(this.angle), 0, Math.cos(this.angle));
                const normal = getTerrainNormal(this.pos.x, this.pos.z);
                let dir = forward.projectOnPlane(normal).normalize();

                if (this.isPlayer && camera) {
                    const camDir = new THREE.Vector3();
                    camera.getWorldDirection(camDir);
                    const reticlePoint = camera.position.clone().addScaledVector(camDir, 75);
                    reticlePoint.y += 2.5; // Match crosshair at top: 40%
                    dir = reticlePoint.sub(spawnPos).normalize();
                }

                // Auto-aim assist cone towards targets
                let bestTarget = null;
                let minAngle = this.isPlayer ? 0.35 : 0.45;

                const potentialTargets = this.isPlayer ? bots : [player, ...bots.filter(b => b !== this)];
                potentialTargets.forEach(t => {
                    if (!t) return;
                    const toTarget = t.pos.clone().add(new THREE.Vector3(0, 1.1, 0)).sub(spawnPos);
                    const dist = toTarget.length();
                    if (dist < 140) {
                        toTarget.normalize();
                        const angle = dir.angleTo(toTarget);
                        if (angle < minAngle) {
                            minAngle = angle;
                            bestTarget = t;
                        }
                    }
                });

                if (bestTarget) {
                    const aimPos = bestTarget.pos.clone();
                    aimPos.y += 1.1; // Aim at center mass
                    const exactDir = aimPos.sub(spawnPos).normalize();
                    dir.lerp(exactDir, 0.85).normalize();
                }

                // Bright muzzle flash particles & instant visual beam trace from roof LiDAR
                const beamColor = this.isPlayer ? 0x00ffcc : 0xff0055;
                createParticles(spawnPos, beamColor, 5, 6);
                createBeamTrace(spawnPos, dir, beamColor, bestTarget ? spawnPos.distanceTo(bestTarget.pos) : 75);

                lasers.push(new Laser(spawnPos, dir, this));
            }
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
        function createBeamTrace(startPos, dir, color, length = 70) {
            const group = new THREE.Group();
            const outerGeo = new THREE.CylinderGeometry(0.22, 0.22, length, 8);
            outerGeo.translate(0, length / 2, 0);
            outerGeo.rotateX(Math.PI / 2);
            const outerMat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.65
            });
            const outerMesh = new THREE.Mesh(outerGeo, outerMat);

            const coreGeo = new THREE.CylinderGeometry(0.08, 0.08, length, 8);
            coreGeo.translate(0, length / 2, 0);
            coreGeo.rotateX(Math.PI / 2);
            const coreMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.95
            });
            const coreMesh = new THREE.Mesh(coreGeo, coreMat);

            group.add(outerMesh, coreMesh);
            group.position.copy(startPos);
            group.lookAt(startPos.clone().add(dir));
            scene.add(group);

            beamTraces.push({ group, outerMat, coreMat, life: 0.16, maxLife: 0.16 });
        }

        function updateBeamTraces(dt) {
            for (let i = beamTraces.length - 1; i >= 0; i--) {
                const b = beamTraces[i];
                b.life -= dt;
                const ratio = Math.max(0, b.life / b.maxLife);
                b.outerMat.opacity = ratio * 0.65;
                b.coreMat.opacity = ratio * 0.95;
                b.group.scale.set(ratio, ratio, 1);
                if (b.life <= 0) {
                    scene.remove(b.group);
                    b.group.children.forEach(c => {
                        c.geometry.dispose();
                        c.material.dispose();
                    });
                    beamTraces.splice(i, 1);
                }
            }
        }

        class Laser {
            constructor(pos, dir, owner) {
                this.pos = pos.clone();
                this.dir = dir.normalize();
                this.owner = owner;
                this.speed = 190;
                this.life = 1.1; // seconds

                this.mesh = new THREE.Group();
                const color = owner.isPlayer ? 0x00ffcc : 0xff0055;

                // Glowing outer plasma sheath
                const outerGeo = new THREE.CylinderGeometry(0.28, 0.28, 12, 10);
                outerGeo.rotateX(Math.PI / 2);
                const outerMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.85 });
                const outer = new THREE.Mesh(outerGeo, outerMat);

                // Bright white inner core
                const coreGeo = new THREE.CylinderGeometry(0.11, 0.11, 12.4, 8);
                coreGeo.rotateX(Math.PI / 2);
                const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
                const core = new THREE.Mesh(coreGeo, coreMat);

                this.mesh.add(outer, core);
                this.mesh.position.copy(this.pos);
                this.mesh.lookAt(this.pos.clone().add(this.dir));
                scene.add(this.mesh);
            }

            update(dt) {
                this.life -= dt;
                const steps = 3;
                const stepDist = (this.speed * dt) / steps;

                for (let s = 0; s < steps; s++) {
                    this.pos.addScaledVector(this.dir, stepDist);
                    this.mesh.position.copy(this.pos);

                    // Check terrain collision
                    if (this.pos.y < getElevation(this.pos.x, this.pos.z)) {
                        createParticles(this.pos, 0xffdd00, 12, 8);
                        return false;
                    }

                    // Check building collision
                    for (let b of buildings) {
                        if (this.pos.x > b.minX && this.pos.x < b.maxX &&
                            this.pos.z > b.minZ && this.pos.z < b.maxZ &&
                            this.pos.y < b.maxY) {
                            createParticles(this.pos, 0xffdd00, 12, 8);
                            return false;
                        }
                    }

                    // Check vehicle collision
                    const targets = this.owner.isPlayer ? bots : [player, ...bots.filter(b => b !== this.owner)];
                    for (let t of targets) {
                        if (!t) continue;
                        const dx = this.pos.x - t.pos.x;
                        const dz = this.pos.z - t.pos.z;
                        const dy = this.pos.y - (t.pos.y + 1.1);
                        if (dx*dx + dz*dz < 6.0 && Math.abs(dy) < 2.0) {
                            createParticles(this.pos, 0xffffff, 18, 12);
                            createParticles(this.pos, this.owner.isPlayer ? 0x00ffcc : 0xff0055, 18, 10);
                            t.takeDamage(25, this.owner);
                            return false;
                        }
                    }
                }

                return this.life > 0;
            }

            destroy() {
                scene.remove(this.mesh);
                this.mesh.children.forEach(c => {
                    c.geometry.dispose();
                    c.material.dispose();
                });
            }
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
            // 2. San Francisco Bay (Daylight Blue Water)
            const waterGeo = new THREE.PlaneGeometry(WORLD_SIZE * 2, WORLD_SIZE * 2);
            waterGeo.rotateX(-Math.PI / 2);
            const waterMat = new THREE.MeshStandardMaterial({
                color: 0x2b6e99,
                roughness: 0.15,
                metalness: 0.65
            });
            const water = new THREE.Mesh(waterGeo, waterMat);
            water.position.y = -2;
            scene.add(water);

            // 3. SF-Oakland Bay Bridge (Silver-white truss deck & towers as seen in reference photos)
            buildBridge();

            // 4. City Blocks & Landmarks
            // Authentic SF daytime palette: terracotta brick, warm sandstone, cream stucco, bay-window Victorians
            const texColors = ['#b65c49', '#e6dfd3', '#c8b8a6', '#9aa8b8', '#dcd6cc'];
            const bTextures = texColors.map((c, idx) => createBuildingTexture(c, idx === 0));
            const victorianColors = [0xe8d5b7, 0xd48c70, 0x8fb8a8, 0x99b3cc, 0xf2e2c4, 0xc76d5e];
            const plinthMat = new THREE.MeshStandardMaterial({ color: 0x999ea6, roughness: 0.85 });
            const trimMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.5 });

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

                    // Concrete stepped foundation / retaining plinth so blocks sit cleanly on SF hills
                    const plinthGeo = new THREE.BoxGeometry(BLOCK_SIZE - 4, 24, BLOCK_SIZE - 4);
                    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
                    plinth.position.set(bx, groundY - 11.2, bz);
                    plinth.receiveShadow = true;
                    scene.add(plinth);

                    // Special Landmark: Transamerica Pyramid
                    if (gx === 7 && gz === 6) {
                        const pyrH = 180;
                        const pyrGeo = new THREE.ConeGeometry(30, pyrH, 4);
                        pyrGeo.rotateY(Math.PI / 4);
                        const pyrMat = new THREE.MeshStandardMaterial({ 
                            color: 0xf5f2eb, roughness: 0.35, map: bTextures[1] 
                        });
                        const pyr = new THREE.Mesh(pyrGeo, pyrMat);
                        pyr.position.set(bx, groundY + pyrH/2 - 10, bz);
                        pyr.castShadow = true;
                        pyr.receiveShadow = true;
                        scene.add(pyr);

                        // Elevator Wings
                        const wingGeo = new THREE.BoxGeometry(14, 65, 44);
                        const wing = new THREE.Mesh(wingGeo, pyrMat);
                        wing.position.set(bx, groundY + 30, bz);
                        scene.add(wing);

                        // Glass Crown Spire
                        const spireGeo = new THREE.ConeGeometry(2.5, 22, 4);
                        spireGeo.rotateY(Math.PI / 4);
                        const spireMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x88ddff, emissiveIntensity: 0.8 });
                        const spire = new THREE.Mesh(spireGeo, spireMat);
                        spire.position.set(bx, groundY + pyrH - 5, bz);
                        scene.add(spire);

                        buildings.push({ minX: bx-25, maxX: bx+25, minZ: bz-25, maxZ: bz+25, maxY: groundY + pyrH });
                        addStreetProps(cellX + STREET_WIDTH, cellZ + STREET_WIDTH);
                        continue;
                    }

                    // Special Landmark: Coit Tower (on top of Telegraph Hill)
                    if (gx === 4 && gz === 7) {
                        const coitH = 72;
                        const coitGeo = new THREE.CylinderGeometry(9.5, 11.5, coitH, 20);
                        const coitMat = new THREE.MeshStandardMaterial({ color: 0xf2efe9, roughness: 0.5 });
                        const coit = new THREE.Mesh(coitGeo, coitMat);
                        coit.position.set(bx, groundY + coitH/2 - 5, bz);
                        coit.castShadow = true;
                        scene.add(coit);

                        const topCap = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 9.5, 8, 20), coitMat);
                        topCap.position.set(bx, groundY + coitH - 2, bz);
                        scene.add(topCap);

                        buildings.push({ minX: bx-12, maxX: bx+12, minZ: bz-12, maxZ: bz+12, maxY: groundY + coitH });
                        addStreetProps(cellX + STREET_WIDTH, cellZ + STREET_WIDTH);
                        continue;
                    }

                    // SoMa Brick & Mid-Rise / Downtown Towers vs SF Victorian Rowhouses with Bay Windows
                    const isDowntown = gx >= 6 && gz >= 4 && gz <= 8;

                    if (isDowntown) {
                        const w = BLOCK_SIZE - 16;
                        const d = BLOCK_SIZE - 16;
                        const h = 42 + Math.random() * 68;
                        
                        const bGeo = new THREE.BoxGeometry(w, h + 28, d);
                        const tex = bTextures[Math.floor(Math.random() * bTextures.length)];
                        const bMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.15 });
                        
                        const bMesh = new THREE.Mesh(bGeo, bMat);
                        bMesh.position.set(bx, groundY + h/2 - 14, bz);
                        bMesh.castShadow = true;
                        bMesh.receiveShadow = true;
                        scene.add(bMesh);

                        // Roof cornice & mechanical penthouse
                        const cornice = new THREE.Mesh(new THREE.BoxGeometry(w + 2, 2.2, d + 2), trimMat);
                        cornice.position.set(bx, groundY + h, bz);
                        scene.add(cornice);

                        // Red lattice construction crane on select SoMa blocks (like the reference photos!)
                        if ((gx === 6 && gz === 5) || (gx === 8 && gz === 7)) {
                            const craneMat = new THREE.MeshStandardMaterial({ color: 0xc82828, roughness: 0.4 });
                            const mast = new THREE.Mesh(new THREE.BoxGeometry(2.8, h + 55, 2.8), craneMat);
                            mast.position.set(bx + w * 0.3, groundY + (h + 55) / 2, bz - d * 0.3);
                            scene.add(mast);
                            const jib = new THREE.Mesh(new THREE.BoxGeometry(38, 2.2, 2.2), craneMat);
                            jib.position.set(bx + w * 0.3 + 12, groundY + h + 52, bz - d * 0.3);
                            scene.add(jib);
                        }

                        buildings.push({ minX: bx - w/2, maxX: bx + w/2, minZ: bz - d/2, maxZ: bz + d/2, maxY: groundY + h });
                    } else {
                        // SF Victorian / Edwardian Row Houses with Bay Windows & Cornices
                        const subSize = (BLOCK_SIZE - 16) / 2;
                        for (let sx = -0.5; sx <= 0.5; sx += 1) {
                            for (let sz = -0.5; sz <= 0.5; sz += 1) {
                                const hx = bx + sx * (subSize + 4);
                                const hz = bz + sz * (subSize + 4);
                                const hy = getElevation(hx, hz);
                                const hh = 16 + Math.random() * 14;

                                const hGeo = new THREE.BoxGeometry(subSize, hh + 24, subSize);
                                const color = victorianColors[Math.floor(Math.random() * victorianColors.length)];
                                const hMat = new THREE.MeshStandardMaterial({ 
                                    color: color, 
                                    map: bTextures[1],
                                    roughness: 0.55 
                                });
                                const hMesh = new THREE.Mesh(hGeo, hMat);
                                hMesh.position.set(hx, hy + hh/2 - 12, hz);
                                hMesh.castShadow = true;
                                hMesh.receiveShadow = true;
                                scene.add(hMesh);

                                // Flat Edwardian roof cornice + parapet (authentic SF rowhouse look)
                                const cornice = new THREE.Mesh(new THREE.BoxGeometry(subSize + 1.5, 1.8, subSize + 1.5), trimMat);
                                cornice.position.set(hx, hy + hh, hz);
                                scene.add(cornice);

                                // Projecting SF Bay Window stacks on street-facing sides
                                const bayX = hx + Math.sign(sx) * (subSize / 2 + 0.9);
                                const bayWindow = new THREE.Mesh(new THREE.BoxGeometry(2.2, hh - 3, subSize * 0.42), trimMat);
                                bayWindow.position.set(bayX, hy + hh / 2 - 1, hz);
                                scene.add(bayWindow);

                                buildings.push({ 
                                    minX: hx - subSize/2, maxX: hx + subSize/2, 
                                    minZ: hz - subSize/2, maxZ: hz + subSize/2, 
                                    maxY: hy + hh + 3 
                                });
                            }
                        }
                    }

                    // Streetlights, Traffic Signals, Palm Trees & Orange Barriers on corners
                    addStreetProps(cellX + STREET_WIDTH, cellZ + STREET_WIDTH, gx, gz);
                }
            }
        }

        function addStreetProps(x, z, gx = 0, gz = 0) {
            if (x > 380) return;
            const y = getElevation(x, z);
            
            // Realistic SF Metal Streetlight & Traffic Signal Mast Arm (from reference photos)
            const poleMat = new THREE.MeshStandardMaterial({ color: 0x686e75, metalness: 0.6, roughness: 0.4 });
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 8.5, 8), poleMat);
            pole.position.set(x + 2, y + 4.2, z + 2);
            scene.add(pole);

            const arm = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.14, 0.14), poleMat);
            arm.position.set(x - 0.1, y + 8.0, z + 2);
            scene.add(arm);

            // Traffic Signal Head + Yellow Diamond Sign ("DEAD END" / Warning sign in reference photo)
            const signalBox = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.2, 0.45), new THREE.MeshStandardMaterial({ color: 0x1e2226 }));
            signalBox.position.set(x - 1.8, y + 7.5, z + 2);
            scene.add(signalBox);

            const isGreen = (gx + gz) % 2 === 0;
            const bulbMat = new THREE.MeshBasicMaterial({ color: isGreen ? 0x00ff66 : 0xff3322 });
            const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), bulbMat);
            bulb.position.set(x - 1.8, y + (isGreen ? 7.15 : 7.85), z + 2.25);
            scene.add(bulb);

            const signMat = new THREE.MeshStandardMaterial({ color: 0xf2b705, roughness: 0.4 });
            const sign = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.06), signMat);
            sign.rotation.z = Math.PI / 4;
            sign.position.set(x + 2, y + 5.2, z + 2.22);
            scene.add(sign);

            // Canary Island Date Palm / Street Tree (prominent along Embarcadero/Howard in reference photos)
            if ((gx + gz) % 2 === 0) {
                const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6e533c, roughness: 0.9 });
                const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.48, 9, 8), trunkMat);
                trunk.position.set(x + BLOCK_SIZE - 4, getElevation(x + BLOCK_SIZE - 4, z + 2) + 4.5, z + 2);
                trunk.castShadow = true;
                scene.add(trunk);

                const frondMat = new THREE.MeshStandardMaterial({ color: 0x3b6e38, roughness: 0.7 });
                const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(2.8, 1), frondMat);
                crown.scale.set(1.3, 0.75, 1.3);
                crown.position.copy(trunk.position).add(new THREE.Vector3(0, 4.5, 0));
                crown.castShadow = true;
                scene.add(crown);
            }

            // Orange Plastic Construction Jersey Barriers on select corners (seen in reference photos)
            if ((gx * 3 + gz) % 5 === 0) {
                const barrierMat = new THREE.MeshStandardMaterial({ color: 0xff5a1f, roughness: 0.5 });
                const barrier = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.9, 0.6), barrierMat);
                const by = getElevation(x + 6, z + 1.2);
                barrier.position.set(x + 6, by + 0.45, z + 1.2);
                scene.add(barrier);
            }
        }

        function buildBridge() {
            const bridgeGroup = new THREE.Group();
            // SF-Oakland Bay Bridge silver/white steel truss & towers (visible across the street in reference photos)
            const steelMat = new THREE.MeshStandardMaterial({ color: 0xd8dde4, roughness: 0.35, metalness: 0.5 });

            // Suspension Towers in the Bay
            for (let z of [-260, 0, 260]) {
                const towerL = new THREE.Mesh(new THREE.BoxGeometry(6, 210, 8), steelMat);
                towerL.position.set(495, 95, z - 12);
                const towerR = new THREE.Mesh(new THREE.BoxGeometry(6, 210, 8), steelMat);
                towerR.position.set(495, 95, z + 12);
                bridgeGroup.add(towerL, towerR);

                // X-bracing crossbeams
                for(let y of [55, 105, 155, 195]) {
                    const beam = new THREE.Mesh(new THREE.BoxGeometry(7, 6, 32), steelMat);
                    beam.position.set(495, y, z);
                    bridgeGroup.add(beam);
                }
            }

            // Double-deck steel truss span
            const deckGeo = new THREE.BoxGeometry(26, 9, 1200);
            const deck = new THREE.Mesh(deckGeo, steelMat);
            deck.position.set(495, 48, 0);
            bridgeGroup.add(deck);

            scene.add(bridgeGroup);
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
            scene = new THREE.Scene();
            // Crisp San Francisco Daytime Sky & Coastal Haze (matching reference camera photos)
            scene.background = new THREE.Color(0xc8dff2);
            scene.fog = new THREE.FogExp2(0xc8dff2, 0.0011);

            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1200);
            
            renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.15;
            container.appendChild(renderer.domElement);

            // Post-Processing (Selective Bloom for high-energy Laser Tag beams without washing out daylight)
            const renderScene = new RenderPass(scene, camera);
            const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.7, 0.35, 0.88);
            bloomPass.threshold = 0.85;
            bloomPass.strength = 0.75;
            bloomPass.radius = 0.4;

            composer = new EffectComposer(renderer);
            composer.addPass(renderScene);
            composer.addPass(bloomPass);

            // Bright Daytime SF Lighting
            const ambientLight = new THREE.HemisphereLight(0xdff0ff, 0x7a8088, 1.8);
            scene.add(ambientLight);

            const sunLight = new THREE.DirectionalLight(0xfff6e5, 2.6);
            sunLight.position.set(-280, 380, -180);
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
                updateBeamTraces(dt);
                updateParticles(dt);
                updateCamera(dt);
                updateHUD();
            } else {
                // Cinematic menu camera orbiting Transamerica Pyramid
                const t = clock.getElapsedTime() * 0.2;
                camera.position.set(150 + Math.cos(t) * 180, 120, 50 + Math.sin(t) * 180);
                camera.lookAt(150, 60, 50);
            }

            // Update telemetry for window.__waymo every frame
            if (dt > 0.0001) {
                lastFps = Math.round(lastFps * 0.9 + (1 / dt) * 0.1);
            }
            if (player) {
                const moved = player.pos.distanceTo(lastPlayerPos);
                if (gameActive && (keys.w || keys.s) && moved < 0.02) {
                    stuckCounter += dt;
                } else {
                    stuckCounter = 0;
                }
                lastPlayerPos.copy(player.pos);

                const frustum = new THREE.Frustum();
                const projScreenMatrix = new THREE.Matrix4();
                projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
                frustum.setFromProjectionMatrix(projScreenMatrix);
                let visibleCount = 0;
                for (let b of bots) {
                    if (frustum.containsPoint(b.pos)) visibleCount++;
                }

                window.__waymo = {
                    player: {
                        x: Number(player.pos.x.toFixed(2)),
                        y: Number(player.pos.y.toFixed(2)),
                        z: Number(player.pos.z.toFixed(2)),
                        speed: Number(player.speed.toFixed(2))
                    },
                    enemiesVisible: visibleCount,
                    enemiesTotal: bots.length,
                    tags: score,
                    lasersFired: totalLasersFired,
                    fps: lastFps,
                    stuck: stuckCounter > 2.0
                };
            }

            composer.render();
        }
>>>>>>> REPLACE