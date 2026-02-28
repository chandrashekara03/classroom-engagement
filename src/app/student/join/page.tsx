'use client';

import { useState, useEffect } from 'react';
import { SessionJoin, JoinedSession } from '@/components/student/StudentInterface';
import ActivityParticipation, { type ActivityParticipationResponse } from '@/components/student/ActivityParticipation';
import type { Activity, SessionStatus } from '@classroom/shared-utils';
import { useSocket } from '@/hooks/useSocket';

interface StoredSession {
  id: string;
  code: string;
  templateId: string;
  title: string;
  status: string;
  createdAt: string;
}

interface SessionState {
  isJoined: boolean;
  sessionId?: string;
  studentId?: string;
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

import { WifiOff } from 'lucide-react';

export default function StudentPage() {
  const [sessionState, setSessionState] = useState<SessionState>({
    isJoined: false,
    submittedResponses: new Set()
  });

  const { isConnected } = useSocket(sessionState.sessionId, 'STUDENT');

  useEffect(() => {
    if (!sessionState.sessionId || typeof window === 'undefined') return;
    
    // Fallback broadcast channel listener for current session state updates
    const bc = new BroadcastChannel(`classroom-session-${sessionState.sessionId}`);
    
    bc.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'session-started') {
        const templateData = payload.templateData;
        
        // Transform template into activity format
        const activityMap: Record<string, Activity> = {
          'QUIZ': {
            id: templateData.id,
            type: 'QUIZ',
            title: templateData.title,
            description: '',
            createdBy: 'system',
            createdAt: new Date(),
            updatedAt: new Date(),
            isTemplate: false,
            questions: templateData.questions || [],
            config: {
              duration: templateData.config?.timer ? 300 : undefined,
              scoringEnabled: true,
              revealMechanism: 'AUTOMATIC',
              randomizeContent: false,
              allowLateJoining: true,
              showLeaderboard: true,
              anonymousParticipation: false,
              questionOrder: 'SEQUENTIAL',
              showCorrectAnswers: true,
              allowReview: true
            }
          },
          'POLL': {
            id: templateData.id,
            type: 'POLL',
            title: templateData.title,
            description: templateData.question,
            createdBy: 'system',
            createdAt: new Date(),
            updatedAt: new Date(),
            isTemplate: false,
            question: templateData.question,
            options: templateData.options || [],
            config: {
              scoringEnabled: false,
              revealMechanism: 'AUTOMATIC',
              randomizeContent: false,
              allowLateJoining: true,
              showLeaderboard: false,
              anonymousParticipation: false,
              allowMultipleSelections: false,
              showResultsRealTime: true,
              allowCustomOptions: false
            }
          },
          'FEEDBACK': {
            id: templateData.id,
            type: 'FEEDBACK',
            title: templateData.title,
            description: '',
            createdBy: 'system',
            createdAt: new Date(),
            updatedAt: new Date(),
            isTemplate: false,
            prompt: templateData.prompt || 'Please provide your feedback.',
            enableRating: false,
            categories: ['COMMENT', 'QUESTION', 'SUGGESTION', 'CONCERN'],
            config: {
              scoringEnabled: false,
              revealMechanism: 'AUTOMATIC',
              randomizeContent: false,
              allowLateJoining: true,
              showLeaderboard: false,
              anonymousParticipation: false,
              allowLikes: true,
              allowReporting: false,
              moderationRequired: false,
              maxCharacters: 500
            }
          },
          'PAIRING': {
            id: templateData.id,
            type: 'PAIRING',
            title: templateData.title,
            description: '',
            createdBy: 'system',
            createdAt: new Date(),
            updatedAt: new Date(),
            isTemplate: false,
            prompt: templateData.prompt || 'Wait for grouping instructions.',
            leftItems: templateData.leftItems || [],
            rightItems: templateData.rightItems || [],
            groupSize: templateData.groupSize || 2,
            config: {
              scoringEnabled: false,
              revealMechanism: 'AUTOMATIC',
              randomizeContent: false,
              allowLateJoining: true,
              showLeaderboard: false,
              anonymousParticipation: false,
              criteria: {
                type: 'RANDOM',
                attributes: []
              },
              avoidPreviousPairings: false,
              allowSelfSelection: false,
              reshuffleAllowed: false
            }
          }
        };

        setSessionState(prev => ({
          ...prev,
          sessionInfo: prev.sessionInfo ? { ...prev.sessionInfo, status: 'LIVE' } : undefined,
          currentActivity: activityMap[templateData.type] || undefined
        }));
      }
    };
    
    return () => bc.close();
  }, [sessionState.sessionId]);

  const handleJoinSession = async (sessionCode: string, studentName: string) => {
    let session: StoredSession | null = null;
    
    // Try localStorage
    const sessions = JSON.parse(localStorage.getItem('classroom_sessions') || '[]') as StoredSession[];
    session = sessions.find((s) => s.code.toUpperCase() === sessionCode.toUpperCase()) || null;
    
    // Cross-origin mock fallback for the standard test session
    if (!session && sessionCode === '000000') {
      session = {
        id: "session-sample-000000",
        code: "000000",
        templateId: "template-sample",
        title: "Sample Session",
        status: "SCHEDULED",
        createdAt: new Date().toISOString()
      };
    }
    
    if (!session) {
      throw new Error("Invalid session code or session not found.");
    }

    const studentId = `stu-${Math.random().toString(36).substr(2, 6)}`;

    setSessionState({
      isJoined: true,
      sessionId: session.id,
      studentId,
      sessionInfo: {
        code: sessionCode.toUpperCase(),
        title: 'Live Classroom Session',
        teacher: 'Instructor',
        participantCount: 1,
        status: (session.status as SessionStatus) || 'SCHEDULED'
      },
      currentActivity: undefined,
      submittedResponses: new Set()
    });

    // We emit using the broadcast channel mockup logic
    setTimeout(() => {
      const bc = new BroadcastChannel(`classroom-session-${session.id}`);
      bc.postMessage({ type: 'student-joined', payload: { id: studentId, name: studentName } });
      bc.close();
    }, 500);
  };

  const handleLeaveSession = () => {
    setSessionState({
      isJoined: false,
      submittedResponses: new Set()
    });
  };

  const handleSubmitResponse = (response: ActivityParticipationResponse) => {
    if (sessionState.currentActivity) {
      const currentId = sessionState.currentActivity.id;
      
      const payload = {
        activityId: currentId,
        participantId: sessionState.studentId,
        data: response,
        timestamp: Date.now()
      };
      
      const bc = new BroadcastChannel(`classroom-session-${sessionState.sessionId}`);
      bc.postMessage({ type: 'student-responded', payload });
      bc.close();
      
      setSessionState(prev => ({
        ...prev,
        submittedResponses: new Set([...prev.submittedResponses, currentId]),
        currentActivity: undefined,
        sessionInfo: prev.sessionInfo ? { ...prev.sessionInfo, status: 'SCHEDULED' } : undefined
      }));
    }
  };

  const isCurrentActivitySubmitted = sessionState.currentActivity 
    ? sessionState.submittedResponses.has(sessionState.currentActivity.id)
    : false;

  if (!sessionState.isJoined) {
    return <SessionJoin onJoinSession={handleJoinSession} />;
  }

  return (
    <div className="relative h-full">
      {!isConnected && (
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
            timeRemaining={sessionState.currentActivity.config?.duration ? sessionState.currentActivity.config.duration * 1000 : undefined}
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
