let scene, camera, renderer, currentAnimation;

export function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xD9D9D9); // Move this line up
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer( {antialias: true} );
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    camera.position.z = 5;
    addLights();
    
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
    scene.background = new THREE.Color(0xD9D9D9);

    // Hide menu and show back button
    document.getElementById('menu').style.display = 'none';
    document.getElementById('backButton').style.display = 'block';

    // Dynamically import and load the scene
    switch(sceneId) {
        case 'scene1':
            const { createScene1 } = await import('./scenes/scene1.js');
            createScene1(scene, camera, renderer);
            break;
        case 'scene2':
            const { createScene2 } = await import('./scenes/scene2.js');
            createScene2(scene, camera, renderer);
            break;
        case 'scene3':
            const { createScene3 } = await import('./scenes/scene3.js');
            createScene3(scene, camera, renderer);
            break;
    }
}

export function showMenu() {
    if(currentAnimation) {
        cancelAnimationFrame(currentAnimation);
    }

    while(scene.children.length > 0) { 
        scene.remove(scene.children[0]); 
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
