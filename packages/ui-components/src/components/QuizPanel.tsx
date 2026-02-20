'use client';

import * as React from 'react';
import { Check, X, Clock, HelpCircle, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './Button';
import { Progress } from './Progress';
import { Badge } from './Badge';

type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer';

interface QuizOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: QuizOption[];
  correctAnswer?: string;
  explanation?: string;
  points?: number;
}

export interface QuizPanelProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining?: number;
  showResults?: boolean;
  selectedAnswers?: string[];
  onAnswerSelect?: (answerId: string) => void;
  onSubmit?: () => void;
  onNext?: () => void;
  isSubmitted?: boolean;
  isMultiSelect?: boolean;
  className?: string;
}

export function QuizPanel({
  question,
  questionNumber,
  totalQuestions,
  timeRemaining,
  showResults = false,
  selectedAnswers = [],
  onAnswerSelect,
  onSubmit,
  onNext,
  isSubmitted = false,
  isMultiSelect = false,
  className
}: QuizPanelProps) {
  const [textAnswer, setTextAnswer] = React.useState('');
  
  const progress = (questionNumber / totalQuestions) * 100;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const isAnswerCorrect = (optionId: string) => {
    return question.options?.find(opt => opt.id === optionId)?.isCorrect;
  };
  
  const getOptionStatus = (optionId: string) => {
    if (!showResults) return null;
    
    const isSelected = selectedAnswers.includes(optionId);
    const isCorrect = isAnswerCorrect(optionId);
    
    if (isSelected && isCorrect) return 'correct';
    if (isSelected && !isCorrect) return 'incorrect';
    if (!isSelected && isCorrect) return 'missed';
    return null;
  };
  
  const handleOptionClick = (optionId: string) => {
    if (isSubmitted || showResults) return;
    onAnswerSelect?.(optionId);
  };
  
  const handleTextSubmit = () => {
    if (question.type === 'short-answer') {
      onAnswerSelect?.(textAnswer);
      onSubmit?.();
    }
  };

  return (
    <div className={cn('bg-white rounded-lg border border-slate-200 overflow-hidden', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            <Badge variant="outline">
              Question {questionNumber} of {totalQuestions}
            </Badge>
            {question.points && (
              <Badge variant="secondary">
                {question.points} {question.points === 1 ? 'point' : 'points'}
              </Badge>
            )}
          </div>
          
          {timeRemaining !== undefined && (
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4 text-slate-600" />
              <span className={cn(
                'font-mono',
                timeRemaining <= 10 && 'text-red-600 font-bold'
              )}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>
        
        <Progress value={progress} className="h-1" />
      </div>
      
      {/* Question */}
      <div className="px-6 py-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">
          {question.question}
        </h2>
        
        {/* Multiple Choice / True-False Options */}
        {(question.type === 'multiple-choice' || question.type === 'true-false') && question.options && (
          <div className="space-y-3">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswers.includes(option.id);
              const status = getOptionStatus(option.id);
              const letter = String.fromCharCode(65 + index); // A, B, C, D...
              
              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option.id)}
                  disabled={isSubmitted || showResults}
                  className={cn(
                    'w-full p-4 text-left border-2 rounded-lg transition-all',
                    'hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500',
                    isSelected && !showResults && 'border-blue-500 bg-blue-50',
                    !isSelected && !showResults && 'border-slate-200',
                    status === 'correct' && 'border-green-500 bg-green-50',
                    status === 'incorrect' && 'border-red-500 bg-red-50',
                    status === 'missed' && 'border-amber-500 bg-amber-50',
                    (isSubmitted || showResults) && 'cursor-default'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold',
                      isSelected && !showResults && 'border-blue-500 bg-blue-500 text-white',
                      !isSelected && !showResults && 'border-slate-300 text-slate-600',
                      status === 'correct' && 'border-green-500 bg-green-500 text-white',
                      status === 'incorrect' && 'border-red-500 bg-red-500 text-white',
                      status === 'missed' && 'border-amber-500 bg-amber-500 text-white'
                    )}>
                      {showResults && status === 'correct' && <Check className="h-4 w-4" />}
                      {showResults && status === 'incorrect' && <X className="h-4 w-4" />}
                      {showResults && status === 'missed' && <AlertCircle className="h-4 w-4" />}
                      {!showResults && letter}
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-slate-900">{option.text}</p>
                    </div>
                    
                    {showResults && option.isCorrect && (
                      <Badge variant="success" className="text-xs">
                        Correct
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        
        {/* Short Answer */}
        {question.type === 'short-answer' && (
          <div className="space-y-4">
            <textarea
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              disabled={isSubmitted || showResults}
              placeholder="Type your answer here..."
              className="w-full p-4 border-2 border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
            />
            
            {showResults && question.correctAnswer && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-semibold text-green-800 mb-1">Correct Answer:</p>
                <p className="text-green-700">{question.correctAnswer}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Explanation */}
        {showResults && question.explanation && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-800 mb-1">Explanation:</p>
            <p className="text-blue-700">{question.explanation}</p>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-between mt-8">
          <div className="flex items-center space-x-2">
            {isMultiSelect && !showResults && (
              <p className="text-sm text-slate-600">
                Select all that apply ({selectedAnswers.length} selected)
              </p>
            )}
          </div>
          
          <div className="flex space-x-3">
            {!isSubmitted && !showResults && (
              <Button
                onClick={question.type === 'short-answer' ? handleTextSubmit : onSubmit}
                disabled={
                  question.type === 'short-answer' 
                    ? !textAnswer.trim()
                    : selectedAnswers.length === 0
                }
                variant="primary"
              >
                Submit Answer
              </Button>
            )}
            
            {(isSubmitted || showResults) && onNext && (
              <Button
                onClick={onNext}
                variant="primary"
              >
                {questionNumber === totalQuestions ? 'Finish Quiz' : 'Next Question'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}