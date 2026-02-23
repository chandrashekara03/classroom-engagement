'use client';

import * as React from 'react';
import { Trophy, Medal, Award, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { Badge } from './Badge';

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  rank: number;
  avatar?: string;
  isCurrentUser?: boolean;
  completionTime?: number; // in seconds
  correctAnswers?: number;
  totalAnswers?: number;
}

export interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  showAvatar?: boolean;
  showCompletionTime?: boolean;
  showAccuracy?: boolean;
  maxEntries?: number;
  className?: string;
}

export function LeaderboardTable({
  entries,
  showAvatar = false,
  showCompletionTime = false,
  showAccuracy = false,
  maxEntries,
  className
}: LeaderboardTableProps) {
  const displayEntries = maxEntries ? entries.slice(0, maxEntries) : entries;
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-semibold text-slate-500">#{rank}</span>;
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getAccuracy = (correct: number, total: number) => {
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };

  return (
    <div className={cn('overflow-hidden rounded-lg border border-slate-200 bg-white', className)}>
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center">
          <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
          Leaderboard
        </h3>
      </div>
      
      <div className="divide-y divide-slate-100">
        {displayEntries.map((entry) => (
          <div
            key={entry.id}
            className={cn(
              'px-6 py-4 flex items-center justify-between transition-colors hover:bg-slate-50',
              entry.isCurrentUser && 'bg-blue-50 border-l-4 border-l-blue-500'
            )}
          >
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex items-center justify-center w-8">
                {getRankIcon(entry.rank)}
              </div>
              
              <div className="flex items-center space-x-3 flex-1">
                {showAvatar && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                    {entry.avatar ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img 
                        src={entry.avatar} 
                        alt={entry.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4 text-slate-500" />
                    )}
                  </div>
                )}
                
                <div className="flex-1">
                  <p className={cn(
                    'font-medium text-slate-900',
                    entry.isCurrentUser && 'text-blue-900'
                  )}>
                    {entry.name}
                    {entry.isCurrentUser && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        You
                      </Badge>
                    )}
                  </p>
                  
                  {(showCompletionTime || showAccuracy) && (
                    <div className="flex items-center space-x-4 mt-1 text-xs text-slate-500">
                      {showCompletionTime && entry.completionTime && (
                        <span>Time: {formatTime(entry.completionTime)}</span>
                      )}
                      
                      {showAccuracy && entry.correctAnswers !== undefined && entry.totalAnswers !== undefined && (
                        <span>
                          Accuracy: {getAccuracy(entry.correctAnswers, entry.totalAnswers)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={cn(
                'text-lg font-bold',
                entry.rank <= 3 ? 'text-yellow-600' : 'text-slate-900'
              )}>
                {entry.score}
              </div>
              <div className="text-xs text-slate-500">points</div>
            </div>
          </div>
        ))}
        
        {displayEntries.length === 0 && (
          <div className="px-6 py-8 text-center text-slate-500">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p>No participants yet</p>
          </div>
        )}
      </div>
      
      {maxEntries && entries.length > maxEntries && (
        <div className="px-6 py-3 bg-slate-50 text-center text-sm text-slate-600">
          Showing top {maxEntries} of {entries.length} participants
        </div>
      )}
    </div>
  );
}