import GUI from "lil-gui";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { VRButton } from 'three/addons/webxr/VRButton.js';
import ThreeMeshUI from "three-mesh-ui";

let scene, camera, renderer, currentAnimation, gui, controls, backButtonBlock, container,
  raycaster = new THREE.Raycaster(),
  mouse = new THREE.Vector2(),
  controller1,
  controller2,
  inVR;

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

  // Initiate Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;

  document.body.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));

  // Initiate Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enabled = false;
  controls.enableDamping = true;

  // Detect when VR starts
  renderer.xr.addEventListener("sessionstart", onEnterVR);

  // Detect when VR ends
  renderer.xr.addEventListener("sessionend", onExitVR);


  // Add VR controllers
  controller1 = renderer.xr.getController(0);
  controller2 = renderer.xr.getController(1);

  controller1.add(createControllerRay());
  controller2.add(createControllerRay());

  scene.add(controller1);
  scene.add(controller2);

  controller1.addEventListener("selectstart", onSelectStart);
  controller2.addEventListener("selectstart", onSelectStart);
  addLights();
  createUI();

  createBackButton();

  animate();

  // Add mouse event listener for desktop interaction
  window.addEventListener("click", onMouseClick);
  window.addEventListener("resize", onWindowResize);

  // Set up the animation loop properly for WebXR
  renderer.setAnimationLoop(function () {
    if (controls.enabled) {
      controls.update();
    }
    renderer.render(scene, camera);
  });

  // Add this line to show the menu immediately
  showMenu();
}

function createControllerRay() {
  const rayGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1)
  ]);

  const rayMaterial = new THREE.LineBasicMaterial({
    color: 0x0000ff,
    linewidth: 2,
    opacity: 0.8,
    transparent: true
  });

  const rayLine = new THREE.Line(rayGeometry, rayMaterial);
  rayLine.name = 'controllerRay';
  rayLine.scale.z = .75; // 5 meter long ray

  return rayLine;
}

let lastHoveredButton = null; // Store the last hovered button to reset it

function updateControllerRays() {
  let hoveredThisFrame = false; // Track if something is hovered in this frame

  [controller1, controller2].forEach(controller => {
    const ray = controller.getObjectByName('controllerRay');

    if (ray && inVR) {
      raycaster.set(
        controller.position, 
        new THREE.Vector3(0, 0, -1).applyQuaternion(controller.quaternion)
      );

      const intersects = raycaster.intersectObjects(intersectionObjects, true);

      if (intersects.length > 0) {
        let button = intersects[0].object.parent; // Get the Block

        if (button && button.isUI) {
          if (lastHoveredButton !== button) {
            // Reset previous button
            if (lastHoveredButton && lastHoveredButton.onHover) {
              lastHoveredButton.onHover(false);
            }

            // Set new hovered button
            lastHoveredButton = button;
            if (button.onHover) {
              button.onHover(true);
            }
          }

          hoveredThisFrame = true; // Something was hovered
        }
      }
    }
  });

  // If no buttons were hovered, reset the last hovered button
  if (!hoveredThisFrame && lastHoveredButton) {
    if (lastHoveredButton.onHover) {
      lastHoveredButton.onHover(false);
    }
    lastHoveredButton = null;
  }
}




function onEnterVR() {
  console.log("Entering VR mode");

  inVR = true;
  controls.enabled = true;

  // Ensure controllers are properly assigned in XR mode
  controller1 = renderer.xr.getController(0);
  controller2 = renderer.xr.getController(1);

  // ✅ Ensure controllers have rays attached
  if (!controller1.getObjectByName("controllerRay")) {
    console.log("Quest 2 - Adding controllerRay to Controller 1");
    controller1.add(createControllerRay());
  }
  if (!controller2.getObjectByName("controllerRay")) {
    console.log("Quest 2 - Adding controllerRay to Controller 2");
    controller2.add(createControllerRay());
  }

  scene.add(controller1);
  scene.add(controller2);

  // Set up container for VR mode
  const scaleFactor = 0.1; // Scaling factor for all UI elements in VR

  if (container) {
    // Wait for next frame to ensure XR camera is initialized
    renderer.xr.getSession().requestAnimationFrame(() => {
      const xrCamera = renderer.xr.getCamera();
      const cameraHeight = xrCamera.position.y || 1.6; // Default to average VR height if not available

      // Position the container in front of the user at eye level
      container.position.set(0, cameraHeight, -1);

      // Scale the entire container
      container.scale.set(scaleFactor, scaleFactor, scaleFactor);

      // Make sure container is added to the scene
      if (!scene.children.includes(container)) {
        scene.add(container);
      }
    });
  }
}
function onExitVR() {
  console.log("Exiting VR mode");

  inVR = false;
  showMenu();

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

function createUI() {
  intersectionObjects.length = 0; // Clear old UI objects
  const distance = -2; // Distance from camera to container
  const height =
    4 * Math.tan((camera.fov * Math.PI) / 360) * Math.abs(distance); // Full visible height
  const width = height * camera.aspect;

  // Main container filling the screen
  container = new ThreeMeshUI.Block({
    width: width, // Slightly smaller width than the full screen for padding
    height: height, // Smaller height to give some top and bottom space
    padding: 0.05,
    justifyContent: "space-around",
    alignItems: "center",
    contentDirection: "column",
    fontFamily:
      "https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.json",
    fontTexture:
      "https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.png",
    backgroundColor: new THREE.Color(0xf2f2f2),
    backgroundOpacity: 1,
  });

  container.position.set(0, 0, distance); // Center container vertically at distance -2
  scene.add(container);

  // Title (h1 equivalent)
  const titleBlock = new ThreeMeshUI.Block({
    width: width * 0.9,
    height: 0.25,
    justifyContent: "center",
    alignItems: "center",
    backgroundOpacity: 0,
  });
  titleBlock.add(
    new ThreeMeshUI.Text({
      content: "Welkom bij casus: Apeldoorn huisje",
      fontSize: height / 22,
      fontColor: new THREE.Color(0x000000),
      fontWeight: "600",
    })
  );
  container.add(titleBlock);

  // Subtitle (h2 equivalent)
  const subtitleBlock = new ThreeMeshUI.Block({
    width: width * 0.9,
    height: height / 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundOpacity: 0,
  });
  subtitleBlock.add(
    new ThreeMeshUI.Text({
      content: "Kies een omgeving waarin u wilt werken.",
      fontSize: height / 28,
      fontColor: new THREE.Color(0x000000),
      fontWeight: "600",
    })
  );
  container.add(subtitleBlock);

  // Button container
  const buttonContainer = new ThreeMeshUI.Block({
    width: width * 0.9,
    height: height / 8,
    justifyContent: "space-around",
    alignItems: "center",
    contentDirection: "row",
    backgroundOpacity: 0,
  });

  const buttonOptions = [
    { label: "Foto's", scene: "Fotos" },
    { label: "3D objecten", scene: "Objects" },
    { label: "Panorama's", scene: "Panoramas" },
    { label: "Puntenwolken", scene: "Pointcloud" },
  ];

  buttonOptions.forEach((option) => {
    const buttonBlock = new ThreeMeshUI.Block({
      width: width / 7,
      height: height / 12,
      justifyContent: "center",
      alignItems: "center",
      margin: 0.02,
      padding: 0.02,
      backgroundColor: new THREE.Color(0x0d275e),
      borderRadius: 0.05,
      fontWeight: "700",
    });

    const buttonText = new ThreeMeshUI.Text({
      content: option.label,
      fontSize: 0.14,
      fontColor: new THREE.Color(0xe6e6e6),
    });

    buttonBlock.add(buttonText);

    buttonBlock.textElement = buttonText;

    intersectionObjects.push(buttonBlock);

    buttonBlock.onHover = (isHovering) => {
      if (isHovering) {
        buttonBlock.set({ backgroundColor: new THREE.Color(0xe6e6e6) });
        buttonText.set({ fontColor: new THREE.Color(0x0d275e) }); // Change text color
      } else {
        buttonBlock.set({ backgroundColor: new THREE.Color(0x0d275e) });
        buttonText.set({ fontColor: new THREE.Color(0xe6e6e6) }); // Reset text color
      }
    };

    // Ensure hover state affects both button and text
    buttonBlock.setState = function (state) {
      if (state === "hovered") {
        this.set({ backgroundColor: new THREE.Color(0xe6e6e6) });
        this.textElement.set({ fontColor: new THREE.Color(0x0d275e) }); // Change text color
      } else {
        this.set({ backgroundColor: new THREE.Color(0x0d275e) });
        this.textElement.set({ fontColor: new THREE.Color(0xe6e6e6) }); // Reset text color
      }
    };
    const buttonMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width / 7, height / 12), // Same as button dimensions
      new THREE.MeshBasicMaterial({ visible: false }) // Invisible but detectable
    );

    buttonBlock.add(buttonMesh);
    buttonBlock.mesh = buttonMesh;

    buttonBlock.isUI = true;
    intersectionObjects.push(buttonMesh);
    buttonMesh.onSelect = () => {
      console.log(`Button "${option.label}" clicked.`);
      loadScene(option.scene);
    };

    buttonContainer.add(buttonBlock);

    buttonBlock.geometry = new THREE.PlaneGeometry(0.5, 0.2);  // Give it a geometry
    buttonBlock.material = new THREE.MeshBasicMaterial({ visible: false });

    // Add a console log when the button is clicked
    buttonBlock.onSelect = () => {
      console.log(
        `Button "${option.label}" clicked. Scene ID: ${option.scene}`
      );
      loadScene(option.scene);
    };

    buttonBlock.isUI = true;

    buttonContainer.add(buttonBlock);
    // buttonContainer.isUI = true;
  });

  console.log("Updated Intersection Objects:", intersectionObjects);

  container.add(buttonContainer);
}

function createBackButton() {
  backButtonBlock = new ThreeMeshUI.Block({
    width: 0.5,
    height: 0.15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.01,
    borderRadius: 0.05,
    backgroundColor: new THREE.Color(0xdcdcdc),
    borderColor: new THREE.Color(0x0d275e),
    fontFamily: "https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.json",
    fontTexture: "https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.png",
  });

  const backButtonText = new ThreeMeshUI.Text({
    content: "Back to Menu",
    fontSize: 0.05,
    fontColor: new THREE.Color(0x0d275e),
  });

  backButtonBlock.add(backButtonText);

  // Add interaction logic
  backButtonBlock.onSelect = () => {
    console.log("Back to menu button clicked.");
    showMenu();
  };

  backButtonBlock.isBackButton = true;
  intersectionObjects.push(backButtonBlock);

  backButtonBlock.position.set(0, 1.5, -2);
}

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

  if (!controller) return;

  // Use global raycaster for intersection
  raycaster.set(
    controller.position,
    new THREE.Vector3(0, 0, -1).applyQuaternion(controller.quaternion)
  );

  const intersects = raycaster.intersectObjects(intersectionObjects, true);

  console.log("VR Intersections Found:", intersects.length);

  if (intersects.length > 0) {
    let button = intersects[0].object;

    // Traverse up to find the parent with onSelect
    while (button && !button.onSelect) {
      button = button.parent;
    }

    if (button && button.onSelect) {
      console.log(`VR - Clicking button: ${button.content || "Unknown"}`);
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
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);
}

function animate() {
  renderer.setAnimationLoop((timestamp, frame) => {
    if (controls.enabled) {
      controls.update();
    }

    if (frame) {
      const session = renderer.xr.getSession();
      const referenceSpace = renderer.xr.getReferenceSpace();
      session.inputSources.forEach((inputSource) => {
        // ✅ Ensure the controller is using a ray-based pointer
        if (inputSource.targetRayMode === "tracked-pointer") {
          const controller = inputSource === controller1 ? controller1 : controller2;
          const ray = controller.getObjectByName("controllerRay");

          if (ray) {
            const pose = frame.getPose(inputSource.targetRaySpace, referenceSpace);
            if (pose) {
              controller.position.copy(pose.transform.position);
              controller.quaternion.copy(pose.transform.orientation);
            }
          }
        } else {
          console.warn("Quest 2 - Controller is NOT using tracked-pointer mode!");
        }
      });
    }

    updateControllerRays();
    ThreeMeshUI.update();
    renderer.render(scene, camera);
  });
}




export async function loadScene(sceneId) {
  // Clear previous scene
  while (scene.children.length > 0) {
    scene.remove(scene.children[0]);
  }
  if (currentAnimation) {
    cancelAnimationFrame(currentAnimation);
  }
  addLights();

  intersectionObjects.length = 0; // Clear the intersection objects array

  // Initiate GUI
  gui = new GUI();
  gui.title("Settings menu");

  scene.add(backButtonBlock);
  intersectionObjects.push(backButtonBlock);

  switch (sceneId) {
    case "Fotos":
      const { createScene0 } = await import("./scenes/Fotos.js");
      createScene0(scene, camera, renderer, gui, inVR);
      break;
    case "Objects":
      const { createScene1 } = await import("./scenes/Objects.js");
      createScene1(scene, camera, renderer, gui, controls, inVR);
      break;
    case "Panoramas":
      const { createScene2 } = await import("./scenes/Panoramas.js");
      createScene2(scene, camera, renderer, gui, controls, inVR);
      break;
    case "Pointcloud":
      const { createScene3 } = await import("./scenes/Pointcloud.js");
      createScene3(scene, camera, renderer, gui, inVR);
      break;
  }
}

export function showMenu() {
  while (scene.children.length > 0) {
    scene.remove(scene.children[0]);

    if (currentAnimation) {
      cancelAnimationFrame(currentAnimation);
    }
    if (gui) {
      gui.destroy();
    }
    if (controls) {
      controls.reset();
      if (!inVR) {
        controls.enabled = false;
      }
    }
  }

  scene.add(container);
  intersectionObjects.length = 0;
  container.children.forEach((child) => {
    if (child.isUI) {
      intersectionObjects.push(child);
    }
  });

  addLights();
  animate();
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

