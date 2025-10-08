
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
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

// This file is largely deprecated in favor of the centralized `src/firebase/index.ts`
// but is kept for legacy references that might exist.
// The new architecture uses `useAuth` and `useFirestore` hooks from `@/firebase`.

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== "undefined") {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
}

export { auth, app, db };
