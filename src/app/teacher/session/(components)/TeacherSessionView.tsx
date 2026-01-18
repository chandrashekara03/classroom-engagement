"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { socketManager } from "@/lib/socket";

interface Question {
  id: string;
  text: string;
  // Add other question properties as needed
}

interface Stats {
  total: number;
  answered: number;
}

interface BroadcastPayload {
  [key: string]: string | number | boolean | object;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TeacherSessionView({ sessionId }: { sessionId: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [stats, setStats] = useState<Stats>({ total: 0, answered: 0 });
  const [timer, setTimer] = useState(0);
  const [live, setLive] = useState(true);
  const [participantCount, setParticipantCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const updateStats = useCallback(async () => {
    // Fetch current stats from Supabase
    const { data: answers } = await supabase.from("quiz_answers").select("*").eq("session_id", sessionId).eq("question_index", current);
    const total = answers?.length || 0;
    const answered = answers?.filter(a => a.answer !== null).length || 0;
    setStats({ total, answered });
  }, [sessionId, current]);

  useEffect(() => {
    socketManager.connect(sessionId);

    socketManager.on("ANSWER_SUBMITTED", () => {
      // Update stats
      updateStats();
    });

    socketManager.on("participant-update", (payload: { count: number }) => {
      setParticipantCount(payload.count);
    });

    socketManager.on("time-sync", () => {
      // Handle time sync if needed
    });

    return () => {
      socketManager.off("ANSWER_SUBMITTED");
      socketManager.off("participant-update");
      socketManager.off("time-sync");
    };
  }, [sessionId, updateStats]);

  useEffect(() => {
    // Fetch questions for this session
    (async () => {
      const { data: session } = await supabase.from("sessions").select("*, templates(*)").eq("id", sessionId).single();
      if (session?.templates?.type === "quiz") {
        const { data: questionsData } = await supabase.from("quiz_questions").select("*").eq("template_id", session.template_id).order("order");
        setQuestions(questionsData || []);
      }
    })();
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

  const broadcast = (event: string, payload: BroadcastPayload) => {
    socketManager.emit(event, { sessionId, ...payload });
  };

  const nextQuestion = () => {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
      broadcast("QUESTION_START", { index: current + 1 });
    }
  };
  const prevQuestion = () => {
    if (current > 0) {
      setCurrent(c => c - 1);
      broadcast("QUESTION_START", { index: current - 1 });
    }
  };
  const reveal = () => {
    broadcast("ANSWER_REVEAL", { index: current });
  };
  const startSession = async () => {
    await supabase.from("sessions").update({ status: "active", started_at: new Date().toISOString() }).eq("id", sessionId);
    broadcast("SESSION_START", {});
  };
  const endSession = async () => {
    setLive(false);
    await supabase.from("sessions").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", sessionId);
    broadcast("SESSION_END", {});
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Session Controls */}
        <div className="glass p-6 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {!live && (
                <button
                  onClick={startSession}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
                >
                  🚀 Start Session
                </button>
              )}
              <button
                onClick={prevQuestion}
                disabled={current === 0}
                className="glass px-4 py-2 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                ← Previous
              </button>
              <button
                onClick={nextQuestion}
                disabled={current === questions.length - 1}
                className="glass px-4 py-2 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Next →
              </button>
              <button
                onClick={reveal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              >
                👁️ Reveal Answers
              </button>
            </div>
            <div className="flex items-center gap-6">
              <div className="glass px-4 py-2 rounded-xl">
                <span className="text-neutral-600 dark:text-neutral-400">Timer:</span>
                <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100 ml-2">{timer}s</span>
              </div>
              <div className="glass px-4 py-2 rounded-xl">
                <span className="text-neutral-600 dark:text-neutral-400">Participants:</span>
                <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100 ml-2">{participantCount}</span>
              </div>
              <button
                onClick={endSession}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              >
                🛑 End Session
              </button>
            </div>
          </div>
        </div>

        {/* Current Question */}
        <div className="glass p-8 animate-fade-in">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 glass rounded-full mb-4">
              <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{current + 1}</span>
            </div>
            <h1 className="text-4xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">Question {current + 1}</h1>
            <p className="text-xl text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-4xl mx-auto">
              {questions[current]?.text || "No question loaded"}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="glass p-6 animate-fade-in">
          <h3 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-neutral-100">📊 Student Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total || 0}</div>
              <div className="text-neutral-600 dark:text-neutral-400">Total Participants</div>
            </div>
            <div className="glass p-4 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.answered || 0}</div>
              <div className="text-neutral-600 dark:text-neutral-400">Answers Submitted</div>
            </div>
            <div className="glass p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.total ? Math.round((stats.answered / stats.total) * 100) : 0}%
              </div>
              <div className="text-neutral-600 dark:text-neutral-400">Completion Rate</div>
            </div>
          </div>
        </div>

        {/* Session Status */}
        {!live && (
          <div className="glass p-6 text-center animate-fade-in">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Session Ended</h2>
            <p className="text-neutral-600 dark:text-neutral-400">The session has been successfully concluded.</p>
          </div>
        )}
      </div>
    </div>
  );
}
