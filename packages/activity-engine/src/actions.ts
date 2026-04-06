/**
 * Activity Engine Actions — Firebase Edition
 * All server actions have been replaced with Firebase RTDB client calls.
 */

import { dbService, Template, Session } from '../../../src/lib/database';

/**
 * Standard response shape for all action functions.
 */
export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

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
 * Launches a new session from a provided activity template.
 * Creates the session record in Firebase RTDB under sessions/{sessionId}.
 */
export async function launchSession(
  teacherId: string,
  template: Template
): Promise<ActionResponse<Session>> {
  try {
    const code = generateJoinCode();
    const newSession: Omit<Session, 'createdAt' | 'participants'> = {
      id: `session-${Date.now()}`,
      teacherId,
      templateId: template.id,
      title: template.title,
      code,
      status: 'SCHEDULED',
    };

    await dbService.createSession(newSession);

    const created = await dbService.getSession(newSession.id);
    if (!created) {
      return { success: false, error: 'Session created but could not be retrieved.' };
    }

    return { success: true, data: created };
  } catch (error: unknown) {
    console.error('launchSession error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred.',
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
    const upperCode = code.toUpperCase().trim();

    if (!/^[A-Z0-9]{6}$/.test(upperCode)) {
      return {
        success: false,
        error: 'Invalid join code format. Must be 6 alphanumeric characters.',
      };
    }

    const session = await dbService.joinSession(upperCode, participant);

    if (!session) {
      return { success: false, error: 'Session not found. Please check the code.' };
    }

    return {
      success: true,
      data: { sessionId: session.id, session },
      message: `Joined session "${session.title}" successfully.`,
    };
  } catch (error: unknown) {
    console.error('joinSessionWithCode error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred.',
    };
  }
}
