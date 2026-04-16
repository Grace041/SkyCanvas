import * as THREE from "/build/three.module.js";
import { OrbitControls } from "/build/controls/OrbitControls.js";
import { scene, camera, renderer, setScene, setSceneElements, setSceneLighting } from "/setup.js";

setScene();
setSceneElements();
setSceneLighting();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
const clock = new THREE.Clock();

const droneFleet = createDroneFleet(50);
const formationSelect = document.querySelector("#formation-select");
const rotationSpeedInput = document.querySelector("#rotation-speed");

formationSelect.addEventListener("change", () => {
    droneFleet.setFormation(formationSelect.value);
});

rotationSpeedInput.addEventListener("input", () => {
    droneFleet.setRotationSpeed(Number(rotationSpeedInput.value));
});

droneFleet.setRotationSpeed(Number(rotationSpeedInput.value));

function updateScene() {
    const delta = clock.getDelta();

    droneFleet.update(delta);
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
    const drones = [];
    const baseTargets = [];
    const droneGroup = new THREE.Group();
    let currentFormation = "idle";
    let rotationSpeed = 0;

    scene.add(droneGroup);

    for (let i = 0; i < droneCount; i += 1) {
        const idlePosition = getIdlePosition(i);

        const drone = new THREE.Mesh(droneGeometry, droneMaterial.clone());
        drone.position.copy(idlePosition);
        drone.castShadow = true;

        const glow = new THREE.Sprite(glowMaterial.clone());
        glow.position.copy(drone.position);
        glow.scale.set(2.4, 2.4, 1);

        const glowLight = new THREE.PointLight(new THREE.Color("#ffffff"), 0.45, 4);
        glowLight.position.copy(drone.position);

        droneGroup.add(glow);
        droneGroup.add(glowLight);
        droneGroup.add(drone);

        drones.push({ drone, glow, glowLight });
        baseTargets.push(idlePosition.clone());
    }

    return {
        setFormation(formationName) {
            currentFormation = formationName;

            if (formationName === "idle") {
                droneGroup.rotation.y = 0;
            }

            for (let i = 0; i < droneCount; i += 1) {
                let target;

                if (formationName === "heart") {
                    target = getHeartPosition(i, droneCount);
                } else {
                    target = getIdlePosition(i);
                }

                baseTargets[i].copy(target);
            }
        },
        setRotationSpeed(nextRotationSpeed) {
            rotationSpeed = nextRotationSpeed;
        },
        update(delta) {
            const moveSpeed = Math.min(1, delta * 1.6);

            if (currentFormation === "heart") {
                droneGroup.rotation.y += delta * rotationSpeed;
            }

            for (let i = 0; i < droneCount; i += 1) {
                const currentDrone = drones[i];

                currentDrone.drone.position.lerp(baseTargets[i], moveSpeed);
                currentDrone.glow.position.copy(currentDrone.drone.position);
                currentDrone.glowLight.position.copy(currentDrone.drone.position);
            }
        }
    }
}

function getIdlePosition(i) {
    const rows = 5;
    const columns = 10;
    const spacing = 4;
    const droneRadius = 0.6;
    const floorY = -10;
    const row = Math.floor(i / columns);
    const column = i % columns;
    const x = (column - (columns - 1) / 2) * spacing;
    const z = (row - (rows - 1) / 2) * spacing;

    return new THREE.Vector3(x, floorY + droneRadius, z);
}

function getHeartPosition(i, droneCount) {
    const progress = i / droneCount;
    const angle = progress * Math.PI * 2;
    const layer = i % 5;
    const scale = 0.65;
    const heightOffset = 8;
    const depthSpacing = 1.2;

    const x = 16 * Math.pow(Math.sin(angle), 3);
    const y = 13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle);
    const z = (layer - 2) * depthSpacing;

    return new THREE.Vector3(
        x * scale,
        y * scale + heightOffset,
        z
    );
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
