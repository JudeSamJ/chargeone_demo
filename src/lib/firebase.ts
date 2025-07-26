import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCTjAWqGUnxDV4YeUxYHbogfRvs5cZTTIg",
  authDomain: "chargeone.firebaseapp.com",
  projectId: "chargeone",
  storageBucket: "chargeone.firebasestorage.app",
  messagingSenderId: "669583586032",
  appId: "1:669583586032:web:c0c73391c7eb691c7ec835"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
