'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { dbService, Teacher, Student } from '../lib/database';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  isMocked: boolean;
  userType: 'teacher' | 'student' | 'admin' | null;
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
  const [userType, setUserType] = useState<'teacher' | 'student' | 'admin' | null>(null);
  const [teacherData, setTeacherData] = useState<Teacher | null>(null);
  const [studentData, setStudentData] = useState<Student | null>(null);
  const router = useRouter();
  const defaultAdminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').trim().toLowerCase();

  const inferRoleFromEmail = useCallback((email: string | null | undefined): 'teacher' | 'student' | 'admin' => {
    const normalized = String(email || '').trim().toLowerCase();
    if (defaultAdminEmail && normalized === defaultAdminEmail) {
      return 'admin';
    }
    if (normalized.endsWith('christuniversity.in')) {
      return 'teacher';
    }
    return 'student';
  }, [defaultAdminEmail]);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);

          // 1. Fetch unified user data from /users node
          let dbUser = await dbService.getUser(firebaseUser.uid);

          if (!dbUser) {
            // If user doesn't exist in /users, infer role from email and create a baseline profile.
            const role = inferRoleFromEmail(firebaseUser.email);
            const fallbackEmail = firebaseUser.email || `${firebaseUser.uid}@local.invalid`;

            await dbService.createUser({
              uid: firebaseUser.uid,
              email: fallbackEmail,
              displayName: firebaseUser.displayName || fallbackEmail.split('@')[0],
              role,
            });
            dbUser = await dbService.getUser(firebaseUser.uid);
          } else {
            await dbService.updateUserLastLogin(firebaseUser.uid);
          }

          if (dbUser) {
            setUserType(dbUser.role);

            // 2. Backward compatibility: sync with legacy teacher/student nodes if needed
            if (dbUser.role === 'teacher') {
              let teacher = await dbService.getTeacher(firebaseUser.uid);
              if (!teacher) {
                await dbService.createTeacher({
                  uid: dbUser.uid,
                  email: dbUser.email,
                  displayName: dbUser.displayName,
                  department: 'Computer Science'
                });
                teacher = await dbService.getTeacher(firebaseUser.uid);
              }
              setTeacherData(teacher);
              setStudentData(null);
            } else if (dbUser.role === 'student') {
              let student = await dbService.getStudent(firebaseUser.uid);
              if (!student) {
                await dbService.createStudent({
                  uid: dbUser.uid,
                  email: dbUser.email,
                  displayName: dbUser.displayName,
                  studentId: dbUser.email.split('@')[0],
                  department: 'Computer Science'
                });
                student = await dbService.getStudent(firebaseUser.uid);
              }
              setStudentData(student);
              setTeacherData(null);
            } else {
              setTeacherData(null);
              setStudentData(null);
            }
          } else {
            const fallbackRole = inferRoleFromEmail(firebaseUser.email);
            setUserType(fallbackRole);
            setTeacherData(null);
            setStudentData(null);
          }
        } else {
          setUser(null);
          setUserType(null);
          setTeacherData(null);
          setStudentData(null);
        }
      } catch (error) {
        console.error('Auth profile sync failed:', error);

        if (firebaseUser) {
          setUser(firebaseUser);
          setUserType(inferRoleFromEmail(firebaseUser.email));
        } else {
          setUser(null);
          setUserType(null);
        }

        setTeacherData(null);
        setStudentData(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [inferRoleFromEmail]);

  const logout = async () => {
    try {
      if (auth) {
        await firebaseSignOut(auth);
      }
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
    <AuthContext.Provider value={{ user, loading, logout, isMocked: false, userType, teacherData, studentData }}>
      {children}
    </AuthContext.Provider>
  );
}
