"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { nanoid } from "nanoid";
import { useStudentSession } from "../../session/(components)/useStudentSession";

export default function JoinCodeHandler({ code }: { code: string }) {
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { setStudentSession } = useStudentSession();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: sessionData } = await supabase.from("sessions").select("*").eq("join_code", code).single();
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
  }, [code]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    // Create student user if not exists
    let studentId = localStorage.getItem("student_id");
    if (!studentId) {
      studentId = nanoid();
      await supabase.from("users").insert({ id: studentId, name, role: "student", email: null }).onConflict(["id"]).ignore();
      localStorage.setItem("student_id", studentId);
    }
    // Insert into session_participants
    const { data: participant, error: partErr } = await supabase.from("session_participants").insert({
      session_id: session.id,
      user_id: studentId,
    }).select().single();
    if (partErr) {
      setError("Could not join session");
      setSubmitting(false);
      return;
    }
    setStudentSession({ student_id: studentId, session_id: session.id, join_code: code, participant_id: participant.id });
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
