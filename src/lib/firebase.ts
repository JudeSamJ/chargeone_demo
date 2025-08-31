import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPhoneNumber as firebaseSignInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  OAuthProvider
} from "firebase/auth";
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

// Initialize Firebase App
let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

// Social Providers
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');


export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

export const signInWithApple = () => {
    return signInWithPopup(auth, appleProvider);
}

export const signOutWithGoogle = () => {
  return signOut(auth);
};

// Email/Password Auth
export const signUpWithEmail = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

export const signInWithEmail = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

// Phone Auth
const setupRecaptcha = () => {
  if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
  }
};

export const signInWithPhoneNumber = (phoneNumber: string): Promise<ConfirmationResult> => {
  setupRecaptcha();
  const appVerifier = window.recaptchaVerifier;
  const formattedPhoneNumber = `+91${phoneNumber}`;
  return firebaseSignInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
};

export const verifyPhoneNumberOtp = (confirmationResult: ConfirmationResult, otp: string) => {
  return confirmationResult.confirm(otp);
};


export { auth, app, db };