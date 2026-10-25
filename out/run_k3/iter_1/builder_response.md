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
        let stuckTimer = 0;
        let fpsSmooth = 60;
        let clock = new THREE.Clock();

        window.__waymo = {
            player: { x: 0, y: 0, z: 0, speed: 0 },
            enemiesVisible: 0,
            enemiesTotal: 0,
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

            // Subtle door panel lines
            ctx.strokeStyle = '#d0d5dd';
            ctx.lineWidth = 3;
            ctx.strokeRect(80, 15, 165, 210);
            ctx.strokeRect(255, 15, 165, 210);

            // Flush Jaguar I-PACE door handles
            ctx.fillStyle = '#cfd4dc';
            ctx.fillRect(210, 75, 24, 7);
            ctx.fillRect(385, 75, 24, 7);

            // Waymo W logo + wordmark on front door
            ctx.save();
            ctx.translate(160, 125);
            ctx.strokeStyle = '#0077ff';
            ctx.lineWidth = 7;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(-26, -16);
            ctx.lineTo(-13, 14);
            ctx.lineTo(0, -6);
            ctx.lineTo(13, 14);
            ctx.lineTo(26, -16);
            ctx.stroke();

            ctx.fillStyle = '#00a86b';
            ctx.beginPath();
            ctx.arc(-26, -16, 4.5, 0, Math.PI * 2);
            ctx.arc(26, -16, 4.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#182230';
            ctx.font = 'bold 20px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('WAYMO', 0, 38);
            ctx.restore();

            // Lower rocker trim & team laser-tag stripe
            ctx.fillStyle = '#1a1d24';
            ctx.fillRect(0, 226, 512, 30);
            ctx.fillStyle = isPlayer ? '#00e5ff' : '#ff1744';
            ctx.fillRect(0, 218, 512, 8);

            const tex = new THREE.CanvasTexture(canvas);
            tex.anisotropy = 8;
            return tex;
        }

        function createBuildingTexture(baseColor, style = 'office') {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            
            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, 256, 512);

            if (style === 'victorian') {
                // Horizontal clapboard siding + ornate trim
                ctx.fillStyle = 'rgba(0,0,0,0.08)';
                for (let y = 0; y < 512; y += 6) {
                    ctx.fillRect(0, y, 256, 1.5);
                }
                // Floor cornices
                ctx.fillStyle = '#f4f1ea';
                for (let r = 0; r < 4; r++) {
                    ctx.fillRect(0, r * 128, 256, 10);
                }
                const rows = 4, cols = 3;
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const wx = 22 + c * 78;
                        const wy = 24 + r * 124;
                        // White Victorian window frame
                        ctx.fillStyle = '#f8f8f5';
                        ctx.fillRect(wx - 5, wy - 6, 46, 76);
                        // Reflective daytime window pane
                        ctx.fillStyle = '#486b8a';
                        ctx.fillRect(wx, wy, 36, 64);
                        ctx.fillStyle = '#7ea6c8';
                        ctx.fillRect(wx + 2, wy + 2, 14, 28);
                        // Sash bar
                        ctx.fillStyle = '#f8f8f5';
                        ctx.fillRect(wx, wy + 31, 36, 3);
                    }
                }
            } else {
                // Realistic SoMa brick / concrete warehouse & office facades (like SF reference photos)
                ctx.fillStyle = 'rgba(255,255,255,0.12)';
                for (let r = 0; r < 10; r++) {
                    ctx.fillRect(0, r * 51, 256, 5);
                }
                for (let c = 0; c <= 4; c++) {
                    ctx.fillRect(c * 64 - 4, 0, 8, 512);
                }

                const rows = 10;
                const cols = 4;
                const padX = 12;
                const padY = 12;
                const w = (256 - padX * (cols + 1)) / cols;
                const h = (512 - padY * (rows + 1)) / rows;
                
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const wx = padX + c * (w + padX);
                        const wy = padY + r * (h + padY);
                        ctx.fillStyle = '#d8d4cc';
                        ctx.fillRect(wx - 2, wy - 2, w + 4, h + 4);
                        // Realistic daylight glass reflection
                        const tint = (r + c) % 3 === 0 ? '#5b7e96' : ((r * c) % 2 === 0 ? '#3f5b70' : '#7395ab');
                        ctx.fillStyle = tint;
                        ctx.fillRect(wx, wy, w, h);
                        ctx.fillStyle = 'rgba(220, 240, 255, 0.35)';
                        ctx.fillRect(wx + 2, wy + 2, w * 0.45, h - 4);
                        // Window mullions
                        ctx.fillStyle = '#2b343b';
                        ctx.fillRect(wx + w * 0.5 - 1, wy, 2, h);
                    }
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
            ctx.fillStyle = '#b4b6b8';
            ctx.fillRect(0, 0, 512, 512);

            const roadPx = (STREET_WIDTH / CELL_SIZE) * 512;
            const blockPx = 512 - roadPx;

            // Daylight weathered SF asphalt (matching reference photos)
            ctx.fillStyle = '#62676e';
            ctx.fillRect(0, 0, 512, roadPx);
            ctx.fillRect(0, 0, roadPx, 512);

            // Asphalt patches, utility trenches, and subtle cracks
            ctx.fillStyle = '#575c63';
            ctx.fillRect(roadPx + 40, 20, 110, 45);
            ctx.fillRect(35, roadPx + 90, 55, 130);
            ctx.strokeStyle = '#484c52';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(roadPx + 20, 40); ctx.lineTo(roadPx + 180, 55); ctx.lineTo(roadPx + 260, 35);
            ctx.moveTo(45, roadPx + 30); ctx.lineTo(60, roadPx + 200);
            ctx.stroke();

            // Manhole covers & utility vaults (like reference photo foreground)
            ctx.fillStyle = '#7c828a';
            ctx.fillRect(roadPx * 0.44, roadPx * 0.72, 22, 12);
            ctx.strokeStyle = '#45494f';
            ctx.strokeRect(roadPx * 0.44, roadPx * 0.72, 22, 12);
            ctx.beginPath();
            ctx.arc(roadPx * 0.65, roadPx * 0.35, 6, 0, Math.PI * 2);
            ctx.arc(roadPx + 120, roadPx * 0.55, 6, 0, Math.PI * 2);
            ctx.fill();

            // Orange/white utility survey spray paint markings on intersection
            ctx.strokeStyle = '#e86a2c';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(40, 95); ctx.lineTo(65, 92);
            ctx.moveTo(85, 110); ctx.lineTo(95, 104); ctx.lineTo(105, 110); ctx.lineTo(95, 116); ctx.closePath();
            ctx.stroke();

            // Yellow tactile curb ramps at intersection corners
            ctx.fillStyle = '#eab308';
            ctx.fillRect(roadPx + 2, roadPx + 2, 16, 7);
            ctx.fillRect(roadPx + 2, roadPx + 2, 7, 16);
            ctx.fillRect(roadPx + 2, 503, 16, 7);
            ctx.fillRect(503, roadPx + 2, 7, 16);

            // Double yellow center lines
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 2;
            const mid = roadPx / 2;
            ctx.beginPath();
            ctx.moveTo(roadPx + 18, mid - 2.5); ctx.lineTo(494, mid - 2.5);
            ctx.moveTo(roadPx + 18, mid + 2.5); ctx.lineTo(494, mid + 2.5);
            ctx.moveTo(mid - 2.5, roadPx + 18); ctx.lineTo(mid - 2.5, 494);
            ctx.moveTo(mid + 2.5, roadPx + 18); ctx.lineTo(mid + 2.5, 494);
            ctx.stroke();

            // White stop bars & crosswalk stripes
            ctx.fillStyle = '#e5e7eb';
            ctx.fillRect(roadPx + 14, 6, 4, roadPx - 12);
            ctx.fillRect(6, roadPx + 14, roadPx - 12, 4);
            for (let i = 10; i < roadPx - 10; i += 14) {
                ctx.fillRect(roadPx + 2, i, 10, 7);
                ctx.fillRect(i, roadPx + 2, 7, 10);
            }

            // Sidewalk concrete slab joints & curb shadow
            ctx.strokeStyle = '#8e9296';
            ctx.lineWidth = 2;
            ctx.strokeRect(roadPx, roadPx, blockPx, blockPx);
            ctx.fillStyle = '#9ca0a4';
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
                color: 0xf7f9fc, 
                roughness: 0.16, 
                metalness: 0.12 
            });
            const doorMat = new THREE.MeshStandardMaterial({
                map: createWaymoDoorTexture(isPlayer),
                roughness: 0.18,
                metalness: 0.1
            });
            const glassMat = new THREE.MeshStandardMaterial({ 
                color: 0x101824, 
                roughness: 0.05, 
                metalness: 0.85 
            });
            const darkMat = new THREE.MeshStandardMaterial({ color: 0x181b20, roughness: 0.45, metalness: 0.3 });
            const rimMat = new THREE.MeshStandardMaterial({ color: 0xd0d7de, roughness: 0.2, metalness: 0.85 });
            const lidarAccentColor = isPlayer ? 0x00f0ff : 0xff1744;
            const lidarMat = new THREE.MeshStandardMaterial({ 
                color: lidarAccentColor, 
                emissive: lidarAccentColor,
                emissiveIntensity: 2.2
            });
            const headlightMat = new THREE.MeshStandardMaterial({ 
                color: 0xffffff, emissive: 0xd8f4ff, emissiveIntensity: 2.5 
            });
            const taillightMat = new THREE.MeshStandardMaterial({ 
                color: 0xff1122, emissive: 0xff1122, emissiveIntensity: 2.2 
            });

            // Lower rocker / battery skateboard chassis
            const underbody = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.24, 4.55), darkMat);
            underbody.position.set(0, 0.36, 0);
            group.add(underbody);

            // Jaguar I-PACE main body with Waymo door branding on left & right sides
            const bodyMaterials = [doorMat, doorMat, bodyMat, darkMat, bodyMat, bodyMat];
            const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.68, 4.62), bodyMaterials);
            chassis.position.set(0, 0.76, 0);
            chassis.castShadow = true;
            chassis.receiveShadow = true;
            group.add(chassis);

            // Sculpted wheel arches / haunches
            const archGeo = new THREE.BoxGeometry(2.22, 0.32, 1.05);
            const frontArch = new THREE.Mesh(archGeo, bodyMat);
            frontArch.position.set(0, 0.66, 1.48);
            const rearArch = new THREE.Mesh(archGeo, bodyMat);
            rearArch.position.set(0, 0.72, -1.48);
            group.add(frontArch, rearArch);

            // Sloped aerodynamic hood & front grille
            const hood = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.2, 1.3), bodyMat);
            hood.position.set(0, 1.08, 1.55);
            hood.rotation.x = 0.14;
            group.add(hood);

            const grille = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.34, 0.08), darkMat);
            grille.position.set(0, 0.76, 2.31);
            group.add(grille);

            // Sleek coupe-SUV cabin & raked windshield / fastback rear glass
            const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.56, 2.15), glassMat);
            cabin.position.set(0, 1.34, -0.08);
            cabin.castShadow = true;
            group.add(cabin);

            const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.54, 0.95), glassMat);
            windshield.position.set(0, 1.28, 0.92);
            windshield.rotation.x = -0.52;
            group.add(windshield);

            const fastback = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.52, 1.15), glassMat);
            fastback.position.set(0, 1.29, -1.25);
            fastback.rotation.x = 0.46;
            group.add(fastback);

            // White roof rails / cantrails & rear I-PACE spoiler
            const roof = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.09, 2.15), bodyMat);
            roof.position.set(0, 1.63, -0.1);
            group.add(roof);

            const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.07, 0.32), bodyMat);
            spoiler.position.set(0, 1.48, -1.92);
            spoiler.rotation.x = 0.12;
            group.add(spoiler);

            // Kammback truncated rear tail & diffuser
            const rearTail = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.42, 0.25), bodyMat);
            rearTail.position.set(0, 0.98, -2.22);
            group.add(rearTail);

            // --- WAYMO 5TH-GEN SENSOR SUITE ---
            // White aerodynamic roof shroud ("halo" fairing)
            const fairing = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.65, 0.16, 20), bodyMat);
            fairing.scale.set(1.0, 1.0, 1.45);
            fairing.position.set(0, 1.73, -0.05);
            group.add(fairing);

            // Multi-camera ring below lidar
            const camRing = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.14, 16), darkMat);
            camRing.position.set(0, 1.86, -0.05);
            group.add(camRing);

            // Tall cylindrical spinning 360° roof LiDAR dome + laser emitter turret
            const lidarPivot = new THREE.Group();
            lidarPivot.position.set(0, 2.06, -0.05);

            const lidarCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.34, 24), darkMat);
            lidarPivot.add(lidarCylinder);

            const lidarLensBand = new THREE.Mesh(new THREE.CylinderGeometry(0.275, 0.275, 0.14, 24), lidarMat);
            lidarPivot.add(lidarLensBand);

            const lidarCap = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.06, 24), bodyMat);
            lidarCap.position.y = 0.19;
            lidarPivot.add(lidarCap);

            // Dual laser tag cannon barrels mounted on spinning lidar dome
            const barrelGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.65, 10);
            barrelGeo.rotateX(Math.PI / 2);
            const barrelL = new THREE.Mesh(barrelGeo, lidarMat);
            barrelL.position.set(0.14, 0.02, 0.28);
            const barrelR = new THREE.Mesh(barrelGeo, lidarMat);
            barrelR.position.set(-0.14, 0.02, 0.28);
            lidarPivot.add(barrelL, barrelR);

            group.add(lidarPivot);
            group.userData.turret = lidarPivot;

            // 4 Perimeter short-range LiDAR & radar pods on front fenders & rear corners
            const cornerPodGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.16, 14);
            const capGeo = new THREE.SphereGeometry(0.11, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
            const cornerPositions = [
                [0.98, 1.05, 1.92], [-0.98, 1.05, 1.92],   // Front fenders
                [0.96, 1.08, -2.05], [-0.96, 1.08, -2.05], // Rear corners
                [0, 1.06, 2.32]                            // Front nose radar/camera
            ];
            cornerPositions.forEach(pos => {
                const pod = new THREE.Mesh(cornerPodGeo, darkMat);
                pod.position.set(...pos);
                const podCap = new THREE.Mesh(capGeo, bodyMat);
                podCap.position.set(pos[0], pos[1] + 0.08, pos[2]);
                group.add(pod, podCap);
            });

            // Side mirrors with integrated camera pods
            [-1, 1].forEach(side => {
                const mirrorArm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.12), bodyMat);
                mirrorArm.position.set(side * 1.12, 1.18, 0.72);
                const mirrorSensor = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.18, 12), darkMat);
                mirrorSensor.position.set(side * 1.22, 1.15, 0.75);
                group.add(mirrorArm, mirrorSensor);
            });

            // Lights (Slim LED headlights & Jaguar I-PACE rear light bar)
            const hlGeo = new THREE.BoxGeometry(0.42, 0.11, 0.1);
            const hlL = new THREE.Mesh(hlGeo, headlightMat);
            hlL.position.set(0.74, 0.9, 2.3);
            const hlR = hlL.clone();
            hlR.position.x = -0.74;
            group.add(hlL, hlR);

            const tlGeo = new THREE.BoxGeometry(1.92, 0.12, 0.1);
            const tl = new THREE.Mesh(tlGeo, taillightMat);
            tl.position.set(0, 1.02, -2.31);
            group.add(tl);

            // Opponent floating beacon ring so other Waymos are immediately visible at a distance
            if (!isPlayer) {
                const beaconGeo = new THREE.RingGeometry(0.45, 0.62, 24);
                beaconGeo.rotateX(-Math.PI / 2);
                const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff1744, side: THREE.DoubleSide });
                const beacon = new THREE.Mesh(beaconGeo, beaconMat);
                beacon.position.set(0, 2.42, -0.05);
                group.add(beacon);
            }

            // Detailed Wheels with silver alloy rims (protruding clearly from wheel arches)
            const tireGeo = new THREE.CylinderGeometry(0.43, 0.43, 0.28, 20);
            tireGeo.rotateZ(Math.PI / 2);
            const rimGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.30, 12);
            rimGeo.rotateZ(Math.PI / 2);
            const hubGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.32, 10);
            hubGeo.rotateZ(Math.PI / 2);

            const wheelPositions = [
                [1.04, 0.43, 1.48], [-1.04, 0.43, 1.48],
                [1.04, 0.43, -1.48], [-1.04, 0.43, -1.48]
            ];
            wheelPositions.forEach(pos => {
                const wheelGroup = new THREE.Group();
                wheelGroup.position.set(...pos);
                const tire = new THREE.Mesh(tireGeo, darkMat);
                tire.castShadow = true;
                const rim = new THREE.Mesh(rimGeo, rimMat);
                const hub = new THREE.Mesh(hubGeo, darkMat);
                wheelGroup.add(tire, rim, hub);
                group.add(wheelGroup);
            });

            return group;
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
                // Proposed new position with smooth wall sliding & anti-stuck pushout
                const stepX = forward.x * this.speed * dt;
                const stepZ = forward.z * this.speed * dt;
                let nextX = this.pos.x + stepX;
                let nextZ = this.pos.z + stepZ;

                // World Bounds & Bay Collision
                const minBound = -OFFSET + 18;
                const maxBoundX = 395;
                const maxBoundZ = OFFSET - 18;
                nextX = THREE.MathUtils.clamp(nextX, minBound, maxBoundX);
                nextZ = THREE.MathUtils.clamp(nextZ, minBound, maxBoundZ);

                if (!this.checkBuildingCollision(nextX, nextZ)) {
                    this.pos.x = nextX;
                    this.pos.z = nextZ;
                } else {
                    // Slide smoothly along X or Z axis individually
                    let slid = false;
                    if (!this.checkBuildingCollision(nextX, this.pos.z)) {
                        this.pos.x = nextX;
                        slid = true;
                    }
                    if (!this.checkBuildingCollision(this.pos.x, nextZ)) {
                        this.pos.z = nextZ;
                        slid = true;
                    }

                    // Push vehicle out of any overlapping building AABB
                    this.resolveBuildingOverlap();

                    if (slid) {
                        this.speed *= 0.92;
                    } else {
                        this.speed *= -0.35;
                        if (this.isPlayer) sound.playHit();
                        this.aiTimer = 0;
                    }
                }

                // Final safety pushout so vehicle can never wedge inside a block
                this.resolveBuildingOverlap();
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
            checkBuildingCollision(x, z) {
                const carRadius = 2.1;
                for (let b of buildings) {
                    if (x + carRadius > b.minX && x - carRadius < b.maxX &&
                        z + carRadius > b.minZ && z - carRadius < b.maxZ) {
                        return true;
                    }
                }
                return false;
            }

            resolveBuildingOverlap() {
                const carRadius = 2.15;
                for (let b of buildings) {
                    if (this.pos.x + carRadius > b.minX && this.pos.x - carRadius < b.maxX &&
                        this.pos.z + carRadius > b.minZ && this.pos.z - carRadius < b.maxZ) {
                        const penLeft = (this.pos.x + carRadius) - b.minX;
                        const penRight = b.maxX - (this.pos.x - carRadius);
                        const penDown = (this.pos.z + carRadius) - b.minZ;
                        const penUp = b.maxZ - (this.pos.z - carRadius);
                        const minPen = Math.min(penLeft, penRight, penDown, penUp);

                        if (minPen === penLeft) {
                            this.pos.x = b.minX - carRadius - 0.05;
                        } else if (minPen === penRight) {
                            this.pos.x = b.maxX + carRadius + 0.05;
                        } else if (minPen === penDown) {
                            this.pos.z = b.minZ - carRadius - 0.05;
                        } else {
                            this.pos.z = b.maxZ + carRadius + 0.05;
                        }
                    }
                }
            }

            shoot() {
                const now = clock.getElapsedTime();
                if (now - this.lastShot < 0.16 || this.energy < 8) return;
                
                this.lastShot = now;
                this.energy -= 8;
                if (this.isPlayer) totalLasersFired++;
                sound.playLaser(this.isPlayer);

                // Spawn laser from spinning roof LiDAR turret
                const spawnPos = this.pos.clone();
                spawnPos.y += 2.15;

                // Aim vector
                const forward = new THREE.Vector3(Math.sin(this.angle), 0, Math.cos(this.angle));
                const normal = getTerrainNormal(this.pos.x, this.pos.z);
                const dir = forward.projectOnPlane(normal).normalize();

                // Generous auto-aim assist towards visible targets in front cone
                let bestTarget = null;
                let minAngle = this.isPlayer ? 0.42 : 0.30; // ~24 degree cone for player

                const potentialTargets = this.isPlayer ? bots : [player, ...bots.filter(b => b !== this)];
                potentialTargets.forEach(t => {
                    if (!t) return;
                    const toTarget = t.pos.clone().sub(this.pos);
                    const dist = toTarget.length();
                    if (dist < 160) {
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
                    // Point roof turret toward target
                    const localAngle = Math.atan2(bestTarget.pos.x - this.pos.x, bestTarget.pos.z - this.pos.z) - this.angle;
                    this.mesh.userData.turret.rotation.y = localAngle;
                }

                // Bright muzzle flash particles at roof dome
                createParticles(spawnPos.clone().addScaledVector(dir, 0.6), this.isPlayer ? 0x00ffff : 0xff1744, 4, 6);

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
        class Laser {
            constructor(pos, dir, owner) {
                this.startPos = pos.clone();
                this.pos = pos.clone();
                this.dir = dir.normalize();
                this.owner = owner;
                this.speed = 190;
                this.life = 1.1; // seconds

                this.mesh = new THREE.Group();
                const coreColor = owner.isPlayer ? 0xffffff : 0xffddaa;
                const glowColor = owner.isPlayer ? 0x00f0ff : 0xff0044;

                // High-visibility laser pulse bolt (inner core + outer glowing sheath)
                const coreGeo = new THREE.CylinderGeometry(0.14, 0.14, 14, 8);
                coreGeo.rotateX(Math.PI / 2);
                const coreMat = new THREE.MeshBasicMaterial({ color: coreColor });
                const coreMesh = new THREE.Mesh(coreGeo, coreMat);

                const glowGeo = new THREE.CylinderGeometry(0.36, 0.36, 16, 10);
                glowGeo.rotateX(Math.PI / 2);
                const glowMat = new THREE.MeshBasicMaterial({
                    color: glowColor,
                    transparent: true,
                    opacity: 0.65
                });
                const glowMesh = new THREE.Mesh(glowGeo, glowMat);

                // Persistent tracer beam connecting back to the roof dome for the first 0.25s
                const tracerGeo = new THREE.CylinderGeometry(0.09, 0.16, 45, 8);
                tracerGeo.rotateX(Math.PI / 2);
                tracerGeo.translate(0, 0, 22.5);
                const tracerMat = new THREE.MeshBasicMaterial({
                    color: glowColor,
                    transparent: true,
                    opacity: 0.85
                });
                this.tracerMesh = new THREE.Mesh(tracerGeo, tracerMat);
                this.tracerMesh.position.copy(this.startPos);
                this.tracerMesh.lookAt(this.startPos.clone().add(this.dir));
                scene.add(this.tracerMesh);

                this.mesh.add(coreMesh, glowMesh);
                this.mesh.position.copy(this.pos);
                this.mesh.lookAt(this.pos.clone().add(this.dir));
                scene.add(this.mesh);
            }

            update(dt) {
                this.life -= dt;
                if (this.tracerMesh) {
                    const age = 1.1 - this.life;
                    this.tracerMesh.material.opacity = Math.max(0, 0.85 - age * 4.2);
                    if (age > 0.22) {
                        scene.remove(this.tracerMesh);
                        this.tracerMesh.geometry.dispose();
                        this.tracerMesh.material.dispose();
                        this.tracerMesh = null;
                    }
                }

                // Sub-stepped movement so fast bolts never tunnel through cars or walls
                const steps = 3;
                const stepDist = (this.speed * dt) / steps;
                const targets = this.owner.isPlayer ? bots : [player, ...bots.filter(b => b !== this.owner)];

                for (let s = 0; s < steps; s++) {
                    this.pos.addScaledVector(this.dir, stepDist);

                    // Check terrain collision
                    if (this.pos.y < getElevation(this.pos.x, this.pos.z) + 0.15) {
                        createParticles(this.pos, 0x00f0ff, 6, 5);
                        return false;
                    }

                    // Check building collision
                    for (let b of buildings) {
                        if (this.pos.x > b.minX && this.pos.x < b.maxX &&
                            this.pos.z > b.minZ && this.pos.z < b.maxZ &&
                            this.pos.y < b.maxY) {
                            createParticles(this.pos, 0xffaa00, 6, 5);
                            return false;
                        }
                    }

                    // Check vehicle collision
                    for (let t of targets) {
                        if (!t) continue;
                        const dx = this.pos.x - t.pos.x;
                        const dz = this.pos.z - t.pos.z;
                        const dy = this.pos.y - (t.pos.y + 1.1);
                        if (dx*dx + dz*dz < 6.5 && Math.abs(dy) < 2.0) {
                            t.takeDamage(25, this.owner);
                            return false;
                        }
                    }
                }

                this.mesh.position.copy(this.pos);
                return this.life > 0;
            }

            destroy() {
                scene.remove(this.mesh);
                this.mesh.children.forEach(c => {
                    c.geometry.dispose();
                    c.material.dispose();
                });
                if (this.tracerMesh) {
                    scene.remove(this.tracerMesh);
                    this.tracerMesh.geometry.dispose();
                    this.tracerMesh.material.dispose();
                }
            }
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
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
            // 3. Bay Bridge Steel Truss & Construction Crane (matching SF reference photos)
            buildBridge();

            // 4. City Blocks & Landmarks
            const officeColors = ['#a65e4e', '#b86b52', '#d2cabf', '#9ba4ad', '#c8b8a6']; // Brick & concrete tones from SF photos
            const bTextures = officeColors.map(c => createBuildingTexture(c, 'office'));
            const vicColors = ['#e8d8c8', '#c8d8e4', '#dce4d0', '#f0dcd4', '#dcd4e8', '#e6c89c'];
            const vicTextures = vicColors.map(c => createBuildingTexture(c, 'victorian'));

            const plinthMat = new THREE.MeshStandardMaterial({ color: 0xa8aaad, roughness: 0.85 });
            const trimMat = new THREE.MeshStandardMaterial({ color: 0xf0eee9, roughness: 0.5 });

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

                    // Continuous concrete sidewalk plinth per block (eliminates gaps & floating edges on hills)
                    const plinthDepth = 45;
                    const plinthGeo = new THREE.BoxGeometry(BLOCK_SIZE - 4, plinthDepth, BLOCK_SIZE - 4);
                    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
                    plinth.position.set(bx, groundY - plinthDepth / 2 + 0.6, bz);
                    plinth.receiveShadow = true;
                    scene.add(plinth);

                    // Unified single block collider per city block so cars never wedge between sub-buildings
                    const blockMargin = 5;
                    const blockHalf = (BLOCK_SIZE - blockMargin * 2) / 2;
                    let blockMaxY = groundY + 45;

                    // Special Landmark: Transamerica Pyramid
                    if (gx === 7 && gz === 6) {
                        const pyrH = 180;
                        const pyrGeo = new THREE.ConeGeometry(28, pyrH, 4);
                        pyrGeo.rotateY(Math.PI / 4);
                        const pyrMat = new THREE.MeshStandardMaterial({ 
                            color: 0xf2f0eb, roughness: 0.35, map: bTextures[2] 
                        });
                        const pyr = new THREE.Mesh(pyrGeo, pyrMat);
                        pyr.position.set(bx, groundY + pyrH/2 - 12, bz);
                        pyr.castShadow = true;
                        pyr.receiveShadow = true;
                        scene.add(pyr);

                        const wingGeo = new THREE.BoxGeometry(14, 65, 42);
                        const wing = new THREE.Mesh(wingGeo, pyrMat);
                        wing.position.set(bx, groundY + 30, bz);
                        scene.add(wing);

                        const spireGeo = new THREE.ConeGeometry(2.5, 22, 4);
                        const spireMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
                        const spire = new THREE.Mesh(spireGeo, spireMat);
                        spire.position.set(bx, groundY + pyrH - 5, bz);
                        scene.add(spire);

                        buildings.push({ minX: bx - blockHalf, maxX: bx + blockHalf, minZ: bz - blockHalf, maxZ: bz + blockHalf, maxY: groundY + pyrH });
                        addStreetProps(cellX + STREET_WIDTH, cellZ + STREET_WIDTH, gx, gz);
                        continue;
                    }

                    // Special Landmark: Coit Tower (on top of hill)
                    if (gx === 4 && gz === 7) {
                        const coitH = 75;
                        const coitGeo = new THREE.CylinderGeometry(10, 12, coitH, 20);
                        const coitMat = new THREE.MeshStandardMaterial({ color: 0xf2efe9, roughness: 0.5 });
                        const coit = new THREE.Mesh(coitGeo, coitMat);
                        coit.position.set(bx, groundY + coitH/2 - 10, bz);
                        coit.castShadow = true;
                        scene.add(coit);
                        buildings.push({ minX: bx - blockHalf, maxX: bx + blockHalf, minZ: bz - blockHalf, maxZ: bz + blockHalf, maxY: groundY + coitH });
                        addStreetProps(cellX + STREET_WIDTH, cellZ + STREET_WIDTH, gx, gz);
                        continue;
                    }

                    // Downtown / SoMa brick & concrete offices (East/Center) vs SF Victorians (West/Hills)
                    const isDowntown = gx >= 5 && gz >= 3 && gz <= 9;

                    if (isDowntown) {
                        const w = BLOCK_SIZE - 12;
                        const d = BLOCK_SIZE - 12;
                        const h = 42 + ((gx * 17 + gz * 31) % 65);
                        
                        const bGeo = new THREE.BoxGeometry(w, h + 45, d);
                        const tex = bTextures[(gx + gz) % bTextures.length];
                        const bMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45, metalness: 0.15 });
                        
                        const bMesh = new THREE.Mesh(bGeo, bMat);
                        bMesh.position.set(bx, groundY + h/2 - 22.5, bz);
                        bMesh.castShadow = true;
                        bMesh.receiveShadow = true;
                        scene.add(bMesh);

                        // Roof cornice & rooftop HVAC penthouse
                        const cornice = new THREE.Mesh(new THREE.BoxGeometry(w + 1.5, 2.2, d + 1.5), trimMat);
                        cornice.position.set(bx, groundY + h + 0.5, bz);
                        scene.add(cornice);

                        // Red lattice construction crane next to SoMa brick building (like reference photos!)
                        if (gx === 6 && gz === 5) {
                            buildConstructionCrane(bx - w/2 + 6, groundY, bz - d/2 + 6);
                        }

                        blockMaxY = groundY + h + 4;
                    } else {
                        // SF Victorian / Edwardian Row Houses with Bay Windows & Cornices
                        const subSize = (BLOCK_SIZE - 14) / 2;
                        for (let sx = -0.5; sx <= 0.5; sx += 1) {
                            for (let sz = -0.5; sz <= 0.5; sz += 1) {
                                const hx = bx + sx * subSize;
                                const hz = bz + sz * subSize;
                                const hy = getElevation(hx, hz);
                                const hh = 18 + ((Math.abs(gx * 7 + gz * 13 + sx * 4 + sz * 2)) % 14);

                                const hGeo = new THREE.BoxGeometry(subSize - 0.8, hh + 40, subSize - 0.8);
                                const vTex = vicTextures[Math.floor(Math.abs(gx * 3 + gz * 5 + sx * 2 + sz)) % vicTextures.length];
                                const hMat = new THREE.MeshStandardMaterial({ 
                                    map: vTex,
                                    roughness: 0.55 
                                });
                                const hMesh = new THREE.Mesh(hGeo, hMat);
                                hMesh.position.set(hx, hy + hh/2 - 20, hz);
                                hMesh.castShadow = true;
                                hMesh.receiveShadow = true;
                                scene.add(hMesh);

                                // Projecting SF Bay Windows on outward-facing street sides
                                const bayGeo = new THREE.BoxGeometry(5.5, hh - 4, 3.2);
                                const bayZ = hz + Math.sign(sz) * (subSize / 2 + 0.6);
                                const bayMesh = new THREE.Mesh(bayGeo, hMat);
                                bayMesh.position.set(hx, hy + hh / 2, bayZ);
                                scene.add(bayMesh);

                                // Ornate flat roof cornice
                                const cMesh = new THREE.Mesh(new THREE.BoxGeometry(subSize + 0.6, 1.8, subSize + 0.6), trimMat);
                                cMesh.position.set(hx, hy + hh + 0.8, hz);
                                scene.add(cMesh);

                                blockMaxY = Math.max(blockMaxY, hy + hh + 5);
                            }
                        }
                    }

                    // Register single solid block collider so vehicles slide cleanly around block perimeters
                    buildings.push({
                        minX: bx - blockHalf,
                        maxX: bx + blockHalf,
                        minZ: bz - blockHalf,
                        maxZ: bz + blockHalf,
                        maxY: blockMaxY
                    });

                    // Streetlights, Traffic Signals & Palm Trees on corners
                    addStreetProps(cellX + STREET_WIDTH, cellZ + STREET_WIDTH, gx, gz);
                }
            }
        }

        function buildConstructionCrane(x, y, z) {
            const craneGroup = new THREE.Group();
            const redMat = new THREE.MeshStandardMaterial({ color: 0xc82820, roughness: 0.4, metalness: 0.4 });
            const orangeBarrierMat = new THREE.MeshStandardMaterial({ color: 0xf05a22, roughness: 0.5 });

            // Tall red lattice mast (from reference photos)
            const mastGeo = new THREE.BoxGeometry(3.2, 115, 3.2);
            const mast = new THREE.Mesh(mastGeo, redMat);
            mast.position.set(x, y + 55, z);
            craneGroup.add(mast);

            // Boom arm
            const boomGeo = new THREE.BoxGeometry(38, 2.2, 2.2);
            const boom = new THREE.Mesh(boomGeo, redMat);
            boom.position.set(x + 14, y + 112, z);
            boom.rotation.z = 0.25;
            craneGroup.add(boom);

            // Orange plastic water-filled road barriers along curb (like reference photo right side)
            for (let i = 0; i < 4; i++) {
                const bar = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.1, 0.7), orangeBarrierMat);
                bar.position.set(x - 4 + i * 3.5, y + 0.6, z - 6);
                craneGroup.add(bar);
            }
            scene.add(craneGroup);
        }

        function createPalmTree(x, y, z) {
            const group = new THREE.Group();
            const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6e5540, roughness: 0.9 });
            const frondMat = new THREE.MeshStandardMaterial({ color: 0x3b6e38, roughness: 0.6 });

            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 11, 8), trunkMat);
            trunk.position.y = 5.5;
            trunk.castShadow = true;
            group.add(trunk);

            // Crown of Canary Island Date Palm fronds (iconic Embarcadero / Folsom St palms in reference photos)
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const frond = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 4.2), frondMat);
                frond.position.set(Math.sin(angle) * 1.8, 11.0, Math.cos(angle) * 1.8);
                frond.rotation.y = angle;
                frond.rotation.x = 0.45;
                group.add(frond);
            }
            group.position.set(x, y, z);
            scene.add(group);
        }

        function addStreetProps(x, z, gx, gz) {
            if (x > 380) return;
            const y = getElevation(x, z);
            
            const poleMat = new THREE.MeshStandardMaterial({ color: 0x555b62, metalness: 0.5, roughness: 0.4 });
            const signalBoxMat = new THREE.MeshStandardMaterial({ color: 0x22262a });
            const signYellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4 });

            // Realistic SF traffic signal pole with mast arm & red/yellow/green signal head
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 8.5, 8), poleMat);
            pole.position.set(x + 2.2, y + 4.25, z + 2.2);
            scene.add(pole);

            const mastArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 6.5, 6), poleMat);
            mastArm.rotation.z = Math.PI / 2;
            mastArm.position.set(x - 1.0, y + 8.0, z + 2.2);
            scene.add(mastArm);

            // Traffic light housing
            const sigHead = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.3, 0.45), signalBoxMat);
            sigHead.position.set(x - 3.2, y + 7.7, z + 2.2);
            scene.add(sigHead);

            // Glowing signal bulb (green or red)
            const isGreen = (gx + gz) % 2 === 0;
            const bulbMat = new THREE.MeshBasicMaterial({ color: isGreen ? 0x00ff66 : 0xff2222 });
            const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), bulbMat);
            bulb.position.set(x - 3.2, y + (isGreen ? 7.35 : 8.05), z + 2.45);
            scene.add(bulb);

            // Yellow diamond street sign on pole (matching reference photo)
            const diamond = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.08), signYellowMat);
            diamond.rotation.z = Math.PI / 4;
            diamond.position.set(x + 2.2, y + 5.2, z + 2.32);
            scene.add(diamond);

            // SF Canary Island Palm Trees along avenues
            if ((gx + gz) % 2 === 0) {
                createPalmTree(x + 14, getElevation(x + 14, z + 2.5), z + 2.5);
            }
        }

        function buildBridge() {
            // Iconic silver-grey steel truss SF-Oakland Bay Bridge (matching reference photos background)
            const bridgeGroup = new THREE.Group();
            const steelMat = new THREE.MeshStandardMaterial({ color: 0xaeb6bf, roughness: 0.35, metalness: 0.65 });
            const deckMat = new THREE.MeshStandardMaterial({ color: 0x7f8892, roughness: 0.5, metalness: 0.4 });

            // Massive steel suspension towers in the bay
            for (let z of [-240, 240]) {
                for (let legX of [-10, 10]) {
                    const leg = new THREE.Mesh(new THREE.BoxGeometry(6, 210, 8), steelMat);
                    leg.position.set(490, 95, z + legX);
                    bridgeGroup.add(leg);
                }
                // X-bracing crossbeams
                for (let y of [45, 95, 145, 190]) {
                    const beam = new THREE.Mesh(new THREE.BoxGeometry(7, 6, 30), steelMat);
                    beam.position.set(490, y, z);
                    bridgeGroup.add(beam);
                }
            }

            // Double-deck steel truss span visible down East-West streets (just like reference photos!)
            const lowerDeck = new THREE.Mesh(new THREE.BoxGeometry(18, 2.5, 1200), deckMat);
            lowerDeck.position.set(490, 42, 0);
            const upperDeck = new THREE.Mesh(new THREE.BoxGeometry(18, 2.5, 1200), deckMat);
            upperDeck.position.set(490, 52, 0);
            bridgeGroup.add(lowerDeck, upperDeck);

            // Steel truss vertical & diagonal struts between decks
            const strutGeo = new THREE.BoxGeometry(18.5, 10, 1.8);
            for (let z = -560; z <= 560; z += 28) {
                const strut = new THREE.Mesh(strutGeo, steelMat);
                strut.position.set(490, 47, z);
                bridgeGroup.add(strut);
            }

            scene.add(bridgeGroup);
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
        // --- INITIALIZATION & LOOP ---
        function init() {
            const container = document.getElementById('canvas-container');
            
            scene = new THREE.Scene();
            // Bright realistic San Francisco coastal daylight sky & marine layer haze (matching reference photos)
            scene.background = new THREE.Color(0xc8dcf0);
            scene.fog = new THREE.FogExp2(0xd4e2f0, 0.0011);

            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1200);
            
            renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.05;
            container.appendChild(renderer.domElement);

            // Post-Processing (Crisp bloom for high-energy lasers without washing out daylight)
            const renderScene = new RenderPass(scene, camera);
            const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.7, 0.35, 0.88);
            bloomPass.threshold = 0.85;
            bloomPass.strength = 0.65;
            bloomPass.radius = 0.4;

            composer = new EffectComposer(renderer);
            composer.addPass(renderScene);
            composer.addPass(bloomPass);

            // Crisp SF Daylight Lighting
            const ambientLight = new THREE.HemisphereLight(0xe6f2ff, 0x70757a, 1.6);
            scene.add(ambientLight);

            const sunLight = new THREE.DirectionalLight(0xfff6e8, 2.2);
            sunLight.position.set(-260, 340, -180);
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

            // Spawn Player on an East-West avenue facing East toward the Bay Bridge & downtown
            const startGx = 5;
            const startGz = 6;
            const playerStartX = -OFFSET + startGx * CELL_SIZE + STREET_WIDTH / 2;
            const playerStartZ = -OFFSET + startGz * CELL_SIZE + STREET_WIDTH / 2;
            player = new Vehicle(playerStartX, playerStartZ, true);
            player.angle = Math.PI / 2; // Facing +X (down the street toward Bay Bridge)

            // Spawn Autonomous Fleet (18 Opponent Waymos), placing several directly ahead on the player's street & nearby intersections
            const botCount = 18;
            for (let i = 0; i < botCount; i++) {
                const bot = new Vehicle(0, 0, false);
                if (i === 0) {
                    bot.pos.x = playerStartX + 32;
                    bot.pos.z = playerStartZ - 3.5;
                    bot.angle = -Math.PI / 2;
                } else if (i === 1) {
                    bot.pos.x = playerStartX + 58;
                    bot.pos.z = playerStartZ + 3.5;
                    bot.angle = Math.PI / 2;
                } else if (i === 2) {
                    bot.pos.x = playerStartX + 85;
                    bot.pos.z = playerStartZ - 2.0;
                    bot.angle = Math.PI;
                } else if (i === 3) {
                    bot.pos.x = playerStartX + 100;
                    bot.pos.z = playerStartZ + 22;
                    bot.angle = 0;
                } else if (i === 4) {
                    bot.pos.x = playerStartX + 100;
                    bot.pos.z = playerStartZ - 22;
                    bot.angle = Math.PI;
                } else if (i < 10) {
                    // Cluster in nearby blocks around player
                    const gx = startGx + (i % 3);
                    const gz = startGz + ((i % 2 === 0) ? 1 : -1);
                    bot.pos.x = -OFFSET + gx * CELL_SIZE + STREET_WIDTH / 2;
                    bot.pos.z = -OFFSET + gz * CELL_SIZE + STREET_WIDTH / 2;
                } else {
                    bot.respawn();
                }
                bot.pos.y = getElevation(bot.pos.x, bot.pos.z);
                bot.mesh.position.copy(bot.pos);
                bots.push(bot);
            }
            document.getElementById('bots-val').innerText = botCount + 1;

            // Snap camera immediately behind player so the scene is framed from frame 0
            const initForward = new THREE.Vector3(Math.sin(player.angle), 0, Math.cos(player.angle));
            camera.position.copy(player.pos).sub(initForward.clone().multiplyScalar(11)).add(new THREE.Vector3(0, 4.5, 0));
            camera.lookAt(player.pos.clone().add(initForward.multiplyScalar(20)).add(new THREE.Vector3(0, 2.0, 0)));

            // Event Listeners
            window.addEventListener('resize', onWindowResize);
            window.addEventListener('keydown', e => handleKey(e, true));
            window.addEventListener('keyup', e => handleKey(e, false));
            window.addEventListener('mousedown', () => { if(gameActive) keys.space = true; });
            window.addEventListener('mouseup', () => keys.space = false);

            const startGame = () => {
                const overlay = document.getElementById('overlay');
                if (overlay.style.display !== 'none') {
                    overlay.style.display = 'none';
                    sound.init();
                    gameActive = true;
                    addKillFeed("SYSTEM ONLINE: Autonomous Laser Tag Engaged.");
                }
            };
            document.getElementById('start-btn').addEventListener('click', startGame);

            // Start Loop
            animate();
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
        function handleKey(e, isDown) {
            const code = e.code;
            if (code === 'KeyW' || code === 'ArrowUp') keys.w = isDown;
            if (code === 'KeyS' || code === 'ArrowDown') keys.s = isDown;
            if (code === 'KeyA' || code === 'ArrowLeft') keys.a = isDown;
            if (code === 'KeyD' || code === 'ArrowRight') keys.d = isDown;
            if (code === 'Space') keys.space = isDown;
            if (code === 'ShiftLeft' || code === 'ShiftRight') keys.shift = isDown;
        }
=======
        function handleKey(e, isDown) {
            if (isDown && !gameActive) {
                const overlay = document.getElementById('overlay');
                if (overlay) overlay.style.display = 'none';
                sound.init();
                gameActive = true;
            }
            const code = e.code;
            if (code === 'KeyW' || code === 'ArrowUp') keys.w = isDown;
            if (code === 'KeyS' || code === 'ArrowDown') keys.s = isDown;
            if (code === 'KeyA' || code === 'ArrowLeft') keys.a = isDown;
            if (code === 'KeyD' || code === 'ArrowRight') keys.d = isDown;
            if (code === 'Space') keys.space = isDown;
            if (code === 'ShiftLeft' || code === 'ShiftRight') keys.shift = isDown;
        }
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
                updateParticles(dt);
                updateCamera(dt);
                updateHUD();
            } else {
                // Keep camera behind player looking down the SF street at rival Waymos even before clicking start
                bots.forEach(b => {
                    b.mesh.userData.turret.rotation.y += 8 * dt;
                });
                player.mesh.userData.turret.rotation.y += 8 * dt;
                updateCamera(dt);
                updateHUD();
            }

            // Update live telemetry state on window.__waymo
            if (dt > 0.0001) {
                fpsSmooth = fpsSmooth * 0.9 + (1 / dt) * 0.1;
            }
            camera.updateMatrixWorld();
            const frustum = new THREE.Frustum();
            const projScreenMatrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
            frustum.setFromProjectionMatrix(projScreenMatrix);
            let visibleCount = 0;
            for (let b of bots) {
                if (frustum.containsPoint(b.pos) && b.pos.distanceTo(player.pos) < 350) {
                    visibleCount++;
                }
            }
            const tryingToMove = keys.w || keys.s;
            if (gameActive && tryingToMove && Math.abs(player.speed) < 1.0) {
                stuckTimer += dt;
            } else {
                stuckTimer = 0;
            }

            window.__waymo = {
                player: {
                    x: Number(player.pos.x.toFixed(2)),
                    y: Number(player.pos.y.toFixed(2)),
                    z: Number(player.pos.z.toFixed(2)),
                    speed: Math.round(Math.abs(player.speed) * 1.5)
                },
                enemiesVisible: visibleCount,
                enemiesTotal: bots.length,
                tags: score,
                lasersFired: totalLasersFired,
                fps: Math.round(fpsSmooth),
                stuck: stuckTimer > 2.0
            };

            composer.render();
        }
>>>>>>> REPLACE