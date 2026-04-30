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
const totalDroneCount = 320;

const droneFleet = createDroneFleet(scene, totalDroneCount);
const formationSelect = document.querySelector("#formation-select");
const rotationSpeedInput = document.querySelector("#rotation-speed");
const droneColorInput = document.querySelector("#drone-color");
const shapeCanvas = document.querySelector("#shape-canvas");
const shapeDroneCountInput = document.querySelector("#shape-drone-count");
const shapeDroneCountValue = document.querySelector("#shape-drone-count-value");
const applyShapeButton = document.querySelector("#apply-shape");
const clearShapeButton = document.querySelector("#clear-shape");
const shapeContext = shapeCanvas.getContext("2d");
const shapePoints = [];
let isDrawingShape = false;

formationSelect.addEventListener("change", () => {
    if (formationSelect.value === "custom" && shapePoints.length < 3) {
        formationSelect.value = "idle";
        droneFleet.setFormation("idle");
        return;
    }

    if (formationSelect.value === "custom") {
        droneFleet.setCustomShape(shapePoints, getShapeDroneCount());
        return;
    }

    droneFleet.setFormation(formationSelect.value);
});

rotationSpeedInput.addEventListener("input", () => {
    droneFleet.setRotationSpeed(Number(rotationSpeedInput.value));
});

droneColorInput.addEventListener("input", () => {
    droneFleet.setColor(droneColorInput.value);
});

shapeDroneCountInput.addEventListener("input", () => {
    shapeDroneCountValue.textContent = shapeDroneCountInput.value;

    if (formationSelect.value === "custom" && shapePoints.length >= 3) {
        droneFleet.setCustomShape(shapePoints, getShapeDroneCount());
    }
});

shapeCanvas.addEventListener("pointerdown", (event) => {
    isDrawingShape = true;
    shapeCanvas.setPointerCapture(event.pointerId);
    addShapePoint(event);
});

shapeCanvas.addEventListener("pointermove", (event) => {
    if (!isDrawingShape) {
        return;
    }

    addShapePoint(event);
});

shapeCanvas.addEventListener("pointerup", (event) => {
    isDrawingShape = false;
    shapeCanvas.releasePointerCapture(event.pointerId);
});

shapeCanvas.addEventListener("pointercancel", () => {
    isDrawingShape = false;
});

applyShapeButton.addEventListener("click", () => {
    if (shapePoints.length < 3) {
        return;
    }

    formationSelect.value = "custom";
    droneFleet.setCustomShape(shapePoints, getShapeDroneCount());
});

clearShapeButton.addEventListener("click", () => {
    shapePoints.length = 0;
    drawShapeCanvas();

    if (formationSelect.value === "custom") {
        formationSelect.value = "idle";
        droneFleet.setFormation("idle");
    }
});

droneFleet.setRotationSpeed(Number(rotationSpeedInput.value));
droneFleet.setColor(droneColorInput.value);
drawShapeCanvas();

function updateScene() {
    const delta = clock.getDelta();

    droneFleet.update(delta);
    controls.update();
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(updateScene);

function addShapePoint(event) {
    const canvasBounds = shapeCanvas.getBoundingClientRect();
    const x = (event.clientX - canvasBounds.left) / canvasBounds.width;
    const y = (event.clientY - canvasBounds.top) / canvasBounds.height;
    const lastPoint = shapePoints[shapePoints.length - 1];

    if (lastPoint && Math.hypot(lastPoint.x - x, lastPoint.y - y) < 0.01) {
        return;
    }

    shapePoints.push({
        x: THREE.MathUtils.clamp(x, 0, 1),
        y: THREE.MathUtils.clamp(y, 0, 1)
    });

    drawShapeCanvas();
}

function getShapeDroneCount() {
    return Number(shapeDroneCountInput.value);
}

function drawShapeCanvas() {
    const width = shapeCanvas.width;
    const height = shapeCanvas.height;

    shapeContext.clearRect(0, 0, width, height);
    drawShapeGrid(width, height);

    if (shapePoints.length === 0) {
        return;
    }

    shapeContext.lineWidth = 5;
    shapeContext.lineCap = "round";
    shapeContext.lineJoin = "round";
    shapeContext.strokeStyle = "#7df7ff";
    shapeContext.beginPath();
    shapeContext.moveTo(shapePoints[0].x * width, shapePoints[0].y * height);

    for (let i = 1; i < shapePoints.length; i += 1) {
        shapeContext.lineTo(shapePoints[i].x * width, shapePoints[i].y * height);
    }

    if (shapePoints.length > 2) {
        shapeContext.closePath();
    }

    shapeContext.stroke();

    shapeContext.fillStyle = "#ffffff";
    for (let i = 0; i < shapePoints.length; i += Math.max(1, Math.floor(shapePoints.length / 18))) {
        shapeContext.beginPath();
        shapeContext.arc(shapePoints[i].x * width, shapePoints[i].y * height, 3.2, 0, Math.PI * 2);
        shapeContext.fill();
    }
}

function drawShapeGrid(width, height) {
    shapeContext.fillStyle = "rgba(255, 255, 255, 0.04)";
    shapeContext.fillRect(0, 0, width, height);
    shapeContext.strokeStyle = "rgba(255, 255, 255, 0.12)";
    shapeContext.lineWidth = 1;

    for (let x = 0; x <= width; x += width / 4) {
        shapeContext.beginPath();
        shapeContext.moveTo(x, 0);
        shapeContext.lineTo(x, height);
        shapeContext.stroke();
    }

    for (let y = 0; y <= height; y += height / 4) {
        shapeContext.beginPath();
        shapeContext.moveTo(0, y);
        shapeContext.lineTo(width, y);
        shapeContext.stroke();
    }
}
