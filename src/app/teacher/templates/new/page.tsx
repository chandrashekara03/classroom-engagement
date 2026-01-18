import Link from "next/link";

export default function NewTemplatePage() {
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="glass p-8 mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">Create New Template</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Choose the type of activity you want to create</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/teacher/templates/new/quiz"
            className="glass p-8 rounded-xl hover:scale-105 transition-all duration-200 animate-fade-in group"
            style={{ animationDelay: '0ms' }}
          >
            <div className="text-center">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-bold mb-3 text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Quiz
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Create interactive quizzes with multiple choice questions and instant feedback
              </p>
            </div>
          </Link>

          <Link
            href="/teacher/templates/new/poll"
            className="glass p-8 rounded-xl hover:scale-105 transition-all duration-200 animate-fade-in group"
            style={{ animationDelay: '100ms' }}
          >
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-bold mb-3 text-neutral-900 dark:text-neutral-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                Poll
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Gather opinions and feedback with customizable poll options
              </p>
            </div>
          </Link>

          <Link
            href="/teacher/templates/new/feedback"
            className="glass p-8 rounded-xl hover:scale-105 transition-all duration-200 animate-fade-in group"
            style={{ animationDelay: '200ms' }}
          >
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-bold mb-3 text-neutral-900 dark:text-neutral-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Feedback
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Collect detailed feedback with custom questions and response types
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}