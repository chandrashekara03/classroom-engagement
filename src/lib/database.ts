import { ref, set, get, update, remove, push, onValue, off, query, orderByChild, equalTo } from 'firebase/database';
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

export interface Template {
  id: string;
  teacherId: string;
  type: 'QUIZ' | 'POLL' | 'FEEDBACK' | 'PAIRING';
  title: string;
  config: {
    timer?: boolean;
    scoring?: boolean;
  };
  // Quiz-specific
  questions?: Question[];
  // Poll-specific
  question?: string;
  options?: PollOption[];
  // Feedback-specific
  prompt?: string;
  // Pairing-specific
  groupSize?: number;
  createdAt: string;
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
  data: unknown;
  timestamp: number;
}

export interface Session {
  id: string;
  teacherId: string;
  templateId?: string;
  title: string;
  code: string;
  status: SessionStatus;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  participants: { [key: string]: Participant };
}

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────

function assertDb(): NonNullable<typeof database> {
  if (!database) throw new Error('Firebase Realtime Database is not initialized.');
  return database;
}

// ─────────────────────────────────────────────
// Firebase RTDB Service
// ─────────────────────────────────────────────

class FirebaseDatabaseService {

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
    const snapshot = await get(ref(db, `teachers/${uid}`));
    return snapshot.exists() ? snapshot.val() : null;
  }

  async updateTeacherLastLogin(uid: string): Promise<void> {
    const db = assertDb();
    await set(ref(db, `teachers/${uid}/lastLoginAt`), new Date().toISOString());
  }

  async getAllTeachers(): Promise<Teacher[]> {
    const db = assertDb();
    const snapshot = await get(ref(db, 'teachers'));
    if (!snapshot.exists()) return [];
    const teachers: Teacher[] = [];
    snapshot.forEach((child) => teachers.push(child.val()));
    return teachers;
  }

  onTeachersUpdate(callback: (teachers: Teacher[]) => void) {
    const db = assertDb();
    const r = ref(db, 'teachers');
    onValue(r, (snapshot) => {
      const teachers: Teacher[] = [];
      if (snapshot.exists()) snapshot.forEach((c) => teachers.push(c.val()));
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
    const snapshot = await get(ref(db, `students/${uid}`));
    return snapshot.exists() ? snapshot.val() : null;
  }

  async updateStudentLastLogin(uid: string): Promise<void> {
    const db = assertDb();
    await set(ref(db, `students/${uid}/lastLoginAt`), new Date().toISOString());
  }

  async getAllStudents(): Promise<Student[]> {
    const db = assertDb();
    const snapshot = await get(ref(db, 'students'));
    if (!snapshot.exists()) return [];
    const students: Student[] = [];
    snapshot.forEach((child) => students.push(child.val()));
    return students;
  }

  onStudentsUpdate(callback: (students: Student[]) => void) {
    const db = assertDb();
    const r = ref(db, 'students');
    onValue(r, (snapshot) => {
      const students: Student[] = [];
      if (snapshot.exists()) snapshot.forEach((c) => students.push(c.val()));
      callback(students);
    });
    return () => off(r);
  }

  // ── Templates ─────────────────────────────

  async createTemplate(template: Omit<Template, 'createdAt'>): Promise<void> {
    const db = assertDb();
    const data: Template = {
      ...template,
      createdAt: new Date().toISOString(),
    };
    await set(ref(db, `templates/${template.teacherId}/${template.id}`), data);
  }

  async getTemplatesByTeacher(teacherId: string): Promise<Template[]> {
    const db = assertDb();
    const snapshot = await get(ref(db, `templates/${teacherId}`));
    if (!snapshot.exists()) return [];
    const templates: Template[] = [];
    snapshot.forEach((child) => templates.push(child.val()));
    return templates;
  }

  async getTemplate(teacherId: string, templateId: string): Promise<Template | null> {
    const db = assertDb();
    const snapshot = await get(ref(db, `templates/${teacherId}/${templateId}`));
    return snapshot.exists() ? snapshot.val() : null;
  }

  async deleteTemplate(teacherId: string, templateId: string): Promise<void> {
    const db = assertDb();
    await remove(ref(db, `templates/${teacherId}/${templateId}`));
  }

  onTemplatesUpdate(teacherId: string, callback: (templates: Template[]) => void) {
    const db = assertDb();
    const r = ref(db, `templates/${teacherId}`);
    onValue(r, (snapshot) => {
      const templates: Template[] = [];
      if (snapshot.exists()) snapshot.forEach((c) => templates.push(c.val()));
      callback(templates);
    });
    return () => off(r);
  }

  // ── Sessions ──────────────────────────────

  async createSession(session: Omit<Session, 'createdAt' | 'participants'>): Promise<void> {
    const db = assertDb();
    const data: Session = {
      ...session,
      createdAt: new Date().toISOString(),
      participants: {},
    };
    await set(ref(db, `sessions/${session.id}`), data);
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const db = assertDb();
    const snapshot = await get(ref(db, `sessions/${sessionId}`));
    return snapshot.exists() ? snapshot.val() : null;
  }

  async getTeacherSessions(teacherId: string): Promise<Session[]> {
    const db = assertDb();
    const snapshot = await get(ref(db, 'sessions'));
    if (!snapshot.exists()) return [];
    const sessions: Session[] = [];
    snapshot.forEach((child) => {
      const s = child.val() as Session;
      if (s.teacherId === teacherId) sessions.push(s);
    });
    return sessions;
  }

  /** Look up a live or scheduled session by its 6-char join code */
  async getSessionByCode(code: string): Promise<Session | null> {
    const db = assertDb();
    const snapshot = await get(ref(db, 'sessions'));
    if (!snapshot.exists()) return null;
    let found: Session | null = null;
    snapshot.forEach((child) => {
      const s = child.val() as Session;
      if (s.code.toUpperCase() === code.toUpperCase()) {
        found = s;
      }
    });
    return found;
  }

  async updateSessionStatus(sessionId: string, status: SessionStatus, extra?: { startedAt?: string; endedAt?: string }): Promise<void> {
    const db = assertDb();
    const updates: Record<string, unknown> = { status };
    if (extra?.startedAt) updates.startedAt = extra.startedAt;
    if (extra?.endedAt) updates.endedAt = extra.endedAt;
    await update(ref(db, `sessions/${sessionId}`), updates);
  }

  /** Student joins a session by code. Returns the session if found. */
  async joinSession(code: string, participant: Omit<Participant, 'joinedAt'>): Promise<Session | null> {
    const session = await this.getSessionByCode(code);
    if (!session) return null;

    const db = assertDb();
    const participantData: Participant = {
      ...participant,
      joinedAt: new Date().toISOString(),
    };
    await set(ref(db, `sessions/${session.id}/participants/${participant.id}`), participantData);
    return session;
  }

  async removeParticipantFromSession(sessionId: string, participantId: string): Promise<void> {
    const db = assertDb();
    await remove(ref(db, `sessions/${sessionId}/participants/${participantId}`));
  }

  // Real-time listeners
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
      if (snapshot.exists()) snapshot.forEach((c) => participants.push(c.val()));
      callback(participants);
    });
    return () => off(r);
  }

  // ── Responses ─────────────────────────────

  async addResponse(sessionId: string, response: Omit<SessionResponse, 'id'>): Promise<void> {
    const db = assertDb();
    const r = ref(db, `responses/${sessionId}`);
    const newRef = push(r);
    await set(newRef, { ...response, id: newRef.key });
  }

  onSessionResponsesUpdate(sessionId: string, callback: (responses: SessionResponse[]) => void) {
    const db = assertDb();
    const r = ref(db, `responses/${sessionId}`);
    onValue(r, (snapshot) => {
      const responses: SessionResponse[] = [];
      if (snapshot.exists()) snapshot.forEach((c) => responses.push(c.val()));
      callback(responses);
    });
    return () => off(r);
  }
}

export const dbService = new FirebaseDatabaseService();