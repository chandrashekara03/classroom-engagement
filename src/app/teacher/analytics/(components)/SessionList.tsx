"use client";

import Link from "next/link";

interface Session {
  id: string;
  templates: { title: string; type: string };
  created_at: string;
  status: string;
}

interface SessionListProps {
  sessions: Session[];
}

export default function SessionList({ sessions }: SessionListProps) {
  return (
    <div className="space-y-4">
      {sessions.map((session, index) => (
        <div
          key={session.id}
          className="glass p-6 rounded-xl animate-fade-in hover:scale-[1.02] transition-all duration-200"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
                {session.templates?.title || "Untitled Session"}
              </h3>
              <div className="flex flex-wrap gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                <span className="flex items-center gap-1">
                  <span className="text-lg">
                    {session.templates?.type === 'quiz' ? '📝' :
                     session.templates?.type === 'poll' ? '📊' : '💬'}
                  </span>
                  {session.templates?.type || 'Unknown'}
                </span>
                <span className="flex items-center gap-1">
                  📅 {new Date(session.created_at).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  🕐 {new Date(session.created_at).toLocaleTimeString()}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  session.status === 'ended' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {session.status}
                </span>
              </div>
            </div>
            <Link
              href={`/teacher/analytics/${session.id}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg ml-4"
            >
              📈 View Analytics
            </Link>
          </div>
        </div>
      ))}
      {sessions.length === 0 && (
        <div className="glass p-8 text-center animate-fade-in">
          <div className="text-neutral-400 text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">No Sessions Yet</h3>
          <p className="text-neutral-600 dark:text-neutral-400">Completed sessions will appear here for analysis.</p>
        </div>
      )}
    </div>
  );
}