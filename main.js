import * as THREE from "/build/three.module.js";
import { OrbitControls } from "/build/controls/OrbitControls.js";
import { GUI } from "/build/gui/lil-gui.module.min.js";
import { createDroneFleet } from "./drone/createDroneFleet.js";
import { scene, camera, renderer, setScene, setSceneElements, setSceneLighting, onRenderViewResize } from "/setup.js";

setScene();
setSceneElements();
setSceneLighting();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
const clock = new THREE.Clock();
const totalDroneCount = 320;

const droneFleet = createDroneFleet(scene, totalDroneCount);
const shapePanel = document.querySelector("#shape-controls");
const shapeCanvas = document.querySelector("#shape-canvas");
const shapeDroneCountValue = document.querySelector("#shape-drone-count-value");
const shapeDroneCountInput = document.querySelector("#shape-drone-count");
const applyShapeButton = document.querySelector("#apply-shape");
const clearShapeButton = document.querySelector("#clear-shape");
const shapeContext = shapeCanvas.getContext("2d");
const shapePoints = [];

let isDrawingShape = false;
let shapeController;
let drawShapeController;

const guiSettings = {
    shape: "idle",
    rotationSpeed: 0.5,
    droneColor: "#ffffff",
    shapeDroneCount: 160,
    drawCustomShape() {
        showShapePanel();
    }
};

setupGUI();

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

shapeDroneCountInput.addEventListener("input", () => {
    guiSettings.shapeDroneCount = Number(shapeDroneCountInput.value);
    shapeDroneCountValue.textContent = shapeDroneCountInput.value;

    if (guiSettings.shape === "custom" && shapePoints.length >= 3) {
        droneFleet.setCustomShape(shapePoints, getShapeDroneCount());
    }
});

applyShapeButton.addEventListener("click", () => {
    applyCustomShape();
});

clearShapeButton.addEventListener("click", () => {
    clearCustomShape();
});

droneFleet.setRotationSpeed(guiSettings.rotationSpeed);
droneFleet.setColor(guiSettings.droneColor);
shapeDroneCountValue.textContent = guiSettings.shapeDroneCount;
shapeDroneCountInput.value = guiSettings.shapeDroneCount;
drawShapeCanvas();

function updateScene() {
    const delta = clock.getDelta();

    droneFleet.update(delta);
    controls.update();
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(updateScene);

function setupGUI() {
    const gui = new GUI({title: "Sky Canvas"});

    shapeController = gui.add(guiSettings, "shape", {
        Idle: "idle",
        Heart: "heart",
        Star: "star",
        Planet: "planet",
        Custom: "custom"
    }).name("Shape");

    shapeController.onChange((shape) => {
        updateCustomShapeControls();

        if (shape === "custom" && shapePoints.length >= 3) {
            droneFleet.setCustomShape(shapePoints, getShapeDroneCount());
            return;
        }

        if (shape === "custom") {
            droneFleet.setFormation("idle");
            return;
        }

        droneFleet.setFormation(shape);
    });

    gui.add(guiSettings, "rotationSpeed", 0, 2, 0.1)
        .name("Rotation Speed")
        .onChange((rotationSpeed) => {
            droneFleet.setRotationSpeed(rotationSpeed);
        });

    gui.addColor(guiSettings, "droneColor")
        .name("Drone Colour")
        .onChange((droneColor) => {
            droneFleet.setColor(droneColor);
        });

    drawShapeController = gui.add(guiSettings, "drawCustomShape")
        .name("Draw Custom Shape");

    repositionGUI();
    updateCustomShapeControls();
    onRenderViewResize(repositionGUI);
}

function repositionGUI() {
    const guiDom = document.getElementsByClassName("lil-gui")[0];
    const renderView = document.getElementsByClassName("render-view")[0];
    const rect = renderView.getBoundingClientRect();

    guiDom.style.right = `${rect.left + 20}px`;
    guiDom.style.top = `${rect.top + 20}px`;
    shapePanel.style.right = `${rect.left + 20}px`;
    shapePanel.style.top = `${rect.top + guiDom.offsetHeight + 28}px`;
}

function updateCustomShapeControls() {
    const isCustomShape = guiSettings.shape === "custom";

    drawShapeController.show(isCustomShape);

    if (!isCustomShape) {
        hideShapePanel();
    }
}

function showShapePanel() {
    shapePanel.hidden = false;
    drawShapeCanvas();
    repositionGUI();
}

function hideShapePanel() {
    shapePanel.hidden = true;
}

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
    return Number(guiSettings.shapeDroneCount);
}

function applyCustomShape() {
    if (shapePoints.length < 3) {
        return;
    }

    guiSettings.shape = "custom";
    shapeController.updateDisplay();
    updateCustomShapeControls();
    droneFleet.setCustomShape(shapePoints, getShapeDroneCount());
}

function clearCustomShape() {
    shapePoints.length = 0;
    drawShapeCanvas();

    if (guiSettings.shape === "custom") {
        droneFleet.setFormation("idle");
    }
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
