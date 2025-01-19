import { getDownloadURL, listAll } from "firebase/storage";
import { imagesRef } from "../API.js";

export function createScene0(scene, camera, renderer, gui) {
  let currentImage = null;
  let currentCanvas = document.createElement("canvas");
  let currentContext = currentCanvas.getContext("2d");
  let currentFile = null;

  // Voeg een bestand toe aan de lijst en toon het in de mediaviewer
  function loadImagesFromStorage() {
    listAll(imagesRef)
      .then((result) => {
        const promises = result.items.map((itemRef) => {
          return getDownloadURL(itemRef).then((url) => ({
            name: itemRef.name,
            url,
          }));
        });

        // Wait for all download URLs to be resolved
        Promise.all(promises).then((files) => {
          // Sort files by name in ascending order
          files.sort((a, b) => a.name.localeCompare(b.name));

          // Add sorted files to the GUI
          files.forEach((file, index) => {
            // Add the image to the GUI with a click handler
            const elementController = mediaViewerFolder.add(
              { [file.name]: () => selectImage(file) },
              file.name
            );

            // Create a thumbnail for the image
            const thumbnail = document.createElement("img");
            thumbnail.src = file.url;
            thumbnail.style.width = "50px"; // Adjust thumbnail size as needed
            thumbnail.style.height = "50px";
            thumbnail.style.margin = "5px";
            thumbnail.style.cursor = "pointer";

            // Add click event listener for selecting the image
            thumbnail.addEventListener("click", () => {
              selectImage(file);
              highlightThumbnail(thumbnail);
            });

            // Append the thumbnail to the GUI element

            const domElement = elementController.domElement;

            domElement.style.backgroundImage = `url(${file.url})`;
          });
        });
      })
      .catch((error) => {
        console.error("Error loading images from Firebase Storage:", error);
      });
  }

  // Function to highlight the selected thumbnail
  function highlightThumbnail(selectedThumbnail) {
    const allThumbnails = document.querySelectorAll("img");
    allThumbnails.forEach(
      (img) => (img.style.border = "2px solid transparent")
    );
    selectedThumbnail.style.border = "2px solid #00f";
  }

  // Call the function to load images when the app starts
  loadImagesFromStorage();

  // GUI instellingen
  const settings = {
    exposure: 0,
    highlights: 0,
    shadows: 0,
  };

  // Initiëren van de GUI
  // Bewerkingsopties-folder
  const editing = gui.addFolder("Bewerkings opties");

  // Hulpfunctie om de afbeelding aan te passen
  function applyAdjustments() {
    if (!currentFile || !currentContext) return;

    const img = new Image();
    img.crossOrigin = "anonymous"; // Allow cross-origin access
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

    // Maak een nieuw Image object om de originele afmetingen van de afbeelding te verkrijgen
    const img = new Image();
    img.onload = () => {
      const width = img.width / 2;
      const height = img.height / 2;

      const textureLoader = new THREE.TextureLoader();
      textureLoader.crossOrigin = "anonymous"; // Allow cross-origin access
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

  function selectImage(file) {
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
