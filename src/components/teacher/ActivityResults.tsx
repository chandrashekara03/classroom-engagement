'use client';

import { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  Clock, 
  Trophy, 
  CheckCircle,
  XCircle,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Progress
} from '@classroom/ui-components';

interface ActivityResultsProps {
  activity: {
    id: string;
    type: string;
    title: string;
    totalParticipants: number;
    completedResponses: number;
    duration: number;
    timeElapsed: number;
  };
  results: ActivityResultData;
  onClose?: () => void;
  onExport?: () => void;
}

interface ActivityResultData {
  type: 'QUIZ' | 'POLL' | 'FEEDBACK' | 'WORD_RIDDLE' | 'TREASURE_HUNT' | 'PAIRING' | 'SCENARIO';
  summary: {
    averageScore?: number;
    totalResponses: number;
    completionRate: number;
    averageTime?: number;
  };
  details: QuizResults | PollResults | FeedbackResults | GenericResults;
}

interface QuizResults {
  questions: Array<{
    id: string;
    text: string;
    correctRate: number;
    responses: Array<{ optionId: string; count: number; percentage: number }>;
    averageTime: number;
  }>;
  topScorers: Array<{ name: string; score: number }>;
}

interface PollResults {
  options: Array<{
    id: string;
    text: string;
    votes: number;
    percentage: number;
  }>;
}

interface FeedbackResults {
  responses: Array<{
    feedback: string;
    rating?: number;
    timestamp: number;
  }>;
  averageRating?: number;
  themes: Array<{ theme: string; count: number }>;
}

interface GenericResults {
  responses: Array<{
    studentName: string;
    answer: string;
    isCorrect?: boolean;
    score?: number;
    timestamp: number;
  }>;
}

export default function ActivityResults({ activity, results, onClose, onExport }: ActivityResultsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'individual'>('overview');
  
  const completionPercentage = (activity.completedResponses / activity.totalParticipants) * 100;
  const timeRemaining = Math.max(0, activity.duration - activity.timeElapsed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>{activity.title} - Results</span>
              </CardTitle>
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant="outline">
                  {activity.type.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-slate-600">
                  {activity.completedResponses} of {activity.totalParticipants} responses
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <Eye className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Response Progress</span>
                <span>{completionPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={completionPercentage} className="w-full" />
            </div>
            
            {timeRemaining > 0 && (
              <div className="flex items-center space-x-2 text-sm text-amber-600">
                <Clock className="w-4 h-4" />
                <span>{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')} remaining</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
        {(['overview', 'details', 'individual'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab results={results} />}
      {activeTab === 'details' && <DetailsTab results={results} />}
      {activeTab === 'individual' && <IndividualTab />}
    </div>
  );
}

function OverviewTab({ results }: { results: ActivityResultData }) {
  const stats = [
    {
      label: 'Total Responses',
      value: results.summary.totalResponses,
      icon: Users,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      label: 'Completion Rate',
      value: `${results.summary.completionRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100'
    },
  ];

  if (results.summary.averageScore !== undefined) {
    stats.push({
      label: 'Average Score',
      value: `${results.summary.averageScore.toFixed(1)}%`,
      icon: Trophy,
      color: 'text-amber-600 bg-amber-100'
    });
  }

  if (results.summary.averageTime !== undefined) {
    stats.push({
      label: 'Avg. Time',
      value: `${Math.floor(results.summary.averageTime / 60)}:${(results.summary.averageTime % 60).toString().padStart(2, '0')}`,
      icon: Clock,
      color: 'text-slate-600 bg-slate-100'
    });
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DetailsTab({ results }: { results: ActivityResultData }) {
  switch (results.type) {
    case 'QUIZ':
      return <QuizDetailsView results={results.details as QuizResults} />;
    case 'POLL':
      return <PollDetailsView results={results.details as PollResults} />;
    case 'FEEDBACK':
      return <FeedbackDetailsView results={results.details as FeedbackResults} />;
    default:
      return <GenericDetailsView results={results.details as GenericResults} />;
  }
}

function QuizDetailsView({ results }: { results: QuizResults }) {
  return (
    <div className="space-y-6">
      {/* Top Scorers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-amber-500" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {results.topScorers.slice(0, 5).map((scorer, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-amber-100 text-amber-700' :
                    index === 1 ? 'bg-slate-100 text-slate-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-50 text-slate-600'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-medium">{scorer.name}</span>
                </div>
                <Badge variant="outline">{scorer.score}%</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Question Analysis */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Question Performance</h3>
        {results.questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Question {index + 1}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={question.correctRate >= 70 ? 'bg-green-100 text-green-700' : 
                                  question.correctRate >= 50 ? 'bg-amber-100 text-amber-700' : 
                                  'bg-red-100 text-red-700'}>
                    {question.correctRate.toFixed(1)}% correct
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-slate-600">{question.text}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {question.responses.map(response => (
                  <div key={response.optionId} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-700">Option {response.optionId}</span>
                        <span className="text-sm font-medium">{response.percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={response.percentage} className="w-full h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PollDetailsView({ results }: { results: PollResults }) {
  const totalVotes = results.options.reduce((sum, option) => sum + option.votes, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Poll Results</CardTitle>
        <p className="text-sm text-slate-600">{totalVotes} total votes</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {results.options.map((option) => (
            <div key={option.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{option.text}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-600">{option.votes} votes</span>
                  <Badge variant="outline">{option.percentage.toFixed(1)}%</Badge>
                </div>
              </div>
              <Progress value={option.percentage} className="w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FeedbackDetailsView({ results }: { results: FeedbackResults }) {
  return (
    <div className="space-y-6">
      {results.averageRating && (
        <Card>
          <CardHeader>
            <CardTitle>Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {results.averageRating.toFixed(1)}/5
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.responses.slice(0, 10).map((response, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-lg">
                <p className="text-slate-700">{response.feedback}</p>
                {response.rating && (
                  <div className="mt-2">
                    <Badge variant="outline">{response.rating}/5 stars</Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GenericDetailsView({ results }: { results: GenericResults }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Responses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {results.responses.map((response, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <div className="font-medium">{response.studentName}</div>
                <div className="text-sm text-slate-600">{response.answer}</div>
              </div>
              <div className="flex items-center space-x-2">
                {response.isCorrect !== undefined && (
                  response.isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )
                )}
                {response.score !== undefined && (
                  <Badge variant="outline">{response.score}%</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function IndividualTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Individual Performance</CardTitle>
        <p className="text-sm text-slate-600">Detailed breakdown by student</p>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <RefreshCw className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Individual performance tracking coming soon</p>
        </div>
      </CardContent>
    </Card>
  );
}