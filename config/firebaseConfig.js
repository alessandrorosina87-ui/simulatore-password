import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDvtOLo2x7Qfzge_-rrvpPsRNoqs3WDlWE",
  authDomain: "simulatore-password.firebaseapp.com",
  projectId: "simulatore-password",
  storageBucket: "simulatore-password.firebasestorage.app",
  messagingSenderId: "232875155513",
  appId: "1:232875155513:web:032c9a6148f459124c2de8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
