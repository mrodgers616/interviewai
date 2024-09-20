import React, { FC, useRef, useEffect } from 'react';
import { Loader } from 'lucide-react';

interface VideoDisplayProps {
  isLoading: boolean;
  isInterviewStarted: boolean;
  isCameraOn: boolean;
  isCameraAvailable: boolean;
  stream: MediaStream | null;
}

export const VideoDisplay: FC<VideoDisplayProps> = ({
  isLoading,
  isInterviewStarted,
  isCameraOn,
  isCameraAvailable,
  stream,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isCameraOn && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true; // Mute the video element to prevent audio feedback
    }
  }, [isCameraOn, stream]);

  return (
    <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
      {isLoading ? (
        <Loader className="animate-spin text-white text-4xl" />
      ) : isInterviewStarted ? (
        isCameraOn && isCameraAvailable ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted // Ensure the muted attribute is set
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <p className="text-white text-lg">
            Camera is {isCameraAvailable ? 'off' : 'not available'}
          </p>
        )
      ) : (
        <p className="text-white text-lg">Interview not started</p>
      )}
    </div>
  );
};
