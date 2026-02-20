"use client";

import Link from "next/link";
import { Activity } from "lucide-react";

export default function GlobalLandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-slate-900">
      <div className="max-w-3xl space-y-8">
        
        <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
          <Activity className="w-12 h-12 text-blue-600" />
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Classroom Engagement Platform
        </h1>
        
        <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
          A unified platform for interactive classroom activities, quizzes, polls, and real-time engagement without limitations.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-12">
          {/* Link to the teacher dashboard route group, which we just moved to (dashboard)/page.tsx */}
          {/* Note: In Next.js App Router, the root (/) matches page.tsx here. So to go to the dashboard, 
              we need a specific route, OR we need the dashboard to be at e.g. /teacher and this at /.
              Let's make this page the root (/) and move the dashboard to /teacher. */}
          <Link 
            href="/teacher" 
            className="w-full sm:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-lg shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
          >
            I'm a Teacher
          </Link>

          {/* This directs them to the port where the Student Client handles connections */}
          {/* Since we are working with two Next.js apps on different ports during dev, we link to the other port natively. */}
          <a 
            href="http://localhost:3001" 
            className="w-full sm:w-auto px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-lg shadow-lg shadow-emerald-600/20 transition-all hover:scale-105"
          >
            I'm a Student
          </a>
        </div>
        
      </div>
    </div>
  );
}
