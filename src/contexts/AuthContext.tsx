'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { dbService, Teacher, Student } from '../lib/database';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  isMocked: boolean;
  userType: 'teacher' | 'student' | null;
  teacherData: Teacher | null;
  studentData: Student | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  isMocked: false,
  userType: null,
  teacherData: null,
  studentData: null
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMocked, setIsMocked] = useState(false);
  const [userType, setUserType] = useState<'teacher' | 'student' | null>(null);
  const [teacherData, setTeacherData] = useState<Teacher | null>(null);
  const [studentData, setStudentData] = useState<Student | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if we have valid firebase config or just dummy variables
    if (auth.app.options.apiKey?.startsWith("dummy-api-key")) {
      console.warn("Firebase using mock configuration. Injecting mock user.");
      const mockSession = localStorage.getItem('mock_faculty_auth');
      if (mockSession === 'true') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser({ uid: 'admin-001', email: 'professor@christuniversity.in', displayName: 'Mock Faculty' } as User);
        setUserType('teacher');
        setTeacherData({
          uid: 'admin-001',
          email: 'professor@christuniversity.in',
          displayName: 'Mock Faculty',
          department: 'Computer Science',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        });
      }
      setIsMocked(true);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Determine user type based on email domain
        const isTeacher = firebaseUser.email?.endsWith('@christuniversity.in') || false;
        setUserType(isTeacher ? 'teacher' : 'student');
        
        // Check and create/update user in database
        if (isTeacher) {
          let teacher = await dbService.getTeacher(firebaseUser.uid);
          if (!teacher) {
            // Create new teacher
            await dbService.createTeacher({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
              department: 'Computer Science' // Default department
            });
            teacher = await dbService.getTeacher(firebaseUser.uid);
          } else {
            // Update last login
            await dbService.updateTeacherLastLogin(firebaseUser.uid);
          }
          setTeacherData(teacher);
        } else {
          let student = await dbService.getStudent(firebaseUser.uid);
          if (!student) {
            // Create new student
            await dbService.createStudent({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
              studentId: firebaseUser.email!.split('@')[0], // Use email prefix as student ID
              department: 'Computer Science' // Default department
            });
            student = await dbService.getStudent(firebaseUser.uid);
          } else {
            // Update last login
            await dbService.updateStudentLastLogin(firebaseUser.uid);
          }
          setStudentData(student);
        }
      } else {
        setUser(null);
        setUserType(null);
        setTeacherData(null);
        setStudentData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    if (isMocked) {
      localStorage.removeItem('mock_faculty_auth');
      setUser(null);
      setUserType(null);
      setTeacherData(null);
      setStudentData(null);
      router.push('/teacher/login');
      return;
    }
    
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserType(null);
      setTeacherData(null);
      setStudentData(null);
      router.push('/teacher/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, isMocked, userType, teacherData, studentData }}>
      {children}
    </AuthContext.Provider>
  );
}
