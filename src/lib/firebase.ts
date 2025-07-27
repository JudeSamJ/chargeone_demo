"use client";

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth } from "firebase/auth";

// It's recommended to store your Firebase config in environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

const requiredConfigs = [
    'apiKey', 'authDomain', 'projectId'
];

const missingConfigs = requiredConfigs.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingConfigs.length > 0) {
    console.error(`Firebase configuration is missing or incomplete. Please check your environment variables. Missing keys: ${missingConfigs.join(', ')}`);
} else {
    // Initialize Firebase
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }

    // Initialize Auth only if app was initialized
    if (app) {
        auth = getAuth(app);
    }
}

const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  if (!auth) {
    console.error("Firebase Auth is not initialized due to missing configuration.");
    throw new Error("Firebase Auth is not initialized.");
  }
  return signInWithPopup(auth, provider);
};

export const signOutWithGoogle = () => {
  if (!auth) {
    console.error("Firebase Auth is not initialized due to missing configuration.");
    return Promise.reject("Firebase Auth is not initialized.");
  }
  return signOut(auth);
};

export { app, auth };
