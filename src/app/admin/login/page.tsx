'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@classroom/ui-components';
import { Button } from '@classroom/ui-components';
import { Input } from '@classroom/ui-components';
import { Lock, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simple password verification - in production, make this more secure
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
      
      if (password === adminPassword) {
        // Store admin session in localStorage
        localStorage.setItem('admin_session', 'true');
        localStorage.setItem('admin_login_time', Date.now().toString());
        router.push('/admin/dashboard');
      } else {
        setError('Invalid admin password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-slate-300">User Management & Database Administration</p>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-2 bg-gradient-to-r from-slate-900 to-slate-800">
            <CardTitle className="text-xl text-white">Admin Access</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Lock size={16} />
                  Admin Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 font-medium"
              >
                {loading ? 'Verifying...' : 'Access Admin Dashboard'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600 text-center">
                <strong>Default Password:</strong> admin123<br/>
                <span className="text-red-600">⚠️ Change this in production!</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
