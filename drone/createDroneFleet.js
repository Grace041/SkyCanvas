import * as THREE from "/build/three.module.js";
import {
    getCustomShapePosition, getHeartPosition, getIdlePosition, getPlanetPosition, getStarPosition, getSpiralPosition,
    getMobiusPosition
} from "./dronePositions.js";
import { getBassLevel, getMidLevel, getTrebleLevel } from "../music/musicPlayer.js";

export function createDroneFleet(scene, droneCount) {
    const droneRadius = 10;
    const maxGlowLights = 24;
    const heartDroneCount = droneCount;
    const droneGeometry = new THREE.SphereGeometry(droneRadius, 20, 20);
    const droneMaterial = new THREE.MeshBasicMaterial({color: new THREE.Color("#ffffff")});
    const rotationAxis = new THREE.Vector3(0, 1, 0);
    const glowMaterial = new THREE.SpriteMaterial({
        map: createGlowTexture(),
        color: new THREE.Color("#ffffff"),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const drones = [];
    const baseTargets = [];
    const animationPositions = [];
    const formationTargets = [];
    const rotatedTarget = new THREE.Vector3();
    const droneGroup = new THREE.Group();

    let totalTime = 0;
    let currentFormation = "idle";
    let formationRotation = 0;
    let rotationSpeed = 0;
    let selectedColor = new THREE.Color("#ffffff");
    let customShapePoints = [];
    let customShapeDroneCount = droneCount;
    let breathingEnabled = true;
    let beatSyncEnabled = false;

    scene.add(droneGroup);

    for (let i = 0; i < droneCount; i += 1) {
        const idlePosition = getIdlePosition(i, droneCount);

        const drone = new THREE.Mesh(droneGeometry, droneMaterial.clone());
        drone.position.copy(idlePosition);
        drone.castShadow = true;

        const glow = new THREE.Sprite(glowMaterial.clone());
        glow.position.copy(drone.position);
        glow.scale.set(35, 35, 35);

        const glowLight = i < maxGlowLights ? new THREE.PointLight(new THREE.Color("#ffffff"), 0.18, 1.8) : null;

        if (glowLight) {
            glowLight.position.copy(drone.position);
        }

        droneGroup.add(glow);
        if (glowLight) {
            droneGroup.add(glowLight);
        }
        droneGroup.add(drone);

        drones.push({drone, glow, glowLight, targetPosition: idlePosition.clone()});
        baseTargets.push(idlePosition.clone());
        animationPositions.push(idlePosition.clone());
        formationTargets.push(idlePosition.clone());
    }

    return {
        setFormation(nextFormationName) {
            currentFormation = nextFormationName;

            formationRotation = 0;

            for (let i = 0; i < droneCount; i += 1) {
                let target;

                if (nextFormationName === "heart" && i < heartDroneCount) {
                    target = getHeartPosition(i, heartDroneCount);
                } else if (nextFormationName === "star") {
                    target = getStarPosition(i, droneCount);
                } else if (nextFormationName === "planet") {
                    target = getPlanetPosition(i, droneCount);
                } else if (nextFormationName === "spiral") {
                    target = getSpiralPosition(i, droneCount);
                } else if (nextFormationName === "mobius") {
                    target = getMobiusPosition(i, droneCount);
                } else if (nextFormationName === "custom" && i < customShapeDroneCount) {
                    target = getCustomShapePosition(i, customShapeDroneCount, customShapePoints);
                } else {
                    target = getIdlePosition(i, droneCount);
                }
                baseTargets[i].copy(target);
                formationTargets[i].copy(target);
            }

            updateDroneColors();
        },
        setCustomShape(shapePoints, shapeDroneCount = droneCount) {
            customShapePoints = shapePoints.map((point) => ({x: point.x, y: point.y}));
            customShapeDroneCount = THREE.MathUtils.clamp(Math.round(shapeDroneCount), 1, droneCount);
            this.setFormation("custom");
        },
        setRotationSpeed(nextRotationSpeed) {
            rotationSpeed = nextRotationSpeed;
        },
        setColor(nextColor) {
            selectedColor = new THREE.Color(nextColor);

            updateDroneColors();
        },
        setBreathing(enabled) {
            breathingEnabled = enabled;
        },
        setBeatSync(enabled) {
            beatSyncEnabled = enabled;
        },
        update(delta) {
            totalTime += delta;
            const baseSpeed = 1.6;
            let musicSpeedBoost = 0;

            if (beatSyncEnabled) {
                const bass = getBassLevel();
                musicSpeedBoost += bass * 1.5;
            }

            const moveSpeed = Math.min(1, delta * (baseSpeed + musicSpeedBoost));

            if (currentFormation === "heart" || currentFormation === "star" || currentFormation === "planet" || currentFormation === "custom" || currentFormation === "mobius") {
                formationRotation += delta * rotationSpeed;
            }

            for (let i = 0; i < droneCount; i += 1) {
                const currentDrone = drones[i];
                const displayPosition = getDisplayPosition(i, moveSpeed);
                let pulse;

                if (beatSyncEnabled) {
                    const bass = getBassLevel();
                    const mid = getMidLevel();
                    const treble = getTrebleLevel();

                    const hsl = { h: 0, s: 0, l: 0 };
                    selectedColor.getHSL(hsl);
                    const newHue = (hsl.h + mid * 0.08 - treble * 0.12 + 1) % 1;
                    const newSaturation = Math.min(1, hsl.s + bass * 0.3);
                    const newLightness = Math.min(1, hsl.l + bass * 0.25);
                    const reactiveColour = new THREE.Color().setHSL(newHue, newSaturation, newLightness);

                    for (let i = 0; i < droneCount; i++) {
                        setDroneColor(drones[i], reactiveColour);
                    }

                    for (let i = 0; i < droneCount; i++) {
                        if (currentFormation === "spiral") {
                            formationTargets[i].copy(getSpiralPosition(i, droneCount, totalTime));
                        } else if (currentFormation === "mobius") {
                            formationTargets[i].copy(getMobiusPosition(i, droneCount, totalTime));
                        }
                        baseTargets[i].lerp(formationTargets[i], 0.25);
                    }

                    if (bass > 0.6) {
                        for (let i = 0; i < droneCount; i++) {
                            const base = baseTargets[i]
                            const burstStrength = (bass - 0.4) * 1.2;
                            const outward = new THREE.Vector3(base.x, (base.y * 0.3), base.z).normalize();
                            base.x += outward.x * burstStrength;
                            base.y += outward.y * burstStrength;
                            base.z += outward.z * burstStrength;
                        }
                    }
                    pulse = 1 + (bass * bass) * 2;
                } else if (breathingEnabled === true) {
                    const breathingSpeed = 3;
                    const breathingExpanding = 0.3;
                    pulse = Math.sin(totalTime * breathingSpeed) * breathingExpanding + 1;
                } else {
                    pulse = 1;
                }

                if (currentFormation === "spiral") {
                    const dynamicTarget = getSpiralPosition(i, droneCount, totalTime);
                    baseTargets[i].copy(dynamicTarget);
                }
                if (currentFormation === "mobius") {
                    const dynamicTarget = getMobiusPosition(i, droneCount, totalTime);
                    baseTargets[i].copy(dynamicTarget);
                }

                currentDrone.drone.position.copy(displayPosition);
                currentDrone.glow.scale.set(pulse, pulse, pulse);
                currentDrone.glow.position.copy(currentDrone.drone.position);

                if (currentDrone.glowLight) {
                    currentDrone.glowLight.position.copy(currentDrone.drone.position);
                }
            }
        }
    };

    function updateDroneColors() {
        for (let i = 0; i < droneCount; i += 1) {
            setDroneColor(drones[i], selectedColor);
        }
    }

    function getDisplayPosition(i, moveSpeed) {
        animationPositions[i].lerp(baseTargets[i], moveSpeed);

        if (!shouldRotateDrone(i)) {
            return animationPositions[i];
        }

        return rotatedTarget.copy(animationPositions[i]).applyAxisAngle(rotationAxis, formationRotation);
    }

    function shouldRotateDrone(i) {
        if (currentFormation === "heart") {
            return i < heartDroneCount;
        }

        if (currentFormation === "custom") {
            return i < customShapeDroneCount;
        }

        return currentFormation === "star" || currentFormation === "planet" || currentFormation === "mobius";
    }
}

function setDroneColor(currentDrone, color) {
    currentDrone.drone.material.color.copy(color);
    currentDrone.glow.material.color.copy(color);
    if (currentDrone.glowLight) {
        currentDrone.glowLight.color.copy(color);
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
