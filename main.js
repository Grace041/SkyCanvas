import * as THREE from "/build/three.module.js";
import { OrbitControls } from "/build/controls/OrbitControls.js";
import { scene, camera, renderer, setScene, setSceneElements, setSceneLighting } from "/setup.js";

setScene();
setSceneElements();
setSceneLighting();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

createDroneFleet(50);

function updateScene() {
    controls.update();
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(updateScene);

function createDroneFleet(droneCount) {
    const droneRadius = 0.6;
    const droneGeometry = new THREE.SphereGeometry(droneRadius, 32, 32);
    const droneMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color("#ffffff")
    });
    const glowMaterial = new THREE.SpriteMaterial({
        map: createGlowTexture(),
        color: new THREE.Color("#ffffff"),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const rows = 5;
    const columns = 10;
    const spacing = 5;
    const floorY = -10;

    for (let index = 0; index < droneCount; index += 1) {
        const row = Math.floor(index / columns);
        const column = index % columns;
        const x = (column - (columns - 1) / 2) * spacing;
        const z = (row - (rows - 1) / 2) * spacing;

        const drone = new THREE.Mesh(droneGeometry, droneMaterial.clone());
        drone.position.set(x, floorY + droneRadius, z);
        drone.castShadow = true;

        const glow = new THREE.Sprite(glowMaterial.clone());
        glow.position.copy(drone.position);
        glow.scale.set(2.4, 2.4, 1);

        const glowLight = new THREE.PointLight(new THREE.Color("#ffffff"), 0.45, 4);
        glowLight.position.copy(drone.position);

        scene.add(glow);
        scene.add(glowLight);
        scene.add(drone);
    }
}

function createGlowTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;

    const context = canvas.getContext("2d");
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.25, "rgba(255, 255, 255, 0.95)");
    gradient.addColorStop(0.45, "rgba(255, 255, 255, 0.35)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return texture;
}
