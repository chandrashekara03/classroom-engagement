'use client';

import * as React from 'react';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import {
  Play,
  Clock,
  Users,
  Settings,
  HelpCircle,
  BarChart3,
  MessageCircle,
  Search,
  Target
} from 'lucide-react';
import { cn } from '../lib/utils';

type ActivityType =
  | 'quiz'
  | 'poll'
  | 'feedback'
  | 'word-riddle'
  | 'treasure-hunt'
  | 'pairing'
  | 'scenario';

interface ActivityConfig {
  duration?: number;
  maxParticipants?: number;
  scoringEnabled: boolean;
  randomizeQuestions?: boolean;
}

export interface ActivityCardProps {
  id: string;
  title: string;
  type: ActivityType;
  description?: string;
  config: ActivityConfig;
  isActive?: boolean;
  participantCount?: number;
  createdAt?: Date;
  lastUsed?: Date;
  onStart?: () => void;
  onEdit?: () => void;
  onConfigure?: () => void;
  className?: string;
}

const activityIcons: Record<ActivityType, React.ElementType> = {
  quiz: HelpCircle,
  poll: BarChart3,
  feedback: MessageCircle,
  'word-riddle': Search,
  'treasure-hunt': Target,
  pairing: Users,
  scenario: Users
};

const activityColors: Record<ActivityType, string> = {
  quiz: 'bg-blue-100 text-blue-800',
  poll: 'bg-green-100 text-green-800',
  feedback: 'bg-purple-100 text-purple-800',
  'word-riddle': 'bg-amber-100 text-amber-800',
  'treasure-hunt': 'bg-red-100 text-red-800',
  pairing: 'bg-indigo-100 text-indigo-800',
  scenario: 'bg-pink-100 text-pink-800'
};

export function ActivityCard({
  id,
  title,
  type,
  description,
  config,
  isActive = false,
  participantCount = 0,
  createdAt,
  lastUsed,
  onStart,
  onEdit,
  onConfigure,
  className
}: ActivityCardProps) {
  const IconComponent = activityIcons[type];
  const colorClass = activityColors[type];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card className={cn('relative overflow-hidden transition-all hover:shadow-lg', className)}>
      {isActive && (
        <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={cn('p-2 rounded-lg', colorClass)}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-900">{title}</h3>
              <Badge variant="outline" className="mt-1">
                {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
          </div>

          {isActive && (
            <Badge variant="success">
              Active
            </Badge>
          )}
        </div>

        {description && (
          <p className="text-slate-600 text-sm mb-4 line-clamp-2">
            {description}
          </p>
        )}

        <div className="flex items-center space-x-4 text-sm text-slate-500 mb-4">
          {config.duration && (
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{Math.floor(config.duration / 60)}m</span>
            </div>
          )}

          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>
              {isActive ? `${participantCount} active` :
               config.maxParticipants ? `Max ${config.maxParticipants}` : 'Unlimited'}
            </span>
          </div>

          {config.scoringEnabled && (
            <Badge variant="secondary" className="text-xs">
              Scored
            </Badge>
          )}
        </div>

        {(createdAt || lastUsed) && (
          <div className="text-xs text-slate-400 mb-4">
            {lastUsed ? (
              <span>Last used: {formatDate(lastUsed)}</span>
            ) : createdAt ? (
              <span>Created: {formatDate(createdAt)}</span>
            ) : null}
          </div>
        )}

        <div className="flex space-x-2">
          <Button
            onClick={onStart}
            disabled={isActive}
            className="flex-1"
            variant={isActive ? 'secondary' : 'primary'}
          >
            <Play className="h-4 w-4 mr-2" />
            {isActive ? 'Running' : 'Start'}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={onConfigure}
            className="shrink-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}