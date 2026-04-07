"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  SessionStatusIndicator, 
  GroupDisplay, 
  Button 
} from "@classroom/ui-components";
import { 
  LucidePlay, 
  LucidePause, 
  LucideSquare, 
  LucideUsers, 
  LucideTimer, 
  LucideBarChart3, 
  LucideDices, 
  LucideUserPlus, 
  LucideX,
  LucideChevronLeft,
  LucideZap,
  LucideSend,
  LucideTrophy,
  LucideMessageCircle,
  LucideLayers
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { dbService, Session, Participant, SessionResponse, ActivityTemplate } from "@/lib/database";
import { useAuth } from "@/contexts/AuthContext";

export default function SessionManager() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [templateData, setTemplateData] = useState<ActivityTemplate | null>(null);
  const [status, setStatus] = useState<Session['status']>("SCHEDULED");
  const [responses, setResponses] = useState<SessionResponse[]>([]);
  const [timer, setTimer] = useState(600); // 10 minutes default
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Random Name Picker State
  const [pickedName, setPickedName] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);

  // Group Matchmaker State
  type GroupMember = { id: string; name: string; isPresent: boolean };
  type SessionGroup = { id: string; name: string; members: GroupMember[] };
  const [groups, setGroups] = useState<SessionGroup[]>([]);
  const [groupSize, setGroupSize] = useState<number>(3);
  const [showGroups, setShowGroups] = useState(false);

  // Load session and template from Firebase RTDB
  useEffect(() => {
    if (!id) return;
    
    const loadInitialData = async () => {
      const currentSession = await dbService.getSession(String(id));
      if (!currentSession) {
        router.push('/teacher');
        return;
      }

      if (currentSession.templateId) {
        const foundTemplate = await dbService.getActivityTemplate(currentSession.templateId, currentSession.teacherId);
        setTemplateData(foundTemplate || (currentSession.templateSnapshot as ActivityTemplate) || null);
      }

      setSessionData(currentSession);
      setStatus(currentSession.status);
    };

    void loadInitialData();

    // Set up Real-time Listeners
    const unsubSession = dbService.onSessionUpdate(String(id), (updated) => {
      setSessionData(updated);
      setStatus(updated.status);
    });

    const unsubParticipants = dbService.onSessionParticipantsUpdate(String(id), (parts) => {
      setParticipants(parts);
    });

    const unsubResponses = dbService.onSessionResponsesUpdate(String(id), (resps) => {
      setResponses(resps);
    });

    return () => {
      unsubSession();
      unsubParticipants();
      unsubResponses();
    };
  }, [id, router]);

  // Countdown timer when LIVE
  useEffect(() => {
    if (status === "LIVE" && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [status, timer]);

  const handleStartSession = async () => {
    if (!id) return;
    await dbService.updateSessionStatus(id as string, "LIVE", {
      startedAt: new Date().toISOString(),
    });
  };

  const handlePauseSession = async () => {
    if (!id) return;
    await dbService.updateSessionStatus(id as string, "SCHEDULED");
  };

  const handleEndSession = async () => {
    if (!id) return;
    if (confirm("Terminate session and finalize all participant records?")) {
      await dbService.updateSessionStatus(id as string, "COMPLETED", {
        endedAt: new Date().toISOString(),
      });
    }
  };

  const handlePickRandomName = useCallback(() => {
    if (participants.length === 0) return;
    setIsPicking(true);
    setPickedName(null);

    let count = 0;
    const maxCount = 20;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * participants.length);
      setPickedName(participants[randomIndex].name);
      count++;
      if (count >= maxCount) {
        clearInterval(interval);
        setIsPicking(false);
        const finalIndex = Math.floor(Math.random() * participants.length);
        setPickedName(participants[finalIndex].name);
      }
    }, 100);
  }, [participants]);

  const handleGenerateGroups = useCallback(() => {
    if (participants.length === 0) return;

    const shuffled = [...participants].sort(() => 0.5 - Math.random());
    const newGroups: SessionGroup[] = [];
    const numGroups = Math.ceil(shuffled.length / groupSize);

    for (let i = 0; i < numGroups; i++) {
      const members = shuffled.slice(i * groupSize, (i + 1) * groupSize).map((p) => ({
        id: p.id,
        name: p.name,
        isPresent: true,
      }));
      newGroups.push({ id: `group-${i + 1}`, name: `Group ${i + 1}`, members });
    }

    setGroups(newGroups);
    setShowGroups(true);
  }, [participants, groupSize]);

  return (
    <div className="space-y-10 animate-fade-in max-w-7xl mx-auto px-4 py-8 pb-32">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pb-4">
        <div className="flex items-center gap-6 w-full lg:w-auto">
          <Link href="/teacher/activities" className="p-3 glass-card hover:bg-white text-slate-400 hover:text-indigo-600 transition-all shadow-xl group border-white">
            <LucideChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div className="space-y-1">
             <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">
                  {sessionData?.title || 'SESSION TERMINAL'}
                </h1>
                <div className="hidden sm:block">
                   <SessionStatusIndicator status={status} />
                </div>
             </div>
             <div className="flex items-center gap-4 py-1">
                <div className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 font-mono text-[10px] font-black tracking-widest uppercase">
                   ACCESS: {sessionData?.code || '------'}
                </div>
                {sessionData?.joinPassword && (
                   <div className="px-3 py-1 bg-amber-50 border border-amber-100 rounded-lg text-amber-700 font-mono text-[10px] font-black tracking-widest uppercase">
                      SEC: {sessionData.joinPassword}
                   </div>
                )}
             </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 p-2 glass-card bg-white/40 border-white/60 shadow-2xl rounded-3xl">
          {status === "LIVE" ? (
            <>
              <button 
                onClick={handlePauseSession}
                className="p-4 rounded-2xl bg-white text-amber-500 hover:text-amber-600 shadow-lg border-white transition-all active:scale-90"
              >
                <LucidePause size={24} strokeWidth={3} />
              </button>
              <button 
                onClick={handleEndSession}
                className="flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-red-100 transition-all active:scale-95"
              >
                <LucideSquare size={18} fill="currentColor" />
                Terminate Session
              </button>
            </>
          ) : status === "COMPLETED" ? (
            <div className="px-10 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest">
               Session Archives Locked
            </div>
          ) : (
            <button 
              onClick={handleStartSession}
              className="flex items-center gap-3 px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100 transition-all active:scale-95"
            >
              <LucidePlay size={18} fill="currentColor" className="animate-pulse" />
              Initiate Live Sync
            </button>
          )}
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-card p-8 bg-white/40 border-white/60 shadow-xl overflow-hidden relative group">
           <div className="absolute -right-6 -bottom-6 opacity-5 text-indigo-600 group-hover:scale-125 transition-transform duration-700">
              <LucideUsers size={120} />
           </div>
           <div className="relative z-10 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Synched Endpoints</p>
              <div className="flex items-end justify-between">
                 <span className="text-5xl font-black text-slate-800 tracking-tighter">{participants.length}</span>
                 <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black">ACTIVE</div>
              </div>
           </div>
        </div>

        <div className="glass-card p-8 bg-white/40 border-white/60 shadow-xl overflow-hidden relative group">
           <div className="absolute -right-6 -bottom-6 opacity-5 text-violet-600 group-hover:scale-125 transition-transform duration-700">
              <LucideZap size={120} />
           </div>
           <div className="relative z-10 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Interaction Index</p>
              <div className="flex items-end justify-between">
                 <span className="text-5xl font-black text-slate-800 tracking-tighter">
                   {participants.length ? Math.round((responses.length / participants.length) * 100) : 0}%
                 </span>
                 <div className="w-24 h-2 bg-slate-100/50 rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-1000" 
                      style={{ width: `${participants.length ? (responses.length / participants.length) * 100 : 0}%` }}
                    />
                 </div>
              </div>
           </div>
        </div>

        <div className="glass-card p-8 bg-white/40 border-white/60 shadow-xl overflow-hidden relative group">
           <div className="absolute -right-6 -bottom-6 opacity-5 text-amber-600 group-hover:scale-125 transition-transform duration-700">
              <LucideTimer size={120} />
           </div>
           <div className="relative z-10 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Chrono Guard</p>
              <div className="flex items-end justify-between">
                 <span className="text-5xl font-black text-slate-800 tracking-tighter font-mono">
                   {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
                 </span>
                 <div className={`w-3 h-3 rounded-full ${status === 'LIVE' ? 'bg-amber-500 animate-ping' : 'bg-slate-300'}`} />
              </div>
           </div>
        </div>
      </div>

      {/* Main Analysis Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Participation Log: The left side is for the 'Who' */}
        <div className="glass-card bg-white/40 border-white/60 shadow-2xl flex flex-col overflow-hidden">
           <div className="p-6 border-b border-white/60 flex items-center justify-between bg-white/20">
              <div className="flex items-center gap-3">
                 <LucideLayers className="text-indigo-600" size={20} />
                 <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Protocol Connectivity Log</h2>
              </div>
              <div className="px-3 py-1 bg-slate-100/50 rounded-full text-[9px] font-black text-slate-400 tracking-widest uppercase">
                 REFRESH: AUTO
              </div>
           </div>
           <div className="flex-1 overflow-y-auto max-h-[500px] p-6 space-y-3 scrollbar-hide">
              {participants.length === 0 ? (
                <div className="py-20 text-center space-y-4 opacity-50">
                   <LucideUsers size={40} strokeWidth={1} className="mx-auto text-slate-400" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Waiting for student handshake...</p>
                </div>
              ) : (
                participants.map((p) => {
                  const hasResponded = responses.some((r) => r.participantId === p.id);
                  return (
                    <div key={p.id} className="p-5 glass-card bg-white/60 border-white/80 hover:bg-white transition-all flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${hasResponded ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                             {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="space-y-0.5">
                             <div className="text-sm font-black text-slate-800 uppercase tracking-tight">{p.name}</div>
                             <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">ID: {p.id.slice(4, 10)}</div>
                          </div>
                       </div>
                       <div className="flex flex-col items-end gap-1">
                          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${hasResponded ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-amber-100 text-amber-600'}`}>
                             {hasResponded ? 'CONFIRMED' : 'SYNCING'}
                          </div>
                          <div className="text-[8px] font-black text-slate-200 tracking-tighter">EST: 0.2ms</div>
                       </div>
                    </div>
                  );
                })
              )}
           </div>
        </div>

        {/* Result Visualizer: The right side is for the 'What' */}
        <div className="glass-card bg-white/40 border-white/60 shadow-2xl flex flex-col overflow-hidden">
           <div className="p-6 border-b border-white/60 flex items-center justify-between bg-white/20">
              <div className="flex items-center gap-3">
                 <LucideBarChart3 className="text-violet-600" size={20} />
                 <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Data Analytic Stream</h2>
              </div>
              <div className="px-3 py-1 bg-violet-50 text-violet-600 rounded-lg text-[9px] font-black tracking-widest uppercase">
                 TYPE: {templateData?.type || 'PENDING'}
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto max-h-[500px] p-8">
              {responses.length === 0 ? (
                <div className="py-24 text-center space-y-6 opacity-30">
                   <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <LucideSend size={32} />
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Awaiting inbound interaction packets...</p>
                </div>
              ) : (
                <div className="space-y-8 animate-slide-up">
                   {templateData?.type === 'QUIZ' && (
                     <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Competency Leaderboard</h3>
                           <LucideTrophy size={16} className="text-amber-500" />
                        </div>
                        <div className="space-y-3">
                          {participants.sort((a, b) => {
                             const aPts = responses.filter(r => r.participantId === a.id).length;
                             const bPts = responses.filter(r => r.participantId === b.id).length;
                             return bPts - aPts;
                          }).map((p, i) => (
                            <div key={p.id} className={`p-5 glass-card flex justify-between items-center ${i === 0 ? 'bg-indigo-600 text-white border-transparent shadow-indigo-200' : 'bg-white border-white'}`}>
                              <span className="font-black text-xs uppercase tracking-tight">#{i + 1} {p.name}</span>
                              <span className={`font-black text-sm uppercase tracking-widest ${i === 0 ? 'text-white' : 'text-indigo-600'}`}>
                                {responses.filter((r) => r.participantId === p.id).length * 10} ACCRUAL
                              </span>
                            </div>
                          ))}
                        </div>
                     </div>
                   )}

                   {templateData?.type === 'POLL' && (
                     <div className="space-y-8">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-100 pb-4">Consensus Distribution</h3>
                        {templateData.options?.map((opt: any, i: number) => {
                          const votes = responses.filter((r) => (r.data as any)?.selectedOption === opt.id).length;
                          const percentage = responses.length ? Math.round((votes / responses.length) * 100) : 0;
                          return (
                            <div key={i} className="space-y-3">
                              <div className="flex justify-between items-end">
                                <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{opt.text}</span>
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{percentage}% ({votes} SIG)</span>
                              </div>
                              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden p-1">
                                <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${percentage}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                     </div>
                   )}

                   {templateData?.type === 'FEEDBACK' && (
                     <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-100 pb-4">Qualitative Data Wall</h3>
                        <div className="grid grid-cols-1 gap-4">
                          {responses.map((r, i) => (
                            <div key={i} className="p-6 glass-card bg-white border-indigo-50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                               <LucideMessageCircle size={40} className="absolute -right-4 -bottom-4 text-indigo-500/5 group-hover:scale-150 transition-transform" />
                               <p className="italic text-slate-700 font-bold text-sm mb-4 leading-relaxed">&ldquo;{(r.data as any)?.feedback || 'NO CONTENT'}&rdquo;</p>
                               <div className="flex justify-between items-center">
                                  <div className="flex gap-1">
                                    {Array.from({length: (r.data as any)?.rating || 0}).map((_, idx) => (
                                      <div key={idx} className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                                    ))}
                                  </div>
                                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Anonymous Contributor</span>
                               </div>
                            </div>
                          ))}
                        </div>
                     </div>
                   )}
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Control Station (Footer Stick) */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 glass-card bg-white/60 p-2 shadow-2xl border-white/60">
         <div className="flex items-center gap-2 p-1 bg-slate-100/50 rounded-2xl">
            <button 
              onClick={handlePickRandomName}
              className="px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-white hover:text-indigo-600 transition-all flex items-center gap-3 active:scale-95"
            >
               <LucideDices size={16} />
               Endpoint Oracle
            </button>
            <div className="w-[1px] h-8 bg-slate-200" />
            <button 
              onClick={() => setShowGroups(!showGroups)}
              className="px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-white hover:text-indigo-600 transition-all flex items-center gap-3 active:scale-95"
            >
               <LucideUserPlus size={16} />
               Group Synthesis
            </button>
         </div>
      </div>

      {/* Utility Modals */}
      {showGroups && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-fade-in">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowGroups(false)} />
           <div className="relative glass-card bg-white p-10 max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border-white animate-slide-up">
              <button 
                onClick={() => setShowGroups(false)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-all"
              >
                 <LucideX size={20} className="text-slate-400" />
              </button>
              
              <div className="space-y-10">
                 <div className="flex flex-col items-center text-center space-y-2">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Conceptual Nexus</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Collaborative Workspace Allocation</p>
                 </div>

                 <div className="space-y-6">
                    <div className="p-8 bg-slate-50 rounded-3xl space-y-4">
                       <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          <span>Endpoint Density</span>
                          <span>{groupSize} PERS/GROUP</span>
                       </div>
                       <input
                         type="range"
                         min="2" max="6"
                         value={groupSize}
                         onChange={(e) => setGroupSize(parseInt(e.target.value))}
                         className="w-full h-2 bg-white rounded-full appearance-none cursor-pointer accent-indigo-600"
                       />
                       <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest italic pt-2">
                          Projected Yield: ~{participants.length ? Math.ceil(participants.length / groupSize) : 0} WORK UNITS
                       </p>
                    </div>
                    
                    <button
                      onClick={handleGenerateGroups}
                      disabled={participants.length < 2}
                      className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all disabled:opacity-30"
                    >
                      Provision Assigned Workspace
                    </button>
                 </div>

                 {groups.length > 0 && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {groups.map(group => (
                        <div key={group.id} className="p-6 glass-card bg-slate-50 border-slate-100">
                           <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4 border-b border-indigo-100 pb-2">{group.name}</h4>
                           <div className="space-y-2">
                              {group.members.map(member => (
                                <div key={member.id} className="flex items-center gap-3">
                                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                   <span className="text-xs font-bold text-slate-700">{member.name.toUpperCase()}</span>
                                </div>
                              ))}
                           </div>
                        </div>
                      ))}
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Random Picker Toast Overlay */}
      {pickedName && !isPicking && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-20 duration-500">
           <div className="glass-card bg-indigo-600 text-white px-10 py-6 shadow-2xl flex items-center gap-6 border-transparent">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                 <LucideZap size={24} />
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">Selected Delegate</p>
                 <h3 className="text-2xl font-black uppercase tracking-tight">{pickedName}</h3>
              </div>
              <button onClick={() => setPickedName(null)} className="ml-4 p-2 hover:bg-white/10 rounded-full transition-all">
                 <LucideX size={16} />
              </button>
           </div>
        </div>
      )}

      {isPicking && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100]">
           <div className="glass-card bg-slate-900 text-white px-10 py-6 border-white/10 shadow-2xl flex items-center gap-6">
              <div className="w-10 h-10 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">ORACLE DECIPHERING</p>
                 <h3 className="text-2xl font-black uppercase tracking-tight text-indigo-400">{pickedName || 'SEARCHING...'}</h3>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
