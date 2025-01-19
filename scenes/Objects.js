import {
  FBXLoader,
  GLTFLoader,
  STLLoader,
  OBJLoader,
} from "three/examples/jsm/Addons.js";

import { getDownloadURL, listAll } from "firebase/storage";
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
        return { name: itemRef.name, url: fileURL, extension: fileExtension };
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
  
      // Voeg hier de validateAndLoadFBX helper functie toe (buiten de loops)
      function validateAndLoadFBX(file, loader) {
        return new Promise((resolve, reject) => {
          fetch(file.url)
            .then(response => response.arrayBuffer())
            .then(buffer => {
              const header = new Uint8Array(buffer.slice(0, 23));
              const decoder = new TextDecoder();
              const headerString = decoder.decode(header);
              
              if (!headerString.startsWith('Kaydara FBX Binary')) {
                loader.load(
                  file.url,
                  (object) => resolve(object),
                  (progress) => {
                    const progressPercentage = (progress.loaded / progress.total) * 100;
                    updateLoadingProgress(file.name, progressPercentage);
                  },
                  (error) => {
                    console.error('FBX ASCII loading failed:', error);
                    reject(error);
                  }
                );
              } else {
                loader.setResourcePath('');
                loader.load(
                  file.url,
                  (object) => resolve(object),
                  (progress) => {
                    const progressPercentage = (progress.loaded / progress.total) * 100.0;
                    updateLoadingProgress(file.name, progressPercentage);
                  },
                  (error) => {
                    console.error('FBX Binary loading failed:', error);
                    reject(error);
                  }
                );
              }
            })
            .catch(error => {
              console.error('Error during FBX validation:', error);
              reject(error);
            });
        });
      }
  
      for (const file of supportedFiles) {
        try {
          console.log(`Loading file: ${file.name}`);
          updateLoadingProgress(file.name, 0);
          
          let object;
          
          // Hier komt de nieuwe FBX handling code
          if (file.extension === '.fbx') {
            try {
              object = await validateAndLoadFBX(file, loaderMap[file.extension]);
            } catch (error) {
              console.error(`FBX loading failed for ${file.name}:`, error);
              alert(`Het bestand ${file.name} lijkt beschadigd te zijn. Probeer het bestand opnieuw te exporteren met de volgende instellingen:\n\n` +
                    '1. Exporteer als FBX 2013 Binary\n' +
                    '2. Schakel "Geometrie compressie" uit\n' +
                    '3. Vink "Embed media" uit\n' +
                    '4. Gebruik ASCII formaat als Binary niet werkt');
              continue;
            }
          } else {
            // Bestaande code voor andere bestandsformaten
            object = await new Promise((resolve, reject) => {
              loaderMap[file.extension].load(
                file.url,
                (loadedObject) => resolve(loadedObject),
                (progress) => {
                  const progressPercentage = (progress.loaded / progress.total) * 100;
                  updateLoadingProgress(file.name, progressPercentage);
                },
                (error) => reject(error)
              );
            });
          }
  
          if (object) {
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
          }
  
        } catch (error) {
          console.error(`Failed to load object: ${file.name}`, error);
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
    progressText.textContent = Math.round(progress);
    filenameElement.textContent = filename;
  }
}

}
