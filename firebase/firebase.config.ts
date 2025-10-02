// lib/firebase.ts
import { initializeApp, } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuración desde variables de entorno (más seguro que hardcodear)
const firebaseConfig = {
 apiKey: "AIzaSyCvITrvz3pgzNIw5WXv9FtNjhm255KDcGE",
  authDomain: "probando-9179b.firebaseapp.com",
  projectId: "probando-9179b",
  storageBucket: "probando-9179b.firebasestorage.app",
  messagingSenderId: "269885516271",
  appId: "1:269885516271:web:b89aaaff6fde7de680ae1a"
};

// Evita inicializar la app más de una vez (Next.js refresca módulos en dev)
const app = initializeApp(firebaseConfig);

// Inicializa servicios
const db = getFirestore(app);

export { app, db };


