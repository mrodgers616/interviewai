import React, { FC } from 'react';
import { Loader } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ControlButtonsProps {
  isInterviewStarted: boolean;
  isLoading: boolean;
  isMicOn: boolean;
  isCameraOn: boolean;
  isCameraAvailable: boolean;
  startMedia: () => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  endCall: () => void;
}

export const ControlButtons: FC<ControlButtonsProps> = ({
  isInterviewStarted,
  isLoading,
  isMicOn,
  isCameraOn,
  isCameraAvailable,
  startMedia,
  toggleMic,
  toggleCamera,
  endCall,
}) => {
  if (!isInterviewStarted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Start Interview</CardTitle>
        </CardHeader>
        <CardContent>
          <button 
            className="w-full py-2 bg-green-500 text-white rounded-md flex items-center justify-center"
            onClick={startMedia}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader className="animate-spin mr-2" />
                Loading...
              </>
            ) : (
              'Begin Interview'
            )}
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-center">Microphone</CardTitle>
        </CardHeader>
        <CardContent>
          <button 
            className={`w-full py-2 ${isMicOn ? 'bg-blue-500' : 'bg-gray-500'} text-white rounded-md`}
            onClick={toggleMic}
          >
            {isMicOn ? 'Mute' : 'Unmute'}
          </button>
          <p className="text-center mt-2">{isMicOn ? 'Mic is on' : 'Mic is muted'}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-center">Camera</CardTitle>
        </CardHeader>
        <CardContent>
          {isCameraAvailable ? (
            <>
              <button 
                className={`w-full py-2 ${isCameraOn ? 'bg-blue-500' : 'bg-gray-500'} text-white rounded-md`}
                onClick={toggleCamera}
              >
                {isCameraOn ? 'Turn Off' : 'Turn On'}
              </button>
              <p className="text-center mt-2">{isCameraOn ? 'Camera is on' : 'Camera is off'}</p>
            </>
          ) : (
            <p className="text-center">Camera not available</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-center">Call</CardTitle>
        </CardHeader>
        <CardContent>
          <button 
            className="w-full py-2 bg-red-500 text-white rounded-md"
            onClick={endCall}
          >
            End Call
          </button>
        </CardContent>
      </Card>
    </div>
  );
};