import {
  FBXLoader,
  GLTFLoader,
  STLLoader,
  OBJLoader,
} from "three/examples/jsm/Addons.js";

import { getDownloadURL, listAll, getMetadata } from "firebase/storage";
import { objectsRef } from "../API.js";

export function createScene1(scene, camera, renderer, gui, controls) {
  controls.enabled = true;

  const loaderMap = {
    ".obj": new OBJLoader(),
    ".glb": new GLTFLoader(),
    ".fbx": new FBXLoader(),
    ".stl": new STLLoader(),
  };

  const filesList = ["Geen objecten beschikbaar"];
  const loadedObjects = {}; // To store loaded objects
  const objectSettings = {}; // To store settings for each object
  let currentObject = null;

  // Create a settings object that will be used by lil-gui
  const settings = {
    selectedObject: "Geen objecten beschikbaar",
    positionX: 0,
    positionY: 0.5,
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

  // Function to create default settings for an object
  function createDefaultSettings() {
    return {
      positionX: 0,
      positionY: 0.5,
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
  }

  // Function to apply settings to GUI controllers
  function applySettingsToGUI(settings) {
    Object.entries(settings).forEach(([key, value]) => {
      // Find and update the corresponding controller
      for (const folder of gui.folders) {
        const controller = folder.controllers.find((c) => c.property === key);
        if (controller) {
          controller.setValue(value);
        }
      }
    });
  }

  async function loadObjectsFromStorage() {
    try {
      showLoadingScreen();

      const result = await listAll(objectsRef);
      const promises = result.items.map(async (itemRef) => {
        const fileURL = await getDownloadURL(itemRef);
        const fileExtension = itemRef.name
          .slice(itemRef.name.lastIndexOf("."))
          .toLowerCase();
        const metadata = await getMetadata(itemRef);
        const fileSizeInMB = metadata.size / (1024 * 1024);

        return {
          name: itemRef.name,
          url: fileURL,
          extension: fileExtension,
          size: fileSizeInMB,
        };
      });

      const files = await Promise.all(promises);
      const supportedFiles = files.filter((file) =>
        [".obj", ".glb", ".fbx", ".stl"].includes(file.extension)
      );

      if (supportedFiles.length === 0) {
        alert("Geen 3D objecten beschikbaar");
        hideLoadingScreen();
        return;
      }

      // Clear the initial "Geen objecten beschikbaar" entry once we have files
      filesList.length = 0;

      for (const file of supportedFiles) {
        try {
          if (file.size > 100) {
            console.warn(
              `File ${file.name} is te groot (${Math.round(file.size)}MB)`
            );
            alert(
              `Let op: ${file.name} is te groot om te laden (${Math.round(
                file.size
              )}MB). ` +
                `De maximale bestandsgrootte is 100MB. \n\n` +
                `Het bestand is wel opgeslagen maar kan niet worden weergegeven. ` +
                `Neem contact op met de toezichthouder voor een geoptimaliseerde versie.`
            );
            continue;
          }

          updateLoadingProgress(file.name, 0);

          const object = await new Promise((resolve, reject) => {
            const loader = loaderMap[file.extension];

            if (file.extension === ".fbx") {
              loader.setPath("");
              loader.setResourcePath("");
            }

            loader.load(
              file.url,
              (loadedObject) => {
                if (!loadedObject) {
                  reject(new Error(`Loaded object is null for ${file.name}`));
                  return;
                }
                resolve(loadedObject);
              },
              (progress) => {
                const progressPercentage =
                  (progress.loaded / (file.size * (1024 * 1024))) * 100;

                updateLoadingProgress(file.name, progressPercentage);
              },
              (error) => {
                console.error(`Error in loader for ${file.name}:`, error);
                reject(error);
              }
            );
          });

          console.log(`Successfully loaded: ${file.name}`);
          loadedObjects[file.name] = object;
          objectSettings[file.name] = createDefaultSettings();
          filesList.push(file.name);

          // If this is the first object loaded
          if (!currentObject) {
            currentObject = object;
            scene.add(currentObject);
            settings.selectedObject = file.name; // Update the settings object
            selectionController.updateDisplay(); // Update the GUI display

            // Apply initial settings
            applySettingsToGUI(objectSettings[file.name]);
          }
        } catch (error) {
          console.error(`Failed to load object: ${file.name}`, error);
        }
      }

      // Update the selection controller with the new file list
      selectionController.options(filesList);
    } catch (error) {
      console.error("Error fetching objects from Firebase Storage:", error);
      alert("Probleem bij het laden van 3D objecten.");
    } finally {
      hideLoadingScreen();
    }
  }

  // Initialize GUI
  const selectionController = gui
    .add(settings, "selectedObject", filesList)
    .name("Select 3D object");

  selectionController.onChange((selectedName) => {
    if (loadedObjects[selectedName]) {
      // Store current object's settings
      if (currentObject) {
        const currentName = settings.selectedObject;
        objectSettings[currentName] = {
          positionX: settings.positionX,
          positionY: settings.positionY,
          positionZ: settings.positionZ,
          rotationX: settings.rotationX,
          rotationY: settings.rotationY,
          rotationZ: settings.rotationZ,
          autoRotate: settings.autoRotate,
          rotationSpeed: settings.rotationSpeed,
          color: settings.color,
        };
        scene.remove(currentObject);
      }

      // Add the selected object to the scene
      currentObject = loadedObjects[selectedName];
      scene.add(currentObject);

      // Load stored settings for the selected object
      const storedSettings = objectSettings[selectedName];
      if (storedSettings) {
        // Update the settings object
        Object.assign(settings, storedSettings);
        // Apply settings to GUI
        applySettingsToGUI(storedSettings);
      }

      // Handle scaling
      const box = new THREE.Box3();
      currentObject.traverse((child) => {
        if (child.isMesh) {
          box.expandByObject(child);
        }
      });

      if (!box.isEmpty()) {
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDimension = Math.max(size.x, size.y, size.z);
        const desiredSize = 2;
        const scaleFactor = desiredSize / maxDimension;
        currentObject.scale.set(scaleFactor, scaleFactor, scaleFactor);
      }
    }
  });

  // Position controls
  const position = gui.addFolder("Positie en aanpassingen");
  position
    .add(settings, "positionX", -10, 10)
    .name("Links - Rechts")
    .onChange(() => {
      if (currentObject) {
        currentObject.position.x = settings.positionX;
        objectSettings[settings.selectedObject].positionX = settings.positionX;
      }
    });

  position
    .add(settings, "positionY", -10, 10)
    .name("Omlaag - Omhaag")
    .onChange(() => {
      if (currentObject) {
        currentObject.position.y = settings.positionY;
        objectSettings[settings.selectedObject].positionY = settings.positionY;
      }
    });

  position
    .add(settings, "positionZ", -10, 10)
    .name("Zoom")
    .onChange(() => {
      if (currentObject) {
        currentObject.position.z = settings.positionZ;
        objectSettings[settings.selectedObject].positionZ = settings.positionZ;
      }
    });

  position
    .add(settings, "rotationY", 0, Math.PI * 2)
    .name("Draaien")
    .onChange(() => {
      if (currentObject) {
        currentObject.rotation.y = settings.rotationY;
        objectSettings[settings.selectedObject].rotationY = settings.rotationY;
      }
    });

  // Animation controls
  const animations = gui.addFolder("Animaties");
  animations
    .add(settings, "autoRotate")
    .name("Automatisch draaien")
    .onChange(() => {
      if (currentObject) {
        objectSettings[settings.selectedObject].autoRotate =
          settings.autoRotate;
      }
    });

  animations
    .add(settings, "rotationSpeed", 0, 10) // Verander het bereik naar 0-10
    .name("Draai snelheid")
    .onChange(() => {
      if (currentObject) {
        // Schaal de waarde naar 0-0.01
        const scaledSpeed = settings.rotationSpeed / 1000; // 0-10 wordt 0-0.01
        objectSettings[settings.selectedObject].rotationSpeed = scaledSpeed;
      }
    });

  // Start loading objects
  loadObjectsFromStorage();

  function animate() {
    if (currentObject && settings.autoRotate) {
      const scaledSpeed = settings.rotationSpeed / 1000; // Schaal terug naar 0-0.01
      currentObject.rotation.y += scaledSpeed;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  // Helper functions
  function showLoadingScreen() {
    const loadingScreen =
      document.getElementsByClassName("loadingContainer")[0];
    if (loadingScreen) {
      loadingScreen.style.display = "flex";
    }
  }

  function hideLoadingScreen() {
    const loadingScreen =
      document.getElementsByClassName("loadingContainer")[0];
    if (loadingScreen) {
      loadingScreen.style.display = "none";
    }
  }

  function updateLoadingProgress(filename, progress) {
    const progressBar = document.getElementById("loading-progress");
    const progressText = document.getElementById("progress-percentage");
    const filenameElement = document.getElementById("loading-filename");

    if (progressBar && progressText && filenameElement) {
      progressBar.style.width = `${progress}%`;
      progressText.textContent = Math.round(progress * 100) / 100;
      filenameElement.textContent = filename;
    }
  }
}
