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
            const underbody = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.24, 4.52), darkMat);
            underbody.position.set(0, 0.36, 0);
            group.add(underbody);

            // Jaguar I-PACE main body with Waymo door branding on left & right sides
            const bodyMaterials = [doorMat, doorMat, bodyMat, darkMat, bodyMat, bodyMat];
            const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.66, 4.58), bodyMaterials);
            chassis.position.set(0, 0.76, 0);
            chassis.castShadow = true;
            group.add(chassis);

            // Sculpted wheel arches / haunches
            const archGeo = new THREE.BoxGeometry(2.18, 0.30, 1.05);
            const frontArch = new THREE.Mesh(archGeo, bodyMat);
            frontArch.position.set(0, 0.66, 1.48);
            const rearArch = new THREE.Mesh(archGeo, bodyMat);
            rearArch.position.set(0, 0.74, -1.45);
            group.add(frontArch, rearArch);

            // Sloped aerodynamic hood & front grille
            const hood = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.18, 1.35), bodyMat);
            hood.position.set(0, 1.07, 1.52);
            hood.rotation.x = 0.16;
            group.add(hood);

            const grille = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.34, 0.08), darkMat);
            grille.position.set(0, 0.76, 2.30);
            group.add(grille);

            // Continuous Jaguar I-PACE coupe-SUV greenhouse & fastback roofline
            const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.50, 1.85), glassMat);
            cabin.position.set(0, 1.32, 0.05);
            group.add(cabin);

            const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.70, 0.14, 1.15), glassMat);
            windshield.position.set(0, 1.34, 1.12);
            windshield.rotation.x = 0.46;
            group.add(windshield);

            // Smooth sloped coupe rear hatchback glass & C-pillars (no boxy step)
            const fastbackGlass = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.14, 1.48), glassMat);
            fastbackGlass.position.set(0, 1.34, -1.35);
            fastbackGlass.rotation.x = -0.36;
            group.add(fastbackGlass);

            const cPillarGeo = new THREE.BoxGeometry(0.14, 0.18, 1.52);
            [-0.82, 0.82].forEach(px => {
                const pillar = new THREE.Mesh(cPillarGeo, bodyMat);
                pillar.position.set(px, 1.35, -1.35);
                pillar.rotation.x = -0.36;
                group.add(pillar);
            });

            // White roof crown & integrated rear I-PACE lip spoiler
            const roof = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.10, 1.75), bodyMat);
            roof.position.set(0, 1.60, 0.02);
            group.add(roof);

            const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.07, 0.34), bodyMat);
            spoiler.position.set(0, 1.16, -2.08);
            spoiler.rotation.x = -0.08;
            group.add(spoiler);

            // Kammback truncated rear tail & diffuser
            const rearTail = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.36, 0.24), bodyMat);
            rearTail.position.set(0, 0.96, -2.20);
            group.add(rearTail);
>>>>>>> REPLACE
<<<<<<< SEARCH
            // Energy regen
            update(dt) {
                // Energy regen
                this.energy = Math.min(100, this.energy + 25 * dt);

                if (this.isPlayer) {
                    this.handlePlayerInput(dt);
                } else {
                    this.handleAI(dt);
                }
=======
            update(dt) {
                // Energy & Player LIDAR armor regen
                this.energy = Math.min(100, this.energy + 28 * dt);
                if (this.isPlayer) {
                    this.hp = Math.min(100, this.hp + 6 * dt);
                    this.handlePlayerInput(dt);
                } else {
                    this.handleAI(dt);
                }
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
                if (this.isPlayer) {
                    addKillFeed("SHIELD REBOOT: Emergency LIDAR Recharge Engaged!");
                    // Reboot shields in-place instead of disorienting cross-map teleport
                    this.hp = 100;
                    this.energy = 100;
                    this.speed *= 0.3;
                } else {
                    if (attacker && attacker.isPlayer) {
                        score++;
                        document.getElementById('score-val').innerText = score;
                        addKillFeed(`Tagged Rogue Waymo #${Math.floor(Math.random()*900+100)}!`);
                        // Heal player on kill
                        player.hp = Math.min(100, player.hp + 35);
                    } else {
                        const now = clock.getElapsedTime();
                        if (!window.__lastBotFeed || now - window.__lastBotFeed > 6.0) {
                            window.__lastBotFeed = now;
                            addKillFeed(`Fleet Update: Rival Waymo unit tagged in sector`);
                        }
                    }
                    this.respawn();
                }
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
                    // Check vehicle collision
                    for (let t of targets) {
                        if (!t) continue;
                        const dx = this.pos.x - t.pos.x;
                        const dz = this.pos.z - t.pos.z;
                        const dy = this.pos.y - (t.pos.y + 1.1);
                        if (dx*dx + dz*dz < 6.5 && Math.abs(dy) < 2.0) {
                            const dmg = this.owner.isPlayer ? 34 : (t.isPlayer ? 7 : 25);
                            t.takeDamage(dmg, this.owner);
                            return false;
                        }
                    }
>>>>>>> REPLACE
<<<<<<< SEARCH
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
=======
                    const groundY = getElevation(bx, bz);

                    // Unified single block collider per city block so cars never wedge between sub-buildings
                    const blockMargin = 6;
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
=======
                    if (isDowntown) {
                        const w = BLOCK_SIZE - 12;
                        const d = BLOCK_SIZE - 12;
                        const h = 42 + ((gx * 17 + gz * 31) % 65);
                        // Sample lowest corner elevation so building facade extends cleanly into sloped terrain without gray wedges
                        const minCornerY = Math.min(
                            getElevation(bx - w/2, bz - d/2),
                            getElevation(bx + w/2, bz - d/2),
                            getElevation(bx - w/2, bz + d/2),
                            getElevation(bx + w/2, bz + d/2)
                        );
                        const sink = (groundY - minCornerY) + 4;
                        
                        const bGeo = new THREE.BoxGeometry(w, h + sink, d);
                        const tex = bTextures[(gx + gz) % bTextures.length];
                        const bMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45, metalness: 0.15 });
                        
                        const bMesh = new THREE.Mesh(bGeo, bMat);
                        bMesh.position.set(bx, groundY + (h - sink) / 2, bz);
                        bMesh.castShadow = true;
                        bMesh.receiveShadow = true;
                        scene.add(bMesh);
>>>>>>> REPLACE

<<<<<<< SEARCH
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
=======
                                const hx = bx + sx * subSize;
                                const hz = bz + sz * subSize;
                                const hy = getElevation(hx, hz);
                                const hh = 18 + ((Math.abs(gx * 7 + gz * 13 + sx * 4 + sz * 2)) % 14);
                                const hs = subSize - 0.8;
                                const minHY = Math.min(
                                    getElevation(hx - hs/2, hz - hs/2),
                                    getElevation(hx + hs/2, hz - hs/2),
                                    getElevation(hx - hs/2, hz + hs/2),
                                    getElevation(hx + hs/2, hz + hs/2)
                                );
                                const hSink = (hy - minHY) + 3;

                                const hGeo = new THREE.BoxGeometry(hs, hh + hSink, hs);
                                const vTex = vicTextures[Math.floor(Math.abs(gx * 3 + gz * 5 + sx * 2 + sz)) % vicTextures.length];
                                const hMat = new THREE.MeshStandardMaterial({ 
                                    map: vTex,
                                    roughness: 0.55 
                                });
                                const hMesh = new THREE.Mesh(hGeo, hMat);
                                hMesh.position.set(hx, hy + (hh - hSink) / 2, hz);
                                hMesh.receiveShadow = true;
                                scene.add(hMesh);
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
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFShadowMap;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.08;
            container.appendChild(renderer.domElement);

            // Crisp SF Daylight Lighting
            const ambientLight = new THREE.HemisphereLight(0xe6f2ff, 0x70757a, 1.65);
            scene.add(ambientLight);

            const sunLight = new THREE.DirectionalLight(0xfff6e8, 2.2);
            sunLight.position.set(-260, 340, -180);
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 1024;
            sunLight.shadow.mapSize.height = 1024;
            sunLight.shadow.camera.near = 10;
            sunLight.shadow.camera.far = 900;
            const d = 360;
            sunLight.shadow.camera.left = -d;
            sunLight.shadow.camera.right = d;
            sunLight.shadow.camera.top = d;
            sunLight.shadow.camera.bottom = -d;
            sunLight.shadow.bias = -0.0008;
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