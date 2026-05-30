import * as THREE from "../build/three.module.js";
import{ HDRLoader } from "../build/loaders/HDRLoader.js";

const floorY = -30;

export function loadMountainBackground(scene, camera){
    const rgbeLoader = new HDRLoader();

    rgbeLoader.load("./models/buildings/Mountains1.hdr", function(texture){
        texture.mapping = THREE.EquirectangularReflectionMapping;

        scene.background = texture;
        scene.environment = texture;
    });
}

export function setSceneElements(scene){
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

export function setSceneLighting(scene, camera){
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
