'use client';

import * as React from 'react';
import { Users, UserPlus, UserMinus, Wifi, WifiOff, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { Badge } from './Badge';

interface Participant {
  id: string;
  name: string;
  isOnline: boolean;
  isActive: boolean; // engaged in current activity
  joinedAt: Date;
  lastSeen?: Date;
}

export interface ParticipantCounterProps {
  participants: Participant[];
  showDetails?: boolean;
  showOnlineStatus?: boolean;
  showActivityStatus?: boolean;
  maxDisplayed?: number;
  className?: string;
  onToggleDetails?: () => void;
}

export function ParticipantCounter({
  participants,
  showDetails = false,
  showOnlineStatus = true,
  showActivityStatus = false,
  maxDisplayed = 5,
  className,
  onToggleDetails
}: ParticipantCounterProps) {
  const totalCount = participants.length;
  const onlineCount = participants.filter(p => p.isOnline).length;
  const activeCount = participants.filter(p => p.isActive).length;
  
  const recentJoins = React.useMemo(() => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    return participants.filter(p => p.joinedAt > fiveMinutesAgo).length;
  }, [participants]);
  
  const displayedParticipants = participants
    .sort((a, b) => {
      // Sort by: online first, then active, then by join time
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return b.joinedAt.getTime() - a.joinedAt.getTime();
    })
    .slice(0, showDetails ? undefined : maxDisplayed);
  
  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={cn('bg-white rounded-lg border border-slate-200 overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-slate-600" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900">
                  {totalCount} {totalCount === 1 ? 'Participant' : 'Participants'}
                </span>
                
                {showOnlineStatus && (
                  <Badge variant={onlineCount === totalCount ? 'success' : 'secondary'}>
                    <Wifi className="h-3 w-3 mr-1" />
                    {onlineCount} online
                  </Badge>
                )}
                
                {showActivityStatus && (
                  <Badge variant="active">
                    <Eye className="h-3 w-3 mr-1" />
                    {activeCount} active
                  </Badge>
                )}
              </div>
              
              {recentJoins > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  <UserPlus className="h-3 w-3 inline mr-1" />
                  {recentJoins} joined recently
                </p>
              )}
            </div>
          </div>
          
          {onToggleDetails && (
            <button
              onClick={onToggleDetails}
              className="p-1 rounded hover:bg-slate-200 transition-colors"
            >
              {showDetails ? (
                <EyeOff className="h-4 w-4 text-slate-600" />
              ) : (
                <Eye className="h-4 w-4 text-slate-600" />
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Participant List */}
      {showDetails ? (
        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
          {displayedParticipants.map((participant) => (
            <div key={participant.id} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-slate-600">
                      {participant.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className={cn(
                    'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
                    participant.isOnline
                      ? 'bg-green-500'
                      : 'bg-slate-400'
                  )} />
                </div>
                
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{participant.name}</p>
                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <span>
                      Joined {formatLastSeen(participant.joinedAt)}
                    </span>
                    
                    {!participant.isOnline && participant.lastSeen && (
                      <span>• Last seen {formatLastSeen(participant.lastSeen)}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {showActivityStatus && (
                  <Badge 
                    variant={participant.isActive ? 'success' : 'secondary'}
                    className="text-xs"
                  >
                    {participant.isActive ? 'Active' : 'Idle'}
                  </Badge>
                )}
                
                {participant.isOnline ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-slate-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Compact View
        <div className="px-4 py-3">
          <div className="flex items-center space-x-2">
            {/* Avatar Stack */}
            <div className="flex -space-x-2">
              {displayedParticipants.slice(0, 4).map((participant, index) => (
                <div
                  key={participant.id}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center relative',
                    !participant.isOnline && 'opacity-50'
                  )}
                  style={{ zIndex: 4 - index }}
                >
                  <span className="text-xs font-medium text-slate-600">
                    {participant.name.charAt(0).toUpperCase()}
                  </span>
                  
                  {/* Online indicator */}
                  {participant.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" />
                  )}
                </div>
              ))}
              
              {totalCount > 4 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-300 flex items-center justify-center">
                  <span className="text-xs font-medium text-slate-600">
                    +{totalCount - 4}
                  </span>
                </div>
              )}
            </div>
            
            {totalCount > maxDisplayed && (
              <span className="text-sm text-slate-500 ml-2">
                and {totalCount - maxDisplayed} others
              </span>
            )}
          </div>
          
          {totalCount === 0 && (
            <div className="text-center py-4">
              <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm text-slate-500">No participants yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}