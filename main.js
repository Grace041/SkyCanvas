import * as THREE from "./build/three.module.js";
import { createBackgroundPanel } from "./backgroundUI/backgroundPanel.js";
import {scene, camera, renderer, setScene, setSceneElements, setSceneLighting, loadBackgroundModels, addBackgroundModel, addFerrisWheel, addOperaHouse, getModelCount, getModelInfo, getSelectedModelTransform, chooseNextModel, chooseLastModel, setModelX, setModelY, setModelZ,setModelScale, setModelRotation, deleteSelectedModel, resetSelectedModel} from "./setup.js";
createBackgroundPanel();
setScene();
setSceneElements();
setSceneLighting();
const startTarget = new THREE.Vector3(-1500, 650, -20);
const startDirection = new THREE.Vector3();
startDirection.subVectors(startTarget, camera.position).normalize();
let yaw = Math.atan2(-startDirection.x, -startDirection.z);
let pitch = Math.asin(startDirection.y);
camera.rotation.order = "YXZ";
function updateCameraDirection(){
    camera.rotation.set(pitch, yaw, 0);
}
updateCameraDirection();
let isMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;
const mouseSpeed = 0.003;
renderer.domElement.addEventListener("mousedown", function (event){
    if(event.button === 0){
        isMouseDown = true;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    }
});
window.addEventListener("mouseup", function (){
    isMouseDown = false;
});
window.addEventListener("mousemove", function (event){
    if(!isMouseDown){
        return;
    }
    const movementX = event.clientX - lastMouseX;
    const movementY = event.clientY - lastMouseY;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    yaw -= movementX * mouseSpeed;
    pitch -= movementY * mouseSpeed;
    const maxPitch = Math.PI / 2 - 0.1;
    const minPitch = -Math.PI / 2 + 0.1;
    if(pitch > maxPitch){
        pitch = maxPitch;
    }

    if(pitch < minPitch){
        pitch = minPitch;
    }
    updateCameraDirection();
});
function updateModelInfo(){
    const modelInfo = document.querySelector("#model-info");
    modelInfo.textContent = "Selected Model: " + getModelInfo();
}
function updateSliderValues(){
    const transform = getSelectedModelTransform();
    document.querySelector("#xSlider").value = transform.x;
    document.querySelector("#ySlider").value = transform.y;
    document.querySelector("#zSlider").value = transform.z;
    document.querySelector("#scaleSlider").value = transform.scale;
    document.querySelector("#rotationSlider").value = transform.rotation;
    document.querySelector("#xValue").textContent = transform.x;
    document.querySelector("#yValue").textContent = transform.y;
    document.querySelector("#zValue").textContent = transform.z;
    document.querySelector("#scaleValue").textContent = transform.scale.toFixed(1);
    document.querySelector("#rotationValue").textContent = transform.rotation + "°";
}
function updateAllUI(){
    updateModelInfo();
    updateSliderValues();
}
loadBackgroundModels(updateAllUI);
function setupButtons(){
    document.querySelector("#addModel").addEventListener("click", function (){
        const offset = getModelCount() * 80;
        addBackgroundModel(1, offset, -10, -40, 0);
        updateAllUI();
    });
    document.querySelector("#addFerrisWheel").addEventListener("click", function (){
        addFerrisWheel(updateAllUI);
    });
    document.querySelector("#addOperaHouse").addEventListener("click", function (){
        addOperaHouse(updateAllUI);
    });
    document.querySelector("#prevModel").addEventListener("click", function (){
        chooseLastModel();
        updateAllUI();
    });
    document.querySelector("#nextModel").addEventListener("click", function (){
        chooseNextModel();
        updateAllUI();
    });
    document.querySelector("#deleteModel").addEventListener("click", function (){
        deleteSelectedModel();
        updateAllUI();
    });
    document.querySelector("#resetModel").addEventListener("click", function (){
        resetSelectedModel();
        updateAllUI();
    });
}
function setupSliders(){
    const xSlider = document.querySelector("#xSlider");
    const ySlider = document.querySelector("#ySlider");
    const zSlider = document.querySelector("#zSlider");
    const scaleSlider = document.querySelector("#scaleSlider");
    const rotationSlider = document.querySelector("#rotationSlider");
    const xValue = document.querySelector("#xValue");
    const yValue = document.querySelector("#yValue");
    const zValue = document.querySelector("#zValue");
    const scaleValue = document.querySelector("#scaleValue");
    const rotationValue = document.querySelector("#rotationValue");
    xSlider.addEventListener("input", function(){
        const value = Number(xSlider.value);
        setModelX(value);
        xValue.textContent = value;
    });
    ySlider.addEventListener("input", function(){
        const value = Number(ySlider.value);
        setModelY(value);
        yValue.textContent = value;
    });
    zSlider.addEventListener("input", function(){
        const value = Number(zSlider.value);
        setModelZ(value);
        zValue.textContent = value;
    });
    scaleSlider.addEventListener("input", function(){
        const value = Number(scaleSlider.value);
        setModelScale(value);
        scaleValue.textContent = value.toFixed(1);
    });
    rotationSlider.addEventListener("input", function(){
        const value = Number(rotationSlider.value);
        setModelRotation(value);
        rotationValue.textContent = value + "°";
    });
}
setupButtons();
setupSliders();
function updateScene(){
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(updateScene);
