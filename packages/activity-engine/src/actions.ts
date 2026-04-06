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

export interface Template {
  id: string;
  title?: string;
  classId?: string | null;
  [key: string]: unknown;
}

export interface Session {
  id: string;
  teacher_id: string;
  activity_template_id: string;
  class_id: string | null;
  join_code: string;
  code: string;
  title: string;
  status: string;
  started_at: string;
  created_at: string;
  participants: Record<string, { id: string; name: string; joined_at: string }>;
  [key: string]: unknown;
}

/**
 * Launches a new session from a provided activity template.
 * Creates the session record in Firebase RTDB under sessions/{sessionId}.
 */
export async function launchSession(
  teacherId: string,
  template: Template
): Promise<ActionResponse<Session>> {
  try {
    if (!teacherId) {
      return { success: false, error: 'Teacher ID is required.' };
    }
    if (!template?.id) {
      return { success: false, error: 'Template ID is required.' };
    }

    const db = getAdminDb();
    const sessionsRef = db.ref('sessions');

    let retries = 5;
    let session: Session | null = null;

    while (retries > 0) {
      const joinCode = generateJoinCode();
      const snapshot = await sessionsRef.get();
      const sessionMap = snapshot.exists()
        ? (snapshot.val() as Record<string, Partial<Session>>)
        : {};
      const exists = Object.values(sessionMap).some((s) => s.join_code === joinCode || s.code === joinCode);

      if (!exists) {
        const sessionRef = sessionsRef.push();
        if (!sessionRef.key) {
          throw new Error('Unable to allocate a session id.');
        }

        session = {
          id: sessionRef.key,
          teacher_id: teacherId,
          activity_template_id: template.id,
          class_id: template.classId ?? null,
          join_code: joinCode,
          code: joinCode,
          title: template.title || 'New Session',
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
    const upperCode = code.toUpperCase().trim();
    
    // Validate the input code format
    if (!/^[A-Z0-9]{6}$/.test(upperCode)) {
      return { success: false, error: 'Invalid join code format. Must be 6 alphanumeric characters.' };
    }

    const sessionsSnapshot = await db.ref('sessions').get();
    const sessionsMap = sessionsSnapshot.exists()
      ? (sessionsSnapshot.val() as Record<string, Partial<Session>>)
      : {};

    const matched = Object.entries(sessionsMap).find(
      ([, s]) => {
        const candidateCode = String(s.join_code || s.code || '').toUpperCase();
        const candidateStatus = String(s.status || '').toLowerCase();
        return candidateCode === upperCode && candidateStatus === 'live';
      }
    );

    if (!matched) {
      return { success: false, error: 'Session not found or is no longer live.' };
    }

    const [sessionKey, foundSession] = matched;
    const sessionId = String(foundSession.id || sessionKey);

    const participantId = participant.id || `stu-${Math.random().toString(36).slice(2, 8)}`;
    const participantPayload = {
      id: participantId,
      name: participant.name,
      joined_at: new Date().toISOString(),
    };

    await db.ref(`sessions/${sessionKey}/participants/${participantId}`).set(participantPayload);

    const existingParticipants =
      (foundSession.participants as Session['participants'] | undefined) ?? {};
    const session: Session = {
      id: sessionId,
      teacher_id: String(foundSession.teacher_id || ''),
      activity_template_id: String(foundSession.activity_template_id || ''),
      class_id: (foundSession.class_id as string | null | undefined) ?? null,
      join_code: String(foundSession.join_code || foundSession.code || upperCode),
      code: String(foundSession.code || foundSession.join_code || upperCode),
      title: String(foundSession.title || 'Live Session'),
      status: String(foundSession.status || 'live'),
      started_at: String(foundSession.started_at || ''),
      created_at: String(foundSession.created_at || ''),
      participants: {
        ...existingParticipants,
        [participantId]: participantPayload,
      },
    };

    return { success: true, data: { sessionId, session } };
  } catch (error: unknown) {
    console.error('SERVER ACTION ERROR: joinSessionWithCode -', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected server error occurred.',
    };
  }
}
