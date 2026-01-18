import { useState } from "react";

interface StudentSession {
  student_id: string;
  participant_id: string;
  session_id: string;
  name: string;
}

export function useStudentSession() {
  const [studentSession, setStudentSessionState] = useState<StudentSession | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("student_session");
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  const setStudentSession = (session: StudentSession) => {
    setStudentSessionState(session);
    if (typeof window !== "undefined") {
      localStorage.setItem("student_session", JSON.stringify(session));
    }
  };

  return { ...studentSession, setStudentSession };
}
