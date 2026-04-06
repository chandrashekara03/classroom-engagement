import { ref, set, get, update, remove, onValue, off } from 'firebase/database';
import { database } from './firebase';
import { SessionStatus } from '@classroom/shared-utils';

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

export interface Session {
  id: string;
  teacherId: string;
  title: string;
  code: string;
  joinPassword?: string;
  status: SessionStatus;
  createdAt: string;
  participants: { [key: string]: Student };
}

class FirebaseDatabaseService {
  // Teacher operations
  async createTeacher(teacher: Omit<Teacher, 'createdAt' | 'lastLoginAt'>): Promise<void> {
    const teacherRef = ref(database!, `teachers/${teacher.uid}`);
    const teacherData: Teacher = {
      ...teacher,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    await set(teacherRef, teacherData);
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

  // Student operations
  async createStudent(student: Omit<Student, 'createdAt' | 'lastLoginAt'>): Promise<void> {
    const studentRef = ref(database!, `students/${student.uid}`);
    const studentData: Student = {
      ...student,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    await set(studentRef, studentData);
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

  // Get teacher's sessions
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

  // Real-time listeners
  onSessionUpdate(sessionId: string, callback: (session: Session) => void) {
    const sessionRef = ref(database!, `sessions/${sessionId}`);
    onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    });
    return () => off(sessionRef);
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
    return () => off(teachersRef);
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
    return () => off(studentsRef);
  }
}

export const dbService = new FirebaseDatabaseService();