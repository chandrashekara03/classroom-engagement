'use client';

import { useState } from 'react';
import {
  Activity,
  BarChart3,
  Play,
  Pause,
  Square,
  UserPlus,
  Shuffle,
  FileText,
  MoreHorizontal
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ActivityCard,
  SessionStatusIndicator,
  ParticipantCounter,
  Timer as TimerComponent,
  LeaderboardTable
} from '@classroom/ui-components';

interface TeacherDashboardProps {
  className?: string;
}

const mockParticipants = [
  { id: '1', name: 'Alice Johnson', isOnline: true, isActive: true, score: 85, joinedAt: new Date(Date.now() - 300000), lastSeen: new Date() },
  { id: '2', name: 'Bob Smith', isOnline: true, isActive: false, score: 72, joinedAt: new Date(Date.now() - 180000), lastSeen: new Date() },
  { id: '3', name: 'Carol Davis', isOnline: false, isActive: false, score: 93, joinedAt: new Date(Date.now() - 600000), lastSeen: new Date(Date.now() - 120000) },
  { id: '4', name: 'David Wilson', isOnline: true, isActive: true, score: 67, joinedAt: new Date(Date.now() - 450000), lastSeen: new Date() },
];

const mockActivities = [
  {
    id: '1',
    title: 'Introduction Quiz',
    type: 'quiz' as const,
    description: 'Test understanding of basic concepts',
    config: {
      duration: 300,
      maxParticipants: 30,
      scoringEnabled: true,
      randomizeQuestions: true
    },
    isActive: true,
    participantCount: 4,
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: '2',
    title: 'Quick Poll',
    type: 'poll' as const,
    description: 'Gather student opinions on the topic',
    config: {
      duration: 120,
      scoringEnabled: false,
    },
    participantCount: 0,
    lastUsed: new Date(Date.now() - 172800000),
  },
  {
    id: '3',
    title: 'Group Discussion',
    type: 'feedback' as const,
    description: 'Collaborative feedback session',
    config: {
      duration: 600,
      scoringEnabled: false,
    },
    createdAt: new Date(Date.now() - 259200000),
  }
];

const mockLeaderboard = [
  { id: '1', name: 'Alice Johnson', score: 85, rank: 1, isCurrentUser: false, correctAnswers: 17, totalAnswers: 20 },
  { id: '2', name: 'Carol Davis', score: 93, rank: 2, isCurrentUser: false, correctAnswers: 19, totalAnswers: 20 },
  { id: '3', name: 'Bob Smith', score: 72, rank: 3, isCurrentUser: false, correctAnswers: 14, totalAnswers: 20 },
  { id: '4', name: 'David Wilson', score: 67, rank: 4, isCurrentUser: false, correctAnswers: 13, totalAnswers: 20 },
];

export function TeacherDashboard({ className }: TeacherDashboardProps) {
  const [currentSession] = useState(() => ({
    id: 'session-1',
    code: 'ABC123',
    title: 'Advanced Mathematics - Unit 3',
    status: 'LIVE' as const,
    startedAt: new Date(Date.now() - 1800000), // 30 minutes ago
    participantCount: 4
  }));
  
  const [sessionTimer] = useState(1200); // 20 minutes
  const [isSessionActive, setIsSessionActive] = useState(true);

  const handleStartActivity = (activityId: string) => {
    console.log('Starting activity:', activityId);
  };

  const handleConfigureActivity = (activityId: string) => {
    console.log('Configuring activity:', activityId);
  };

  const handleSessionControl = (action: 'play' | 'pause' | 'stop') => {
    console.log('Session action:', action);
    if (action === 'pause') {
      setIsSessionActive(false);
    } else if (action === 'play') {
      setIsSessionActive(true);
    }
  };

  const handleGenerateGroups = () => {
    console.log('Generating groups');
  };

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Teacher Dashboard</h1>
          <p className="text-slate-600 mt-1">Manage your classroom activities and monitor engagement</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button variant="primary">
            <Activity className="h-4 w-4 mr-2" />
            Create Activity
          </Button>
        </div>
      </div>

      {/* Session Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-green-600" />
              <span>Current Session: {currentSession.title}</span>
            </CardTitle>
            <SessionStatusIndicator 
              status={currentSession.status}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Session Controls */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900">Session Controls</h4>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant={isSessionActive ? "secondary" : "primary"}
                  onClick={() => handleSessionControl(isSessionActive ? 'pause' : 'play')}
                >
                  {isSessionActive ? (
                    <>
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleSessionControl('stop')}
                >
                  <Square className="h-4 w-4 mr-1" />
                  End Session
                </Button>
              </div>
              
              {/* Quick Actions */}
              <div className="space-y-2">
                <Button size="sm" variant="outline" className="w-full justify-start">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Random Name Picker
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleGenerateGroups}
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  Generate Groups
                </Button>
              </div>
            </div>
            
            {/* Session Timer */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900">Activity Timer</h4>
              <TimerComponent
                duration={sessionTimer}
                autoStart={isSessionActive}
                showControls={true}
                onComplete={() => console.log('Timer completed')}
              />
            </div>
            
            {/* Participants */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900">Participants</h4>
              <ParticipantCounter
                participants={mockParticipants.map(p => ({ ...p, role: 'STUDENT' as const, email: '', preferences: { notifications: true, anonymousMode: false } }))}
                showOnlineStatus={true}
                showActivityStatus={true}
                maxDisplayed={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activities Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Active Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockActivities.filter(activity => activity.isActive).map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    {...activity}
                    onStart={() => handleStartActivity(activity.id)}
                    onConfigure={() => handleConfigureActivity(activity.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Activity Templates */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Activity Templates</CardTitle>
                <Button size="sm" variant="outline">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockActivities.filter(activity => !activity.isActive).map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    {...activity}
                    onStart={() => handleStartActivity(activity.id)}
                    onConfigure={() => handleConfigureActivity(activity.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Real-time Leaderboard */}
          <LeaderboardTable
            entries={mockLeaderboard}
            showAccuracy={true}
            showCompletionTime={false}
            maxEntries={5}
          />
          
          {/* Session Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Session Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{currentSession.participantCount}</div>
                  <div className="text-sm text-blue-600">Active</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">87%</div>
                  <div className="text-sm text-green-600">Engagement</div>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">3</div>
                  <div className="text-sm text-amber-600">Activities</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">76</div>
                  <div className="text-sm text-purple-600">Avg Score</div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-200">
                <Button size="sm" variant="outline" className="w-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Detailed Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="font-medium">Alice submitted quiz</div>
                    <div className="text-slate-500">2 minutes ago</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="font-medium">New participant joined</div>
                    <div className="text-slate-500">5 minutes ago</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="font-medium">Poll activity completed</div>
                    <div className="text-slate-500">8 minutes ago</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}