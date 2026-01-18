"use client";

import QuizAnalytics from "./QuizAnalytics";
import PollAnalytics from "./PollAnalytics";
import FeedbackAnalytics from "./FeedbackAnalytics";

interface AnalyticsViewProps {
  session: any;
}

export default function AnalyticsView({ session }: AnalyticsViewProps) {
  const type = session.templates?.type;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Session Header */}
        <div className="glass p-8 animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
            <div className="text-4xl">
              {type === 'quiz' ? '📝' : type === 'poll' ? '📊' : '💬'}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                {session.templates?.title || 'Untitled Session'}
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400">Session Analytics & Insights</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass p-4">
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Session ID</div>
              <div className="font-mono text-neutral-900 dark:text-neutral-100">{session.id}</div>
            </div>
            <div className="glass p-4">
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Activity Type</div>
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 capitalize">{type}</div>
            </div>
            <div className="glass p-4">
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Status</div>
              <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                session.status === 'ended' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }`}>
                {session.status}
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Content */}
        <div className="animate-fade-in">
          {type === "quiz" && <QuizAnalytics session={session} />}
          {type === "poll" && <PollAnalytics session={session} />}
          {type === "feedback" && <FeedbackAnalytics session={session} />}
        </div>

        {/* Export Section */}
        <div className="glass p-6 animate-fade-in">
          <h3 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-neutral-100">📤 Export Data</h3>
          <div className="flex flex-wrap gap-3">
            <a
              href={`/api/export/${session.id}`}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            >
              📄 Export CSV
            </a>
            <a
              href={`/api/export/${session.id}?format=xlsx`}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            >
              📊 Export XLSX
            </a>
            <a
              href={`/api/export/${session.id}?all=true`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            >
              📦 Export All (ZIP)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}