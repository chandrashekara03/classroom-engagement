"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { useStudentSession } from "../../session/(components)/useStudentSession";

interface Session {
  id: string;
  code: string;
  status: string;
  templates?: {
    title: string;
    type: string;
  };
}

export default function JoinCodeHandler({ code }: { code: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { setStudentSession } = useStudentSession();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: sessionData } = await supabase.from("sessions").select("*").eq("code", code).single();
      if (!sessionData) {
        setError("Invalid join code");
        setLoading(false);
        return;
      }
      if (sessionData.status !== "live") {
        setError("Session is not live");
        setLoading(false);
        return;
      }
      setSession(sessionData);
      setLoading(false);
    })();
  }, [code, supabase]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setSubmitting(true);
    setError("");
    // Create student user if not exists
    let studentId: string;
    const existingStudentId = localStorage.getItem("student_id");
    if (existingStudentId) {
      studentId = existingStudentId;
    } else {
      const { data: student, error: insertError } = await supabase.from("students").insert({ name, session_id: session.id }).select().single();
      if (insertError || !student) {
        setError("Failed to create student profile");
        setSubmitting(false);
        return;
      }
      studentId = student.id;
      localStorage.setItem("student_id", studentId);
    }

    // Add to session participants
    const { data: participant, error: participantError } = await supabase.from("session_participants").insert({ session_id: session.id, student_id: studentId }).select().single();
    if (participantError || !participant) {
      setError("Failed to join session");
      setSubmitting(false);
      return;
    }

    setStudentSession({ student_id: studentId, participant_id: participant.id, session_id: session.id, name });
    router.push(`/session/${session.id}`);
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleJoin} className="bg-white p-8 rounded shadow w-96 space-y-4">
        <h1 className="text-2xl font-bold mb-4">Join Session: {code}</h1>
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold" disabled={submitting}>
          {submitting ? "Joining..." : "Join Session"}
        </button>
      </form>
    </div>
  );
}
