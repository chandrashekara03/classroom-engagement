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
  joinPassword?: string;
  templateId?: string;
  status: SessionStatus;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  participants: { [key: string]: Participant };
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

class FirebaseDatabaseService {

  // ── Teachers ──────────────────────────────

  async createTeacher(teacher: Omit<Teacher, 'createdAt' | 'lastLoginAt'>): Promise<void> {
    const teacherRef = ref(database!, `teachers/${teacher.uid}`);
    const teacherData: Teacher = {
      ...teacher,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    await set(ref(db, `teachers/${teacher.uid}`), teacherData);
  }

  async getTeacher(uid: string): Promise<Teacher | null> {
    try {
      const teacherRef = ref(database!, `teachers/${uid}`);
      const snapshot = await get(teacherRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch { return null; }
  }

  async updateTeacherLastLogin(uid: string): Promise<void> {
    const teacherRef = ref(database!, `teachers/${uid}/lastLoginAt`);
    await set(teacherRef, new Date().toISOString());
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
    const studentRef = ref(database!, `students/${student.uid}`);
    const studentData: Student = {
      ...student,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    await set(ref(db, `students/${student.uid}`), studentData);
  }

  async getStudent(uid: string): Promise<Student | null> {
    try {
      const studentRef = ref(database!, `students/${uid}`);
      const snapshot = await get(studentRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch { return null; }
  }

  async updateStudentLastLogin(uid: string): Promise<void> {
    const studentRef = ref(database!, `students/${uid}/lastLoginAt`);
    await set(studentRef, new Date().toISOString());
  }

  async deleteTeacher(uid: string): Promise<void> {
    const teacherRef = ref(database!, `teachers/${uid}`);
    await remove(teacherRef);
  }

  async deleteStudent(uid: string): Promise<void> {
    const studentRef = ref(database!, `students/${uid}`);
    await remove(studentRef);
  }

  // Session operations
  async createSession(session: Omit<Session, 'createdAt' | 'participants'>): Promise<void> {
    const sessionRef = ref(database!, `sessions/${session.id}`);
    const sessionData: Session = {
      ...session,
      createdAt: new Date().toISOString(),
      participants: {},
    };
    await set(sessionRef, sessionData);
  }

  async getSession(sessionId: string): Promise<Session | null> {
    try {
      const sessionRef = ref(database!, `sessions/${sessionId}`);
      const snapshot = await get(sessionRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch { return null; }
  }

  async getSessionByCode(code: string): Promise<Session | null> {
    try {
      const sessionsRef = ref(database!, 'sessions');
      const snapshot = await get(sessionsRef);
      if (!snapshot.exists()) return null;

      const normalizedCode = code.toUpperCase();
      let matched: Session | null = null;
      snapshot.forEach((childSnapshot) => {
        const session = childSnapshot.val() as Session;
        if (!matched && session.code?.toUpperCase() === normalizedCode) {
          matched = session;
        }
      });
      return matched;
    } catch {
      return null;
    }
  }

  async updateSessionStatus(sessionId: string, status: Session['status']): Promise<void> {
    const sessionRef = ref(database!, `sessions/${sessionId}/status`);
    await set(sessionRef, status);
  }

  async addParticipantToSession(sessionId: string, student: Student): Promise<void> {
    const participantRef = ref(database!, `sessions/${sessionId}/participants/${student.uid}`);
    await set(participantRef, student);
  }

  async removeParticipantFromSession(sessionId: string, studentId: string): Promise<void> {
    const participantRef = ref(database!, `sessions/${sessionId}/participants/${studentId}`);
    await remove(participantRef);
  }

  // Activity template operations
  async createActivityTemplate(template: Omit<ActivityTemplate, 'createdAt'>): Promise<void> {
    const templateRef = ref(database!, `activityTemplates/${template.id}`);
    
    // Clean data: remove undefined and null values to prevent Firebase errors
    const cleanTemplate = JSON.parse(JSON.stringify({
      ...template,
      createdAt: new Date().toISOString(),
    }));
    
    await set(templateRef, cleanTemplate);
  }

  async getTeacherTemplates(teacherId: string): Promise<ActivityTemplate[]> {
    try {
      const templatesRef = ref(database!, 'activityTemplates');
      const snapshot = await get(templatesRef);
      if (!snapshot.exists()) return [];

      const templates: ActivityTemplate[] = [];
      snapshot.forEach((childSnapshot) => {
        const template = childSnapshot.val() as ActivityTemplate;
        if (template.teacherId === teacherId) {
          templates.push(template);
        }
      });
      templates.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return templates;
    } catch {
      return [];
    }
  }

  async getActivityTemplate(templateId: string): Promise<ActivityTemplate | null> {
    try {
      const templateRef = ref(database!, `activityTemplates/${templateId}`);
      const snapshot = await get(templateRef);
      return snapshot.exists() ? (snapshot.val() as ActivityTemplate) : null;
    } catch {
      return null;
    }
  }

  // Get all teachers
  async getAllTeachers(): Promise<Teacher[]> {
    try {
      const teachersRef = ref(database!, 'teachers');
      const snapshot = await get(teachersRef);
      if (!snapshot.exists()) return [];

      const teachers: Teacher[] = [];
      snapshot.forEach((childSnapshot) => {
        teachers.push(childSnapshot.val());
      });
      return teachers;
    } catch { return []; }
  }

  // Get all students
  async getAllStudents(): Promise<Student[]> {
    try {
      const studentsRef = ref(database!, 'students');
      const snapshot = await get(studentsRef);
      if (!snapshot.exists()) return [];

      const students: Student[] = [];
      snapshot.forEach((childSnapshot) => {
        students.push(childSnapshot.val());
      });
      return students;
    } catch { return []; }
  }

  async getTeacherSessions(teacherId: string): Promise<Session[]> {
    try {
      const sessionsRef = ref(database!, 'sessions');
      const snapshot = await get(sessionsRef);
      if (!snapshot.exists()) return [];

      const sessions: Session[] = [];
      snapshot.forEach((childSnapshot) => {
        const session = childSnapshot.val();
        if (session.teacherId === teacherId) {
          sessions.push(session);
        }
      });
      return sessions;
    } catch { return []; }
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
    const sessionRef = ref(database!, `sessions/${sessionId}`);
    onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    });
    return () => off(r);
  }

  onTeachersUpdate(callback: (teachers: Teacher[]) => void) {
    const teachersRef = ref(database!, 'teachers');
    onValue(teachersRef, (snapshot) => {
      const teachers: Teacher[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          teachers.push(childSnapshot.val());
        });
      }
      callback(teachers);
    });
    return () => off(r);
  }

  onStudentsUpdate(callback: (students: Student[]) => void) {
    const studentsRef = ref(database!, 'students');
    onValue(studentsRef, (snapshot) => {
      const students: Student[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          students.push(childSnapshot.val());
        });
      }
      callback(students);
    });
    return () => off(r);
  }
}

export const dbService = new FirebaseDatabaseService();