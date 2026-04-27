import * as THREE from "/build/three.module.js";
import { OrbitControls } from "/build/controls/OrbitControls.js";
import { createDroneFleet } from "./drone/createDroneFleet.js";
import { scene, camera, renderer, setScene, setSceneElements, setSceneLighting } from "/setup.js";

setScene();
setSceneElements();
setSceneLighting();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
const clock = new THREE.Clock();

const droneFleet = createDroneFleet(scene, 320);
const formationSelect = document.querySelector("#formation-select");
const rotationSpeedInput = document.querySelector("#rotation-speed");
const droneColorInput = document.querySelector("#drone-color");

formationSelect.addEventListener("change", () => {
    droneFleet.setFormation(formationSelect.value);
});

rotationSpeedInput.addEventListener("input", () => {
    droneFleet.setRotationSpeed(Number(rotationSpeedInput.value));
});

droneColorInput.addEventListener("input", () => {
    droneFleet.setColor(droneColorInput.value);
});

droneFleet.setRotationSpeed(Number(rotationSpeedInput.value));
droneFleet.setColor(droneColorInput.value);

function updateScene() {
    const delta = clock.getDelta();

    droneFleet.update(delta);
    controls.update();
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(updateScene);
