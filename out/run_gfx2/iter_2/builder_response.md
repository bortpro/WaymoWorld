An analysis of the critic report and telemetry identifies the root causes of each issue:
1. **Severe bloom, overexposure & white fog**: High directional/ambient/environment intensities combined with bright procedural facade colors and near fog caused building facades and the horizon to clip to white.
2. **Oversized 3D enemy nameplates**: World-space `THREE.Sprite` nameplates used default perspective `sizeAttenuation: true` without clamping, ballooning to fill the screen when an opponent passed close by.
3. **Framerate drops (16–20 FPS)**: Creating 500+ individual shadow-casting building `Mesh` objects, per-frame DOM `createElement` allocations in `updateHUD()`, and 115k terrain triangles bottlenecked the render loop.
4. **Floating Lombard planters & missing skyline landmarks in view**: The Lombard planters were placed on the active `x = -85` traffic lane without conforming to hill slope, and major skyline towers were outside the main camera corridor.

Here are the focused edits to fix all of these issues while preserving the multiplayer contract and deterministic collision grid.

<<<<<<< SEARCH
        function createFacadeTexture(baseColor, trimColor, style = 'victorian') {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, 256, 512);

            if (style === 'victorian') {
                // Horizontal clapboard siding lines
                ctx.fillStyle = 'rgba(0,0,0,0.07)';
                for (let y = 0; y < 512; y += 6) {
                    ctx.fillRect(0, y, 256, 1.5);
                }
                // Cornice & floor belt courses
                ctx.fillStyle = trimColor;
                ctx.fillRect(0, 0, 256, 18);
                ctx.fillRect(0, 165, 256, 8);
                ctx.fillRect(0, 335, 256, 8);
                ctx.fillRect(0, 480, 256, 32);

                // Tall double-hung Victorian windows with ornate headers
                const rows = 3;
                const cols = 3;
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const wx = 22 + c * 78;
                        const wy = 34 + r * 162;
                        const ww = 46;
                        const wh = 98;
                        // Trim frame
                        ctx.fillStyle = trimColor;
                        ctx.fillRect(wx - 5, wy - 8, ww + 10, wh + 14);
                        // Crown pediment
                        ctx.fillRect(wx - 8, wy - 13, ww + 16, 6);
                        // Glass pane
                        const grad = ctx.createLinearGradient(wx, wy, wx + ww, wy + wh);
                        grad.addColorStop(0, '#3a556a');
                        grad.addColorStop(0.5, '#1e2f3d');
                        grad.addColorStop(1, '#586d7e');
                        ctx.fillStyle = grad;
                        ctx.fillRect(wx, wy, ww, wh);
                        // Warm interior curtain / reflection
                        if (((r + c) % 2) === 0) {
                            ctx.fillStyle = 'rgba(255, 225, 175, 0.25)';
                            ctx.fillRect(wx + 3, wy + 3, ww - 6, wh - 6);
                        }
                        // Sash bar
                        ctx.fillStyle = trimColor;
                        ctx.fillRect(wx, wy + wh / 2 - 2, ww, 4);
                    }
                }
            } else {
                // Downtown modern/brick office grid (like reference photo brick/steel facade)
                ctx.fillStyle = trimColor;
                for (let r = 0; r < 10; r++) {
                    ctx.fillRect(0, r * 51, 256, 6);
                }
                for (let c = 0; c < 4; c++) {
                    ctx.fillRect(c * 64, 0, 8, 512);
                }
                for (let r = 0; r < 10; r++) {
                    for (let c = 0; c < 4; c++) {
                        const wx = c * 64 + 10;
                        const wy = r * 51 + 8;
                        const ww = 48;
                        const wh = 37;
                        const grad = ctx.createLinearGradient(wx, wy, wx, wy + wh);
                        grad.addColorStop(0, '#5a788c');
                        grad.addColorStop(0.6, '#233544');
                        grad.addColorStop(1, '#3b5060');
                        ctx.fillStyle = grad;
                        ctx.fillRect(wx, wy, ww, wh);
                        // Window mullions
                        ctx.fillStyle = 'rgba(220,230,240,0.35)';
                        ctx.fillRect(wx + ww / 2 - 1, wy, 2, wh);
                    }
                }
            }

            const tex = new THREE.CanvasTexture(canvas);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            return tex;
        }
=======
        function createFacadeTexture(baseColor, trimColor, style = 'victorian') {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, 256, 512);

            if (style === 'victorian') {
                // Crisp horizontal clapboard siding with ambient occlusion shadow lines
                for (let y = 0; y < 512; y += 7) {
                    ctx.fillStyle = 'rgba(0,0,0,0.16)';
                    ctx.fillRect(0, y, 256, 2);
                    ctx.fillStyle = 'rgba(255,255,255,0.06)';
                    ctx.fillRect(0, y + 2, 256, 1);
                }
                // Vertical corner pilasters
                ctx.fillStyle = trimColor;
                ctx.fillRect(0, 0, 10, 512);
                ctx.fillRect(246, 0, 10, 512);

                // Cornice, dentil molding & floor belt courses with drop shadows
                ctx.fillStyle = 'rgba(0,0,0,0.32)';
                ctx.fillRect(0, 20, 256, 5);
                ctx.fillRect(0, 173, 256, 4);
                ctx.fillRect(0, 343, 256, 4);
                ctx.fillStyle = trimColor;
                ctx.fillRect(0, 0, 256, 20);
                ctx.fillRect(0, 164, 256, 10);
                ctx.fillRect(0, 334, 256, 10);
                ctx.fillStyle = '#4a5058'; // Dark slate ground-level plinth
                ctx.fillRect(0, 476, 256, 36);

                // Dentil blocks along top cornice
                ctx.fillStyle = 'rgba(0,0,0,0.22)';
                for (let x = 8; x < 256; x += 14) {
                    ctx.fillRect(x, 12, 6, 7);
                }

                // Tall double-hung Victorian windows with recessed dark frames
                const rows = 3;
                const cols = 3;
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const wx = 22 + c * 78;
                        const wy = 36 + r * 158;
                        const ww = 46;
                        const wh = 96;
                        // Drop shadow behind window casing
                        ctx.fillStyle = 'rgba(0,0,0,0.3)';
                        ctx.fillRect(wx - 4, wy - 6, ww + 12, wh + 16);
                        // Trim frame & bracketed crown pediment
                        ctx.fillStyle = trimColor;
                        ctx.fillRect(wx - 5, wy - 8, ww + 10, wh + 14);
                        ctx.fillRect(wx - 9, wy - 14, ww + 18, 6);
                        // Recessed dark window reveal
                        ctx.fillStyle = '#141e28';
                        ctx.fillRect(wx - 1, wy - 1, ww + 2, wh + 2);
                        // Glass pane with rich sky/city reflection
                        const grad = ctx.createLinearGradient(wx, wy, wx + ww, wy + wh);
                        grad.addColorStop(0, '#2c4860');
                        grad.addColorStop(0.5, '#162534');
                        grad.addColorStop(1, '#3b5972');
                        ctx.fillStyle = grad;
                        ctx.fillRect(wx, wy, ww, wh);
                        // Subtle warm interior shade
                        if (((r + c) % 2) === 0) {
                            ctx.fillStyle = 'rgba(235, 200, 145, 0.22)';
                            ctx.fillRect(wx + 4, wy + 4, ww - 8, wh * 0.42);
                        }
                        // Sash bar & vertical mullion
                        ctx.fillStyle = trimColor;
                        ctx.fillRect(wx, wy + wh / 2 - 2, ww, 4);
                    }
                }
            } else {
                // Downtown SF brick & terracotta masonry grid (like Howard St reference photos)
                ctx.fillStyle = 'rgba(0,0,0,0.12)';
                for (let y = 0; y < 512; y += 8) {
                    ctx.fillRect(0, y, 256, 1.5);
                }
                ctx.fillStyle = trimColor;
                for (let r = 0; r < 8; r++) {
                    ctx.fillRect(0, r * 64, 256, 8);
                    ctx.fillStyle = 'rgba(0,0,0,0.25)';
                    ctx.fillRect(0, r * 64 + 8, 256, 3);
                    ctx.fillStyle = trimColor;
                }
                for (let c = 0; c < 4; c++) {
                    ctx.fillRect(c * 64, 0, 10, 512);
                }
                for (let r = 0; r < 8; r++) {
                    for (let c = 0; c < 4; c++) {
                        const wx = c * 64 + 12;
                        const wy = r * 64 + 12;
                        const ww = 44;
                        const wh = 44;
                        ctx.fillStyle = '#18222c';
                        ctx.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);
                        const grad = ctx.createLinearGradient(wx, wy, wx, wy + wh);
                        grad.addColorStop(0, '#3e5c74');
                        grad.addColorStop(0.55, '#1b2c3b');
                        grad.addColorStop(1, '#2d4659');
                        ctx.fillStyle = grad;
                        ctx.fillRect(wx, wy, ww, wh);
                        // Window mullions
                        ctx.fillStyle = trimColor;
                        ctx.fillRect(wx + ww / 2 - 1.5, wy, 3, wh);
                        ctx.fillRect(wx, wy + wh * 0.62, ww, 2.5);
                    }
                }
            }

            const tex = new THREE.CanvasTexture(canvas);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            return tex;
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
        // --- NAME LABELS ---
        function createNameLabel() {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 64;
            const tex = new THREE.CanvasTexture(canvas);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
            sprite.scale.set(6, 1.5, 1);
            sprite.position.y = 3.6;
            sprite.userData.canvas = canvas;
            return sprite;
        }
=======
        // --- NAME LABELS (Clamped screen-space size so labels never blow up when close) ---
        function createNameLabel() {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 64;
            const tex = new THREE.CanvasTexture(canvas);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: tex,
                transparent: true,
                depthWrite: false,
                sizeAttenuation: false
            }));
            sprite.scale.set(0.085, 0.022, 1);
            sprite.position.y = 3.1;
            sprite.userData.canvas = canvas;
            return sprite;
        }
>>>>>>> REPLACE

<<<<<<< SEARCH
                const targetQuat = new THREE.Quaternion().setFromRotationMatrix(rotMatrix);
                this.mesh.quaternion.slerp(targetQuat, 15 * dt);

                this.mesh.userData.turret.rotation.y += 12 * dt;
            }
=======
                const targetQuat = new THREE.Quaternion().setFromRotationMatrix(rotMatrix);
                this.mesh.quaternion.slerp(targetQuat, 15 * dt);

                this.mesh.userData.turret.rotation.y += 12 * dt;

                // Keep nameplate unobtrusive: fade out when very close or very far, and clamp screen scale
                if (this.label && camera) {
                    const dist = this.pos.distanceTo(camera.position);
                    this.label.visible = dist > 7.5 && dist < 165;
                    if (this.label.visible) {
                        const s = THREE.MathUtils.clamp(2.2 / Math.max(22, dist), 0.04, 0.075);
                        this.label.scale.set(s * 3.8, s, 1);
                        this.label.material.opacity = dist < 14 ? (dist - 7.5) / 6.5 : Math.min(1, (165 - dist) / 35);
                    }
                }
            }
>>>>>>> REPLACE
<<<<<<< SEARCH
        // --- PARTICLE SYSTEM ---
        const sharedParticleGeo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
        function createParticles(pos, color, count, speed) {
            const mat = new THREE.MeshBasicMaterial({ color });
            for (let i = 0; i < count; i++) {
                const mesh = new THREE.Mesh(sharedParticleGeo, mat);
                mesh.position.copy(pos);
                const vel = new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    Math.random() * 1.6,
                    (Math.random() - 0.5) * 2
                ).normalize().multiplyScalar(Math.random() * speed + 1.5);
                scene.add(mesh);
                particles.push({ mesh, vel, life: 0.45 + Math.random() * 0.35 });
            }
        }

        function updateParticles(dt) {
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.life -= dt;
                p.vel.y -= 22 * dt;
                p.mesh.position.addScaledVector(p.vel, dt);
                p.mesh.rotation.x += 5 * dt;
                p.mesh.rotation.y += 5 * dt;
                p.mesh.scale.setScalar(Math.max(0.01, p.life * 1.4));
                if (p.life <= 0) {
                    scene.remove(p.mesh);
                    p.mesh.material.dispose();
                    particles.splice(i, 1);
                }
            }
        }
=======
        // --- PARTICLE SYSTEM (Cached materials to avoid per-frame allocations) ---
        const sharedParticleGeo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
        const particleMatCache = new Map();
        function getParticleMat(color) {
            if (!particleMatCache.has(color)) {
                particleMatCache.set(color, new THREE.MeshBasicMaterial({ color }));
            }
            return particleMatCache.get(color);
        }
        function createParticles(pos, color, count, speed) {
            if (particles.length > 120) count = Math.min(count, 4);
            const mat = getParticleMat(color);
            for (let i = 0; i < count; i++) {
                const mesh = new THREE.Mesh(sharedParticleGeo, mat);
                mesh.position.copy(pos);
                const vel = new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    Math.random() * 1.6,
                    (Math.random() - 0.5) * 2
                ).normalize().multiplyScalar(Math.random() * speed + 1.5);
                scene.add(mesh);
                particles.push({ mesh, vel, life: 0.42 + Math.random() * 0.28 });
            }
        }

        function updateParticles(dt) {
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.life -= dt;
                p.vel.y -= 22 * dt;
                p.mesh.position.addScaledVector(p.vel, dt);
                p.mesh.rotation.x += 5 * dt;
                p.mesh.rotation.y += 5 * dt;
                p.mesh.scale.setScalar(Math.max(0.01, p.life * 1.4));
                if (p.life <= 0) {
                    scene.remove(p.mesh);
                    particles.splice(i, 1);
                }
            }
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
        // --- WORLD GENERATION (San Francisco Architecture, Landmarks, Instanced Street Props) ---
        function buildSanFrancisco() {
            // 1. Terrain (SF Hills & Road Grid)
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
                roughness: 0.72,
                metalness: 0.08
            });
            const terrain = new THREE.Mesh(terrainGeo, terrainMat);
            terrain.receiveShadow = true;
            scene.add(terrain);

            // 2. San Francisco Bay Water (Reflective PBR surface)
            const waterGeo = new THREE.PlaneGeometry(WORLD_SIZE * 2.5, WORLD_SIZE * 2.5);
            waterGeo.rotateX(-Math.PI / 2);
            const waterMat = new THREE.MeshPhysicalMaterial({
                color: 0x164c6e,
                roughness: 0.12,
                metalness: 0.85,
                clearcoat: 0.9,
                clearcoatRoughness: 0.15
            });
            const water = new THREE.Mesh(waterGeo, waterMat);
            water.position.y = -2.2;
            scene.add(water);

            // 3. Major San Francisco Landmarks
            buildGoldenGateBridge();
            buildBayBridge();
            buildSutroTower();
            buildFerryBuilding();
            buildLombardStreet();

            // 4. City Blocks (Deterministic RNG order preserved for `buildings` collision array!)
            const downtownFacades = [
                createFacadeTexture('#8c4a3c', '#d8cfc4', 'downtown'), // Warm brick & concrete (like reference photo)
                createFacadeTexture('#9ba6b2', '#cfd6de', 'downtown'), // Limestone & steel
                createFacadeTexture('#687c91', '#b8c4d0', 'downtown'), // Glass & aluminum curtain wall
                createFacadeTexture('#a89888', '#e0d8ce', 'downtown')
            ];

            const paintedLadiesPalettes = [
                { base: '#f2c66d', trim: '#fff8ea' }, // Golden Ochre Victorian
                { base: '#7ec4b6', trim: '#f4fbf9' }, // Mint Seafoam Victorian
                { base: '#e28899', trim: '#fff5f7' }, // Rose Coral Victorian
                { base: '#7fa8d8', trim: '#f2f7fc' }, // Pacific Blue Victorian
                { base: '#d9b89c', trim: '#ffffff' }, // Sandstone Edwardian
                { base: '#96b88a', trim: '#f7fbf5' }  // Sage Green Victorian
            ];
            const victorianMaterials = paintedLadiesPalettes.map(p => new THREE.MeshStandardMaterial({
                map: createFacadeTexture(p.base, p.trim, 'victorian'),
                roughness: 0.55,
                metalness: 0.05
            }));

            const trimMat = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.5 });
            const roofMat = new THREE.MeshStandardMaterial({ color: 0x3b424c, roughness: 0.65 });
            const glassTowerMat = new THREE.MeshPhysicalMaterial({
                color: 0x88b8d8,
                roughness: 0.1,
                metalness: 0.75,
                clearcoat: 1.0
            });

            // Collect static detail geometry to merge for high FPS
            const trimGeos = [];
            const roofGeos = [];

            // Instanced street props arrays
            const lampTransforms = [];
            const palmTransforms = [];
            const treeTransforms = [];
            const signalTransforms = [];
            const wireGeos = [];

            for (let gx = 0; gx < GRID_STEPS; gx++) {
                for (let gz = 0; gz < GRID_STEPS; gz++) {
                    const cellX = -OFFSET + gx * CELL_SIZE;
                    const cellZ = -OFFSET + gz * CELL_SIZE;

                    const bx = cellX + STREET_WIDTH + BLOCK_SIZE / 2;
                    const bz = cellZ + STREET_WIDTH + BLOCK_SIZE / 2;

                    if (bx > 380) continue;

                    const groundY = getElevation(bx, bz);

                    // Landmark 1: Transamerica Pyramid (gx === 7, gz === 6) - Tall & prominent on skyline
                    if (gx === 7 && gz === 6) {
                        const pyrH = 280;
                        const pyrGeo = new THREE.ConeGeometry(34, pyrH, 4);
                        pyrGeo.rotateY(Math.PI / 4);
                        const pyrMat = new THREE.MeshStandardMaterial({
                            color: 0xf4efe6,
                            roughness: 0.32,
                            metalness: 0.15,
                            map: downtownFacades[1]
                        });
                        const pyr = new THREE.Mesh(pyrGeo, pyrMat);
                        pyr.position.set(bx, groundY + pyrH / 2 - 10, bz);
                        pyr.castShadow = true;
                        pyr.receiveShadow = true;
                        scene.add(pyr);

                        // Iconic elevator wings on East/West sides
                        const wing1 = new THREE.Mesh(new THREE.BoxGeometry(16, 115, 54), pyrMat);
                        wing1.position.set(bx, groundY + 55, bz);
                        const wing2 = new THREE.Mesh(new THREE.BoxGeometry(54, 115, 16), pyrMat);
                        wing2.position.set(bx, groundY + 55, bz);
                        scene.add(wing1, wing2);

                        // Illuminated glass crown jewel
                        const spire = new THREE.Mesh(
                            new THREE.ConeGeometry(4.5, 32, 4),
                            new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x88eeff, emissiveIntensity: 3.5 })
                        );
                        spire.rotation.y = Math.PI / 4;
                        spire.position.set(bx, groundY + pyrH - 4, bz);
                        scene.add(spire);

                        buildings.push({ minX: bx - 25, maxX: bx + 25, minZ: bz - 25, maxZ: bz + 25, maxY: groundY + pyrH });
                        continue;
                    }

                    // Landmark 2: Coit Tower atop Telegraph Hill (gx === 4, gz === 7) - Directly visible ahead of player spawn!
                    if (gx === 4 && gz === 7) {
                        const coitH = 135;
                        const flutedMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e4, roughness: 0.42 });
                        const accentMat = new THREE.MeshStandardMaterial({ color: 0x55ccff, emissive: 0x33aaff, emissiveIntensity: 1.5 });
                        const base = new THREE.Mesh(new THREE.BoxGeometry(26, 18, 26), flutedMat);
                        base.position.set(bx, groundY + 6, bz);
                        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(11, 13.5, coitH, 24), flutedMat);
                        shaft.position.set(bx, groundY + coitH / 2 - 2, bz);
                        shaft.castShadow = true;
                        const belvedere = new THREE.Mesh(new THREE.CylinderGeometry(9, 10.5, 16, 16), flutedMat);
                        belvedere.position.set(bx, groundY + coitH + 4, bz);
                        const lantern = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 7.5, 6, 16), accentMat);
                        lantern.position.set(bx, groundY + coitH + 13, bz);
                        scene.add(base, shaft, belvedere, lantern);

                        buildings.push({ minX: bx - 12, maxX: bx + 12, minZ: bz - 12, maxZ: bz + 12, maxY: groundY + coitH });
                        continue;
                    }

                    const isDowntown = gx >= 6 && gz >= 4 && gz <= 8;

                    if (isDowntown) {
                        // Consume exact 2 cityRandom() calls as original
                        const rH = cityRandom();
                        const rTex = cityRandom();

                        const w = BLOCK_SIZE - 16;
                        const d = BLOCK_SIZE - 16;
                        const h = 50 + rH * 90;

                        // Landmark 3: Salesforce Tower at (gx === 7, gz === 5)
                        if (gx === 7 && gz === 5) {
                            const sfH = 310;
                            const sfGeo = new THREE.CylinderGeometry(20, 27, sfH, 24);
                            const sfTower = new THREE.Mesh(sfGeo, glassTowerMat);
                            sfTower.position.set(bx, groundY + sfH / 2 - 10, bz);
                            sfTower.castShadow = true;
                            sfTower.receiveShadow = true;
                            scene.add(sfTower);

                            // Glowing crown lattice
                            const crown = new THREE.Mesh(
                                new THREE.CylinderGeometry(17, 20, 26, 16),
                                new THREE.MeshStandardMaterial({ color: 0xdff8ff, emissive: 0x44bbff, emissiveIntensity: 2.2 })
                            );
                            crown.position.set(bx, groundY + sfH - 5, bz);
                            scene.add(crown);
                        } else {
                            const bGeo = new THREE.BoxGeometry(w, h + 30, d);
                            const tex = downtownFacades[Math.floor(rTex * downtownFacades.length)];
                            const bMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.28, metalness: 0.25 });
                            const bMesh = new THREE.Mesh(bGeo, bMat);
                            bMesh.position.set(bx, groundY + h / 2 - 15, bz);
                            bMesh.castShadow = true;
                            bMesh.receiveShadow = true;
                            scene.add(bMesh);

                            // Rooftop cornice & mechanical penthouse
                            const cornice = new THREE.BoxGeometry(w + 2, 2.5, d + 2);
                            cornice.translate(bx, groundY + h, bz);
                            trimGeos.push(cornice);
                        }

                        buildings.push({ minX: bx - w / 2, maxX: bx + w / 2, minZ: bz - d / 2, maxZ: bz + d / 2, maxY: groundY + h });
                    } else {
                        // Victorian / Edwardian Row Houses with Bay Windows & Cornices
                        const subSize = (BLOCK_SIZE - 16) / 2; // 27
                        for (let sx = -0.5; sx <= 0.5; sx += 1) {
                            for (let sz = -0.5; sz <= 0.5; sz += 1) {
                                const hx = bx + sx * (subSize + 4);
                                const hz = bz + sz * (subSize + 4);
                                const hy = getElevation(hx, hz);

                                // Consume exact 2 cityRandom() calls per sub-house
                                const rH = cityRandom();
                                const rCol = cityRandom();
                                const hh = 15 + rH * 15;

                                const hGeo = new THREE.BoxGeometry(subSize, hh + 20, subSize);
                                const matIdx = Math.floor(rCol * victorianMaterials.length);
                                const hMesh = new THREE.Mesh(hGeo, victorianMaterials[matIdx]);
                                hMesh.position.set(hx, hy + hh / 2 - 10, hz);
                                hMesh.castShadow = true;
                                hMesh.receiveShadow = true;
                                scene.add(hMesh);

                                // Projecting Victorian Bay Windows on street-facing sides + ornate cornice + front stoop
                                const bayX = sx < 0 ? hx - subSize / 2 - 1.1 : hx + subSize / 2 + 1.1;
                                const bayZ = sz < 0 ? hz - subSize / 2 - 1.1 : hz + subSize / 2 + 1.1;

                                const bayGeo1 = new THREE.BoxGeometry(2.4, hh - 2, 7.5);
                                bayGeo1.translate(bayX, hy + hh / 2 - 1, hz - 4.5);
                                const bayGeo2 = new THREE.BoxGeometry(2.4, hh - 2, 7.5);
                                bayGeo2.translate(bayX, hy + hh / 2 - 1, hz + 4.5);
                                const bayGeo3 = new THREE.BoxGeometry(7.5, hh - 2, 2.4);
                                bayGeo3.translate(hx, hy + hh / 2 - 1, bayZ);
                                const corniceGeo = new THREE.BoxGeometry(subSize + 1.8, 1.6, subSize + 1.8);
                                corniceGeo.translate(hx, hy + hh + 0.4, hz);
                                trimGeos.push(bayGeo1, bayGeo2, bayGeo3, corniceGeo);

                                // Pitched Victorian gable roof
                                const rGeo = new THREE.ConeGeometry(subSize * 0.68, 5.5, 4);
                                rGeo.rotateY(Math.PI / 4);
                                rGeo.translate(hx, hy + hh + 3.2, hz);
                                roofGeos.push(rGeo);

                                buildings.push({
                                    minX: hx - subSize / 2, maxX: hx + subSize / 2,
                                    minZ: hz - subSize / 2, maxZ: hz + subSize / 2,
                                    maxY: hy + hh + 5
                                });
                            }
                        }
                    }
=======
        // --- WORLD GENERATION (San Francisco Architecture, Landmarks, Instanced Street Props) ---
        function buildSanFrancisco() {
            // 1. Terrain (SF Hills & Road Grid - 128x128 segments for high FPS)
            const terrainGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 128, 128);
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
                roughness: 0.78,
                metalness: 0.05
            });
            const terrain = new THREE.Mesh(terrainGeo, terrainMat);
            terrain.receiveShadow = true;
            scene.add(terrain);

            // 2. San Francisco Bay Water (Deep Pacific/Bay blue)
            const waterGeo = new THREE.PlaneGeometry(WORLD_SIZE * 2.5, WORLD_SIZE * 2.5);
            waterGeo.rotateX(-Math.PI / 2);
            const waterMat = new THREE.MeshPhysicalMaterial({
                color: 0x124466,
                roughness: 0.15,
                metalness: 0.8,
                clearcoat: 0.85,
                clearcoatRoughness: 0.18
            });
            const water = new THREE.Mesh(waterGeo, waterMat);
            water.position.y = -2.2;
            scene.add(water);

            // 3. Major San Francisco Landmarks
            buildGoldenGateBridge();
            buildBayBridge();
            buildSutroTower();
            buildFerryBuilding();
            buildLombardStreet();

            // 4. City Blocks (Deterministic RNG order preserved for `buildings` collision array!)
            // Rich, non-overexposed SF masonry and Victorian palettes so walls never blow out to white
            const downtownFacades = [
                createFacadeTexture('#7c3b2e', '#c4b8aa', 'downtown'), // Howard St red brick & terracotta (like reference photos)
                createFacadeTexture('#6e7882', '#adb6be', 'downtown'), // Financial District granite & steel
                createFacadeTexture('#4d6378', '#96a8b8', 'downtown'), // Blue-grey curtain wall glass tower
                createFacadeTexture('#877462', '#bfb4a6', 'downtown')  // Warm sandstone office block
            ];
            const downtownMaterials = downtownFacades.map(tex => new THREE.MeshStandardMaterial({
                map: tex,
                roughness: 0.45,
                metalness: 0.18
            }));

            const paintedLadiesPalettes = [
                { base: '#c9973e', trim: '#e2d7c2' }, // Golden Ochre Victorian
                { base: '#4d9487', trim: '#d2e2de' }, // Mint Seafoam Victorian
                { base: '#b85c6d', trim: '#e4cfd3' }, // Rose Coral Victorian
                { base: '#527aa8', trim: '#cfdbe8' }, // Pacific Blue Victorian
                { base: '#a68366', trim: '#dfd5c8' }, // Sandstone Edwardian
                { base: '#648a5b', trim: '#d4e0d1' }  // Sage Green Victorian
            ];
            const victorianMaterials = paintedLadiesPalettes.map(p => new THREE.MeshStandardMaterial({
                map: createFacadeTexture(p.base, p.trim, 'victorian'),
                roughness: 0.6,
                metalness: 0.05
            }));

            const trimMat = new THREE.MeshStandardMaterial({ color: 0xd6cfc2, roughness: 0.55 });
            const roofMat = new THREE.MeshStandardMaterial({ color: 0x323942, roughness: 0.7 });
            const curbMat = new THREE.MeshStandardMaterial({ color: 0x8e959c, roughness: 0.8 });
            const glassTowerMat = new THREE.MeshPhysicalMaterial({
                color: 0x5c92b8,
                roughness: 0.12,
                metalness: 0.72,
                clearcoat: 1.0
            });
            const pyrMat = new THREE.MeshStandardMaterial({
                color: 0xdcd5c8,
                roughness: 0.38,
                metalness: 0.12,
                map: downtownFacades[1]
            });

            // Helper to build a Transamerica Pyramid mesh group
            function addTransamericaMesh(x, groundY, z, pyrH, radius) {
                const pyrGeo = new THREE.ConeGeometry(radius, pyrH, 4);
                pyrGeo.rotateY(Math.PI / 4);
                const pyr = new THREE.Mesh(pyrGeo, pyrMat);
                pyr.position.set(x, groundY + pyrH / 2 - 10, z);
                pyr.castShadow = true;
                pyr.receiveShadow = true;
                scene.add(pyr);

                // Iconic elevator wings on East/West/North/South sides
                const wing1 = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.46, pyrH * 0.45, radius * 1.55), pyrMat);
                wing1.position.set(x, groundY + pyrH * 0.24, z);
                const wing2 = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.55, pyrH * 0.45, radius * 0.46), pyrMat);
                wing2.position.set(x, groundY + pyrH * 0.24, z);
                scene.add(wing1, wing2);

                // Illuminated glass crown jewel
                const spire = new THREE.Mesh(
                    new THREE.ConeGeometry(radius * 0.14, 28, 4),
                    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x66ddff, emissiveIntensity: 3.0 })
                );
                spire.rotation.y = Math.PI / 4;
                spire.position.set(x, groundY + pyrH - 4, z);
                scene.add(spire);
            }

            // Helper to build a Salesforce Tower obelisk mesh
            function addSalesforceMesh(x, groundY, z, sfH, topR, botR) {
                const sfGeo = new THREE.CylinderGeometry(topR, botR, sfH, 24);
                const sfTower = new THREE.Mesh(sfGeo, glassTowerMat);
                sfTower.position.set(x, groundY + sfH / 2 - 10, z);
                sfTower.castShadow = true;
                sfTower.receiveShadow = true;
                scene.add(sfTower);

                // Horizontal aluminum sun-shading rings
                const ringMat = new THREE.MeshStandardMaterial({ color: 0xc8d4e0, roughness: 0.3, metalness: 0.8 });
                for (let ry = 40; ry < sfH - 30; ry += 35) {
                    const r = THREE.MathUtils.lerp(botR, topR, ry / sfH) + 0.4;
                    const band = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 2.2, 20), ringMat);
                    band.position.set(x, groundY + ry - 10, z);
                    scene.add(band);
                }

                // Glowing crown lattice
                const crown = new THREE.Mesh(
                    new THREE.CylinderGeometry(topR * 0.86, topR, 28, 16),
                    new THREE.MeshStandardMaterial({ color: 0xdff8ff, emissive: 0x33bbff, emissiveIntensity: 2.5 })
                );
                crown.position.set(x, groundY + sfH - 5, z);
                scene.add(crown);
            }

            // Merge geometries per material palette so 500+ buildings render in ~12 draw calls for 60 FPS!
            const victorianGeos = paintedLadiesPalettes.map(() => []);
            const downtownGeos = downtownFacades.map(() => []);
            const trimGeos = [];
            const roofGeos = [];
            const curbGeos = [];

            // Instanced street props arrays
            const lampTransforms = [];
            const palmTransforms = [];
            const treeTransforms = [];
            const signalTransforms = [];
            const wireGeos = [];

            for (let gx = 0; gx < GRID_STEPS; gx++) {
                for (let gz = 0; gz < GRID_STEPS; gz++) {
                    const cellX = -OFFSET + gx * CELL_SIZE;
                    const cellZ = -OFFSET + gz * CELL_SIZE;

                    const bx = cellX + STREET_WIDTH + BLOCK_SIZE / 2;
                    const bz = cellZ + STREET_WIDTH + BLOCK_SIZE / 2;

                    if (bx > 380) continue;

                    const groundY = getElevation(bx, bz);

                    // Raised 3D concrete sidewalk pad for each block (gives real curb depth along streets)
                    const swGeo = new THREE.BoxGeometry(BLOCK_SIZE - 2, 16, BLOCK_SIZE - 2);
                    swGeo.translate(bx, groundY - 7.65, bz);
                    curbGeos.push(swGeo);

                    // Landmark 1: Transamerica Pyramid (gx === 7, gz === 6)
                    if (gx === 7 && gz === 6) {
                        addTransamericaMesh(bx, groundY, bz, 300, 34);
                        buildings.push({ minX: bx - 25, maxX: bx + 25, minZ: bz - 25, maxZ: bz + 25, maxY: groundY + 280 });
                        continue;
                    }

                    // Landmark 2: Coit Tower atop Telegraph Hill (gx === 4, gz === 7) - Directly visible ahead of player!
                    if (gx === 4 && gz === 7) {
                        const coitH = 145;
                        const flutedMat = new THREE.MeshStandardMaterial({ color: 0xdfd7c6, roughness: 0.45 });
                        const accentMat = new THREE.MeshStandardMaterial({ color: 0x55ccff, emissive: 0x2299ff, emissiveIntensity: 2.0 });
                        const base = new THREE.Mesh(new THREE.BoxGeometry(28, 22, 28), flutedMat);
                        base.position.set(bx, groundY + 6, bz);
                        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(11.5, 14, coitH, 24), flutedMat);
                        shaft.position.set(bx, groundY + coitH / 2 - 2, bz);
                        shaft.castShadow = true;
                        const belvedere = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 11, 18, 16), flutedMat);
                        belvedere.position.set(bx, groundY + coitH + 4, bz);
                        const lantern = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 7, 16), accentMat);
                        lantern.position.set(bx, groundY + coitH + 14, bz);
                        scene.add(base, shaft, belvedere, lantern);

                        buildings.push({ minX: bx - 12, maxX: bx + 12, minZ: bz - 12, maxZ: bz + 12, maxY: groundY + 135 });
                        continue;
                    }

                    const isDowntown = gx >= 6 && gz >= 4 && gz <= 8;

                    if (isDowntown) {
                        // Consume exact 2 cityRandom() calls as original
                        const rH = cityRandom();
                        const rTex = cityRandom();

                        const w = BLOCK_SIZE - 16;
                        const d = BLOCK_SIZE - 16;
                        const h = 50 + rH * 90;

                        // Landmark 3: Salesforce Tower at (gx === 7, gz === 5) and prominent skyline obelisk at (gx === 6, gz === 7)
                        if (gx === 7 && gz === 5) {
                            addSalesforceMesh(bx, groundY, bz, 330, 20, 27);
                        } else if (gx === 6 && gz === 7) {
                            // Prominent Transamerica-style skyline pyramid visible straight down player's main corridor
                            addTransamericaMesh(bx, groundY, bz, 275, 29);
                        } else if (gx === 6 && gz === 6) {
                            // Prominent Salesforce-style glass tower visible on the immediate skyline ahead-right
                            addSalesforceMesh(bx, groundY, bz, 295, 18, 24);
                        } else {
                            const bGeo = new THREE.BoxGeometry(w, h + 30, d);
                            bGeo.translate(bx, groundY + h / 2 - 15, bz);
                            const texIdx = Math.floor(rTex * downtownFacades.length);
                            downtownGeos[texIdx].push(bGeo);

                            // Rooftop cornice & mechanical penthouse
                            const cornice = new THREE.BoxGeometry(w + 2, 2.5, d + 2);
                            cornice.translate(bx, groundY + h, bz);
                            trimGeos.push(cornice);
                        }

                        buildings.push({ minX: bx - w / 2, maxX: bx + w / 2, minZ: bz - d / 2, maxZ: bz + d / 2, maxY: groundY + h });
                    } else {
                        // Victorian / Edwardian Row Houses with Bay Windows & Cornices
                        const subSize = (BLOCK_SIZE - 16) / 2; // 27
                        for (let sx = -0.5; sx <= 0.5; sx += 1) {
                            for (let sz = -0.5; sz <= 0.5; sz += 1) {
                                const hx = bx + sx * (subSize + 4);
                                const hz = bz + sz * (subSize + 4);
                                const hy = getElevation(hx, hz);

                                // Consume exact 2 cityRandom() calls per sub-house
                                const rH = cityRandom();
                                const rCol = cityRandom();
                                const hh = 15 + rH * 15;

                                const hGeo = new THREE.BoxGeometry(subSize, hh + 24, subSize);
                                hGeo.translate(hx, hy + hh / 2 - 12, hz);
                                const matIdx = Math.floor(rCol * victorianMaterials.length);
                                victorianGeos[matIdx].push(hGeo);

                                // Projecting Victorian Bay Windows on street-facing sides + ornate cornice + front stoop
                                const bayX = sx < 0 ? hx - subSize / 2 - 1.2 : hx + subSize / 2 + 1.2;
                                const bayZ = sz < 0 ? hz - subSize / 2 - 1.2 : hz + subSize / 2 + 1.2;

                                const bayGeo1 = new THREE.BoxGeometry(2.6, hh + 8, 7.2);
                                bayGeo1.translate(bayX, hy + hh / 2 - 5, hz - 4.5);
                                const bayGeo2 = new THREE.BoxGeometry(2.6, hh + 8, 7.2);
                                bayGeo2.translate(bayX, hy + hh / 2 - 5, hz + 4.5);
                                const bayGeo3 = new THREE.BoxGeometry(7.2, hh + 8, 2.6);
                                bayGeo3.translate(hx, hy + hh / 2 - 5, bayZ);
                                const corniceGeo = new THREE.BoxGeometry(subSize + 2.0, 1.8, subSize + 2.0);
                                corniceGeo.translate(hx, hy + hh + 0.4, hz);
                                trimGeos.push(bayGeo1, bayGeo2, bayGeo3, corniceGeo);

                                // Pitched Victorian gable roof
                                const rGeo = new THREE.ConeGeometry(subSize * 0.68, 6.0, 4);
                                rGeo.rotateY(Math.PI / 4);
                                rGeo.translate(hx, hy + hh + 3.4, hz);
                                roofGeos.push(rGeo);

                                buildings.push({
                                    minX: hx - subSize / 2, maxX: hx + subSize / 2,
                                    minZ: hz - subSize / 2, maxZ: hz + subSize / 2,
                                    maxY: hy + hh + 5
                                });
                            }
                        }
                    }
>>>>>>> REPLACE
<<<<<<< SEARCH
            // Merge static building trim & roofs into single draw calls
            if (trimGeos.length) {
                const mergedTrim = BufferGeometryUtils.mergeGeometries(trimGeos);
                const trimMesh = new THREE.Mesh(mergedTrim, trimMat);
                trimMesh.castShadow = true;
                trimMesh.receiveShadow = true;
                scene.add(trimMesh);
            }
            if (roofGeos.length) {
                const mergedRoof = BufferGeometryUtils.mergeGeometries(roofGeos);
                const roofMesh = new THREE.Mesh(mergedRoof, roofMat);
                scene.add(roofMesh);
            }
=======
            // Merge all Victorian & Downtown buildings by palette (cuts ~600 draw calls down to 10!)
            victorianGeos.forEach((geos, idx) => {
                if (!geos.length) return;
                const merged = BufferGeometryUtils.mergeGeometries(geos);
                const mesh = new THREE.Mesh(merged, victorianMaterials[idx]);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                scene.add(mesh);
            });
            downtownGeos.forEach((geos, idx) => {
                if (!geos.length) return;
                const merged = BufferGeometryUtils.mergeGeometries(geos);
                const mesh = new THREE.Mesh(merged, downtownMaterials[idx]);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                scene.add(mesh);
            });

            // Merge static building trim, sidewalks & roofs into single draw calls
            if (curbGeos.length) {
                const mergedCurb = BufferGeometryUtils.mergeGeometries(curbGeos);
                const curbMesh = new THREE.Mesh(mergedCurb, curbMat);
                curbMesh.receiveShadow = true;
                scene.add(curbMesh);
            }
            if (trimGeos.length) {
                const mergedTrim = BufferGeometryUtils.mergeGeometries(trimGeos);
                const trimMesh = new THREE.Mesh(mergedTrim, trimMat);
                trimMesh.castShadow = true;
                trimMesh.receiveShadow = true;
                scene.add(trimMesh);
            }
            if (roofGeos.length) {
                const mergedRoof = BufferGeometryUtils.mergeGeometries(roofGeos);
                const roofMesh = new THREE.Mesh(mergedRoof, roofMat);
                scene.add(roofMesh);
            }
>>>>>>> REPLACE
<<<<<<< SEARCH
        // 5. Lombard Street Zigzag flowerbeds & brick hairpins on Russian Hill
        function buildLombardStreet() {
            const lg = new THREE.Group();
            const brickMat = new THREE.MeshStandardMaterial({ color: 0xa84438, roughness: 0.7 });
            const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x2f6e36, roughness: 0.8 });
            const flowerMat = new THREE.MeshStandardMaterial({ color: 0xff66aa, roughness: 0.6 });

            const lx = -85;
            for (let i = 0; i < 5; i++) {
                const z = 72 + i * 11;
                const x = lx + (i % 2 === 0 ? -4.5 : 4.5);
                const y = getElevation(x, z);
                const planter = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.4, 4.5), brickMat);
                planter.position.set(x, y + 0.4, z);
                const hedge = new THREE.Mesh(new THREE.SphereGeometry(2.4, 8, 8), hedgeMat);
                hedge.position.set(x, y + 1.5, z);
                const blooms = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 8), flowerMat);
                blooms.position.set(x + 0.6, y + 2.2, z);
                lg.add(planter, hedge, blooms);
            }
            scene.add(lg);
        }

        // 6. Moving San Francisco Cable Cars along hill avenues
        function buildCableCars() {
            const maroonMat = new THREE.MeshStandardMaterial({ color: 0x7c1f28, roughness: 0.4 });
            const creamMat = new THREE.MeshStandardMaterial({ color: 0xf4e8c8, roughness: 0.5 });
            const woodMat = new THREE.MeshStandardMaterial({ color: 0x8a5832, roughness: 0.6 });

            const lanes = [-185, 115];
            lanes.forEach((lx, idx) => {
                const car = new THREE.Group();
                const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 6.2), maroonMat);
                body.position.y = 1.0;
                const upper = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 4.6), creamMat);
                upper.position.y = 2.0;
                const roof = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.25, 6.4), woodMat);
                roof.position.y = 2.65;
                car.add(body, upper, roof);

                const z = idx === 0 ? -120 : 120;
                car.position.set(lx, getElevation(lx, z), z);
                scene.add(car);
                cableCars.push({ mesh: car, x: lx, z, dir: idx === 0 ? 1 : -1 });
            });
        }
=======
        // 5. Lombard Street Zigzag flowerbeds & brick hairpins on Russian Hill (conformed to hill slope & off active traffic lanes)
        function buildLombardStreet() {
            const lg = new THREE.Group();
            const brickMat = new THREE.MeshStandardMaterial({ color: 0x943b30, roughness: 0.75 });
            const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x2c6432, roughness: 0.8 });
            const flowerMat = new THREE.MeshStandardMaterial({ color: 0xe85596, roughness: 0.65 });

            // Place landscaped brick terraces along the Russian Hill sidewalk/terrace edge so they never block road lanes or float
            const terraceSpots = [
                [-101, 68], [-69, 68], [-101, 132], [-69, 132], [-101, 168], [-69, 168]
            ];
            terraceSpots.forEach(([x, z], i) => {
                const y = getElevation(x, z);
                const normal = getTerrainNormal(x, z);
                const planterGroup = new THREE.Group();
                planterGroup.position.set(x, y, z);

                // Align planter to terrain slope and sink foundation skirt into the hill so it never floats
                const fwd = new THREE.Vector3(0, 0, 1).projectOnPlane(normal).normalize();
                const right = new THREE.Vector3().crossVectors(normal, fwd).normalize();
                planterGroup.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, normal, fwd));

                const planter = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.6, 5.2), brickMat);
                planter.position.y = -0.7; // Deep foundation skirt into slope
                const hedge = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.1, 4.4), hedgeMat);
                hedge.position.y = 1.4;
                const blooms = new THREE.Mesh(new THREE.SphereGeometry(1.15, 8, 8), flowerMat);
                blooms.position.set(0, 1.9, (i % 2 === 0 ? 0.8 : -0.8));
                planterGroup.add(planter, hedge, blooms);
                lg.add(planterGroup);
            });
            scene.add(lg);
        }

        // 6. Moving San Francisco Cable Cars along hill avenues (including Powell/Hyde corridor visible from spawn)
        function buildCableCars() {
            const maroonMat = new THREE.MeshStandardMaterial({ color: 0x7c1f28, roughness: 0.4 });
            const creamMat = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.5 });
            const woodMat = new THREE.MeshStandardMaterial({ color: 0x8a5832, roughness: 0.6 });
            const lampMat = new THREE.MeshStandardMaterial({ color: 0xfff0aa, emissive: 0xffcc44, emissiveIntensity: 2.5 });

            const configs = [
                { x: -77, z: 45, dir: 1 },   // Right-side cable car track on player's main hill avenue
                { x: 15, z: -20, dir: 1 },   // Central avenue cable car
                { x: -185, z: -80, dir: 1 },
                { x: 115, z: 90, dir: -1 }
            ];
            configs.forEach((cfg) => {
                const car = new THREE.Group();
                const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 6.4), maroonMat);
                body.position.y = 1.0;
                const upper = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 4.8), creamMat);
                upper.position.y = 2.0;
                const roof = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.28, 6.6), woodMat);
                roof.position.y = 2.68;
                const clerestory = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.28, 4.4), maroonMat);
                clerestory.position.y = 2.92;
                const headlight = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.2, 10), lampMat);
                headlight.rotation.x = Math.PI / 2;
                headlight.position.set(0, 1.2, 3.25);
                car.add(body, upper, roof, clerestory, headlight);

                car.position.set(cfg.x, getElevation(cfg.x, cfg.z), cfg.z);
                scene.add(car);
                cableCars.push({ mesh: car, x: cfg.x, z: cfg.z, dir: cfg.dir });
            });
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
        // --- INITIALIZATION & GRAPHICS PIPELINE ---
        function init() {
            const container = document.getElementById('canvas-container');

            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x8ec5f2);
            // Subtle distant horizon fog starting far away (>= 450 units) so streets, row houses & SF landmarks stay crisp
            scene.fog = new THREE.Fog(0x9ec8eb, 480, 1450);

            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 1600);

            renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 0.92;
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            container.appendChild(renderer.domElement);

            // Physical Sky (Crisp sunny San Francisco daytime sky + PMREM environment map for glossy car paint & glass)
            const sky = new Sky();
            sky.scale.setScalar(10000);
            scene.add(sky);

            const skyUniforms = sky.material.uniforms;
            skyUniforms['turbidity'].value = 2.2;
            skyUniforms['rayleigh'].value = 1.35;
            skyUniforms['mieCoefficient'].value = 0.002;
            skyUniforms['mieDirectionalG'].value = 0.78;

            const sunVec = new THREE.Vector3();
            const phi = THREE.MathUtils.degToRad(90 - 38); // Crisp sunny SF afternoon sun 38° above horizon
            const theta = THREE.MathUtils.degToRad(135);   // Strong directional sunlight & clear street shadows
            sunVec.setFromSphericalCoords(1, phi, theta);
            skyUniforms['sunPosition'].value.copy(sunVec);

            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            scene.environment = pmremGenerator.fromScene(sky).texture;
            scene.environmentIntensity = 0.55;
            pmremGenerator.dispose();

            // Hemisphere fill light (crisp blue sky above, warm asphalt/sandstone bounce below)
            const hemiLight = new THREE.HemisphereLight(0x99c8f2, 0x504842, 0.65);
            scene.add(hemiLight);

            // Single shadow-casting directional sun that follows the player with tight frustum
            sunLight = new THREE.DirectionalLight(0xfff4e0, 2.35);
            sunLight.position.copy(sunVec).multiplyScalar(250);
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 1536;
            sunLight.shadow.mapSize.height = 1536;
            sunLight.shadow.camera.near = 10;
            sunLight.shadow.camera.far = 520;
            const sd = 120;
            sunLight.shadow.camera.left = -sd;
            sunLight.shadow.camera.right = sd;
            sunLight.shadow.camera.top = sd;
            sunLight.shadow.camera.bottom = -sd;
            sunLight.shadow.bias = -0.0005;
            scene.add(sunLight);
            scene.add(sunLight.target);

            // Post-Processing: RenderPass -> Restrained UnrealBloomPass (only lasers/lights glow) -> OutputPass (fast 60 FPS)
            composer = new EffectComposer(renderer);
            const renderPass = new RenderPass(scene, camera);
            composer.addPass(renderPass);

            const bloomPass = new UnrealBloomPass(
                new THREE.Vector2(Math.floor(window.innerWidth / 2), Math.floor(window.innerHeight / 2)),
                0.22, // restrained strength <= 0.3 so only lasers/emissives glow
                0.3,
                0.92  // high threshold >= 0.85 so white car & buildings never wash out
            );
            composer.addPass(bloomPass);

            const outputPass = new OutputPass();
            composer.addPass(outputPass);
=======
        // --- INITIALIZATION & GRAPHICS PIPELINE ---
        function init() {
            const container = document.getElementById('canvas-container');

            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x6daee2);
            // Distant horizon fog only very far away (>= 680 units) so streets, buildings & SF landmarks stay crisp and never wash out
            scene.fog = new THREE.Fog(0x7cb8e8, 680, 1950);

            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 2000);

            renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(1.0); // Crisp 1.0 pixel ratio for high, stable framerate
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 0.80;
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            container.appendChild(renderer.domElement);

            // Physical Sky (Crisp sunny San Francisco blue sky + PMREM environment map for glossy car paint & glass)
            const sky = new Sky();
            sky.scale.setScalar(10000);
            scene.add(sky);

            const skyUniforms = sky.material.uniforms;
            skyUniforms['turbidity'].value = 1.5;
            skyUniforms['rayleigh'].value = 1.85;
            skyUniforms['mieCoefficient'].value = 0.001;
            skyUniforms['mieDirectionalG'].value = 0.82;

            const sunVec = new THREE.Vector3();
            const phi = THREE.MathUtils.degToRad(90 - 44); // Clear sunny SF daytime sun 44° above horizon
            const theta = THREE.MathUtils.degToRad(130);   // Angled across streets for crisp contrast & shadows
            sunVec.setFromSphericalCoords(1, phi, theta);
            skyUniforms['sunPosition'].value.copy(sunVec);

            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            scene.environment = pmremGenerator.fromScene(sky).texture;
            scene.environmentIntensity = 0.26;
            pmremGenerator.dispose();

            // Hemisphere fill light (crisp blue sky above, dark asphalt/earth bounce below)
            const hemiLight = new THREE.HemisphereLight(0x7ab4e8, 0x353b42, 0.52);
            scene.add(hemiLight);

            // Single shadow-casting directional sun that follows the player with tight frustum
            sunLight = new THREE.DirectionalLight(0xfff5e4, 1.45);
            sunLight.position.copy(sunVec).multiplyScalar(250);
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 1024;
            sunLight.shadow.mapSize.height = 1024;
            sunLight.shadow.camera.near = 10;
            sunLight.shadow.camera.far = 480;
            const sd = 110;
            sunLight.shadow.camera.left = -sd;
            sunLight.shadow.camera.right = sd;
            sunLight.shadow.camera.top = sd;
            sunLight.shadow.camera.bottom = -sd;
            sunLight.shadow.bias = -0.0005;
            scene.add(sunLight);
            scene.add(sunLight.target);

            // Post-Processing: RenderPass -> Restrained UnrealBloomPass (only lasers/emissives glow) -> OutputPass
            composer = new EffectComposer(renderer);
            const renderPass = new RenderPass(scene, camera);
            composer.addPass(renderPass);

            const bloomPass = new UnrealBloomPass(
                new THREE.Vector2(Math.floor(window.innerWidth / 2), Math.floor(window.innerHeight / 2)),
                0.18, // restrained strength <= 0.3 so only lasers/emissives glow
                0.25,
                1.08  // high threshold > 1.0 so white car & building facades never bloom or wash out
            );
            composer.addPass(bloomPass);

            const outputPass = new OutputPass();
            composer.addPass(outputPass);
>>>>>>> REPLACE
<<<<<<< SEARCH
        function updateHUD() {
            if (!player) return;
            document.getElementById('speed-val').innerText = Math.floor(Math.abs(player.speed) * 1.4);

            const hpPct = Math.max(0, Math.floor(player.hp));
            document.getElementById('health-bar').style.width = hpPct + '%';
            document.getElementById('hp-text').innerText = hpPct + '%';

            const enPct = Math.max(0, Math.floor(player.energy));
            document.getElementById('energy-bar').style.width = enPct + '%';
            document.getElementById('en-text').innerText = enPct + '%';

            // Radar Update (shows both remote players & local AI fleet)
            const radarDots = document.getElementById('radar-dots');
            radarDots.innerHTML = '';
            const radarScale = 75 / 220;

            const opponents = [...remoteVehicles, ...aiVehicles];
            opponents.forEach(b => {
                const dx = b.pos.x - player.pos.x;
                const dz = b.pos.z - player.pos.z;
                const dist = Math.sqrt(dx * dx + dz * dz);

                if (dist < 220) {
                    const angle = Math.atan2(dx, dz) - player.angle;
                    const rx = -Math.sin(angle) * dist * radarScale;
                    const ry = -Math.cos(angle) * dist * radarScale;

                    const dot = document.createElement('div');
                    dot.style.position = 'absolute';
                    dot.style.width = '6px';
                    dot.style.height = '6px';
                    dot.style.background = '#ff0055';
                    dot.style.borderRadius = '50%';
                    dot.style.boxShadow = '0 0 6px #ff0055';
                    dot.style.left = (75 + rx - 3) + 'px';
                    dot.style.top = (75 + ry - 3) + 'px';
                    radarDots.appendChild(dot);
                }
            });
        }
=======
        const radarDotPool = [];
        function updateHUD() {
            if (!player) return;
            document.getElementById('speed-val').innerText = Math.floor(Math.abs(player.speed) * 1.4);

            const hpPct = Math.max(0, Math.floor(player.hp));
            document.getElementById('health-bar').style.width = hpPct + '%';
            document.getElementById('hp-text').innerText = hpPct + '%';

            const enPct = Math.max(0, Math.floor(player.energy));
            document.getElementById('energy-bar').style.width = enPct + '%';
            document.getElementById('en-text').innerText = enPct + '%';

            // Radar Update using pooled DOM nodes (zero per-frame DOM allocations)
            const radarDots = document.getElementById('radar-dots');
            const radarScale = 75 / 220;

            const opponents = [...remoteVehicles, ...aiVehicles];
            let dotIdx = 0;
            opponents.forEach(b => {
                const dx = b.pos.x - player.pos.x;
                const dz = b.pos.z - player.pos.z;
                const dist = Math.sqrt(dx * dx + dz * dz);

                if (dist < 220) {
                    const angle = Math.atan2(dx, dz) - player.angle;
                    const rx = -Math.sin(angle) * dist * radarScale;
                    const ry = -Math.cos(angle) * dist * radarScale;

                    let dot = radarDotPool[dotIdx];
                    if (!dot) {
                        dot = document.createElement('div');
                        dot.style.position = 'absolute';
                        dot.style.width = '6px';
                        dot.style.height = '6px';
                        dot.style.background = '#ff0055';
                        dot.style.borderRadius = '50%';
                        dot.style.boxShadow = '0 0 6px #ff0055';
                        radarDots.appendChild(dot);
                        radarDotPool.push(dot);
                    }
                    dot.style.display = 'block';
                    dot.style.left = (75 + rx - 3) + 'px';
                    dot.style.top = (75 + ry - 3) + 'px';
                    dotIdx++;
                }
            });
            for (let i = dotIdx; i < radarDotPool.length; i++) {
                radarDotPool[i].style.display = 'none';
            }
        }
>>>>>>> REPLACE