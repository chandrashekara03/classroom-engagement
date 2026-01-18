"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

interface Question {
  id: string;
  text: string;
  correct: string;
  // Add other question properties as needed
}

interface Answer {
  question_id: string;
  answer: string;
  // Add other answer properties as needed
}

interface Result {
  question: string;
  total: number;
  correct: number;
  percent: number;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TeacherSessionResults({ sessionId }: { sessionId: string }) {
  const [results, setResults] = useState<Result[] | null>(null);

  useEffect(() => {
    (async () => {
      // Fetch all answers and aggregate
      const { data: answers } = await supabase.from("quiz_answers").select("*").eq("session_id", sessionId);
      // Fetch questions
      const { data: session } = await supabase.from("sessions").select("*, activity_templates(*)").eq("id", sessionId).single();
      const questions = session?.activity_templates?.settings?.questions || [];
      // Aggregate results
      if (!answers) {
        setResults([]);
        return;
      }
      const stats = questions.map((q: Question, _idx: number) => {
        const qAnswers = answers.filter((a: Answer) => a.question_id === q.id);
        const correct = qAnswers.filter((a: Answer) => a.answer === q.correct).length;
        return {
          question: q.text,
          total: qAnswers.length,
          correct,
          percent: qAnswers.length ? Math.round((correct / qAnswers.length) * 100) : 0,
        };
      });
      setResults(stats);
    })();
  }, [sessionId]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Session Results</h2>
      {results && results.map((r: Result, i: number) => (
        <div key={i} className="mb-2">
          <div className="font-semibold">{r.question}</div>
          <div>Correct: {r.correct} / {r.total} ({r.percent}%)</div>
        </div>
      ))}
    </div>
  );
}
