import * as THREE from "/build/three.module.js";
import {getHeartPosition, getIdlePosition, getPlanetPosition} from "./dronePositions.js";

export function createDroneFleet(scene, droneCount) {
    const droneRadius = 0.25;
    const droneGeometry = new THREE.SphereGeometry(droneRadius, 20, 20);
    const droneMaterial = new THREE.MeshBasicMaterial({color: new THREE.Color("#ffffff")});
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
    let selectedColor = new THREE.Color("#ffffff");

    scene.add(droneGroup);

    for (let i = 0; i < droneCount; i += 1) {
        const idlePosition = getIdlePosition(i, droneCount);

        const drone = new THREE.Mesh(droneGeometry, droneMaterial.clone());
        drone.position.copy(idlePosition);
        drone.castShadow = true;

        const glow = new THREE.Sprite(glowMaterial.clone());
        glow.position.copy(drone.position);
        glow.scale.set(1, 1, 1);

        const glowLight = new THREE.PointLight(new THREE.Color("#ffffff"), 0.18, 1.8);
        glowLight.position.copy(drone.position);

        droneGroup.add(glow);
        droneGroup.add(glowLight);
        droneGroup.add(drone);

        drones.push({drone, glow, glowLight});
        baseTargets.push(idlePosition.clone());
    }

    return {
        setFormation(nextFormationName) {
            currentFormation = nextFormationName;

            if (nextFormationName === "idle") {
                droneGroup.rotation.y = 0;
            }

            for (let i = 0; i < droneCount; i += 1) {
                let target;

                if (nextFormationName === "heart") {
                    target = getHeartPosition(i, droneCount);
                } else if (nextFormationName === "planet") {
                    target = getPlanetPosition(i, droneCount);
                } else {
                    target = getIdlePosition(i, droneCount);
                }

                baseTargets[i].copy(target);
            }

            updateDroneColors();
        },
        setRotationSpeed(nextRotationSpeed) {
            rotationSpeed = nextRotationSpeed;
        },
        setColor(nextColor) {
            selectedColor = new THREE.Color(nextColor);

            updateDroneColors();
        },
        update(delta) {
            const moveSpeed = Math.min(1, delta * 1.6);

            if (currentFormation === "heart" || currentFormation === "planet") {
                droneGroup.rotation.y += delta * rotationSpeed;
            }

            for (let i = 0; i < droneCount; i += 1) {
                const currentDrone = drones[i];

                currentDrone.drone.position.lerp(baseTargets[i], moveSpeed);
                currentDrone.glow.position.copy(currentDrone.drone.position);
                currentDrone.glowLight.position.copy(currentDrone.drone.position);
            }
        }
    };

    function updateDroneColors() {
        for (let i = 0; i < droneCount; i += 1) {
            setDroneColor(drones[i], selectedColor);
        }
    }
}

function setDroneColor(currentDrone, color) {
    currentDrone.drone.material.color.copy(color);
    currentDrone.glow.material.color.copy(color);
    currentDrone.glowLight.color.copy(color);
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
