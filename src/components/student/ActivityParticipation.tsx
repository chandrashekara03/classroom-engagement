'use client';

import { useState, useEffect } from 'react';
import { 
  Check, 
  Clock, 
  Send, 
  Star, 
  ArrowRight, 
  Users,
  MessageCircle,
  Search,
  MapPin,
  Link as LinkIcon,
  Trophy
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Timer,
  Progress
} from '@classroom/ui-components';
import type { 
  Activity,
  QuizActivity,
  PollActivity,
  FeedbackActivity,
  WordRiddleActivity,
  TreasureHuntActivity,
  PairingActivity,
  ScenarioActivity,
  ActivityResponse
} from '@classroom/shared-utils';

interface ActivityParticipationProps {
  activity: Activity;
  onSubmitResponse: (response: ActivityResponse) => void;
  timeRemaining?: number;
  isSubmitted?: boolean;
}

export default function ActivityParticipation({ 
  activity, 
  onSubmitResponse, 
  timeRemaining,
  isSubmitted = false 
}: ActivityParticipationProps) {
  const [response, setResponse] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (!response || isSubmitted) return;
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    onSubmitResponse(response);
    setIsSubmitting(false);
  };

  const renderActivityContent = () => {
    switch (activity.type) {
      case 'QUIZ':
        return <QuizParticipation 
          activity={activity as QuizActivity} 
          onResponseChange={setResponse}
          isSubmitted={isSubmitted}
        />;
      case 'POLL':
        return <PollParticipation 
          activity={activity as PollActivity} 
          onResponseChange={setResponse}
          isSubmitted={isSubmitted}
        />;
      case 'FEEDBACK':
        return <FeedbackParticipation 
          activity={activity as FeedbackActivity} 
          onResponseChange={setResponse}
          isSubmitted={isSubmitted}
        />;
      case 'WORD_RIDDLE':
        return <WordRiddleParticipation 
          activity={activity as WordRiddleActivity} 
          onResponseChange={setResponse}
          isSubmitted={isSubmitted}
        />;
      case 'TREASURE_HUNT':
        return <TreasureHuntParticipation 
          activity={activity as TreasureHuntActivity} 
          onResponseChange={setResponse}
          isSubmitted={isSubmitted}
        />;
      case 'PAIRING':
        return <PairingParticipation 
          activity={activity as PairingActivity} 
          onResponseChange={setResponse}
          isSubmitted={isSubmitted}
        />;
      case 'SCENARIO':
        return <ScenarioParticipation 
          activity={activity as ScenarioActivity} 
          onResponseChange={setResponse}
          isSubmitted={isSubmitted}
        />;
      default:
        return <div>Unknown activity type</div>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Activity Header */}
      <Card>
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Badge variant="active">
              {activity.type.replace('_', ' ')}
            </Badge>
            {isSubmitted && (
              <Badge className="bg-green-100 text-green-700">
                <Check className="w-3 h-3 mr-1" />
                Submitted
              </Badge>
            )}
          </div>
          <CardTitle className="text-xl">{activity.title}</CardTitle>
          {activity.description && (
            <p className="text-slate-600 text-sm mt-2">{activity.description}</p>
          )}
        </CardHeader>
        {timeRemaining && !isSubmitted && (
          <CardContent className="pt-0">
            <Timer 
              duration={timeRemaining}
              autoStart={true}
              className="justify-center"
              variant="warning"
            />
          </CardContent>
        )}
      </Card>

      {/* Activity Content */}
      {renderActivityContent()}

      {/* Submit Button */}
      {!isSubmitted && (
        <Button 
          onClick={handleSubmit}
          disabled={!response || isSubmitting}
          className="w-full"
          variant="primary"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Response
            </>
          )}
        </Button>
      )}

      {isSubmitted && (
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Response Submitted!</h3>
            <p className="text-slate-600 text-sm">
              Thank you for participating. Please wait for the results.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QuizParticipation({ 
  activity, 
  onResponseChange, 
  isSubmitted 
}: { 
  activity: QuizActivity; 
  onResponseChange: (response: any) => void;
  isSubmitted: boolean;
}) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | string[]>>({});

  useEffect(() => {
    onResponseChange({
      type: 'QUIZ',
      activityId: activity.id,
      answers: selectedAnswers,
      timestamp: Date.now()
    });
  }, [selectedAnswers, activity.id, onResponseChange]);

  const handleAnswerSelect = (questionId: string, answerId: string, isMultiple: boolean) => {
    if (isSubmitted) return;
    
    setSelectedAnswers(prev => {
      if (isMultiple) {
        const current = Array.isArray(prev[questionId]) ? prev[questionId] as string[] : [];
        const updated = current.includes(answerId)
          ? current.filter(id => id !== answerId)
          : [...current, answerId];
        return { ...prev, [questionId]: updated };
      } else {
        return { ...prev, [questionId]: answerId };
      }
    });
  };

  return (
    <div className="space-y-4">
      {activity.questions.map((question, index) => (
        <Card key={question.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Question {index + 1}
              </CardTitle>
              <Badge variant="outline">
                {question.points} pt{question.points !== 1 ? 's' : ''}
              </Badge>
            </div>
            <p className="text-slate-700">{question.text}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(question.options || []).map(option => {
                const isSelected = question.multiple
                  ? (selectedAnswers[question.id] as string[] || []).includes(option.id)
                  : selectedAnswers[question.id] === option.id;
                  
                return (
                  <button
                    key={option.id}
                    onClick={() => handleAnswerSelect(question.id, option.id, !!question.multiple)}
                    disabled={isSubmitted}
                    className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    } ${isSubmitted ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded ${question.multiple ? 'rounded-sm' : 'rounded-full'} border-2 mr-3 flex items-center justify-center ${
                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-2 h-2 text-white" />}
                      </div>
                      {option.text}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PollParticipation({
  activity,
  onResponseChange,
  isSubmitted
}: {
  activity: PollActivity;
  onResponseChange: (response: any) => void;
  isSubmitted: boolean;
}) {
  const [selectedOption, setSelectedOption] = useState<string>('');

  useEffect(() => {
    onResponseChange({
      type: 'POLL',
      activityId: activity.id,
      selectedOption,
      timestamp: Date.now()
    });
  }, [selectedOption, activity.id, onResponseChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{activity.question}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activity.options.map(option => (
            <button
              key={option.id}
              onClick={() => !isSubmitted && setSelectedOption(option.id)}
              disabled={isSubmitted}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                selectedOption === option.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              } ${isSubmitted ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center">
                <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                  selectedOption === option.id ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                }`}>
                  {selectedOption === option.id && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="font-medium">{option.text}</span>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FeedbackParticipation({
  activity,
  onResponseChange,
  isSubmitted
}: {
  activity: FeedbackActivity;
  onResponseChange: (response: any) => void;
  isSubmitted: boolean;
}) {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState<number>(0);

  useEffect(() => {
    onResponseChange({
      type: 'FEEDBACK',
      activityId: activity.id,
      feedback: feedback.trim(),
      rating: activity.enableRating ? rating : undefined,
      timestamp: Date.now()
    });
  }, [feedback, rating, activity.id, activity.enableRating, onResponseChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageCircle className="w-5 h-5 mr-2" />
          {activity.prompt}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activity.enableRating && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Rating
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => !isSubmitted && setRating(star)}
                  disabled={isSubmitted}
                  className={`p-1 ${isSubmitted ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <Star 
                    className={`w-6 h-6 ${
                      star <= rating ? 'text-amber-400 fill-current' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Your Feedback
          </label>
          <textarea
            value={feedback}
            onChange={(e) => !isSubmitted && setFeedback(e.target.value)}
            disabled={isSubmitted}
            placeholder="Share your thoughts..."
            className="w-full h-32 p-3 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
            maxLength={500}
          />
          <div className="text-right text-sm text-slate-500 mt-1">
            {feedback.length}/500
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WordRiddleParticipation({
  activity,
  onResponseChange,
  isSubmitted
}: {
  activity: WordRiddleActivity;
  onResponseChange: (response: any) => void;
  isSubmitted: boolean;
}) {
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    onResponseChange({
      type: 'WORD_RIDDLE',
      activityId: activity.id,
      answer: answer.trim(),
      timestamp: Date.now()
    });
  }, [answer, activity.id, onResponseChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="w-5 h-5 mr-2" />
          Word Riddle
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-slate-50 rounded-lg">
          <p className="text-slate-700 text-lg leading-relaxed">{activity.riddle}</p>
        </div>
        
        {activity.hints && activity.hints.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-700">Hints:</h4>
            {activity.hints.map((hint, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  {index + 1}
                </div>
                <p className="text-sm text-slate-600">{hint}</p>
              </div>
            ))}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Your Answer
          </label>
          <Input
            type="text"
            value={answer}
            onChange={(e) => !isSubmitted && setAnswer(e.target.value)}
            disabled={isSubmitted}
            placeholder="Enter your answer..."
            className="text-lg"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function TreasureHuntParticipation({
  activity,
  onResponseChange,
  isSubmitted
}: {
  activity: TreasureHuntActivity;
  onResponseChange: (response: any) => void;
  isSubmitted: boolean;
}) {
  const [currentClue, setCurrentClue] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  useEffect(() => {
    onResponseChange({
      type: 'TREASURE_HUNT',
      activityId: activity.id,
      clueAnswers: answers,
      timestamp: Date.now()
    });
  }, [answers, activity.id, onResponseChange]);

  const handleAnswerSubmit = (answer: string) => {
    if (isSubmitted) return;
    
    const newAnswers = [...answers];
    newAnswers[currentClue] = answer.trim();
    setAnswers(newAnswers);
    
    const cluesLength = activity.clues ? activity.clues.length : 0;
    if (currentClue < cluesLength - 1) {
      setCurrentClue(prev => prev + 1);
    }
  };

  const cluesLength = activity.clues ? activity.clues.length : 1;
  const progress = ((currentClue + (answers[currentClue] ? 1 : 0)) / cluesLength) * 100;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Treasure Hunt Progress
            </CardTitle>
            <Badge variant="outline">
              {Math.min(currentClue + 1, cluesLength)} of {cluesLength}
            </Badge>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clue #{currentClue + 1}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
            <p className="text-amber-800">{activity.clues && activity.clues[currentClue] ? activity.clues[currentClue].text : ''}</p>
          </div>
          
          {!answers[currentClue] && !isSubmitted && (
            <ClueAnswerInput onSubmit={handleAnswerSubmit} />
          )}
          
          {answers[currentClue] && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-green-700 font-medium">Completed!</span>
              </div>
              <p className="text-green-600 text-sm mt-1">Answer: {answers[currentClue]}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ClueAnswerInput({ onSubmit }: { onSubmit: (answer: string) => void }) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim()) {
      onSubmit(answer);
      setAnswer('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <Input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Enter your answer..."
        className="flex-1"
      />
      <Button type="submit" disabled={!answer.trim()}>
        <ArrowRight className="w-4 h-4" />
      </Button>
    </form>
  );
}

function PairingParticipation({
  activity,
  onResponseChange,
  isSubmitted
}: {
  activity: PairingActivity;
  onResponseChange: (response: any) => void;
  isSubmitted: boolean;
}) {
  const [pairs, setPairs] = useState<Array<{ leftId: string; rightId: string }>>([]);

  useEffect(() => {
    onResponseChange({
      type: 'PAIRING',
      activityId: activity.id,
      pairs,
      timestamp: Date.now()
    });
  }, [pairs, activity.id, onResponseChange]);

  const handlePairSelect = (leftId: string, rightId: string) => {
    if (isSubmitted) return;
    
    setPairs(prev => {
      const existing = prev.findIndex(p => p.leftId === leftId);
      const newPairs = existing >= 0 
        ? prev.map((p, i) => i === existing ? { leftId, rightId } : p)
        : [...prev, { leftId, rightId }];
      return newPairs;
    });
  };

  const getPairedRightId = (leftId: string) => {
    return pairs.find(p => p.leftId === leftId)?.rightId;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <LinkIcon className="w-5 h-5 mr-2" />
          Match the Pairs
        </CardTitle>
        <p className="text-slate-600">Match items from the left column with items from the right column</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {(activity.leftItems || []).map(leftItem => (
            <div key={leftItem.id} className="flex items-center space-x-4">
              <div className="flex-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="font-medium text-blue-800">{leftItem.text}</span>
              </div>
              
              <ArrowRight className="w-4 h-4 text-slate-400" />
              
              <div className="flex-1">
                <select
                  value={getPairedRightId(leftItem.id) || ''}
                  onChange={(e) => handlePairSelect(leftItem.id, e.target.value)}
                  disabled={isSubmitted}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value="">Select a match...</option>
                  {(activity.rightItems || []).map(rightItem => (
                    <option key={rightItem.id} value={rightItem.id}>
                      {rightItem.text}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ScenarioParticipation({
  activity,
  onResponseChange,
  isSubmitted
}: {
  activity: ScenarioActivity;
  onResponseChange: (response: any) => void;
  isSubmitted: boolean;
}) {
  const [selectedChoice, setSelectedChoice] = useState<string>('');
  const [reasoning, setReasoning] = useState('');

  useEffect(() => {
    onResponseChange({
      type: 'SCENARIO',
      activityId: activity.id,
      choiceId: selectedChoice,
      reasoning: reasoning.trim(),
      timestamp: Date.now()
    });
  }, [selectedChoice, reasoning, activity.id, onResponseChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="w-5 h-5 mr-2" />
          Decision Scenario
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-slate-50 rounded-lg border-l-4 border-slate-400">
          <p className="text-slate-700 leading-relaxed">{activity.scenario}</p>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-slate-900">What would you do?</h4>
          {activity.choices.map(choice => (
            <button
              key={choice.id}
              onClick={() => !isSubmitted && setSelectedChoice(choice.id)}
              disabled={isSubmitted}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                selectedChoice === choice.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              } ${isSubmitted ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                  selectedChoice === choice.id ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                }`}>
                  {selectedChoice === choice.id && <Check className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <div className="font-medium mb-1">{choice.text}</div>
                  {choice.description && (
                    <div className="text-sm opacity-75">{choice.description}</div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
        
        {activity.requireReasoning && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Explain your reasoning
            </label>
            <textarea
              value={reasoning}
              onChange={(e) => !isSubmitted && setReasoning(e.target.value)}
              disabled={isSubmitted}
              placeholder="Why did you choose this option?"
              className="w-full h-24 p-3 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
              maxLength={300}
            />
            <div className="text-right text-sm text-slate-500 mt-1">
              {reasoning.length}/300
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}