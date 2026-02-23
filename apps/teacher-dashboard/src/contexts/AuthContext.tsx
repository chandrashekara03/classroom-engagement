'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  isMocked: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  isMocked: false
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // We use a fallback mock so the user can test the UI without active Firebase keys
  const [isMocked, setIsMocked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if we have valid firebase config or just dummy variables
    if (auth.app.options.apiKey === "dummy-api-key") {
      console.warn("Firebase using mock configuration. Injecting mock user.");
      const mockSession = localStorage.getItem('mock_faculty_auth');
      if (mockSession === 'true') {
        setUser({ uid: 'admin-001', email: 'professor@christuniversity.in', displayName: 'Mock Faculty' } as User);
      }
      setIsMocked(true);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    if (isMocked) {
      localStorage.removeItem('mock_faculty_auth');
      setUser(null);
      router.push('/teacher/login');
      return;
    }
    
    try {
      await firebaseSignOut(auth);
      router.push('/teacher/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, isMocked }}>
      {children}
    </AuthContext.Provider>
  );
}
