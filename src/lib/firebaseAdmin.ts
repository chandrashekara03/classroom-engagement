import * as admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';

function resolveServiceAccountPath() {
    const fromEnv =
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (fromEnv && fs.existsSync(fromEnv)) {
        return fromEnv;
    }

    const workspaceRoot = process.cwd();
    const candidates = fs
        .readdirSync(workspaceRoot)
        .filter((file) => file.includes('firebase-adminsdk') && file.endsWith('.json'));

    if (candidates.length > 0) {
        return path.join(workspaceRoot, candidates[0]);
    }

    return null;
}

function buildDefaultDatabaseUrl(projectId: string) {
    return `https://${projectId}-default-rtdb.firebaseio.com`;
}

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    try {
        const serviceAccountPath = resolveServiceAccountPath();

        if (serviceAccountPath) {
            const serviceAccount = JSON.parse(
                fs.readFileSync(serviceAccountPath, 'utf-8')
            ) as admin.ServiceAccount;

            const projectId =
                serviceAccount.projectId ||
                process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
                'classroom-engagement-christ';
            const databaseURL =
                process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
                buildDefaultDatabaseUrl(projectId);

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL,
                projectId,
            });
        } else {
            const projectId =
                process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
                'classroom-engagement-christ';
            const databaseURL =
                process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
                buildDefaultDatabaseUrl(projectId);

            admin.initializeApp({
                projectId,
                databaseURL,
            });
        }
    } catch (error) {
        console.error('Firebase admin initialization error', error);
    }
}

export const adminAuth = admin.auth();
export const adminDb = admin.database();
