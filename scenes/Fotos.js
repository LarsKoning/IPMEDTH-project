export function createScene0(scene, camera, renderer, gui, fileInput) {
  const filesList = [];
  let currentImage = null;
  let currentCanvas = document.createElement("canvas");
  let currentContext = currentCanvas.getContext("2d");
  let currentFile = null;

  // Voeg een bestand toe aan de lijst en toon het in de mediaviewer
  async function addFile(file) {
    const fileURL = URL.createObjectURL(file);
    filesList.push({ name: file.name, url: fileURL });
    updateMediaViewer();
  }

  function updateMediaViewer() {
    // Controleer of de folder al bestaat; maak deze indien nodig
    if (!mediaViewerFolder) {
      mediaViewerFolder = gui.addFolder("Photo's");
      const folderElement = mediaViewerFolder.domElement;
      folderElement.id = "photosFolder";
    }

    const index = filesList.length - 1;

    const propertyName = `Foto ${index}`;

    // Voeg de afbeelding toe aan de GUI
    const elementController = mediaViewerFolder.add(
      { [propertyName]: () => selectImage(index) },
      propertyName,
      console.log(filesList),
      console.log(index)
    );

    // Voeg nieuwe items toe uit filesList
    filesList.forEach((file) => {
      elementController.name(file.name);
      // Voeg een thumbnail toe
      const thumbnail = document.createElement("img");
      thumbnail.src = file.url;

      // Event listener voor het selecteren van een afbeelding
      thumbnail.addEventListener("click", () => {
        selectImage(index);
        highlightThumbnail(thumbnail);
      });

      // Voeg visuele thumbnail toe aan het element in de GUI
      const domElement = elementController.domElement;
      domElement.style.backgroundImage = `url(${file.url})`;

      // console.log(filesList);
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

  // Selecteer een afbeelding en toon deze
  function selectImage(index) {
    const file = filesList[index];
    console.log(`Geselecteerde foto: ${file.name}`);

    if (!currentImage) {
      currentImage = document.createElement("img");
      // currentImage.style.position = "absolute";
      // currentImage.style.top = "10px";
      // currentImage.style.right = "10px";
      // currentImage.style.width = "300px";
      // currentImage.style.border = "2px solid #fff";
      document.body.appendChild(currentImage);
    }

    currentImage.src = file.url;
  }

  // Bestand uploaden via de fileInput
  fileInput.accept = ".jpg, .jpeg, .png, .webp";
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
    exposure: 0,
    highlights: 0,
    shadows: 0,
  };

  // Initiëren van de GUI
  gui.add(settings, "upload").name("Upload Foto's");

  // Bewerkingsopties-folder
  const editing = gui.addFolder("Bewerkings opties");

  // Hulpfunctie om de afbeelding aan te passen
  function applyAdjustments() {
    if (!currentFile || !currentContext) return;

    const img = new Image();
    img.onload = () => {
      // Reset het canvas en teken de originele afbeelding

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

      // Pas helderheid, highlights en schaduwen toe
      const exposureFactor = Math.pow(2, settings.exposure / 100);
      const highlightsFactor = settings.highlights / 100;
      const shadowsFactor = settings.shadows / 100;

      for (let i = 0; i < data.length; i += 4) {
        // Pas de helderheid, highlights en schaduwen toe
        data[i] = adjustPixel(
          data[i],
          exposureFactor,
          highlightsFactor,
          shadowsFactor
        ); // Rood
        data[i + 1] = adjustPixel(
          data[i + 1],
          exposureFactor,
          highlightsFactor,
          shadowsFactor
        ); // Groen
        data[i + 2] = adjustPixel(
          data[i + 2],
          exposureFactor,
          highlightsFactor,
          shadowsFactor
        ); // Blauw
      }

      currentContext.putImageData(imgData, 0, 0);

      // Update de afbeelding in de Three.js-scène
      displayImageInScene(currentCanvas.toDataURL());
    };

    img.src = currentFile.url; // Gebruik de originele afbeelding
  }

  // Hulpfunctie om een pixelwaarde aan te passen
  function adjustPixel(value, exposure, highlights, shadows) {
    let newValue = value * exposure; // Pas helderheid toe
    if (newValue > 128) {
      newValue += highlights * (255 - newValue); // Highlights
    } else {
      newValue += shadows * newValue; // Shadows
    }
    return Math.min(Math.max(newValue, 0), 255); // Houd de waarde binnen het bereik 0-255
  }

  // Voeg eventlisteners toe aan de sliders
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

  // Mediaviewer-folder
  var mediaViewerFolder = gui.addFolder("Galerij");
  const folderElement = mediaViewerFolder.domElement;

  folderElement.classList.add("photosFolder");

  function displayImageInScene(fileURL) {
    // Reset de canvas en verwijder oude objecten
    resetCanvas();

    // Maak een nieuw Image object om de originele afmetingen van de afbeelding te verkrijgen
    const img = new Image();
    img.onload = () => {
      const width = img.width / 2;
      const height = img.height / 2;

      const textureLoader = new THREE.TextureLoader();
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

    img.src = fileURL; // Start het laden van de afbeelding
  }

  function resetCanvas() {
    // Verwijder alle kinderen van de scene
    while (scene.children.length > 0) {
      const object = scene.children[0];
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (object.material.map) object.material.map.dispose();
        object.material.dispose();
      }
      scene.remove(object);
    }

    // Reset currentImage
    currentImage = null;
  }

  function selectImage(index) {
    const file = filesList[index];
    console.log(`Geselecteerde foto: ${file.name}`);

    currentFile = file; // Update currentFile
    applyAdjustments(); // Pas de instellingen toe op de geselecteerde afbeelding

    // Reset canvas en toon de afbeelding in de 3D-scène
    displayImageInScene(file.url);
  }

  // Animate functie
  function animate() {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}
