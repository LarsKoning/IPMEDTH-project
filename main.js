import * as THREE from "three";
import GUI from "lil-gui";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import ThreeMeshUI from "three-mesh-ui";

let scene,
	camera,
	renderer,
	currentAnimation,
	gui,
	controls,
	backButtonBlock,
	container,
	raycaster,
	mouse,
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
	createUI();

	createBackButton();

	animate();

	// Add mouse event listener for desktop interaction
	window.addEventListener("click", onMouseClick);
	window.addEventListener("resize", onWindowResize);
}

function onEnterVR() {
	console.log("Entering VR mode");

	inVR = true;
	controls.enabled = true;

	// Set up container for VR mode
	const distance = -2; // Fixed distance for VR UI
	const height = 1.5; // Smaller height for VR UI panel
	const width = height * camera.aspect;

	if (container) {
		container.set({
			width: width,
			height: height,
		});

		container.position.set(0, 1, distance); // Positioned slightly above the user's line of sight
	}
}

function onExitVR() {
	console.log("Exiting VR mode");

	inVR = false;
	controls.enabled = false;

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

		buttonBlock.setupState({
			state: "hovered",
			attributes: {
				backgroundColor: new THREE.Color(0xe6e6e6),
				fontColor: new THREE.Color(0x0d275e),
			},
		});
		buttonBlock.setupState({
			state: "idle",
			attributes: {
				backgroundColor: new THREE.Color(0x0d275e),
				fontColor: new THREE.Color(0xe6e6e6),
			},
		});

		// Add a console log when the button is clicked
		buttonBlock.onSelect = () => {
			console.log(
				`Button "${option.label}" clicked. Scene ID: ${option.scene}`
			);
			loadScene(option.scene);
		};

		buttonBlock.isUI = true;
		intersectionObjects.push(buttonBlock);
		buttonContainer.add(buttonBlock);
	});

	container.add(buttonContainer);
}

function createBackButton() {
	// Create the back button UI block
	backButtonBlock = new ThreeMeshUI.Block({
		width: 0.9, // Increased width to fit the text comfortably
		height: 0.3, // Increased height to fit the text comfortably
		justifyContent: "center", // Center text horizontally
		alignItems: "center", // Center text vertically
		paddingLeft: 10, // No padding to avoid pushing text away from the center
		margin: 0, // No margin
		borderWidth: 0.01, // Border width
		borderRadius: 0.05, // Rounded corners
		backgroundColor: new THREE.Color(0xe6e6e6), // Background color
		borderColor: new THREE.Color(0x0d275e), // Border color
		fontFamily:
			"https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.json",
		fontTexture:
			"https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.png",
	});

	const backButtonText = new ThreeMeshUI.Text({
		content: "Back to Menu",
		fontSize: 0.12,
		fontColor: new THREE.Color(0x0d275e),
		fontWeight: "700",
	});

	backButtonBlock.add(backButtonText);

	// Add an onSelect function for the back button
	backButtonBlock.onSelect = () => {
		console.log("Back to menu button clicked.");
		console.log(window.innerHeight);
		console.log(window.innerWidth);
		showMenu();
	};

	backButtonBlock.isBackButton = true;
	intersectionObjects.push(backButtonBlock);

	// Dynamically position the back button at the top-left corner
	// Based on window dimensions
	const screenWidth = window.innerWidth;
	const screenHeight = window.innerHeight;

	// Set position in the left-top corner with a small offset
	const xPosition = -screenWidth / 384 - 0.5; // Left side with a little margin
	const yPosition = screenHeight / 384 + 0.2; // Top side with a little margin

	backButtonBlock.position.set(xPosition, yPosition, -1.5);
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
	directionalLight.position.set(5, 5, 5);
	scene.add(directionalLight);
}

function animate() {
	renderer.setAnimationLoop(() => {
		if (controls.enabled) {
			controls.update();
		}
		ThreeMeshUI.update(); // Update the UI each frame
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
			createScene0(scene, camera, renderer, gui);
			break;
		case "Objects":
			const { createScene1 } = await import("./scenes/Objects.js");
			createScene1(scene, camera, renderer, gui, controls);
			break;
		case "Panoramas":
			const { createScene2 } = await import("./scenes/Panoramas.js");
			createScene2(scene, camera, renderer, gui, controls);
			break;
		case "Pointcloud":
			const { createScene3 } = await import("./scenes/Pointcloud.js");
			createScene3(scene, camera, renderer, gui);
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
