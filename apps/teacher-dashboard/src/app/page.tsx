"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@classroom/ui-components";
import { SessionStatusIndicator } from "@classroom/ui-components";
import { LucidePlus, LucideUsers, LucideActivity, LucideBarChart2, LucideLayoutDashboard, LucidePlay } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  return (
    <TeacherDashboard />
  );
}

export function TeacherDashboard() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  
  useEffect(() => {
    const savedTemplates = JSON.parse(localStorage.getItem('classroom_templates') || '[]');
    const savedSessions = JSON.parse(localStorage.getItem('classroom_sessions') || '[]');
    
    // Inject sample test class
    if (!savedSessions.find((s: any) => s.code === '000000')) {
      const sampleSession = {
        id: "session-sample-000000",
        code: "000000",
        title: "Sample Checking Class",
        templateId: "sample-template",
        status: "WAITING",
        createdAt: new Date().toISOString()
      };
      savedSessions.push(sampleSession);
      localStorage.setItem('classroom_sessions', JSON.stringify(savedSessions));
    }
    
    if (!savedTemplates.find((t: any) => t.id === "sample-template")) {
      const sampleTemplate = {
        id: "sample-template",
        title: "Sample Test Class Theme",
        type: "QUIZ",
        questions: [
            { id: "q1", text: "Is this working?", options: [{id: "opt1", text: "Yes"}, {id: "opt2", text: "No"}], correctOption: "opt1", points: 1 }
        ]
      };
      savedTemplates.push(sampleTemplate);
      localStorage.setItem('classroom_templates', JSON.stringify(savedTemplates));
    }
    
    setTemplates(savedTemplates);
    setActiveSessions(savedSessions.map((s: any) => ({
      id: s.id,
      name: s.title || `Session ${s.code}`,
      status: s.status,
      participants: 0,
      code: s.code
    })));
  }, []);

  const handleLaunch = (templateId: string) => {
    // Generate a random 6 char code
    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    const newSession = {
      id: `session-${Date.now()}`,
      code,
      templateId,
      status: "WAITING",
      createdAt: new Date().toISOString()
    };
    
    const existingSessions = JSON.parse(localStorage.getItem('classroom_sessions') || '[]');
    localStorage.setItem('classroom_sessions', JSON.stringify([...existingSessions, newSession]));
    
    router.push(`/session/${newSession.id}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Welcome back, Professor.</p>
        </div>
        <Link 
          href="/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
        >
          <LucidePlus size={20} />
          Create New Activity
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Participation" value="94%" icon={<LucideUsers className="text-blue-600" />} />
        <StatCard title="Active Sessions" value="1" icon={<LucideActivity className="text-emerald-600" />} />
        <StatCard title="Avg. Score" value="8.4" icon={<LucideBarChart2 className="text-amber-600" />} />
        <StatCard title="Templates Created" value={templates.length.toString()} icon={<LucideLayoutDashboard className="text-slate-600" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-slate-50">
              <CardTitle>Active Sessions</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {activeSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors shadow-sm">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900">{session.name}</p>
                      <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                        <SessionStatusIndicator status={session.status} />
                        <span className="flex items-center gap-1"><LucideUsers size={14}/> {session.participants} participants</span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">Code: {session.code}</span>
                      </div>
                    </div>
                    <Link href={`/session/${session.id}`} className="text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 font-semibold transition-colors">
                      Manage Live
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-slate-50 flex flex-row items-center justify-between">
              <CardTitle>My Templates</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-slate-500">
                    No templates created yet. Get started by creating a new activity!
                  </div>
                ) : (
                  templates.map(t => (
                    <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between group shadow-sm">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-slate-900">{t.title}</h4>
                          <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded uppercase tracking-wide">
                            {t.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {t.type === 'QUIZ' ? `${t.questions?.length || 0} Questions` : t.type === 'POLL' ? `${t.options?.length || 0} Options` : 'Custom Activity'}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleLaunch(t.id)}
                        className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors opacity-90 group-hover:opacity-100 shadow-sm"
                      >
                        <LucidePlay size={16} className="fill-current" />
                        Launch Session
                      </button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-slate-200 h-fit">
          <CardHeader className="border-b border-slate-100 bg-slate-50">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 pt-6">
            <ActionButton href="/create?type=QUIZ" label="Create Quiz" />
            <ActionButton href="/create?type=POLL" label="Start Poll" />
            <ActionButton href="/create?type=FEEDBACK" label="Feedback Board" />
            <ActionButton href="/create?type=WORD_RIDDLE" label="Word Riddle" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="shadow-sm border-slate-200">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionButton({ label, href }: { label: string, href: string }) {
  return (
    <Link href={href} className="w-full px-4 py-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all font-medium flex items-center justify-between group shadow-sm bg-white">
      <span className="text-slate-700 group-hover:text-blue-700">{label}</span>
      <LucidePlus size={18} className="text-slate-400 group-hover:text-blue-600" />
    </Link>
  );
}
