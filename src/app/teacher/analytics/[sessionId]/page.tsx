"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import AnalyticsView from "../(components)/AnalyticsView";

interface Session {
  id: string;
  templates?: {
    type: string;
  };
  // Add other session properties as needed
}

export default function SessionAnalyticsPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const loadSession = async () => {
      const { data } = await supabase
        .from("sessions")
        .select(`
          *,
          templates(*)
        `)
        .eq("id", sessionId)
        .single();
      setSession(data);
      setLoading(false);
    };

    loadSession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass p-8 text-center animate-fade-in">
          <div className="text-blue-500 text-6xl mb-4 animate-pulse">⏳</div>
          <h1 className="text-2xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">Loading Analytics</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Fetching session data...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass p-8 text-center animate-fade-in">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">Session Not Found</h1>
          <p className="text-neutral-600 dark:text-neutral-400">The requested session could not be found.</p>
        </div>
      </div>
    );
  }

  return <AnalyticsView session={session} />;
}