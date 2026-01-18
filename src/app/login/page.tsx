"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      // Check if user is admin or teacher and redirect accordingly
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check if admin
        const adminCheck = await fetch('/api/check-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, role: 'admin' })
        });
        const adminResult = await adminCheck.json();

        if (adminResult.isRole) {
          router.push("/admin/dashboard");
          return;
        }

        // Check if teacher
        const teacherCheck = await fetch('/api/check-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, role: 'teacher' })
        });
        const teacherResult = await teacherCheck.json();

        if (teacherResult.isRole) {
          router.push("/teacher/dashboard");
          return;
        }

        // If neither admin nor teacher, sign out
        await supabase.auth.signOut();
        setError("Access denied. You are not authorized to use this system.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="glass w-full max-w-md p-8 animate-fade-in">
        <h1 className="text-2xl font-bold mb-6 text-center text-neutral-900 dark:text-neutral-100">Login</h1>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full glass border-0 p-3 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full glass border-0 p-3 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
}
