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
    cometInterval: 3, // segundos
    cometSpeed: 0.01,
    rotationSpeed: 0.001,
    pulseInterval: 5, // A cada quantos segundos um novo pulso aleatório é criado
    pulseDuration: 12, // Duração de vida de um pulso
    pulseMaxRadius: 2.1, // Raio máximo que o pulso atinge
};

// --- Geometria e Material reutilizáveis para cometas (Otimização) ---
const cometGeometry = new THREE.SphereGeometry(0.01, 8, 8);
const cometMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

let pointsGeometry; // Geometria dos pontos do globo, acessível globalmente

// --- Inicialização da Cena ---
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

// --- Funções de Criação de Objetos ---

function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    const starVector = new THREE.Vector3();

    for (let i = 0; i < CONFIG.starCount; i++) {
        // OTIMIZAÇÃO: Gera o ponto diretamente em uma posição esférica.
        // É mais eficiente que gerar em um cubo e calcular a distância.
        starVector.set(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
        ).normalize().multiplyScalar((Math.random() * 500) + 100); // Raio entre 100 e 600

        starVertices.push(starVector.x, starVector.y, starVector.z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: CONFIG.starSize, transparent: true, opacity: 0.7 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

function createGlobePoints() {
    const vertices = [];
    const colors = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Disposição de Fibonacci
    for (let i = 0; i < CONFIG.pointCount; i++) {
        const y = 1 - (i / (CONFIG.pointCount - 1)) * 2;
        const radius = Math.sqrt(1 - y * y);
        const theta = phi * i;
        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;
        vertices.push(x * CONFIG.globeRadius, y * CONFIG.globeRadius, z * CONFIG.globeRadius);
        CONFIG.basePointColor.toArray(colors, i * 3); // Define a cor base inicial
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

function createPulse(elapsedTime, origin, color) {
    pulses.push({
        origin: origin || getRandomPointOnSphere(CONFIG.globeRadius),
        startTime: elapsedTime,
        color: color || new THREE.Color(`hsl(${Math.random() * 360}, 70%, 60%)`)
    });
}

// --- Funções Auxiliares ---
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

// --- Loop de Animação ---
const clock = new THREE.Clock();
let lastCometTime = 0;
let lastPulseTime = 0;

// OTIMIZAÇÃO: Crie objetos reutilizáveis fora do loop para evitar alocação de memória a cada quadro.
const pointPosition = new THREE.Vector3();
const finalColor = new THREE.Color();

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

        const currentPosition = c.curve.getPoint(Math.min(c.progress, 1));
        c.mesh.position.copy(currentPosition);

        // Fade in e fade out
        if (c.progress < 0.2) c.mesh.material.opacity = c.progress / 0.2;
        else if (c.progress > 0.8) c.mesh.material.opacity = 1.0 - (c.progress - 0.8) / 0.2;
        else c.mesh.material.opacity = 1.0;

        if (c.progress >= 1) {
            createPulse(elapsedTime, c.mesh.position, new THREE.Color(0xffffff));
            globeGroup.remove(c.mesh);
            // CORREÇÃO: Não dê dispose na geometria, pois ela é compartilhada!
            // c.mesh.geometry.dispose(); 
            c.mesh.material.dispose(); // O material foi clonado, então o dispose aqui está correto.
            comets.splice(i, 1);
        }
    }

    // --- Lógica dos Pulsos (ALTAMENTE OTIMIZADA) ---
    if (elapsedTime - lastPulseTime > CONFIG.pulseInterval) {
        createPulse(elapsedTime);
        lastPulseTime = elapsedTime;
    }

    const positions = pointsGeometry.attributes.position.array;
    const colors = pointsGeometry.attributes.color.array;

    // 1. Remove pulsos expirados
    for (let i = pulses.length - 1; i >= 0; i--) {
        if (elapsedTime - pulses[i].startTime > CONFIG.pulseDuration) {
            pulses.splice(i, 1);
        }
    }
    
    // 2. Itera por cada PONTO uma única vez
    for (let i = 0; i < CONFIG.pointCount; i++) {
        pointPosition.fromArray(positions, i * 3);
        finalColor.copy(CONFIG.basePointColor); // Começa com a cor base

        // 3. Verifica a influência de cada PULSO sobre o ponto atual
        for (let j = 0; j < pulses.length; j++) {
            const pulse = pulses[j];
            const pulseAge = elapsedTime - pulse.startTime;
            const currentRadius = (pulseAge / CONFIG.pulseDuration) * CONFIG.pulseMaxRadius;
            const falloff = 0.3;

            const distance = pointPosition.distanceTo(pulse.origin);

            if (distance <= currentRadius && distance >= currentRadius - falloff) {
                const intensity = 1 - (currentRadius - distance) / falloff;
                // Mistura a cor final com a cor do pulso, em vez de resetar
                finalColor.lerp(pulse.color, intensity);
            }
        }
        
        // 4. Escreve a cor final no buffer
        finalColor.toArray(colors, i * 3);
    }

    pointsGeometry.attributes.color.needsUpdate = true;

    renderer.render(scene, camera);
}

// Garante que o script só roda depois que o HTML estiver pronto
document.addEventListener('DOMContentLoaded', init);
