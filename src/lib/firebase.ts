
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

function getFirebaseApp(): FirebaseApp {
    if (typeof window === 'undefined') {
        // This is a server-side render, Firebase should not be initialized here.
        // We will return a dummy object or handle as per app's server-side needs.
        // For now, we will assume client-side only initialization for auth.
        // A proper implementation might use the Firebase Admin SDK on the server.
        if (!getApps().length) {
            return initializeApp(firebaseConfig);
        }
        return getApp();
    }

    const requiredConfigs = { ...firebaseConfig };
    // measurementId is optional for auth
    delete (requiredConfigs as any).measurementId;

    const missingConfigs = Object.entries(requiredConfigs)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

    if (missingConfigs.length > 0) {
        const errorMessage = `Firebase configuration is missing or incomplete in your .env file. Missing environment variables: ${missingConfigs.join(', ')}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
    
    if (!getApps().length) {
        return initializeApp(firebaseConfig);
    } 
    return getApp();
}


function getFirebaseAuth(): Auth {
    const app = getFirebaseApp();
    return getAuth(app);
}

const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  const auth = getFirebaseAuth();
  return signInWithPopup(auth, provider);
};

export const signOutWithGoogle = () => {
  const auth = getFirebaseAuth();
  return signOut(auth);
};

export const auth = getFirebaseAuth();
export const app = getFirebaseApp();
