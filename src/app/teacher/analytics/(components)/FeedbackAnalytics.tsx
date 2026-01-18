"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

interface FeedbackAnalyticsProps {
  session: {
    id: string;
    templates?: {
      title?: string;
      type: string;
    };
  };
}

export default function FeedbackAnalytics({ session }: FeedbackAnalyticsProps) {
  const [responses, setResponses] = useState<{ id: string; question_id: string; response_data: Record<string, unknown>; user_id: string }[]>([]);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const loadData = async () => {
      const { data } = await supabase
        .from("feedback_responses")
        .select("*")
        .eq("session_id", session.id);
      setResponses(data || []);
    };

    loadData();
  }, [session.id, supabase]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Feedback Responses</h2>
      <div className="space-y-4">
        {responses.map((r, i) => (
          <div key={i} className="border p-4 rounded">
            <p><strong>User:</strong> {r.user_id.slice(0, 8)}</p>
            <p><strong>Response:</strong> {JSON.stringify(r.response_data)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}