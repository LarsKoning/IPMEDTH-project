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

  // Animate functie
  function animate() {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}
