'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@classroom/ui-components';
import { Button } from '@classroom/ui-components';
import { Input } from '@classroom/ui-components';
import { AlertCircle, Plus, Trash2, LogOut, Users, BookOpen, BarChart3 } from 'lucide-react';
import type { Teacher, Student } from '@/lib/database';

export default function AdminDashboard() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'teachers' | 'students'>('overview');
  const [showCreateForm, setShowCreateForm] = useState<'teacher' | 'student' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  // Check admin access
  useEffect(() => {
    const isAdmin = typeof window !== 'undefined' && localStorage.getItem('admin_session') === 'true';
    if (!isAdmin) {
      router.push('/admin/login');
    } else {
      loadData();
    }
  }, [router]);

  // Load teachers and students
  const loadData = async () => {
    try {
      setLoading(true);
      const [teachersRes, studentsRes] = await Promise.all([
        fetch('/api/admin/teachers'),
        fetch('/api/admin/students'),
      ]);

      if (teachersRes.ok) {
        const data = await teachersRes.json();
        setTeachers(data.teachers || []);
      }
      if (studentsRes.ok) {
        const data = await studentsRes.json();
        setStudents(data.students || []);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Create teacher
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherForm),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`Teacher "${teacherForm.displayName}" created successfully!`);
        setTeacherForm({ email: '', password: '', displayName: '', department: 'Computer Science' });
        setShowCreateForm(null);
        loadData();
      } else {
        setError(data.error || 'Failed to create teacher');
      }
    } catch (err) {
      setError('Error creating teacher');
    }
  };

  // Create student
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentForm),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`Student "${studentForm.displayName}" created successfully!`);
        setStudentForm({ email: '', password: '', displayName: '', studentId: '', department: 'Computer Science' });
        setShowCreateForm(null);
        loadData();
      } else {
        setError(data.error || 'Failed to create student');
      }
    } catch (err) {
      setError('Error creating student');
    }
  };

  // Delete teacher
  const handleDeleteTeacher = async (uid: string) => {
    if (confirm('Are you sure you want to delete this teacher? This cannot be undone.')) {
      try {
        const res = await fetch(`/api/admin/teachers/${uid}`, { method: 'DELETE' });
        if (res.ok) {
          setSuccess('Teacher deleted successfully');
          loadData();
        } else {
          setError('Failed to delete teacher');
        }
      } catch (err) {
        setError('Error deleting teacher');
      }
    }
  };

  // Delete student
  const handleDeleteStudent = async (uid: string) => {
    if (confirm('Are you sure you want to delete this student? This cannot be undone.')) {
      try {
        const res = await fetch(`/api/admin/students/${uid}`, { method: 'DELETE' });
        if (res.ok) {
          setSuccess('Student deleted successfully');
          loadData();
        } else {
          setError('Failed to delete student');
        }
      } catch (err) {
        setError('Error deleting student');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    localStorage.removeItem('admin_login_time');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-600 text-sm">User Management & Database Administration</p>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
          >
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3">
            <AlertCircle size={20} className="shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            ✓ {success}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="inline mr-2" size={18} />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'teachers'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="inline mr-2" size={18} />
            Teachers ({teachers.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'students'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="inline mr-2" size={18} />
            Students ({students.length})
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard title="Total Teachers" value={teachers.length} icon="👨‍🏫" />
            <StatCard title="Total Students" value={students.length} icon="👨‍🎓" />
            <StatCard title="Total Users" value={teachers.length + students.length} icon="👥" />
          </div>
        )}

        {/* Teachers Tab */}
        {activeTab === 'teachers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Teacher Management</h2>
              <Button
                onClick={() => setShowCreateForm(showCreateForm === 'teacher' ? null : 'teacher')}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <Plus size={18} />
                {showCreateForm === 'teacher' ? 'Cancel' : 'Create Teacher'}
              </Button>
            </div>

            {showCreateForm === 'teacher' && (
              <Card className="shadow-sm border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <form onSubmit={handleCreateTeacher} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        type="text"
                        placeholder="Full Name"
                        value={teacherForm.displayName}
                        onChange={(e) => setTeacherForm({ ...teacherForm, displayName: e.target.value })}
                        required
                      />
                      <Input
                        type="email"
                        placeholder="Email (christuniversity.in)"
                        value={teacherForm.email}
                        onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                        required
                      />
                      <Input
                        type="password"
                        placeholder="Password (min 6 characters)"
                        value={teacherForm.password}
                        onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                        required
                      />
                      <Input
                        type="text"
                        placeholder="Department"
                        value={teacherForm.department}
                        onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white">
                      Create Teacher
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {teachers.length === 0 ? (
              <p className="text-slate-600 text-center py-8">No teachers created yet.</p>
            ) : (
              <div className="space-y-3">
                {teachers.map((teacher) => (
                  <Card key={teacher.uid} className="shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-semibold text-slate-900">{teacher.displayName}</p>
                        <p className="text-sm text-slate-600">{teacher.email}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Department: {teacher.department || 'N/A'} | Created: {new Date(teacher.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleDeleteTeacher(teacher.uid)}
                        className="bg-red-100 hover:bg-red-200 text-red-700"
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
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Student Management</h2>
              <Button
                onClick={() => setShowCreateForm(showCreateForm === 'student' ? null : 'student')}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <Plus size={18} />
                {showCreateForm === 'student' ? 'Cancel' : 'Create Student'}
              </Button>
            </div>

            {showCreateForm === 'student' && (
              <Card className="shadow-sm border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <form onSubmit={handleCreateStudent} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        type="text"
                        placeholder="Full Name"
                        value={studentForm.displayName}
                        onChange={(e) => setStudentForm({ ...studentForm, displayName: e.target.value })}
                        required
                      />
                      <Input
                        type="email"
                        placeholder="Email"
                        value={studentForm.email}
                        onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                        required
                      />
                      <Input
                        type="password"
                        placeholder="Password (min 6 characters)"
                        value={studentForm.password}
                        onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                        required
                      />
                      <Input
                        type="text"
                        placeholder="Student ID (optional)"
                        value={studentForm.studentId}
                        onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white">
                      Create Student
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {students.length === 0 ? (
              <p className="text-slate-600 text-center py-8">No students created yet.</p>
            ) : (
              <div className="space-y-3">
                {students.map((student) => (
                  <Card key={student.uid} className="shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-semibold text-slate-900">{student.displayName}</p>
                        <p className="text-sm text-slate-600">{student.email}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          ID: {student.studentId || 'N/A'} | Created: {new Date(student.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleDeleteStudent(student.uid)}
                        className="bg-red-100 hover:bg-red-200 text-red-700"
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
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: string }) {
  return (
    <Card className="shadow-sm border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          </div>
          <span className="text-4xl">{icon}</span>
        </div>
      </CardContent>
    </Card>
  );
}
