import * as THREE from "/build/three.module.js";
import { OrbitControls } from "/build/controls/OrbitControls.js";
import { createDroneFleet } from "./drone/createDroneFleet.js";
import { scene, camera, renderer, setScene, setSceneElements, setSceneLighting } from "/setup.js";
import { setupMusicControls } from "/music/musicUI.js";
import { createControls } from "./ui/controls.js";
import { createCustomShapeControls } from "./ui/customShapeControls.js";
import { createTimeline } from "./ui/timeline.js";

setScene();
setSceneElements();
setSceneLighting();
const musicControls = setupMusicControls();

const controls = new OrbitControls(camera, renderer.domElement);
const clock = new THREE.Clock();
const droneFleet = createDroneFleet(scene, 320);
let currentShape = "idle";

controls.enableDamping = true;

const shapeControls = createControls({
    droneFleet,
    onShapeSelected: setActiveShape
});

const customShapeControls = createCustomShapeControls({
    droneFleet,
    isCustomActive: () => currentShape === "custom",
    onCustomSelected: () => setActiveShape("custom")
});

const timeline = createTimeline({
    onShapeChange: (shape, clip) => setActiveShape(shape, false, clip),
    onMusicChange: (clip) => musicControls.playTrack(clip.musicTrackId),
    onMusicStop: () => musicControls.pause()
});

shapeControls.setActiveShape(currentShape);

function setActiveShape(shape, shouldOpenCustomPanel = true, timelineClip = null) {
    currentShape = shape;
    shapeControls.setActiveShape(shape);

    if (shape === "custom") {
        if (timelineClip?.customShapeId) {
            customShapeControls.applySavedShape(timelineClip.customShapeId);
            return;
        }

        if (shouldOpenCustomPanel) {
            customShapeControls.show();
        }

        customShapeControls.applyToFleetOrIdle();
        return;
    }

    customShapeControls.hide();
    droneFleet.setFormation(shape);
}

function updateScene() {
    const delta = clock.getDelta();

    timeline.update(delta);
    droneFleet.update(delta);
    controls.update();
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(updateScene);
