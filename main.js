import * as THREE from "/build/three.module.js";
import { OrbitControls } from "/build/controls/OrbitControls.js";
import { scene, camera, renderer, setScene, setSceneElements, setSceneLighting } from "/setup.js";

setScene();
setSceneElements();
setSceneLighting();

const controls = new OrbitControls(camera, renderer.domElement);

function updateScene() {
    controls.update();
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(updateScene);
