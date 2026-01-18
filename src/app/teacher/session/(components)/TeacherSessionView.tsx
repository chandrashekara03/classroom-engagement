"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import io from "socket.io-client";

const socket = io();

export default function TeacherSessionView({ sessionId }: { sessionId: string }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [stats, setStats] = useState<any>({});
  const [timer, setTimer] = useState(0);
  const [live, setLive] = useState(true);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Fetch questions for this session
    (async () => {
      const { data: session } = await supabase.from("sessions").select("*, activity_templates(*)").eq("id", sessionId).single();
      if (session?.activity_templates?.settings?.questions) {
        setQuestions(session.activity_templates.settings.questions);
      }
    })();
    // Listen for student stats
    socket.emit("teacher-join", { sessionId });
    socket.on("student-stats", setStats);
    return () => {
      socket.off("student-stats");
    };
  }, [sessionId]);

  // Timer logic
  useEffect(() => {
    if (live) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [live]);

  const broadcast = (event: string, payload: any) => {
    socket.emit("teacher-broadcast", { sessionId, event, payload });
  };

  const nextQuestion = () => {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
      broadcast("next-question", { index: current + 1 });
    }
  };
  const prevQuestion = () => {
    if (current > 0) {
      setCurrent(c => c - 1);
      broadcast("prev-question", { index: current - 1 });
    }
  };
  const reveal = () => {
    broadcast("reveal-answer", { index: current });
  };
  const endSession = async () => {
    setLive(false);
    await supabase.from("sessions").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", sessionId);
    broadcast("end-session", {});
  };

  return (
    <div className="p-8">
      <div className="flex gap-4 mb-4">
        <button onClick={prevQuestion} disabled={current === 0}>Previous</button>
        <button onClick={nextQuestion} disabled={current === questions.length - 1}>Next</button>
        <button onClick={reveal}>Reveal</button>
        <button onClick={endSession} className="bg-red-500 text-white px-3 py-1 rounded">End Session</button>
        <span className="ml-4">Timer: {timer}s</span>
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-bold">Question {current + 1}</h2>
        <div>{questions[current]?.text}</div>
      </div>
      <div className="mb-4">
        <h3 className="font-semibold">Student Completion</h3>
        <pre>{JSON.stringify(stats, null, 2)}</pre>
      </div>
      {!live && <div className="text-green-600 font-bold">Session Ended</div>}
    </div>
  );
}
