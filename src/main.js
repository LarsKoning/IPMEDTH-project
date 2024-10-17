import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRButton } from 'three/addons/webxr/VRButton.js';

// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(-50, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(new THREE.Color(0xe1e1ea));
renderer.setAnimationLoop(animate);
document.body.appendChild(VRButton.createButton(renderer));
document.body.appendChild(renderer.domElement);
renderer.xr.enabled = true;

// Lights
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.4);
directionalLight.position.set(0, 10, 10);
scene.add(directionalLight);

const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
scene.add(directionalLightHelper);

// Debug Panel Setup
const debugCanvas = document.createElement('canvas');
debugCanvas.width = 512;
debugCanvas.height = 256;
const debugCtx = debugCanvas.getContext('2d');

const debugTexture = new THREE.CanvasTexture(debugCanvas);
const debugMaterial = new THREE.MeshBasicMaterial({ 
  map: debugTexture,
  transparent: true,
  opacity: 0.8
});
const debugGeometry = new THREE.PlaneGeometry(2, 1);
const debugPanel = new THREE.Mesh(debugGeometry, debugMaterial);

// Platforms
const platformGeometry = new THREE.CylinderGeometry(5, 5, 1, 64);
const platformMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });

const positions = [
  { x: -50, y: -1.7, z: 0 },
  { x: 50, y: -1.7, z: 0 },
  { x: 0, y: -1.7, z: -70 },
  { x: 0, y: -1.7, z: 70 }
];

const platforms = positions.map(position => {
  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.position.set(position.x, position.y, position.z);
  scene.add(platform);
  return platform;
});

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.mouseButtons.RIGHT = false;
controls.listenToKeyEvents(window);
controls.keys = {
  LEFT: 'KeyA',
  UP: 'KeyW', 
  RIGHT: 'KeyD',
  BOTTOM: 'KeyS'
};

let counter = 0;

// Controllers
let controller1, controller2;
controller1 = renderer.xr.getController(0);
controller2 = renderer.xr.getController(1);
scene.add(controller1);
scene.add(controller2);

const cameraGroup = new THREE.Group();
cameraGroup.position.set(-5, -1.3, 0);
const Vector = new THREE.Vector3();

// Debug Panel Functions
function updateDebugPanel(gamepad) {
  debugCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  debugCtx.fillRect(0, 0, debugCanvas.width, debugCanvas.height);
  
  debugCtx.fillStyle = 'white';
  debugCtx.font = '24px Arial';
  
  if (gamepad.axes) {
    debugCtx.fillText(`Joystick X: ${gamepad.axes[2].toFixed(2)}`, 10, 30);
    debugCtx.fillText(`Joystick Y: ${gamepad.axes[3].toFixed(2)}`, 10, 60);
  }
  
  const buttonLabels = [
    'Trigger',
    'Grip',
    'Meta',
    'Stick Press',
    'A Button',
    'B Button',
    'Thumbrest'
  ];
  
  gamepad.buttons.forEach((button, index) => {
    const y = 90 + (index * 30);
    const state = button.pressed ? 'PRESSED' : (button.touched ? 'TOUCHED' : 'RELEASED');
    const value = button.value.toFixed(2);
    debugCtx.fillText(`${buttonLabels[index]}: ${state} (${value})`, 10, y);
  });
  
  debugTexture.needsUpdate = true;
}

// VR Session Events
renderer.xr.addEventListener('sessionstart', () => {
  if (gun) {
    gun.scale.set(0.1, 0.1, 0.1);
    scene.add(cameraGroup);
    cameraGroup.add(camera);
    
    // Position debug panel in front of user
    debugPanel.position.set(-1, 1.6, -2);
    cameraGroup.add(debugPanel);
  }

  platforms.forEach((platform, index) => {
    // Scale down the platforms (0.5x size in VR)
    platform.scale.set(0.1, 0.1, 0.1);

    // Move the platforms closer together (half the distance)
    const closerPositions = [
      { x: -5, y: 0, z: 0 },
      { x: 5, y: 0, z: 0 },
      { x: 0, y: 0, z: -10 },
      { x: 0, y: 0, z: 10 }
    ];

    platform.position.set(
      closerPositions[index].x,
      closerPositions[index].y,
      closerPositions[index].z
    );
  });
  
  controller1.addEventListener('connected', (event) => {
    if ('gamepad' in event.data) {
      if ('axes' in event.data.gamepad) {
        controller1.gamepad = event.data.gamepad;
        console.log(controller1.gamepad);
        
      }
    }
  });

  controller2.addEventListener('connected', (event) => {
    if ('gamepad' in event.data) {
      if ('axes' in event.data.gamepad) {
        controller2.gamepad = event.data.gamepad;
        console.log(controller2.gamepad);
        
      }
    }
  });
});

renderer.xr.addEventListener('sessionend', () => {
  if (gun) {
    gun.scale.set(1, 1, 1);
    scene.remove(cameraGroup);
    cameraGroup.remove(camera);
    camera.position.set(-50, 0, 0);
  }
});

// Gun Model Loading
const loader = new GLTFLoader();
let gun;

loader.load(
  "../public/gun.glb",
  function (gltf) {
    gun = gltf.scene;
    gun.scale.set(1, 1, 1);
    scene.add(gun);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

function handleJoystickMovement(xAxis, yAxis) {
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();

  camera.getWorldDirection(forward);
  right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

  forward.y = 0; // Keep forward direction flat
  right.y = 0;   // Keep right direction flat

  forward.normalize();
  right.normalize();

  const speed = 0.1; // Adjust speed as necessary

  const moveX = right.multiplyScalar(xAxis * speed);
  const moveZ = forward.multiplyScalar(-yAxis * speed);

  cameraGroup.position.add(moveX);
  cameraGroup.position.add(moveZ);

  controls.target.copy(cameraGroup.position); // Update the control target to the new position
}

function teleport() {
  let currentRotation;

  switch (counter) {
    case 1:
      cameraGroup.position.set(0, 0, -70);
      currentRotation = camera.rotation.set(-90, 0, 0);
      controls.target.set(0, 0, -70);
      break;
    case 2:
      cameraGroup.position.set(50, 0, 0);
      currentRotation = camera.rotation.set(0, -90, 0);
      controls.target.set(50, 0, 0);
      break;
    case 3:
      cameraGroup.position.set(0, 0, 70);
      currentRotation = camera.rotation.set(0, 135, 0);
      controls.target.set(0, 0, 70);
      break;
    case 0:
      cameraGroup.position.set(-50, 0, 0);
      currentRotation = camera.rotation.set(135, 90, 0);
      controls.target.set(-50, 0, 0);
      break;
  }

  camera.rotation.copy(currentRotation);
  controls.target.set(
    cameraGroup.position.x + Math.sin(currentRotation.y),
    cameraGroup.position.y,
    cameraGroup.position.z + Math.cos(currentRotation.y)
  );
}

// Action Functions
function shootGun() {
  debugPanel.material.color.setHex(0xff0000);
  setTimeout(() => debugPanel.material.color.setHex(0xffffff), 100);
}

function reloadGun() {
  debugPanel.material.color.setHex(0x00ff00);
  setTimeout(() => debugPanel.material.color.setHex(0xffffff), 100);
}

function moveToNextPlatform() {
  counter = (counter + 1) % 4;
  teleport();
}

// Animation Loop
function animate() {
  const currentPos = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z
  };

  if (controller1.gamepad) {
    updateDebugPanel(controller1.gamepad);
    
    const [xAxis, yAxis] = controller1.gamepad.axes;
    if (Math.abs(xAxis) > 0.1 || Math.abs(yAxis) > 0.1) {
      handleJoystickMovement(xAxis, yAxis);
    }

    controller1.gamepad.buttons.forEach((button, index) => {
      if (button.pressed) {
        switch (index) {
          case 0: // Trigger
            shootGun();
            break;
          case 1: // Grip
            reloadGun();
            break;
          case 3: // Stick Press
            moveToNextPlatform();
            break;
        }
      }
    });
  }

  if (controller2.gamepad) {
    updateDebugPanel(controller2.gamepad);

    const [xAxis, yAxis] = controller2.gamepad.axes;
    if (Math.abs(xAxis) > 0.1 || Math.abs(yAxis) > 0.1) {
      handleJoystickMovement(xAxis, yAxis);
    }

    controller2.gamepad.buttons.forEach((button, index) => {
      if (button.pressed) {
        switch (index) {
          case 0:
            moveToNextPlatform();
            break;
        }
      }
    });
  }

  controls.update();
  camera.position.set(currentPos.x, currentPos.y, currentPos.z);
  renderer.render(scene, camera);
}

// Keyboard Events
window.addEventListener('keydown', (event) => {
  if (event.key === 't') {
    counter = (counter + 1) % 4;
    teleport();
  } else if (event.key === 'd') {
    debugPanel.visible = !debugPanel.visible;
  }
});

window.addEventListener('gamepadconnected', function(event) {
  console.log('Gamepad connected:', event.gamepad);
});

window.addEventListener('gamepaddisconnected', function(event) {
  console.log('Gamepad disconnected:', event.gamepad);
});
