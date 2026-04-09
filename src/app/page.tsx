"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function RootRoleSelectionPage() {
  const { user, loading, userType } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Redirect authenticated users to their appropriate dashboard
      if (userType === 'teacher') {
        router.push('/teacher');
      } else if (userType === 'student') {
        router.push('/student');
      } else if (userType === 'admin') {
        router.push('/admin/dashboard');
      }
    }
  }, [user, loading, userType, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-6 text-center space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Preparing your dashboard...</h2>
          <p className="text-sm text-slate-600">
            Your account is signed in. If automatic redirect is taking longer than expected,
            choose your portal below.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link
              href="/admin/dashboard"
              className="w-full px-4 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Admin
            </Link>
            <Link
              href="/teacher"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Teacher
            </Link>
            <Link
              href="/student"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Student
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">

      {/* Small Institutional Top Bar */}
      <div className="w-full bg-slate-900 py-2 px-6 text-center shadow-sm">
        <p className="text-xs md:text-sm font-medium text-slate-200 tracking-wide uppercase">
          CHRIST (Deemed to be University)
        </p>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-12">

        {/* Academic Header Section */}
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <BookOpen className="w-10 h-10 text-slate-700" strokeWidth={1.5} />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">
              CHRIST Classroom Engagement Platform
            </h1>
            <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-xl mx-auto">
              An integrated academic engagement system designed to facilitate interactive learning and real-time classroom participation.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-16 h-1 bg-blue-600 rounded-full opacity-80"></div>

        {/* Role Selection Box */}
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-8 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-green-100 px-2 py-1 text-[10px] font-bold text-green-800 rounded-bl-lg">
            ROOT-APP
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">Select Your Role</h2>
            <p className="text-sm text-slate-500">Please choose your access portal</p>
          </div>

          <div className="space-y-4">
            <Link
              href="/teacher/login"
              className="w-full flex items-center justify-center px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors shadow-sm focus:ring-2 focus:ring-slate-400 focus:outline-none"
            >
              Faculty Portal
            </Link>

            <Link
              href="/student/login"
              className="w-full flex items-center justify-center px-6 py-4 border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 rounded-xl font-medium transition-colors focus:ring-2 focus:ring-slate-200 focus:outline-none"
            >
              Student Portal
            </Link>
          </div>

        </div>

      </main>

      {/* Institutional Footer */}
      <footer className="w-full py-8 text-center border-t border-slate-100 bg-slate-50">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-700">Department of Computer Science</p>
          <p className="text-xs text-slate-500">Academic Project • CHRIST (Deemed to be University)</p>
        </div>
      </footer>

    </div>
  );
}

