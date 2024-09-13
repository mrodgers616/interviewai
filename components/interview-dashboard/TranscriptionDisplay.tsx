import React, { FC } from 'react';

interface TranscriptionDisplayProps {
  transcription: string;
}

export const TranscriptionDisplay: FC<TranscriptionDisplayProps> = ({ transcription }) => {
  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Live Transcription</h3>
      <p className="text-sm">{transcription || 'Waiting for speech...'}</p>
    </div>
  );
};