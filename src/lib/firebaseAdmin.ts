import * as admin from 'firebase-admin';
import fs from 'node:fs';
import os from 'node:os';
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
    if (projectId === 'classroomengagement-2026') {
        return 'https://classroomengagement-2026-default-rtdb.asia-southeast1.firebasedatabase.app';
    }
    return `https://${projectId}-default-rtdb.firebaseio.com`;
}

type FirebaseCliToken = {
    accessToken: string | null;
    expiresAtMs: number | null;
    refreshToken: string | null;
};

const FIREBASE_CLI_CLIENT_ID =
    process.env.FIREBASE_CLIENT_ID ||
    '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';

const FIREBASE_CLI_CLIENT_SECRET =
    process.env.FIREBASE_CLIENT_SECRET ||
    'j9iVZfS8kkCEFUPaAeJV0sAi';

const FIREBASE_TOKEN_REFRESH_BUFFER_MS = 2 * 60 * 1000;

function parseFirebaseCliToken(raw: string): FirebaseCliToken | null {
    try {
        const parsed = JSON.parse(raw) as {
            tokens?: {
                access_token?: unknown;
                expires_at?: unknown;
                refresh_token?: unknown;
            };
        };

        const accessToken =
            typeof parsed.tokens?.access_token === 'string'
                ? parsed.tokens.access_token.trim()
                : null;

        const refreshToken =
            typeof parsed.tokens?.refresh_token === 'string'
                ? parsed.tokens.refresh_token.trim()
                : null;

        if (!accessToken && !refreshToken) {
            return null;
        }

        const expiresAtMs =
            typeof parsed.tokens?.expires_at === 'number'
                ? parsed.tokens.expires_at
                : null;

        return {
            accessToken: accessToken && accessToken.length > 0 ? accessToken : null,
            expiresAtMs,
            refreshToken: refreshToken && refreshToken.length > 0 ? refreshToken : null,
        };
    } catch {
        return null;
    }
}

function getFirebaseCliConfigPaths(): string[] {
    const paths = [
        path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json'),
    ];

    if (process.env.APPDATA) {
        paths.push(path.join(process.env.APPDATA, 'configstore', 'firebase-tools.json'));
    }

    return [...new Set(paths)];
}

function readFirebaseCliToken(): FirebaseCliToken | null {
    for (const filePath of getFirebaseCliConfigPaths()) {
        if (!fs.existsSync(filePath)) {
            continue;
        }

        try {
            const raw = fs.readFileSync(filePath, 'utf-8');
            const token = parseFirebaseCliToken(raw);
            if (token) {
                return token;
            }
        } catch {
            // Continue to next candidate path.
        }
    }

    return null;
}

async function refreshFirebaseCliAccessToken(refreshToken: string): Promise<FirebaseCliToken | null> {
    const body = new URLSearchParams({
        client_id: FIREBASE_CLI_CLIENT_ID,
        client_secret: FIREBASE_CLI_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
    });

    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body,
        });

        if (!response.ok) {
            return null;
        }

        const payload = (await response.json()) as {
            access_token?: unknown;
            expires_in?: unknown;
        };

        const accessToken =
            typeof payload.access_token === 'string' ? payload.access_token.trim() : '';

        if (!accessToken) {
            return null;
        }

        const expiresInSec =
            typeof payload.expires_in === 'number' && Number.isFinite(payload.expires_in)
                ? payload.expires_in
                : 3600;

        return {
            accessToken,
            expiresAtMs: Date.now() + expiresInSec * 1000,
            refreshToken,
        };
    } catch {
        return null;
    }
}

async function getValidFirebaseCliToken(): Promise<FirebaseCliToken | null> {
    const current = readFirebaseCliToken();
    if (!current) {
        return null;
    }

    const isCurrentTokenValid =
        Boolean(current.accessToken) &&
        (current.expiresAtMs === null ||
            current.expiresAtMs - Date.now() > FIREBASE_TOKEN_REFRESH_BUFFER_MS);

    if (isCurrentTokenValid) {
        return current;
    }

    if (!current.refreshToken) {
        return null;
    }

    const refreshed = await refreshFirebaseCliAccessToken(current.refreshToken);
    if (!refreshed) {
        return null;
    }

    return refreshed;
}

function createFirebaseCliCredential(): admin.credential.Credential | null {
    const token = readFirebaseCliToken();
    if (!token?.accessToken && !token?.refreshToken) {
        return null;
    }

    return {
        getAccessToken: async () => {
            const latest = await getValidFirebaseCliToken();
            if (!latest || !latest.accessToken) {
                throw new Error('Firebase CLI token is unavailable. Run `firebase login` again.');
            }

            const secondsRemaining = latest.expiresAtMs
                ? Math.floor((latest.expiresAtMs - Date.now()) / 1000)
                : 3600;

            return {
                access_token: latest.accessToken,
                expires_in: Math.max(secondsRemaining, 60),
            };
        },
    };
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
                'classroomengagement-2026';
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
                'classroomengagement-2026';
            const databaseURL =
                process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
                buildDefaultDatabaseUrl(projectId);

            const cliCredential = createFirebaseCliCredential();

            if (cliCredential) {
                admin.initializeApp({
                    credential: cliCredential,
                    projectId,
                    databaseURL,
                });
                console.info('Firebase Admin initialized using local Firebase CLI credentials.');
            } else {
                admin.initializeApp({
                    projectId,
                    databaseURL,
                });
                console.warn('Firebase Admin started without explicit credentials. API routes may fail without `firebase login` or a service account key.');
            }
        }
    } catch (error) {
        console.error('Firebase admin initialization error', error);
    }
}

export const adminAuth = admin.auth();
export const adminDb = admin.database();
