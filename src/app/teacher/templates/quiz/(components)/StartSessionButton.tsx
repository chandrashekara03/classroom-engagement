"use client";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { nanoid } from "nanoid";
import { useState } from "react";

export default function StartSessionButton({ templateId }: { templateId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleStart = async () => {
    setLoading(true);
    const join_code = nanoid(6);
    const { data, error } = await supabase.from("sessions").insert([
      {
        activity_template_id: templateId,
        status: "live",
        join_code,
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
