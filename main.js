import GUI from "lil-gui";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import ThreeMeshUI from "three-mesh-ui";

let scene,
  camera,
  controls,
  renderer,
  currentAnimation,
  gui,
  fileInput,
  backButtonBlock,
  container;
let raycaster, mouse, controller1, controller2;
const intersectionObjects = []; // Array to store interactive UI elements

export function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe6e6e6);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 2;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enabled = false;

  document.body.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));

  // Detect when VR starts
  renderer.xr.addEventListener("sessionstart", onEnterVR);

  // Detect when VR ends
  renderer.xr.addEventListener("sessionend", onExitVR);

  // Initialize raycaster and mouse
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Add VR controllers
  controller1 = renderer.xr.getController(0);
  controller2 = renderer.xr.getController(1);
  scene.add(controller1);
  scene.add(controller2);

  controller1.addEventListener("selectstart", onSelectStart);
  controller2.addEventListener("selectstart", onSelectStart);

  addLights();
  // createUI();
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  cube.position.set(0, 1.5, -2);
  scene.add(cube);
  

  // createBackButton(); // Create the back button (hidden initially)

  animate();

  // Add mouse event listener for desktop interaction
  window.addEventListener("click", onMouseClick);
  window.addEventListener("resize", onWindowResize);
}

function onEnterVR() {
  console.log("Entering VR mode");

  // Set up container for VR mode
  // const distance = -2; // Fixed distance for VR UI
  // const height = 1.5; // Smaller height for VR UI panel
  // const width = height * camera.aspect;

  // if (container) {
  //   container.set({
  //     width: width,
  //     height: height,
  //   });

  //   container.position.set(0, 1, distance); // Positioned slightly above the user's line of sight
  // }
}

function onExitVR() {
  console.log("Exiting VR mode");

  // Set up container for non-VR (site) mode
  const distance = -2;
  const height =
    4 * Math.tan((camera.fov * Math.PI) / 360) * Math.abs(distance);
  const width = height * camera.aspect;

  if (container) {
    container.set({
      width: width,
      height: height,
    });

    container.position.set(0, 0, distance); // Center the container in front of the camera
  }
}

// function createUI() {
//   const container = new ThreeMeshUI.Block({
//     width: 1,
//     height: 0.5,
//     padding: 0.05,
//     justifyContent: "center",
//     alignItems: "center",
//     fontFamily: "https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.json",
//     fontTexture: "https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.png",
//     backgroundColor: new THREE.Color(0x333333),
//     backgroundOpacity: 1,
//   });

//   const text = new ThreeMeshUI.Text({
//     content: "Hello, ThreeMeshUI!",
//     fontSize: 0.07,
//     fontColor: new THREE.Color(0xffffff),
//   });

//   container.add(text);
//   container.position.set(0, 1.5, -2);
//   scene.add(container);
// }


// function createBackButton() {
//   // Create the back button UI block
//   backButtonBlock = new ThreeMeshUI.Block({
//     width: 0.9, // Increased width to fit the text comfortably
//     height: 0.3, // Increased height to fit the text comfortably
//     justifyContent: "center", // Center text horizontally
//     alignItems: "center", // Center text vertically
//     paddingLeft: 10, // No padding to avoid pushing text away from the center
//     margin: 0, // No margin
//     borderWidth: 0.01, // Border width
//     borderRadius: 0.05, // Rounded corners
//     backgroundColor: new THREE.Color(0xe6e6e6), // Background color
//     borderColor: new THREE.Color(0x0d275e), // Border color
//     fontFamily:
//       "https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.json",
//     fontTexture:
//       "https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.png",
//   });

//   const backButtonText = new ThreeMeshUI.Text({
//     content: "Back to Menu",
//     fontSize: 0.12,
//     fontColor: new THREE.Color(0x0d275e),
//     fontWeight: "700",
//   });

//   backButtonBlock.add(backButtonText);

//   // Add an onSelect function for the back button
//   backButtonBlock.onSelect = () => {
//     console.log("Back to menu button clicked.");
//     console.log(window.innerHeight);
//     console.log(window.innerWidth);
//     showMenu();
//   };

//   backButtonBlock.isBackButton = true;
//   intersectionObjects.push(backButtonBlock);

//   // Position it at the top-left corner relative to the camera
//   // backButtonBlock.position.set(0, 0, -1.5);

//   // Dynamically position the back button at the top-left corner
//   // Based on window dimensions
//   const screenWidth = window.innerWidth;
//   const screenHeight = window.innerHeight;

//   // Set position in the left-top corner with a small offset
//   const xPosition = -screenWidth / 384 - 0.5; // Left side with a little margin
//   const yPosition = screenHeight / 384 + 0.2; // Top side with a little margin

//   backButtonBlock.position.set(xPosition, yPosition, -1.5);
// }

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(intersectionObjects, true);
  intersectionObjects.forEach((button) => {
    if (intersects.length > 0 && button === intersects[0].object.parent) {
      button.setState("hovered");
    } else {
      button.setState("idle");
    }
  });
}

function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(intersectionObjects, true);
  if (intersects.length > 0) {
    let button = intersects[0].object;

    // Traverse up to find the parent Block with onSelect
    while (button && !button.onSelect) {
      button = button.parent;
    }

    if (button && button.onSelect) {
      button.onSelect();
    }
  }
}

function onSelectStart(event) {
  const controller = event.target;
  const intersections = raycaster.intersectObjects(intersectionObjects, true);

  if (intersections.length > 0) {
    let button = intersections[0].object;

    // Traverse up to find the parent Block with onSelect
    while (button && !button.onSelect) {
      button = button.parent;
    }

    if (button && button.onSelect) {
      button.onSelect();
    }
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function addLights() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
}

function animate() {
  renderer.setAnimationLoop(() => {
    // ThreeMeshUI.update(); // Update UI each frame
    controls.update();    // Update OrbitControls if enabled
    renderer.render(scene, camera);
  });
}


export async function loadScene(sceneId) {
  // Clear previous scene
  while (scene.children.length > 0) {
    scene.remove(scene.children[0]);
  }

  intersectionObjects.length = 0; // Clear the intersection objects array

  if (currentAnimation) {
    cancelAnimationFrame(currentAnimation);
  }

  addLights();

  gui = new GUI();
  gui.title("Settings menu");

  scene.add(backButtonBlock);
  intersectionObjects.push(backButtonBlock);

  switch (sceneId) {
    case "Fotos":
      const { createScene0 } = await import("./scenes/Fotos.js");
      createScene0(scene, camera, renderer, gui, fileInput);
      break;
    case "Objects":
      const { createScene1 } = await import("./scenes/Objects.js");
      createScene1(scene, camera, renderer, gui, fileInput, controls);
      break;
    case "Panoramas":
      const { createScene2 } = await import("./scenes/Panoramas.js");
      createScene2(scene, camera, renderer, gui, controls);
      break;
    case "Pointcloud":
      const { createScene3 } = await import("./scenes/Pointcloud.js");
      createScene3(scene, camera, renderer, gui, fileInput);
      break;
  }
}

export function showMenu() {
  if (currentAnimation) {
    cancelAnimationFrame(currentAnimation);
  }

  while (scene.children.length > 0) {
    scene.remove(scene.children[0]);
  }

  if (gui) {
    gui.destroy(); // Only destroy if gui is defined
  }


  scene.add(container);
  controls.reset();
  controls.enabled = false;


  intersectionObjects.length = 0;
  container.children.forEach((child) => {
    if (child.isUI) {
      intersectionObjects.push(child);
    }
  });
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
