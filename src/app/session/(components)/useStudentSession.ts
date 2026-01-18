import { useState } from "react";

export function useStudentSession() {
  const [studentSession, setStudentSessionState] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("student_session");
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  const setStudentSession = (session: any) => {
    setStudentSessionState(session);
    if (typeof window !== "undefined") {
      localStorage.setItem("student_session", JSON.stringify(session));
    }
  };

  return { ...studentSession, setStudentSession };
}
