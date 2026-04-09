"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, SessionStatusIndicator } from "@classroom/ui-components";
import { LucidePlus, LucideUsers, LucidePlay, LucideChevronLeft, LucideCalendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { dbService, ActivityTemplate, Session } from "@/lib/database";
import { useAuth } from "@/contexts/AuthContext";

export default function SessionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      const [savedSessions, savedTemplates] = await Promise.all([
        dbService.getTeacherSessions(user.uid),
        dbService.getTemplatesByTeacher(user.uid),
      ]);
      setSessions(savedSessions);
      setTemplates(savedTemplates);
      setLoading(false);
    };

    void loadData();
  }, [user]);

  const handleLaunch = async (templateId: string) => {
    if (!user) return;

    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const joinPassword = window.prompt('Set session password (minimum 4 chars):', '000000')?.trim() || '000000';
    if (joinPassword.length < 4) {
      alert('Session password must be at least 4 characters.');
      return;
    }

    const newSession = await dbService.createSessionFromTemplate({
      teacherId: user.uid,
      teacherEmail: user.email || undefined,
      template,
      joinPassword,
      status: 'SCHEDULED',
    });

    setSessions((prev) => [...prev, newSession]);
    setShowCreateModal(false);
    
    router.push(`/teacher/session/${newSession.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/teacher" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <LucideChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Session Management</h1>
            <p className="text-sm text-slate-500 font-medium">Create and track your classroom sessions</p>
          </div>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <LucidePlus size={18} />
          Create New Session
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-slate-50">
          <CardTitle>Continuous & Past Sessions</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100 animate-pulse">
                <LucideCalendar size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                <LucideCalendar size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No sessions found. Start by launching a template.</p>
              <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                Pick a Template
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map((session) => (
                <div key={session.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-slate-900">{session.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Created: {new Date(session.createdAt).toLocaleDateString()}</p>
                    </div>
                    <SessionStatusIndicator status={session.status} />
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                    <span className="flex items-center gap-1.5"><LucideUsers size={14}/> {Object.keys(session.participants || {}).length} Students</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold">Code: {session.code}</span>
                  </div>

                  <Link 
                    href={`/teacher/session/${session.id}`}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <LucidePlay size={16} className="fill-current" />
                    Open Session
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Selection Modal Overflow */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl border-slate-200 animate-in fade-in zoom-in duration-200">
            <CardHeader className="border-b border-slate-100">
              <div className="flex justify-between items-center">
                <CardTitle>Select Template to Launch</CardTitle>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  &times;
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No activity templates found.</p>
                  <Link href="/teacher/create" className="text-blue-600 font-medium hover:underline text-sm">
                    Create your first template
                  </Link>
                </div>
              ) : (
                templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleLaunch(t.id)}
                    className="w-full text-left p-4 rounded-xl border border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all group flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 group-hover:text-blue-700">{t.title}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mt-1">{t.type}</p>
                    </div>
                    <LucidePlay size={16} className="text-slate-400 group-hover:text-blue-600" />
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
