import {
  FBXLoader,
  GLTFLoader,
  OrbitControls,
  STLLoader,
  OBJLoader,
} from "three/examples/jsm/Addons.js";
import fs from "node:fs";
import path from "node:path";

export function createScene1(scene, camera, renderer, gui, fileInput) {
  const controls = new OrbitControls(camera, renderer.domElement);

  // Map of loaders for different file formats
  const loaderMap = {
    ".obj": new OBJLoader(),
    ".glb": new GLTFLoader(),
    ".fbx": new FBXLoader(),
    ".stl": new STLLoader(),
  };

  const filesList = [];
  const loadedObjects = {}; // To store loaded objects
  let currentObject = null; // Track currently displayed object

    fileInput.accept = '.obj, .glb, . fbx, .stl'
    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate the file type
            const fileExtension = await file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
            
            if(['.obj', '.glb', '.fbx', '.stl'].includes(fileExtension)) {
                console.log(`File uploaded: ${file.name}`);
                const fileURL = URL.createObjectURL(file);

      if ([".obj", ".glb", ".fbx", ".stl"].includes(fileExtension)) {
        console.log(`File uploaded: ${file.name}`);
        const fileURL = URL.createObjectURL(file);

        try {
          // Load object using appropriate loader
          const object = await new Promise((resolve, reject) => {
            loaderMap[fileExtension].load(
              fileURL,
              (loadedObjects) => resolve(loadedObjects),
              undefined,
              (error) => reject(error)
            );
          });

          loadedObjects[file.name] = object;

          // Remove placeholder if it's still in the list
          if (filesList[0] === "Upload an object first") {
            filesList.shift();
          }

          // Automatically display the uploaded object
          if (currentObject) {
            scene.remove(currentObject);
          }
          currentObject = object;
          scene.add(currentObject);
          selection.setValue(file.name); // Update dropdown to reflect current object

          filesList.push(file.name);
          selection.options(filesList);
          alert(`Successfully loaded: ${file.name}`);
        } catch (error) {
          alert(`Error loading file: ${file.name}`);
          console.error(error);
        }
      } else {
        alert(
          "Invalid file type. Please upload a .obj, .glb, .fbx or .stl file."
        );
      }
    }
  }
  });

  // Define settings for GUI
  const settings = {
    upload: function () {
      fileInput.click();
    },
    select: "Select",
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    castShadow: false,
    receiveShadow: false,
    autoRotate: false,
    rotationSpeed: 0.01,
    color: "#FFFFFF",
  };

  // Initiate the settings and put in folders (IN ORDER FROM TOP TO BOTTOM)
  // File management
  gui.add(settings, "upload").name("Upload 3D object");
  let selection = gui
    .add(settings, "select", filesList)
    .name("Select 3D object");

  // TODO: Reset gui when new model is loaded
  selection.onChange((selectedName) => {
    if (loadedObjects[selectedName]) {
      // Remove current object from the scene
      if (currentObject) {
        scene.remove(currentObject);
      }

      // Add the selected object to the scene
      currentObject = loadedObjects[selectedName];
      scene.add(currentObject);

      const box = new THREE.Box3();
      currentObject.traverse((child) => {
        if (child.isMesh) {
          box.expandByObject(child);
        }
      });

      if (!box.isEmpty()) {
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();

        box.getSize(size);
        box.getCenter(center);

        const maxDimension = Math.max(size.x, size.y, size.z);
        const desiredSize = 2;
        const scaleFactor = desiredSize / maxDimension;

        currentObject.scale.set(scaleFactor, scaleFactor, scaleFactor);

        currentObject.position.x = 0;
        currentObject.position.y = 0.5;
      }
    }
  });

  // Position, Rotation and Scale
  const position = gui.addFolder("Positie en aanpassingen");
  position
    .add(settings, "positionX", -10, 10)
    .name("Links - Rechts")
    .onChange(() => {
      if (currentObject) currentObject.position.x = settings.positionX;
    });
  position
    .add(settings, "positionY", -10, 10)
    .name("Omlaag - Omhaag")
    .onChange(() => {
      if (currentObject) currentObject.position.y = settings.positionY;
    });
  position
    .add(settings, "positionZ", -10, 10)
    .name("Zoom")
    .onChange(() => {
      if (currentObject) currentObject.position.z = settings.positionZ;
    });
  position
    .add(settings, "rotationY", 0, Math.PI * 2)
    .name("Draaien")
    .onChange(() => {
      if (currentObject) currentObject.rotation.y = settings.rotationY;
    });

  // Lighting and Shadows
  // TODO: Lighting isn't right yet
  const lighting = gui.addFolder("Belichting");
  // lighting.add(settings, 'castShadow').name('Schaduw omgeving').onChange(() => { if (currentObject) {currentObject.traverse((child) => { if (child.isMesh) { child.castShadow = settings.castShadow }}) }});
  // lighting.add(settings, 'receiveShadow').name('Schaduw object').onChange(() => { if (currentObject) {currentObject.traverse((child) => { if (child.isMesh) { child.receiveShadow = settings.receiveShadow }}) }});
  // lighting.addColor(settings, 'color').name('Kleur licht').onChange(() => { hemiLight.color.set(settings.color); dirLight.color.set(settings.color) });

  // Animations
  const animations = gui.addFolder("Animaties");
  animations.add(settings, "autoRotate").name("Automatisch draaien");
  animations.add(settings, "rotationSpeed", 0, 0.1).name("Draai snelheid");

  // TODO: Reset button, save states bij switchen?

  var inputs = document.getElementsByTagName("input");

  for (var i = 0; i < inputs.length; i++) {
    if (inputs[i].type.toLocaleLowerCase() == "checkbox") {
      const span = document.createElement("span");
      span.classList.add("slider");
      inputs[i].parentElement.appendChild(span);
    }
  }

  function animate() {
    if (settings.autoRotate && currentObject) {
      currentObject.rotation.y += settings.rotationSpeed;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}
