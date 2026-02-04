import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBuVE2UbxdQ2bK5slYO81bdun4gEqTmtkk",
  authDomain: "barbour-encuesta.firebaseapp.com",
  projectId: "barbour-encuesta",
  storageBucket: "barbour-encuesta.appspot.com",
  messagingSenderId: "564046942530",
  appId: "1:564046942530:web:2cfd2f97255ac2a5f0f8db"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);