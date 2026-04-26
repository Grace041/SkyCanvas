import{ OrbitControls } from "./build/controls/OrbitControls.js";
import{scene, camera, renderer, setScene, setSceneElements, setSceneLighting, loadBackgroundModels} from "./setup.js";
setScene();
setSceneElements();
setSceneLighting();
loadBackgroundModels();
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
camera.position.set(900, 300, 900);
controls.target.set(-1500, 0, -20);
controls.update();
function updateScene(){
    controls.update();
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(updateScene);
