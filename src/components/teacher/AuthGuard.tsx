'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LucideShieldAlert } from 'lucide-react';
import { Button } from '@classroom/ui-components';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, userType } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user && pathname.startsWith('/teacher') && pathname !== '/teacher/login') {
        router.push('/teacher/login');
      } else if (
        user &&
        userType !== 'teacher' &&
        userType !== 'admin' &&
        pathname.startsWith('/teacher') &&
        pathname !== '/teacher/login'
      ) {
        // Logged in but not a teacher
        router.push('/student');
      }
    }
  }, [user, loading, userType, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium tracking-tight">Verifying Credentials...</p>
        </div>
      </div>
    );
  }

  // If we are strictly on a protected route but still don't have a user
  // If we are strictly on a protected route but still don't have a user or correct role
  const isTeacherRoute = pathname.startsWith('/teacher') && pathname !== '/teacher/login';
  
  if (isTeacherRoute && (!user || (userType !== 'teacher' && userType !== 'admin'))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center space-y-6 max-w-sm glass-card p-10 bg-white shadow-2xl border-rose-100">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500 shadow-inner">
            <LucideShieldAlert className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Access Restricted</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
              This environment is reserved for verified faculty members. your credentials lack sufficient clearance.
            </p>
          </div>
          <Button 
            onClick={() => router.push('/teacher/login')}
            className="w-full bg-slate-900 hover:bg-rose-600 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl transition-all shadow-xl"
          >
            Authenticate as Faculty
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
