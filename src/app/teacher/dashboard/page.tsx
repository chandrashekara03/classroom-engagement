import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import HeaderBar from "../(components)/HeaderBar";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // Not logged in
    return null;
  }

  // Get teacher info
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch teacher's name
  const teacherName = user?.user_metadata?.name || user?.email || "Teacher";

  // Fetch counts
  const [{ count: templatesCount }, { count: sessionsCount }] = await Promise.all([
    supabase.from("templates").select("id", { count: "exact", head: true }),
    supabase.from("sessions").select("id", { count: "exact", head: true }),
  ]);

  return (
    <>
      <HeaderBar name={teacherName} />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-8 animate-fade-in">
            Welcome, {teacherName}!
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass p-6 animate-slide-up">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{templatesCount ?? 0}</div>
              <div className="text-neutral-600 dark:text-neutral-400">Activity Templates</div>
            </div>
            <div className="glass p-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">{sessionsCount ?? 0}</div>
              <div className="text-neutral-600 dark:text-neutral-400">Sessions</div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
