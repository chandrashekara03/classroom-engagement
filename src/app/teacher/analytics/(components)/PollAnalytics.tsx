"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import BarChart from "./BarChart";

interface PollAnalyticsProps {
  session: any;
}

export default function PollAnalytics({ session }: PollAnalyticsProps) {
  const [distribution, setDistribution] = useState<any[]>([]);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const loadData = async () => {
      const { data: answers } = await supabase
        .from("poll_answers")
        .select("option_id, poll_options(option_text)")
        .eq("session_id", session.id);

      const counts: { [key: string]: number } = {};
      answers?.forEach((a: any) => {
        const text = a.poll_options?.option_text || "Unknown";
        counts[text] = (counts[text] || 0) + 1;
      });

      const data = Object.entries(counts).map(([label, value]) => ({ label, value }));
      setDistribution(data);
    };

    loadData();
  }, [session.id]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Poll Results</h2>
      <BarChart data={distribution} />
    </div>
  );
}