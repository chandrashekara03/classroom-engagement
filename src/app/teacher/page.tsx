"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@classroom/ui-components";
import { SessionStatusIndicator } from "@classroom/ui-components";
import type { SessionStatus } from "@classroom/shared-utils";
import { 
  LucidePlus, 
  LucideUsers, 
  LucideActivity, 
  LucideBarChart2, 
  LucideLayoutDashboard, 
  LucidePlay,
  LucideBookOpen,
  LucideHistory,
  LucideDatabase,
  LucideLogOut
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { dbService, Session, ActivityTemplate } from "../../lib/database";

export default function Home() {
  return <TeacherDashboard />;
}

export function TeacherDashboard() {
  const router = useRouter();
  const { user, teacherData, logout } = useAuth();
  const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !teacherData) return;

    const loadData = async () => {
      try {
        // Load teacher's sessions from Firebase RTDB
        const sessions = await dbService.getTeacherSessions(user.uid);
        setActiveSessions(sessions);

        // Load teacher's templates from Firebase
        let savedTemplates = await dbService.getTemplatesByTeacher(user.uid);
        setTemplates(savedTemplates);

        // Inject sample test class if not exists
        if (!sessions.find((s) => s.code === '000000')) {
          const sampleSession: Session = {
            id: "session-sample-000000",
            teacherId: user.uid,
            code: "000000",
            joinPassword: "000000",
            templateId: "sample-template",
            title: "Sample Checking Class",
            status: "SCHEDULED",
            createdAt: new Date().toISOString(),
            participants: {}
          };
          await dbService.createSession(sampleSession);
          setActiveSessions(prev => [...prev, sampleSession]);
        }

        if (!savedTemplates.find((t) => t.id === "sample-template")) {
          const sampleTemplate: ActivityTemplate = {
            id: "sample-template",
            teacherId: user.uid,
            title: "Sample Test Class Theme",
            type: "QUIZ",
            questions: [
                { id: "q1", text: "Is this working?", options: [{id: "opt1", text: "Yes"}, {id: "opt2", text: "No"}], correctOption: "opt1", points: 1 }
            ] as any,
            createdAt: new Date().toISOString(),
          };
          await dbService.createTemplate(sampleTemplate);
          savedTemplates = await dbService.getTemplatesByTeacher(user.uid);
          setTemplates(savedTemplates);
        }
      } catch (error) {
        console.error('Error loading teacher data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, teacherData]);

  const handleLaunch = async (templateId: string) => {
    if (!user) return;

    try {
      const joinPassword = window.prompt('Set session password (minimum 4 chars):', '000000')?.trim() || '000000';
      if (joinPassword.length < 4) {
        alert('Session password must be at least 4 characters.');
        return;
      }

      const template = templates.find((t) => t.id === templateId);
      if (!template) {
        alert('Template not found. Please refresh and try again.');
        return;
      }

      const newSession = await dbService.createSessionFromTemplate({
        teacherId: user.uid,
        teacherEmail: user.email || undefined,
        template,
        joinPassword,
        status: 'SCHEDULED',
      });

      setActiveSessions((prev) => [...prev, newSession]);
      router.push(`/teacher/session/${newSession.id}`);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calibrating Dashboard</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto animate-fade-in relative">
      {/* Decorative Background Elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full -z-10 animate-pulse-soft" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full -z-10 animate-pulse-soft" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight text-gradient">
            Teacher Dashboard
          </h1>
          <p className="text-slate-500 font-medium">Manage your academic sessions and interactive modules</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-3 px-5 py-2.5 glass-card border-indigo-100/50 bg-white/40">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
            <span className="text-sm font-bold text-slate-700 tracking-tight">Cloud Synchronized</span>
          </div>
          <button 
            onClick={() => logout()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-400 hover:text-red-600 transition-all hover:bg-white/50 rounded-xl"
          >
            <LucideLogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard title="Participation" value="94%" icon={<LucideUsers size={20} />} trend="+2.4%" />
        <StatCard title="Live Now" value={activeSessions.filter(s => s.status === 'LIVE').length.toString()} icon={<LucideActivity size={20} />} active={activeSessions.some(s => s.status === 'LIVE')} />
        <StatCard title="Avg. Score" value="8.4" icon={<LucideBarChart2 size={20} />} />
        <StatCard title="Modules" value={templates.length.toString()} icon={<LucideLayoutDashboard size={20} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <section className="space-y-6">
            <div className="flex justify-between items-center group">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-lg shadow-indigo-200 shadow-lg">
                  <LucideBookOpen className="w-5 h-5 text-white" />
                </div>
                Academic Modules
              </h2>
              <Link 
                href="/teacher/activities"
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 hover:scale-105 transition-all shadow-xl shadow-indigo-200"
              >
                <LucidePlus size={18} />
                Manage Library
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {templates.length === 0 ? (
                <div className="col-span-full glass-card p-12 text-center border-dashed border-2 bg-white/20">
                  <p className="text-slate-400 font-bold mb-4 uppercase tracking-widest text-xs">Repository Empty</p>
                  <h3 className="text-xl font-bold text-slate-700 mb-6">Create your first teaching module</h3>
                  <Link href="/teacher/activities" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-indigo-600 border border-indigo-100 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-sm">
                    <LucidePlus size={20} />
                    Get Started
                  </Link>
                </div>
              ) : (
                templates.map(t => (
                  <div key={t.id} className="glass-card p-6 flex flex-col justify-between group active:scale-[0.98] transition-all bg-white/40">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black tracking-[0.2em] rounded-lg uppercase">
                          {t.type}
                        </span>
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <LucideBarChart2 size={14} />
                        </div>
                      </div>
                      <h4 className="text-xl font-extrabold text-slate-800 leading-tight mb-1 group-hover:text-indigo-600 transition-colors uppercase">{t.title}</h4>
                      <p className="text-sm font-bold text-slate-400 tracking-tight">
                        {t.type === 'QUIZ' ? `${(t.questions as any[])?.length || 0} Items` : 'Interactive Activity'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleLaunch(t.id)}
                      className="mt-8 w-full py-3 bg-indigo-600 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 hover:shadow-indigo-200"
                    >
                      <LucidePlay size={16} fill="currentColor" />
                      LAUNCH SESSION
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-lg shadow-amber-200 shadow-lg">
                <LucideActivity className="w-5 h-5 text-white" />
              </div>
              Live Sessions
            </h2>
            <div className="glass-card divide-y divide-slate-100/50 overflow-hidden bg-white/30 backdrop-blur-xl">
              {activeSessions.length === 0 ? (
                <p className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No active streams</p>
              ) : (
                activeSessions.slice(0, 5).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(session => (
                  <div key={session.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/50 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <p className="font-extrabold text-slate-900 uppercase tracking-tight text-lg">{session.title}</p>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                          session.status === 'LIVE' ? 'bg-emerald-100 text-emerald-700 animate-pulse' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-400 font-mono tracking-wider">
                         <span>CODE: {session.code}</span>
                         <span className="flex items-center gap-1"><LucideUsers size={12} /> {Object.keys(session.participants || {}).length} Active</span>
                      </div>
                    </div>
                    <Link 
                      href={`/teacher/session/${session.id}`}
                      className="w-full sm:w-auto px-6 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl text-xs font-black tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm hover:shadow-md"
                    >
                      MANAGE SESSION
                    </Link>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="space-y-10">
          <section className="glass-card p-8 bg-indigo-600 text-white relative overflow-hidden group">
             <div className="absolute top-[-50%] right-[-20%] w-[120%] h-[120%] bg-indigo-400/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
             <div className="relative z-10">
               <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Quick Launch</h3>
               <p className="text-indigo-100 font-medium text-sm mb-8">Templates are efficient, but speed is key. Quick-start a poll or quiz instantly.</p>
               <div className="space-y-3">
                 <ActionButton href="/teacher/activities" label="Open Activity Library" dark />
                 <ActionButton href="/teacher/activities" label="Interactive Registry" dark />
               </div>
             </div>
          </section>

          <section className="glass-card p-6 bg-white/40">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Class Analytics</h4>
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Avg Engagement</span>
                <span className="text-2xl font-black text-slate-800">88%</span>
              </div>
              <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Success Rate</span>
                <span className="text-2xl font-black text-slate-800">76%</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, active }: { title: string; value: string; icon: React.ReactNode; trend?: string; active?: boolean }) {
  return (
    <div className={`glass-card p-6 border-b-4 bg-white/50 ${active ? 'border-emerald-500' : 'border-indigo-500/20'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-indigo-500'} shadow-sm`}>
          {icon}
        </div>
        {trend && (
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-black text-slate-800 mt-1">{value}</p>
      </div>
    </div>
  );
}

function ActionButton({ label, href, dark }: { label: string; href: string; dark?: boolean }) {
  return (
    <Link 
      href={href} 
      className={`w-full px-5 py-3.5 rounded-xl font-bold text-sm flex items-center justify-between transition-all group ${
        dark 
        ? 'bg-indigo-500/30 text-white hover:bg-white hover:text-indigo-600 border border-indigo-400/30' 
        : 'bg-white/50 text-slate-700 hover:text-indigo-600 hover:bg-white border border-slate-100/50'
      }`}
    >
      <span className="tracking-tight">{label}</span>
      <LucidePlus size={18} className="transition-transform group-hover:rotate-90 group-hover:scale-110" />
    </Link>
  );
}
