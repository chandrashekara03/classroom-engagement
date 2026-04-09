'use client';

import { ComponentType, FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@classroom/ui-components';
import { Button } from '@classroom/ui-components';
import { Input } from '@classroom/ui-components';
import {
  AlertCircle,
  Plus,
  Trash2,
  LogOut,
  Users,
  BookOpen,
  BarChart3,
  ShieldCheck,
  UserCog,
  Layers,
} from 'lucide-react';
import type { Teacher, Student } from '@/lib/database';
import { auth } from '@/lib/firebase';

type AdminProfile = {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastLoginAt: string;
};

type AdminTab = 'overview' | 'teachers' | 'students' | 'admins' | 'roles';

type CreateForm = 'teacher' | 'student' | 'admin' | 'teacherRole' | null;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '';
}

function isAdminAuthRequired(error: unknown): boolean {
  return getErrorMessage(error) === 'ADMIN_AUTH_REQUIRED';
}

export default function AdminDashboard() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [showCreateForm, setShowCreateForm] = useState<CreateForm>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentAdminUid, setCurrentAdminUid] = useState<string | null>(null);

  const clearAdminSession = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('admin_session');
    localStorage.removeItem('admin_login_time');
    localStorage.removeItem('admin_id_token');
    localStorage.removeItem('admin_email');
  }, []);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (auth?.currentUser) {
      const freshToken = await auth.currentUser.getIdToken();
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_id_token', freshToken);
      }
      return freshToken;
    }

    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_id_token');
    }

    return null;
  }, []);

  const fetchWithTimeout = useCallback(async (
    url: string,
    init: RequestInit = {},
    timeoutMs = 12000
  ) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  const fetchAdmin = useCallback(async (
    url: string,
    init: RequestInit = {},
    timeoutMs = 12000
  ) => {
    const token = await getAccessToken();
    if (!token) {
      clearAdminSession();
      router.push('/admin/login');
      throw new Error('ADMIN_AUTH_REQUIRED');
    }

    const headers = new Headers(init.headers || {});
    headers.set('Authorization', `Bearer ${token}`);

    const response = await fetchWithTimeout(url, { ...init, headers }, timeoutMs);

    if (response.status === 401 || response.status === 403) {
      clearAdminSession();
      if (auth) {
        await firebaseSignOut(auth).catch(() => undefined);
      }
      router.push('/admin/login');
      throw new Error('ADMIN_AUTH_REQUIRED');
    }

    return response;
  }, [clearAdminSession, fetchWithTimeout, getAccessToken, router]);

  const extractError = async (res: Response, fallback: string): Promise<string> => {
    try {
      const payload = await res.json();
      return String(payload?.error || payload?.message || fallback);
    } catch {
      return fallback;
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString();
  };

  // Form states
  const [teacherForm, setTeacherForm] = useState({
    email: '',
    password: '',
    displayName: '',
    department: 'Computer Science',
  });

  const [studentForm, setStudentForm] = useState({
    email: '',
    password: '',
    displayName: '',
    studentId: '',
    department: 'Computer Science',
  });

  const [adminForm, setAdminForm] = useState({
    email: '',
    password: '',
    displayName: '',
  });

  const [teacherRoleForm, setTeacherRoleForm] = useState({
    uid: '',
    email: '',
    displayName: '',
    password: '',
    department: 'Computer Science',
  });

  // Load admin data for all dashboard tabs.
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [teachersResult, studentsResult, adminsResult] = await Promise.allSettled([
        fetchAdmin('/api/admin/teachers'),
        fetchAdmin('/api/admin/students'),
        fetchAdmin('/api/admin/admins'),
      ]);

      let hasAnySuccess = false;

      if (teachersResult.status === 'fulfilled' && teachersResult.value.ok) {
        const data = await teachersResult.value.json();
        setTeachers(Array.isArray(data?.teachers) ? data.teachers : []);
        hasAnySuccess = true;
      } else {
        setTeachers([]);
      }

      if (studentsResult.status === 'fulfilled' && studentsResult.value.ok) {
        const data = await studentsResult.value.json();
        setStudents(Array.isArray(data?.students) ? data.students : []);
        hasAnySuccess = true;
      } else {
        setStudents([]);
      }

      if (adminsResult.status === 'fulfilled' && adminsResult.value.ok) {
        const data = await adminsResult.value.json();
        setAdmins(Array.isArray(data?.admins) ? data.admins : []);
        hasAnySuccess = true;
      } else {
        setAdmins([]);
      }

      if (!hasAnySuccess) {
        setError('Unable to load admin data. Please check server/API configuration and try again.');
      }
    } catch (err: unknown) {
      if (!isAdminAuthRequired(err)) {
        setError('Failed to load data. Please refresh and try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [fetchAdmin]);

  // Check admin access
  useEffect(() => {
    const initializeAdminDashboard = async () => {
      const hasSession = typeof window !== 'undefined' && localStorage.getItem('admin_session') === 'true';
      if (!hasSession) {
        setLoading(false);
        router.push('/admin/login');
        return;
      }

      try {
        const sessionResponse = await fetchAdmin('/api/admin/session', { method: 'GET' });
        if (!sessionResponse.ok) {
          clearAdminSession();
          if (auth) {
            await firebaseSignOut(auth).catch(() => undefined);
          }
          setLoading(false);
          router.push('/admin/login');
          return;
        }

        const sessionData = await sessionResponse.json().catch(() => ({}));
        setCurrentAdminUid(sessionData?.admin?.uid ? String(sessionData.admin.uid) : null);

        await loadData();
      } catch (err: unknown) {
        if (!isAdminAuthRequired(err)) {
          setError('Unable to verify admin session. Please sign in again.');
        }
        setLoading(false);
      }
    };

    void initializeAdminDashboard();
  }, [clearAdminSession, fetchAdmin, loadData, router]);

  // Create teacher
  const handleCreateTeacher = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetchAdmin('/api/admin/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherForm),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess(`Teacher "${teacherForm.displayName}" created successfully!`);
        setTeacherForm({ email: '', password: '', displayName: '', department: 'Computer Science' });
        setShowCreateForm(null);
        await loadData();
      } else {
        setError(String(data?.error || 'Failed to create teacher'));
      }
    } catch (err: unknown) {
      if (!isAdminAuthRequired(err)) {
        setError('Error creating teacher');
      }
    }
  };

  // Create student
  const handleCreateStudent = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetchAdmin('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentForm),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess(`Student "${studentForm.displayName}" created successfully!`);
        setStudentForm({ email: '', password: '', displayName: '', studentId: '', department: 'Computer Science' });
        setShowCreateForm(null);
        await loadData();
      } else {
        setError(String(data?.error || 'Failed to create student'));
      }
    } catch (err: unknown) {
      if (!isAdminAuthRequired(err)) {
        setError('Error creating student');
      }
    }
  };

  // Create admin
  const handleCreateAdmin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetchAdmin('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminForm),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess(`Admin "${adminForm.displayName || adminForm.email}" created successfully!`);
        setAdminForm({ email: '', password: '', displayName: '' });
        setShowCreateForm(null);
        await loadData();
      } else {
        setError(String(data?.error || 'Failed to create admin'));
      }
    } catch (err: unknown) {
      if (!isAdminAuthRequired(err)) {
        setError('Error creating admin');
      }
    }
  };

  // Assign teacher role
  const handleAssignTeacherRole = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const hasUidOrEmail =
      teacherRoleForm.uid.trim().length > 0 || teacherRoleForm.email.trim().length > 0;
    if (!hasUidOrEmail) {
      setError('Provide at least a UID or an email to assign a teacher role.');
      return;
    }

    try {
      const res = await fetchAdmin('/api/admin/roles/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherRoleForm),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const target = teacherRoleForm.uid || teacherRoleForm.email;
        setSuccess(`Teacher role assigned successfully for ${target}.`);
        setTeacherRoleForm({
          uid: '',
          email: '',
          displayName: '',
          password: '',
          department: 'Computer Science',
        });
        setShowCreateForm(null);
        await loadData();
      } else {
        setError(String(data?.error || 'Failed to assign teacher role'));
      }
    } catch (err: unknown) {
      if (!isAdminAuthRequired(err)) {
        setError('Error assigning teacher role');
      }
    }
  };

  // Delete teacher
  const handleDeleteTeacher = async (uid: string) => {
    if (confirm('Are you sure you want to delete this teacher? This cannot be undone.')) {
      try {
        const res = await fetchAdmin(`/api/admin/teachers/${uid}`, { method: 'DELETE' });
        if (res.ok) {
          setSuccess('Teacher deleted successfully');
          await loadData();
        } else {
          setError(await extractError(res, 'Failed to delete teacher'));
        }
      } catch (err: unknown) {
        if (!isAdminAuthRequired(err)) {
          setError('Error deleting teacher');
        }
      }
    }
  };

  // Delete student
  const handleDeleteStudent = async (uid: string) => {
    if (confirm('Are you sure you want to delete this student? This cannot be undone.')) {
      try {
        const res = await fetchAdmin(`/api/admin/students/${uid}`, { method: 'DELETE' });
        if (res.ok) {
          setSuccess('Student deleted successfully');
          await loadData();
        } else {
          setError(await extractError(res, 'Failed to delete student'));
        }
      } catch (err: unknown) {
        if (!isAdminAuthRequired(err)) {
          setError('Error deleting student');
        }
      }
    }
  };

  // Remove admin access
  const handleRemoveAdmin = async (uid: string, displayName: string) => {
    if (uid === currentAdminUid) {
      setError('You cannot remove your own admin access.');
      return;
    }

    if (!confirm(`Remove admin access for ${displayName}?`)) {
      return;
    }

    try {
      const res = await fetchAdmin(`/api/admin/admins/${uid}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess(`Admin access removed for ${displayName}.`);
        await loadData();
      } else {
        setError(await extractError(res, 'Failed to remove admin access'));
      }
    } catch (err: unknown) {
      if (!isAdminAuthRequired(err)) {
        setError('Error removing admin access');
      }
    }
  };

  const handleLogout = async () => {
    clearAdminSession();
    if (auth) {
      await firebaseSignOut(auth).catch(() => undefined);
    }
    router.push('/admin/login');
  };

  const totalManagedUsers = admins.length + teachers.length + students.length;

  if (loading) {
    return (
      <div className="liquid-admin-page relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="liquid-noise pointer-events-none absolute inset-0" />
        <div className="glass-blob absolute -left-12 -top-24 h-72 w-72 rounded-full bg-cyan-300/55 blur-3xl" />
        <div className="glass-blob absolute -right-16 top-20 h-[22rem] w-[22rem] rounded-full bg-sky-300/40 blur-3xl [animation-delay:1.2s]" />
        <div className="glass-blob absolute -bottom-24 left-1/3 h-80 w-80 rounded-full bg-indigo-200/50 blur-3xl [animation-delay:2.2s]" />

        <div className="glass-surface relative z-10 rounded-3xl px-8 py-7 text-center shadow-[0_40px_100px_-45px_rgba(15,23,42,0.9)]">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-sky-600 border-t-transparent"></div>
          <p className="text-slate-700">Loading admin control center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="liquid-admin-page relative min-h-screen overflow-hidden text-slate-900">
      <div className="liquid-noise pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0">
        <div className="glass-blob absolute -left-24 -top-24 h-[22rem] w-[22rem] rounded-full bg-cyan-300/50 blur-3xl" />
        <div className="glass-blob absolute -right-28 top-8 h-[30rem] w-[30rem] rounded-full bg-sky-300/35 blur-3xl [animation-delay:1.3s]" />
        <div className="glass-blob absolute -bottom-32 left-1/3 h-[26rem] w-[26rem] rounded-full bg-indigo-200/45 blur-3xl [animation-delay:2.1s]" />
        <div className="glass-blob absolute bottom-0 right-1/4 h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl [animation-delay:2.8s]" />
      </div>

      {/* Header */}
      <div className="glass-surface sticky top-0 z-20 border-x-0 border-t-0 border-b border-white/50 bg-white/24">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Control Center</h1>
            <p className="text-sm text-slate-700">Create admins, assign teacher roles, and manage users in one place.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="glass-muted hidden rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 md:block">
              Active admins: {admins.length}
            </div>
            <Button
              onClick={handleLogout}
              className="flex items-center gap-2 border border-white/45 bg-white/35 text-slate-800 hover:bg-white/55"
            >
              <LogOut size={18} />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-300/55 bg-red-100/70 p-4 text-red-800 backdrop-blur-sm">
            <AlertCircle size={20} className="shrink-0" />
            <div className="flex-1">{error}</div>
            <Button onClick={() => void loadData()} className="border border-red-300/60 bg-red-200/75 px-3 py-2 text-sm text-red-800 hover:bg-red-200">
              Retry
            </Button>
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-2xl border border-emerald-300/55 bg-emerald-100/75 p-4 text-emerald-800 backdrop-blur-sm">
            {success}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="glass-muted mb-8 flex flex-wrap gap-2 rounded-2xl p-2 shadow-[0_25px_48px_-38px_rgba(14,116,144,0.85)]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`rounded-xl px-4 py-3 font-semibold transition-colors ${
              activeTab === 'overview'
                ? 'bg-white/65 text-sky-700 shadow-[0_14px_26px_-20px_rgba(14,116,144,0.95)]'
                : 'text-slate-700 hover:bg-white/45 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="inline mr-2" size={18} />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`rounded-xl px-4 py-3 font-semibold transition-colors ${
              activeTab === 'teachers'
                ? 'bg-white/65 text-sky-700 shadow-[0_14px_26px_-20px_rgba(14,116,144,0.95)]'
                : 'text-slate-700 hover:bg-white/45 hover:text-slate-900'
            }`}
          >
            <Users className="inline mr-2" size={18} />
            Teachers ({teachers.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`rounded-xl px-4 py-3 font-semibold transition-colors ${
              activeTab === 'students'
                ? 'bg-white/65 text-sky-700 shadow-[0_14px_26px_-20px_rgba(14,116,144,0.95)]'
                : 'text-slate-700 hover:bg-white/45 hover:text-slate-900'
            }`}
          >
            <BookOpen className="inline mr-2" size={18} />
            Students ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`rounded-xl px-4 py-3 font-semibold transition-colors ${
              activeTab === 'admins'
                ? 'bg-white/65 text-sky-700 shadow-[0_14px_26px_-20px_rgba(14,116,144,0.95)]'
                : 'text-slate-700 hover:bg-white/45 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="inline mr-2" size={18} />
            Admins ({admins.length})
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`rounded-xl px-4 py-3 font-semibold transition-colors ${
              activeTab === 'roles'
                ? 'bg-white/65 text-sky-700 shadow-[0_14px_26px_-20px_rgba(14,116,144,0.95)]'
                : 'text-slate-700 hover:bg-white/45 hover:text-slate-900'
            }`}
          >
            <UserCog className="inline mr-2" size={18} />
            Roles
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Admins" value={admins.length} subtitle="Control access" icon={ShieldCheck} />
              <StatCard title="Teachers" value={teachers.length} subtitle="Can run sessions" icon={Users} />
              <StatCard title="Students" value={students.length} subtitle="Can join sessions" icon={BookOpen} />
              <StatCard title="Total Users" value={totalManagedUsers} subtitle="Managed identities" icon={Layers} />
            </div>

            <Card className="glass-surface border-white/55 bg-white/18">
              <CardHeader className="border-b border-white/35 bg-white/20 pb-4">
                <CardTitle className="text-slate-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 p-5 md:grid-cols-3">
                <Button
                  onClick={() => {
                    setActiveTab('admins');
                    setShowCreateForm('admin');
                  }}
                  className="border border-white/45 bg-gradient-to-r from-sky-600 to-cyan-700 text-white hover:from-sky-500 hover:to-cyan-600"
                >
                  Create Admin
                </Button>
                <Button
                  onClick={() => {
                    setActiveTab('teachers');
                    setShowCreateForm('teacher');
                  }}
                  className="border border-white/45 bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-500 hover:to-teal-600"
                >
                  Create Teacher
                </Button>
                <Button
                  onClick={() => {
                    setActiveTab('roles');
                    setShowCreateForm('teacherRole');
                  }}
                  className="border border-white/45 bg-gradient-to-r from-indigo-600 to-blue-700 text-white hover:from-indigo-500 hover:to-blue-600"
                >
                  Assign Teacher Role
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Teachers Tab */}
        {activeTab === 'teachers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Teacher Management</h2>
              <Button
                onClick={() => setShowCreateForm(showCreateForm === 'teacher' ? null : 'teacher')}
                className="flex items-center gap-2 border border-white/45 bg-white/40 text-slate-800 hover:bg-white/60"
              >
                <Plus size={18} />
                {showCreateForm === 'teacher' ? 'Cancel' : 'Create Teacher'}
              </Button>
            </div>

            {showCreateForm === 'teacher' && (
              <Card className="glass-surface border-white/55 bg-white/20">
                <CardContent className="p-6">
                  <form onSubmit={handleCreateTeacher} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Input
                        type="text"
                        placeholder="Full Name"
                        value={teacherForm.displayName}
                        onChange={(e) => setTeacherForm({ ...teacherForm, displayName: e.target.value })}
                        required
                        className="border-white/50 bg-white/55 text-slate-900 placeholder:text-slate-500"
                      />
                      <Input
                        type="email"
                        placeholder="Email (christuniversity.in)"
                        value={teacherForm.email}
                        onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                        required
                        className="border-white/50 bg-white/55 text-slate-900 placeholder:text-slate-500"
                      />
                      <Input
                        type="password"
                        placeholder="Password (min 6 characters)"
                        value={teacherForm.password}
                        onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                        required
                        className="border-white/50 bg-white/55 text-slate-900 placeholder:text-slate-500"
                      />
                      <Input
                        type="text"
                        placeholder="Department"
                        value={teacherForm.department}
                        onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value })}
                        className="border-white/50 bg-white/55 text-slate-900 placeholder:text-slate-500"
                      />
                    </div>
                    <Button type="submit" className="w-full border border-white/50 bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-500 hover:to-teal-600">
                      Create Teacher
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {teachers.length === 0 ? (
              <p className="glass-muted py-8 text-center text-slate-700">No teachers found yet.</p>
            ) : (
              <div className="space-y-3">
                {teachers.map((teacher) => (
                  <Card key={teacher.uid} className="glass-muted overflow-hidden border-white/50">
                    <CardContent className="flex items-center justify-between p-4 transition-colors hover:bg-white/50">
                      <div>
                        <p className="font-semibold text-slate-900">{teacher.displayName}</p>
                        <p className="text-sm text-slate-700">{teacher.email}</p>
                        <p className="mt-1 text-xs text-slate-600">
                          Department: {teacher.department || 'N/A'} | Created: {new Date(teacher.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleDeleteTeacher(teacher.uid)}
                        className="border border-red-300/60 bg-red-100/75 text-red-800 hover:bg-red-200/75"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Student Management</h2>
              <Button
                onClick={() => setShowCreateForm(showCreateForm === 'student' ? null : 'student')}
                className="flex items-center gap-2 border border-white/45 bg-white/40 text-slate-800 hover:bg-white/60"
              >
                <Plus size={18} />
                {showCreateForm === 'student' ? 'Cancel' : 'Create Student'}
              </Button>
            </div>

            {showCreateForm === 'student' && (
              <Card className="glass-surface border-white/55 bg-white/20">
                <CardContent className="p-6">
                  <form onSubmit={handleCreateStudent} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Input
                        type="text"
                        placeholder="Full Name"
                        value={studentForm.displayName}
                        onChange={(e) => setStudentForm({ ...studentForm, displayName: e.target.value })}
                        required
                        className="border-white/50 bg-white/55 text-slate-900 placeholder:text-slate-500"
                      />
                      <Input
                        type="email"
                        placeholder="Email"
                        value={studentForm.email}
                        onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                        required
                        className="border-white/50 bg-white/55 text-slate-900 placeholder:text-slate-500"
                      />
                      <Input
                        type="password"
                        placeholder="Password (min 6 characters)"
                        value={studentForm.password}
                        onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                        required
                        className="border-white/50 bg-white/55 text-slate-900 placeholder:text-slate-500"
                      />
                      <Input
                        type="text"
                        placeholder="Student ID (optional)"
                        value={studentForm.studentId}
                        onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                        className="border-white/50 bg-white/55 text-slate-900 placeholder:text-slate-500"
                      />
                    </div>
                    <Button type="submit" className="w-full border border-white/50 bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-500 hover:to-teal-600">
                      Create Student
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {students.length === 0 ? (
              <p className="glass-muted py-8 text-center text-slate-700">No students found yet.</p>
            ) : (
              <div className="space-y-3">
                {students.map((student) => (
                  <Card key={student.uid} className="glass-muted overflow-hidden border-white/50">
                    <CardContent className="flex items-center justify-between p-4 transition-colors hover:bg-white/50">
                      <div>
                        <p className="font-semibold text-slate-900">{student.displayName}</p>
                        <p className="text-sm text-slate-700">{student.email}</p>
                        <p className="mt-1 text-xs text-slate-600">
                          ID: {student.studentId || 'N/A'} | Created: {new Date(student.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleDeleteStudent(student.uid)}
                        className="border border-red-300/60 bg-red-100/75 text-red-800 hover:bg-red-200/75"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admins Tab */}
        {activeTab === 'admins' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">Admin Management</h2>
              <Button
                onClick={() => setShowCreateForm(showCreateForm === 'admin' ? null : 'admin')}
                className="flex items-center gap-2 border border-white/45 bg-white/40 text-slate-800 hover:bg-white/60"
              >
                <Plus size={18} />
                {showCreateForm === 'admin' ? 'Cancel' : 'Create Admin'}
              </Button>
            </div>

            {showCreateForm === 'admin' && (
              <Card className="glass-surface border-white/55 bg-white/20">
                <CardHeader className="border-b border-white/35 bg-white/15 pb-4">
                  <CardTitle className="text-slate-900">Create New Admin Account</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleCreateAdmin} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <Input
                        type="text"
                        placeholder="Display name"
                        value={adminForm.displayName}
                        onChange={(e) => setAdminForm({ ...adminForm, displayName: e.target.value })}
                        required
                        className="border-white/50 bg-white/55 text-slate-900 placeholder:text-slate-500"
                      />
                      <Input
                        type="email"
                        placeholder="Admin email"
                        value={adminForm.email}
                        onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                        required
                        className="border-white/50 bg-white/55 text-slate-900 placeholder:text-slate-500"
                      />
                      <Input
                        type="password"
                        placeholder="Password (min 6 characters)"
                        value={adminForm.password}
                        onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                        required
                        className="border-white/50 bg-white/55 text-slate-900 placeholder:text-slate-500"
                      />
                    </div>
                    <Button type="submit" className="w-full border border-white/50 bg-gradient-to-r from-sky-600 to-cyan-700 text-white hover:from-sky-500 hover:to-cyan-600">
                      Create Admin
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {admins.length === 0 ? (
              <p className="glass-muted py-8 text-center text-slate-700">No admin accounts found.</p>
            ) : (
              <div className="space-y-3">
                {admins.map((admin) => {
                  const isCurrentAdmin = currentAdminUid === admin.uid;
                  return (
                    <Card key={admin.uid} className="glass-muted overflow-hidden border-white/50">
                      <CardContent className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-white/50">
                        <div>
                          <p className="font-semibold text-slate-900">{admin.displayName}</p>
                          <p className="text-sm text-slate-700">{admin.email}</p>
                          <p className="mt-1 text-xs text-slate-600">
                            Created: {formatDate(admin.createdAt)} | Last login: {formatDate(admin.lastLoginAt)}
                          </p>
                        </div>
                        <Button
                          disabled={isCurrentAdmin}
                          onClick={() => void handleRemoveAdmin(admin.uid, admin.displayName)}
                          className="border border-red-300/60 bg-red-100/75 text-red-800 hover:bg-red-200/75 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">Role Assignment</h2>
              <Button
                onClick={() => setShowCreateForm(showCreateForm === 'teacherRole' ? null : 'teacherRole')}
                className="flex items-center gap-2 border border-white/45 bg-white/40 text-slate-800 hover:bg-white/60"
              >
                <UserCog size={18} />
                {showCreateForm === 'teacherRole' ? 'Cancel' : 'Assign Teacher Role'}
              </Button>
            </div>

            {showCreateForm === 'teacherRole' && (
              <Card className="glass-surface border-white/55 bg-white/20">
                <CardHeader className="border-b border-white/35 bg-white/15 pb-4">
                  <CardTitle className="text-slate-900">Assign Teacher Role</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <form onSubmit={handleAssignTeacherRole} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Input
                        type="text"
                        placeholder="UID (optional if email is provided)"
                        value={teacherRoleForm.uid}
                        onChange={(e) => setTeacherRoleForm({ ...teacherRoleForm, uid: e.target.value })}
                        className="border-white/50 bg-white/55 text-slate-900 placeholder:text-slate-500"
                      />
                      <Input
                        type="email"
                        placeholder="Email (optional if UID is provided)"
                        value={teacherRoleForm.email}
                        onChange={(e) => setTeacherRoleForm({ ...teacherRoleForm, email: e.target.value })}
                        className="border-white/50 bg-white/55 text-slate-900 placeholder:text-slate-500"
                      />
                      <Input
                        type="text"
                        placeholder="Display name (required for new account)"
                        value={teacherRoleForm.displayName}
                        onChange={(e) => setTeacherRoleForm({ ...teacherRoleForm, displayName: e.target.value })}
                        className="border-white/50 bg-white/55 text-slate-900 placeholder:text-slate-500"
                      />
                      <Input
                        type="password"
                        placeholder="Password (required for new account)"
                        value={teacherRoleForm.password}
                        onChange={(e) => setTeacherRoleForm({ ...teacherRoleForm, password: e.target.value })}
                        className="border-white/50 bg-white/55 text-slate-900 placeholder:text-slate-500"
                      />
                      <Input
                        type="text"
                        placeholder="Department"
                        value={teacherRoleForm.department}
                        onChange={(e) => setTeacherRoleForm({ ...teacherRoleForm, department: e.target.value })}
                        className="md:col-span-2 border-white/50 bg-white/55 text-slate-900 placeholder:text-slate-500"
                      />
                    </div>
                    <Button type="submit" className="w-full border border-white/50 bg-gradient-to-r from-indigo-600 to-blue-700 text-white hover:from-indigo-500 hover:to-blue-600">
                      Assign Teacher Role
                    </Button>
                  </form>

                  <div className="glass-muted rounded-xl p-4 text-sm text-slate-700">
                    Use UID or email to promote an existing account to teacher. If the account does not exist,
                    provide email, display name, and password to create it directly as teacher.
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="glass-muted border-white/50">
              <CardContent className="p-5">
                <p className="text-sm text-slate-700">
                  Role changes update Firebase Auth claims and the Realtime Database user profile in sync.
                  This ensures teacher dashboards and protected APIs recognize the new role immediately.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="glass-surface border-white/55 bg-white/20 shadow-[0_25px_48px_-38px_rgba(14,116,144,0.8)]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-600">{title}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-600">{subtitle}</p>
          </div>
          <div className="rounded-2xl border border-white/50 bg-white/55 p-3 text-sky-700 shadow-[0_16px_24px_-18px_rgba(3,105,161,0.85)]">
            <Icon className="h-7 w-7" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
