<<<<<<< SEARCH
        import * as THREE from 'three';
        import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
        import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
        import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
=======
        import * as THREE from 'three';
        import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
>>>>>>> REPLACE
<<<<<<< SEARCH
        let scene, camera, renderer, composer;
        let player;
        let bots = [];
        let lasers = [];
        let particles = [];
        let buildings = []; // Bounding boxes for collision
        let gameActive = false;
        let score = 0;
        let totalLasersFired = 0;
        let stuckTimer = 0;
        let fpsSmooth = 60;
        let clock = new THREE.Clock();
=======
        let scene, camera, renderer;
        let player;
        let bots = [];
        let lasers = [];
        let particles = [];
        let buildings = []; // Bounding boxes for collision
        let gameActive = false;
        let score = 0;
        let totalLasersFired = 0;
        let stuckTimer = 0;
        let fpsSmooth = 60;
        let lastAiKillFeedTime = 0;
        let clock = new THREE.Clock();

        const sharedParticleGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
        const sharedParticleMats = {};
        function getParticleMat(color) {
            if (!sharedParticleMats[color]) {
                sharedParticleMats[color] = new THREE.MeshBasicMaterial({ color });
            }
            return sharedParticleMats[color];
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
            // Crisp Waymo W logo + wordmark on front & rear doors
            ctx.save();
            ctx.translate(230, 118);
            ctx.strokeStyle = '#0077ff';
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(-36, -22);
            ctx.lineTo(-18, 18);
            ctx.lineTo(0, -8);
            ctx.lineTo(18, 18);
            ctx.lineTo(36, -22);
            ctx.stroke();

            ctx.fillStyle = '#00c875';
            ctx.beginPath();
            ctx.arc(-36, -22, 6, 0, Math.PI * 2);
            ctx.arc(36, -22, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 28px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('WAYMO', 0, 48);
            ctx.restore();
>>>>>>> REPLACE
<<<<<<< SEARCH
                // Ground floor storefront / stoop band so street level looks like real SF
            }
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.anisotropy = 8;
            return tex;
        }
=======
            }

            // Ground-floor storefront / architectural base molding at bottom of facade
            ctx.fillStyle = style === 'victorian' ? '#dcd6cc' : '#3a3f47';
            ctx.fillRect(0, 456, 256, 56);
            ctx.fillStyle = '#d4af37';
            ctx.fillRect(0, 454, 256, 3);
            for (let c = 0; c < 3; c++) {
                ctx.fillStyle = style === 'victorian' ? '#583e2e' : '#1e293b';
                ctx.fillRect(18 + c * 80, 464, 58, 48);
                ctx.fillStyle = '#8ab4d8';
                ctx.fillRect(22 + c * 80, 468, 50, 32);
            }

            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.anisotropy = 8;
            return tex;
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
            // Sleek Jaguar I-PACE coupe-SUV greenhouse (continuous sloped roofline into rear tailgate)
            const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.52, 1.75), glassMat);
            cabin.position.set(0, 1.33, 0.08);
            group.add(cabin);

            const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.70, 0.50, 1.05), glassMat);
            windshield.position.set(0, 1.26, 0.98);
            windshield.rotation.x = -0.54;
            group.add(windshield);

            // Smoothly raked fastback rear glass & white C-pillar cantrails extending all the way to the Kammback tail
            const fastback = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.46, 1.55), glassMat);
            fastback.position.set(0, 1.26, -1.32);
            fastback.rotation.x = 0.34;
            group.add(fastback);

            // Curved white roof & C-pillar aerodynamic rails
            const roof = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.09, 1.85), bodyMat);
            roof.position.set(0, 1.60, 0.05);
            group.add(roof);

            [-0.82, 0.82].forEach(rx => {
                const cPillar = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.12, 1.60), bodyMat);
                cPillar.position.set(rx, 1.44, -1.30);
                cPillar.rotation.x = 0.34;
                group.add(cPillar);
            });

            // Integrated Jaguar I-PACE rear lip spoiler & sculpted Kammback tailgate
            const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.07, 0.36), bodyMat);
            spoiler.position.set(0, 1.26, -2.08);
            spoiler.rotation.x = 0.08;
            group.add(spoiler);

            const rearTail = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.44, 0.45), bodyMat);
            rearTail.position.set(0, 0.98, -2.10);
            group.add(rearTail);
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
                this.invulnTimer = isPlayer ? 3.0 : 0;

                // AI specifics
                this.aiState = 'wander';
                this.targetAngle = this.angle;
                this.aiTimer = 0;
            }

            update(dt) {
                // Energy & Player Passive Armor Regen
                this.energy = Math.min(100, this.energy + 28 * dt);
                if (this.invulnTimer > 0) this.invulnTimer -= dt;
                if (this.isPlayer) {
                    this.hp = Math.min(100, this.hp + 6 * dt);
                    this.handlePlayerInput(dt);
                } else {
                    this.handleAI(dt);
                }
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
            handleAI(dt) {
                this.aiTimer -= dt;

                // Keep AI strictly aligned to valid SF street lanes so they never drive into buildings
                const relX = ((this.pos.x + OFFSET) % CELL_SIZE + CELL_SIZE) % CELL_SIZE;
                const relZ = ((this.pos.z + OFFSET) % CELL_SIZE + CELL_SIZE) % CELL_SIZE;
                const onNSStreet = relX < STREET_WIDTH;
                const onEWStreet = relZ < STREET_WIDTH;

                // Find nearest target (Player or other bot) for laser turret & road-choice
                let nearestDist = 9999;
                let target = null;
                if (player) {
                    const d = this.pos.distanceTo(player.pos);
                    if (d < nearestDist) { nearestDist = d; target = player; }
                }
                for (let i = 0; i < bots.length; i++) {
                    const b = bots[i];
                    if (b !== this) {
                        const d = this.pos.distanceTo(b.pos);
                        if (d < nearestDist) { nearestDist = d; target = b; }
                    }
                }

                // At intersections, choose a cardinal street direction (preferring direction toward target)
                if (onNSStreet && onEWStreet && this.aiTimer <= 0) {
                    const dirs = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
                    if (target && nearestDist < 180) {
                        const desired = Math.atan2(target.pos.x - this.pos.x, target.pos.z - this.pos.z);
                        dirs.sort((a, b) => Math.abs(this.normalizeAngle(a - desired)) - Math.abs(this.normalizeAngle(b - desired)));
                        this.targetAngle = dirs[0];
                    } else {
                        this.targetAngle = dirs[Math.floor(Math.random() * dirs.length)];
                    }
                    this.aiTimer = 1.6 + Math.random() * 2.0;
                } else if (onNSStreet && !onEWStreet) {
                    // Constrain to North/South lane center
                    this.targetAngle = Math.cos(this.angle) >= 0 ? 0 : Math.PI;
                    const cellStartX = Math.floor((this.pos.x + OFFSET) / CELL_SIZE) * CELL_SIZE - OFFSET;
                    const laneOffset = Math.cos(this.angle) >= 0 ? STREET_WIDTH * 0.65 : STREET_WIDTH * 0.35;
                    this.pos.x += (cellStartX + laneOffset - this.pos.x) * 4 * dt;
                } else if (onEWStreet && !onNSStreet) {
                    // Constrain to East/West lane center
                    this.targetAngle = Math.sin(this.angle) >= 0 ? Math.PI / 2 : -Math.PI / 2;
                    const cellStartZ = Math.floor((this.pos.z + OFFSET) / CELL_SIZE) * CELL_SIZE - OFFSET;
                    const laneOffset = Math.sin(this.angle) >= 0 ? STREET_WIDTH * 0.65 : STREET_WIDTH * 0.35;
                    this.pos.z += (cellStartZ + laneOffset - this.pos.z) * 4 * dt;
                }

                // Fire roof laser when target is in range and line-of-sight
                if (target && nearestDist < 105) {
                    const toTargetAngle = Math.atan2(target.pos.x - this.pos.x, target.pos.z - this.pos.z);
                    this.mesh.userData.turret.rotation.y = toTargetAngle - this.angle;
                    const angleDiff = Math.abs(this.normalizeAngle(this.angle - toTargetAngle));
                    if (angleDiff < 0.65) {
                        this.shoot();
                    }
                }

                // Lookahead for building bounds just in case
                const lookAheadDist = 14;
                const lookX = this.pos.x + Math.sin(this.angle) * lookAheadDist;
                const lookZ = this.pos.z + Math.cos(this.angle) * lookAheadDist;
                if (this.checkBuildingCollision(lookX, lookZ)) {
                    this.targetAngle = Math.round(this.angle / (Math.PI / 2)) * (Math.PI / 2) + Math.PI / 2;
                    this.speed *= 0.6;
                }

                // Steer smoothly towards targetAngle
                const diff = this.normalizeAngle(this.targetAngle - this.angle);
                this.angle += Math.sign(diff) * Math.min(Math.abs(diff), this.handling * 1.4 * dt);

                this.speed += this.accel * 0.8 * dt;
                this.speed = Math.min(this.speed, this.maxSpeed);
            }
>>>>>>> REPLACE
<<<<<<< SEARCH
            shoot() {
                const now = clock.getElapsedTime();
                if (now - this.lastShot < 0.16 || this.energy < 8) return;
=======
            shoot() {
                const now = clock.getElapsedTime();
                const cooldown = this.isPlayer ? 0.16 : 0.65;
                if (now - this.lastShot < cooldown || this.energy < 8) return;
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
            takeDamage(amount, attacker) {
                if (this.invulnTimer > 0) return;
                const actualDamage = this.isPlayer ? Math.min(amount, 6) : amount;
                this.hp -= actualDamage;
                createParticles(this.pos.clone().add(new THREE.Vector3(0,1,0)), this.isPlayer ? 0x00f0ff : 0xff0055, 6, 5);
                
                if (this.isPlayer) {
                    sound.playHit();
                    const flash = document.getElementById('damage-flash');
                    flash.style.opacity = 0.65;
                    setTimeout(() => flash.style.opacity = 0, 120);
                }

                if (this.hp <= 0) {
                    this.die(attacker);
                }
            }

            die(attacker) {
                sound.playExplosion();
                createParticles(this.pos.clone().add(new THREE.Vector3(0,1,0)), 0xffaa00, 18, 14);
                createParticles(this.pos.clone().add(new THREE.Vector3(0,1,0)), 0x00f0ff, 12, 10);

                if (this.isPlayer) {
                    // Reboot shields in-place without jarring teleportation across the map!
                    addKillFeed("LIDAR REBOOT: Emergency Shield Recharge Activated!");
                    this.hp = 100;
                    this.energy = 100;
                    this.invulnTimer = 3.5;
                    this.speed *= 0.3;
                } else {
                    if (attacker && attacker.isPlayer) {
                        score++;
                        document.getElementById('score-val').innerText = score;
                        addKillFeed(`Tagged Rogue Waymo #${Math.floor(Math.random()*900+100)}!`);
                        player.hp = Math.min(100, player.hp + 30);
                    } else {
                        const now = clock.getElapsedTime();
                        if (now - lastAiKillFeedTime > 6.5) {
                            lastAiKillFeedTime = now;
                            addKillFeed(`Fleet Telemetry: Autonomous Waymo tagged rival unit`);
                        }
                    }
                    this.respawn();
                }
            }

            respawn() {
                this.hp = 100;
                this.energy = 100;
                this.speed = 0;
                // Find valid street position
                const gx = Math.floor(Math.random() * (GRID_STEPS - 3)) + 2;
                const gz = Math.floor(Math.random() * (GRID_STEPS - 3)) + 2;
                this.pos.x = -OFFSET + gx * CELL_SIZE + STREET_WIDTH / 2;
                this.pos.z = -OFFSET + gz * CELL_SIZE + STREET_WIDTH / 2;
                if (this.pos.x > 320) this.pos.x = 0; // Keep out of bay
                this.pos.y = getElevation(this.pos.x, this.pos.z);
            }
>>>>>>> REPLACE
<<<<<<< SEARCH
                        if (dx*dx + dz*dz < 6.5 && Math.abs(dy) < 2.0) {
                            t.takeDamage(25, this.owner);
                            return false;
                        }
                    }
                }
=======
                        if (dx*dx + dz*dz < 7.5 && Math.abs(dy) < 2.2) {
                            t.takeDamage(this.owner.isPlayer ? 34 : 5, this.owner);
                            return false;
                        }
                    }
                }
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
        // --- PARTICLE SYSTEM ---
        function createParticles(pos, color, count, speed) {
            if (particles.length > 120) return;
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
                particles.push({ mesh, vel, life: 0.45 + Math.random() * 0.35 });
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
=======
        // --- WORLD GENERATION (Merged Geometry for 60 FPS & Slope-Conformed Foundations) ---
        function createConformedBox(w, h, d, cx, cz, topY) {
            // Creates a building box whose bottom vertices conform smoothly to the terrain slope
            // so buildings never float AND never need protruding gray concrete wedges!
            const geo = new THREE.BoxGeometry(w, h, d, 2, 1, 2);
            const pos = geo.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const vx = pos.getX(i);
                const vy = pos.getY(i);
                const vz = pos.getZ(i);
                if (vy > 0) {
                    pos.setY(i, topY);
                } else {
                    const groundAtVertex = getElevation(cx + vx, cz + vz);
                    pos.setY(i, groundAtVertex - 2.0);
                }
                pos.setX(i, cx + vx);
                pos.setZ(i, cz + vz);
            }
            geo.computeVertexNormals();
            return geo;
        }

        function buildSanFrancisco() {
            // 1. Terrain (Continuous Road Grid, Sidewalks & Hills)
            const terrainGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 200, 200);
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
            scene.add(terrain);

            // 2. San Francisco Bay (Water)
            const waterGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE);
            waterGeo.rotateX(-Math.PI / 2);
            const waterMat = new THREE.MeshStandardMaterial({
                color: 0x1a4d6e,
                roughness: 0.15,
                metalness: 0.75
            });
            const water = new THREE.Mesh(waterGeo, waterMat);
            water.position.y = -2;
            scene.add(water);

            // 3. Bay Bridge Steel Truss & Construction Crane (matching SF reference photos)
            buildBridge();

            // 4. City Blocks & Landmarks (Batched by Material for 60 FPS!)
            const officeColors = ['#a65e4e', '#b86b52', '#d2cabf', '#9ba4ad', '#c8b8a6'];
            const bMats = officeColors.map(c => new THREE.MeshStandardMaterial({
                map: createBuildingTexture(c, 'office'),
                roughness: 0.45,
                metalness: 0.15
            }));
            const bGeos = officeColors.map(() => []);

            const vicColors = ['#e8d8c8', '#c8d8e4', '#dce4d0', '#f0dcd4', '#dcd4e8', '#e6c89c'];
            const vicMats = vicColors.map(c => new THREE.MeshStandardMaterial({
                map: createBuildingTexture(c, 'victorian'),
                roughness: 0.55
            }));
            const vicGeos = vicColors.map(() => []);

            const trimMat = new THREE.MeshStandardMaterial({ color: 0xf0eee9, roughness: 0.5 });
            const trimGeos = [];

            // Geometry collectors for street props (poles, signals, palm trees, overhead trolley wires)
            const poleGeos = [];
            const signalBoxGeos = [];
            const greenBulbGeos = [];
            const redBulbGeos = [];
            const signYellowGeos = [];
            const trunkGeos = [];
            const frondGeos = [];
            const wireGeos = [];

            for (let gx = 0; gx < GRID_STEPS; gx++) {
                for (let gz = 0; gz < GRID_STEPS; gz++) {
                    const cellX = -OFFSET + gx * CELL_SIZE;
                    const cellZ = -OFFSET + gz * CELL_SIZE;
                    
                    const bx = cellX + STREET_WIDTH + BLOCK_SIZE / 2;
                    const bz = cellZ + STREET_WIDTH + BLOCK_SIZE / 2;

                    if (bx > 380) continue;

                    const groundY = getElevation(bx, bz);

                    // Unified single block collider per city block with comfortable sidewalk margin
                    const blockMargin = 6;
                    const blockHalf = (BLOCK_SIZE - blockMargin * 2) / 2;
                    let blockMaxY = groundY + 45;

                    // Special Landmark: Transamerica Pyramid
                    if (gx === 7 && gz === 6) {
                        const pyrH = 180;
                        const pyrGeo = new THREE.ConeGeometry(27, pyrH, 4);
                        pyrGeo.rotateY(Math.PI / 4);
                        const pyrMat = new THREE.MeshStandardMaterial({ 
                            color: 0xf2f0eb, roughness: 0.35, map: bMats[2].map 
                        });
                        const pyr = new THREE.Mesh(pyrGeo, pyrMat);
                        pyr.position.set(bx, groundY + pyrH/2 - 10, bz);
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
                        collectStreetProps(cellX + STREET_WIDTH, cellZ + STREET_WIDTH, gx, gz, poleGeos, signalBoxGeos, greenBulbGeos, redBulbGeos, signYellowGeos, trunkGeos, frondGeos, wireGeos);
                        continue;
                    }

                    // Special Landmark: Coit Tower (on top of hill)
                    if (gx === 4 && gz === 7) {
                        const coitH = 75;
                        const coitGeo = new THREE.CylinderGeometry(10, 12, coitH, 20);
                        const coitMat = new THREE.MeshStandardMaterial({ color: 0xf2efe9, roughness: 0.5 });
                        const coit = new THREE.Mesh(coitGeo, coitMat);
                        coit.position.set(bx, groundY + coitH/2 - 10, bz);
                        scene.add(coit);
                        buildings.push({ minX: bx - blockHalf, maxX: bx + blockHalf, minZ: bz - blockHalf, maxZ: bz + blockHalf, maxY: groundY + coitH });
                        collectStreetProps(cellX + STREET_WIDTH, cellZ + STREET_WIDTH, gx, gz, poleGeos, signalBoxGeos, greenBulbGeos, redBulbGeos, signYellowGeos, trunkGeos, frondGeos, wireGeos);
                        continue;
                    }

                    const isDowntown = gx >= 5 && gz >= 3 && gz <= 9;

                    if (isDowntown) {
                        const w = BLOCK_SIZE - 12;
                        const d = BLOCK_SIZE - 12;
                        const h = 42 + ((gx * 17 + gz * 31) % 62);
                        const topY = groundY + h;
                        const matIdx = (gx + gz) % bMats.length;
                        
                        bGeos[matIdx].push(createConformedBox(w, h, d, bx, bz, topY));

                        const corniceGeo = new THREE.BoxGeometry(w + 1.5, 2.2, d + 1.5);
                        corniceGeo.translate(bx, topY + 0.8, bz);
                        trimGeos.push(corniceGeo);

                        if (gx === 6 && gz === 5) {
                            buildConstructionCrane(bx - w/2 + 6, groundY, bz - d/2 + 6);
                        }

                        blockMaxY = topY + 4;
                    } else {
                        // SF Victorian / Edwardian Row Houses with Bay Windows & Cornices
                        const subSize = (BLOCK_SIZE - 14) / 2;
                        for (let sx = -0.5; sx <= 0.5; sx += 1) {
                            for (let sz = -0.5; sz <= 0.5; sz += 1) {
                                const hx = bx + sx * subSize;
                                const hz = bz + sz * subSize;
                                const hy = getElevation(hx, hz);
                                const hh = 18 + ((Math.abs(gx * 7 + gz * 13 + sx * 4 + sz * 2)) % 14);
                                const topY = hy + hh;
                                const vIdx = Math.floor(Math.abs(gx * 3 + gz * 5 + sx * 2 + sz)) % vicMats.length;

                                vicGeos[vIdx].push(createConformedBox(subSize - 0.8, hh, subSize - 0.8, hx, hz, topY));

                                // Projecting SF Bay Windows on outward-facing street sides
                                const bayZ = hz + Math.sign(sz) * (subSize / 2 + 0.6);
                                vicGeos[vIdx].push(createConformedBox(5.5, hh - 4, 3.2, hx, bayZ, topY - 1.5));

                                // Ornate flat roof cornice
                                const cGeo = new THREE.BoxGeometry(subSize + 0.6, 1.8, subSize + 0.6);
                                cGeo.translate(hx, topY + 0.8, hz);
                                trimGeos.push(cGeo);

                                blockMaxY = Math.max(blockMaxY, topY + 5);
                            }
                        }
                    }

                    buildings.push({
                        minX: bx - blockHalf,
                        maxX: bx + blockHalf,
                        minZ: bz - blockHalf,
                        maxZ: bz + blockHalf,
                        maxY: blockMaxY
                    });

                    collectStreetProps(cellX + STREET_WIDTH, cellZ + STREET_WIDTH, gx, gz, poleGeos, signalBoxGeos, greenBulbGeos, redBulbGeos, signYellowGeos, trunkGeos, frondGeos, wireGeos);
                }
            }

            // Merge all collected city building & prop geometries into single draw calls!
            bGeos.forEach((arr, idx) => {
                if (arr.length > 0) {
                    const merged = BufferGeometryUtils.mergeGeometries(arr, false);
                    scene.add(new THREE.Mesh(merged, bMats[idx]));
                }
            });
            vicGeos.forEach((arr, idx) => {
                if (arr.length > 0) {
                    const merged = BufferGeometryUtils.mergeGeometries(arr, false);
                    scene.add(new THREE.Mesh(merged, vicMats[idx]));
                }
            });
            if (trimGeos.length > 0) {
                scene.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(trimGeos, false), trimMat));
            }
            if (poleGeos.length > 0) {
                const poleMat = new THREE.MeshStandardMaterial({ color: 0x555b62, metalness: 0.5, roughness: 0.4 });
                scene.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(poleGeos, false), poleMat));
            }
            if (signalBoxGeos.length > 0) {
                const signalBoxMat = new THREE.MeshStandardMaterial({ color: 0x22262a });
                scene.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(signalBoxGeos, false), signalBoxMat));
            }
            if (greenBulbGeos.length > 0) {
                scene.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(greenBulbGeos, false), new THREE.MeshBasicMaterial({ color: 0x00ff66 })));
            }
            if (redBulbGeos.length > 0) {
                scene.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(redBulbGeos, false), new THREE.MeshBasicMaterial({ color: 0xff2222 })));
            }
            if (signYellowGeos.length > 0) {
                const signYellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4 });
                scene.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(signYellowGeos, false), signYellowMat));
            }
            if (trunkGeos.length > 0) {
                const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6e5540, roughness: 0.9 });
                scene.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(trunkGeos, false), trunkMat));
            }
            if (frondGeos.length > 0) {
                const frondMat = new THREE.MeshStandardMaterial({ color: 0x3b6e38, roughness: 0.6 });
                scene.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(frondGeos, false), frondMat));
            }
            if (wireGeos.length > 0) {
                const wireMat = new THREE.MeshBasicMaterial({ color: 0x2a2e33 });
                scene.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(wireGeos, false), wireMat));
            }
        }

        function buildConstructionCrane(x, y, z) {
            const craneGroup = new THREE.Group();
            const redMat = new THREE.MeshStandardMaterial({ color: 0xc82820, roughness: 0.4, metalness: 0.4 });
            const orangeBarrierMat = new THREE.MeshStandardMaterial({ color: 0xf05a22, roughness: 0.5 });

            const mastGeo = new THREE.BoxGeometry(3.2, 115, 3.2);
            const mast = new THREE.Mesh(mastGeo, redMat);
            mast.position.set(x, y + 55, z);
            craneGroup.add(mast);

            const boomGeo = new THREE.BoxGeometry(38, 2.2, 2.2);
            const boom = new THREE.Mesh(boomGeo, redMat);
            boom.position.set(x + 14, y + 112, z);
            boom.rotation.z = 0.25;
            craneGroup.add(boom);

            for (let i = 0; i < 4; i++) {
                const bar = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.1, 0.7), orangeBarrierMat);
                bar.position.set(x - 4 + i * 3.5, y + 0.6, z - 6);
                craneGroup.add(bar);
            }
            scene.add(craneGroup);
        }

        function collectStreetProps(x, z, gx, gz, poleGeos, signalBoxGeos, greenBulbGeos, redBulbGeos, signYellowGeos, trunkGeos, frondGeos, wireGeos) {
            if (x > 380) return;
            const y = getElevation(x, z);

            // SF traffic signal pole with mast arm
            const pole = new THREE.CylinderGeometry(0.14, 0.18, 8.5, 6);
            pole.translate(x + 2.2, y + 4.25, z + 2.2);
            poleGeos.push(pole);

            const mastArm = new THREE.CylinderGeometry(0.08, 0.12, 6.5, 6);
            mastArm.rotateZ(Math.PI / 2);
            mastArm.translate(x - 1.0, y + 8.0, z + 2.2);
            poleGeos.push(mastArm);

            // Overhead SF Muni Trolley Wire spanning across the street intersection (matching reference photos)
            const wire = new THREE.BoxGeometry(STREET_WIDTH + 6, 0.05, 0.05);
            wire.translate(x - STREET_WIDTH / 2 + 2, y + 8.4, z + 2.2);
            wireGeos.push(wire);

            const sigHead = new THREE.BoxGeometry(0.45, 1.3, 0.45);
            sigHead.translate(x - 3.2, y + 7.7, z + 2.2);
            signalBoxGeos.push(sigHead);

            const isGreen = (gx + gz) % 2 === 0;
            const bulb = new THREE.BoxGeometry(0.24, 0.24, 0.24);
            bulb.translate(x - 3.2, y + (isGreen ? 7.35 : 8.05), z + 2.45);
            if (isGreen) greenBulbGeos.push(bulb);
            else redBulbGeos.push(bulb);

            // Yellow diamond street sign on pole (matching reference photo)
            const diamond = new THREE.BoxGeometry(0.9, 0.9, 0.08);
            diamond.rotateZ(Math.PI / 4);
            diamond.translate(x + 2.2, y + 5.2, z + 2.32);
            signYellowGeos.push(diamond);

            // SF Canary Island Palm Trees along avenues
            if ((gx + gz) % 2 === 0) {
                const px = x + 14;
                const pz = z + 2.5;
                const py = getElevation(px, pz);
                const trunk = new THREE.CylinderGeometry(0.35, 0.55, 11, 6);
                trunk.translate(px, py + 5.5, pz);
                trunkGeos.push(trunk);

                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const frond = new THREE.BoxGeometry(0.6, 0.18, 4.2);
                    frond.rotateX(0.45);
                    frond.rotateY(angle);
                    frond.translate(px + Math.sin(angle) * 1.8, py + 11.0, pz + Math.cos(angle) * 1.8);
                    frondGeos.push(frond);
                }
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
=======
            renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
            renderer.shadowMap.enabled = false;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.08;
            container.appendChild(renderer.domElement);

            // Crisp SF Daylight Lighting
            const ambientLight = new THREE.HemisphereLight(0xe6f2ff, 0x6c7278, 1.75);
            scene.add(ambientLight);

            const sunLight = new THREE.DirectionalLight(0xfff6e8, 2.0);
            sunLight.position.set(-260, 340, -180);
            scene.add(sunLight);
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function addKillFeed(text) {
            const feed = document.getElementById('kill-feed');
            while (feed.children.length >= 3) {
                feed.removeChild(feed.firstChild);
            }
            const item = document.createElement('div');
            item.className = 'feed-item';
            item.innerText = text;
            feed.appendChild(item);
            setTimeout(() => {
                if (feed.contains(item)) feed.removeChild(item);
            }, 3500);
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
            composer.render();
        }
=======
            renderer.render(scene, camera);
        }
>>>>>>> REPLACE