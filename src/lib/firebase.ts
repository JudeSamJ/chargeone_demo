
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// The configuration is hardcoded here to bypass environment variable loading issues.
// For production, it is strongly recommended to use environment variables.
const firebaseConfig = {
  apiKey: "AIzaSyCTjAWqGUnxDV4YeUxYHbogfRvs5cZTTIg",
  authDomain: "chargeone.firebaseapp.com",
  projectId: "chargeone",
  storageBucket: "chargeone.firebasestorage.app",
  messagingSenderId: "669583586032",
  appId: "1:669583586032:web:c0c73391c7eb691c7ec835",
  measurementId: "",
};

// Initialize Firebase App
let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  return signInWithPopup(auth, provider);
};

export const signOutWithGoogle = () => {
  return signOut(auth);
};

export { auth, app, db };
