"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, SessionStatusIndicator, GroupDisplay, Button } from "@classroom/ui-components";
import { LucidePlay, LucidePause, LucideSquare, LucideUsers, LucideTimer, LucideBarChart3, LucideDices, LucideUserPlus, LucideX } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useSocket } from "../../../../hooks/useSocket";

export default function SessionManager() {
  const { id } = useParams();
  const router = useRouter();
  const [sessionData, setSessionData] = useState<any>(null);
  const [templateData, setTemplateData] = useState<any>(null);
  
  const [status, setStatus] = useState<"LIVE" | "COMPLETED" | "SCHEDULED">("SCHEDULED");
  const [responses, setResponses] = useState<any[]>([]);
  const [timer, setTimer] = useState(60);
  const [participants, setParticipants] = useState<any[]>([]);

  // Random Name Picker State
  const [pickedName, setPickedName] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);

  // Group Matchmaker State
  const [groups, setGroups] = useState<any[]>([]);
  const [groupSize, setGroupSize] = useState<number>(3);
  const [showGroups, setShowGroups] = useState(false);

  const { socket, isConnected, emitEvent } = useSocket(id as string, 'TEACHER');

  useEffect(() => {
    // Load session and template configuration
    const sessions = JSON.parse(localStorage.getItem('classroom_sessions') || '[]');
    const currentSession = sessions.find((s: any) => s.id === id);
    if (!currentSession) {
      router.push('/');
      return;
    }
    
    const templates = JSON.parse(localStorage.getItem('classroom_templates') || '[]');
    const currentTemplate = templates.find((t: any) => t.id === currentSession.templateId);
    
    setSessionData(currentSession);
    setTemplateData(currentTemplate);
    setStatus(currentSession.status || "SCHEDULED");
  }, [id, router]);

  // Handle Prototype BroadcastChannel Events since no real backend exists
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const bc = new BroadcastChannel(`classroom-session-${id}`);
    
    bc.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'student-joined') {
        setParticipants(p => {
          const exists = p.find(existing => existing.id === payload.id);
          if (exists) return p;
          return [...p, payload];
        });
      } else if (type === 'student-responded') {
        setResponses(r => [...r, payload]);
      }
    };
    
    return () => bc.close();
  }, [id]);

  const handleStartSession = () => {
    setStatus("LIVE");
    // Emit to clients that the session started
    emitEvent('session-started', { 
      templateData,
      status: "LIVE"
    });
    
    // Update local storage so if a student joins late, they know it's LIVE
    const sessions = JSON.parse(localStorage.getItem('classroom_sessions') || '[]');
    const sIdx = sessions.findIndex((s: any) => s.id === id);
    if (sIdx > -1) {
      sessions[sIdx].status = "LIVE";
      localStorage.setItem('classroom_sessions', JSON.stringify(sessions));
    }
  };

  useEffect(() => {
    if (status === "LIVE" && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [status, timer]);

  const handlePickRandomName = () => {
    if (participants.length === 0) return;
    setIsPicking(true);
    setPickedName(null);
    
    // Animation effect
    let count = 0;
    const maxCount = 20;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * participants.length);
      setPickedName(participants[randomIndex].name);
      count++;
      if (count >= maxCount) {
        clearInterval(interval);
        setIsPicking(false);
        // Final pick
        const finalIndex = Math.floor(Math.random() * participants.length);
        const finalStudent = participants[finalIndex];
        setPickedName(finalStudent.name);
        // Optionally emit to students
        emitEvent('random-student-picked', { studentId: finalStudent.id, name: finalStudent.name });
      }
    }, 100);
  };

  const handleGenerateGroups = () => {
    if (participants.length === 0) return;
    
    // Shuffle participants
    const shuffled = [...participants].sort(() => 0.5 - Math.random());
    const newGroups = [];
    const numGroups = Math.ceil(shuffled.length / groupSize);
    
    for (let i = 0; i < numGroups; i++) {
      const members = shuffled.slice(i * groupSize, (i + 1) * groupSize).map(p => ({
        id: p.id,
        name: p.name,
        isPresent: true
      }));
      
      newGroups.push({
        id: `group-${i + 1}`,
        name: `Group ${i + 1}`,
        members
      });
    }
    
    setGroups(newGroups);
    setShowGroups(true);
    
    // Notify students
    emitEvent('groups-formed', { groups: newGroups });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 truncate max-w-md">
            {sessionData?.title || templateData?.title || 'Active Session'}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
            <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 italic">
              Code: {sessionData?.code || 'Loading...'}
            </span>
            <SessionStatusIndicator status={status} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {status === "LIVE" ? (
            <>
              <button onClick={() => setStatus("SCHEDULED")} className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <LucidePause size={20} />
              </button>
              <button onClick={() => setStatus("COMPLETED")} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors">
                <LucideSquare size={18} fill="currentColor" />
                End Session
              </button>
            </>
          ) : (
            <button onClick={handleStartSession} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors">
              <LucidePlay size={18} fill="currentColor" />
              Start Session
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Participants</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <span className="text-3xl font-bold">{participants.length}</span>
            <LucideUsers className="text-blue-500 mb-1" size={24} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Average Progress</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <span className="text-3xl font-bold">
              {participants.length ? Math.round((responses.length / participants.length) * 100) : 0}%
            </span>
            <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-blue-500" style={{ width: `${participants.length ? (responses.length / participants.length) * 100 : 0}%` }}></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Time Remaining</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <span className="text-3xl font-bold font-mono">
              {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
            </span>
            <LucideTimer className="text-amber-500 mb-1" size={24} />
          </CardContent>
        </Card>
      </div>

      {/* Utilities Section: Matchmaker & Random Name Picker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LucideDices size={20} className="text-indigo-600" />
              Random Name Picker
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center min-h-[200px] text-center space-y-4">
            <div className="min-h-[80px] flex items-center justify-center w-full">
              {pickedName ? (
                <div className={`text-3xl font-bold transition-all ${isPicking ? 'text-slate-400 scale-100' : 'text-indigo-600 scale-110'}`}>
                  {pickedName}
                </div>
              ) : (
                <div className="text-slate-400 italic">No one picked yet</div>
              )}
            </div>
            <Button 
              onClick={handlePickRandomName} 
              disabled={isPicking || participants.length === 0}
              className="w-full max-w-[200px]"
            >
              <LucideDices size={18} className="mr-2" />
              Pick Random Student
            </Button>
            {participants.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">Waiting for participants to join...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LucideUserPlus size={20} className="text-blue-600" />
              Group Matchmaker
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center min-h-[200px] space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">Participants per group</label>
              <input 
                type="range" 
                min="2" max="6" 
                value={groupSize} 
                onChange={(e) => setGroupSize(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 font-medium px-1">
                <span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 text-center">
              Target: <span className="font-bold text-slate-900">{groupSize} members</span> per group
              <br/>
              <span className="text-xs">
                (Will create ~{participants.length ? Math.ceil(participants.length / groupSize) : 0} groups)
              </span>
            </p>
            <Button 
              onClick={handleGenerateGroups}
              disabled={participants.length < 2}
              className="w-full"
            >
              <LucideUsers size={18} className="mr-2" />
              Auto-Generate Groups
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Generated Groups Display */}
      {showGroups && groups.length > 0 && (
        <div className="relative border-2 border-blue-100 rounded-xl p-6 bg-white shadow-sm">
          <Button 
            variant="outline" 
            size="sm" 
            className="absolute top-4 right-4"
            onClick={() => setShowGroups(false)}
          >
            <LucideX size={16} className="mr-1" /> Hide Groups
          </Button>
          <GroupDisplay 
            groups={groups} 
            title="Assigned Groups"
            showShuffle={true}
            onShuffle={handleGenerateGroups}
          />
        </div>
      )}

      {/* Logs and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="min-h-[400px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LucideBarChart3 size={20} className="text-emerald-600" />
              Live Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {responses.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20 grayscale opacity-50">
                <LucideBarChart3 size={48} className="mb-4" />
                <p>Waiting for incoming data...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-slate-600">Successfully received {responses.length} responses.</p>
                <div className="p-4 bg-slate-50 rounded-lg max-h-64 overflow-y-auto font-mono text-sm border border-slate-200">
                  <pre>{JSON.stringify(responses, null, 2)}</pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-h-[400px]">
          <CardHeader>
            <CardTitle>Participation Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {participants.length === 0 && (
                <div className="text-slate-500 italic py-4 text-center">No participants joined yet. Share the code {sessionData?.code}</div>
              )}
              {participants.map((p, idx) => {
                const hasResponded = responses.some(r => r.participantId === p.id);
                return (
                  <div key={p.id} className="flex items-center justify-between text-sm py-3 border-b border-slate-100">
                    <span className="font-semibold text-slate-700">{p.name} <span className="text-slate-400 text-xs ml-2">#{p.id.slice(0, 4)}</span></span>
                    <span className={`font-medium ${hasResponded ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {hasResponded ? 'Submitted' : 'Working'}
                    </span>
                    <span className="text-slate-400 text-xs text-right">Online</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
