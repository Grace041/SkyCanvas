import * as THREE from "./build/three.module.js";
import{ OBJLoader } from "./build/loaders/OBJLoader.js";
import{ MTLLoader } from "./build/loaders/MTLLoader.js";
import{ GLTFLoader } from "./build/loaders/GLTFLoader.js";
import{ RGBELoader } from "./build/loaders/RGBELoader.js";

export let scene;
export let camera;
export let renderer;

const resizeCallbacks = [];

let cityModelTemplate = null;
let backgroundModels = [];
let selectedModelIndex = -1;

const floorY = -30;

const defaultCityTransform ={x: -1620, y: -10, z: -400, scale: 2, rotation: 6};
const defaultFerrisWheelTransform ={x: -900, y: 400, z: -500, scale: 25, rotation: 45};
const defaultOperaHouseTransform ={x: -2000, y: -10, z: -500, scale: 50, rotation: 30};
const defaultAirplaneTransform ={x: 0, y: 850, z: -50, scale: 45, rotation: 0};
const defaultAsianCityTransform ={x: -5000, y: -30, z: -1000, scale: 4, rotation: 0};
const defaultNightSkylineTransform ={x: -3000, y: -30, z: -700, scale: 10, rotation: 0};

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

    loadMountainBackground();
}

function loadMountainBackground(){
    const rgbeLoader = new RGBELoader();

    rgbeLoader.load("./models/buildings/MountainsMoon.hdr", function(texture){
        texture.mapping = THREE.EquirectangularReflectionMapping;

        scene.environment = texture;

        const skyGeometry = new THREE.SphereGeometry(9000, 64, 32);

        const skyMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
            depthWrite: false
        });

        const mountainSky = new THREE.Mesh(skyGeometry, skyMaterial);

        mountainSky.position.copy(camera.position);
        mountainSky.rotation.y = Math.PI;

        scene.add(mountainSky);
    });
}

export function setSceneElements(){
    const floorGeometry = new THREE.PlaneGeometry(20000, 20000);

    const floorMaterial = new THREE.MeshBasicMaterial({
        color: 0x030405,
        side: THREE.DoubleSide
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, floorY, 0);
    floor.receiveShadow = true;

    scene.add(floor);
}

export function setSceneLighting(){
    const cameraLight = new THREE.PointLight(new THREE.Color(1, 1, 1), 0.5);
    camera.add(cameraLight);
    scene.add(camera);

    const ambientLight = new THREE.AmbientLight(0x8899aa, 0.65);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0x6688bb, 0x111111, 0.45);
    scene.add(hemisphereLight);

    const moonLight = new THREE.DirectionalLight(0xffffff, 0.65);
    moonLight.position.set(300, 600, 400);
    scene.add(moonLight);
}

function applyNightLook(material){
    if(material.map){
        material.map.encoding = THREE.sRGBEncoding;
    }

    const materialName = material.name ? material.name.toLowerCase() : "";

    if(materialName.includes("edifs_cristal")){
        const textureLoader = new THREE.TextureLoader();
        textureLoader.setPath("./models/buildings/cityNight/");

        const windowLightMap = textureLoader.load("Luces color_Edifs_Cristal.png");
        windowLightMap.encoding = THREE.sRGBEncoding;

        material.emissive = new THREE.Color(0xffffcc);
        material.emissiveMap = windowLightMap;
        material.emissiveIntensity = 0.75;
    }

    if(material.shininess !== undefined){
        material.shininess = 40;
    }

    if(material.specular){
        material.specular = new THREE.Color(0x333333);
    }

    material.needsUpdate = true;
}

function prepareCityMaterial(object){
    object.traverse(function (child){
        if(child.isMesh && child.material){
            if(Array.isArray(child.material)){
                child.material.forEach(function (mat){
                    applyNightLook(mat);
                });
            }else{
                applyNightLook(child.material);
            }
        }
    });
}

function fixGLBMaterial(object){
    object.traverse(function (child){
        if(child.isMesh && child.material){
            if(Array.isArray(child.material)){
                child.material.forEach(function (mat){
                    if(mat.map){
                        mat.map.encoding = THREE.sRGBEncoding;
                    }

                    mat.side = THREE.DoubleSide;
                    mat.needsUpdate = true;
                });
            }else{
                if(child.material.map){
                    child.material.map.encoding = THREE.sRGBEncoding;
                }

                child.material.side = THREE.DoubleSide;
                child.material.needsUpdate = true;
            }
        }
    });
}

function saveStartTransform(model, transform){
    model.userData.defaultTransform ={x: transform.x, y: transform.y, z: transform.z, scale: transform.scale, rotation: transform.rotation};
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

function addGLBModel(fileName, modelName, defaultTransform, onLoaded){
    const gltfLoader = new GLTFLoader();

    gltfLoader.load("./models/buildings/" + fileName, function(gltf){
        const model = gltf.scene;

        fixGLBMaterial(model);

        model.position.set(defaultTransform.x, defaultTransform.y, defaultTransform.z);
        model.scale.set(defaultTransform.scale, defaultTransform.scale, defaultTransform.scale);
        model.rotation.y = THREE.MathUtils.degToRad(defaultTransform.rotation);

        model.userData.modelName = modelName;

        saveStartTransform(model, defaultTransform);

        scene.add(model);
        backgroundModels.push(model);

        selectedModelIndex = backgroundModels.length - 1;

        if(onLoaded){
            onLoaded();
        }
    }, undefined, function(error){
        console.log("Cannot load model: " + fileName);
        console.log(error);
    });
}

export function getModelCount(){
    return backgroundModels.length;
}

export function getModelInfo(){
    if(selectedModelIndex === -1){
        return "None";
    }

    const model = backgroundModels[selectedModelIndex];
    const modelName = model.userData.modelName || "Model";

    return modelName + " " + (selectedModelIndex + 1) + " / " + backgroundModels.length;
}

export function getSelectedModel(){
    if(selectedModelIndex === -1){
        return null;
    }

    return backgroundModels[selectedModelIndex];
}

export function getSelectedModelTransform(){
    const model = getSelectedModel();

    if(model === null){
        return{x: defaultCityTransform.x, y: defaultCityTransform.y, z: defaultCityTransform.z, scale: defaultCityTransform.scale, rotation: defaultCityTransform.rotation};
    }

    return{x: Math.round(model.position.x), y: Math.round(model.position.y), z: Math.round(model.position.z), scale: Number(model.scale.x.toFixed(1)), rotation: Math.round(THREE.MathUtils.radToDeg(model.rotation.y))};
}

export function addBackgroundModel(){
    if(cityModelTemplate === null){
        console.log("City model is still loading.");
        return;
    }

    const newModel = cityModelTemplate.clone(true);

    newModel.scale.set(defaultCityTransform.scale, defaultCityTransform.scale, defaultCityTransform.scale);
    newModel.position.set(defaultCityTransform.x, defaultCityTransform.y, defaultCityTransform.z);
    newModel.rotation.y = THREE.MathUtils.degToRad(defaultCityTransform.rotation);
    newModel.userData.modelName = "City";

    saveStartTransform(newModel, defaultCityTransform);

    scene.add(newModel);
    backgroundModels.push(newModel);

    selectedModelIndex = backgroundModels.length - 1;
}

export function addFerrisWheel(onLoaded){
    addGLBModel("ferriswheel.glb", "Ferris Wheel", defaultFerrisWheelTransform, onLoaded);
}

export function addOperaHouse(onLoaded){
    addGLBModel("sydney_opera_house.glb", "Opera House", defaultOperaHouseTransform, onLoaded);
}

export function addAirplane(onLoaded){
    addGLBModel("airplane_crj-900_cityjet.glb", "Airplane", defaultAirplaneTransform, onLoaded);
}

export function addAsianCity(onLoaded){
    addGLBModel("asian_city.glb", "Asian City", defaultAsianCityTransform, onLoaded);
}

export function addNightSkyline(onLoaded){
    addGLBModel("night_skyline.glb", "Night Skyline", defaultNightSkylineTransform, onLoaded);
}

export function chooseNextModel(){
    chooseModel(selectedModelIndex + 1);
}

export function chooseLastModel(){
    chooseModel(selectedModelIndex - 1);
}

export function setModelX(value){
    const model = getSelectedModel();

    if(model === null){
        return;
    }

    model.position.x = value;
}

export function setModelY(value){
    const model = getSelectedModel();

    if(model === null){
        return;
    }

    model.position.y = value;
}

export function setModelZ(value){
    const model = getSelectedModel();

    if(model === null){
        return;
    }

    model.position.z = value;
}

export function setModelScale(value){
    const model = getSelectedModel();

    if(model === null){
        return;
    }

    model.scale.set(value, value, value);
}

export function setModelRotation(value){
    const model = getSelectedModel();

    if(model === null){
        return;
    }

    model.rotation.y = THREE.MathUtils.degToRad(value);
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

    const defaultTransform = model.userData.defaultTransform;

    if(defaultTransform){
        model.position.set(defaultTransform.x, defaultTransform.y, defaultTransform.z);
        model.scale.set(defaultTransform.scale, defaultTransform.scale, defaultTransform.scale);
        model.rotation.set(0, THREE.MathUtils.degToRad(defaultTransform.rotation), 0);
    }else{
        model.position.set(0, -10, -40);
        model.scale.set(1, 1, 1);
        model.rotation.set(0, 0, 0);
    }
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
            prepareCityMaterial(object);
            cityModelTemplate = object;

            if(onLoaded){
                onLoaded();
            }
        });
    });
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