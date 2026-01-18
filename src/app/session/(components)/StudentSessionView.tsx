"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { socketManager } from "@/lib/socket";
import { useStudentSession } from "./useStudentSession";

interface Question {
  id: string;
  question_text: string;
  options: string[];
  // Add other question properties as needed
}

export default function StudentSessionView({ sessionId }: { sessionId: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState<number|null>(null);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [ended, setEnded] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<string>("live");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { student_id } = useStudentSession();

  useEffect(() => {
    socketManager.connect(sessionId);

    // Latency compensation: sync time
    const syncTime = () => {
      const clientTime = Date.now();
      socketManager.emit("sync-time", { clientTime });
    };
    syncTime();
    const timeInterval = setInterval(syncTime, 30000); // every 30s

    socketManager.on("time-sync", (_payload) => {
      // Latency compensation: sync time (removed unused variables)
    });

    // Event handlers
    socketManager.on("SESSION_START", () => setSessionStatus("live"));
    socketManager.on("QUESTION_START", (payload) => {
      setCurrent(payload.index);
      setAnswer("");
      setSubmitted(false);
      setWaiting(false);
    });
    socketManager.on("QUESTION_END", () => setWaiting(true));
    socketManager.on("RESULTS_REVEAL", () => setWaiting(true));
    socketManager.on("SESSION_END", () => setEnded(true));

    // Periodic sync
    const syncInterval = setInterval(async () => {
      const { data: session } = await supabase.from("sessions").select("status").eq("id", sessionId).single();
      if (session?.status !== sessionStatus) {
        setSessionStatus(session!.status);
      }
    }, 10000); // every 10s

    return () => {
      socketManager.off("SESSION_START");
      socketManager.off("QUESTION_START");
      socketManager.off("QUESTION_END");
      socketManager.off("RESULTS_REVEAL");
      socketManager.off("SESSION_END");
      socketManager.off("time-sync");
      clearInterval(timeInterval);
      clearInterval(syncInterval);
    };
  }, [sessionId, sessionStatus, supabase]);

  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.from("sessions").select("*, activity_templates(*)").eq("id", sessionId).single();
      if (!session) {
        setSessionStatus("notfound");
        return;
      }
      if (session.status !== "live") {
        setSessionStatus(session.status);
        return;
      }
      setSessionStatus("live");
      if (session?.activity_templates?.settings?.questions) {
        setQuestions(session.activity_templates.settings.questions);
      }
    })();
  }, [sessionId, supabase]);

  const submitAnswer = async () => {
    setSubmitted(true); // Optimistic UI
    if (current === null) return;
    try {
      await supabase.from("quiz_answers").upsert([
        {
          question_id: questions[current].id,
          session_id: sessionId,
          user_id: student_id,
          answer,
        }
      ], { onConflict: "question_id,session_id,user_id" });
      socketManager.emit("ANSWER_SUBMITTED", { sessionId, questionId: questions[current].id, answer });
    } catch (error) {
      setSubmitted(false); // Rollback on failure
      console.error("Failed to submit answer:", error);
    }
  };

  if (sessionStatus === "notfound") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass p-8 text-center animate-fade-in">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">Session Not Found</h1>
          <p className="text-neutral-600 dark:text-neutral-400">The session code you entered doesn&apos;t exist or has expired.</p>
        </div>
      </div>
    );
  }
  if (sessionStatus !== "live") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass p-8 text-center animate-fade-in">
          <div className="text-orange-500 text-6xl mb-4">⏸️</div>
          <h1 className="text-2xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">Session Not Active</h1>
          <p className="text-neutral-600 dark:text-neutral-400">This session is currently not live. Please wait for the teacher to start it.</p>
        </div>
      </div>
    );
  }
  if (ended) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass p-8 text-center animate-fade-in">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">Session Ended</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Thank you for participating! The session has concluded.</p>
        </div>
      </div>
    );
  }
  if (current === null || !questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass p-8 text-center animate-fade-in">
          <div className="text-blue-500 text-6xl mb-4 animate-pulse">⏳</div>
          <h1 className="text-2xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">Waiting to Start</h1>
          <p className="text-neutral-600 dark:text-neutral-400">The teacher will begin the session shortly. Please stand by...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass w-full max-w-2xl p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 glass rounded-full mb-4">
            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{current + 1}</span>
          </div>
          <h1 className="text-3xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">Question {current + 1}</h1>
          <p className="text-xl text-neutral-700 dark:text-neutral-300 leading-relaxed">{questions[current]?.text}</p>
        </div>

        {!submitted ? (
          <div className="space-y-6">
            <div className="relative">
              <input
                className="w-full glass border-0 p-4 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg transition-all duration-200"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                disabled={submitted || waiting}
              />
              {waiting && (
                <div className="absolute inset-0 glass rounded-xl flex items-center justify-center">
                  <div className="text-neutral-600 dark:text-neutral-400">Waiting for question to end...</div>
                </div>
              )}
            </div>
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-400 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg disabled:cursor-not-allowed disabled:hover:scale-100"
              onClick={submitAnswer}
              disabled={submitted || waiting || !answer.trim()}
            >
              {submitted ? "Submitting..." : "Submit Answer"}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 glass rounded-full mb-4">
              <span className="text-green-500 text-2xl">✓</span>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Answer Submitted!</h2>
            <p className="text-neutral-600 dark:text-neutral-400">Waiting for the next question...</p>
          </div>
        )}
      </div>
    </div>
  );
}
