export function createScene2(scene, camera, renderer, gui, fileInput) {
  const filesList = [];
  let currentFile = null;
  let sphereMesh = null;

  // Voeg een bestand toe aan de lijst en toon het in de mediaviewer
  async function addFile(file) {
    const fileURL = URL.createObjectURL(file);
    filesList.push({ name: file.name, url: fileURL });
    updateMediaViewer();
  }

  function updateMediaViewer() {
    if (!mediaViewerFolder) {
      mediaViewerFolder = gui.addFolder("Media");
      const folderElement = mediaViewerFolder.domElement;
      folderElement.id = "mediaFolder";
    }

    const index = filesList.length - 1;
    const propertyName = `Bestand ${index}`;

    // Voeg het bestand toe aan de GUI
    const elementController = mediaViewerFolder.add(
      { [propertyName]: () => selectFile(index) },
      propertyName
    );

    filesList.forEach((file) => {
      elementController.name(file.name);

      // Voeg een thumbnail toe
      const thumbnail = document.createElement("img");
      thumbnail.src = file.url;

      thumbnail.addEventListener("click", () => {
        selectFile(index);
        highlightThumbnail(thumbnail);
      });

      const domElement = elementController.domElement;
      domElement.style.backgroundImage = `url(${file.url})`;
    });
  }

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
  fileInput.accept = "image/jpeg, image/png, image/webp";
  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileExtension = file.name
        .slice(file.name.lastIndexOf("."))
        .toLowerCase();
      if ([".jpg", ".jpeg", ".png", ".webp"].includes(fileExtension)) {
        console.log(`File uploaded: ${file.name}`);
        await addFile(file);
      } else {
        alert(
          "Ongeldig bestandstype. Upload een bestand in het formaat .jpg, .jpeg, .png of .webp."
        );
      }
    }
  });

  // GUI instellingen
  const settings = {
    upload: function () {
      fileInput.click();
    },
  };

  gui.add(settings, "upload").name("Upload Bestand");

  var mediaViewerFolder = gui.addFolder("Galerij");
  const folderElement = mediaViewerFolder.domElement;
  folderElement.id = "mediaFolder";

  function displayPanoramaInScene(fileURL) {
    resetScene();

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
        alert("De panorama kon niet worden geladen. Controleer het bestand of contacteer de beheerder.");
      }
    );
  }

  function validatePanorama(image) {
    if (image.width / image.height !== 2) {
      alert(
        "Dit bestand lijkt geen geldig panorama te zijn, ga naar de Foto's omgeving."
      );
      return false;
    }
    return true;
  }

  function resetScene() {
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
  }

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

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.update();

  function animate() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}
