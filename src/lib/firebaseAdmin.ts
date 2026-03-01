import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    try {
        // If you don't have a service account JSON, we will use the default credentials or initialize an empty app 
        // that can at least verify ID tokens via the public project id.
        admin.initializeApp({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
    } catch (error) {
        console.error('Firebase admin initialization error', error);
    }
}

export const adminAuth = admin.auth();
