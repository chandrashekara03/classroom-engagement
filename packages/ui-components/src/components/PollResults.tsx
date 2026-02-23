'use client';

import * as React from 'react';
import { BarChart3, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { Badge } from './Badge';

interface PollOption {
  id: string;
  text: string;
  votes: number;
  color?: string;
}

export interface PollResultsProps {
  question: string;
  options: PollOption[];
  totalVotes: number;
  showPercentage?: boolean;
  showVoteCount?: boolean;
  layout?: 'vertical' | 'horizontal';
  animated?: boolean;
  className?: string;
}

const defaultColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-red-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-cyan-500'
];

export function PollResults({
  question,
  options,
  totalVotes,
  showPercentage = true,
  showVoteCount = true,
  layout = 'vertical',
  animated = true,
  className
}: PollResultsProps) {
  const getPercentage = (votes: number) => {
    return totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
  };
  
  const sortedOptions = [...options].sort((a, b) => b.votes - a.votes);
  const maxVotes = Math.max(...options.map(opt => opt.votes), 1);

  return (
    <div className={cn('bg-white rounded-lg border border-slate-200 overflow-hidden', className)}>
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{question}</h3>
            <div className="flex items-center space-x-4 text-sm text-slate-600">
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <BarChart3 className="h-4 w-4" />
                <span>{options.length} options</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {layout === 'vertical' ? (
          <div className="space-y-4">
            {sortedOptions.map((option, index) => {
              const percentage = getPercentage(option.votes);
              const isWinner = index === 0 && option.votes > 0;
              const color = option.color || defaultColors[index % defaultColors.length];
              
              return (
                <div key={option.id} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 flex-1">
                      <div 
                        className={cn(
                          'w-3 h-3 rounded-full',
                          color
                        )}
                      />
                      <span className={cn(
                        'font-medium text-slate-900',
                        isWinner && 'text-green-700'
                      )}>
                        {option.text}
                        {isWinner && (
                          <Badge variant="success" className="ml-2 text-xs">
                            Leading
                          </Badge>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      {showVoteCount && (
                        <span className="text-slate-600">
                          {option.votes}
                        </span>
                      )}
                      {showPercentage && (
                        <span className="text-slate-500 min-w-[3rem] text-right">
                          {percentage.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500 ease-out',
                        color,
                        !animated && 'duration-0'
                      )}
                      style={{ 
                        width: `${percentage}%`,
                        transitionDelay: animated ? `${index * 100}ms` : '0ms'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Horizontal bar chart layout
          <div className="space-y-3">
            {sortedOptions.map((option, index) => {
              const percentage = getPercentage(option.votes);
              const barWidth = (option.votes / maxVotes) * 100;
              const isWinner = index === 0 && option.votes > 0;
              const color = option.color || defaultColors[index % defaultColors.length];
              
              return (
                <div key={option.id} className="flex items-center space-x-4">
                  <div className="w-1/3 text-right">
                    <span className={cn(
                      'text-sm font-medium text-slate-900',
                      isWinner && 'text-green-700'
                    )}>
                      {option.text}
                      {isWinner && ' 🏆'}
                    </span>
                  </div>
                  
                  <div className="flex-1 relative">
                    <div className="h-6 bg-slate-100 rounded overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded transition-all duration-500 ease-out',
                          color
                        )}
                        style={{ 
                          width: `${barWidth}%`,
                          transitionDelay: animated ? `${index * 100}ms` : '0ms'
                        }}
                      />
                    </div>
                    
                    {showVoteCount && option.votes > 0 && (
                      <span className="absolute left-2 top-0 h-6 flex items-center text-xs font-medium text-white">
                        {option.votes}
                      </span>
                    )}
                  </div>
                  
                  {showPercentage && (
                    <div className="w-12 text-sm text-slate-600 text-right">
                      {percentage.toFixed(1)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {totalVotes === 0 && (
          <div className="text-center py-8 text-slate-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p>No votes yet</p>
            <p className="text-sm mt-1">Results will appear as participants vote</p>
          </div>
        )}
      </div>
    </div>
  );
}