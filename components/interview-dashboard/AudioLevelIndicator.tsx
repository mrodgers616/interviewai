import React, { FC } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface AudioLevelIndicatorProps {
  isMicOn: boolean;
  isAudioActive: boolean;
}

export const AudioLevelIndicator: FC<AudioLevelIndicatorProps> = ({ isMicOn, isAudioActive }) => {
  return (
    <div className="absolute bottom-4 left-4">
      {isMicOn ? (
        <Mic className={`text-2xl ${isAudioActive ? 'text-green-500 animate-pulse' : 'text-white'}`} />
      ) : (
        <MicOff className="text-white text-2xl" />
      )}
    </div>
  );
};