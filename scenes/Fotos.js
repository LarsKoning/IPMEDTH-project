export function createScene0(scene, camera, renderer, gui, fileInput) {
  const filesList = new Set();
  let currentImage = null;
  let currentCanvas = document.createElement("canvas");
  let currentContext = currentCanvas.getContext("2d");
  let currentFile = null;

  // Google API credentials
  const API_KEY = "AIzaSyBSRS_xgFTJ7g2g26ilFw1jgmzhpCYA1M4";
  // const CLIENT_ID =
  //   "1038445148870-lh781sgn15mr57ipj2df0rk2mj62v1qc.apps.googleusercontent.com";
  const PHOTOS_FOLDER_ID = "1MwoH1lEvhzVdjIvKpiA8zlTc32rvxnGk";

  async function fetchPhotosFromDrive() {
    try {
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q='${PHOTOS_FOLDER_ID}'+in+parents+and+mimeType+contains+'image/'&key=${API_KEY}&fields=files(id,name,mimeType)`
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
                        resetCanvas();

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


  // function addFileToMediaViewer(name, url) {
  //   console.log(`Nieuwe foto toegevoegd: ${name}`);

  //   updateMediaViewer(file);
  // }

  function resetCanvas() {
    //kijken
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
  }

  fetchPhotosFromDrive(); // Call the function to fetch photos on load

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

  var mediaViewerFolder = gui.addFolder("Galerij");
  mediaViewerFolder.domElement.classList.add("photosFolder");
  mediaViewerFolder.domElement.id = "photosFolder";

  // Hulpfunctie om de afbeelding aan te passen
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

  function adjustPixel(value, exposure, highlights, shadows) {
    let newValue = value * exposure;
    if (newValue > 128) {
      newValue += highlights * (255 - newValue);
    } else {
      newValue += shadows * newValue;
    }
    return Math.min(Math.max(newValue, 0), 255);
  }

  function animate() {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}
