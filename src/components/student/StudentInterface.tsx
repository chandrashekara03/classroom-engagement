'use client';

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
    status: 'WAITING' | 'LIVE' | 'PAUSED' | 'COMPLETED';
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
      setError('Please enter both session code and your name');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Small simulated delay for UX
      await new Promise(resolve => setTimeout(resolve, 800));
      if (onJoinSession) {
        await onJoinSession(sessionCode.toUpperCase(), studentName.trim());
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to join session. Please check the code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6 min-h-[80vh]">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <BookOpen className="w-8 h-8 text-slate-700" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CHRIST Student Session</h1>
          <p className="text-slate-600 mt-2 font-medium">Enter your session details to join</p>
        </div>
      </div>

      {/* Join Form */}
      <Card className="w-full max-w-sm">
        <CardContent className="p-6">
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Session Code</label>
              <Input
                type="text"
                placeholder="e.g. ABC123"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                className="text-center text-lg font-mono tracking-wider"
                maxLength={6}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Your Name</label>
              <Input
                type="text"
                placeholder="Enter your name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>
            
            {error && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm transition-all" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Joining...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Join Session
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Help Text */}
      <div className="text-center text-sm text-slate-500 space-y-2 mt-8">
        <p>Ask your instructor for the 6-digit session code</p>
        <div className="flex items-center justify-center space-x-2 bg-green-50 text-green-700 py-1.5 px-3 rounded-full w-fit mx-auto border border-green-100">
          <Wifi className="w-3.5 h-3.5" />
          <span className="font-medium text-xs">System Online</span>
        </div>
      </div>
    </div>
  );
}

export function JoinedSession({ sessionInfo, currentActivity, onLeaveSession }: JoinedSessionProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE': return 'text-green-600 bg-green-100';
      case 'PAUSED': return 'text-amber-600 bg-amber-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'LIVE': return <Activity className="w-4 h-4" />;
      case 'PAUSED': return <Clock className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Session Header */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="text-center">
          <h2 className="font-semibold text-slate-900">{sessionInfo.title}</h2>
          <p className="text-sm text-slate-600">with {sessionInfo.teacher}</p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(sessionInfo.status)}>
              {getStatusIcon(sessionInfo.status)}
              <span className="ml-1">{sessionInfo.status}</span>
            </Badge>
            <span className="text-sm text-slate-600">
              {sessionInfo.participantCount} participants
            </span>
          </div>
          
          <Badge variant="outline" className="font-mono">
            {sessionInfo.code}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        {currentActivity ? (
          <ActiveActivityView activity={currentActivity} />
        ) : (
          <WaitingView sessionStatus={sessionInfo.status} />
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200">
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={onLeaveSession}
        >
          Leave Session
        </Button>
      </div>
    </div>
  );
}

function ActiveActivityView({ activity }: { activity: { id: string; type: string; title: string; timeRemaining?: number } }) {
  return (
    <div className="space-y-6">
      {/* Activity Header */}
      <Card>
        <CardHeader className="text-center">
          <Badge variant="active" className="self-center mb-2">
            {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
          </Badge>
          <CardTitle className="text-lg">{activity.title}</CardTitle>
        </CardHeader>
        {activity.timeRemaining && (
          <CardContent className="pt-0">
            <Timer 
              duration={activity.timeRemaining}
              autoStart={true}
              className="justify-center"
            />
          </CardContent>
        )}
      </Card>

      {/* Activity Content Placeholder */}
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Activity Starting...</h3>
          <p className="text-slate-600 text-sm">
            Get ready to participate in the {activity.type} activity
          </p>
          <div className="mt-4">
            <div className="w-8 h-1 bg-blue-200 rounded-full mx-auto overflow-hidden">
              <div className="w-full h-full bg-blue-600 rounded-full animate-pulse-soft"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WaitingView({ sessionStatus }: { sessionStatus: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
        {sessionStatus === 'PAUSED' ? (
          <Clock className="w-10 h-10 text-slate-600" />
        ) : (
          <Users className="w-10 h-10 text-slate-600" />
        )}
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-900">
          {sessionStatus === 'PAUSED' ? 'Session Paused' : 'Waiting for Activity'}
        </h3>
        <p className="text-slate-600">
          {sessionStatus === 'PAUSED' 
            ? 'The teacher has paused the session. Please wait...' 
            : 'Your teacher will start an activity soon'}
        </p>
      </div>
      
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div 
            key={i}
            className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      
      <Card className="w-full max-w-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Status</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-slate-900">Connected</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}