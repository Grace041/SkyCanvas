import * as THREE from "./build/three.module.js";
import {scene, camera, renderer, setScene, setSceneElements, setSceneLighting, loadBackgroundModels, addBackgroundModel, getModelCount, getModelInfo, chooseNextModel, chooseLastModel, moveSelectedModel, makeModelBigger, turnModel, deleteSelectedModel, resetSelectedModel} from "./setup.js";
setScene();
setSceneElements();
setSceneLighting();
camera.position.set(900, 300, 900);
const startTarget = new THREE.Vector3(-1500, 0, -20);
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
const moveStep = 20;
const scaleStep = 0.1;
const turnStep = 0.1;
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
loadBackgroundModels(updateModelInfo);
function setupEditorButtons(){
    document.querySelector("#addModel").addEventListener("click", function (){
        const offset = getModelCount() * 80;
        addBackgroundModel(1, offset, -10, -40, 0);
        updateModelInfo();
    });
    document.querySelector("#prevModel").addEventListener("click", function (){
        chooseLastModel();
        updateModelInfo();
    });
    document.querySelector("#nextModel").addEventListener("click", function (){
        chooseNextModel();
        updateModelInfo();
    });
    document.querySelector("#deleteModel").addEventListener("click", function (){
        deleteSelectedModel();
        updateModelInfo();
    });
    document.querySelector("#moveForward").addEventListener("click", function (){
        moveSelectedModel(0, 0, -moveStep);
    });
    document.querySelector("#moveBack").addEventListener("click", function (){
        moveSelectedModel(0, 0, moveStep);
    });
    document.querySelector("#moveLeft").addEventListener("click", function (){
        moveSelectedModel(-moveStep, 0, 0);
    });
    document.querySelector("#moveRight").addEventListener("click", function (){
        moveSelectedModel(moveStep, 0, 0);
    });
    document.querySelector("#moveUp").addEventListener("click", function (){
        moveSelectedModel(0, moveStep, 0);
    });
    document.querySelector("#moveDown").addEventListener("click", function (){
        moveSelectedModel(0, -moveStep, 0);
    });
    document.querySelector("#scaleUp").addEventListener("click", function (){
        makeModelBigger(scaleStep);
    });
    document.querySelector("#scaleDown").addEventListener("click", function (){
        makeModelBigger(-scaleStep);
    });
    document.querySelector("#rotateLeft").addEventListener("click", function (){
        turnModel(turnStep);
    });
    document.querySelector("#rotateRight").addEventListener("click", function (){
        turnModel(-turnStep);
    });
    document.querySelector("#resetModel").addEventListener("click", function (){
        resetSelectedModel();
        updateModelInfo();
    });
}
setupEditorButtons();
function updateScene(){
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(updateScene);
