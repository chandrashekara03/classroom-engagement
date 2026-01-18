import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import SessionList from "./(components)/SessionList";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          const cookieStore = await cookies();
          return cookieStore.getAll();
        },
        async setAll(cookiesToSet) {
          const cookieStore = await cookies();
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div>Not authenticated</div>;

  const { data: sessions } = await supabase
    .from("sessions")
    .select(`
      *,
      templates(title, type)
    `)
    .eq("teacher_id", user.id)
    .eq("status", "ended")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="glass p-8 mb-6 animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
            <div className="text-4xl">📊</div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Session Analytics</h1>
              <p className="text-neutral-600 dark:text-neutral-400">Review performance data from your completed sessions</p>
            </div>
          </div>
        </div>
        <SessionList sessions={sessions || []} />
      </div>
    </div>
  );
}