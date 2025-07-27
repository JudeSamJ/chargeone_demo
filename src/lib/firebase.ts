
"use client";

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;
let auth: Auth;

// This check is crucial for client-side rendering in Next.js
if (typeof window !== 'undefined') {
    const requiredConfigs = { ...firebaseConfig };
    // measurementId is optional, so we remove it from the check
    delete (requiredConfigs as any).measurementId;

    const missingConfigs = Object.entries(requiredConfigs)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

    if (missingConfigs.length > 0) {
        const errorMessage = `Firebase configuration is missing or incomplete. Please check your .env file. Missing environment variables: ${missingConfigs.join(', ')}`;
        console.error(errorMessage);
        // We throw an error to halt execution if the config is invalid.
        // This prevents the app from trying to initialize Firebase with bad data.
        throw new Error(errorMessage);
    }

    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    auth = getAuth(app);
}

const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized. This is likely due to missing configuration. Check the console for errors.");
  }
  return signInWithPopup(auth, provider);
};

export const signOutWithGoogle = () => {
  if (!auth) {
    return Promise.reject("Firebase Auth is not initialized.");
  }
  return signOut(auth);
};

export { app, auth };
