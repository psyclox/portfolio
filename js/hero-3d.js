document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("hero-3d-bg");
    if (!canvas) return;

    // SCENE, CAMERA, RENDERER
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a09); // Slightly warmer dark background matching Graffico Reference
    scene.fog = new THREE.FogExp2(0x0a0a09, 0.0035);

    const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, -10); // Start exact center inside the sphere

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // Enable shadows for 3D depth
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // RAYCASTER FOR MOUSE INTERACTION
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let mouseX = 0;
    let mouseY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    // Wipe Detection State
    let wipeCount = 0;
    let lastWipeDir = 0;
    let lastWipeTime = Date.now();
    let lastWipeX = 0;
    let isExploded = false;

    document.addEventListener("mousemove", (event) => {
        mouseX = (event.clientX - windowHalfX);
        mouseY = (event.clientY - windowHalfY);
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        if (!isExploded && typeof introTriggered !== 'undefined' && introTriggered) {
            const now = Date.now();
            const deltaX = mouseX - lastWipeX;

            // Need a fast swipe (moved more than 80 pixels)
            if (Math.abs(deltaX) > 80) {
                const dir = Math.sign(deltaX);
                // If direction reversed within 600ms
                if (dir !== lastWipeDir && now - lastWipeTime < 600) {
                    wipeCount++;
                    lastWipeDir = dir;
                    lastWipeTime = now;
                    lastWipeX = mouseX;

                    if (wipeCount >= 3 && typeof window.triggerWipeExplosion === 'function') {
                        window.triggerWipeExplosion();
                    }
                } else if (now - lastWipeTime >= 600) {
                    wipeCount = 1; // Reset to 1 (first swipe of a new chain)
                    lastWipeDir = dir;
                    lastWipeTime = now;
                    lastWipeX = mouseX;
                }
            }
        }
    });

    // 1. BACKGROUND PARTICLES (Static/Drifting Dust)
    const bgParticleCount = 600;
    const bgGeometry = new THREE.BufferGeometry();
    const bgPositions = new Float32Array(bgParticleCount * 3);
    const bgColors = new Float32Array(bgParticleCount * 3);

    const color1 = new THREE.Color(0xd7d3c5); // Beige
    const color2 = new THREE.Color(0x7c2626); // Crimson
    const color3 = new THREE.Color(0x192734); // Slate

    for (let i = 0; i < bgParticleCount * 3; i += 3) {
        bgPositions[i] = (Math.random() - 0.5) * 300;
        bgPositions[i + 1] = (Math.random() - 0.5) * 200;
        bgPositions[i + 2] = (Math.random() - 0.5) * 300 - 50;

        let mixedColor;
        const roll = Math.random();
        if (roll > 0.8) mixedColor = color1;
        else if (roll > 0.5) mixedColor = color2;
        else mixedColor = color3;

        bgColors[i] = mixedColor.r;
        bgColors[i + 1] = mixedColor.g;
        bgColors[i + 2] = mixedColor.b;
    }

    bgGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
    bgGeometry.setAttribute('color', new THREE.BufferAttribute(bgColors, 3));

    const sprite = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/disc.png');
    const bgMaterial = new THREE.PointsMaterial({
        size: 0.6,
        vertexColors: true,
        map: sprite,
        transparent: true,
        opacity: 0.6,
        depthWrite: false
    });

    const bgParticles = new THREE.Points(bgGeometry, bgMaterial);
    scene.add(bgParticles);

    // 2. EXPLODING ASSEMBLED GRAFFICO ORGANIC STRUCTURE
    const clusterGroup = new THREE.Group();
    clusterGroup.position.set(0, 0, -10); // Center
    scene.add(clusterGroup);

    // Graffico Palette
    const grafficoColors = [
        0xd7d3c5, // Beige/Offwhite
        0x7c2626, // Crimson Deep Red
        0x192734, // Dark Navy Slate
        0x6ab29b, // Muted Teal/Seafoam
        0xd9a13b  // Mustard/Ochre Yellow
    ];

    const pieceCount = 450; // Dense layer of varying pieces
    const pieces = [];

    // Helper functions for organic shapes
    // A. Bent/curved petal (Extruded shape)
    function createPetalGeometry(scale) {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.quadraticCurveTo(scale * 1, scale * 2, scale * 0, scale * 3);
        shape.quadraticCurveTo(scale * -1, scale * 2, 0, 0);

        const extrudeSettings = { depth: 0.05, bevelEnabled: false, steps: 2 };
        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        // Bend vertices manually for 3D curvature
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const z = pos.getZ(i);
            const y = pos.getY(i);
            // Bend Z based on Y height
            pos.setZ(i, z + Math.sin(y * 0.5) * scale * 0.5);
        }
        geo.computeVertexNormals();
        geo.center();
        return geo;
    }

    // B. Irregular torn triangle splinter
    function createSplinterGeometry(scale) {
        const geo = new THREE.BufferGeometry();
        // A thin, sharp, irregular triangle
        const vertices = new Float32Array([
            0, 0, 0,
            scale * (Math.random() * 0.5 + 0.1), scale * (Math.random() * 2 + 1), (Math.random() - 0.5) * 0.5,
            -scale * (Math.random() * 0.5 + 0.1), scale * (Math.random() * 1.5 + 0.5), (Math.random() - 0.5) * 0.5
        ]);
        geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geo.computeVertexNormals();
        geo.center();
        // Double sided
        const reverseVertices = new Float32Array(vertices.length);
        for (let i = 0; i < vertices.length; i += 9) {
            reverseVertices[i + 0] = vertices[i + 0]; reverseVertices[i + 1] = vertices[i + 1]; reverseVertices[i + 2] = vertices[i + 2];
            reverseVertices[i + 3] = vertices[i + 6]; reverseVertices[i + 4] = vertices[i + 7]; reverseVertices[i + 5] = vertices[i + 8];
            reverseVertices[i + 6] = vertices[i + 3]; reverseVertices[i + 7] = vertices[i + 4]; reverseVertices[i + 8] = vertices[i + 5];
        }
        const backGeo = new THREE.BufferGeometry();
        backGeo.setAttribute('position', new THREE.BufferAttribute(reverseVertices, 3));
        backGeo.computeVertexNormals();

        return THREE.BufferGeometryUtils ? THREE.BufferGeometryUtils.mergeBufferGeometries([geo, backGeo]) : geo;
        // Note: Without BufferGeometryUtils imported, we'll just use simple double-sided materials.
    }

    const sphereRadius = 25;

    for (let i = 0; i < pieceCount; i++) {
        // Fibonacci distribution for perfectly even sphere target
        const phi = Math.acos(1 - 2 * (i + 0.5) / pieceCount);
        const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

        const targetX = sphereRadius * Math.sin(phi) * Math.cos(theta);
        const targetY = sphereRadius * Math.sin(phi) * Math.sin(theta);
        const targetZ = sphereRadius * Math.cos(phi);

        // START PRE-ASSEMBLED: Pieces start exactly where they belong
        const startX = targetX;
        const startY = targetY;
        const startZ = targetZ;

        let mesh;
        const sizeScale = Math.random() * 2 + 0.5;

        // Pick random color
        const color = grafficoColors[Math.floor(Math.random() * grafficoColors.length)];

        // Shared Matte Material mimicking torn paper/shards
        const material = new THREE.MeshLambertMaterial({
            color: color,
            side: THREE.DoubleSide,
            flatShading: true, // Gives it that sharp paper/shard look
            transparent: true,
            opacity: Math.random() > 0.9 ? 0.6 : 1.0 // occasional translucent piece
        });

        // 60% small splinters/confetti, 40% large curved petals
        if (Math.random() > 0.4) {
            // Primitive approximation for splinters since BufferGeometryUtils isn't guaranteed
            const coneGeo = new THREE.ConeGeometry(sizeScale * 0.2, sizeScale * 3, 3);
            mesh = new THREE.Mesh(coneGeo, material);
        } else {
            const petalGeo = createPetalGeometry(sizeScale);
            mesh = new THREE.Mesh(petalGeo, material);
        }

        mesh.position.set(startX, startY, startZ);
        mesh.scale.set(1, 1, 1); // Start visible

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const targetRotX = Math.random() * Math.PI * 2;
        const targetRotY = Math.random() * Math.PI * 2;
        const targetRotZ = Math.random() * Math.PI * 2;

        mesh.userData = {
            targetPosition: new THREE.Vector3(targetX, targetY, targetZ),
            targetRotation: new THREE.Vector3(targetRotX, targetRotY, targetRotZ),
            velPosition: new THREE.Vector3(0, 0, 0),

            // Graffico Spring Properties
            tension: 0.01 + (Math.random() * 0.02), // Softer, more gentle spring tracking
            friction: 0.94 + (Math.random() * 0.03), // Higher friction to prevent chaotic bouncing
            blastDelay: Math.random() * 0.6
        };

        pieces.push(mesh);
        clusterGroup.add(mesh);
    }

    // Raycast hitBox
    const hitBoxGeo = new THREE.SphereGeometry(sphereRadius * 1.5, 16, 16);
    const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
    clusterGroup.add(hitBox);

    // ORGANIC LIGHTING (Crucial for matte geometry)
    const ambientLight = new THREE.AmbientLight(0xd7d3c5, 0.4); // Beige ambient
    scene.add(ambientLight);

    const dirLightFront = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLightFront.position.set(10, 20, 30);
    dirLightFront.castShadow = true;
    scene.add(dirLightFront);

    const dirLightBack = new THREE.DirectionalLight(0x7c2626, 0.5); // Crimson rim light
    dirLightBack.position.set(-10, -20, -30);
    scene.add(dirLightBack);

    // RESIZE EVENT
    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Control State
    let introTriggered = false;
    let introProgress = 0;

    // Start with the sphere slowly rotating to look dynamic before pull-out
    clusterGroup.rotation.y = Math.PI;

    window.addEventListener('loaderFinished', () => { triggerIntro(); });
    if (document.body.classList.contains('page-loaded')) { triggerIntro(); }

    function triggerIntro() {
        if (introTriggered) return;
        introTriggered = true;
    }

    window.triggerWipeExplosion = function () {
        if (isExploded) return;
        isExploded = true;

        // Remove collision hitBox so mouse repulsion stops entirely
        clusterGroup.remove(hitBox);
        hitBox.geometry.dispose();
        hitBox.material.dispose();

        pieces.forEach((piece, index) => {
            const data = piece.userData;

            // Blast direction outward from center
            const dir = new THREE.Vector3().copy(piece.position).normalize();
            // Add some randomness so it's not a perfect sphere blast
            dir.x += (Math.random() - 0.5) * 1.5;
            dir.y += (Math.random() - 0.5) * 1.5;
            dir.z += (Math.random() - 0.5) * 1.5;
            dir.normalize();

            // Gentle blast force so movement is trackable
            const force = 15 + Math.random() * 25; // Greatly reduced for smaller movement range

            data.velPosition.x = dir.x * force;
            data.velPosition.y = dir.y * force;
            data.velPosition.z = dir.z * force;

            // Reassign targets based on role
            if (index === 0 || index === 150 || index === 300) {
                // FOREGROUND STRAGGLERS (Exactly 3 pieces spread widely)
                data.targetPosition.set(
                    (Math.random() - 0.5) * 40,
                    (Math.random() - 0.5) * 30,
                    30 + Math.random() * 8 // Z=30 to 38 (camera at Z=45)
                );
                data.tension = 0.02; // floaty spring
                data.friction = 0.90;
            } else if (index % 2 === 0) {
                // AESTHETIC BACKGROUND (200+ pieces)
                data.targetPosition.set(
                    (Math.random() - 0.5) * 120,
                    (Math.random() - 0.5) * 80,
                    -10 - Math.random() * 50 // Closer background range for more visibility and better parallax
                );
                data.tension = 0.02;     // Normal pull
                data.friction = 0.85;    // Higher friction for a controlled settle
            } else {
                // THE REST (~335 pieces) - EXPLODE AND DISAPPEAR
                data.tension = 0;        // Turn off spring
                data.friction = 0.95;    // Slower continuous glide
                data.velPosition.multiplyScalar(0.4); // Even more tamed blast velocity
                data.vanish = true;
            }
        });
    };

    // ANIMATION LOOP
    let clock = new THREE.Clock();
    let time = 0;

    const repelRadius = 20; // Tighter radius to affect a smaller area on hover
    const repelForce = 2.5; // Even gentler push to preserve readability of foreground text

    function animate() {
        requestAnimationFrame(animate);

        const delta = Math.min(clock.getDelta(), 0.1); // Cap delta to prevent physics explosion on lag
        time += delta;

        // CAMERA PULL-OUT INTRO
        let baseCameraZ = -10; // Stay inside sphere initially
        if (introTriggered) {
            introProgress += delta * 0.3; // Approx 3.3 seconds to pull out
            if (introProgress > 1) introProgress = 1;

            // Smooth ease-in-out cubic for the camera pull back
            const easeInOut = introProgress < 0.5 ? 4 * introProgress * introProgress * introProgress : 1 - Math.pow(-2 * introProgress + 2, 3) / 2;
            baseCameraZ = -10 + (easeInOut * 55); // Pull back from -10 to +45
        }

        raycaster.setFromCamera(mouse, camera);

        let mouseInSphere = false;
        let intersectPoint = new THREE.Vector3();

        const intersects = raycaster.intersectObject(hitBox);
        if (intersects.length > 0) {
            mouseInSphere = true;
            intersectPoint = intersects[0].point;
        }

        // Move rim light subtly to mouse
        if (mouseInSphere) {
            dirLightFront.position.lerp(new THREE.Vector3(mouseX * 0.1, -mouseY * 0.1, 30), 0.1);
        }

        pieces.forEach((piece) => {
            let data = piece.userData;

            const dx = data.targetPosition.x - piece.position.x;
            const dy = data.targetPosition.y - piece.position.y;
            const dz = data.targetPosition.z - piece.position.z;

            data.velPosition.x += dx * data.tension;
            data.velPosition.y += dy * data.tension;
            data.velPosition.z += dz * data.tension;

            // MOUSE REPULSION
            if (mouseInSphere && !isExploded) {
                const worldPos = new THREE.Vector3().copy(piece.position).applyMatrix4(clusterGroup.matrixWorld);
                const distToMouse = worldPos.distanceTo(intersectPoint);

                if (distToMouse < repelRadius) {
                    const pushFactor = Math.pow((1 - (distToMouse / repelRadius)), 2) * repelForce;
                    const repelDir = new THREE.Vector3().subVectors(worldPos, intersectPoint).normalize();

                    data.velPosition.x += repelDir.x * pushFactor;
                    data.velPosition.y += repelDir.y * pushFactor;
                    data.velPosition.z += repelDir.z * pushFactor;

                    // Gentle rotation tickle instead of spinning wildly
                    piece.rotation.x += repelDir.y * 0.08;
                    piece.rotation.y += repelDir.x * 0.08;
                }
            }

            data.velPosition.multiplyScalar(data.friction);
            piece.position.add(data.velPosition);

            // Vanish logic for the excluded particles
            if (data.vanish) {
                if (piece.scale.x > 0.01) {
                    piece.scale.x *= 0.98;
                    piece.scale.y *= 0.98;
                    piece.scale.z *= 0.98;
                } else if (piece.visible) {
                    piece.visible = false;
                }
            }

            if (Math.abs(data.velPosition.length()) > 1.0) {
                piece.rotation.x += data.velPosition.z * 0.05;
                piece.rotation.y += data.velPosition.x * 0.05;
            } else if (!data.vanish) {
                piece.rotation.x += (data.targetRotation.x - piece.rotation.x) * 0.08;
                piece.rotation.y += (data.targetRotation.y - piece.rotation.y) * 0.08;
                piece.rotation.z += (data.targetRotation.z - piece.rotation.z) * 0.08;

                piece.position.y += Math.sin(time * 2 + piece.id) * 0.02;
            }
        });

        // Always rotate so the inside looks dynamic before pulling out
        clusterGroup.rotation.y += 0.001;
        clusterGroup.rotation.x = Math.sin(time * 0.3) * 0.05;
        clusterGroup.rotation.z = Math.cos(time * 0.2) * 0.03;

        bgParticles.rotation.y -= 0.0003;
        bgParticles.position.y += Math.sin(time * 0.3) * 0.02;

        let targetCamX = mouseX * 0.03;
        let targetCamY = mouseY * 0.03;

        camera.position.x += (targetCamX - camera.position.x) * 0.05;
        camera.position.y += (-targetCamY - camera.position.y) * 0.05;
        camera.position.z += (baseCameraZ - camera.position.z) * 0.05; // Lerp smoothly to base z
        camera.lookAt(0, 0, camera.position.z - 45); // Maintains consistent parallax angle without flipping

        renderer.render(scene, camera);
    }

    animate();
});
