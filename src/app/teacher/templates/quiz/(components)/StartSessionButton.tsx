"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import { useState } from "react";

export default function StartSessionButton({ templateId }: { templateId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleStart = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const code = nanoid(6);
    const { data, error } = await supabase.from("sessions").insert([
      {
        teacher_id: user.id,
        template_id: templateId,
        status: "active",
        code,
        started_at: new Date().toISOString(),
      },
    ]).select().single();
    setLoading(false);
    if (data) {
      router.push(`/teacher/session/${data.id}`);
    }
  };

  return (
    <button
      className="bg-indigo-600 text-white px-4 py-2 rounded"
      onClick={handleStart}
      disabled={loading}
    >
      {loading ? "Starting..." : "Start Session"}
    </button>
  );
}
