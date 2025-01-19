import GUI from 'lil-gui';
import { OrbitControls } from "three/examples/jsm/Addons.js";


let scene, camera, renderer, currentAnimation, gui, controls;

export function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xE6E6E6);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    camera.position.z = 5;
    addLights();
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false;
    controls.enableDamping = true;
    
    // Render the initial scene with the light gray background
    renderer.render(scene, camera);
}

function addLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
}

export async function loadScene(sceneId) {
    // Clear previous scene
    while(scene.children.length > 0) { 
        scene.remove(scene.children[0]); 
    }
    if(currentAnimation) {
        cancelAnimationFrame(currentAnimation);
    }
    addLights();

    // Initiate GUI
    gui = new GUI();
    gui.title("Settings menu");

    // Hide menu and show back button
    document.getElementById('menu').style.display = 'none';
    document.getElementById('backButton').style.display = 'block';

    // Dynamically import and load the scene
    switch(sceneId) {
        case 'Fotos':
            const { createScene0 } = await import('./scenes/Fotos.js');
            createScene0(scene, camera, renderer, gui);
            break;
        case 'Objects':
            const { createScene1 } = await import('./scenes/Objects.js');
            createScene1(scene, camera, renderer, gui, controls);
            break;
        case 'Panoramas':
            const { createScene2 } = await import('./scenes/Panoramas.js');
            createScene2(scene, camera, renderer, gui, controls);
            break;
        case 'Pointcloud':
            const { createScene3 } = await import('./scenes/Pointcloud.js');
            createScene3(scene, camera, renderer, gui);
            break;
    }
}

export function showMenu() {
    if(currentAnimation) {
        cancelAnimationFrame(currentAnimation);
    }

    while(scene.children.length > 0) { 
        scene.remove(scene.children[0]); 
        gui.destroy();

        controls.reset();
        controls.enabled = false;
    }

    document.getElementById('menu').style.display = 'flex';
    document.getElementById('backButton').style.display = 'none';
    addLights();

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
