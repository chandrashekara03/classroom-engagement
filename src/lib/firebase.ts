// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'dummy-api-key-00000000000000000000000',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dummy-app.firebaseapp.com',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://dummy-app-default-rtdb.firebaseio.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dummy-app-id',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dummy-app.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000'
};

// Initialize Firebase only if it hasn't been initialized already
let app;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  console.warn('Firebase fallback triggered');
  app = getApps().length ? getApp() : undefined;
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = app ? getAuth(app) : null as any;

// Initialize Realtime Database and get a reference to the service
export const database = app ? getDatabase(app) : null as any;

export { app };
