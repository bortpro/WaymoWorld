<<<<<<< SEARCH
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
=======
        function createBuildingTexture(baseColor, isBrick = false) {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            
            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, 256, 512);

            if (isBrick) {
                // Detailed SoMa brick & concrete spandrel facade (matching reference photos)
                ctx.fillStyle = 'rgba(0,0,0,0.08)';
                for (let y = 0; y < 512; y += 6) {
                    ctx.fillRect(0, y, 256, 1.5);
                }
                // Vertical brick piers
                ctx.fillStyle = 'rgba(255,255,255,0.12)';
                for (let x = 0; x < 256; x += 64) {
                    ctx.fillRect(x, 0, 8, 512);
                }
            }

            // Horizontal stone spandrel & cornice bands (SF Edwardian/commercial style like reference photos)
            ctx.fillStyle = isBrick ? '#dcd8d0' : 'rgba(255,255,255,0.34)';
            for (let y = 0; y < 512; y += 64) {
                ctx.fillRect(0, y, 256, 7);
            }
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            for (let y = 7; y < 512; y += 64) {
                ctx.fillRect(0, y, 256, 3);
            }

            // Ground-floor retail/garage storefront band at bottom
            ctx.fillStyle = '#2d3238';
            ctx.fillRect(0, 448, 256, 64);
            ctx.fillStyle = '#d8d4cc';
            ctx.fillRect(0, 444, 256, 6);
            
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
                    // White window trim & sill
                    ctx.fillStyle = '#f0f0ec';
                    ctx.fillRect(wx - 2, wy - 2, w + 4, h + 4);
                    ctx.fillStyle = '#c8c4bc';
                    ctx.fillRect(wx - 4, wy + h + 1, w + 8, 3);

                    // Daytime reflective sky-tinted glass
                    const glassTone = (r + c) % 3 === 0 ? '#4d6a88' : (Math.random() > 0.4 ? '#364f68' : '#5e7b98');
                    ctx.fillStyle = glassTone;
                    ctx.fillRect(wx, wy, w, h);

                    // Interior Venetian blinds / upper reflection (like the brick building in reference photos)
                    ctx.fillStyle = (r * 3 + c) % 4 === 0 ? 'rgba(240, 236, 225, 0.55)' : 'rgba(215, 235, 255, 0.32)';
                    ctx.fillRect(wx + 1, wy + 1, w - 2, h * 0.42);

                    // Mullion bars (3-part SF commercial bay window panes)
                    ctx.fillStyle = '#e5e5e0';
                    ctx.fillRect(wx, wy + h * 0.48, w, 2);
                    ctx.fillRect(wx + w * 0.28, wy, 1.5, h);
                    ctx.fillRect(wx + w * 0.72, wy, 1.5, h);
                }
            }
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.anisotropy = 4;
            return tex;
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
        // --- SF ELEVATION FUNCTION ---
        function getElevation(x, z) {
            // Bay on the East side (x > 420)
            if (x > 450) return -6;
            
            // Smooth transition to Embarcadero waterfront
            let bayFactor = 1;
            if (x > 260) {
                bayFactor = Math.max(0, 1 - ((x - 260) / 190));
            }

            // Smooth, drivable SF Hills (Nob Hill, Russian Hill, SoMa grade)
            // Gentle wavelengths so streets & intersections never form steep walls or cliffs
            let h = 2.0;
            h += (Math.sin(x * 0.0045) * Math.cos(z * 0.0045) + 1) * 9;
            // Smooth central hill crest
            const d1Sq = (x + 120) * (x + 120) + (z - 80) * (z - 80);
            h += 22 * Math.exp(-d1Sq / 55000);
            // Secondary hill crest
            const d2Sq = (x - 80) * (x - 80) + (z + 180) * (z + 180);
            h += 16 * Math.exp(-d2Sq / 48000);

            return h * bayFactor;
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
                this.hp = 100;
                this.energy = 100;
                this.lastShot = 0;
                this.invulnTimer = isPlayer ? 4.0 : 0;

                // AI specifics
                this.aiState = 'wander';
                this.targetAngle = this.angle;
                this.aiTimer = 0;
            }

            update(dt) {
                // Energy regen & spawn shield timer
                this.energy = Math.min(100, this.energy + 28 * dt);
                if (this.invulnTimer > 0) this.invulnTimer = Math.max(0, this.invulnTimer - dt);

                if (this.isPlayer) {
                    this.handlePlayerInput(dt);
                } else {
                    this.handleAI(dt);
                }
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
                // Spawn laser from roof LiDAR dome
                const spawnPos = this.pos.clone();
                spawnPos.y += 2.08;

                // Aim vector: along street terrain grade or toward crosshair target
                const forward = new THREE.Vector3(Math.sin(this.angle), 0, Math.cos(this.angle));
                const normal = getTerrainNormal(this.pos.x, this.pos.z);
                let dir = forward.clone().projectOnPlane(normal).normalize();

                if (this.isPlayer) {
                    // Aim straight ahead along the player's sightline so the beam clearly streaks across the screen
                    const farPoint = spawnPos.clone().addScaledVector(dir, 95);
                    farPoint.y = getElevation(farPoint.x, farPoint.z) + 1.6;
                    dir = farPoint.sub(spawnPos).normalize();
                }

                // Generous auto-aim assist cone towards visible targets
                let bestTarget = null;
                let minAngle = this.isPlayer ? 0.52 : 0.40;

                const potentialTargets = this.isPlayer ? bots : [player, ...bots.filter(b => b !== this)];
                potentialTargets.forEach(t => {
                    if (!t) return;
                    const toTarget = t.pos.clone().add(new THREE.Vector3(0, 1.2, 0)).sub(spawnPos);
                    const dist = toTarget.length();
                    if (dist < 155) {
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
                    aimPos.y += 1.2; // Aim at center mass
                    const exactDir = aimPos.sub(spawnPos).normalize();
                    dir.lerp(exactDir, this.isPlayer ? 0.92 : 0.75).normalize();
                }

                // Bright muzzle flash & thick high-visibility laser beam trace from roof LiDAR
                const beamColor = this.isPlayer ? 0x00ffcc : 0xff0055;
                createParticles(spawnPos, beamColor, 4, 6);
                const traceLen = bestTarget ? Math.min(120, spawnPos.distanceTo(bestTarget.pos)) : 95;
                createBeamTrace(spawnPos, dir, beamColor, traceLen, this.isPlayer);

                lasers.push(new Laser(spawnPos, dir, this));
            }

            takeDamage(amount, attacker) {
                if (this.invulnTimer > 0) return;
                const finalDamage = this.isPlayer ? amount * 0.45 : amount;
                this.hp -= finalDamage;
                createParticles(this.pos.clone().add(new THREE.Vector3(0,1,0)), this.isPlayer ? 0x00f0ff : 0xff0055, 6, 5);
                
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
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
            respawn() {
                this.hp = 100;
                this.energy = 100;
                this.speed = 0;
                this.invulnTimer = this.isPlayer ? 4.0 : 1.0;

                if (this.isPlayer) {
                    // Spawn player in scenic central SoMa/Financial District avenue facing East toward the Bay Bridge & bots
                    const gx = 5;
                    const gz = 6;
                    this.pos.x = -OFFSET + gx * CELL_SIZE + STREET_WIDTH / 2;
                    this.pos.z = -OFFSET + gz * CELL_SIZE + STREET_WIDTH / 2;
                    this.angle = Math.PI / 2; // Facing East down the street
                } else {
                    // Spawn bots on streets around the player at a safe distance (45 to 190m away, with several ahead)
                    let bestX = 0, bestZ = 0;
                    for (let attempt = 0; attempt < 20; attempt++) {
                        const gx = Math.floor(Math.random() * 7) + 3; // Central blocks 3..9
                        const gz = Math.floor(Math.random() * 7) + 3;
                        const offsetAlongStreet = (Math.random() - 0.5) * 40;
                        const tx = -OFFSET + gx * CELL_SIZE + STREET_WIDTH / 2 + (attempt % 2 === 0 ? offsetAlongStreet : 0);
                        const tz = -OFFSET + gz * CELL_SIZE + STREET_WIDTH / 2 + (attempt % 2 !== 0 ? offsetAlongStreet : 0);
                        if (tx > 340) continue;
                        bestX = tx;
                        bestZ = tz;
                        if (!player) break;
                        const dist = Math.hypot(tx - player.pos.x, tz - player.pos.z);
                        if (dist > 45 && dist < 210) break;
                    }
                    this.pos.x = bestX;
                    this.pos.z = bestZ;
                }
                this.pos.y = getElevation(this.pos.x, this.pos.z);
                this.mesh.position.copy(this.pos);
            }
        }

        function createBeamTrace(startPos, dir, color, length = 85, isPlayer = false) {
            const group = new THREE.Group();
            const outerR = isPlayer ? 0.42 : 0.24;
            const coreR = isPlayer ? 0.16 : 0.09;
            const outerGeo = new THREE.CylinderGeometry(outerR, outerR, length, 8);
            outerGeo.translate(0, length / 2, 0);
            outerGeo.rotateX(Math.PI / 2);
            const outerMat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: isPlayer ? 0.88 : 0.65
            });
            const outerMesh = new THREE.Mesh(outerGeo, outerMat);

            const coreGeo = new THREE.CylinderGeometry(coreR, coreR, length, 8);
            coreGeo.translate(0, length / 2, 0);
            coreGeo.rotateX(Math.PI / 2);
            const coreMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.98
            });
            const coreMesh = new THREE.Mesh(coreGeo, coreMat);

            // Bright muzzle glow sphere at roof LiDAR turret
            const flashGeo = new THREE.SphereGeometry(isPlayer ? 0.65 : 0.4, 8, 8);
            const flashMesh = new THREE.Mesh(flashGeo, coreMat);

            group.add(outerMesh, coreMesh, flashMesh);
            group.position.copy(startPos);
            group.lookAt(startPos.clone().add(dir));
            scene.add(group);

            const dur = isPlayer ? 0.24 : 0.16;
            beamTraces.push({ group, outerMat, coreMat, life: dur, maxLife: dur });
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
        // --- WORLD GENERATION ---
        function buildSanFrancisco() {
            // 1. Terrain (Road Grid & Hills)
            const terrainGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 160, 160);
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
            const texColors = ['#9c4738', '#e6dfd3', '#c8b8a6', '#8f5242', '#dcd6cc'];
            const bTextures = texColors.map((c, idx) => createBuildingTexture(c, idx === 0 || idx === 3));
            const victorianColors = [0xe8d5b7, 0xd48c70, 0x8fb8a8, 0x99b3cc, 0xf2e2c4, 0xc76d5e];
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
>>>>>>> REPLACE
<<<<<<< SEARCH
                        const bGeo = new THREE.BoxGeometry(w, h + 28, d);
                        const tex = bTextures[Math.floor(Math.random() * bTextures.length)];
                        const bMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.15 });
                        
                        const bMesh = new THREE.Mesh(bGeo, bMat);
                        bMesh.position.set(bx, groundY + h/2 - 14, bz);
                        bMesh.castShadow = true;
                        bMesh.receiveShadow = true;
                        scene.add(bMesh);
=======
                        const bGeo = new THREE.BoxGeometry(w, h + 16, d);
                        const tex = bTextures[Math.floor(Math.random() * bTextures.length)];
                        const bMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.15 });
                        
                        const bMesh = new THREE.Mesh(bGeo, bMat);
                        bMesh.position.set(bx, groundY + h/2 - 8, bz);
                        bMesh.receiveShadow = true;
                        scene.add(bMesh);
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
                                const hGeo = new THREE.BoxGeometry(subSize, hh + 14, subSize);
                                const color = victorianColors[Math.floor(Math.random() * victorianColors.length)];
                                const hMat = new THREE.MeshStandardMaterial({ 
                                    color: color, 
                                    map: bTextures[(gx + gz) % 2 === 0 ? 0 : 1],
                                    roughness: 0.55 
                                });
                                const hMesh = new THREE.Mesh(hGeo, hMat);
                                hMesh.position.set(hx, hy + hh/2 - 7, hz);
                                hMesh.receiveShadow = true;
                                scene.add(hMesh);
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
            // Realistic SF Canary Island Date Palm with arched fronds (as seen in reference photos)
            if ((gx + gz) % 2 === 0) {
                const px = x + BLOCK_SIZE - 4;
                const pz = z + 2;
                const py = getElevation(px, pz);
                const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b5039, roughness: 0.95 });
                const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.46, 9.5, 7), trunkMat);
                trunk.position.set(px, py + 4.75, pz);
                scene.add(trunk);

                const frondMat = new THREE.MeshStandardMaterial({ color: 0x366832, roughness: 0.75 });
                const frondGeo = new THREE.ConeGeometry(0.75, 4.2, 4);
                frondGeo.translate(0, 2.0, 0);
                for (let f = 0; f < 7; f++) {
                    const frond = new THREE.Mesh(frondGeo, frondMat);
                    frond.position.set(px, py + 9.2, pz);
                    frond.rotation.y = (f / 7) * Math.PI * 2;
                    frond.rotation.z = 1.15;
                    frond.scale.set(0.45, 1.0, 1.0);
                    scene.add(frond);
                }
            }

            // Overhead SF Muni Trolley Wires & Green Construction Fence / Orange Barriers (like reference photos)
            if (gx >= 3 && gx <= 8 && gz >= 3 && gz <= 8) {
                const wireMat = new THREE.MeshBasicMaterial({ color: 0x2c3036 });
                const wire = new THREE.Mesh(new THREE.BoxGeometry(STREET_WIDTH + 6, 0.05, 0.05), wireMat);
                wire.position.set(x - STREET_WIDTH / 2, y + 8.1, z + 2);
                scene.add(wire);
            }

            if ((gx * 3 + gz) % 4 === 0) {
                const barrierMat = new THREE.MeshStandardMaterial({ color: 0xff5a1f, roughness: 0.5 });
                const barrier = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.95, 0.65), barrierMat);
                const by = getElevation(x + 6, z + 1.2);
                barrier.position.set(x + 6, by + 0.45, z + 1.2);
                scene.add(barrier);
            }
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
            renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFShadowMap;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.15;
            container.appendChild(renderer.domElement);

            // Post-Processing (Half-res Bloom for high-FPS glowing Laser Tag beams)
            const renderScene = new RenderPass(scene, camera);
            const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth * 0.5, window.innerHeight * 0.5), 0.7, 0.35, 0.88);
            bloomPass.threshold = 0.85;
            bloomPass.strength = 0.8;
            bloomPass.radius = 0.4;

            composer = new EffectComposer(renderer);
            composer.addPass(renderScene);
            composer.addPass(bloomPass);

            // Bright Daytime SF Lighting
            const ambientLight = new THREE.HemisphereLight(0xdff0ff, 0x7a8088, 1.85);
            scene.add(ambientLight);

            const sunLight = new THREE.DirectionalLight(0xfff6e5, 2.6);
            sunLight.position.set(-280, 380, -180);
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 1024;
            sunLight.shadow.mapSize.height = 1024;
            sunLight.shadow.camera.near = 20;
            sunLight.shadow.camera.far = 900;
            const d = 320;
            sunLight.shadow.camera.left = -d;
            sunLight.shadow.camera.right = d;
            sunLight.shadow.camera.top = d;
            sunLight.shadow.camera.bottom = -d;
            sunLight.shadow.bias = -0.0005;
            scene.add(sunLight);
>>>>>>> REPLACE
<<<<<<< SEARCH
            if (gameActive) {
                player.update(dt);
                bots.forEach(b => b.update(dt));
=======
            if (gameActive) {
                player.update(dt);
                bots.forEach(b => {
                    b.update(dt);
                    // Keep autonomous fleet circulating near the active play area so streets stay lively
                    if (player && b.pos.distanceTo(player.pos) > 260) {
                        const angle = player.angle + (Math.random() - 0.5) * 1.6;
                        const dist = 90 + Math.random() * 80;
                        const nx = THREE.MathUtils.clamp(player.pos.x + Math.sin(angle) * dist, -OFFSET + 50, 330);
                        const nz = THREE.MathUtils.clamp(player.pos.z + Math.cos(angle) * dist, -OFFSET + 50, OFFSET - 50);
                        // Snap to nearest street center
                        const gx = Math.round((nx + OFFSET - STREET_WIDTH / 2) / CELL_SIZE);
                        const gz = Math.round((nz + OFFSET - STREET_WIDTH / 2) / CELL_SIZE);
                        b.pos.x = -OFFSET + gx * CELL_SIZE + STREET_WIDTH / 2;
                        b.pos.z = -OFFSET + gz * CELL_SIZE + STREET_WIDTH / 2;
                        b.pos.y = getElevation(b.pos.x, b.pos.z);
                    }
                });
>>>>>>> REPLACE