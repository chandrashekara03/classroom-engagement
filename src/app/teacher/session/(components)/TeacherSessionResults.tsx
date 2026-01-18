"use client";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function TeacherSessionResults({ sessionId }: { sessionId: string }) {
  const [results, setResults] = useState<any>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    (async () => {
      // Fetch all answers and aggregate
      const { data: answers } = await supabase.from("quiz_answers").select("*").eq("session_id", sessionId);
      // Fetch questions
      const { data: session } = await supabase.from("sessions").select("*, activity_templates(*)").eq("id", sessionId).single();
      const questions = session?.activity_templates?.settings?.questions || [];
      // Aggregate results
      const stats = questions.map((q: any, idx: number) => {
        const qAnswers = answers.filter((a: any) => a.question_id === q.id);
        const correct = qAnswers.filter((a: any) => a.answer === q.correct).length;
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
      {results && results.map((r: any, i: number) => (
        <div key={i} className="mb-2">
          <div className="font-semibold">{r.question}</div>
          <div>Correct: {r.correct} / {r.total} ({r.percent}%)</div>
        </div>
      ))}
    </div>
  );
}
