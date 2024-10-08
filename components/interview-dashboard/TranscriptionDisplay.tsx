import React, { FC } from 'react';

interface TranscriptionDisplayProps {
  transcription: string;
  currentQuestion: string;
}

export const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  transcription,
  currentQuestion
}) => {
  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Interview Dialogue</h3>
      <div className="mb-4">
        <h4 className="text-md font-semibold">Current Question:</h4>
        <p className="text-sm italic">{currentQuestion || 'Waiting for the first question...'}</p>
      </div>
      <div>
        <h4 className="text-md font-semibold">Your Response:</h4>
        <p className="text-sm">{transcription || 'Waiting for your response...'}</p>
      </div>
    </div>
  );
};