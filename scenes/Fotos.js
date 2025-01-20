import { getDownloadURL, listAll } from "firebase/storage";
import { imagesRef } from "../API.js";

export function createScene0(scene, camera, renderer, gui) {
  let currentImage = null;
  let currentCanvas = document.createElement("canvas");
  let currentContext = currentCanvas.getContext("2d");
  let currentFile = null;
  let controllers = {};

  // Settings object with default values
  const defaultSettings = {
    exposure: 0,
    highlights: 0,
    shadows: 0,
  };

  // Settings object for current state
  const settings = {
    exposure: 0,
    highlights: 0,
    shadows: 0,
  };

  // Function to reset all settings in localStorage
  function clearAllSettings() {
    // Get all keys from localStorage that start with 'imageSettings_'
    Object.keys(localStorage)
      .filter(key => key.startsWith('imageSettings_'))
      .forEach(key => localStorage.removeItem(key));
    
    // Reset current settings to default
    Object.keys(defaultSettings).forEach(key => {
      settings[key] = defaultSettings[key];
      if (controllers[key]) {
        controllers[key].object[controllers[key].property] = defaultSettings[key];
        controllers[key].updateDisplay();
      }
    });
    
    // If there's a current image, apply the reset settings
    if (currentFile) {
      applyAdjustments();
    }
  }

  // Function to reset current image settings
  function resetCurrentImage() {
    if (!currentFile) return;
    
    // Remove settings from localStorage for current image
    localStorage.removeItem(`imageSettings_${currentFile.name}`);
    
    // Reset current settings to default
    Object.keys(defaultSettings).forEach(key => {
      settings[key] = defaultSettings[key];
      if (controllers[key]) {
        controllers[key].object[controllers[key].property] = defaultSettings[key];
        controllers[key].updateDisplay();
      }
    });
    
    applyAdjustments();
  }

  function saveSettings() {
    if (!currentFile) return;
    
    const imageSettings = {
      exposure: settings.exposure,
      highlights: settings.highlights,
      shadows: settings.shadows
    };
    
    localStorage.setItem(`imageSettings_${currentFile.name}`, JSON.stringify(imageSettings));
  }

  function loadSettings(imageName) {
    const savedSettings = localStorage.getItem(`imageSettings_${imageName}`);
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      
      // Update each setting and its controller
      Object.keys(parsedSettings).forEach(key => {
        settings[key] = parsedSettings[key];
        if (controllers[key]) {
          controllers[key].object[controllers[key].property] = parsedSettings[key];
          controllers[key].updateDisplay();
        }
      });
    } else {
      // Reset to defaults
      Object.keys(settings).forEach(key => {
        settings[key] = 0;
        if (controllers[key]) {
          controllers[key].object[controllers[key].property] = 0;
          controllers[key].updateDisplay();
        }
      });
    }
  }

  function loadImagesFromStorage() {
    listAll(imagesRef)
      .then((result) => {
        const promises = result.items.map((itemRef) => {
          return getDownloadURL(itemRef).then((url) => ({
            name: itemRef.name,
            url,
          }));
        });

        Promise.all(promises).then((files) => {
          files.sort((a, b) => a.name.localeCompare(b.name));

          files.forEach((file) => {
            const elementController = mediaViewerFolder.add(
              { [file.name]: () => selectImage(file) },
              file.name
            );

            const domElement = elementController.domElement;
            domElement.style.backgroundImage = `url(${file.url})`;
          });
        });
      })
      .catch((error) => {
        console.error("Error loading images from Firebase Storage:", error);
      });
  }

  // Modified selectImage function to ensure proper order of operations
  function selectImage(file) {
    currentFile = file;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      loadSettings(file.name);
      setTimeout(() => {
        applyAdjustments();
      }, 50);
    };
    img.src = file.url;
  }

  // Initialize GUI
  const editing = gui.addFolder("Bewerkings opties");

  // Create a div for reset buttons
  const resetButtonsContainer = document.createElement('div');
  resetButtonsContainer.className = 'reset-buttons-container';
  editing.domElement.insertBefore(resetButtonsContainer, editing.domElement.firstChild);

  // Add reset buttons with custom styling
  const resetCurrentController = editing.add({ resetCurrent: resetCurrentImage }, 'resetCurrent')
    .name('Reset deze afbeelding');
  resetCurrentController.domElement.classList.add('reset-button');
  resetButtonsContainer.appendChild(resetCurrentController.domElement);

  const resetAllController = editing.add({ resetAll: clearAllSettings }, 'resetAll')
    .name('Reset alle afbeeldingen');
  resetAllController.domElement.classList.add('reset-button');
  resetButtonsContainer.appendChild(resetAllController.domElement);

  // Store controller references when creating them
  controllers.exposure = editing
    .add(settings, "exposure", -100, 100)
    .name("Helderheid")
    .onChange(applyAdjustments)
    .onFinishChange(saveSettings);

  controllers.highlights = editing
    .add(settings, "highlights", -100, 100)
    .name("Highlights")
    .onChange(applyAdjustments)
    .onFinishChange(saveSettings);

  controllers.shadows = editing
    .add(settings, "shadows", -100, 100)
    .name("Schaduwen")
    .onChange(applyAdjustments)
    .onFinishChange(saveSettings);

  function applyAdjustments() {
    if (!currentFile || !currentContext) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      currentCanvas.width = img.width;
      currentCanvas.height = img.height;
      currentContext.drawImage(img, 0, 0);

      const imgData = currentContext.getImageData(
        0,
        0,
        currentCanvas.width,
        currentCanvas.height
      );
      const data = imgData.data;

      const exposureFactor = Math.pow(2, settings.exposure / 100);
      const highlightsFactor = settings.highlights / 100;
      const shadowsFactor = settings.shadows / 100;

      for (let i = 0; i < data.length; i += 4) {
        data[i] = adjustPixel(
          data[i],
          exposureFactor,
          highlightsFactor,
          shadowsFactor
        );
        data[i + 1] = adjustPixel(
          data[i + 1],
          exposureFactor,
          highlightsFactor,
          shadowsFactor
        );
        data[i + 2] = adjustPixel(
          data[i + 2],
          exposureFactor,
          highlightsFactor,
          shadowsFactor
        );
      }

      currentContext.putImageData(imgData, 0, 0);
      displayImageInScene(currentCanvas.toDataURL());
    };

    img.src = currentFile.url;
  }

  function adjustPixel(value, exposure, highlights, shadows) {
    let newValue = value * exposure;
    if (newValue > 128) {
      newValue += highlights * (255 - newValue);
    } else {
      newValue += shadows * newValue;
    }
    return Math.min(Math.max(newValue, 0), 255);
  }

  var mediaViewerFolder = gui.addFolder("Galerij");
  const folderElement = mediaViewerFolder.domElement;
  folderElement.classList.add("photosFolder");

  function displayImageInScene(fileURL) {
    while (scene.children.length > 0) {
      const object = scene.children[0];
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (object.material.map) object.material.map.dispose();
        object.material.dispose();
      }
      scene.remove(object);
    }

    currentImage = null;

    const img = new Image();
    img.onload = () => {
      const width = img.width / 2;
      const height = img.height / 2;

      const textureLoader = new THREE.TextureLoader();
      textureLoader.crossOrigin = "anonymous";
      textureLoader.load(
        fileURL,
        (texture) => {
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
          });

          const geometry = new THREE.PlaneGeometry(width / 100, height / 100);
          currentImage = new THREE.Mesh(geometry, material);
          currentImage.position.set(0, 0, -5);
          scene.add(currentImage);
        },
        undefined,
        (err) => console.error("Texture loading error:", err)
      );
    };

    img.src = fileURL;
  }

  function animate() {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  loadImagesFromStorage();
  animate();
}