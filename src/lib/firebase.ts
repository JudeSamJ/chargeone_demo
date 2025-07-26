import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  projectId: "chargeone",
  appId: "1:669583586032:web:c0c73391c7eb691c7ec835",
  storageBucket: "chargeone.firebasestorage.app",
  apiKey: "AIzaSyCTjAWqGUnxDV4YeUxYHbogfRvs5cZTTIg",
  authDomain: "chargeone.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "669583586032"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
