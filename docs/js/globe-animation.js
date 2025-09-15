<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Globo 3D com Explosão de Dados</title>
    <style>
        body {
            margin: 0;
            background-color: #0d1117; /* Fundo escuro como o do GitHub */
            overflow: hidden;
        }
        #globe-container {
            width: 100vw;
            height: 100vh;
        }
    </style>
</head>
<body>
    <div id="globe-container"></div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script>
        // --- Elementos principais do Three.js ---
        let scene, camera, renderer, globeGroup;
        const comets = [];
        const pulses = [];

        // --- Configurações centralizadas para fácil ajuste ---
        const CONFIG = {
            globeRadius: 1,
            pointCount: 5000,
            pointSize: 0.006,
            basePointColor: new THREE.Color(0x4B8BBE), // Azul sutil como cor base
            lineOpacity: 0.1,
            starCount: 10000,
            starSize: 0.8,
            cometInterval: 2, // segundos
            cometSpeed: 0.01,
            rotationSpeed: 0.001,
            pulseInterval: 3, // A cada quantos segundos um novo pulso aleatório é criado
            pulseDuration: 12, // Duração de vida de um pulso (AUMENTADO +5s)
            pulseMaxRadius: 2.1, // Raio máximo que o pulso atinge
        };

        // --- Geometria e Material reutilizáveis para cometas (Otimização) ---
        const cometGeometry = new THREE.SphereGeometry(0.01, 8, 8);
        const cometMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });


        function init() {
            const container = document.getElementById('globe-container');
            if (!container) {
                console.error("O contêiner do globo não foi encontrado.");
                return;
            }

            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
            camera.position.z = 2.2;

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            container.appendChild(renderer.domElement);

            globeGroup = new THREE.Group();
            scene.add(globeGroup);

            createStars();
            createGlobePoints();
            createConnectionLines();

            window.addEventListener('resize', onWindowResize);
            animate();
        }

        function createStars() {
            const starGeometry = new THREE.BufferGeometry();
            const starVertices = [];
            for (let i = 0; i < CONFIG.starCount; i++) {
                const x = (Math.random() - 0.5) * 2000;
                const y = (Math.random() - 0.5) * 2000;
                const z = (Math.random() - 0.5) * 2000;
                if (Math.sqrt(x*x + y*y + z*z) > 100) {
                     starVertices.push(x, y, z);
                }
            }
            starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
            const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: CONFIG.starSize, transparent: true, opacity: 0.7 });
            const stars = new THREE.Points(starGeometry, starMaterial);
            scene.add(stars);
        }
        
        let pointsGeometry; 
        function createGlobePoints() {
            const vertices = [];
            const colors = [];
            const phi = Math.PI * (3 - Math.sqrt(5));
            for (let i = 0; i < CONFIG.pointCount; i++) {
                const y = 1 - (i / (CONFIG.pointCount - 1)) * 2;
                const radius = Math.sqrt(1 - y * y);
                const theta = phi * i;
                const x = Math.cos(theta) * radius;
                const z = Math.sin(theta) * radius;
                vertices.push(x * CONFIG.globeRadius, y * CONFIG.globeRadius, z * CONFIG.globeRadius);
                colors.push(CONFIG.basePointColor.r, CONFIG.basePointColor.g, CONFIG.basePointColor.b);
            }
            pointsGeometry = new THREE.BufferGeometry();
            pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            pointsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            
            const pointsMaterial = new THREE.PointsMaterial({ 
                size: CONFIG.pointSize, 
                transparent: true, 
                opacity: 0.8,
                vertexColors: true 
            });
            const points = new THREE.Points(pointsGeometry, pointsMaterial);
            globeGroup.add(points);
        }

        function createConnectionLines() {
            const lineSegments = 100;
            const linePoints = [];
            const allPositions = pointsGeometry.attributes.position.array;
            for (let i = 0; i < lineSegments; i++) {
                const startIndex = Math.floor(Math.random() * CONFIG.pointCount);
                const endIndex = Math.floor(Math.random() * CONFIG.pointCount);
                linePoints.push(
                    allPositions[startIndex * 3], allPositions[startIndex * 3 + 1], allPositions[startIndex * 3 + 2],
                    allPositions[endIndex * 3], allPositions[endIndex * 3 + 1], allPositions[endIndex * 3 + 2]
                );
            }
            const lineGeometry = new THREE.BufferGeometry();
            lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));
            const lineMaterial = new THREE.LineBasicMaterial({ color: CONFIG.basePointColor, transparent: true, opacity: CONFIG.lineOpacity });
            const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
            globeGroup.add(lines);
        }

        function createComet() {
            const startPoint = getRandomPointOnSphere(CONFIG.globeRadius);
            const endPoint = getRandomPointOnSphere(CONFIG.globeRadius);
            const controlPoint = startPoint.clone().add(endPoint).multiplyScalar(0.6).normalize().multiplyScalar(CONFIG.globeRadius * 1.6);
            const curve = new THREE.QuadraticBezierCurve3(startPoint, controlPoint, endPoint);
            const comet = new THREE.Mesh(cometGeometry, cometMaterial.clone());
            comet.material.opacity = 0;
            comets.push({ mesh: comet, curve: curve, progress: 0 });
            globeGroup.add(comet);
        }
        
        // Função atualizada para aceitar origem e cor opcionais
        function createPulse(elapsedTime, origin, color) {
             pulses.push({
                origin: origin || getRandomPointOnSphere(CONFIG.globeRadius),
                startTime: elapsedTime,
                color: color || new THREE.Color(`hsl(${Math.random() * 360}, 70%, 60%)`)
             });
        }

        function getRandomPointOnSphere(r) {
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);
            return new THREE.Vector3(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );
        }

        function onWindowResize() {
            const container = document.getElementById('globe-container');
            if (!container) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }

        const clock = new THREE.Clock();
        let lastCometTime = 0;
        let lastPulseTime = 0;

        function animate() {
            requestAnimationFrame(animate);

            const elapsedTime = clock.getElapsedTime();
            
            globeGroup.rotation.y += CONFIG.rotationSpeed;

            // --- Lógica dos Cometas ---
            if (elapsedTime - lastCometTime > CONFIG.cometInterval) {
                createComet();
                lastCometTime = elapsedTime;
            }
            
            for (let i = comets.length - 1; i >= 0; i--) {
                const c = comets[i];
                c.progress += CONFIG.cometSpeed;
                
                // Atualiza a posição antes de qualquer outra lógica
                const currentPosition = c.curve.getPoint(Math.min(c.progress, 1));
                c.mesh.position.copy(currentPosition);

                if (c.progress < 0.2) c.mesh.material.opacity = c.progress / 0.2;
                else if (c.progress > 0.8) c.mesh.material.opacity = 1.0 - (c.progress - 0.8) / 0.2;
                else c.mesh.material.opacity = 1.0;
                
                if (c.progress >= 1) {
                    // NOVO: Cria a explosão de dados na posição final do cometa
                    createPulse(elapsedTime, c.mesh.position, new THREE.Color(0xffffff));

                    // Remove o cometa da cena
                    globeGroup.remove(c.mesh); 
                    c.mesh.geometry.dispose(); 
                    c.mesh.material.dispose(); 
                    comets.splice(i, 1);
                }
            }

            // --- Lógica dos Pulsos de Cor ---
            if (elapsedTime - lastPulseTime > CONFIG.pulseInterval) {
                createPulse(elapsedTime);
                lastPulseTime = elapsedTime;
            }

            const positions = pointsGeometry.attributes.position.array;
            const colors = pointsGeometry.attributes.color.array;
            const pointPosition = new THREE.Vector3();
            
            for (let i = 0; i < CONFIG.pointCount; i++) {
                 CONFIG.basePointColor.toArray(colors, i * 3);
            }

            for (let i = pulses.length - 1; i >= 0; i--) {
                const pulse = pulses[i];
                const pulseAge = elapsedTime - pulse.startTime;
                if (pulseAge > CONFIG.pulseDuration) {
                    pulses.splice(i, 1);
                    continue;
                }
                
                const currentRadius = (pulseAge / CONFIG.pulseDuration) * CONFIG.pulseMaxRadius;
                const falloff = 0.3; 

                for (let j = 0; j < CONFIG.pointCount; j++) {
                    pointPosition.set(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
                    const distance = pointPosition.distanceTo(pulse.origin);
                    
                    if (distance <= currentRadius && distance >= currentRadius - falloff) {
                        const intensity = 1 - (currentRadius - distance) / falloff;
                        const targetColor = new THREE.Color().fromArray(colors, j * 3);
                        targetColor.lerp(pulse.color, intensity);
                        targetColor.toArray(colors, j * 3);
                    }
                }
            }
            pointsGeometry.attributes.color.needsUpdate = true;
            
            renderer.render(scene, camera);
        }
        
        init();

    </script>
</body>
</html>

