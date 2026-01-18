"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import io from "socket.io-client";
import { useStudentSession } from "./useStudentSession";

const socket = io();

export default function StudentSessionView({ sessionId }: { sessionId: string }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState<number|null>(null);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [ended, setEnded] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [sessionStatus, setSessionStatus] = useState<string>("live");
  const supabase = createClientComponentClient();
  const { student_id, participant_id } = useStudentSession();

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
    socket.emit("student-join", { sessionId, participant_id });
    socket.on("next-question", ({ index }) => {
      setCurrent(index);
      setAnswer("");
      setSubmitted(false);
      setWaiting(false);
    });
    socket.on("prev-question", ({ index }) => {
      setCurrent(index);
      setAnswer("");
      setSubmitted(false);
      setWaiting(false);
    });
    socket.on("reveal-answer", () => setWaiting(true));
    socket.on("end-session", () => setEnded(true));
    return () => {
      socket.off("next-question");
      socket.off("prev-question");
      socket.off("reveal-answer");
      socket.off("end-session");
    };
  }, [sessionId, participant_id]);

  const submitAnswer = async () => {
    setSubmitted(true);
    if (current === null) return;
    await supabase.from("quiz_answers").insert({
      question_id: questions[current].id,
      session_id: sessionId,
      user_id: student_id,
      answer,
    }).onConflict(["question_id", "session_id", "user_id"]).ignore();
  };

  if (sessionStatus === "notfound") {
    return <div className="p-8 text-red-500">Session not found</div>;
  }
  if (sessionStatus !== "live") {
    return <div className="p-8 text-red-500">Session is not active</div>;
  }
  if (ended) {
    return <div className="p-8 text-green-600 font-bold">Session Ended</div>;
  }
  if (current === null || !questions.length) {
    return <div className="p-8 text-gray-600">Waiting for teacher to start...</div>;
  }
  return (
    <div className="p-8">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Question {current + 1}</h2>
        <div>{questions[current]?.text}</div>
      </div>
      {!submitted ? (
        <div className="mb-4">
          <input
            className="border p-2 w-full"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            disabled={submitted || waiting}
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
            onClick={submitAnswer}
            disabled={submitted || waiting}
          >
            Submit
          </button>
        </div>
      ) : (
        <div className="text-gray-600">Waiting for next question...</div>
      )}
    </div>
  );
}
