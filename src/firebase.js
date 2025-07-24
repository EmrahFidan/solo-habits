import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAugWIm0CuR2rFAEcKrFzd9E6kYO96n4Is",
  authDomain: "solo-leveling-c7829.firebaseapp.com",
  projectId: "solo-leveling-c7829",
  storageBucket: "solo-leveling-c7829.firebasestorage.app",
  messagingSenderId: "125796628151",
  appId: "1:125796628151:web:e1f2d30621674538ce7f32",
  measurementId: "G-XMN1XCRE2P",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// 🆕 Debug için config'i de export et
export { firebaseConfig };