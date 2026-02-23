'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, Input, Button } from '@classroom/ui-components';
import { Activity, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { isMocked } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isMocked) {
      // Mock login for faculty testing without Firebase API keys
      setTimeout(() => {
        if (email.includes('@christuniversity.in') || email === 'admin') {
          localStorage.setItem('mock_faculty_auth', 'true');
          window.location.href = '/teacher';
        } else {
          setError('Please use a valid @christuniversity.in faculty email or "admin".');
          setIsLoading(false);
        }
      }, 800);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/teacher');
    } catch (err: any) {
      setError('Invalid email or password.');
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
          <form onSubmit={handleLogin} className="space-y-4">
            
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 font-medium border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
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
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {isMocked && (
        <p className="text-xs text-slate-400 mt-8 text-center max-w-xs">
          (Development Mode: Sign in with any *christuniversity.in* email or 'admin' to bypass Firebase)
        </p>
      )}

    </div>
  );
}
