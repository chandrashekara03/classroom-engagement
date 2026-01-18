"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!code.trim()) {
      setError("Enter a join code");
      return;
    }
    router.push(`/join/${code.trim()}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="glass w-full max-w-md p-8 animate-fade-in text-center">
        <h1 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">Join a Session</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">Enter the session code provided by your teacher</p>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Session Code"
            value={code}
            onChange={e => setCode(e.target.value)}
            className="w-full glass border-0 p-3 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-lg font-mono tracking-widest"
            required
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
          >
            Join Session
          </button>
        </div>
      </form>
    </div>
  );
}
