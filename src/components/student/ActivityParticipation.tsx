'use client';

import { useState, useEffect } from 'react';
import { 
  Check, 
  Send, 
  Star, 
  ArrowRight, 
  MessageCircle,
  Search,
  MapPin,
  Link as LinkIcon,
  Trophy,
  Clock,
  Zap,
  HelpCircle,
  ChevronRight,
  Layers
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
  onSubmitResponse: (response: ActivityParticipationResponse) => void;
  timeRemaining?: number;
  isSubmitted?: boolean;
}

type PrototypeResponse = {
  type: Activity['type'];
  activityId: string;
  timestamp: number;
  [key: string]: unknown;
};

export type ActivityParticipationResponse = ActivityResponse | PrototypeResponse;

export default function ActivityParticipation({ 
  activity, 
  onSubmitResponse, 
  timeRemaining,
  isSubmitted = false 
}: ActivityParticipationProps) {
  const [response, setResponse] = useState<ActivityParticipationResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (!response || isSubmitted) return;
    
    setIsSubmitting(true);
    // Visual delay to allow glassmorphism animations to settle
    await new Promise(resolve => setTimeout(resolve, 800)); 
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
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Activity Header - Institutional Branding */}
      <div className="glass-card p-6 bg-white/40 border-indigo-100/50 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
           <Layers size={80} />
        </div>
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-black tracking-widest uppercase">
                {activity.type.replace('_', ' ')}
             </div>
             {isSubmitted && (
                <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black tracking-widest uppercase flex items-center gap-2">
                   <Check size={12} />
                   CONFIRMED
                </div>
             )}
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">{activity.title}</h1>
          {activity.description && (
            <p className="text-slate-500 font-medium text-sm max-w-md italic">"{activity.description}"</p>
          )}
          
          {timeRemaining && !isSubmitted && (
            <div className="pt-2">
               <div className="inline-flex items-center gap-3 px-5 py-2 bg-indigo-50 border border-indigo-100/50 rounded-2xl">
                  <Clock size={16} className="text-indigo-600" />
                  <Timer 
                    duration={timeRemaining}
                    autoStart={true}
                    className="font-mono text-lg font-black text-indigo-700"
                  />
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Activity Content */}
      <div className="space-y-4">
         {renderActivityContent()}
      </div>

      {/* Submit Button - Elevated Interaction */}
      {!isSubmitted && (
        <div className="fixed bottom-6 left-6 right-6 z-40 max-w-xl mx-auto">
          <button 
            onClick={handleSubmit}
            disabled={!response || isSubmitting}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-200 transition-all active:scale-95 disabled:opacity-30 disabled:active:scale-100"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Send size={18} />
                <span>Submit Final Response</span>
              </div>
            )}
          </button>
        </div>
      )}

      {isSubmitted && (
        <div className="glass-card p-10 bg-emerald-500 text-white text-center shadow-2xl shadow-emerald-100 animate-slide-up">
           <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={32} className="text-white" />
           </div>
           <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Academic Success</h3>
           <p className="text-white/80 font-bold uppercase tracking-widest text-[10px]">Your contribution has been synchronized.</p>
        </div>
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
  onResponseChange: (response: ActivityParticipationResponse) => void;
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
    <div className="space-y-6">
      {activity.questions.map((question, index) => (
        <div key={question.id} className="glass-card p-8 bg-white/60 border-indigo-50/50 hover:bg-white/80 transition-all shadow-sm">
           <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                 <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Question {index + 1}</span>
                 <h2 className="text-xl font-black text-slate-800 leading-tight">{question.text}</h2>
              </div>
              <div className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black tracking-widest uppercase">
                 {question.points} PTS
              </div>
           </div>

           <div className="grid gap-3">
              {(question.options || []).map((option, optIdx) => {
                const isSelected = question.multiple
                  ? (selectedAnswers[question.id] as string[] || []).includes(option.id)
                  : selectedAnswers[question.id] === option.id;
                  
                return (
                  <button
                    key={option.id}
                    onClick={() => handleAnswerSelect(question.id, option.id, !!question.multiple)}
                    disabled={isSubmitted}
                    className={`group w-full p-5 text-left rounded-2xl border-2 transition-all flex items-center gap-4 relative overflow-hidden ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-indigo-100'
                        : 'border-white bg-white/60 hover:border-indigo-100'
                    } ${isSubmitted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm transition-all ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                       {String.fromCharCode(65 + optIdx)}
                    </div>
                    
                    <span className={`text-sm font-bold tracking-tight ${isSelected ? 'text-indigo-800' : 'text-slate-600'}`}>
                       {option.text}
                    </span>

                    {isSelected && (
                      <div className="absolute right-4 animate-in zoom-in-0 duration-300">
                         <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                            <Check size={14} className="text-white" strokeWidth={3} />
                         </div>
                      </div>
                    )}
                  </button>
                );
              })}
           </div>
        </div>
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
  onResponseChange: (response: ActivityParticipationResponse) => void;
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
    <div className="glass-card p-10 bg-white/60 border-indigo-100/50 text-center space-y-10 shadow-2xl">
      <div className="space-y-4">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-indigo-100/50">
           <Zap className="w-8 h-8 text-indigo-600" />
        </div>
        <h3 className="text-2xl font-black text-slate-800 leading-tight uppercase tracking-tight">{activity.question}</h3>
      </div>

      <div className="grid gap-3">
        {activity.options.map(option => (
          <button
            key={option.id}
            onClick={() => !isSubmitted && setSelectedOption(option.id)}
            disabled={isSubmitted}
            className={`w-full p-6 text-left rounded-2xl border-2 transition-all flex items-center justify-between group overflow-hidden relative ${
              selectedOption === option.id
                ? 'border-indigo-600 bg-indigo-50/50'
                : 'border-white bg-white hover:border-indigo-100'
            } ${isSubmitted ? 'opacity-50' : ''}`}
          >
            <span className={`text-lg font-black tracking-tight ${selectedOption === option.id ? 'text-indigo-800' : 'text-slate-700'}`}>
              {option.text}
            </span>
            
            <div className={`w-8 h-8 rounded-full border-4 transition-all flex items-center justify-center ${
              selectedOption === option.id ? 'border-indigo-600' : 'border-slate-100'
            }`}>
               {selectedOption === option.id && <div className="w-4 h-4 bg-indigo-600 rounded-full" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function FeedbackParticipation({
  activity,
  onResponseChange,
  isSubmitted
}: {
  activity: FeedbackActivity;
  onResponseChange: (response: ActivityParticipationResponse) => void;
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
    <div className="glass-card p-10 bg-white/60 border-indigo-100/50 space-y-10 shadow-2xl">
      <div className="space-y-4 text-center">
         <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-100/50">
            <MessageCircle className="w-8 h-8 text-emerald-600" />
         </div>
         <h3 className="text-2xl font-black text-slate-800 leading-tight uppercase tracking-tight">{activity.prompt}</h3>
      </div>

      <div className="space-y-8">
        {activity.enableRating && (
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
              Performance Index
            </label>
            <div className="flex justify-center gap-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => !isSubmitted && setRating(star)}
                  disabled={isSubmitted}
                  className={`transition-all duration-300 hover:scale-125 ${star <= rating ? 'scale-110' : ''}`}
                >
                  <Star 
                    className={`w-10 h-10 ${
                      star <= rating ? 'text-amber-400 fill-current' : 'text-slate-200'
                    }`}
                    strokeWidth={star <= rating ? 1 : 2}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
            Detailed Testimonial
          </label>
          <textarea
            value={feedback}
            onChange={(e) => !isSubmitted && setFeedback(e.target.value)}
            disabled={isSubmitted}
            placeholder="Document your experience here..."
            className="w-full h-48 p-6 bg-white/80 border-2 border-slate-100 rounded-3xl text-lg font-bold text-slate-700 placeholder:text-slate-300 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all outline-none resize-none shadow-inner"
            maxLength={500}
          />
          <div className="flex justify-end pr-4 mt-2">
             <div className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black tracking-widest">
                {feedback.length}/500 CHARS
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WordRiddleParticipation({
  activity,
  onResponseChange,
  isSubmitted
}: {
  activity: WordRiddleActivity;
  onResponseChange: (response: ActivityParticipationResponse) => void;
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
    <div className="glass-card p-10 bg-indigo-600 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
         <Search size={300} className="translate-x-1/2 translate-y-1/2" />
      </div>
      
      <div className="relative z-10 space-y-10">
        <div className="space-y-6">
           <span className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black tracking-widest uppercase">
              Mystery Enigma
           </span>
           <h3 className="text-3xl font-black leading-tight uppercase tracking-tight">{activity.riddle}</h3>
        </div>

        {activity.hints && activity.hints.length > 0 && (
          <div className="space-y-3">
             <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Available Intel:</h4>
             <div className="grid gap-2">
                {activity.hints.map((hint, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md">
                     <HelpCircle size={16} className="text-indigo-200" />
                     <p className="text-sm font-bold tracking-tight text-white/90">{hint}</p>
                  </div>
                ))}
             </div>
          </div>
        )}
        
        <div className="space-y-4 pt-6">
          <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">
            Input Decryption
          </label>
          <input
            type="text"
            value={answer}
            onChange={(e) => !isSubmitted && setAnswer(e.target.value)}
            disabled={isSubmitted}
            placeholder="Type your solution..."
            className="w-full bg-white/20 border-2 border-white/30 rounded-2xl p-6 text-xl font-black text-white placeholder:text-white/30 focus:ring-8 focus:ring-white/10 focus:border-white transition-all outline-none uppercase tracking-[0.2em]"
          />
        </div>
      </div>
    </div>
  );
}

function TreasureHuntParticipation({
  activity,
  onResponseChange,
  isSubmitted
}: {
  activity: TreasureHuntActivity;
  onResponseChange: (response: ActivityParticipationResponse) => void;
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
    <div className="space-y-6">
      <div className="glass-card p-6 bg-white/60 border-indigo-50/50 shadow-sm flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
               <MapPin size={24} />
            </div>
            <div className="space-y-1">
               <h4 className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-none">Expedition Map</h4>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentClue + 1} OF {cluesLength} MARKERS FOUND</p>
            </div>
         </div>
         <div className="w-24">
            <Progress value={progress} className="h-2 bg-slate-100" />
         </div>
      </div>

      <div className="glass-card p-10 bg-slate-900 text-white shadow-2xl relative overflow-hidden">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.15),transparent)] pointer-events-none" />
         
         <div className="relative z-10 space-y-10">
            <div className="space-y-4">
               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Marker Location #{currentClue + 1}</span>
               <div className="p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
                  <p className="text-2xl font-bold tracking-tight italic leading-relaxed text-indigo-100">
                    "{activity.clues && activity.clues[currentClue] ? activity.clues[currentClue].text : ''}"
                  </p>
               </div>
            </div>
            
            {!answers[currentClue] && !isSubmitted && (
              <div className="pt-4">
                 <ClueAnswerInput onSubmit={handleAnswerSubmit} />
              </div>
            )}
            
            {answers[currentClue] && (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-4 animate-in fade-in zoom-in-95">
                 <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                    <Check size={20} className="text-white" />
                 </div>
                 <div className="space-y-1">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">COORDINATES EXTRACTED</span>
                    <p className="text-xl font-black text-white">{answers[currentClue]}</p>
                 </div>
              </div>
            )}
         </div>
      </div>
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
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Enter location data..."
        className="flex-1 bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-lg font-bold text-white placeholder:text-white/20 focus:ring-8 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
      />
      <button 
        type="submit" 
        disabled={!answer.trim()}
        className="px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg transition-all active:scale-90 disabled:opacity-30"
      >
        <ArrowRight size={20} strokeWidth={3} />
      </button>
    </form>
  );
}

function PairingParticipation({
  activity,
  onResponseChange,
  isSubmitted
}: {
  activity: PairingActivity;
  onResponseChange: (response: ActivityParticipationResponse) => void;
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
    <div className="glass-card p-10 bg-white/60 border-indigo-100/50 space-y-10 shadow-2xl">
      <div className="space-y-4 text-center">
         <div className="w-16 h-16 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-100/50 rotate-3">
            <LinkIcon className="w-8 h-8 text-indigo-600 -rotate-3" />
         </div>
         <h3 className="text-2xl font-black text-slate-800 leading-tight uppercase tracking-tight">Conceptual Nexus</h3>
      </div>

      <div className="space-y-4">
        {(activity.leftItems || []).map(leftItem => {
          const paired = getPairedRightId(leftItem.id);
          return (
            <div key={leftItem.id} className="flex items-center gap-4 group">
              <div className="flex-1 p-5 glass-card bg-indigo-50 border-indigo-100/50 shadow-sm text-center">
                <span className="font-black text-indigo-800 text-sm">{leftItem.text}</span>
              </div>
              
              <div className={`p-2 rounded-full transition-all ${paired ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                 <ArrowRight size={16} strokeWidth={3} />
              </div>
              
              <div className="flex-1">
                <select
                  value={paired || ''}
                  onChange={(e) => handlePairSelect(leftItem.id, e.target.value)}
                  disabled={isSubmitted}
                  className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none text-center cursor-pointer disabled:opacity-50"
                >
                  <option value="">AWAITING MATCH</option>
                  {(activity.rightItems || []).map(rightItem => (
                    <option key={rightItem.id} value={rightItem.id}>
                      {rightItem.text.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScenarioParticipation({
  activity,
  onResponseChange,
  isSubmitted
}: {
  activity: ScenarioActivity;
  onResponseChange: (response: ActivityParticipationResponse) => void;
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
    <div className="space-y-6">
      <div className="glass-card p-10 bg-slate-900 text-white shadow-2xl relative overflow-hidden">
         <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px]" />
         <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                  <Trophy className="w-6 h-6 text-indigo-400" />
               </div>
               <h3 className="text-xl font-black text-indigo-100 uppercase tracking-widest leading-none">Decision Terminal</h3>
            </div>
            <div className="p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-2xl">
               <p className="text-xl font-medium tracking-tight leading-relaxed italic text-white/90">
                 "{activity.scenario}"
               </p>
            </div>
         </div>
      </div>

      <div className="glass-card p-10 bg-white/80 border-indigo-100/50 shadow-xl space-y-8">
        <div className="space-y-4">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">Protocol Selection</h4>
           <div className="grid gap-3">
              {activity.choices.map(choice => (
                <button
                  key={choice.id}
                  onClick={() => !isSubmitted && setSelectedChoice(choice.id)}
                  disabled={isSubmitted}
                  className={`w-full p-6 text-left rounded-2xl border-2 transition-all group relative overflow-hidden ${
                    selectedChoice === choice.id
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-slate-100 bg-white hover:border-indigo-100 shadow-sm'
                  } ${isSubmitted ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all mt-1 ${
                      selectedChoice === choice.id ? 'border-indigo-600' : 'border-slate-100'
                    }`}>
                      {selectedChoice === choice.id && <div className="w-3 h-3 bg-indigo-600 rounded-full animate-in zoom-in" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className={`text-lg font-black tracking-tighter uppercase ${selectedChoice === choice.id ? 'text-indigo-800' : 'text-slate-700'}`}>
                         {choice.text}
                      </div>
                      {choice.description && (
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{choice.description}</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
           </div>
        </div>
        
        {activity.requireReasoning && (
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 text-center">
              Strategic Rationale
            </label>
            <textarea
              value={reasoning}
              onChange={(e) => !isSubmitted && setReasoning(e.target.value)}
              disabled={isSubmitted}
              placeholder="Justify your decision protocol..."
              className="w-full h-32 p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold text-slate-700 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all outline-none resize-none"
              maxLength={300}
            />
            <div className="flex justify-end pr-4 mt-2">
               <div className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black tracking-widest">
                  {reasoning.length}/300 CHARS
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}