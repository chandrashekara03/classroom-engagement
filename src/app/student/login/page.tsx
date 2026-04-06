'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@classroom/ui-components';
import { LucideArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function StudentLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/student/join');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Student Portal</h1>
          <p className="text-slate-600">Use session code + password to join</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">No Email Login Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-center">
              <p className="text-slate-600 text-sm">
                Students now join directly with a session code and session password provided by the teacher.
              </p>
              <Button
                type="button"
                onClick={() => router.push('/student/join')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 font-medium"
              >
                <div className="flex items-center justify-center gap-2">
                  Go to Session Join
                  <LucideArrowRight size={18} />
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link
            href="/teacher/login"
            className="text-sm text-slate-600 hover:text-slate-700"
          >
            Are you a teacher? Sign in here →
          </Link>
        </div>
      </div>
    </div>
  );
}