import { getDownloadURL, listAll } from "firebase/storage";
import { imagesRef } from "../API.js";
import * as THREE from 'three';

export function createScene0(scene, camera, renderer) {
  let currentImage = null;
  let currentCanvas = document.createElement("canvas");
  let currentContext = currentCanvas.getContext("2d");
  let currentFile = null;
  let vrPanels = new Map();
  let vrControls = new Map();
  let raycaster = new THREE.Raycaster();
  let tempMatrix = new THREE.Matrix4();

  // Settings
  const settings = {
    exposure: 0,
    highlights: 0,
    shadows: 0,
  };

  const defaultSettings = {
    exposure: 0,
    highlights: 0,
    shadows: 0,
  };

  // Create VR interface container
  const basePanel = new THREE.Group();
  basePanel.position.set(0, 1.5, -1);
  scene.add(basePanel);

  // Create main editing panel
  const editingPanel = createVRPanel('editing', { x: 0, y: 0, z: -1 });

  // Add the controls
  addVRSlider('editing', 'Helderheid', {
    min: -100,
    max: 100,
    value: settings.exposure,
    onChange: (value) => {
      settings.exposure = value;
      applyAdjustments();
      saveSettings();
    }
  });

  addVRSlider('editing', 'Highlights', {
    min: -100,
    max: 100,
    value: settings.highlights,
    onChange: (value) => {
      settings.highlights = value;
      applyAdjustments();
      saveSettings();
    }
  });

  addVRSlider('editing', 'Schaduwen', {
    min: -100,
    max: 100,
    value: settings.shadows,
    onChange: (value) => {
      settings.shadows = value;
      applyAdjustments();
      saveSettings();
    }
  });

  // Add reset buttons
  addVRButton('editing', 'Reset deze afbeelding', resetCurrentImage);
  addVRButton('editing', 'Reset alle afbeeldingen', clearAllSettings);

  function createVRPanel(name, position = { x: 0, y: 0, z: 0 }) {
    const panel = new THREE.Group();
    panel.position.set(position.x, position.y, position.z);

    const geometry = new THREE.PlaneGeometry(0.4, 0.6);
    const material = new THREE.MeshBasicMaterial({
      color: 0x2c2c2c,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });

    const background = new THREE.Mesh(geometry, material);
    panel.add(background);

    basePanel.add(panel);
    vrPanels.set(name, panel);

    return panel;
  }

  function addVRSlider(panelName, name, options) {
    const { min, max, value, onChange } = options;
    const panel = vrPanels.get(panelName);
    if (!panel) return;

    const sliderGroup = new THREE.Group();

    // Track
    const track = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 0.01),
      new THREE.MeshBasicMaterial({ color: 0x666666, side: THREE.DoubleSide })
    );
    sliderGroup.add(track);

    // Handle
    const handle = new THREE.Mesh(
      new THREE.CircleGeometry(0.01),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );

    const normalizedValue = (value - min) / (max - min);
    handle.position.x = -0.15 + (normalizedValue * 0.3);
    sliderGroup.add(handle);

    // Label setup
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;

    // Create texture first
    const texture = new THREE.CanvasTexture(canvas);

    // Then define updateLabel function that uses it
    function updateLabel(value) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#ffffff';
      context.font = '24px Arial';
      context.fillText(`${name}: ${value.toFixed(0)}`, 10, 40);
      texture.needsUpdate = true;
    }

    // Now we can call updateLabel safely
    updateLabel(value);

    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 0.05),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      })
    );
    label.position.y = 0.04;
    sliderGroup.add(label);

    vrControls.set(name, {
      type: 'slider',
      handle,
      min,
      max,
      value,
      onChange,
      updateLabel
    });

    const controlCount = panel.children.length;
    sliderGroup.position.y = 0.25 - (controlCount - 1) * 0.08;
    panel.add(sliderGroup);
  }

  function addVRButton(panelName, name, onClick) {
    const panel = vrPanels.get(panelName);
    if (!panel) return;

    const buttonGroup = new THREE.Group();

    const button = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 0.05),
      new THREE.MeshBasicMaterial({
        color: 0x444444,
        side: THREE.DoubleSide
      })
    );
    buttonGroup.add(button);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;

    context.fillStyle = '#ffffff';
    context.font = '24px Arial';
    context.fillText(name, 10, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 0.05),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      })
    );
    buttonGroup.add(label);

    vrControls.set(name, {
      type: 'button',
      button,
      onClick
    });

    const controlCount = panel.children.length;
    buttonGroup.position.y = 0.25 - (controlCount - 1) * 0.08;
    panel.add(buttonGroup);
  }

  function handleVRController(controller) {
    if (!controller || !controller.visible) return;

    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    vrControls.forEach((control, name) => {
      if (control.type === 'slider') {
        const intersects = raycaster.intersectObject(control.handle);
        if (intersects.length > 0 && controller.userData.isSelecting) {
          const worldPoint = intersects[0].point;
          const panelSpace = control.handle.parent.worldToLocal(worldPoint);
          const normalizedValue = (panelSpace.x + 0.15) / 0.3;
          const newValue = control.min + (normalizedValue * (control.max - control.min));
          const clampedValue = Math.max(control.min, Math.min(control.max, newValue));

          control.handle.position.x = -0.15 + (normalizedValue * 0.3);
          control.value = clampedValue;
          control.updateLabel(clampedValue);

          if (control.onChange) {
            control.onChange(clampedValue);
          }
        }
      } else if (control.type === 'button') {
        const intersects = raycaster.intersectObject(control.button);
        if (intersects.length > 0 && controller.userData.isSelecting) {
          if (control.onClick) {
            control.onClick();
          }
        }
      }
    });
  }

  // Keep your existing functions
  function clearAllSettings() {
    Object.keys(localStorage)
      .filter(key => key.startsWith('imageSettings_'))
      .forEach(key => localStorage.removeItem(key));

    Object.keys(defaultSettings).forEach(key => {
      settings[key] = defaultSettings[key];
    });

    if (currentFile) {
      applyAdjustments();
    }
  }

  function resetCurrentImage() {
    if (!currentFile) return;
    localStorage.removeItem(`imageSettings_${currentFile.name}`);
    Object.keys(defaultSettings).forEach(key => {
      settings[key] = defaultSettings[key];
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


  const resetFolder = gui.addFolder("");
  const resetElement = resetFolder.domElement;
  resetElement.classList.add("reset-buttons-container");

  // Add reset buttons with custom styling
  const resetCurrentController = resetFolder.add({ resetCurrent: resetCurrentImage }, 'resetCurrent')
    .name('Reset deze afbeelding');
  resetCurrentController.domElement.classList.add('reset-button');

  const resetAllController = resetFolder.add({ resetAll: clearAllSettings }, 'resetAll')
    .name('Reset alle afbeeldingen');
  resetAllController.domElement.classList.add('reset-button');

  // Store controller references when creating them
  const editing = gui.addFolder("Bewerkings opties");
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

  var mediaViewerFolder = gui.addFolder("Galerij");
  const folderElement = mediaViewerFolder.domElement;
  folderElement.classList.add("photosFolder");

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
    const session = renderer.xr.getSession();
    if (session) {
      const controllers = Array.from(session.inputSources).map(
        (source, i) => renderer.xr.getController(i)
      );
      controllers.forEach(handleVRController);
      basePanel.lookAt(0, 1.6, 0);
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  loadImagesFromStorage();
  animate();
}