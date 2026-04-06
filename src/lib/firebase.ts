// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyD5ZjpqZu_2zMQE0Pw96EpQVSmMGWebKx8',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'classroomengagement-2026.firebaseapp.com',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://classroomengagement-2026-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'classroomengagement-2026',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'classroomengagement-2026.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '332660780708',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:332660780708:web:61dbc1b96baae7a1f2c031',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-36274FN102'
};

// Initialize Firebase only if it hasn't been initialized already
let app: any;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch {
  console.warn('Firebase initialization failed.');
  app = getApps().length ? getApp() : undefined;
}

// Initialize Firebase Authentication and get a reference to the service
export const auth: Auth | null = app ? getAuth(app) : null;

// Initialize Realtime Database and get a reference to the service
export const database: Database | null = app ? getDatabase(app) : null;

// Initialize Analytics (only on client side and with valid key)
export const getAnalyticsInstance = async (): Promise<Analytics | null> => {
  if (app && typeof window !== 'undefined') {
    const supported = await isSupported();
    if (supported) {
      return getAnalytics(app);
    }
  }
  return null;
};

export { app };
