'use client';

import * as React from 'react';
import { Users, Shuffle, UserCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './Button';
import { Card } from './Card';
import { Badge } from './Badge';

interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  isPresent?: boolean;
}

interface Group {
  id: string;
  name?: string;
  members: GroupMember[];
  color?: string;
}

export interface GroupDisplayProps {
  groups: Group[];
  title?: string;
  showShuffle?: boolean;
  showMemberStatus?: boolean;
  onShuffle?: () => void;
  onGroupClick?: (groupId: string) => void;
  maxMembersPerGroup?: number;
  className?: string;
}

const groupColors = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-amber-100 border-amber-300 text-amber-800',
  'bg-red-100 border-red-300 text-red-800',
  'bg-indigo-100 border-indigo-300 text-indigo-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-cyan-100 border-cyan-300 text-cyan-800'
];

export function GroupDisplay({
  groups,
  title = 'Groups',
  showShuffle = false,
  showMemberStatus = false,
  onShuffle,
  onGroupClick,
  maxMembersPerGroup,
  className
}: GroupDisplayProps) {
  const totalMembers = groups.reduce((sum, group) => sum + group.members.length, 0);
  const presentMembers = showMemberStatus 
    ? groups.reduce((sum, group) => 
        sum + group.members.filter(member => member.isPresent).length, 0
      )
    : totalMembers;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-slate-600" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-600">
              {groups.length} {groups.length === 1 ? 'group' : 'groups'} • {' '}
              {showMemberStatus ? (
                <>
                  {presentMembers}/{totalMembers} present
                </>
              ) : (
                `${totalMembers} ${totalMembers === 1 ? 'member' : 'members'}`
              )}
            </p>
          </div>
        </div>
        
        {showShuffle && (
          <Button
            onClick={onShuffle}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Shuffle className="h-4 w-4" />
            <span>Shuffle</span>
          </Button>
        )}
      </div>
      
      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {groups.map((group, index) => {
          const colorClass = group.color || groupColors[index % groupColors.length];
          const presentCount = showMemberStatus 
            ? group.members.filter(member => member.isPresent).length
            : group.members.length;
          
          return (
            <Card
              key={group.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md border-2',
                colorClass.split(' ')[1], // extract border color
                onGroupClick && 'hover:scale-[1.02]'
              )}
              onClick={() => onGroupClick?.(group.id)}
            >
              <div className="p-4">
                {/* Group Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                      colorClass
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {group.name || `Group ${index + 1}`}
                      </h4>
                    </div>
                  </div>
                  
                  <Badge variant="secondary" className="text-xs">
                    {group.members.length}
                    {maxMembersPerGroup && `/${maxMembersPerGroup}`}
                  </Badge>
                </div>
                
                {/* Members List */}
                <div className="space-y-2">
                  {group.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center space-x-2 text-sm"
                    >
                      {member.avatar ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-slate-600">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      
                      <span className={cn(
                        'flex-1 truncate',
                        showMemberStatus && !member.isPresent && 'text-slate-400 line-through'
                      )}>
                        {member.name}
                      </span>
                      
                      {showMemberStatus && (
                        <div className="flex-shrink-0">
                          {member.isPresent ? (
                            <UserCheck className="h-4 w-4 text-green-600" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {group.members.length === 0 && (
                    <div className="text-center py-4 text-slate-400">
                      <Users className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-xs">Empty group</p>
                    </div>
                  )}
                </div>
                
                {showMemberStatus && presentCount !== group.members.length && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-xs text-slate-600">
                      {presentCount}/{group.members.length} present
                    </p>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      
      {groups.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 mx-auto mb-4 text-slate-300" />
          <h4 className="text-lg font-semibold text-slate-600 mb-2">No groups yet</h4>
          <p className="text-slate-500">
            Groups will appear here when participants join the session
          </p>
        </div>
      )}
    </div>
  );
}