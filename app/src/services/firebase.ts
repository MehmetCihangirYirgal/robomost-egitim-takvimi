import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Public web config — Firebase client config is not a secret; access is
// controlled by Firestore security rules, not by hiding this object.
const firebaseConfig = {
  apiKey: "AIzaSyAih5eaOAJdompNTJAAkuEF2bLZW-23bm0",
  authDomain: "robomost-egitim-takvimi.firebaseapp.com",
  projectId: "robomost-egitim-takvimi",
  storageBucket: "robomost-egitim-takvimi.firebasestorage.app",
  messagingSenderId: "258424264669",
  appId: "1:258424264669:web:78dbd3a8f4f100ff1cc834"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
