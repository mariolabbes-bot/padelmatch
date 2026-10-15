import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyBpMD02tdrN-2JsGP-xR_HSEBBPtmiwMjc",
  authDomain: "sync-593d0.firebaseapp.com",
  projectId: "sync-593d0",
  storageBucket: "sync-593d0.firebasestorage.app",
  messagingSenderId: "568731212427",
  appId: "1:568731212427:web:17db27628579e38cff528e",
  measurementId: "G-12PHF8KLWN"
};

// Initialize Firebase only once
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
