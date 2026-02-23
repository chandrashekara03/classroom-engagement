"use client";

import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@classroom/ui-components';
import { Button } from '@classroom/ui-components';
import { LucideUsers, LucideBookOpen, LucideArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function StudentInterface() {
  const { user, loading, userType } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/student/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || userType !== 'student') {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome, {user.displayName || user.email}</h1>
          <p className="text-slate-600">Ready to join your classroom session?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LucideUsers className="text-blue-600" size={32} />
              </div>
              <CardTitle className="text-xl">Join Active Session</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-slate-600 mb-6">
                Enter a session code to join an ongoing classroom activity.
              </p>
              <Link href="/student/join">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 font-medium">
                  <div className="flex items-center justify-center gap-2">
                    Join Session
                    <LucideArrowRight size={18} />
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LucideBookOpen className="text-green-600" size={32} />
              </div>
              <CardTitle className="text-xl">My Sessions</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-slate-600 mb-6">
                View your participation history and completed activities.
              </p>
              <Button
                disabled
                className="w-full bg-slate-300 text-slate-500 py-3 font-medium cursor-not-allowed"
              >
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Link
            href="/student/login"
            className="text-sm text-slate-600 hover:text-slate-700"
          >
            Not {user.displayName}? Sign out and switch account →
          </Link>
        </div>
      </div>
    </div>
  );
}