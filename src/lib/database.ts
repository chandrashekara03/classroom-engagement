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
  templateId?: string;
  title: string;
  code: string;
  joinPassword?: string;
  status: SessionStatus;
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
      snapshot.forEach((child) => { teachers.push(child.val()); });
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
          teachers.push(c.val());
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
      snapshot.forEach((child) => { students.push(child.val()); });
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
          students.push(c.val());
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
      let found: Session | null = null;
      snapshot.forEach((child) => {
        const s = child.val() as Session;
        if (s.code.toUpperCase() === code.toUpperCase()) {
          found = s;
        }
      });
      return found;
    } catch { return null; }
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
    await set(ref(db, `activityTemplates/${template.id}`), data);
  }

  async createActivityTemplate(template: Omit<ActivityTemplate, 'createdAt'>): Promise<void> {
    await this.createTemplate(template);
  }

  async getTemplatesByTeacher(teacherId: string): Promise<ActivityTemplate[]> {
    const db = assertDb();
    try {
      const snapshot = await get(ref(db, 'activityTemplates'));
      if (!snapshot.exists()) return [];
      const templates: ActivityTemplate[] = [];
      snapshot.forEach((child) => {
        const t = child.val() as ActivityTemplate;
        if (t.teacherId === teacherId) templates.push(t);
      });
      return templates.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch { return []; }
  }

  async getTemplate(templateId: string): Promise<ActivityTemplate | null> {
    const db = assertDb();
    try {
      const snapshot = await get(ref(db, `activityTemplates/${templateId}`));
      return snapshot.exists() ? snapshot.val() : null;
    } catch { return null; }
  }

  async deleteTemplate(teacherId: string, templateId: string): Promise<void> {
    const db = assertDb();
    const template = await this.getTemplate(templateId);
    if (template && template.teacherId === teacherId) {
      await remove(ref(db, `activityTemplates/${templateId}`));
    }
  }

  async getActivityTemplate(templateId: string): Promise<ActivityTemplate | null> {
    return this.getTemplate(templateId);
  }
}

export const dbService = new FirebaseDatabaseService();