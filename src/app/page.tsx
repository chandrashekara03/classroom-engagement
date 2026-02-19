import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Classroom Engagement Platform
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          A unified platform for interactive classroom activities, quizzes, polls, and real-time engagement without limitations.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link
            href="/teacher"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300"
          >
            I'm a Teacher
          </Link>
          <Link
            href="/student"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300"
          >
            I'm a Student
          </Link>
        </div>
      </div>
    </div>
  );
}
