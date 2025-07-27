"use client";

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth } from "firebase/auth";

const firebaseConfig = {
  "projectId": "chargeone",
  "appId": "1:669583586032:web:c0c73391c7eb691c7ec835",
  "storageBucket": "chargeone.firebasestorage.app",
  "apiKey": "AIzaSyCTjAWqGUnxDV4YeUxYHbogfRvs5cZTTIg",
  "authDomain": "chargeone.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "669583586032"
};

let app: FirebaseApp;
let auth: Auth;

if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  return signInWithPopup(auth, provider);
};

export const signOutWithGoogle = () => {
  return signOut(auth);
};

export { app, auth };