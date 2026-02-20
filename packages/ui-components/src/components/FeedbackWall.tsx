'use client';

import * as React from 'react';
import { MessageCircle, Heart, ThumbsUp, Flag, User, Clock, Filter } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './Button';
import { Badge } from './Badge';
import { Input } from './Input';

type FeedbackType = 'comment' | 'question' | 'suggestion' | 'concern';

interface FeedbackItem {
  id: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    anonymous?: boolean;
  };
  type: FeedbackType;
  timestamp: Date;
  likes: number;
  isLiked?: boolean;
  isReported?: boolean;
  isPinned?: boolean;
  moderatorNote?: string;
}

export interface FeedbackWallProps {
  items: FeedbackItem[];
  allowSubmission?: boolean;
  allowLikes?: boolean;
  allowReporting?: boolean;
  showModerationControls?: boolean;
  filterByType?: FeedbackType[];
  onSubmitFeedback?: (content: string, type: FeedbackType) => void;
  onLike?: (itemId: string) => void;
  onReport?: (itemId: string) => void;
  onPin?: (itemId: string) => void;
  className?: string;
}

const feedbackTypeConfig = {
  comment: { label: 'Comment', color: 'bg-blue-100 text-blue-800', icon: MessageCircle },
  question: { label: 'Question', color: 'bg-purple-100 text-purple-800', icon: MessageCircle },
  suggestion: { label: 'Suggestion', color: 'bg-green-100 text-green-800', icon: MessageCircle },
  concern: { label: 'Concern', color: 'bg-amber-100 text-amber-800', icon: Flag }
};

export function FeedbackWall({
  items,
  allowSubmission = true,
  allowLikes = true,
  allowReporting = false,
  showModerationControls = false,
  filterByType,
  onSubmitFeedback,
  onLike,
  onReport,
  onPin,
  className
}: FeedbackWallProps) {
  const [newFeedback, setNewFeedback] = React.useState('');
  const [selectedType, setSelectedType] = React.useState<FeedbackType>('comment');
  const [typeFilter, setTypeFilter] = React.useState<FeedbackType | 'all'>('all');
  
  const filteredItems = React.useMemo(() => {
    let filtered = items;
    
    if (filterByType) {
      filtered = filtered.filter(item => filterByType.includes(item.type));
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }
    
    // Sort: pinned first, then by timestamp
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [items, filterByType, typeFilter]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFeedback.trim() && onSubmitFeedback) {
      onSubmitFeedback(newFeedback.trim(), selectedType);
      setNewFeedback('');
    }
  };
  
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return timestamp.toLocaleDateString();
  };
  
  const typeCount = React.useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    items.forEach(item => {
      counts[item.type] = (counts[item.type] || 0) + 1;
    });
    return counts;
  }, [items]);

  return (
    <div className={cn('bg-white rounded-lg border border-slate-200 overflow-hidden', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-900">Feedback Wall</h3>
            <Badge variant="secondary">{items.length}</Badge>
          </div>
          
          {/* Type Filter */}
          <div className="flex items-center space-x-1">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as FeedbackType | 'all')}
              className="text-sm border border-slate-200 rounded px-2 py-1 bg-white"
            >
              <option value="all">All ({typeCount.all})</option>
              {Object.entries(feedbackTypeConfig).map(([type, config]) => (
                <option key={type} value={type}>
                  {config.label} ({typeCount[type as FeedbackType] || 0})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Submission Form */}
      {allowSubmission && (
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex space-x-2">
              {Object.entries(feedbackTypeConfig).map(([type, config]) => {
                const IconComponent = config.icon;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type as FeedbackType)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1',
                      selectedType === type
                        ? config.color
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </div>
            
            <div className="flex space-x-2">
              <Input
                value={newFeedback}
                onChange={(e) => setNewFeedback(e.target.value)}
                placeholder={`Share your ${feedbackTypeConfig[selectedType].label.toLowerCase()}...`}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!newFeedback.trim()}
                size="sm"
              >
                Post
              </Button>
            </div>
          </form>
        </div>
      )}
      
      {/* Feedback Items */}
      <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
        {filteredItems.map((item) => {
          const typeConfig = feedbackTypeConfig[item.type];
          const IconComponent = typeConfig.icon;
          
          return (
            <div
              key={item.id}
              className={cn(
                'px-6 py-4 hover:bg-slate-50 transition-colors',
                item.isPinned && 'bg-yellow-50 border-l-4 border-l-yellow-400'
              )}
            >
              {/* Content */}
              <div className="flex space-x-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {!item.author.anonymous && item.author.avatar ? (
                    <img
                      src={item.author.avatar}
                      alt={item.author.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                      <User className="h-4 w-4 text-slate-500" />
                    </div>
                  )}
                </div>
                
                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-slate-900">
                      {item.author.anonymous ? 'Anonymous' : item.author.name}
                    </span>
                    
                    <Badge variant="outline" className={cn('text-xs', typeConfig.color)}>
                      <IconComponent className="h-3 w-3 mr-1" />
                      {typeConfig.label}
                    </Badge>
                    
                    <div className="flex items-center space-x-1 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimestamp(item.timestamp)}</span>
                    </div>
                    
                    {item.isPinned && (
                      <Badge variant="warning" className="text-xs">
                        Pinned
                      </Badge>
                    )}
                  </div>
                  
                  {/* Content */}
                  <p className="text-slate-700 text-sm mb-2">{item.content}</p>
                  
                  {/* Moderator Note */}
                  {item.moderatorNote && (
                    <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded mb-2">
                      <strong>Moderator:</strong> {item.moderatorNote}
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-3">
                    {allowLikes && (
                      <button
                        onClick={() => onLike?.(item.id)}
                        className={cn(
                          'flex items-center space-x-1 text-xs transition-colors',
                          item.isLiked
                            ? 'text-red-600 hover:text-red-700'
                            : 'text-slate-500 hover:text-red-600'
                        )}
                      >
                        <Heart className={cn('h-4 w-4', item.isLiked && 'fill-current')} />
                        <span>{item.likes}</span>
                      </button>
                    )}
                    
                    {allowReporting && (
                      <button
                        onClick={() => onReport?.(item.id)}
                        className={cn(
                          'text-xs transition-colors',
                          item.isReported
                            ? 'text-amber-600'
                            : 'text-slate-500 hover:text-amber-600'
                        )}
                      >
                        <Flag className="h-4 w-4" />
                      </button>
                    )}
                    
                    {showModerationControls && (
                      <button
                        onClick={() => onPin?.(item.id)}
                        className={cn(
                          'text-xs transition-colors',
                          item.isPinned
                            ? 'text-yellow-600'
                            : 'text-slate-500 hover:text-yellow-600'
                        )}
                      >
                        {item.isPinned ? 'Unpin' : 'Pin'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {filteredItems.length === 0 && (
          <div className="px-6 py-12 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h4 className="text-lg font-semibold text-slate-600 mb-2">No feedback yet</h4>
            <p className="text-slate-500">
              {allowSubmission
                ? 'Be the first to share your thoughts!'
                : 'Feedback will appear here as participants submit it'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}