<<<<<<< SEARCH
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
=======
            // Lower rocker / battery skateboard chassis
            const underbody = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.22, 4.58), darkMat);
            underbody.position.set(0, 0.36, 0);
            group.add(underbody);

            // Jaguar I-PACE main body with Waymo door branding on left & right sides
            const bodyMaterials = [doorMat, doorMat, bodyMat, darkMat, bodyMat, bodyMat];
            const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.66, 4.60), bodyMaterials);
            chassis.position.set(0, 0.75, 0);
            chassis.castShadow = isPlayer;
            group.add(chassis);

            // Sculpted wheel arches / muscular rear haunches
            const archGeo = new THREE.BoxGeometry(2.22, 0.34, 1.05);
            const frontArch = new THREE.Mesh(archGeo, bodyMat);
            frontArch.position.set(0, 0.66, 1.48);
            const rearArch = new THREE.Mesh(archGeo, bodyMat);
            rearArch.position.set(0, 0.74, -1.48);
            group.add(frontArch, rearArch);

            // Sloped aerodynamic hood & front grille
            const hood = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.22, 1.35), bodyMat);
            hood.position.set(0, 1.06, 1.52);
            hood.rotation.x = 0.16;
            group.add(hood);

            const grille = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.34, 0.08), darkMat);
            grille.position.set(0, 0.76, 2.31);
            group.add(grille);

            // Continuous Jaguar I-PACE coupe-SUV greenhouse & smoothly sloped fastback roofline
            const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.52, 1.75), glassMat);
            cabin.position.set(0, 1.34, 0.12);
            group.add(cabin);

            const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.52, 1.05), glassMat);
            windshield.position.set(0, 1.26, 0.98);
            windshield.rotation.x = -0.54;
            group.add(windshield);

            // Smoothly raked coupe rear hatch (eliminates notchback step)
            const fastbackGlass = new THREE.Mesh(new THREE.BoxGeometry(1.70, 0.46, 1.65), glassMat);
            fastbackGlass.position.set(0, 1.28, -1.18);
            fastbackGlass.rotation.x = 0.34;
            group.add(fastbackGlass);

            // White sculpted C-pillars / cantrails flowing into the tailgate
            [-0.84, 0.84].forEach(sideX => {
                const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.14, 1.72), bodyMat);
                pillar.position.set(sideX, 1.44, -1.16);
                pillar.rotation.x = 0.34;
                group.add(pillar);
            });

            // Smoothly arched roof crown & rear I-PACE upper tailgate wing
            const roof = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.09, 1.85), bodyMat);
            roof.position.set(0, 1.62, 0.08);
            group.add(roof);

            const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.07, 0.38), bodyMat);
            spoiler.position.set(0, 1.36, -2.02);
            spoiler.rotation.x = 0.08;
            group.add(spoiler);

            // Kammback truncated rear tail & lower sport diffuser
            const rearTail = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.56, 0.32), bodyMat);
            rearTail.position.set(0, 0.96, -2.18);
            group.add(rearTail);

            const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.22, 0.16), darkMat);
            diffuser.position.set(0, 0.52, -2.26);
            group.add(diffuser);
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
                this.invulnTimer = isPlayer ? 2.5 : 0;

                // AI specifics
                this.aiState = 'wander';
                this.targetAngle = this.angle;
                this.aiTimer = 0;
            }

            update(dt) {
                // Energy & Player shield regeneration
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
                // Multi-probe lookahead so AI stays cleanly inside street corridors
                const lookAheadDist = 15;
                const lookX = this.pos.x + Math.sin(this.angle) * lookAheadDist;
                const lookZ = this.pos.z + Math.cos(this.angle) * lookAheadDist;
                if (this.checkBuildingCollision(lookX, lookZ)) {
                    // Find open cardinal road direction
                    const dirs = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
                    for (let dAngle of dirs) {
                        const tx = this.pos.x + Math.sin(dAngle) * 18;
                        const tz = this.pos.z + Math.cos(dAngle) * 18;
                        if (!this.checkBuildingCollision(tx, tz)) {
                            this.targetAngle = dAngle;
                            break;
                        }
                    }
                    this.speed *= 0.75;
                    this.aiTimer = 1.5;
                }

                // Steer towards targetAngle
                const diff = this.normalizeAngle(this.targetAngle - this.angle);
                this.angle += Math.sign(diff) * Math.min(Math.abs(diff), this.handling * 1.4 * dt);

                this.speed += this.accel * 0.8 * dt;
                this.speed = Math.min(this.speed, this.maxSpeed);
            }
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
=======
            takeDamage(amount, attacker) {
                if (this.invulnTimer > 0) return;
                const finalDamage = this.isPlayer ? amount * 0.28 : amount;
                this.hp -= finalDamage;
                createParticles(this.pos.clone().add(new THREE.Vector3(0,1,0)), this.isPlayer ? 0x00f0ff : 0xff0055, 8, 5);
                
                if (this.isPlayer) {
                    sound.playHit();
                    const flash = document.getElementById('damage-flash');
                    flash.style.opacity = 0.7;
                    setTimeout(() => flash.style.opacity = 0, 140);
                }

                if (this.hp <= 0) {
                    this.die(attacker);
                }
            }

            die(attacker) {
                sound.playExplosion();
                createParticles(this.pos.clone().add(new THREE.Vector3(0,1,0)), 0xffaa00, 25, 14);
                createParticles(this.pos.clone().add(new THREE.Vector3(0,1,0)), 0x00f0ff, 15, 10);

                if (this.isPlayer) {
                    addKillFeed("LIDAR REBOOT: Shield recharged in place!");
                    // Reboot in-place with brief shield invulnerability instead of jarring teleport
                    this.hp = 100;
                    this.energy = 100;
                    this.invulnTimer = 3.0;
                    this.speed *= 0.3;
                } else {
                    if (attacker && attacker.isPlayer) {
                        score++;
                        document.getElementById('score-val').innerText = score;
                        addKillFeed(`Tagged Rogue Waymo #${Math.floor(Math.random()*900+100)}!`);
                        // Heal player on kill
                        player.hp = Math.min(100, player.hp + 35);
                    }
                    this.respawn();
                }
            }
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
                    // Unified single block collider per city block so cars never wedge between sub-buildings
                    // (No flat-topped sidewalk plinth box, which previously protruded as giant gray wedges on hills!)
                    const blockMargin = 5;
                    const blockHalf = (BLOCK_SIZE - blockMargin * 2) / 2;
                    let blockMaxY = groundY + 45;
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
                    if (isDowntown) {
                        const w = BLOCK_SIZE - 14;
                        const d = BLOCK_SIZE - 14;
                        const h = 42 + ((gx * 17 + gz * 31) % 65);
                        const corners = [
                            getElevation(bx - w/2, bz - d/2),
                            getElevation(bx + w/2, bz - d/2),
                            getElevation(bx - w/2, bz + d/2),
                            getElevation(bx + w/2, bz + d/2)
                        ];
                        const minCornerY = Math.min(...corners) - 4;
                        const maxCornerY = Math.max(...corners);
                        const totalH = (maxCornerY + h) - minCornerY;
                        
                        const bGeo = new THREE.BoxGeometry(w, totalH, d);
                        const tex = bTextures[(gx + gz) % bTextures.length];
                        const bMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45, metalness: 0.15 });
                        
                        const bMesh = new THREE.Mesh(bGeo, bMat);
                        bMesh.position.set(bx, minCornerY + totalH / 2, bz);
                        scene.add(bMesh);

                        // Roof cornice
                        const cornice = new THREE.Mesh(new THREE.BoxGeometry(w + 1.5, 2.2, d + 1.5), trimMat);
                        cornice.position.set(bx, maxCornerY + h + 0.5, bz);
                        scene.add(cornice);

                        // Red lattice construction crane next to SoMa brick building (like reference photos!)
                        if (gx === 6 && gz === 5) {
                            buildConstructionCrane(bx - w/2 + 6, groundY, bz - d/2 + 6);
                        }

                        blockMaxY = maxCornerY + h + 4;
                    } else {
                        // SF Victorian / Edwardian Row Houses with Bay Windows & Cornices conforming cleanly to hill slopes
                        const subSize = (BLOCK_SIZE - 16) / 2;
                        for (let sx = -0.5; sx <= 0.5; sx += 1) {
                            for (let sz = -0.5; sz <= 0.5; sz += 1) {
                                const hx = bx + sx * subSize;
                                const hz = bz + sz * subSize;
                                const hy = getElevation(hx, hz);
                                const hh = 18 + ((Math.abs(gx * 7 + gz * 13 + sx * 4 + sz * 2)) % 14);
                                const baseDepth = 16;

                                const hGeo = new THREE.BoxGeometry(subSize - 0.8, hh + baseDepth, subSize - 0.8);
                                const vTex = vicTextures[Math.floor(Math.abs(gx * 3 + gz * 5 + sx * 2 + sz)) % vicTextures.length];
                                const hMat = new THREE.MeshStandardMaterial({ 
                                    map: vTex,
                                    roughness: 0.55 
                                });
                                const hMesh = new THREE.Mesh(hGeo, hMat);
                                hMesh.position.set(hx, hy + (hh - baseDepth) / 2, hz);
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
            renderer.setPixelRatio(1);
            renderer.shadowMap.enabled = false;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.08;
            container.appendChild(renderer.domElement);

            // Crisp SF Daylight Lighting (optimized for 60 FPS)
            const ambientLight = new THREE.HemisphereLight(0xe6f2ff, 0x70757a, 1.75);
            scene.add(ambientLight);

            const sunLight = new THREE.DirectionalLight(0xfff6e8, 2.1);
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
=======
        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
            composer.render();
        }
=======
            renderer.render(scene, camera);
        }
>>>>>>> REPLACE