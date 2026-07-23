import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDJh0StQ_y8D9NurT0eS4w45q6Ke0ylsgA",
  authDomain: "phusakthanvote.firebaseapp.com",
  projectId: "phusakthanvote",
  storageBucket: "phusakthanvote.firebasestorage.app",
  messagingSenderId: "759752070588",
  appId: "1:759752070588:web:abc9a6005166ecfeb0c7b9",
  measurementId: "G-MT5NGX4QM5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function ensureUser() {
  await setPersistence(auth, browserLocalPersistence);
  if (auth.currentUser) return auth.currentUser;
  await signInAnonymously(auth);

  return await new Promise((resolve, reject) => {
    const stop = onAuthStateChanged(auth, user => {
      if (!user) return;
      stop();
      resolve(user);
    }, reject);
  });
}

export { db, ensureUser, collection, doc, getDoc, setDoc, onSnapshot, serverTimestamp };
