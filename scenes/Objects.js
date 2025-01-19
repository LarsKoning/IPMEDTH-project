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

  // Map of loaders for different file formats
  const loaderMap = {
    ".obj": new OBJLoader(),
    ".glb": new GLTFLoader(),
    ".fbx": new FBXLoader(),
    ".stl": new STLLoader(),
  };

  const filesList = ["Geen objecten beschikbaar"];
  const loadedObjects = {}; // To store loaded objects
  let currentObject = null; // Track currently displayed object

  async function loadObjectsFromStorage() {
    try {
      showLoadingScreen();

      const result = await listAll(objectsRef);
      const promises = result.items.map(async (itemRef) => {
        const fileURL = await getDownloadURL(itemRef);
        const fileExtension = itemRef.name.slice(itemRef.name.lastIndexOf(".")).toLowerCase();
        
        // Get file metadata to check size
        const metadata = await getMetadata(itemRef);
        const fileSizeInMB = metadata.size / (1024 * 1024);
        
        return { 
          name: itemRef.name, 
          url: fileURL, 
          extension: fileExtension,
          size: fileSizeInMB 
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
  
      for (const file of supportedFiles) {
        try {
          if (file.size > 100) { // 100MB limit
            console.warn(`File ${file.name} is te groot (${Math.round(file.size)}MB)`);
            alert(`Let op: ${file.name} is te groot om te laden (${Math.round(file.size)}MB). ` +
                  `De maximale bestandsgrootte is 100MB. \n\n` +
                  `Het bestand is wel opgeslagen maar kan niet worden weergegeven. ` +
                  `Neem contact op met de toezichthouder voor een geoptimaliseerde versie.`);
            continue;
          }

          updateLoadingProgress(file.name, 0);

          const object = await new Promise((resolve, reject) => {
            const loader = loaderMap[file.extension];
            
            // Add error checking for FBX files
            if (file.extension === '.fbx') {
              loader.setPath('');
              loader.setResourcePath('');
            }
  
            loader.load(
              file.url,
              (loadedObject) => {
                if (!loadedObject) {
                  reject(new Error(`Loaded object is null for ${file.name}`));
                  return;
                }
                console.log("Loader succeeded:", loadedObject);
                resolve(loadedObject);
              },
              (progress) => {
                const progressPercentage = (progress.loaded / progress.total) * 100;
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
  
          if (filesList[0] === "Geen objecten beschikbaar") {
            filesList.shift();
          }
          filesList.push(file.name);
          selection.options(filesList);
  
          if (!currentObject) {
            currentObject = object;
            scene.add(currentObject);
          }
  
        } catch (error) {
          console.error(`Failed to load object: ${file.name}`, error);
          // Continue with other files even if one fails
        }
      }
    } catch (error) {
      console.error("Error fetching objects from Firebase Storage:", error);
      alert("Probleem bij het laden van 3D objecten.");
    } finally {
      hideLoadingScreen();
    }
  }
  
  

  // Define settings for GUI
  const settings = {
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

  loadObjectsFromStorage();

  // Initiate the settings and put in folders (IN ORDER FROM TOP TO BOTTOM)
  // File management
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
  // const lighting = gui.addFolder("Belichting");
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

  // Functie om de loading screen te tonen
function showLoadingScreen() {
  const loadingScreen = document.getElementsByClassName("loadingContainer")[0];
  if (loadingScreen) {
    loadingScreen.style.display = "flex"; // Laat de loading screen zien
  }
}

// Functie om de loading screen te verbergen
function hideLoadingScreen() {
  const loadingScreen = document.getElementsByClassName("loadingContainer")[0];
  if (loadingScreen) {
    loadingScreen.style.display = "none"; // Verberg de loading screen
  }
}

function updateLoadingProgress(filename, progress) {
  const progressBar = document.getElementById('loading-progress');
  const progressText = document.getElementById('progress-percentage');
  const filenameElement = document.getElementById('loading-filename');
  
  if (progressBar && progressText && filenameElement) {
    progressBar.style.width = `${progress}%`;
    progressText.textContent = Math.round(progress * 100) / 100;
    filenameElement.textContent = filename;
  }
}

}
