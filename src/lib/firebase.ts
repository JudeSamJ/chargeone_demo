"use client";

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth } from "firebase/auth";

// It's recommended to store your Firebase config in environment variables
// For this prototype, we'll keep it here but the user should move it for production.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCTjAWqGUnxDV4YeUxYHbogfRvs5cZTTIg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "chargeone.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "chargeone",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "chargeone.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "669583586032",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:669583586032:web:c0c73391c7eb691c7ec835",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;
let auth: Auth;

// Initialize Firebase
if (getApps().length === 0) {
  // Check if all required config values are present
  if (firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
  } else {
    console.error("Firebase configuration is missing or incomplete. Please check your environment variables or firebaseConfig object.");
  }
} else {
  app = getApp();
}

// Initialize Auth only if app was initialized
if (app!) {
    auth = getAuth(app);
}


const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  if (!auth) {
    console.error("Firebase Auth is not initialized.");
    throw new Error("Firebase Auth is not initialized.");
  }
  return signInWithPopup(auth, provider);
};

export const signOutWithGoogle = () => {
  if (!auth) {
    console.error("Firebase Auth is not initialized.");
    return Promise.reject("Firebase Auth is not initialized.");
  }
  return signOut(auth);
};

export { app, auth };