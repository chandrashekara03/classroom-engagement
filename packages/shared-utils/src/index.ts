// Core Activity Types
export type ActivityType = 'QUIZ' | 'POLL' | 'FEEDBACK' | 'WORD_RIDDLE' | 'TREASURE_HUNT' | 'PAIRING' | 'SCENARIO';

export type SessionStatus = 'SCHEDULED' | 'LIVE' | 'PAIRING' | 'COMPLETED' | 'PAUSED';

export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'SINGLE_SELECT' | 'MULTI_SELECT';

export type FeedbackType = 'COMMENT' | 'QUESTION' | 'SUGGESTION' | 'CONCERN';

export type GroupingStrategy = 'RANDOM' | 'SKILL_BASED' | 'PREFERENCE_BASED' | 'AVOID_PREVIOUS';

// Base Interfaces
export interface BaseActivity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isTemplate: boolean;
}

export interface ActivityConfig {
  duration?: number; // seconds
  maxParticipants?: number;
  scoringEnabled: boolean;
  revealMechanism: 'AUTOMATIC' | 'MANUAL' | 'TIMER';
  randomizeContent?: boolean;
  allowLateJoining?: boolean;
  showLeaderboard?: boolean;
  anonymousParticipation?: boolean;
}

// Quiz Activity Types
export interface QuizQuestion {
  id: string;
  question: string;
  text?: string;
  multiple?: boolean;
  type: QuestionType;
  options?: QuizOption[];
  correctAnswers: string[]; // option IDs or text for short answer
  explanation?: string;
  points: number;
  timeLimit?: number; // seconds per question
  media?: {
    type: 'IMAGE' | 'VIDEO' | 'AUDIO';
    url: string;
    alt?: string;
  };
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizActivity extends BaseActivity {
  type: 'QUIZ';
  questions: QuizQuestion[];
  config: ActivityConfig & {
    questionOrder: 'SEQUENTIAL' | 'RANDOM';
    showCorrectAnswers: boolean;
    allowReview: boolean;
    passingScore?: number;
  };
}

// Poll Activity Types
export interface PollOption {
  id: string;
  text: string;
  color?: string;
}

export interface PollActivity extends BaseActivity {
  type: 'POLL';
  question: string;
  options: PollOption[];
  config: ActivityConfig & {
    allowMultipleSelections: boolean;
    showResultsRealTime: boolean;
    allowCustomOptions: boolean;
  };
}

// Feedback Activity Types
export interface FeedbackActivity extends BaseActivity {
  type: 'FEEDBACK';
  prompt: string;
  enableRating?: boolean;
  categories: FeedbackType[];
  config: ActivityConfig & {
    allowLikes: boolean;
    allowReporting: boolean;
    moderationRequired: boolean;
    maxCharacters: number;
  };
}

// Word Riddle Activity Types
export interface WordRiddleClue {
  id: string;
  clue: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
}

export interface WordRiddleActivity extends BaseActivity {
  type: 'WORD_RIDDLE';
  riddle?: string;
  hints?: string[];
  answer: string;
  clues: WordRiddleClue[];
  config: ActivityConfig & {
    maxAttempts: number;
    hintSequence: 'LINEAR' | 'POINTS_BASED';
    caseSensitive: boolean;
  };
}

// Treasure Hunt Activity Types
export interface TreasureHuntStage {
  id: string;
  title: string;
  description: string;
  clue: string;
  answer: string;
  points: number;
  requiredStages?: string[]; // IDs of stages that must be completed first
  location?: {
    type: 'QR_CODE' | 'GPS' | 'PROXIMITY' | 'MANUAL';
    data: string;
  };
}

export interface TreasureHuntActivity extends BaseActivity {
  type: 'TREASURE_HUNT';
  stages: TreasureHuntStage[];
  clues?: { text: string }[];
  config: ActivityConfig & {
    huntType: 'LINEAR' | 'OPEN' | 'BRANCHING';
    allowHints: boolean;
    teamBased: boolean;
  };
}

// Pairing Activity Types
export interface PairingCriteria {
  type: 'SKILL' | 'INTEREST' | 'RANDOM' | 'COMPLEMENTARY';
  attributes: string[];
}

export interface PairingActivity extends BaseActivity {
  type: 'PAIRING';
  prompt: string;
  leftItems?: { id: string; text: string }[];
  rightItems?: { id: string; text: string }[];
  groupSize: number;
  config: ActivityConfig & {
    criteria: PairingCriteria;
    avoidPreviousPairings: boolean;
    allowSelfSelection: boolean;
    reshuffleAllowed: boolean;
  };
}

// Scenario Activity Types
export interface ScenarioChoice {
  id: string;
  text: string;
  description?: string;
  consequences: string;
  points: number;
  nextScenarios?: string[]; // IDs of follow-up scenarios
}

export interface ScenarioActivity extends BaseActivity {
  type: 'SCENARIO';
  scenario: string;
  requireReasoning?: boolean;
  context?: string;
  choices: ScenarioChoice[];
  config: ActivityConfig & {
    allowDiscussion: boolean;
    showConsequences: 'IMMEDIATE' | 'END_OF_ACTIVITY' | 'NEVER';
    branchingEnabled: boolean;
  };
}

// Union type for all activities
export type Activity = QuizActivity | PollActivity | FeedbackActivity | WordRiddleActivity | TreasureHuntActivity | PairingActivity | ScenarioActivity;

// Participant and Response Types
export interface Participant {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role: 'STUDENT' | 'TEACHER' | 'TA';
  isOnline: boolean;
  isActive: boolean; // engaged in current activity
  score: number;
  joinedAt: Date;
  lastSeen: Date;
  preferences?: {
    notifications: boolean;
    anonymousMode: boolean;
  };
}

export interface BaseResponse {
  id: string;
  participantId: string;
  activityId: string;
  submittedAt: Date;
  timeSpent: number; // seconds
  score?: number;
}

export interface QuizResponse extends BaseResponse {
  answers: {
    questionId: string;
    selectedOptions: string[];
    textAnswer?: string;
  }[];
}

export interface PollResponse extends BaseResponse {
  selectedOptions: string[];
  customOption?: string;
}

export interface FeedbackResponse extends BaseResponse {
  content: string;
  category: FeedbackType;
  isAnonymous: boolean;
  likes?: number;
}

export interface WordRiddleResponse extends BaseResponse {
  answer: string;
  attempts: {
    answer: string;
    timestamp: Date;
    isCorrect: boolean;
  }[];
  hintsUsed: string[];
}

export interface TreasureHuntResponse extends BaseResponse {
  completedStages: {
    stageId: string;
    answer: string;
    completedAt: Date;
  }[];
  currentStage?: string;
}

export interface PairingResponse extends BaseResponse {
  preferences?: string[]; // participant IDs
  assignedGroup?: string;
}

export interface ScenarioResponse extends BaseResponse {
  choices: {
    scenarioId: string;
    choiceId: string;
    timestamp: Date;
  }[];
}

export type ActivityResponse = QuizResponse | PollResponse | FeedbackResponse | WordRiddleResponse | TreasureHuntResponse | PairingResponse | ScenarioResponse;

// Session Management Types
export interface Group {
  id: string;
  name?: string;
  members: string[]; // participant IDs
  color?: string;
  createdAt: Date;
}

export interface SessionState {
  id: string;
  code: string; // 6-digit join code
  title: string;
  description?: string;
  teacherId: string;
  status: SessionStatus;
  currentActivity?: {
    activity: Activity;
    startedAt: Date;
    responses: ActivityResponse[];
    timeRemaining?: number;
  };
  participants: Participant[];
  groups?: Group[];
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  settings: {
    allowLateJoining: boolean;
    requireApproval: boolean;
    anonymousMode: boolean;
    showLeaderboard: boolean;
  };
}

// Analytics and Reporting Types
export interface ParticipationMetrics {
  participantId: string;
  totalActivities: number;
  averageScore: number;
  totalTimeSpent: number;
  activitiesCompleted: number;
  streakCount: number;
  lastActiveDate: Date;
}

export interface ActivityAnalytics {
  activityId: string;
  participantCount: number;
  completionRate: number;
  averageScore: number;
  averageTimeSpent: number;
  difficultyRating?: number;
  popularChoices?: { [key: string]: number };
  commonMistakes?: string[];
}

export interface SessionAnalytics {
  sessionId: string;
  duration: number;
  peakParticipants: number;
  activitiesRun: number;
  overallEngagement: number; // 0-100 percentage
  participantMetrics: ParticipationMetrics[];
  activityAnalytics: ActivityAnalytics[];
}

// Real-time Events
export interface BaseEvent {
  type: string;
  sessionId: string;
  timestamp: Date;
  userId?: string;
}

export interface ParticipantJoinedEvent extends BaseEvent {
  type: 'PARTICIPANT_JOINED';
  participant: Participant;
}

export interface ParticipantLeftEvent extends BaseEvent {
  type: 'PARTICIPANT_LEFT';
  participantId: string;
}

export interface ActivityStartedEvent extends BaseEvent {
  type: 'ACTIVITY_STARTED';
  activity: Activity;
}

export interface ActivityEndedEvent extends BaseEvent {
  type: 'ACTIVITY_ENDED';
  activityId: string;
  results?: any;
}

export interface ResponseSubmittedEvent extends BaseEvent {
  type: 'RESPONSE_SUBMITTED';
  response: ActivityResponse;
}

export interface GroupsFormedEvent extends BaseEvent {
  type: 'GROUPS_FORMED';
  groups: Group[];
}

export interface TimerUpdateEvent extends BaseEvent {
  type: 'TIMER_UPDATE';
  timeRemaining: number;
}

export type SessionEvent = ParticipantJoinedEvent | ParticipantLeftEvent | ActivityStartedEvent | ActivityEndedEvent | ResponseSubmittedEvent | GroupsFormedEvent | TimerUpdateEvent;

// Utility Functions
export function generateSessionCode(): string {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

export function calculateActivityDuration(activity: Activity): number {
  if (activity.config.duration) return activity.config.duration;
  
  // Default durations by activity type
  switch (activity.type) {
    case 'QUIZ': return (activity as QuizActivity).questions.length * 60; // 1 min per question
    case 'POLL': return 120; // 2 minutes
    case 'FEEDBACK': return 300; // 5 minutes
    case 'WORD_RIDDLE': return 180; // 3 minutes
    case 'TREASURE_HUNT': return (activity as TreasureHuntActivity).stages.length * 300; // 5 min per stage
    case 'PAIRING': return 60; // 1 minute
    case 'SCENARIO': return 240; // 4 minutes
    default: return 300;
  }
}

export function isActivityComplete(activity: Activity, responses: ActivityResponse[]): boolean {
  // Implementation depends on activity type and requirements
  return responses.length > 0;
}

export function calculateScore(activity: Activity, response: ActivityResponse): number {
  if (!activity.config.scoringEnabled) return 0;
  
  // Scoring logic varies by activity type
  switch (activity.type) {
    case 'QUIZ':
      const quizActivity = activity as QuizActivity;
      const quizResponse = response as QuizResponse;
      let score = 0;
      
      quizResponse.answers.forEach(answer => {
        const question = quizActivity.questions.find(q => q.id === answer.questionId);
        if (question) {
          const isCorrect = question.correctAnswers.every(correct => 
            answer.selectedOptions.includes(correct) || answer.textAnswer === correct
          ) && answer.selectedOptions.length === question.correctAnswers.length;
          
          if (isCorrect) score += question.points;
        }
      });
      
      return score;
    
    default:
      return response.score || 0;
  }
}
