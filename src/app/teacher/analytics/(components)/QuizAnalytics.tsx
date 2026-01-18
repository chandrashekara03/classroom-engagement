"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import BarChart from "./BarChart";

interface QuizAnalyticsProps {
  session: any;
}

export default function QuizAnalytics({ session }: QuizAnalyticsProps) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const loadData = async () => {
      // Leaderboard: participants with scores
      const { data: answers } = await supabase
        .from("quiz_answers")
        .select("user_id, question_id, answer, quiz_questions(correct_answer)")
        .eq("session_id", session.id);

      const scoresMap: { [key: string]: { correct: number; total: number } } = {};
      answers?.forEach((a: any) => {
        if (!scoresMap[a.user_id]) scoresMap[a.user_id] = { correct: 0, total: 0 };
        scoresMap[a.user_id].total++;
        if (a.answer === a.quiz_questions?.correct_answer) scoresMap[a.user_id].correct++;
      });

      const leaderboardData = Object.entries(scoresMap).map(([userId, score]) => ({
        userId,
        score: Math.round((score.correct / score.total) * 100),
      })).sort((a, b) => b.score - a.score);

      setLeaderboard(leaderboardData);

      // Score distribution
      const scoreCounts: { [key: number]: number } = {};
      leaderboardData.forEach((l) => {
        scoreCounts[l.score] = (scoreCounts[l.score] || 0) + 1;
      });
      const scoresData = Object.entries(scoreCounts).map(([score, count]) => ({
        label: `${score}%`,
        value: count,
      }));
      setScores(scoresData);
    };

    loadData();
  }, [session.id]);

  return (
    <div className="space-y-6">
      {/* Leaderboard */}
      <div className="glass p-6 animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          🏆 Leaderboard
        </h2>
        <div className="space-y-3">
          {leaderboard.slice(0, 10).map((l, i) => (
            <div
              key={l.userId}
              className="glass p-4 rounded-xl flex justify-between items-center hover:scale-[1.02] transition-all duration-200"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i === 0 ? 'bg-yellow-500 text-white' :
                  i === 1 ? 'bg-gray-400 text-white' :
                  i === 2 ? 'bg-amber-600 text-white' :
                  'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
                }`}>
                  {i + 1}
                </div>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  Student {l.userId.slice(0, 8)}
                </span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{l.score}%</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">Score</div>
              </div>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
              No quiz responses yet
            </div>
          )}
        </div>
      </div>

      {/* Score Distribution */}
      <div className="glass p-6 animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          📊 Score Distribution
        </h2>
        <BarChart data={scores} />
      </div>
    </div>
  );
}