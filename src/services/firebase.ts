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

/**
 * Strips all `undefined` fields from an object so Firestore accepts it without errors
 */
export function cleanForFirestore<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => typeof item === 'object' && item !== null ? cleanForFirestore(item) : item) as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        cleaned[key] = cleanForFirestore(val);
      } else if (Array.isArray(val)) {
        cleaned[key] = val.map(item => typeof item === 'object' && item !== null ? cleanForFirestore(item) : item);
      } else {
        cleaned[key] = val;
      }
    }
  }
  return cleaned as T;
}
