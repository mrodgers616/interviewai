import React, { FC } from 'react';

interface TranscriptionDisplayProps {
  transcription: string;
  currentQuestion: string;
  systemStatus: "idle" | "listening" | "processing" | "speaking";
}

export const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  transcription,
  currentQuestion,
  systemStatus 
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
      <div className="mt-2 text-xs text-gray-500 flex items-center">
        <span className="mr-2">Status:</span>
        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
          systemStatus === 'listening' ? 'bg-green-500' :
          systemStatus === 'processing' ? 'bg-yellow-500' :
          systemStatus === 'speaking' ? 'bg-blue-500' :
          'bg-gray-500'
        }`}></span>
        <span>{systemStatus}</span>
      </div>
    </div>
  );
};