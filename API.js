import { initializeApp } from "firebase/app";
import { getStorage, ref } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA12PGzlrDD_u3948KlfygQJQHdc-fF7Cs",
  authDomain: "ipmedth-etvr-viewer.firebaseapp.com",
  projectId: "ipmedth-etvr-viewer",
  storageBucket: "ipmedth-etvr-viewer.firebasestorage.app",
  messagingSenderId: "760776518309",
  appId: "1:760776518309:web:218f311300d1836afc3b4c",
  measurementId: "G-EF1R1QTSJP"
};

// Initialize Firebase
const firebase = initializeApp(firebaseConfig);
const storage = getStorage(firebase);

const imagesRef = ref(storage, 'Fotos');
const objectsRef = ref(storage, 'Objects');
const panoramaRef = ref(storage, 'Panoramas');
const pointcloudRef = ref(storage, 'Pointclouds');

export { imagesRef, objectsRef, panoramaRef, pointcloudRef };