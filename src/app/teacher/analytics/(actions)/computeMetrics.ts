"use server";

import { createClient } from "@supabase/supabase-js";

interface QuizAnswerData {
  user_id: string;
  answer: string;
  quiz_questions: {
    correct_answer: string;
  }[];
}

export async function computeMetrics(sessionId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get session and type
  const { data: session } = await supabase
    .from("sessions")
    .select("*, activity_templates(type)")
    .eq("id", sessionId)
    .single();

  if (!session) return;

  // Total participants
  const { count: totalParticipants } = await supabase
    .from("session_participants")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId);

  let avgScore = null;
  if (session.activity_templates?.type === "quiz") {
    // Compute avg score
    const { data: answers } = await supabase
      .from("quiz_answers")
      .select("user_id, answer, quiz_questions(correct_answer)")
      .eq("session_id", sessionId);

    const scores: { [key: string]: number } = {};
    answers?.forEach((a: QuizAnswerData) => {
      if (!scores[a.user_id]) scores[a.user_id] = 0;
      if (a.answer === a.quiz_questions?.[0]?.correct_answer) scores[a.user_id]++;
    });

    const totalScores = Object.values(scores);
    avgScore = totalScores.length ? totalScores.reduce((a, b) => a + b, 0) / totalScores.length : 0;
  }

  // Completion rate: participants who answered at least one question
  const { data: responders } = await supabase
    .from("quiz_answers")
    .select("user_id")
    .eq("session_id", sessionId);

  const uniqueResponders = new Set(responders?.map(r => r.user_id));
  const completionRate = totalParticipants ? uniqueResponders.size / totalParticipants : 0;

  // Insert into session_metrics
  await supabase.from("session_metrics").upsert({
    session_id: sessionId,
    total_participants: totalParticipants,
    avg_score: avgScore,
    completion_rate: completionRate,
    created_at: new Date().toISOString(),
  });
}