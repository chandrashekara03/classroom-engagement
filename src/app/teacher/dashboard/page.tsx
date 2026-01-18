import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import HeaderBar from "../(components)/HeaderBar";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });
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
  let teacherName = user?.user_metadata?.name || user?.email || "Teacher";

  // Fetch counts
  const [{ count: templatesCount }, { count: sessionsCount }, { count: classesCount }] = await Promise.all([
    supabase.from("activity_templates").select("id", { count: "exact", head: true }),
    supabase.from("sessions").select("id", { count: "exact", head: true }),
    supabase.from("classes").select("id", { count: "exact", head: true }),
  ]);

  return (
    <>
      <HeaderBar name={teacherName} />
      <main className="flex-1 p-8 bg-gray-50">
        <h1 className="text-2xl font-bold mb-6">Welcome, {teacherName}!</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded shadow p-6">
            <div className="text-3xl font-bold">{templatesCount ?? 0}</div>
            <div className="text-gray-600">Activity Templates</div>
          </div>
          <div className="bg-white rounded shadow p-6">
            <div className="text-3xl font-bold">{sessionsCount ?? 0}</div>
            <div className="text-gray-600">Sessions</div>
          </div>
          <div className="bg-white rounded shadow p-6">
            <div className="text-3xl font-bold">{classesCount ?? 0}</div>
            <div className="text-gray-600">Classes</div>
          </div>
        </div>
      </main>
    </>
  );
}
