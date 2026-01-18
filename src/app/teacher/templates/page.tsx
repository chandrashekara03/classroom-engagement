import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";
import TemplateList from "./(components)/TemplateList";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
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

  const { data: templates } = await supabase
    .from("templates")
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="glass p-8 mb-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
                🎯 Activity Templates
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 mt-2">Create and manage your quiz, poll, and feedback activities</p>
            </div>
            <Link
              href="/teacher/templates/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2"
            >
              ➕ Create New
            </Link>
          </div>
        </div>
        <TemplateList templates={templates || []} />
      </div>
    </div>
  );
}