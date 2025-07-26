import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyCTjAWqGUnxDV4YeUxYHbogfRvs5cZTTIg",
  authDomain: "chargeone.firebaseapp.com",
  projectId: "chargeone",
  storageBucket: "chargeone.firebasestorage.app",
  messagingSenderId: "669583586032",
  appId: "1:669583586032:web:c0c73391c7eb691c7ec835"
};

let app;
try {
  app = getApp();
} catch (e) {
  app = initializeApp(firebaseConfig);
}

export const auth = getAuth(app);
