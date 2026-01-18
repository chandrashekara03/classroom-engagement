import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass max-w-md w-full p-8 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Classroom Engagement
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Real-time interactive learning platform
          </p>
        </div>
        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
          >
            Teacher Login
          </Link>
          <Link
            href="/join"
            className="block w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
          >
            Join a Session
          </Link>
          <Link
            href="/about"
            className="block w-full glass text-neutral-900 dark:text-neutral-100 py-3 px-6 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
          >
            About This Platform
          </Link>
        </div>
      </div>
    </div>
  );
}
