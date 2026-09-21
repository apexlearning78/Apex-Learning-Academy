import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC5RRapP2r6u059j3P3KLzKaSqQFVaKFZ4",
  authDomain: "apex-apex-learning-academy.firebaseapp.com",
  projectId: "apex-apex-learning-academy",
  storageBucket: "apex-apex-learning-academy.firebasestorage.app",
  messagingSenderId: "721375349608",
  appId: "1:721375349608:web:ec978b4db1cfc711e224dd",
  measurementId: "G-PFXMKDWB3G"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
