/**
 * Activity Engine Actions — Firebase Edition
 * All server actions have been replaced with Firebase RTDB client calls.
 */

import * as admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Initializes Firebase Admin for server actions.
 */
function resolveServiceAccountPath() {
  const fromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;

  const cwd = process.cwd();
  const candidate = fs
    .readdirSync(cwd)
    .find((file) => file.includes('firebase-adminsdk') && file.endsWith('.json'));

  return candidate ? path.join(cwd, candidate) : null;
}

function getAdminDb() {
  if (!admin.apps.length) {
    const serviceAccountPath = resolveServiceAccountPath();
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'classroomengagement-2026';
    const defaultDatabaseUrl =
      projectId === 'classroomengagement-2026'
        ? 'https://classroomengagement-2026-default-rtdb.asia-southeast1.firebasedatabase.app'
        : `https://${projectId}-default-rtdb.firebaseio.com`;
    const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || defaultDatabaseUrl;

    if (serviceAccountPath) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8')) as admin.ServiceAccount;
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL,
        projectId: serviceAccount.projectId || projectId,
      });
    } else {
      admin.initializeApp({ projectId, databaseURL });
    }
  }

  return admin.database();
}

/**
 * Generates a random 6-character alphanumeric uppercase join code.
 */
function generateJoinCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Interfaces for responses
 */
export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

/**
 * Launches a new session from a provided activity template.
 * Creates the session record in Firebase RTDB under sessions/{sessionId}.
 */
export async function launchSession(
  teacherId: string,
  template: Template
): Promise<ActionResponse<Session>> {
  try {
    const db = getAdminDb();
    const sessionsRef = db.ref('sessions');

    let retries = 5;
    let session: Record<string, unknown> | null = null;

    while (retries > 0) {
      const joinCode = generateJoinCode();
      const snapshot = await sessionsRef.get();
      const sessions = snapshot.exists() ? Object.values(snapshot.val()) as Array<Record<string, unknown>> : [];
      const exists = sessions.some((s) => s.join_code === joinCode || s.code === joinCode);

      if (!exists) {
        const sessionRef = sessionsRef.push();
        session = {
          id: sessionRef.key,
          activity_template_id: templateId,
          class_id: classId || null,
          join_code: joinCode,
          code: joinCode,
          status: 'live',
          started_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          participants: {},
        };
        await sessionRef.set(session);
        break;
      }

      retries--;
    }

    if (!session) {
      return {
        success: false,
        error: 'Failed to generate a unique join code. Please try again.',
      };
    }

    return { success: true, data: session };
  } catch (error: unknown) {
    console.error('SERVER ACTION ERROR: launchSession -', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected server error occurred.',
    };
  }
}

/**
 * Allows a student to join a live/scheduled session via its join code.
 * Writes participant entry to sessions/{sessionId}/participants/{participantId}.
 */
export async function joinSessionWithCode(
  code: string,
  participant: { id: string; name: string }
): Promise<ActionResponse<{ sessionId: string; session: Session }>> {
  try {
    const db = getAdminDb();
    const upperCode = joinCode.toUpperCase().trim();
    
    // Validate the input code format
    if (!/^[A-Z0-9]{6}$/.test(upperCode)) {
      return { success: false, error: 'Invalid join code format. Must be 6 alphanumeric characters.' };
    }

    const sessionsSnapshot = await db.ref('sessions').get();
    const sessions = sessionsSnapshot.exists() ? Object.values(sessionsSnapshot.val()) as Array<Record<string, unknown>> : [];
    const session = sessions.find(
      (s) => (s.join_code === upperCode || s.code === upperCode) && s.status === 'live'
    );

    if (!session || !session.id) {
      return { success: false, error: 'Session not found or is no longer live.' };
    }

    const participantId = `stu-${Math.random().toString(36).slice(2, 8)}`;
    await db.ref(`sessions/${session.id}/participants/${participantId}`).set({
      id: participantId,
      joined_at: new Date().toISOString(),
    });

    return { success: true, data: { sessionId: String(session.id) } };
  } catch (error: unknown) {
    console.error('SERVER ACTION ERROR: joinSessionWithCode -', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected server error occurred.',
    };
  }
}
