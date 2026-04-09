import { ref, set, get, update, remove, push, onValue, off, query, orderByChild, equalTo, Database } from 'firebase/database';
import { database } from './firebase';
import { SessionStatus } from '@classroom/shared-utils';

// ─────────────────────────────────────────────
// Interfaces (mirrors Firebase RTDB schema)
// ─────────────────────────────────────────────

export interface Teacher {
  uid: string;
  email: string;
  displayName: string;
  department?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface Student {
  uid: string;
  email: string;
  displayName: string;
  studentId?: string;
  department?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface UserRole {
  uid: string;
  email: string;
  role: 'teacher' | 'student' | 'admin';
  displayName: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface ActivityLog {
  id: string;
  sessionId?: string;
  type: 'SESSION_CREATED' | 'SESSION_STARTED' | 'SESSION_ENDED' | 'PARTICIPANT_JOINED' | 'PARTICIPANT_LEFT' | 'RESPONSE_SUBMITTED';
  payload?: any;
  timestamp: string;
  userId: string;
  userEmail?: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER';
  points: number;
  options?: { id: string; text: string; isCorrect: boolean }[];
  correctAnswers?: string[];
}

export interface PollOption {
  id: string;
  text: string;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface SessionResponse {
  id: string;
  participantId: string;
  activityId: string;
  data: any;
  timestamp: number;
}

export interface Session {
  id: string;
  teacherId: string;
  teacherEmail?: string;
  templateId?: string;
  type?: string;
  title: string;
  code: string;
  joinPassword?: string;
  status: SessionStatus;
  templateSnapshot?: any;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  participants?: Record<string, Participant>;
  responses?: Record<string, SessionResponse>;
}

export interface ActivityTemplate {
  id: string;
  teacherId: string;
  type: string;
  title: string;
  config?: Record<string, unknown>;
  questions?: unknown[];
  options?: unknown[];
  prompt?: string;
  groupSize?: number;
  createdAt: string;
}

/** Helper to ensure database is available */
function assertDb(): Database {
  if (!database) {
    throw new Error('Firebase Database not initialized');
  }
  return database;
}

function isTeacherRecord(value: unknown): value is Teacher {
  const candidate = value as Partial<Teacher>;
  return Boolean(
    candidate &&
    typeof candidate === 'object' &&
    typeof candidate.uid === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.displayName === 'string'
  );
}

function isStudentRecord(value: unknown): value is Student {
  const candidate = value as Partial<Student>;
  return Boolean(
    candidate &&
    typeof candidate === 'object' &&
    typeof candidate.uid === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.displayName === 'string'
  );
}

class FirebaseDatabaseService {

  // ── Unified Users ────────────────────────────

  async createUser(user: Omit<UserRole, 'createdAt' | 'lastLoginAt'>): Promise<void> {
    const db = assertDb();
    const userData: UserRole = {
      ...user,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    await set(ref(db, `users/${user.uid}`), userData);
  }

  async getUser(uid: string): Promise<UserRole | null> {
    const db = assertDb();
    try {
      const snapshot = await get(ref(db, `users/${uid}`));
      return snapshot.exists() ? snapshot.val() : null;
    } catch { return null; }
  }

  async updateUserLastLogin(uid: string): Promise<void> {
    const db = assertDb();
    await update(ref(db, `users/${uid}`), { lastLoginAt: new Date().toISOString() });
  }

  async deleteUser(uid: string): Promise<void> {
    const db = assertDb();
    await remove(ref(db, `users/${uid}`));
  }

  // ── Teachers ──────────────────────────────

  async createTeacher(teacher: Omit<Teacher, 'createdAt' | 'lastLoginAt'>): Promise<void> {
    const db = assertDb();
    const teacherData: Teacher = {
      ...teacher,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    await set(ref(db, `teachers/${teacher.uid}`), teacherData);
  }

  async getTeacher(uid: string): Promise<Teacher | null> {
    const db = assertDb();
    try {
      const snapshot = await get(ref(db, `teachers/${uid}`));
      return snapshot.exists() ? snapshot.val() : null;
    } catch { return null; }
  }

  async updateTeacherLastLogin(uid: string): Promise<void> {
    const db = assertDb();
    await set(ref(db, `teachers/${uid}/lastLoginAt`), new Date().toISOString());
  }

  async deleteTeacher(uid: string): Promise<void> {
    const db = assertDb();
    await remove(ref(db, `teachers/${uid}`));
  }

  async getAllTeachers(): Promise<Teacher[]> {
    const db = assertDb();
    try {
      const snapshot = await get(ref(db, 'teachers'));
      if (!snapshot.exists()) return [];
      const teachers: Teacher[] = [];
      snapshot.forEach((child) => {
        const value = child.val();
        if (isTeacherRecord(value)) {
          teachers.push(value);
        }
      });
      return teachers;
    } catch { return []; }
  }

  onTeachersUpdate(callback: (teachers: Teacher[]) => void) {
    const db = assertDb();
    const r = ref(db, 'teachers');
    onValue(r, (snapshot) => {
      const teachers: Teacher[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((c) => {
          const value = c.val();
          if (isTeacherRecord(value)) {
            teachers.push(value);
          }
        });
      }
      callback(teachers);
    });
    return () => off(r);
  }

  // ── Students ──────────────────────────────

  async createStudent(student: Omit<Student, 'createdAt' | 'lastLoginAt'>): Promise<void> {
    const db = assertDb();
    const studentData: Student = {
      ...student,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    await set(ref(db, `students/${student.uid}`), studentData);
  }

  async getStudent(uid: string): Promise<Student | null> {
    const db = assertDb();
    try {
      const snapshot = await get(ref(db, `students/${uid}`));
      return snapshot.exists() ? snapshot.val() : null;
    } catch { return null; }
  }

  async updateStudentLastLogin(uid: string): Promise<void> {
    const db = assertDb();
    await set(ref(db, `students/${uid}/lastLoginAt`), new Date().toISOString());
  }

  async deleteStudent(uid: string): Promise<void> {
    const db = assertDb();
    await remove(ref(db, `students/${uid}`));
  }

  async getAllStudents(): Promise<Student[]> {
    const db = assertDb();
    try {
      const snapshot = await get(ref(db, 'students'));
      if (!snapshot.exists()) return [];
      const students: Student[] = [];
      snapshot.forEach((child) => {
        const value = child.val();
        if (isStudentRecord(value)) {
          students.push(value);
        }
      });
      return students;
    } catch { return []; }
  }

  onStudentsUpdate(callback: (students: Student[]) => void) {
    const db = assertDb();
    const r = ref(db, 'students');
    onValue(r, (snapshot) => {
      const students: Student[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((c) => {
          const value = c.val();
          if (isStudentRecord(value)) {
            students.push(value);
          }
        });
      }
      callback(students);
    });
    return () => off(r);
  }

  // ── Sessions ──────────────────────────────

  async createSession(session: Omit<Session, 'createdAt' | 'participants'>): Promise<void> {
    const db = assertDb();
    const sessionData: Session = {
      ...session,
      createdAt: new Date().toISOString(),
      participants: {},
    };
    await set(ref(db, `sessions/${session.id}`), sessionData);
    
    // Log initial creation
    await this.createActivityLog({
      sessionId: session.id,
      type: 'SESSION_CREATED',
      userId: session.teacherId,
      userEmail: session.teacherEmail,
      payload: { code: session.code, type: session.type, title: session.title }
    });
  }

  async createActivityLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
    const db = assertDb();
    const logRef = ref(db, 'activityLogs');
    const newLogRef = push(logRef);
    await set(newLogRef, {
      ...log,
      id: newLogRef.key,
      timestamp: new Date().toISOString()
    });
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const db = assertDb();
    try {
      const snapshot = await get(ref(db, `sessions/${sessionId}`));
      return snapshot.exists() ? snapshot.val() : null;
    } catch { return null; }
  }

  async getSessionByCode(code: string): Promise<Session | null> {
    const db = assertDb();
    try {
      const snapshot = await get(ref(db, 'sessions'));
      if (!snapshot.exists()) return null;
      const target = code.trim().toUpperCase();
      let found: Session | null = null;
      snapshot.forEach((child) => {
        const s = child.val() as Session;
        if (String(s.code || '').trim().toUpperCase() === target) {
          found = s;
        }
      });
      return found;
    } catch { return null; }
  }

  private generateJoinCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async createSessionFromTemplate(input: {
    teacherId: string;
    teacherEmail?: string;
    template: ActivityTemplate;
    joinPassword?: string;
    status?: SessionStatus;
  }): Promise<Session> {
    const { teacherId, teacherEmail, template, joinPassword, status } = input;
    const normalizedPassword = (joinPassword || '000000').trim();

    let code = this.generateJoinCode();
    let retry = 12;
    while (retry > 0) {
      const existing = await this.getSessionByCode(code);
      if (!existing) break;
      code = this.generateJoinCode();
      retry -= 1;
    }

    if (retry <= 0) {
      throw new Error('Unable to generate a unique session code. Please try again.');
    }

    const sessionBase: Omit<Session, 'createdAt' | 'participants'> = {
      id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      teacherId,
      teacherEmail,
      templateId: template.id,
      type: template.type,
      title: template.title,
      code,
      joinPassword: normalizedPassword,
      status: status || 'SCHEDULED',
      templateSnapshot: template,
    };

    await this.createSession(sessionBase);

    return {
      ...sessionBase,
      createdAt: new Date().toISOString(),
      participants: {},
    };
  }

  async updateSessionStatus(sessionId: string, status: SessionStatus, extra?: { startedAt?: string; endedAt?: string }): Promise<void> {
    const db = assertDb();
    const updates: Record<string, unknown> = { status };
    if (extra?.startedAt) updates.startedAt = extra.startedAt;
    if (extra?.endedAt) updates.endedAt = extra.endedAt;
    await update(ref(db, `sessions/${sessionId}`), updates);
  }

  async getTeacherSessions(teacherId: string): Promise<Session[]> {
    const db = assertDb();
    try {
      const snapshot = await get(ref(db, 'sessions'));
      if (!snapshot.exists()) return [];
      const sessions: Session[] = [];
      snapshot.forEach((child) => {
        const s = child.val() as Session;
        if (s.teacherId === teacherId) sessions.push(s);
      });
      return sessions;
    } catch { return []; }
  }

  async addParticipantToSession(sessionId: string, student: Student): Promise<void> {
    const db = assertDb();
    const participant: Participant = {
      id: student.uid,
      name: student.displayName,
      joinedAt: new Date().toISOString()
    };
    await set(ref(db, `sessions/${sessionId}/participants/${student.uid}`), participant);
  }

  async addResponse(sessionId: string, response: Omit<SessionResponse, 'id'>): Promise<void> {
    const db = assertDb();
    const responsesRef = ref(db, `sessions/${sessionId}/responses`);
    const newResponseRef = push(responsesRef);
    await set(newResponseRef, {
      ...response,
      id: newResponseRef.key,
      timestamp: Date.now()
    });
  }

  async getResponses(sessionId: string): Promise<SessionResponse[]> {
    const db = assertDb();
    try {
      const snapshot = await get(ref(db, `sessions/${sessionId}/responses`));
      if (!snapshot.exists()) return [];
      const responses: SessionResponse[] = [];
      snapshot.forEach((child) => {
        responses.push(child.val());
      });
      return responses;
    } catch { return []; }
  }

  async removeParticipantFromSession(sessionId: string, participantId: string): Promise<void> {
    const db = assertDb();
    await remove(ref(db, `sessions/${sessionId}/participants/${participantId}`));
  }

  onSessionUpdate(sessionId: string, callback: (session: Session) => void) {
    const db = assertDb();
    const r = ref(db, `sessions/${sessionId}`);
    onValue(r, (snapshot) => {
      if (snapshot.exists()) callback(snapshot.val());
    });
    return () => off(r);
  }

  onSessionParticipantsUpdate(sessionId: string, callback: (participants: Participant[]) => void) {
    const db = assertDb();
    const r = ref(db, `sessions/${sessionId}/participants`);
    onValue(r, (snapshot) => {
      const participants: Participant[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          participants.push(child.val());
        });
      }
      callback(participants);
    });
    return () => off(r);
  }

  onSessionResponsesUpdate(sessionId: string, callback: (responses: SessionResponse[]) => void) {
    const db = assertDb();
    const r = ref(db, `sessions/${sessionId}/responses`);
    onValue(r, (snapshot) => {
      const responses: SessionResponse[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          responses.push(child.val());
        });
      }
      callback(responses);
    });
    return () => off(r);
  }

  // ── Activity Templates ──────────────────────────────

  async createTemplate(template: Omit<ActivityTemplate, 'createdAt'>): Promise<void> {
    const db = assertDb();
    const data = JSON.parse(JSON.stringify({
      ...template,
      createdAt: new Date().toISOString(),
    }));

    // Primary storage path aligned with Firebase database.rules.json
    await set(ref(db, `templates/${template.teacherId}/${template.id}`), data);

    // Best-effort legacy write for backward compatibility with older data snapshots.
    try {
      await set(ref(db, `activityTemplates/${template.id}`), data);
    } catch {
      // Ignore legacy path failures (commonly caused by stricter rules).
    }
  }

  async createActivityTemplate(template: Omit<ActivityTemplate, 'createdAt'>): Promise<void> {
    await this.createTemplate(template);
  }

  async getTemplatesByTeacher(teacherId: string): Promise<ActivityTemplate[]> {
    const db = assertDb();
    try {
      const templatesById = new Map<string, ActivityTemplate>();

      const scopedSnapshot = await get(ref(db, `templates/${teacherId}`));
      if (scopedSnapshot.exists()) {
        scopedSnapshot.forEach((child) => {
          const t = child.val() as ActivityTemplate;
          if (t?.id) {
            templatesById.set(t.id, t);
          }
        });
      }

      // Best-effort legacy read.
      try {
        const legacySnapshot = await get(ref(db, 'activityTemplates'));
        if (legacySnapshot.exists()) {
          legacySnapshot.forEach((child) => {
            const t = child.val() as ActivityTemplate;
            if (t?.teacherId === teacherId && t?.id && !templatesById.has(t.id)) {
              templatesById.set(t.id, t);
            }
          });
        }
      } catch {
        // Ignore if legacy node is not readable under current rules.
      }

      return Array.from(templatesById.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch { return []; }
  }

  async getTemplate(templateId: string, teacherId?: string): Promise<ActivityTemplate | null> {
    const db = assertDb();
    try {
      if (teacherId) {
        const scopedSnapshot = await get(ref(db, `templates/${teacherId}/${templateId}`));
        if (scopedSnapshot.exists()) {
          return scopedSnapshot.val();
        }
      }

      const snapshot = await get(ref(db, `activityTemplates/${templateId}`));
      return snapshot.exists() ? snapshot.val() : null;
    } catch { return null; }
  }

  async deleteTemplate(teacherId: string, templateId: string): Promise<void> {
    const db = assertDb();
    const template = await this.getTemplate(templateId, teacherId);
    if (template && template.teacherId === teacherId) {
      await remove(ref(db, `templates/${teacherId}/${templateId}`));
      try {
        await remove(ref(db, `activityTemplates/${templateId}`));
      } catch {
        // Ignore legacy cleanup failures.
      }
    }
  }

  async getActivityTemplate(templateId: string, teacherId?: string): Promise<ActivityTemplate | null> {
    return this.getTemplate(templateId, teacherId);
  }
}

export const dbService = new FirebaseDatabaseService();