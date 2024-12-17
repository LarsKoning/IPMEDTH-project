export function createScene0(scene, camera, renderer, gui, fileInput) {
  const filesList = []; // Lijst van geüploade bestanden
  let currentImage = null; // Huidig geselecteerde afbeelding

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
      currentImage.style.position = "absolute";
      currentImage.style.top = "10px";
      currentImage.style.right = "10px";
      currentImage.style.width = "300px";
      currentImage.style.border = "2px solid #fff";
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
          "Invalid file type. Please upload a .jpg, .jpeg, .png or .webp file."
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
  editing.add(settings, "exposure", -100, 100).name("Helderheid");
  editing.add(settings, "highlights", -100, 100).name("Highlights");
  editing.add(settings, "shadows", -100, 100).name("Schaduwen");

  // Mediaviewer-folder
  const mediaViewerFolder = gui.addFolder("Photo's");

  // Functie om de geselecteerde afbeelding weer te geven in de Three.js-scène met de originele grootte
  function displayImageInScene(fileURL) {
    // Verwijder de vorige afbeelding als deze bestaat
    if (currentImage) {
      scene.remove(currentImage); // Verwijder het vorige object
    }

    // Maak een nieuw Image object om de originele afmetingen van de afbeelding te verkrijgen
    const img = new Image();
    img.onload = () => {
      // Verkrijg de originele breedte en hoogte van de afbeelding
      const width = img.width;
      const height = img.height;

      // Laad de afbeelding als een texture
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(fileURL, (texture) => {
        // Maak een materiaal van de texture
        const material = new THREE.MeshBasicMaterial({
          map: texture, // Zet de texture als de map voor het materiaal
          side: THREE.DoubleSide, // Zorg ervoor dat beide zijden van het vlak zichtbaar zijn
        });

        // Maak een vlak (plane geometry) met de originele breedte en hoogte
        const geometry = new THREE.PlaneGeometry(width / 100, height / 100); // Schaal de afmetingen naar een geschikte grootte voor de scène

        // Maak een mesh (3D object) met de vlak en het materiaal
        currentImage = new THREE.Mesh(geometry, material);

        // Zet de positie van het vlak in de scène
        currentImage.position.set(0, 0, -5); // Plaats het vlak op een bepaalde diepte

        // Voeg de afbeelding toe aan de scène
        scene.add(currentImage);
      });
    };
    img.src = fileURL; // Laad de afbeelding
  }

  function selectImage(index) {
    const file = filesList[index];
    console.log(`Geselecteerde foto: ${file.name}`);

    // Toon de afbeelding in de 3D-scène
    displayImageInScene(file.url);
  }

  // Animate functie
  function animate() {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}
