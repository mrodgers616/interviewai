import React, { FC } from 'react';
import { Clock } from 'lucide-react';
import { Switch } from "@/components/ui/switch";

interface TimerDisplayProps {
  isInterviewStarted: boolean;
  isTimerEnabled: boolean;
  interviewTime: number;
  toggleTimer: () => void;
}

export const TimerDisplay: FC<TimerDisplayProps> = ({
  isInterviewStarted,
  isTimerEnabled,
  interviewTime,
  toggleTimer,
}) => {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isInterviewStarted) return null;

  return (
    <div className="flex items-center justify-center mt-4 space-x-4">
      <span className="text-sm font-medium">
        {isTimerEnabled ? 'Hide Timer' : 'Show Timer'}
      </span>
      <Switch
        checked={isTimerEnabled}
        onCheckedChange={toggleTimer}
      />
      {isTimerEnabled && (
        <div className="flex items-center">
          <Clock className="mr-2" />
          <span className="text-lg font-semibold">{formatTime(interviewTime)}</span>
        </div>
      )}
    </div>
  );
};