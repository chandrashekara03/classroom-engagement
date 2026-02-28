"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, Button } from "@classroom/ui-components";
import { LucidePlus, LucideSearch, LucidePlay, LucideEdit2, LucideTrash2, LucideFilter, LucideChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");

  useEffect(() => {
    const savedTemplates = JSON.parse(localStorage.getItem('classroom_templates') || '[]');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTemplates(savedTemplates);
  }, []);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      const updated = templates.filter(t => t.id !== id);
      localStorage.setItem('classroom_templates', JSON.stringify(updated));
      setTemplates(updated);
    }
  };

  const handleLaunch = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    const newSession = {
      id: `session-${Date.now()}`,
      code,
      templateId,
      title: template?.title || `Session ${code}`,
      status: "WAITING",
      createdAt: new Date().toISOString()
    };
    
    const existing = JSON.parse(localStorage.getItem('classroom_sessions') || '[]');
    localStorage.setItem('classroom_sessions', JSON.stringify([...existing, newSession]));
    
    router.push(`/teacher/session/${newSession.id}`);
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === "ALL" || t.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/teacher" className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
            <LucideChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Activity Templates</h1>
            <p className="text-sm text-slate-500 font-medium">Manage your reusable activity building blocks</p>
          </div>
        </div>
        <Link href="/teacher/create">
          <Button variant="primary" className="flex items-center gap-2">
            <LucidePlus size={18} />
            Create Template
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:max-w-md">
          <LucideSearch className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-900"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <LucideFilter className="text-slate-400 mr-2" size={18} />
          {["ALL", "QUIZ", "POLL", "FEEDBACK", "PAIRING"].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
                activeFilter === f 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <LucideFilter size={40} />
            </div>
            <p className="text-slate-500 font-medium italic">
              {searchTerm ? "No templates match your search." : "No activity templates found. Let's create one!"}
            </p>
          </div>
        ) : (
          filteredTemplates.map(t => (
            <Card key={t.id} className="group hover:border-blue-300 hover:shadow-md transition-all border-slate-200">
              <CardContent className="p-0">
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      t.type === 'QUIZ' ? 'bg-blue-50 text-blue-700' :
                      t.type === 'POLL' ? 'bg-indigo-50 text-indigo-700' :
                      t.type === 'FEEDBACK' ? 'bg-amber-50 text-amber-700' :
                      'bg-emerald-50 text-emerald-700'
                    }`}>
                      {t.type}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md">
                        <LucideEdit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                      >
                        <LucideTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">{t.title}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {t.type === 'QUIZ' ? `${t.questions?.length || 0} Questions` : t.type === 'POLL' ? 'Single Question' : 'Instructional Board'}
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button 
                      onClick={() => handleLaunch(t.id)}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white gap-2 font-bold py-2.5 text-sm"
                    >
                      <LucidePlay size={16} className="fill-current" />
                      Launch Now
                    </Button>
                  </div>
                </div>
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  <span>Created: {new Date(t.createdAt).toLocaleDateString()}</span>
                  <span>ID: {t.id.slice(4, 10)}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
