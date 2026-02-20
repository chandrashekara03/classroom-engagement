'use client';

import * as React from 'react';
import { Clock, Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './Button';
import { Progress } from './Progress';

export interface TimerProps {
  duration: number; // in seconds
  autoStart?: boolean;
  onComplete?: () => void;
  onTick?: (remaining: number) => void;
  className?: string;
  showControls?: boolean;
  variant?: 'default' | 'warning' | 'danger';
}

export function Timer({
  duration,
  autoStart = false,
  onComplete,
  onTick,
  className,
  showControls = false
}: TimerProps) {
  const [remaining, setRemaining] = React.useState(duration);
  const [isRunning, setIsRunning] = React.useState(autoStart);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (isRunning && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          const newValue = prev - 1;
          onTick?.(newValue);
          
          if (newValue === 0) {
            setIsRunning(false);
            onComplete?.();
          }
          
          return newValue;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, remaining, onTick, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggle = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setRemaining(duration);
  };

  const progress = ((duration - remaining) / duration) * 100;
  const isExpired = remaining === 0;
  const isWarning = remaining <= 30 && remaining > 0;

  return (
    <div className={cn('flex flex-col space-y-3', className)}>
      <div className="flex items-center space-x-2">
        <Clock className="h-5 w-5 text-slate-600" />
        <span 
          className={cn(
            'text-2xl font-mono font-bold',
            isExpired && 'text-red-600',
            isWarning && 'text-amber-600'
          )}
        >
          {formatTime(remaining)}
        </span>
      </div>
      
      <Progress 
        value={progress} 
        className={cn(
          'h-2',
          isExpired && '[&>div]:bg-red-600',
          isWarning && '[&>div]:bg-amber-500'
        )}
      />
      
      {showControls && (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant={isRunning ? "secondary" : "default"}
            onClick={handleToggle}
            disabled={remaining === 0}
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                Start
              </>
            )}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}