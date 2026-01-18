"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

interface Teacher {
  id: string;
  email: string;
  created_at: string;
}

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeacherEmail, setNewTeacherEmail] = useState("");
  const [newTeacherPassword, setNewTeacherPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      const { data, error } = await supabase.from('teachers').select('*');
      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error loading teachers:', error);
      setMessage('Error loading teachers');
    } finally {
      setLoading(false);
    }
  };

  const createTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherEmail || !newTeacherPassword) return;

    setCreating(true);
    setMessage("");

    try {
      // Create user in auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: newTeacherEmail,
        password: newTeacherPassword,
        email_confirm: true
      });

      if (authError) throw authError;

      // Add to teachers table
      const { error: teacherError } = await supabase
        .from('teachers')
        .insert({
          id: authData.user.id,
          email: newTeacherEmail,
          password_hash: 'managed_by_supabase_auth'
        });

      if (teacherError) throw teacherError;

      setMessage('Teacher created successfully!');
      setNewTeacherEmail("");
      setNewTeacherPassword("");
      loadTeachers();
    } catch (error: any) {
      console.error('Error creating teacher:', error);
      setMessage(error.message || 'Error creating teacher');
    } finally {
      setCreating(false);
    }
  };

  const deleteTeacher = async (teacherId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete teacher ${email}?`)) return;

    try {
      // Delete from teachers table
      const { error: teacherError } = await supabase
        .from('teachers')
        .delete()
        .eq('id', teacherId);

      if (teacherError) throw teacherError;

      // Delete from auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(teacherId);
      if (authError) throw authError;

      setMessage('Teacher deleted successfully!');
      loadTeachers();
    } catch (error: any) {
      console.error('Error deleting teacher:', error);
      setMessage(error.message || 'Error deleting teacher');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Teachers</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create and manage teacher accounts
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
            Create New Teacher
          </h3>
          <form onSubmit={createTeacher} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={newTeacherEmail}
                onChange={(e) => setNewTeacherEmail(e.target.value)}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={newTeacherPassword}
                onChange={(e) => setNewTeacherPassword(e.target.value)}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Teacher'}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Existing Teachers ({teachers.length})
          </h3>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {teachers.map((teacher) => (
            <li key={teacher.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <svg className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {teacher.email}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Created {new Date(teacher.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => deleteTeacher(teacher.id, teacher.email)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
          {teachers.length === 0 && (
            <li className="px-4 py-8 sm:px-6 text-center text-gray-500 dark:text-gray-400">
              No teachers found. Create your first teacher above.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}