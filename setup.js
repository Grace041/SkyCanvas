import * as THREE from "./build/three.module.js";
import {
    loadMountainBackground,
    setSceneElements as addSceneElements,
    setSceneLighting as addSceneLighting
} from "./background/sceneEnvironment.js";

export let scene;
export let camera;
export let renderer;

const resizeCallbacks = [];

export function setScene(){
    scene = new THREE.Scene();

    const renderView = document.querySelector(".render-view");
    const aspectRatio = renderView.clientWidth / renderView.clientHeight;

    camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 10000);
    camera.position.set(900, 200, 1000);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(renderView.clientWidth, renderView.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    scene.background = new THREE.Color("#000000");

    renderView.appendChild(renderer.domElement);

    loadMountainBackground(scene, camera);
}

export function setSceneElements(){
    addSceneElements(scene);
}

export function setSceneLighting(){
    addSceneLighting(scene, camera);
}

function resizeRenderView(){
    if(!renderer || !camera){
        return;
    }

    const renderView = document.querySelector(".render-view");
    const width = renderView.clientWidth;
    const height = renderView.clientHeight;

    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.render(scene, camera);

    for(const callback of resizeCallbacks){
        callback();
    }
}

window.addEventListener("resize", resizeRenderView);

export function onRenderViewResize(callback){
    resizeCallbacks.push(callback);
}
