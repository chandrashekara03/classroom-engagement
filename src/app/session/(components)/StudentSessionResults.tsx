"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function StudentSessionResults({ sessionId }: { sessionId: string }) {
  const [results, setResults] = useState<any>(null);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    (async () => {
      // Fetch student's answers
      const { data: answers } = await supabase.from("quiz_answers").select("*").eq("session_id", sessionId);
      // Fetch questions
      const { data: session } = await supabase.from("sessions").select("*, activity_templates(*)").eq("id", sessionId).single();
      const questions = session?.activity_templates?.settings?.questions || [];
      setResults({ questions, answers });
    })();
  }, [sessionId]);

  if (!results) return null;
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Your Results</h2>
      {results.questions.map((q: any, i: number) => {
        const ans = results.answers.find((a: any) => a.question_id === q.id);
        return (
          <div key={i} className="mb-2">
            <div className="font-semibold">{q.text}</div>
            <div>Your answer: {ans?.answer ?? "No answer"}</div>
            <div>Correct answer: {q.correct}</div>
          </div>
        );
      })}
    </div>
  );
}
