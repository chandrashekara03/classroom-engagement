'use client';

import Link from "next/link";
import { 
  GraduationCap, 
  Users, 
  Activity, 
  ArrowRight,
  BookOpen,
  BarChart3,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Classroom Engagement Platform</h1>
              <p className="text-sm text-slate-600">Interactive Learning for Universities</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-slate-900 mb-6">
            Transform Your Classroom
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            A production-ready platform designed for university-level interactive learning. 
            Engage students with real-time activities, instant feedback, and comprehensive analytics.
          </p>
          
          {/* Quick Stats */}
          <div className="flex items-center justify-center space-x-8 mb-12 text-sm">
            <div className="flex items-center space-x-2 text-slate-700">
              <Activity className="w-5 h-5 text-blue-600" />
              <span><strong>7</strong> Activity Types</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-700">
              <Zap className="w-5 h-5 text-green-600" />
              <span><strong>Real-time</strong> Updates</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-700">
              <Users className="w-5 h-5 text-amber-600" />
              <span><strong>Mobile</strong> Optimized</span>
            </div>
          </div>

          {/* Role Selection */}
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Student Interface */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Student Experience</h3>
              <p className="text-slate-600 mb-6">Join live sessions and participate in interactive activities</p>
              
              <div className="space-y-2 mb-6 text-sm text-left">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Quick session joining with codes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Mobile-first responsive design</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Real-time activity participation</span>
                </div>
              </div>
              
              <Link
                href="/student"
                className="inline-flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
              >
                Join as Student
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>

            {/* Teacher Interface */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Teacher Dashboard</h3>
              <p className="text-slate-600 mb-6">Create and manage engaging classroom sessions</p>
              
              <div className="space-y-2 mb-6 text-sm text-left">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Comprehensive session control</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Live analytics & results</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Activity builder & templates</span>
                </div>
              </div>
              
              <Link
                href="/teacher"
                className="inline-flex items-center justify-center w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
              >
                Open Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Activity Types Showcase */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-slate-900 mb-4">7 Interactive Activity Types</h3>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Engage your students with diverse, research-backed activity formats designed for maximum participation
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { name: 'Quiz', description: 'Multiple choice & open-ended questions', color: 'bg-blue-100 text-blue-700' },
              { name: 'Poll', description: 'Real-time voting & surveys', color: 'bg-green-100 text-green-700' },
              { name: 'Feedback', description: 'Collect student insights & ratings', color: 'bg-amber-100 text-amber-700' },
              { name: 'Word Riddle', description: 'Brain teasers & vocabulary games', color: 'bg-purple-100 text-purple-700' },
              { name: 'Treasure Hunt', description: 'Sequential clue-based challenges', color: 'bg-red-100 text-red-700' },
              { name: 'Pairing', description: 'Match concepts & definitions', color: 'bg-indigo-100 text-indigo-700' },
              { name: 'Scenario', description: 'Decision-based case studies', color: 'bg-teal-100 text-teal-700' }
            ].map((activity, index) => (
              <div key={index} className="text-center p-6 bg-slate-50 rounded-xl border border-slate-200">
                <div className={`w-12 h-12 ${activity.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  <Activity className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-2">{activity.name}</h4>
                <p className="text-sm text-slate-600">{activity.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Features */}
      <section className="bg-slate-50 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-slate-900 mb-4">Built for Universities</h3>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Production-ready architecture with academic-grade features and accessibility standards
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-slate-900 mb-3">Real-time Sync</h4>
              <p className="text-slate-600">
                WebSocket-powered live updates ensure all participants stay synchronized 
                with instant activity changes and results
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-slate-900 mb-3">Analytics Dashboard</h4>
              <p className="text-slate-600">
                Comprehensive performance tracking with detailed insights, 
                participation metrics, and exportable reports
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-amber-600" />
              </div>
              <h4 className="text-xl font-semibold text-slate-900 mb-3">Accessibility First</h4>
              <p className="text-slate-600">
                Projector-friendly high contrast UI, mobile optimization, 
                and WCAG compliance for inclusive learning
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Information */}
      <section className="bg-white py-12 border-t border-slate-200">
        <div className="container mx-auto px-6 text-center">
          <div className="bg-blue-50 rounded-xl p-8 max-w-3xl mx-auto">
            <GraduationCap className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h4 className="text-2xl font-bold text-slate-900 mb-3">Production Demo Ready</h4>
            <p className="text-slate-600 mb-4">
              This is a fully functional demonstration of a university-grade classroom engagement platform.
              Both interfaces are running independently and ready for testing.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm">
              <div className="flex items-center space-x-2 text-slate-700">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Student Interface: <code className="bg-slate-100 px-2 py-1 rounded text-xs">localhost:3002</code></span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Teacher Dashboard: <code className="bg-slate-100 px-2 py-1 rounded text-xs">localhost:3003</code></span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
