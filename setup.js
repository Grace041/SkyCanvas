import * as THREE from "./build/three.module.js";
import{ OBJLoader } from "./build/loaders/OBJLoader.js";
import{ MTLLoader } from "./build/loaders/MTLLoader.js";
export let scene;
export let camera;
export let renderer;
export function setScene(){
    scene = new THREE.Scene();
    const renderView = document.querySelector(".render-view");
    const aspectRatio = renderView.clientWidth / renderView.clientHeight;
    camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 10000);
    camera.position.set(0, 1000, 120);
    camera.lookAt(0, 15, -40);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(renderView.clientWidth, renderView.clientHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.6;
    scene.background = new THREE.Color("#000000");
    renderView.appendChild(renderer.domElement);
}
export function setSceneLighting(){
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);
    const hemisphereLight = new THREE.HemisphereLight(0x8899aa, 0x111111, 0.35);
    scene.add(hemisphereLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.45);
    directionalLight.position.set(20, 30, 20);
    scene.add(directionalLight);
}
function applyNightLook(material){
    if(material.map){
        material.map.encoding = THREE.sRGBEncoding;
    }
    if(material.emissiveMap){
        material.emissive = new THREE.Color(0xffffff);
        material.emissiveIntensity = 2.5;
    }
    if(material.emissive && !material.emissiveMap){
        material.emissiveIntensity = 1.5;
    }
    if(material.metalness !== undefined){
        material.metalness = 0.1;
    }
    if(material.roughness !== undefined){
        material.roughness = 0.8;
    }
    material.needsUpdate = true;
}
function loadOneObjModel(scale, x, y, z, rotationY = 0){
    const mtlLoader = new MTLLoader();
    mtlLoader.setMaterialOptions({ side: THREE.DoubleSide });
    mtlLoader.setPath("./models/buildings/cityNight/");
    mtlLoader.setResourcePath("./models/buildings/cityNight/");
    mtlLoader.load("gg.mtl", function (materials){
        materials.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath("./models/buildings/cityNight/");
        objLoader.load("gg.obj", function (object){
            object.scale.set(scale, scale, scale);
            object.position.set(x, y, z);
            object.rotation.y = rotationY;
            scene.add(object);
        });
    });
}
export function loadBackgroundModels(){
    loadOneObjModel(1, 0, -10, -40, 0);
}
function resizeRenderView(){
    const width = document.querySelector(".render-view").clientWidth;
    const height = document.querySelector(".render-view").clientHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
}
window.addEventListener("resize", resizeRenderView);
