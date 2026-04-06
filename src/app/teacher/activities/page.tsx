"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, Button } from "@classroom/ui-components";
import { LucidePlus, LucideSearch, LucidePlay, LucideEdit2, LucideTrash2, LucideFilter, LucideChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { dbService } from "@/lib/database";
import { useAuth } from "@/contexts/AuthContext";

interface ActivityTemplate {
  id: string;
  type: string;
  title: string;
  createdAt: string;
  questions?: any[];
  [key: string]: any;
}

export default function ActivitiesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadTemplates = async () => {
      setLoading(true);
      const savedTemplates = await dbService.getTemplatesByTeacher(user.uid);
      setTemplates(savedTemplates as ActivityTemplate[]);
      setLoading(false);
    };
    loadTemplates();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (confirm("Are you sure you want to delete this template? Permanent deletion cannot be reversed.")) {
      await dbService.deleteTemplate(user.uid, id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleLaunch = async (templateId: string) => {
    if (!user) return;
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    const newSession = {
      id: `session-${Date.now()}`,
      teacherId: user.uid,
      templateId,
      code,
      title: template.title || `Session ${code}`,
      status: "SCHEDULED" as const,
    };
    
    await dbService.createSession(newSession);
    router.push(`/teacher/session/${newSession.id}`);
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === "ALL" || t.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-10 animate-fade-in max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-start gap-5">
          <Link href="/teacher" className="mt-1 p-3 glass-card hover:bg-white transition-all text-slate-400 hover:text-indigo-600 shadow-xl border-white group">
            <LucideChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div className="space-y-1">
             <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">Activity <span className="text-gradient">Registry</span></h1>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Institutional Asset Management</p>
          </div>
        </div>
        <Link href="/teacher/create">
          <button className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-100 transition-all active:scale-95 group">
            <LucidePlus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
            Provision Template
          </button>
        </Link>
      </div>

      {/* Control Bar: Search & Filter */}
      <div className="glass-card p-4 bg-white/40 border-white/60 shadow-2xl flex flex-col lg:flex-row items-center gap-4">
        <div className="relative w-full lg:max-w-xl group">
          <LucideSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-400 transition-colors" size={20} />
          <input
            type="text"
            placeholder="FILTER BY ASSET TITLE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white/60 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all font-black text-xs tracking-widest text-slate-700 uppercase placeholder:text-slate-200"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-100">
            {["ALL", "QUIZ", "POLL", "FEEDBACK", "PAIRING"].map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase ${
                  activeFilter === f 
                    ? 'bg-white text-indigo-600 shadow-md border-white' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Registry Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-50 animate-pulse">
           {[1,2,3].map(i => (
             <div key={i} className="h-64 glass-card bg-white/20 border-white" />
           ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-full py-32 text-center space-y-6 glass-card bg-white/20 border-white">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-200 shadow-inner">
                <LucideFilter size={48} strokeWidth={1} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                {searchTerm ? "Zero matching records identified." : "No templates present in the registry."}
              </p>
            </div>
          ) : (
            filteredTemplates.map(t => (
              <div key={t.id} className="group glass-card bg-white/40 border-white/60 hover:bg-white/60 hover:border-indigo-200 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-2 flex flex-col relative overflow-hidden">
                <div className="p-8 space-y-8 flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit ${
                        t.type === 'QUIZ' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' :
                        t.type === 'POLL' ? 'bg-violet-600 text-white shadow-lg shadow-violet-100' :
                        t.type === 'FEEDBACK' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' :
                        'bg-amber-600 text-white shadow-lg shadow-amber-100'
                      }`}>
                        {t.type}
                      </span>
                      <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Ver 1.0.4</div>
                    </div>
                    
                    <div className="flex gap-2">
                       <button className="p-2.5 glass-card bg-white/50 border-white text-slate-400 hover:text-indigo-600 transition-colors shadow-sm">
                          <LucideEdit2 size={16} />
                       </button>
                       <button 
                         onClick={() => handleDelete(t.id)}
                         className="p-2.5 glass-card bg-white/50 border-white text-slate-400 hover:text-red-500 transition-colors shadow-sm"
                       >
                          <LucideTrash2 size={16} />
                       </button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight uppercase group-hover:text-indigo-600 transition-colors">{t.title}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       {t.type === 'QUIZ' ? `Complexity: ${t.questions?.length || 0} SECTIONS` : t.type === 'POLL' ? 'Single Variable' : 'Descriptive Panel'}
                    </p>
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={() => handleLaunch(t.id)}
                      className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 group/btn"
                    >
                      <LucidePlay size={18} className="fill-current group-hover/btn:scale-125 transition-transform" />
                      Deploy Asset
                    </button>
                  </div>
                </div>
                
                <div className="px-8 py-4 bg-white/40 border-t border-white/60 flex justify-between items-center text-[9px] text-slate-300 font-black uppercase tracking-widest">
                  <span>INIT: {new Date(t.createdAt).toLocaleDateString()}</span>
                  <span>REF: {t.id.slice(4, 10).toUpperCase()}</span>
                </div>
                
                {/* Visual Accent */}
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
