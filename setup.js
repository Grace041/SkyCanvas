import * as THREE from "./build/three.module.js";
import{ OBJLoader } from "./build/loaders/OBJLoader.js";
import{ MTLLoader } from "./build/loaders/MTLLoader.js";
export let scene;
export let camera;
export let renderer;
let modelTemplate = null;
let backgroundModels = [];
let selectedModelIndex = -1;
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
export function setSceneElements(){ //I plan to add flooring and other elements at a later stage
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
function prepareModelMaterial(object){
    object.traverse(function (child){
        if(child.isMesh && child.material){
            if(Array.isArray(child.material)){
                child.material.forEach(applyNightLook);
            }else{
                applyNightLook(child.material);
            }
        }
    });
}
function chooseModel(index){
    if(backgroundModels.length === 0){
        selectedModelIndex = -1;
        return;
    }
    if(index < 0){
        selectedModelIndex = backgroundModels.length - 1;
    }else if(index >= backgroundModels.length){
        selectedModelIndex = 0;
    }else{
        selectedModelIndex = index;
    }
}
export function getModelCount(){
    return backgroundModels.length;
}
export function getModelInfo(){
    if(selectedModelIndex === -1){
        return "None";
    }
    return(selectedModelIndex + 1) + " / " + backgroundModels.length;
}
export function getSelectedModel(){
    if(selectedModelIndex === -1){
        return null;
    }
    return backgroundModels[selectedModelIndex];
}
export function addBackgroundModel(scale = 1, x = 0, y = -10, z = -40, rotationY = 0){
    if(modelTemplate === null){
        console.log("Model is still loading.");
        return;
    }
    const newModel = modelTemplate.clone(true);
    newModel.scale.set(scale, scale, scale);
    newModel.position.set(x, y, z);
    newModel.rotation.y = rotationY;
    scene.add(newModel);
    backgroundModels.push(newModel);
    selectedModelIndex = backgroundModels.length - 1;
}
export function chooseNextModel(){
    chooseModel(selectedModelIndex + 1);
}
export function chooseLastModel(){
    chooseModel(selectedModelIndex - 1);
}
export function moveSelectedModel(x, y, z){
    const model = getSelectedModel();
    if(model === null){
        return;
    }
    model.position.x += x;
    model.position.y += y;
    model.position.z += z;
}
export function makeModelBigger(amount){
    const model = getSelectedModel();
    if(model === null){
        return;
    }
    const newScale = model.scale.x + amount;
    if(newScale < 0.1){
        return;
    }
    model.scale.set(newScale, newScale, newScale);
}

export function turnModel(amount){
    const model = getSelectedModel();
    if(model === null){
        return;
    }
    model.rotation.y += amount;
}
export function deleteSelectedModel(){
    const model = getSelectedModel();
    if(model === null){
        return;
    }
    scene.remove(model);
    backgroundModels.splice(selectedModelIndex, 1);
    if(backgroundModels.length === 0){
        selectedModelIndex = -1;
    }else if(selectedModelIndex >= backgroundModels.length){
        selectedModelIndex = backgroundModels.length - 1;
    }
}
export function resetSelectedModel(){
    const model = getSelectedModel();
    if(model === null){
        return;
    }
    model.position.set(0, -10, -40);
    model.scale.set(1, 1, 1);
    model.rotation.set(0, 0, 0);
}
export function loadBackgroundModels(onLoaded){
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
            prepareModelMaterial(object);
            modelTemplate = object;
            addBackgroundModel(1, 0, -10, -40, 0);
            if(onLoaded){
                onLoaded();
            }
        });
    });
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
