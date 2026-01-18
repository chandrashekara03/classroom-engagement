import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
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

  // Get comprehensive analytics
  const { data: teachers } = await supabase.from('teachers').select('*');
  const { data: sessions } = await supabase.from('sessions').select(`
    *,
    teacher:teachers(email),
    admin:admins(email)
  `);
  const { data: templates } = await supabase.from('templates').select(`
    *,
    teacher:teachers(email),
    admin:admins(email)
  `);
  const { data: quizAnswers } = await supabase.from('quiz_answers').select('*');
  const { data: pollVotes } = await supabase.from('poll_votes').select('*');
  const { data: feedbackResponses } = await supabase.from('feedback_responses').select('*');

  // Calculate metrics
  const totalSessions = sessions?.length || 0;
  const activeSessions = sessions?.filter(s => s.status === 'active').length || 0;
  const totalTemplates = templates?.length || 0;
  const totalQuizAnswers = quizAnswers?.length || 0;
  const totalPollVotes = pollVotes?.length || 0;
  const totalFeedbackResponses = feedbackResponses?.length || 0;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Analytics</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Comprehensive overview of platform usage and engagement
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Sessions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {totalSessions}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Active Sessions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {activeSessions}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Templates
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {totalTemplates}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Students
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {totalQuizAnswers + totalPollVotes + totalFeedbackResponses}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Engagement Metrics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Quiz Responses</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{totalQuizAnswers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Poll Votes</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{totalPollVotes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Feedback Responses</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{totalFeedbackResponses}</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-4">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Total Interactions</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {totalQuizAnswers + totalPollVotes + totalFeedbackResponses}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Recent Sessions
            </h3>
            <div className="space-y-3">
              {sessions?.slice(0, 5).map((session: any) => (
                <div key={session.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Session {session.code}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {session.teacher?.email || session.admin?.email || 'Unknown'}
                    </p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    session.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : session.status === 'ended'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {session.status}
                  </span>
                </div>
              )) || (
                <p className="text-sm text-gray-500 dark:text-gray-400">No sessions found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}