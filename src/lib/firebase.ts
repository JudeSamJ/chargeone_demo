"use client";

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  "projectId": "chargeone",
  "appId": "1:669583586032:web:c0c73391c7eb691c7ec835",
  "storageBucket": "chargeone.firebasestorage.app",
  "apiKey": "AIzaSyCTjAWqGUnxDV4YeUxYHbogfRvs5cZTTIg",
  "authDomain": "chargeone.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "669583586032"
};

// Initialize Firebase
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  return signInWithPopup(auth, provider);
};

export const signOutWithGoogle = () => {
  return signOut(auth);
};

export { app, auth };
