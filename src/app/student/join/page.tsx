'use client';

import { useState, useEffect } from 'react';
import { SessionJoin, JoinedSession } from '@/components/student/StudentInterface';
import ActivityParticipation, { type ActivityParticipationResponse } from '@/components/student/ActivityParticipation';
import type { Activity, SessionStatus } from '@classroom/shared-utils';
import { dbService, Session, SessionResponse } from '@/lib/database';

import { WifiOff } from 'lucide-react';

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

  // Listen for session status changes and activity pushes in real-time
  useEffect(() => {
    if (!sessionState.sessionId) return;

    const unsubscribe = dbService.onSessionUpdate(sessionState.sessionId, (session: Session) => {
      setSessionState((prev) => ({
        ...prev,
        sessionInfo: prev.sessionInfo
          ? { ...prev.sessionInfo, status: session.status, participantCount: Object.keys(session.participants || {}).length }
          : undefined,
      }));
    });

    return unsubscribe;
  }, [sessionState.sessionId]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleJoinSession = async (sessionCode: string, studentName: string) => {
    const studentId = `stu-${Math.random().toString(36).substr(2, 8)}`;

    // Join via Firebase RTDB — looks up session by code, adds participant
    const session = await dbService.joinSession(sessionCode, { id: studentId, name: studentName });

    if (!session) {
      throw new Error('Invalid session code or session not found.');
    }

    setSessionState({
      isJoined: true,
      sessionId: session.id,
      studentId,
      studentName,
      sessionInfo: {
        code: sessionCode.toUpperCase(),
        title: session.title || 'Live Classroom Session',
        teacher: 'Instructor',
        participantCount: Object.keys(session.participants || {}).length + 1,
        status: session.status,
      },
      currentActivity: undefined,
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
      sessionInfo: prev.sessionInfo
        ? { ...prev.sessionInfo, status: 'SCHEDULED' }
        : undefined,
    }));
  };

  const isCurrentActivitySubmitted = sessionState.currentActivity
    ? sessionState.submittedResponses.has(sessionState.currentActivity.id)
    : false;

  if (!sessionState.isJoined) {
    return <SessionJoin onJoinSession={handleJoinSession} />;
  }

  return (
    <div className="relative h-full">
      {!isOnline && (
        <div className="absolute top-0 left-0 right-0 bg-rose-500 text-white px-4 py-2 text-sm flex items-center justify-center gap-2 z-50">
          <WifiOff size={16} />
          <span className="font-medium">You are offline. Trying to reconnect...</span>
        </div>
      )}

      {sessionState.currentActivity ? (
        <div className="h-full overflow-y-auto pt-10">
          <ActivityParticipation
            activity={sessionState.currentActivity}
            onSubmitResponse={handleSubmitResponse}
            timeRemaining={sessionState.currentActivity.config?.duration
              ? sessionState.currentActivity.config.duration * 1000
              : undefined}
            isSubmitted={isCurrentActivitySubmitted}
          />
        </div>
      ) : (
        <div className="pt-10 h-full">
          <JoinedSession
            sessionInfo={sessionState.sessionInfo!}
            onLeaveSession={handleLeaveSession}
          />
        </div>
      )}
    </div>
  );
}
