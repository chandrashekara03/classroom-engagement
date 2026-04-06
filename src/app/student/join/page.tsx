'use client';

import { useState, useEffect } from 'react';
import { SessionJoin, JoinedSession } from '@/components/student/StudentInterface';
import ActivityParticipation, { type ActivityParticipationResponse } from '@/components/student/ActivityParticipation';
import type { Activity, SessionStatus } from '@classroom/shared-utils';
import { useSocket } from '@/hooks/useSocket';
import { dbService, Session, SessionResponse } from '@/lib/database';
import { WifiOff, Layers } from 'lucide-react';

interface StoredSession {
  id: string;
  code: string;
  joinPassword?: string;
  templateId: string;
  title: string;
  status: string;
  createdAt: string;
}

interface SessionState {
  isJoined: boolean;
  sessionId?: string;
  studentId?: string;
  studentName?: string;
  sessionInfo?: {
    code: string;
    title: string;
    teacher: string;
    participantCount: number;
    status: SessionStatus;
  };
  currentActivity?: Activity;
  submittedResponses: Set<string>;
}

export default function StudentPage() {
  const [sessionState, setSessionState] = useState<SessionState>({
    isJoined: false,
    submittedResponses: new Set()
  });
  const [isOnline, setIsOnline] = useState(true);

  // For testing/prototype, generate a student ID if not present
  useEffect(() => {
    if (sessionState.isJoined && !sessionState.studentId) {
      setSessionState(prev => ({ ...prev, studentId: `std-${Date.now()}` }));
    }
  }, [sessionState.isJoined, sessionState.studentId]);

  const resolveSessionByCode = async (sessionCode: string): Promise<StoredSession | null> => {
    const firebaseSession = await dbService.getSessionByCode(sessionCode);
    if (firebaseSession) {
      return {
        id: firebaseSession.id,
        code: firebaseSession.code,
        joinPassword: firebaseSession.joinPassword,
        templateId: firebaseSession.templateId || 'firebase-template',
        title: firebaseSession.title,
        status: firebaseSession.status,
        createdAt: firebaseSession.createdAt,
      };
    }
    return null;
  };

  useEffect(() => {
    if (!sessionState.sessionId) return;

    const unsubscribe = dbService.onSessionUpdate(sessionState.sessionId, (session: Session) => {
      setSessionState((prev) => {
        // Check for activity trigger (Status change or template update)
        // In a real app, the teacher would push an "activeActivity" to the session
        // For this prototype, we'll simulate logic where if status is LIVE, we fetch the template
        
        let newActivity: Activity | undefined = prev.currentActivity;
        
        return {
          ...prev,
          sessionInfo: prev.sessionInfo
            ? { 
                ...prev.sessionInfo, 
                status: session.status, 
                participantCount: Object.keys(session.participants || {}).length 
              }
            : undefined,
          currentActivity: newActivity
        };
      });
    });

    return unsubscribe;
  }, [sessionState.sessionId]);

  const handleJoinSession = async (sessionCode: string, sessionPassword: string, studentName: string) => {
    let session = await resolveSessionByCode(sessionCode);

    if (!session) {
      throw new Error('Invalid session code or session not found.');
    }

    const expectedPassword = String(session.joinPassword || '000000').trim();
    if (sessionPassword.trim() !== expectedPassword) {
      throw new Error('Incorrect session password.');
    }

    const studentId = `std-${Date.now()}`;
    
    // Register participant in Firebase
    await dbService.addParticipantToSession(session.id, {
      uid: studentId,
      displayName: studentName,
      email: `${studentId}@mock.com`,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    });

    setSessionState({
      isJoined: true,
      sessionId: session.id,
      studentId,
      studentName,
      sessionInfo: {
        code: sessionCode.toUpperCase(),
        title: session.title || 'Live Classroom Session',
        teacher: 'Instructor',
        participantCount: 1, // Will be updated by listener
        status: session.status as SessionStatus,
      },
      submittedResponses: new Set(),
    });
  };

  const handleLeaveSession = async () => {
    if (sessionState.sessionId && sessionState.studentId) {
      try {
        await dbService.removeParticipantFromSession(sessionState.sessionId, sessionState.studentId);
      } catch (e) {
        console.warn('Could not remove participant on leave:', e);
      }
    }
    setSessionState({ isJoined: false, submittedResponses: new Set() });
  };

  const handleSubmitResponse = async (response: ActivityParticipationResponse) => {
    if (!sessionState.currentActivity || !sessionState.sessionId || !sessionState.studentId) return;

    const currentId = sessionState.currentActivity.id;

    const responseData: Omit<SessionResponse, 'id'> = {
      participantId: sessionState.studentId,
      activityId: currentId,
      data: response,
      timestamp: Date.now(),
    };

    try {
      await dbService.addResponse(sessionState.sessionId, responseData);
    } catch (e) {
      console.error('Failed to submit response:', e);
    }

    setSessionState((prev) => ({
      ...prev,
      submittedResponses: new Set([...prev.submittedResponses, currentId]),
      currentActivity: undefined,
    }));
  };

  const isCurrentActivitySubmitted = sessionState.currentActivity
    ? sessionState.submittedResponses.has(sessionState.currentActivity.id)
    : false;

  if (!sessionState.isJoined) {
    return (
      <div className="relative min-h-screen bg-slate-50 overflow-hidden font-sans flex items-center justify-center">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-[120px] animate-[pulse_8s_infinite_alternate]" />
          <div className="absolute bottom-[20%] right-[-5%] w-[35%] h-[35%] bg-violet-200/20 rounded-full blur-[100px] animate-[pulse_12s_infinite_alternate-reverse]" />
          <div className="absolute top-[30%] right-[10%] w-[20%] h-[20%] bg-blue-100/40 rounded-full blur-[80px]" />
        </div>
        <SessionJoin onJoinSession={handleJoinSession} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-[120px] animate-[pulse_8s_infinite_alternate]" />
        <div className="absolute bottom-[20%] right-[-5%] w-[35%] h-[35%] bg-violet-200/20 rounded-full blur-[100px] animate-[pulse_12s_infinite_alternate-reverse]" />
        <div className="absolute top-[30%] right-[10%] w-[20%] h-[20%] bg-blue-100/40 rounded-full blur-[80px]" />
      </div>

      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 z-50 animate-slide-down">
          <WifiOff size={16} />
          <span>Synchronous Connection Interrupted — Retrying</span>
        </div>
      )}

      <main className="h-full relative z-0">
        <div className="h-screen flex flex-col pt-6 px-4 pb-4">
          {sessionState.currentActivity ? (
            <div className="flex-1 glass-card overflow-y-auto bg-white/40 border-white/60 shadow-2xl relative">
              <div className="sticky top-0 z-10 px-6 py-4 border-b border-white/60 bg-white/20 backdrop-blur-3xl flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">LIVE SESSION ACTIVE</span>
                 </div>
                 <button 
                   onClick={handleLeaveSession}
                   className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors"
                 >
                   Terminate
                 </button>
              </div>
              <div className="p-6">
                <ActivityParticipation
                  activity={sessionState.currentActivity}
                  onSubmitResponse={handleSubmitResponse}
                  timeRemaining={sessionState.currentActivity.config?.duration
                    ? (sessionState.currentActivity.config.duration as number) * 1000
                    : undefined}
                  isSubmitted={isCurrentActivitySubmitted}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <JoinedSession
                sessionInfo={sessionState.sessionInfo!}
                onLeaveSession={handleLeaveSession}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
