'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { dbService } from '@/lib/database';
import { Card, CardContent, CardHeader, CardTitle, Input, Button } from '@classroom/ui-components';
import { Activity, Lock, Mail, AlertCircle, LucideUserPlus, LucideArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const defaultAdminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').trim().toLowerCase();
  
  const router = useRouter();

  const resolveRedirectPath = async (uid: string, emailAddress: string): Promise<string> => {
    try {
      const dbUser = await dbService.getUser(uid);
      if (dbUser?.role === 'admin') return '/admin/dashboard';
      if (dbUser?.role === 'teacher') return '/teacher';
      if (dbUser?.role === 'student') return '/student';
    } catch (error) {
      console.warn('Could not resolve user role from database during login:', error);
    }

    if (defaultAdminEmail && emailAddress === defaultAdminEmail) {
      return '/admin/dashboard';
    }

    if (emailAddress.endsWith('christuniversity.in')) {
      return '/teacher';
    }

    return '/student';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!auth) throw new Error("Auth system unavailable.");
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail.endsWith('christuniversity.in')) {
        throw new Error('Please use your official christuniversity.in faculty email.');
      }

      let credentials;
      if (isSignUp) {
        credentials = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      } else {
        credentials = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      }

      const redirectPath = await resolveRedirectPath(credentials.user.uid, normalizedEmail);
      router.push(redirectPath);
    } catch (err: unknown) {
      console.error(err);
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code || '')
          : '';

      if (code === 'auth/email-already-in-use') {
        setError('Account already exists. Please sign in instead.');
      } else if (code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password'
      ) {
        setError('Invalid credentials. Please check your email and password.');
      } else {
        setError(err instanceof Error ? err.message : 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-900">
      
      <div className="text-center space-y-4 mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <Activity className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CHRIST Classroom Engagement</h1>
          <p className="text-slate-600 mt-2 font-medium">Faculty Authentication Portal</p>
        </div>
      </div>

      <Card className="w-full max-w-sm shadow-sm border-slate-200">
        <CardContent className="p-6">
          <CardHeader className="text-center pb-6 px-0 pt-0">
            <CardTitle className="text-xl">
              {isSignUp ? 'Create Faculty Account' : 'Sign In'}
            </CardTitle>
          </CardHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 font-medium border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">{error}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Institutional Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="name@christuniversity.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 text-sm"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2 pb-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 text-sm"
                  required
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  {isSignUp ? <LucideUserPlus size={18} /> : null}
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                  <LucideArrowRight size={18} />
                </div>
              )}
            </Button>
          </form>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <span className="relative px-2 bg-white text-xs text-slate-400 font-medium">FIREBASE AUTH</span>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
            </button>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-8 text-center space-y-4">
        <div className="pt-4 border-t border-slate-100">
           <Link href="/student/login" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
             Are you a student? Use the Student Portal →
           </Link>
        </div>
      </div>

    </div>
  );
}
