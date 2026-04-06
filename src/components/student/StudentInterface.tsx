'use client';

import type { SessionStatus } from '@classroom/shared-utils';

import { useState } from 'react';
import { 
  LogIn, 
  Users, 
  Clock, 
  Wifi,
  BookOpen,
  Activity,
  AlertCircle
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Timer
} from '@classroom/ui-components';

interface SessionJoinProps {
  onJoinSession?: (sessionCode: string, studentName: string) => void | Promise<void>;
}

interface JoinedSessionProps {
  sessionInfo: {
    code: string;
    title: string;
    teacher: string;
    participantCount: number;
    status: SessionStatus;
  };
  currentActivity?: {
    id: string;
    type: string;
    title: string;
    timeRemaining?: number;
  };
  onLeaveSession?: () => void;
}

export function SessionJoin({ onJoinSession }: SessionJoinProps) {
  const [sessionCode, setSessionCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionCode.trim() || !studentName.trim()) {
      setError('Credentials incomplete');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      if (onJoinSession) {
        await onJoinSession(sessionCode.toUpperCase(), studentName.trim());
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Access denied. Check session code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-10 min-h-[85vh] animate-fade-in relative">
      {/* Background Blobs (for internal page context) */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-indigo-500/5 blur-[100px] -z-10 animate-pulse-soft" />

      <div className="text-center space-y-6">
        <div className="w-20 h-20 glass-card flex items-center justify-center mx-auto shadow-xl border-indigo-100/50 hover:scale-110 transition-transform">
          <BookOpen className="w-10 h-10 text-indigo-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
            Classroom <span className="text-gradient">Portal</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Academic Participation System</p>
        </div>
      </div>

      <div className="w-full max-w-md glass-card p-8 bg-white/40 backdrop-blur-3xl border-white/60 shadow-2xl">
        <form onSubmit={handleJoin} className="space-y-8">
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Session Protocol</label>
            <input
              type="text"
              placeholder="000000"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              className="w-full bg-white/60 border border-indigo-100/50 rounded-2xl p-5 text-center text-3xl font-black font-mono tracking-[0.3em] text-indigo-600 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all outline-none"
              maxLength={6}
            />
          </div>
          
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Student Identifier</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full bg-white/60 border border-indigo-100/50 rounded-2xl p-5 text-lg font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all outline-none"
            />
          </div>
          
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 animate-slide-up">
              <AlertCircle size={18} />
              <span className="text-xs font-bold uppercase tracking-tight">{error}</span>
            </div>
          )}
          
          <button 
            type="submit" 
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100" 
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Synchronizing...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <LogIn size={20} />
                <span>Join Session</span>
              </div>
            )}
          </button>
        </form>
      </div>
      
      <div className="space-y-6 pt-6">
        <div className="flex items-center justify-center gap-4 px-6 py-3 glass-card bg-white/40 border-emerald-100/50">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Network Status: Online</span>
        </div>
      </div>
    </div>
  );
}

export function JoinedSession({ sessionInfo, currentActivity, onLeaveSession }: JoinedSessionProps) {
  return (
    <div className="flex flex-col h-full animate-fade-in space-y-6 max-w-lg mx-auto w-full">
      <div className="p-8 glass-card bg-white/50 border-indigo-100/50 shadow-2xl relative overflow-hidden group">
        <div className="absolute -right-6 -bottom-6 text-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity">
           <Users size={120} />
        </div>
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none uppercase">{sessionInfo.title}</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{sessionInfo.teacher}</p>
          </div>
          <div className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-mono font-black text-lg shadow-2xl shadow-indigo-200 group-hover:scale-110 transition-transform">
            {sessionInfo.code}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest ${
              sessionInfo.status === 'LIVE' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100 animate-pulse' : 'bg-slate-100 text-slate-500'
            }`}>
              {sessionInfo.status === 'LIVE' ? <Activity size={14} /> : <Clock size={14} />}
              {sessionInfo.status}
            </div>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 {sessionInfo.participantCount} PEERS
               </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-2">
        {currentActivity ? (
          <ActiveActivityView activity={currentActivity} />
        ) : (
          <WaitingView sessionStatus={sessionInfo.status} />
        )}
      </div>

      <div className="pt-8 pb-4">
        <button 
          className="w-full py-5 text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-[0.3em] transition-all hover:bg-red-50 rounded-2xl" 
          onClick={onLeaveSession}
        >
          DISCONNECT FROM SESSION
        </button>
      </div>
    </div>
  );
}

function ActiveActivityView({ activity }: { activity: { id: string; type: string; title: string; timeRemaining?: number } }) {
  return (
    <div className="space-y-8 animate-slide-up w-full pt-10">
      <div className="glass-card p-10 bg-indigo-600 text-white relative overflow-hidden text-center shadow-2xl shadow-indigo-200">
        <div className="absolute top-0 left-0 w-full h-1 bg-white/20 overflow-hidden">
          <div className="w-full h-full bg-white animate-slide-right" style={{ '--slide-duration': '2s' } as any} />
        </div>
        <span className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black tracking-widest uppercase mb-6 backdrop-blur-md">
          {activity.type} INTERACTION
        </span>
        <h3 className="text-4xl font-black tracking-tight leading-tight uppercase mb-8">{activity.title}</h3>
        {activity.timeRemaining && (
          <div className="mt-4 inline-flex items-center gap-4 px-8 py-4 bg-white text-indigo-600 rounded-3xl font-black text-2xl shadow-2xl shadow-indigo-900/30">
             <Clock size={24} />
             <Timer duration={activity.timeRemaining} autoStart className="font-mono tabular-nums" />
          </div>
        )}
      </div>

      <div className="glass-card p-10 bg-white/60 text-center border-indigo-50/50">
        <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-100/50">
          <Activity className="w-10 h-10 text-indigo-600" />
        </div>
        <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-4">Engage Protocol Active</h4>
        <p className="text-slate-500 font-bold text-sm leading-relaxed max-w-xs mx-auto">
          Please focus on the activity interface provided by your teacher. Your responses are synced in real-time.
        </p>
      </div>
    </div>
  );
}

function WaitingView({ sessionStatus }: { sessionStatus: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-12 py-20 animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl animate-pulse-soft" />
        <div className="w-40 h-40 glass-card bg-white/40 flex items-center justify-center relative z-10 border-white/60 shadow-2xl">
          {sessionStatus === 'PAUSED' ? (
            <div className="relative">
              <Clock className="w-16 h-16 text-indigo-600" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full border-4 border-white animate-pulse" />
            </div>
          ) : (
            <div className="relative">
              <Users className="w-16 h-16 text-indigo-600" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white animate-pulse" />
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-4xl font-black text-slate-800 tracking-tight uppercase leading-none">
          {sessionStatus === 'PAUSED' ? 'Interval Period' : 'Ready for Stream'}
        </h3>
        <p className="text-slate-400 font-black uppercase tracking-[0.25em] text-[10px] max-w-xs mx-auto leading-relaxed">
          {sessionStatus === 'PAUSED' 
            ? 'The academic session is temporarily suspended by host' 
            : 'Maintain connection integrity. Activity sequence will commence shortly'}
        </p>
      </div>
      
      <div className="flex gap-4">
        {[0, 1, 2].map((i) => (
          <div 
            key={i}
            className="w-3 h-3 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]"
            style={{ 
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              animationDelay: `${i * 0.25}s` 
            }}
          />
        ))}
      </div>
      
      <div className="w-full max-w-xs glass-card p-5 bg-slate-50/50 border-white/40">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lobby Status</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">CONNECTED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
