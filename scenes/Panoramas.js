// ES6 Modules import (zorg ervoor dat je bundler zoals Webpack of Vite gebruikt)
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export function createScene2(scene, camera, renderer, gui, fileInput) {
  const filesList = new Set();
  let currentImage = null;
  let currentCanvas = document.createElement("canvas");
  let currentContext = currentCanvas.getContext("2d");
  let currentFile = null;

  // Google API credentials
  const API_KEY = "AIzaSyBSRS_xgFTJ7g2g26ilFw1jgmzhpCYA1M4";
  const PAN_FOLDER_ID = "1tG8uMunbeUYeRWwIv8hQAst7MiOk1mvx";

  // function updateMediaViewer() {
  //   if (!mediaViewerFolder) {
  //     mediaViewerFolder = gui.addFolder("Media");
  //     const folderElement = mediaViewerFolder.domElement;
  //     folderElement.classList.add("photosFolder");
  //     folderElement.id = "photosFolder";
  //   }

  //   const index = filesList.length - 1;
  //   const propertyName = `Bestand ${index}`;

  //   // Voeg het bestand toe aan de GUI
  //   const elementController = mediaViewerFolder.add(
  //     { [propertyName]: () => selectFile(index) },
  //     propertyName
  //   );

  //   filesList.forEach((file) => {
  //     elementController.name(file.name);

  //     // Voeg een thumbnail toe
  //     const thumbnail = document.createElement("img");
  //     thumbnail.src = file.url;

  //     thumbnail.addEventListener("click", () => {
  //       selectFile(index);
  //       highlightThumbnail(thumbnail);
  //     });

  //     const domElement = elementController.domElement;
  //     domElement.style.backgroundImage = `url(${file.url})`;
  //   });
  // }

  // Highlight geselecteerde thumbnail
  function highlightThumbnail(selectedThumbnail) {
    const allThumbnails = document.querySelectorAll("img");
    allThumbnails.forEach(
      (img) => (img.style.border = "2px solid transparent")
    );
    selectedThumbnail.style.border = "2px solid #00f";
  }

  // Selecteer een bestand
  function selectFile(index) {
    const file = filesList[index];
    currentFile = file;

    // Direct proberen om als panorama te laden
    displayPanoramaInScene(file.url);
  }

  // Bestand uploaden via de fileInput
  // fileInput.accept = "image/jpeg, image/png, image/webp";
  // fileInput.addEventListener("change", async (event) => {
  //   const file = event.target.files[0];
  //   if (file) {
  //     const fileExtension = file.name
  //       .slice(file.name.lastIndexOf("."))
  //       .toLowerCase();
  //     if ([".jpg", ".jpeg", ".png", ".webp"].includes(fileExtension)) {
  //       console.log(`File uploaded: ${file.name}`);
  //       await addFile(file);
  //     } else {
  //       alert(
  //         "Invalid file type. Please upload a .jpg, .jpeg, .png, or .webp file."
  //       );
  //     }
  //   }
  // });

  fetchPhotosFromDrive();

  // GUI instellingen
  const settings = {
    exposure: 0,
    highlights: 0,
    shadows: 0,
  };

  const editing = gui.addFolder("Bewerkings opties");
  editing
    .add(settings, "exposure", -100, 100)
    .name("Helderheid")
    .onChange(applyAdjustments);
  editing
    .add(settings, "highlights", -100, 100)
    .name("Highlights")
    .onChange(applyAdjustments);
  editing
    .add(settings, "shadows", -100, 100)
    .name("Schaduwen")
    .onChange(applyAdjustments);

  // gui.add(settings, "upload").name("Upload Bestand");

  var mediaViewerFolder = gui.addFolder("Galerij");

  const folderElement = mediaViewerFolder.domElement;
  folderElement.classList.add("photosFolder");
  folderElement.id = "photosFolder";

  async function fetchPhotosFromDrive() {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${PAN_FOLDER_ID}'+in+parents+and+mimeType+contains+'image/'&key=${API_KEY}&fields=files(id,name,mimeType)`
      );

      const data = await response.json();
      console.log("Photos data:", data);
      const files = data.files;

      if (files && files.length > 0) {
        files.forEach((file) => {
          if (!filesList.has(file.id)) {
            filesList.add(file.id);
            file.url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${API_KEY}`;

            if (!mediaViewerFolder) {
              mediaViewerFolder = gui.addFolder("Photo's");
              const folderElement = mediaViewerFolder.domElement;
              folderElement.classList.add("photosFolder");
              folderElement.id = "photosFolder";
            }

            const index = filesList.size - 1;
            const propertyName = `Foto ${index + 1}`;
            const elementController = mediaViewerFolder.add(
              { [propertyName]: () => {} },
              propertyName
            );

            elementController.name(file.name);

            // Stel de achtergrond van de widget in als thumbnail
            const buttonElement = elementController.domElement;
            buttonElement.style.cursor = "pointer";
            buttonElement.style.backgroundImage = `url(${file.url})`;
            buttonElement.style.backgroundSize = "cover";
            buttonElement.style.backgroundPosition = "center";
            buttonElement.style.border = "2px solid transparent";

            buttonElement.addEventListener("click", () => {
              currentFile = file;
              applyAdjustments();
              // reset the canvas
              while (scene.children.length > 0) {
                const object = scene.children[0];
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                  if (object.material.map) object.material.map.dispose();
                  object.material.dispose();
                }
                scene.remove(object);
              }

              const allButtons = document.querySelectorAll(
                "#photosFolder button"
              );
              allButtons.forEach(
                (btn) => (btn.style.border = "2px solid transparent")
              );
              buttonElement.style.border = "2px solid #00f";

              const img = new Image();
              img.onload = () => {
                const width = img.width / 2;
                const height = img.height / 2;

                const textureLoader = new THREE.TextureLoader();
                textureLoader.load(
                  file.url,
                  (texture) => {
                    const material = new THREE.MeshBasicMaterial({
                      map: texture,
                      side: THREE.DoubleSide,
                    });

                    const geometry = new THREE.PlaneGeometry(
                      width / 100,
                      height / 100
                    );
                    currentImage = new THREE.Mesh(geometry, material);
                    currentImage.position.set(0, 0, -5);
                    scene.add(currentImage);
                  },
                  undefined,
                  (err) => console.error("Texture loading error:", err)
                );
              };
              img.src = file.url;
            });
          }
        });
      } else {
        console.log("No photos found in the specified folder.");
      }
    } catch (error) {
      console.error("Error fetching photos from Google Drive:", error);
    }
  }

  function applyAdjustments() {
    if (!currentFile || !currentContext) return;

    const img = new Image();
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
        ); // R
        data[i + 1] = adjustPixel(
          data[i + 1],
          exposureFactor,
          highlightsFactor,
          shadowsFactor
        ); // G
        data[i + 2] = adjustPixel(
          data[i + 2],
          exposureFactor,
          highlightsFactor,
          shadowsFactor
        ); // B
      }

      currentContext.putImageData(imgData, 0, 0);
      displayImageInScene(currentCanvas.toDataURL());
    };

    img.src = currentFile.url;
  }

  function displayPanoramaInScene(fileURL) {
    // Reset de scene
    while (scene.children.length > 0) {
      const object = scene.children[0];
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (object.material.map) object.material.map.dispose();
        object.material.dispose();
      }
      scene.remove(object);
    }

    sphereMesh = null;

    const loader = new THREE.ImageLoader();
    const loadingIndicator = createLoadingIndicator();

    loader.load(
      fileURL,
      (image) => {
        removeLoadingIndicator(loadingIndicator);

        // Valideer of het bestand een panorama is
        if (!validatePanorama(image)) return;

        // Maak een texture van de geladen afbeelding
        const texture = new THREE.Texture();
        texture.image = image;
        texture.needsUpdate = true;

        // Maak een bolvorm voor het panorama
        const sphereGeometry = new THREE.SphereGeometry(500, 32, 32); // Verminder segmenten voor performance
        sphereGeometry.scale(-1, 1, 1);

        const sphereMaterial = new THREE.MeshBasicMaterial({ map: texture });
        sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);

        scene.add(sphereMesh);
        console.log("Panorama succesvol geladen.");
      },
      undefined,
      (error) => {
        removeLoadingIndicator(loadingIndicator);
        console.error("Error loading panorama image:", error);
        alert("Het panorama kon niet worden geladen. Controleer het bestand.");
      }
    );
  }

  // function validatePanorama(image) {
  //   if (image.width / image.height !== 2) {
  //     alert(
  //       "Dit bestand lijkt geen geldig panorama te zijn. Breedte/hoogte verhouding moet 2:1 zijn."
  //     );
  //     return false;
  //   }
  //   return true;
  // }

  // function resetScene() {
  //   while (scene.children.length > 0) {
  //     const object = scene.children[0];
  //     if (object.geometry) object.geometry.dispose();
  //     if (object.material) {
  //       if (object.material.map) object.material.map.dispose();
  //       object.material.dispose();
  //     }
  //     scene.remove(object);
  //   }

  //   sphereMesh = null;
  // }

  function createLoadingIndicator() {
    const loadingIndicator = document.createElement("div");
    loadingIndicator.textContent = "Loading panorama...";
    loadingIndicator.style.position = "absolute";
    loadingIndicator.style.top = "50%";
    loadingIndicator.style.left = "50%";
    loadingIndicator.style.transform = "translate(-50%, -50%)";
    loadingIndicator.style.padding = "10px";
    loadingIndicator.style.background = "rgba(0, 0, 0, 0.7)";
    loadingIndicator.style.color = "white";
    loadingIndicator.style.borderRadius = "5px";
    document.body.appendChild(loadingIndicator);
    return loadingIndicator;
  }

  function removeLoadingIndicator(indicator) {
    document.body.removeChild(indicator);
  }

  // OrbitControls instellen zodat de gebruiker alleen het hoofd kan bewegen
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableZoom = false; // Zoom uitschakelen
  controls.enablePan = false; // Pan uitschakelen
  controls.maxPolarAngle = Math.PI / 2; // Beperkt de verticale rotatie
  controls.minPolarAngle = Math.PI / 4; // Beperkt de neerwaartse rotatie
  controls.update();

  function animate() {
    controls.update(); // Houd de camera-updates soepel
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}
