// --- Configuração Básica ---
let scene, camera, renderer;
let globeGroup; 
const radius = 1; 
const comets = []; 

function init() {
    const container = document.getElementById('globe-container');
    if (!container) return;

    // Cena
    scene = new THREE.Scene();

    // Câmera
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 2.2;

    // Renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Grupo do Globo
    globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // --- Fundo Estrelado ---
    const starGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        if (Math.sqrt(x*x + y*y + z*z) > 100) {
             starVertices.push(x, y, z);
        }
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, transparent: true, opacity: 0.8 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // --- Pontos do Globo ---
    const pointCount = 5000;
    const vertices = [];
    for (let i = 0; i < pointCount; i++) {
        const phi = Math.acos(-1 + (2 * i) / pointCount);
        const theta = Math.sqrt(pointCount * Math.PI) * phi;
        const x = radius * Math.cos(theta) * Math.sin(phi);
        const y = radius * Math.sin(theta) * Math.sin(phi);
        const z = radius * Math.cos(phi);
        vertices.push(x, y, z);
    }
    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const pointsMaterial = new THREE.PointsMaterial({ color: 0x4B8BBE, size: 0.005, transparent: true, opacity: 0.8 });
    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    globeGroup.add(points);

    // --- Linhas de Conexão ---
    const lineSegments = 100;
    const linePoints = [];
    const allPositions = pointsGeometry.attributes.position.array;
    for (let i = 0; i < lineSegments; i++) {
        const startIndex = Math.floor(Math.random() * pointCount);
        const endIndex = Math.floor(Math.random() * pointCount);
        linePoints.push(
            allPositions[startIndex * 3], allPositions[startIndex * 3 + 1], allPositions[startIndex * 3 + 2],
            allPositions[endIndex * 3], allPositions[endIndex * 3 + 1], allPositions[endIndex * 3 + 2]
        );
    }
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x4B8BBE, transparent: true, opacity: 0.05 });
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    globeGroup.add(lines);

    // --- Arcos de Luz (Cometas) ---
    setInterval(createComet, 2000);

    window.addEventListener('resize', onWindowResize, false);
}

function createComet() {
    const startPoint = getRandomPointOnSphere(radius);
    const endPoint = getRandomPointOnSphere(radius);
    const controlPoint = startPoint.clone().add(endPoint).multiplyScalar(0.5).normalize().multiplyScalar(radius * 1.5);
    const curve = new THREE.QuadraticBezierCurve3(startPoint, controlPoint, endPoint);

    const cometGeometry = new THREE.SphereGeometry(0.01, 8, 8);
    const cometMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1.0 });
    const comet = new THREE.Mesh(cometGeometry, cometMaterial);

    comets.push({ mesh: comet, curve: curve, progress: 0 });
    globeGroup.add(comet);
}

function getRandomPointOnSphere(r) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
}

function onWindowResize() {
    const container = document.getElementById('globe-container');
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    globeGroup.rotation.y += 0.0005;

    for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i];
        c.progress += 0.01;
        if (c.progress > 0.8) {
            c.mesh.material.opacity = 1.0 - (c.progress - 0.8) / 0.2;
        }
        if (c.progress >= 1) {
            globeGroup.remove(c.mesh);
            comets.splice(i, 1);
        } else {
            const point = c.curve.getPoint(c.progress);
            c.mesh.position.copy(point);
        }
    }
    renderer.render(scene, camera);
}

init();
animate();
