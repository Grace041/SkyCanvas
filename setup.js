import * as THREE from "./build/three.module.js";
import { OBJLoader } from "./build/loaders/OBJLoader.js";
export let scene;
export let camera;
export let renderer;
export function setScene() {
    scene = new THREE.Scene();
    const renderView = document.querySelector(".render-view");
    const aspectRatio = renderView.clientWidth / renderView.clientHeight;
    camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.1, 1000);
    camera.position.set(0, 5, 60);
    camera.lookAt(0,0,0);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(renderView.clientWidth, renderView.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene.background = new THREE.Color("#07142f");
    renderView.appendChild(renderer.domElement);
}
export function setSceneElements() {
    const planeGeometry = new THREE.PlaneGeometry(120,120);
    const planeMaterial = new THREE.MeshLambertMaterial(
        {
            color: 0xffffff,
            side: THREE.DoubleSide
        }
    );
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x += Math.PI/2;
    plane.position.y -= 10;
    plane.receiveShadow = true;
    scene.add(plane);
}
export function setSceneLighting() {
    const cameraLight = new THREE.PointLight(0xffffff, 0.5);
    camera.add(cameraLight);
    scene.add(camera);
    const ambientLight = new THREE.AmbientLight(0xffffff,0.3);
    scene.add(ambientLight);
}
function loadOneModel(path, scale, x, y, z, rotationY = 0) {
    const loader = new OBJLoader();
    loader.load(path, function (object) {
        object.scale.set(scale, scale, scale);
        object.position.set(x, y, z);
        object.rotation.y = rotationY;
        scene.add(object);
    });
}
export function loadBackgroundModels(){
    loadOneModel("./models/buildings/Ferris_wheel.obj", 0.08, -25, -10, -30, Math.PI / 2);
    //loadOneModel("./models/buildings/bridge.obj", 50, 0, 10, -20, Math.PI / 2);
    loadOneModel("./models/buildings/Castelia_City.obj", 0.0006, -20, -10.4, -10);
    loadOneModel("./models/buildings/Double_Stair.obj", 1, 20, -9, -10);
    loadOneModel("./models/buildings/Teleminora.obj", 0.5, 30, -10, -30);
}
function resizeRenderView() {
    const width = document.querySelector(".render-view").clientWidth;
    const height = document.querySelector(".render-view").clientHeight;
    renderer.setSize(width,height);
    camera.aspect = width/height;
    camera.updateProjectionMatrix();
    renderer.render(scene,camera);
}
window.addEventListener("resize", resizeRenderView);
