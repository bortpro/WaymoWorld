<<<<<<< SEARCH
        #overlay {
            position: absolute;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(5, 10, 20, 0.35);
            z-index: 10;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #fff;
            text-align: center;
            padding: 16px;
            box-sizing: border-box;
        }
=======
        #overlay {
            position: absolute;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(5, 10, 20, 0.35);
            z-index: 10;
            display: none;
            justify-content: center;
            align-items: center;
            color: #fff;
            text-align: center;
            padding: 16px;
            box-sizing: border-box;
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
        function createWaymoMesh(isPlayer = false) {
            const group = new THREE.Group();

            // Lower Jaguar I-PACE sculpted body shell
            const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.72, 4.65), sharedCarMats.whitePaint);
            lowerBody.position.set(0, 0.64, 0);
            lowerBody.castShadow = true;
            lowerBody.receiveShadow = true;
            group.add(lowerBody);

            // Sloped front hood & fenders
            const hood = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.26, 1.45), sharedCarMats.whitePaint);
            hood.position.set(0, 0.96, 1.48);
            hood.rotation.x = 0.14;
            hood.castShadow = true;
            group.add(hood);

            // Rocker panels / black lower trim
            const sill = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.16, 3.1), sharedCarMats.blackTrim);
            sill.position.set(0, 0.34, 0);
            group.add(sill);

            // Waymo door branding panels
            const doorPanelGeo = new THREE.PlaneGeometry(1.3, 0.62);
            const doorL = new THREE.Mesh(doorPanelGeo, sharedCarMats.doorLogo);
            doorL.position.set(1.05, 0.68, 0.1);
            doorL.rotation.y = Math.PI / 2;
            const doorR = new THREE.Mesh(doorPanelGeo, sharedCarMats.doorLogo);
            doorR.position.set(-1.05, 0.68, 0.1);
            doorR.rotation.y = -Math.PI / 2;
            group.add(doorL, doorR);

            // Coupe greenhouse (sloped windshield & fastback rear glass)
            const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.58, 2.35), sharedCarMats.glass);
            cabin.position.set(0, 1.28, -0.15);
            cabin.castShadow = true;
            group.add(cabin);

            const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.56, 0.95), sharedCarMats.glass);
            windshield.position.set(0, 1.21, 0.95);
            windshield.rotation.x = -0.52;
            group.add(windshield);

            const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.70, 0.52, 0.95), sharedCarMats.glass);
            rearGlass.position.set(0, 1.22, -1.25);
            rearGlass.rotation.x = 0.48;
            group.add(rearGlass);

            // White roof rails & roof cap
            const roofCap = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.09, 2.15), sharedCarMats.whitePaint);
            roofCap.position.set(0, 1.58, -0.15);
            group.add(roofCap);

            // Jaguar front grille (black oval/shield inset)
            const grille = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.32, 0.08), sharedCarMats.blackTrim);
            grille.position.set(0, 0.66, 2.31);
            group.add(grille);

            // --- WAYMO 5TH-GEN ROOF LIDAR & SENSOR SUITE ---
            // Aerodynamic white fairing Halo on roof
            const fairing = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.55, 0.18, 20), sharedCarMats.whitePaint);
            fairing.scale.set(1.0, 1.0, 1.45);
            fairing.position.set(0, 1.69, -0.05);
            group.add(fairing);

            // Tall spinning central 360° LiDAR dome
            const turretGroup = new THREE.Group();
            turretGroup.position.set(0, 1.92, -0.05);

            const lidarPuck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.34, 24), sharedCarMats.sensorLens);
            turretGroup.add(lidarPuck);

            const lidarRing = new THREE.Mesh(
                new THREE.CylinderGeometry(0.255, 0.255, 0.10, 24),
                isPlayer ? sharedCarMats.playerLidar : sharedCarMats.enemyLidar
            );
            lidarRing.position.y = 0.03;
            turretGroup.add(lidarRing);

            const lidarCap = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.24, 0.05, 24), sharedCarMats.whitePaint);
            lidarCap.position.y = 0.19;
            turretGroup.add(lidarCap);

            // Direction laser emitter lens
            const emitter = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.10, 0.36),
                isPlayer ? sharedCarMats.playerLidar : sharedCarMats.enemyLidar
            );
            emitter.position.set(0, 0.06, 0.14);
            turretGroup.add(emitter);

            group.add(turretGroup);
            group.userData.turret = turretGroup;

            // Corner short-range perimeter LiDAR pods & fender camera pods
            const podGeo = new THREE.CylinderGeometry(0.11, 0.12, 0.14, 14);
            const podPositions = [
                [0.88, 0.96, 2.05], [-0.88, 0.96, 2.05],   // Front fenders
                [1.08, 1.08, 0.72], [-1.08, 1.08, 0.72],   // Side mirror sensor pods
                [0.82, 1.04, -2.12], [-0.82, 1.04, -2.12], // Rear quarter pods
                [0, 1.58, 1.02], [0, 1.58, -1.25]          // Front/rear roof camera domes
            ];
            podPositions.forEach(p => {
                const pod = new THREE.Mesh(podGeo, sharedCarMats.sensorLens);
                pod.position.set(p[0], p[1], p[2]);
                group.add(pod);
            });

            // Headlights & Taillight strip
            const hlGeo = new THREE.BoxGeometry(0.42, 0.12, 0.08);
            const hlL = new THREE.Mesh(hlGeo, sharedCarMats.headlight);
            hlL.position.set(0.74, 0.76, 2.31);
            const hlR = hlL.clone();
            hlR.position.x = -0.74;
            group.add(hlL, hlR);

            const tl = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.12, 0.08), sharedCarMats.taillight);
            tl.position.set(0, 0.88, -2.32);
            group.add(tl);

            // Wheels & Alloy Rims
            const tireGeo = new THREE.CylinderGeometry(0.40, 0.40, 0.28, 20);
            tireGeo.rotateZ(Math.PI / 2);
            const rimGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.30, 12);
            rimGeo.rotateZ(Math.PI / 2);

            const wheelCoords = [
                [0.98, 0.40, 1.48], [-0.98, 0.40, 1.48],
                [0.98, 0.40, -1.48], [-0.98, 0.40, -1.48]
            ];
            wheelCoords.forEach(wc => {
                const tire = new THREE.Mesh(tireGeo, sharedCarMats.tire);
                tire.position.set(wc[0], wc[1], wc[2]);
                tire.castShadow = true;
                const rim = new THREE.Mesh(rimGeo, sharedCarMats.rim);
                rim.position.set(wc[0], wc[1], wc[2]);
                group.add(tire, rim);
            });

            return group;
        }
=======
        function createWaymoMesh(isPlayer = false) {
            const group = new THREE.Group();

            // Sculpted Jaguar I-PACE main body with flared fenders & tapered fastback tail
            const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.56, 4.55), sharedCarMats.whitePaint);
            lowerBody.position.set(0, 0.66, 0);
            lowerBody.castShadow = true;
            lowerBody.receiveShadow = true;
            group.add(lowerBody);

            // Flared wheel arches so wheels & tires clearly stand out from the rear & side
            const flareGeo = new THREE.CylinderGeometry(0.47, 0.47, 0.24, 16, 1, false, 0, Math.PI);
            flareGeo.rotateZ(Math.PI / 2);
            const wheelCoords = [
                [0.98, 0.42, 1.46], [-0.98, 0.42, 1.46],
                [0.98, 0.42, -1.46], [-0.98, 0.42, -1.46]
            ];
            wheelCoords.forEach(wc => {
                const flare = new THREE.Mesh(flareGeo, sharedCarMats.blackTrim);
                flare.position.set(wc[0] > 0 ? 0.96 : -0.96, wc[1] + 0.04, wc[2]);
                group.add(flare);
            });

            // Sloped aerodynamic Jaguar I-PACE front hood & nose
            const hood = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.24, 1.45), sharedCarMats.whitePaint);
            hood.position.set(0, 0.95, 1.42);
            hood.rotation.x = 0.16;
            hood.castShadow = true;
            group.add(hood);

            // Sculpted rear diffuser & black lower bumper so rear wheels and stance are clearly visible
            const rearDiffuser = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.24, 0.55), sharedCarMats.blackTrim);
            rearDiffuser.position.set(0, 0.42, -2.05);
            rearDiffuser.rotation.x = -0.18;
            group.add(rearDiffuser);

            // Rocker panels / black lower side skirts
            const sill = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.14, 2.3), sharedCarMats.blackTrim);
            sill.position.set(0, 0.37, 0);
            group.add(sill);

            // Waymo door branding panels
            const doorPanelGeo = new THREE.PlaneGeometry(1.35, 0.54);
            const doorL = new THREE.Mesh(doorPanelGeo, sharedCarMats.doorLogo);
            doorL.position.set(0.99, 0.69, 0.12);
            doorL.rotation.y = Math.PI / 2;
            const doorR = new THREE.Mesh(doorPanelGeo, sharedCarMats.doorLogo);
            doorR.position.set(-0.99, 0.69, 0.12);
            doorR.rotation.y = -Math.PI / 2;
            group.add(doorL, doorR);

            // Sleek coupe greenhouse (tapered cabin + raked windshield + fastback rear glass + rear spoiler)
            const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.52, 2.05), sharedCarMats.glass);
            cabin.position.set(0, 1.24, -0.08);
            cabin.castShadow = true;
            group.add(cabin);

            // White A/B/C roof pillars framing the glass
            const pillarRailL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 2.2), sharedCarMats.whitePaint);
            pillarRailL.position.set(0.81, 1.51, -0.1);
            const pillarRailR = pillarRailL.clone();
            pillarRailR.position.x = -0.81;
            group.add(pillarRailL, pillarRailR);

            const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.54, 0.98), sharedCarMats.glass);
            windshield.position.set(0, 1.18, 0.92);
            windshield.rotation.x = -0.58;
            group.add(windshield);

            const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.48, 1.12), sharedCarMats.glass);
            rearGlass.position.set(0, 1.19, -1.28);
            rearGlass.rotation.x = 0.56;
            group.add(rearGlass);

            // Jaguar I-PACE signature rear roof lip spoiler
            const rearSpoiler = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.07, 0.32), sharedCarMats.whitePaint);
            rearSpoiler.position.set(0, 1.46, -1.32);
            group.add(rearSpoiler);

            // White roof cap
            const roofCap = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.08, 1.95), sharedCarMats.whitePaint);
            roofCap.position.set(0, 1.52, -0.12);
            group.add(roofCap);

            // Jaguar front grille (black shield inset)
            const grille = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.30, 0.08), sharedCarMats.blackTrim);
            grille.position.set(0, 0.66, 2.26);
            group.add(grille);

            // --- WAYMO 5TH-GEN ROOF LIDAR & SENSOR SUITE ---
            // Aerodynamic white fairing Halo on roof
            const fairing = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.54, 0.16, 20), sharedCarMats.whitePaint);
            fairing.scale.set(1.0, 1.0, 1.45);
            fairing.position.set(0, 1.63, -0.05);
            group.add(fairing);

            // Tall spinning central 360° LiDAR dome
            const turretGroup = new THREE.Group();
            turretGroup.position.set(0, 1.86, -0.05);

            const lidarPuck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.34, 24), sharedCarMats.sensorLens);
            turretGroup.add(lidarPuck);

            const lidarRing = new THREE.Mesh(
                new THREE.CylinderGeometry(0.255, 0.255, 0.10, 24),
                isPlayer ? sharedCarMats.playerLidar : sharedCarMats.enemyLidar
            );
            lidarRing.position.y = 0.03;
            turretGroup.add(lidarRing);

            const lidarCap = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.24, 0.05, 24), sharedCarMats.whitePaint);
            lidarCap.position.y = 0.19;
            turretGroup.add(lidarCap);

            // Direction laser emitter lens
            const emitter = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.10, 0.36),
                isPlayer ? sharedCarMats.playerLidar : sharedCarMats.enemyLidar
            );
            emitter.position.set(0, 0.06, 0.14);
            turretGroup.add(emitter);

            group.add(turretGroup);
            group.userData.turret = turretGroup;

            // Corner short-range perimeter LiDAR pods & side mirror sensor pods
            const podGeo = new THREE.CylinderGeometry(0.12, 0.13, 0.15, 14);
            const podBaseGeo = new THREE.BoxGeometry(0.22, 0.08, 0.22);
            const podPositions = [
                [0.88, 0.98, 1.98], [-0.88, 0.98, 1.98],   // Front fenders
                [1.08, 1.04, 0.68], [-1.08, 1.04, 0.68],   // Side mirror sensor pods
                [0.82, 1.02, -2.06], [-0.82, 1.02, -2.06], // Rear quarter pods
                [0, 1.54, 0.92], [0, 1.54, -1.18]          // Front/rear roof camera domes
            ];
            podPositions.forEach(p => {
                const base = new THREE.Mesh(podBaseGeo, sharedCarMats.whitePaint);
                base.position.set(p[0], p[1] - 0.06, p[2]);
                const pod = new THREE.Mesh(podGeo, sharedCarMats.sensorLens);
                pod.position.set(p[0], p[1], p[2]);
                group.add(base, pod);
            });

            // Headlights & Jaguar I-PACE LED Taillight strip + Rear Waymo badge
            const hlGeo = new THREE.BoxGeometry(0.42, 0.11, 0.08);
            const hlL = new THREE.Mesh(hlGeo, sharedCarMats.headlight);
            hlL.position.set(0.72, 0.76, 2.26);
            const hlR = hlL.clone();
            hlR.position.x = -0.72;
            group.add(hlL, hlR);

            const tl = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.10, 0.08), sharedCarMats.taillight);
            tl.position.set(0, 0.92, -2.26);
            group.add(tl);

            const rearLogo = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.32), sharedCarMats.doorLogo);
            rearLogo.position.set(0, 0.70, -2.28);
            rearLogo.rotation.y = Math.PI;
            group.add(rearLogo);

            // Wheels & Alloy Rims (slightly wider stance so rear tires are visible from chase camera)
            const tireGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 20);
            tireGeo.rotateZ(Math.PI / 2);
            const rimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.34, 12);
            rimGeo.rotateZ(Math.PI / 2);

            wheelCoords.forEach(wc => {
                const tire = new THREE.Mesh(tireGeo, sharedCarMats.tire);
                tire.position.set(wc[0], wc[1], wc[2]);
                tire.castShadow = true;
                const rim = new THREE.Mesh(rimGeo, sharedCarMats.rim);
                rim.position.set(wc[0], wc[1], wc[2]);
                group.add(tire, rim);
            });

            return group;
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
                this.pos = new THREE.Vector3(x, getElevation(x, z), z);
                this.speed = 0;
                this.angle = 0; // Aligned North (+Z) along road lane by default

                this.maxSpeed = 58;
                this.accel = 40;
                this.handling = 2.6;
=======
                this.pos = new THREE.Vector3(x, getElevation(x, z), z);
                this.speed = isPlayer ? 24 : 0; // Start cruising immediately on deployment
                this.angle = 0; // Aligned North (+Z) along road lane by default

                this.maxSpeed = 72;
                this.accel = 64;
                this.handling = 2.85;
>>>>>>> REPLACE
<<<<<<< SEARCH
                if (this.isPlayer && fixedSlot === 'initial') {
                    // Spawn centered on a straight N-S road lane with clear view of SF hills, Bay Bridge & rivals
                    this.pos.x = -100 + STREET_WIDTH / 2; // x = -85 (center of street)
                    this.pos.z = -45;
                    this.angle = 0; // Facing straight North (+Z) along the street
                } else {
=======
                if (this.isPlayer && fixedSlot === 'initial') {
                    // Spawn centered on a straight N-S road lane with clear view of SF hills, Golden Gate, Transamerica & rivals
                    this.pos.x = -100 + STREET_WIDTH / 2; // x = -85 (center of street)
                    this.pos.z = -45;
                    this.angle = 0; // Facing straight North (+Z) along the street
                    this.speed = 24; // Start already rolling forward at ~34 MPH
                } else {
>>>>>>> REPLACE
<<<<<<< SEARCH
                    // Landmark 1: Transamerica Pyramid (gx === 7, gz === 6)
                    if (gx === 7 && gz === 6) {
                        const pyrH = 185;
                        const pyrGeo = new THREE.ConeGeometry(30, pyrH, 4);
                        pyrGeo.rotateY(Math.PI / 4);
                        const pyrMat = new THREE.MeshStandardMaterial({
                            color: 0xebe6de,
                            roughness: 0.35,
                            metalness: 0.15,
                            map: downtownFacades[1]
                        });
                        const pyr = new THREE.Mesh(pyrGeo, pyrMat);
                        pyr.position.set(bx, groundY + pyrH / 2 - 10, bz);
                        pyr.castShadow = true;
                        pyr.receiveShadow = true;
                        scene.add(pyr);

                        // Iconic elevator wings on East/West sides
                        const wing1 = new THREE.Mesh(new THREE.BoxGeometry(14, 72, 48), pyrMat);
                        wing1.position.set(bx, groundY + 35, bz);
                        const wing2 = new THREE.Mesh(new THREE.BoxGeometry(48, 72, 14), pyrMat);
                        wing2.position.set(bx, groundY + 35, bz);
                        scene.add(wing1, wing2);

                        // Illuminated glass crown jewel
                        const spire = new THREE.Mesh(
                            new THREE.ConeGeometry(3.2, 22, 4),
                            new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x99eeff, emissiveIntensity: 3.0 })
                        );
                        spire.rotation.y = Math.PI / 4;
                        spire.position.set(bx, groundY + pyrH - 6, bz);
                        scene.add(spire);

                        buildings.push({ minX: bx - 25, maxX: bx + 25, minZ: bz - 25, maxZ: bz + 25, maxY: groundY + pyrH });
                        continue;
                    }

                    // Landmark 2: Coit Tower atop Telegraph Hill (gx === 4, gz === 7)
                    if (gx === 4 && gz === 7) {
                        const coitH = 75;
                        const flutedMat = new THREE.MeshStandardMaterial({ color: 0xf2ede2, roughness: 0.45 });
                        const base = new THREE.Mesh(new THREE.BoxGeometry(24, 14, 24), flutedMat);
                        base.position.set(bx, groundY + 4, bz);
                        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 11.5, coitH, 24), flutedMat);
                        shaft.position.set(bx, groundY + coitH / 2 - 2, bz);
                        shaft.castShadow = true;
                        const belvedere = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 8.5, 12, 16), flutedMat);
                        belvedere.position.set(bx, groundY + coitH + 2, bz);
                        scene.add(base, shaft, belvedere);

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
                            const sfH = 220;
                            const sfGeo = new THREE.CylinderGeometry(18, 25, sfH, 24);
                            const sfTower = new THREE.Mesh(sfGeo, glassTowerMat);
                            sfTower.position.set(bx, groundY + sfH / 2 - 10, bz);
                            sfTower.castShadow = true;
                            sfTower.receiveShadow = true;
                            scene.add(sfTower);

                            // Glowing crown lattice
                            const crown = new THREE.Mesh(
                                new THREE.CylinderGeometry(15, 18, 18, 16),
                                new THREE.MeshStandardMaterial({ color: 0xdff8ff, emissive: 0x55ccff, emissiveIntensity: 1.8 })
                            );
                            crown.position.set(bx, groundY + sfH - 5, bz);
                            scene.add(crown);
=======
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
>>>>>>> REPLACE
<<<<<<< SEARCH
        // 1. Golden Gate Bridge (North-West across the strait, International Orange towers + catenary cables)
        function buildGoldenGateBridge() {
            const ggGroup = new THREE.Group();
            const intlOrange = new THREE.MeshStandardMaterial({ color: 0xc0362c, roughness: 0.42, metalness: 0.35 });
            const deckMat = new THREE.MeshStandardMaterial({ color: 0x9e2b22, roughness: 0.55 });

            const bridgeZ = 560;
            const towerXs = [-260, 80];

            towerXs.forEach(tx => {
                // Twin stepped art-deco tower legs
                for (let lz of [-11, 11]) {
                    const leg = new THREE.Mesh(new THREE.BoxGeometry(9, 235, 7), intlOrange);
                    leg.position.set(tx, 110, bridgeZ + lz);
                    ggGroup.add(leg);
                }
                // Horizontal portal struts
                for (let y of [55, 105, 155, 205]) {
                    const strut = new THREE.Mesh(new THREE.BoxGeometry(10, 7, 28), intlOrange);
                    strut.position.set(tx, y, bridgeZ);
                    ggGroup.add(strut);
                }
            });

            // Roadway deck
            const deck = new THREE.Mesh(new THREE.BoxGeometry(820, 5, 26), deckMat);
            deck.position.set(-90, 42, bridgeZ);
            ggGroup.add(deck);

            // Parabolic main suspension cables & vertical suspenders
            const cableGeo = new THREE.CylinderGeometry(0.9, 0.9, 1, 8);
            const segs = 28;
            for (let side of [-11, 11]) {
                for (let i = 0; i < segs; i++) {
                    const t1 = i / segs;
                    const t2 = (i + 1) / segs;
                    const x1 = -480 + t1 * 780;
                    const x2 = -480 + t2 * 780;

                    const sag = (x) => {
                        if (x >= -260 && x <= 80) {
                            const u = (x - (-90)) / 170;
                            return 48 + u * u * 172;
                        } else if (x < -260) {
                            const u = (x - (-480)) / 220;
                            return 44 + u * u * 176;
                        } else {
                            const u = (300 - x) / 220;
                            return 44 + u * u * 176;
                        }
                    };
                    const p1 = new THREE.Vector3(x1, sag(x1), bridgeZ + side);
                    const p2 = new THREE.Vector3(x2, sag(x2), bridgeZ + side);
                    const len = p1.distanceTo(p2);
                    const seg = new THREE.Mesh(cableGeo, intlOrange);
                    seg.scale.set(1, len, 1);
                    seg.position.copy(p1).add(p2).multiplyScalar(0.5);
                    seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
                    ggGroup.add(seg);
                }
            }

            scene.add(ggGroup);
        }
=======
        // 1. Golden Gate Bridge (North across the strait, towering International Orange Art-Deco towers + catenary cables visible down N-S avenues!)
        function buildGoldenGateBridge() {
            const ggGroup = new THREE.Group();
            const intlOrange = new THREE.MeshStandardMaterial({ color: 0xf03c28, roughness: 0.38, metalness: 0.3 });
            const deckMat = new THREE.MeshStandardMaterial({ color: 0xc83222, roughness: 0.5 });

            const bridgeZ = 385;
            const towerXs = [-165, 25];

            towerXs.forEach(tx => {
                // Twin stepped art-deco tower legs towering above the hills
                for (let lz of [-13, 13]) {
                    const leg = new THREE.Mesh(new THREE.BoxGeometry(11, 300, 9), intlOrange);
                    leg.position.set(tx, 145, bridgeZ + lz);
                    ggGroup.add(leg);
                }
                // Horizontal Art-Deco portal struts
                for (let y of [80, 140, 200, 265]) {
                    const strut = new THREE.Mesh(new THREE.BoxGeometry(13, 9, 34), intlOrange);
                    strut.position.set(tx, y, bridgeZ);
                    ggGroup.add(strut);
                }
            });

            // Elevated roadway deck spanning across the northern horizon
            const deck = new THREE.Mesh(new THREE.BoxGeometry(880, 7, 30), deckMat);
            deck.position.set(-70, 62, bridgeZ);
            ggGroup.add(deck);

            // Parabolic main suspension cables & vertical suspenders
            const cableGeo = new THREE.CylinderGeometry(1.3, 1.3, 1, 8);
            const segs = 28;
            for (let side of [-13, 13]) {
                for (let i = 0; i < segs; i++) {
                    const t1 = i / segs;
                    const t2 = (i + 1) / segs;
                    const x1 = -440 + t1 * 740;
                    const x2 = -440 + t2 * 740;

                    const sag = (x) => {
                        if (x >= -165 && x <= 25) {
                            const u = (x - (-70)) / 95;
                            return 72 + u * u * 210;
                        } else if (x < -165) {
                            const u = (x - (-440)) / 275;
                            return 64 + u * u * 218;
                        } else {
                            const u = (300 - x) / 275;
                            return 64 + u * u * 218;
                        }
                    };
                    const p1 = new THREE.Vector3(x1, sag(x1), bridgeZ + side);
                    const p2 = new THREE.Vector3(x2, sag(x2), bridgeZ + side);
                    const len = p1.distanceTo(p2);
                    const seg = new THREE.Mesh(cableGeo, intlOrange);
                    seg.scale.set(1, len, 1);
                    seg.position.copy(p1).add(p2).multiplyScalar(0.5);
                    seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
                    ggGroup.add(seg);

                    // Vertical suspender ropes
                    if (i % 2 === 0) {
                        const h = p1.y - 62;
                        if (h > 4) {
                            const rope = new THREE.Mesh(new THREE.BoxGeometry(0.6, h, 0.6), intlOrange);
                            rope.position.set(x1, 62 + h / 2, bridgeZ + side);
                            ggGroup.add(rope);
                        }
                    }
                }
            }

            scene.add(ggGroup);
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
        // 7. Soft Low Marine Fog Banks rolling in from the Bay & Golden Gate
        function buildLowFogBanks() {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
            grad.addColorStop(0, 'rgba(235, 240, 248, 0.28)');
            grad.addColorStop(0.5, 'rgba(220, 230, 242, 0.12)');
            grad.addColorStop(1, 'rgba(220, 230, 242, 0.0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 128, 128);
            const fogTex = new THREE.CanvasTexture(canvas);

            const fogMat = new THREE.SpriteMaterial({
                map: fogTex,
                transparent: true,
                depthWrite: false
            });

            const coords = [
                [-260, 48, 520, 240, 65],
                [80, 52, 520, 260, 70],
                [460, 28, -120, 280, 60],
                [450, 30, 180, 280, 60],
                [390, 22, 20, 220, 50]
            ];
            coords.forEach(c => {
                const sp = new THREE.Sprite(fogMat);
                sp.position.set(c[0], c[1], c[2]);
                sp.scale.set(c[3], c[4], 1);
                scene.add(sp);
                fogBanks.push({ sprite: sp, baseX: c[0] });
            });
        }
=======
        // 7. Soft Low Marine Fog Banks rolling in over the distant Bay water only (never obscuring streets or landmarks)
        function buildLowFogBanks() {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
            grad.addColorStop(0, 'rgba(220, 232, 245, 0.14)');
            grad.addColorStop(0.5, 'rgba(210, 225, 240, 0.06)');
            grad.addColorStop(1, 'rgba(210, 225, 240, 0.0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 128, 128);
            const fogTex = new THREE.CanvasTexture(canvas);

            const fogMat = new THREE.SpriteMaterial({
                map: fogTex,
                transparent: true,
                depthWrite: false
            });

            const coords = [
                [-320, 18, 540, 180, 32],
                [560, 14, -220, 200, 30],
                [560, 14, 240, 200, 30]
            ];
            coords.forEach(c => {
                const sp = new THREE.Sprite(fogMat);
                sp.position.set(c[0], c[1], c[2]);
                sp.scale.set(c[3], c[4], 1);
                scene.add(sp);
                fogBanks.push({ sprite: sp, baseX: c[0] });
            });
        }
>>>>>>> REPLACE
<<<<<<< SEARCH
        // --- INITIALIZATION & GRAPHICS PIPELINE ---
        function init() {
            const container = document.getElementById('canvas-container');

            scene = new THREE.Scene();
            // Horizon-matched golden-hour SF marine haze
            scene.fog = new THREE.FogExp2(0xd8c8ba, 0.00115);

            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.25, 1300);

            renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 0.95;
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            container.appendChild(renderer.domElement);

            // Physical Sky (Golden-hour San Francisco sun + PMREM environment map for glossy car paint & glass)
            const sky = new Sky();
            sky.scale.setScalar(10000);
            scene.add(sky);

            const skyUniforms = sky.material.uniforms;
            skyUniforms['turbidity'].value = 6.5;
            skyUniforms['rayleigh'].value = 1.8;
            skyUniforms['mieCoefficient'].value = 0.005;
            skyUniforms['mieDirectionalG'].value = 0.82;

            const sunVec = new THREE.Vector3();
            const phi = THREE.MathUtils.degToRad(90 - 19); // Golden hour sun 19° above horizon
            const theta = THREE.MathUtils.degToRad(125);   // Casting warm light across SF hills & Bay Bridge
            sunVec.setFromSphericalCoords(1, phi, theta);
            skyUniforms['sunPosition'].value.copy(sunVec);

            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            scene.environment = pmremGenerator.fromScene(sky).texture;
            pmremGenerator.dispose();

            // Hemisphere fill light (cool marine sky above, warm asphalt/sandstone bounce below)
            const hemiLight = new THREE.HemisphereLight(0xc8dcf0, 0x6e6055, 0.95);
            scene.add(hemiLight);

            // Single shadow-casting directional sun that follows the player with tight frustum
            sunLight = new THREE.DirectionalLight(0xffe0b5, 3.0);
            sunLight.position.copy(sunVec).multiplyScalar(250);
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 2048;
            sunLight.shadow.mapSize.height = 2048;
            sunLight.shadow.camera.near = 10;
            sunLight.shadow.camera.far = 600;
            const sd = 135;
            sunLight.shadow.camera.left = -sd;
            sunLight.shadow.camera.right = sd;
            sunLight.shadow.camera.top = sd;
            sunLight.shadow.camera.bottom = -sd;
            sunLight.shadow.bias = -0.0005;
            scene.add(sunLight);
            scene.add(sunLight.target);

            // Post-Processing: RenderPass -> GTAOPass -> Restrained UnrealBloomPass -> OutputPass -> SMAAPass
            composer = new EffectComposer(renderer);
            const renderPass = new RenderPass(scene, camera);
            composer.addPass(renderPass);

            try {
                const gtaoPass = new GTAOPass(scene, camera, window.innerWidth, window.innerHeight);
                gtaoPass.output = GTAOPass.OUTPUT.Default;
                gtaoPass.blendIntensity = 0.45;
                composer.addPass(gtaoPass);
            } catch {}

            const bloomPass = new UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                0.38, // restrained strength: only emissives & lasers glow
                0.35,
                1.15  // high threshold so daylight sky & white car never wash out
            );
            composer.addPass(bloomPass);

            const outputPass = new OutputPass();
            composer.addPass(outputPass);

            const smaaPass = new SMAAPass(window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio());
            composer.addPass(smaaPass);
=======
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
>>>>>>> REPLACE
<<<<<<< SEARCH
            window.addEventListener('mousedown', () => { if (gameActive) keys.space = true; });
            window.addEventListener('mouseup', () => keys.space = false);
=======
            window.addEventListener('mousedown', () => { sound.init(); if (gameActive) keys.space = true; });
            window.addEventListener('mouseup', () => keys.space = false);
>>>>>>> REPLACE
<<<<<<< SEARCH
        function handleKey(e, isDown) {
            const code = e.code;
            // Dismiss modal automatically if player starts driving or firing with keyboard
            if (isDown && ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
                const overlay = document.getElementById('overlay');
                if (overlay && overlay.style.display !== 'none' && document.activeElement !== document.getElementById('name-input')) {
                    startGame();
                }
            }
=======
        function handleKey(e, isDown) {
            const code = e.code;
            if (isDown) sound.init();
            // Dismiss modal automatically if player starts driving or firing with keyboard
            if (isDown && ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
                const overlay = document.getElementById('overlay');
                if (overlay && overlay.style.display !== 'none' && document.activeElement !== document.getElementById('name-input')) {
                    startGame();
                }
            }
>>>>>>> REPLACE