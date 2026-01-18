"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

type UserType = "teacher" | "student" | "guest";

interface NavigationContextType {
  userType: UserType;
  sessionId: string | null;
}

const NavigationContext = createContext<NavigationContextType>({ userType: "guest", sessionId: null });

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [userType, setUserType] = useState<UserType>("guest");
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserType("teacher");
      } else {
        const studentId = localStorage.getItem("student_id");
        if (studentId) {
          setUserType("student");
          // Assume sessionId from localStorage or context
          const storedSessionId = localStorage.getItem("session_id");
          setSessionId(storedSessionId);
        }
      }
    };
    checkAuth();
  }, []);

  return (
    <NavigationContext.Provider value={{ userType, sessionId }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  return useContext(NavigationContext);
}