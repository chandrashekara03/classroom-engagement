'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@classroom/ui-components';
import { Button } from '@classroom/ui-components';
import { Input } from '@classroom/ui-components';
import { Lock, AlertCircle, Mail } from 'lucide-react';
import { auth } from '@/lib/firebase';

export default function AdminLoginPage() {
  const defaultAdminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'suryachalam18@gmail.com').trim().toLowerCase();
  const [email, setEmail] = useState(defaultAdminEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!auth) {
        throw new Error('Firebase Auth is not initialized. Check your Firebase config.');
      }

      const normalizedEmail = email.trim().toLowerCase();
      const credentials = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const idToken = await credentials.user.getIdToken(true);

      const sessionRes = await fetch('/api/admin/session', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const sessionData = await sessionRes.json();
      if (!sessionRes.ok) {
        await signOut(auth).catch(() => undefined);
        throw new Error(sessionData.error || 'This account is not authorized as admin.');
      }

      localStorage.setItem('admin_session', 'true');
      localStorage.setItem('admin_login_time', Date.now().toString());
      localStorage.setItem('admin_id_token', idToken);
      localStorage.setItem('admin_email', normalizedEmail);

      router.push('/admin/dashboard');
    } catch (err: unknown) {
      const firebaseCode =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code || '')
          : '';

      if (
        firebaseCode === 'auth/invalid-credential' ||
        firebaseCode === 'auth/wrong-password' ||
        firebaseCode === 'auth/user-not-found'
      ) {
        setError('Invalid email or password.');
      } else if (firebaseCode === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="liquid-admin-page relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="liquid-noise pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0">
        <div className="glass-blob absolute -left-14 -top-20 h-72 w-72 rounded-full bg-cyan-300/45 blur-3xl" />
        <div className="glass-blob absolute -right-20 top-24 h-80 w-80 rounded-full bg-blue-300/40 blur-3xl [animation-delay:1.4s]" />
        <div className="glass-blob absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-indigo-200/45 blur-3xl [animation-delay:2.2s]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="glass-surface mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
            <Lock className="h-8 w-8 text-slate-800" />
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">Admin Portal</h1>
          <p className="text-sm font-medium text-slate-700">User Management and Realtime Database Administration</p>
        </div>

        <Card className="glass-surface overflow-hidden border-white/55 bg-white/15 shadow-[0_36px_88px_-40px_rgba(15,23,42,0.8)]">
          <CardHeader className="border-b border-white/35 bg-white/20 pb-3 text-center">
            <CardTitle className="text-xl text-slate-900">Secure Admin Access</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-300/55 bg-red-100/65 p-3 text-sm text-red-800 backdrop-blur-sm">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Mail size={16} />
                  Admin Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="suryachalam18@gmail.com"
                  required
                  className="w-full border-white/50 bg-white/55 text-slate-900 placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Lock size={16} />
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your Firebase password"
                  required
                  className="w-full border-white/50 bg-white/55 text-slate-900 placeholder:text-slate-500"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full border border-white/45 bg-gradient-to-r from-sky-600 to-blue-700 py-3 font-semibold text-white shadow-[0_18px_30px_-20px_rgba(2,132,199,0.9)] hover:from-sky-500 hover:to-blue-600"
              >
                {loading ? 'Verifying...' : 'Sign In to Admin Dashboard'}
              </Button>
            </form>

            <div className="glass-muted mt-6 rounded-xl p-4">
              <p className="text-center text-xs text-slate-700">
                Sign in with your Firebase Auth admin account.<br/>
                <span className="font-semibold text-slate-800">Use ADMIN_EMAIL env var to change bootstrap admin email.</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
