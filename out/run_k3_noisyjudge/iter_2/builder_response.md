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
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            
            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, 512, 512);

            // Subtle masonry/brick coursing or concrete panel lines (like SF SoMa brick buildings in reference photos)
            if (isBrick) {
                ctx.fillStyle = 'rgba(60, 20, 15, 0.16)';
                for (let y = 0; y < 512; y += 6) {
                    ctx.fillRect(0, y, 512, 1.5);
                }
            }

            // Vertical pilasters between window bays (classic SF warehouse/office facade)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
            for (let x = 0; x <= 512; x += 128) {
                ctx.fillRect(x - 8, 0, 16, 512);
            }

            // Horizontal spandrel & cornice bands (white trim bands like reference photo right side)
            for (let y = 0; y < 512; y += 64) {
                ctx.fillStyle = '#eae6df';
                ctx.fillRect(0, y, 512, 6);
                ctx.fillStyle = 'rgba(0,0,0,0.22)';
                ctx.fillRect(0, y + 6, 512, 3);
            }
            
            const rows = 8;
            const cols = 4;
            const padX = 18;
            const padY = 14;
            const w = (512 - padX * (cols + 1)) / cols;
            const h = (512 - padY * (rows + 1)) / rows;
            
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const wx = padX + c * (w + padX);
                    const wy = padY + r * (h + padY);
                    // Deep recessed window frame & white sill
                    ctx.fillStyle = '#2a2d32';
                    ctx.fillRect(wx - 3, wy - 3, w + 6, h + 6);
                    ctx.fillStyle = '#f2efe9';
                    ctx.fillRect(wx - 2, wy - 2, w + 4, h + 4);
                    ctx.fillRect(wx - 4, wy + h + 1, w + 8, 3);

                    // Daytime reflective sky-tinted glass with interior blinds variation
                    const glassTone = (r + c) % 3 === 0 ? '#4a6682' : ((r * 3 + c) % 2 === 0 ? '#364d63' : '#5e7c99');
                    ctx.fillStyle = glassTone;
                    ctx.fillRect(wx, wy, w, h);

                    // Upper window Venetian blind / sky reflection
                    ctx.fillStyle = (r + c) % 4 === 0 ? 'rgba(240, 235, 220, 0.55)' : 'rgba(215, 235, 255, 0.35)';
                    ctx.fillRect(wx, wy, w, h * 0.38);

                    // Double-hung / industrial 3-pane mullions
                    ctx.fillStyle = '#e5e3dc';
                    ctx.fillRect(wx, wy + h * 0.52, w, 2.5);
                    ctx.fillRect(wx + w * 0.33, wy, 2, h);
                    ctx.fillRect(wx + w * 0.66, wy, 2, h);
                }
            }
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.anisotropy = 8;
            return tex;
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
        function createRoadTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            
            // Concrete Sidewalk with expansion joints
            ctx.fillStyle = '#b8bcc2';
            ctx.fillRect(0, 0, 512, 512);
            ctx.strokeStyle = 'rgba(80,85,90,0.25)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 512; i += 16) {
                ctx.beginPath();
                ctx.moveTo(i, 0); ctx.lineTo(i, 512);
                ctx.moveTo(0, i); ctx.lineTo(512, i);
                ctx.stroke();
            }

            // Road base (realistic daytime weathered SF asphalt gray like reference photos)
            const roadPx = (STREET_WIDTH / CELL_SIZE) * 512;
            const blockPx = 512 - roadPx;

            ctx.fillStyle = '#5c626b';
            // Horizontal road
            ctx.fillRect(0, 0, 512, roadPx);
            // Vertical road
            ctx.fillRect(0, 0, roadPx, 512);

            // Asphalt paving seams, darker repair patches & tar cracks (prominent in SF reference photos)
            ctx.fillStyle = '#50565e';
            ctx.fillRect(roadPx * 0.15, roadPx * 0.08, roadPx * 0.7, roadPx * 0.48);
            ctx.fillRect(roadPx + 35, 16, 110, 52);
            ctx.fillRect(20, roadPx + 65, 58, 125);
            ctx.fillStyle = '#656b75';
            ctx.fillRect(roadPx + 160, roadPx * 0.5, 140, roadPx * 0.45);

            // Tar crack lines in intersection
            ctx.strokeStyle = '#3a3e44';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(15, roadPx * 0.65);
            ctx.lineTo(roadPx * 0.5, roadPx * 0.72);
            ctx.lineTo(roadPx * 0.9, roadPx * 0.60);
            ctx.stroke();

            // White limit lines & stop bars at intersections
            ctx.fillStyle = '#e8ecf0';
            ctx.fillRect(roadPx + 3, 5, 5, roadPx - 10);
            ctx.fillRect(5, roadPx + 3, roadPx - 10, 5);

            // Double yellow lines & white dashed lane lines
            ctx.strokeStyle = '#e5b535';
            ctx.lineWidth = 2;
            const mid = roadPx / 2;
            
            ctx.beginPath();
            ctx.moveTo(roadPx + 18, mid - 2); ctx.lineTo(512, mid - 2);
            ctx.moveTo(roadPx + 18, mid + 2); ctx.lineTo(512, mid + 2);
            ctx.moveTo(mid - 2, roadPx + 18); ctx.lineTo(mid - 2, 512);
            ctx.moveTo(mid + 2, roadPx + 18); ctx.lineTo(mid + 2, 512);
            ctx.stroke();

            // Crosswalks & yellow ADA tactile curb mats
            ctx.fillStyle = '#e8ecf0';
            for(let i = 10; i < roadPx - 10; i += 14) {
                ctx.fillRect(roadPx + 10, i, 16, 7);
                ctx.fillRect(i, roadPx + 10, 7, 16);
            }
            ctx.fillStyle = '#f2c516';
            ctx.fillRect(roadPx + 2, roadPx + 2, 12, 6);
            ctx.fillRect(roadPx + 2, roadPx + 2, 6, 12);

            // Steel utility vault cover & round manhole covers (exact match to foreground of reference photos)
            ctx.fillStyle = '#9aa2ab';
            ctx.fillRect(mid - 14, roadPx + 1, 28, 12);
            ctx.strokeStyle = '#555b63';
            ctx.strokeRect(mid - 14, roadPx + 1, 28, 12);

            ctx.fillStyle = '#3d4147';
            ctx.beginPath();
            ctx.arc(mid + 18, mid - 12, 5.5, 0, Math.PI * 2);
            ctx.arc(mid - 26, mid + 24, 5, 0, Math.PI * 2);
            ctx.arc(roadPx + 80, mid + 14, 4.5, 0, Math.PI * 2);
            ctx.fill();

            // Orange & white USA utility spray-paint markings on asphalt (seen in reference photos)
            ctx.strokeStyle = '#ff6b35';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(mid - 24, mid + 8, 12, 7);
            ctx.beginPath();
            ctx.moveTo(mid + 15, mid + 10);
            ctx.lineTo(mid + 28, mid + 16);
            ctx.stroke();

            // Building Foundation Courtyard Plot
            ctx.fillStyle = '#9499a1';
            ctx.fillRect(roadPx + 14, roadPx + 14, blockPx - 28, blockPx - 28);

            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(GRID_STEPS, GRID_STEPS);
            tex.anisotropy = 8;
            return tex;
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
>>>>>>> REPLACE
<<<<<<< SEARCH
            update(dt) {
                // Energy regen
                this.energy = Math.min(100, this.energy + 25 * dt);

                if (this.isPlayer) {
=======
            update(dt) {
                // Energy regen & spawn protection countdown
                this.energy = Math.min(100, this.energy + 30 * dt);
                if (this.invulnTimer > 0) this.invulnTimer = Math.max(0, this.invulnTimer - dt);

                if (this.isPlayer) {
>>>>>>> REPLACE
<<<<<<< SEARCH
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
            shoot() {
                const now = clock.getElapsedTime();
                if (now - this.lastShot < 0.18 || this.energy < 8) return;
                
                this.lastShot = now;
                this.energy -= 8;
                if (this.isPlayer) totalLasersFired++;
                sound.playLaser(this.isPlayer);

                // Spawn laser from roof LiDAR dome
                const spawnPos = this.pos.clone();
                spawnPos.y += 2.08;

                // Aim vector: for player, project along terrain-aligned forward direction toward crosshair
                const forward = new THREE.Vector3(Math.sin(this.angle), 0, Math.cos(this.angle));
                const normal = getTerrainNormal(this.pos.x, this.pos.z);
                let dir = forward.projectOnPlane(normal).normalize();

                // Auto-aim assist cone towards targets
                let bestTarget = null;
                let minAngle = this.isPlayer ? 0.55 : 0.40;

                const potentialTargets = this.isPlayer ? bots : [player, ...bots.filter(b => b !== this)];
                potentialTargets.forEach(t => {
                    if (!t) return;
                    const toTarget = t.pos.clone().add(new THREE.Vector3(0, 1.2, 0)).sub(spawnPos);
                    const dist = toTarget.length();
                    if (dist < 170) {
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
                    dir.lerp(exactDir, this.isPlayer ? 0.92 : 0.78).normalize();
                }

                // Bright muzzle flash particles & high-visibility beam from roof LiDAR
                const beamColor = this.isPlayer ? 0x00f0ff : 0xff0055;
                createParticles(spawnPos, beamColor, 3, 6);
                createBeamTrace(spawnPos, dir, beamColor, bestTarget ? spawnPos.distanceTo(bestTarget.pos) : 115, this.isPlayer);

                lasers.push(new Laser(spawnPos, dir, this));
            }

            takeDamage(amount, attacker) {
                if (this.invulnTimer > 0) return;
                // Player has reinforced LiDAR armor so dogfights feel fun and forgiving
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
                    // Spawn player in central SoMa / Downtown corridor facing the Bay Bridge & skyline
                    const gx = 5;
                    const gz = 6;
                    this.pos.x = -OFFSET + gx * CELL_SIZE + STREET_WIDTH / 2;
                    this.pos.z = -OFFSET + gz * CELL_SIZE + STREET_WIDTH / 2;
                    this.angle = Math.PI / 2; // Facing East along wide street toward Bay Bridge
                    this.pos.y = getElevation(this.pos.x, this.pos.z);

                    // Reposition several bots onto nearby intersections ahead so action is always visible
                    if (bots && bots.length > 0) {
                        bots.forEach((b, idx) => {
                            if (idx < 6) {
                                const bGx = Math.min(8, gx + 1 + (idx % 3));
                                const bGz = gz + (idx % 2 === 0 ? 0 : (idx < 3 ? 1 : -1));
                                b.pos.x = -OFFSET + bGx * CELL_SIZE + STREET_WIDTH / 2 + (idx - 2.5) * 3;
                                b.pos.z = -OFFSET + bGz * CELL_SIZE + STREET_WIDTH / 2;
                                b.pos.y = getElevation(b.pos.x, b.pos.z);
                            }
                        });
                    }
                } else {
                    // Spawn bots around the player's vicinity (within 1-3 blocks, never on top of player)
                    let attempts = 0;
                    do {
                        const gx = 3 + Math.floor(Math.random() * 6);
                        const gz = 3 + Math.floor(Math.random() * 6);
                        this.pos.x = -OFFSET + gx * CELL_SIZE + STREET_WIDTH / 2 + (Math.random() - 0.5) * 8;
                        this.pos.z = -OFFSET + gz * CELL_SIZE + STREET_WIDTH / 2 + (Math.random() - 0.5) * 8;
                        attempts++;
                    } while (player && this.pos.distanceTo(player.pos) < 42 && attempts < 15);

                    if (this.pos.x > 350) this.pos.x = 115;
                    this.pos.y = getElevation(this.pos.x, this.pos.z);
                }
            }
        }

        function createBeamTrace(startPos, dir, color, length = 95, isPlayer = false) {
            const group = new THREE.Group();
            const outerRadius = isPlayer ? 0.45 : 0.26;
            const coreRadius = isPlayer ? 0.18 : 0.09;

            const outerGeo = new THREE.CylinderGeometry(outerRadius, outerRadius, length, 8);
            outerGeo.translate(0, length / 2, 0);
            outerGeo.rotateX(Math.PI / 2);
            const outerMat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: isPlayer ? 0.85 : 0.65
            });
            const outerMesh = new THREE.Mesh(outerGeo, outerMat);

            const coreGeo = new THREE.CylinderGeometry(coreRadius, coreRadius, length, 8);
            coreGeo.translate(0, length / 2, 0);
            coreGeo.rotateX(Math.PI / 2);
            const coreMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.98
            });
            const coreMesh = new THREE.Mesh(coreGeo, coreMat);

            // Glowing muzzle orb on the roof dome
            const orbGeo = new THREE.SphereGeometry(isPlayer ? 0.65 : 0.35, 8, 8);
            const orbMesh = new THREE.Mesh(orbGeo, outerMat);

            group.add(outerMesh, coreMesh, orbMesh);
            group.position.copy(startPos);
            group.lookAt(startPos.clone().add(dir));
            scene.add(group);

            const duration = isPlayer ? 0.26 : 0.16;
            beamTraces.push({ group, outerMat, coreMat, life: duration, maxLife: duration });
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
                // Glowing outer plasma sheath (thick & unmistakable for player shots)
                const rOuter = owner.isPlayer ? 0.42 : 0.28;
                const rCore = owner.isPlayer ? 0.18 : 0.11;
                const boltLen = owner.isPlayer ? 18 : 12;
                const outerGeo = new THREE.CylinderGeometry(rOuter, rOuter, boltLen, 8);
                outerGeo.rotateX(Math.PI / 2);
                const outerMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.9 });
                const outer = new THREE.Mesh(outerGeo, outerMat);

                // Bright white inner core
                const coreGeo = new THREE.CylinderGeometry(rCore, rCore, boltLen + 0.5, 8);
                coreGeo.rotateX(Math.PI / 2);
                const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
                const core = new THREE.Mesh(coreGeo, coreMat);
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
        // --- PARTICLE SYSTEM (Shared Geometry for High FPS) ---
        const sharedParticleGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
        const particleMatCache = {};
        function getParticleMat(color) {
            if (!particleMatCache[color]) {
                particleMatCache[color] = new THREE.MeshBasicMaterial({ color: color });
            }
            return particleMatCache[color];
        }

        function createParticles(pos, color, count, speed) {
            if (particles.length > 120) return; // Cap active particles for smooth 60 FPS
            const mat = getParticleMat(color);
            
            for (let i = 0; i < count; i++) {
                const mesh = new THREE.Mesh(sharedParticleGeo, mat);
                mesh.position.copy(pos);
                
                const vel = new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    Math.random() * 1.5,
                    (Math.random() - 0.5) * 2
                ).normalize().multiplyScalar(Math.random() * speed);

                scene.add(mesh);
                particles.push({ mesh, vel, life: 0.4 + Math.random() * 0.35 });
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
                p.mesh.scale.setScalar(Math.max(0.01, p.life));

                if (p.life <= 0) {
                    scene.remove(p.mesh);
                    particles.splice(i, 1);
                }
            }
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
        function buildSanFrancisco() {
            // 1. Terrain (Road Grid & Hills)
            const terrainGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 150, 150);
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
                roughness: 0.82,
                metalness: 0.08
            });
            const terrain = new THREE.Mesh(terrainGeo, terrainMat);
            terrain.receiveShadow = true;
            scene.add(terrain);
>>>>>>> REPLACE
<<<<<<< SEARCH
                    const groundY = getElevation(bx, bz);

                    // Concrete stepped foundation / retaining plinth so blocks sit cleanly on SF hills
                    const plinthGeo = new THREE.BoxGeometry(BLOCK_SIZE - 4, 24, BLOCK_SIZE - 4);
                    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
                    plinth.position.set(bx, groundY - 11.2, bz);
                    plinth.receiveShadow = true;
                    scene.add(plinth);

                    // Special Landmark: Transamerica Pyramid
=======
                    const groundY = getElevation(bx, bz);

                    // Compute lowest corner of the block so no concrete plinth ever pokes above sloped streets
                    const halfPlot = (BLOCK_SIZE - 14) / 2;
                    const minCornerY = Math.min(
                        getElevation(bx - halfPlot, bz - halfPlot),
                        getElevation(bx + halfPlot, bz - halfPlot),
                        getElevation(bx - halfPlot, bz + halfPlot),
                        getElevation(bx + halfPlot, bz + halfPlot)
                    );

                    // Sub-surface foundation plinth tucked safely below the lowest sidewalk corner
                    const plinthGeo = new THREE.BoxGeometry(BLOCK_SIZE - 14, 24, BLOCK_SIZE - 14);
                    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
                    plinth.position.set(bx, minCornerY - 12.2, bz);
                    scene.add(plinth);

                    // Special Landmark: Transamerica Pyramid
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
                                const hMesh = new THREE.Mesh(hGeo, hMat);
                                hMesh.position.set(hx, hy + hh/2 - 12, hz);
                                hMesh.castShadow = true;
                                hMesh.receiveShadow = true;
                                scene.add(hMesh);

                                // Flat Edwardian roof cornice + parapet (authentic SF rowhouse look)
                                const cornice = new THREE.Mesh(new THREE.BoxGeometry(subSize + 1.6, 1.8, subSize + 1.6), trimMat);
                                cornice.position.set(hx, hy + hh, hz);
                                scene.add(cornice);

                                // Projecting SF Bay Window stacks on both X and Z street-facing facades
                                const bayX = hx + Math.sign(sx) * (subSize / 2 + 1.1);
                                const bayWindowX = new THREE.Mesh(new THREE.BoxGeometry(2.4, hh - 2, subSize * 0.45), hMat);
                                bayWindowX.position.set(bayX, hy + hh / 2 - 1, hz);
                                scene.add(bayWindowX);

                                const bayZ = hz + Math.sign(sz) * (subSize / 2 + 1.1);
                                const bayWindowZ = new THREE.Mesh(new THREE.BoxGeometry(subSize * 0.45, hh - 2, 2.4), hMat);
                                bayWindowZ.position.set(hx, hy + hh / 2 - 1, bayZ);
                                scene.add(bayWindowZ);

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

        // Shared geometries & materials for street props to maintain high FPS
        const sharedProps = {
            poleMat: new THREE.MeshStandardMaterial({ color: 0x686e75, metalness: 0.6, roughness: 0.4 }),
            signalMat: new THREE.MeshStandardMaterial({ color: 0x1e2226 }),
            greenBulbMat: new THREE.MeshBasicMaterial({ color: 0x00ff66 }),
            redBulbMat: new THREE.MeshBasicMaterial({ color: 0xff3322 }),
            signMat: new THREE.MeshStandardMaterial({ color: 0xf2b705, roughness: 0.4 }),
            trunkMat: new THREE.MeshStandardMaterial({ color: 0x6e533c, roughness: 0.9 }),
            frondMat: new THREE.MeshStandardMaterial({ color: 0x3b6e38, roughness: 0.75 }),
            barrierMat: new THREE.MeshStandardMaterial({ color: 0xff5a1f, roughness: 0.5 }),
            wireMat: new THREE.LineBasicMaterial({ color: 0x3a4048, transparent: true, opacity: 0.55 }),
            poleGeo: new THREE.CylinderGeometry(0.16, 0.22, 8.8, 6),
            armGeo: new THREE.BoxGeometry(5.2, 0.14, 0.14),
            signalGeo: new THREE.BoxGeometry(0.45, 1.2, 0.45),
            bulbGeo: new THREE.SphereGeometry(0.16, 6, 6),
            signGeo: new THREE.BoxGeometry(0.85, 0.85, 0.06),
            trunkGeo: new THREE.CylinderGeometry(0.28, 0.46, 9.5, 7),
            frondGeo: new THREE.ConeGeometry(0.75, 4.4, 5),
            barrierGeo: new THREE.BoxGeometry(3.4, 0.95, 0.65)
        };

        function addStreetProps(x, z, gx = 0, gz = 0) {
            if (x > 380) return;
            const y = getElevation(x, z);
            
            // Realistic SF Metal Streetlight & Traffic Signal Mast Arm (from reference photos)
            const pole = new THREE.Mesh(sharedProps.poleGeo, sharedProps.poleMat);
            pole.position.set(x + 2, y + 4.4, z + 2);
            scene.add(pole);

            const arm = new THREE.Mesh(sharedProps.armGeo, sharedProps.poleMat);
            arm.position.set(x - 0.4, y + 8.2, z + 2);
            scene.add(arm);

            // Traffic Signal Head + Yellow Diamond Sign ("DEAD END" / Warning sign in reference photo)
            const signalBox = new THREE.Mesh(sharedProps.signalGeo, sharedProps.signalMat);
            signalBox.position.set(x - 2.2, y + 7.6, z + 2);
            scene.add(signalBox);

            const isGreen = (gx + gz) % 2 === 0;
            const bulb = new THREE.Mesh(sharedProps.bulbGeo, isGreen ? sharedProps.greenBulbMat : sharedProps.redBulbMat);
            bulb.position.set(x - 2.2, y + (isGreen ? 7.25 : 7.95), z + 2.25);
            scene.add(bulb);

            const sign = new THREE.Mesh(sharedProps.signGeo, sharedProps.signMat);
            sign.rotation.z = Math.PI / 4;
            sign.position.set(x + 2, y + 5.3, z + 2.22);
            scene.add(sign);

            // Overhead Muni / Trolley Wires spanning across SF intersections (seen in reference photos)
            if (gx < GRID_STEPS - 1) {
                const nextX = x - STREET_WIDTH;
                const nextY = getElevation(nextX, z);
                const wirePts = [
                    new THREE.Vector3(x + 2, y + 8.5, z + 2),
                    new THREE.Vector3((x + nextX) * 0.5, (y + nextY) * 0.5 + 8.1, z + 2),
                    new THREE.Vector3(nextX - 2, nextY + 8.5, z + 2)
                ];
                const wireGeo = new THREE.BufferGeometry().setFromPoints(wirePts);
                scene.add(new THREE.Line(wireGeo, sharedProps.wireMat));
            }

            // Realistic Canary Island Date Palm with radiating arched fronds (like reference photos!)
            if ((gx + gz) % 2 === 0) {
                const tx = x + BLOCK_SIZE - 4;
                const tz = z + 2;
                const ty = getElevation(tx, tz);
                const palmGroup = new THREE.Group();
                palmGroup.position.set(tx, ty, tz);

                const trunk = new THREE.Mesh(sharedProps.trunkGeo, sharedProps.trunkMat);
                trunk.position.y = 4.75;
                palmGroup.add(trunk);

                // 7 radiating arched palm fronds instead of a lollipop sphere
                for (let f = 0; f < 7; f++) {
                    const angle = (f / 7) * Math.PI * 2;
                    const frond = new THREE.Mesh(sharedProps.frondGeo, sharedProps.frondMat);
                    frond.position.set(Math.cos(angle) * 1.6, 9.2, Math.sin(angle) * 1.6);
                    frond.rotation.y = -angle + Math.PI / 2;
                    frond.rotation.x = 1.15;
                    frond.scale.set(1, 1, 0.35);
                    palmGroup.add(frond);
                }
                scene.add(palmGroup);
            }

            // Orange Plastic Construction Jersey Barriers on select corners (seen in reference photos)
            if ((gx * 3 + gz) % 4 === 0) {
                const barrier = new THREE.Mesh(sharedProps.barrierGeo, sharedProps.barrierMat);
                const by = getElevation(x + 6, z + 1.2);
                barrier.position.set(x + 6, by + 0.45, z + 1.2);
                scene.add(barrier);
            }
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
=======
            renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFShadowMap;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.15;
            container.appendChild(renderer.domElement);

            // Post-Processing (Half-res Selective Bloom for fast framerate + bright Laser Tag beams)
            const renderScene = new RenderPass(scene, camera);
            const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2), 0.75, 0.35, 0.85);
            bloomPass.threshold = 0.82;
            bloomPass.strength = 0.85;
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
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
            // Build World
            buildSanFrancisco();

            // Spawn Player
            player = new Vehicle(-85, 115, true);

            // Spawn Autonomous Fleet (Bots)
            const botCount = 15;
            for (let i = 0; i < botCount; i++) {
                const bot = new Vehicle(0, 0, false);
                bot.respawn();
                bots.push(bot);
            }
            // Respawn player after bots exist so nearby intersections are populated safely
            player.respawn();
            document.getElementById('bots-val').innerText = botCount + 1;

            // Event Listeners
>>>>>>> REPLACE