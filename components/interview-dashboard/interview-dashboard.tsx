import { FC, useState, useRef, useEffect } from "react";
import Image from "next/image";
import { MainNav } from "@/components/demo-dashboard/main-nav";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Mic, MicOff, Loader } from 'lucide-react';

export const InterviewDashboard: FC = () => {
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isCameraAvailable, setIsCameraAvailable] = useState(true);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (isCameraOn && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOn, stream]);

  useEffect(() => {
    if (isMicOn && stream) {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const audioContext = audioContextRef.current;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setAudioLevel(average);
        setIsAudioActive(average > 10); // Adjust this threshold as needed
        requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [isMicOn, stream]);

  const startMedia = async () => {
    setIsLoading(true);
    console.log("here");
    try {
      console.log("Starting media...");
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      }).catch(() => {
        // If video fails, try audio only
        return navigator.mediaDevices.getUserMedia({ audio: true });
      });

      console.log("mediaStream " + mediaStream);
      if (mediaStream) {
        const audioTracks = mediaStream.getAudioTracks();
        const videoTracks = mediaStream.getVideoTracks();
        
        if (audioTracks.length > 0) {
          setStream(mediaStream);
          setIsMicOn(true);
          console.log("Audio started");
          
          if (videoTracks.length > 0) {
            setIsCameraOn(true);
            setIsCameraAvailable(true);
            console.log("Video started");
          } else {
            setIsCameraAvailable(false);
            console.log("Camera not available, continuing with audio only");
          }
          
          setIsInterviewStarted(true);
          console.log("Interview started");
        } else {
          console.error("Failed to start microphone");
          mediaStream.getTracks().forEach(track => track.stop());
        }
      } else {
        console.error("Failed to get media stream");
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isMicOn;
      });
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCamera = () => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach(track => {
          track.enabled = !isCameraOn;
        });
        setIsCameraOn(!isCameraOn);
      } else {
        console.log("No video tracks available");
      }
    }
  };

  const endCall = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsMicOn(false);
      setIsCameraOn(false);
      setIsInterviewStarted(false);
    }
  };

  return (
    <>
      <div className="md:hidden">
        <Image
          src="/examples/dashboard-light.png"
          width={1280}
          height={866}
          alt="Dashboard"
          className="block dark:hidden"
        />
        <Image
          src="/examples/dashboard-dark.png"
          width={1280}
          height={866}
          alt="Dashboard"
          className="hidden dark:block"
        />
      </div>
      <div className="hidden flex-col md:flex">
        <div className="flex items-end justify-between space-y-2 mb-6">
          <h2 className="text-3xl leading-5 font-bold tracking-tight">
            {isInterviewStarted ? "Interview in Progress" : "Start Interview"}
          </h2>
        </div>
        <div className="flex h-16 items-center bg-muted px-6 rounded-xl">
          <MainNav />
        </div>
        <div className="flex-1 space-y-4 pt-6">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Interview Practice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full max-w-4xl mx-auto relative">
                <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                  {isLoading ? (
                    <Loader className="animate-spin text-white text-4xl" />
                  ) : isInterviewStarted ? (
                    isCameraOn && isCameraAvailable ? (
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <p className="text-white text-lg">Camera is {isCameraAvailable ? 'off' : 'not available'}</p>
                    )
                  ) : (
                    <p className="text-white text-lg">Interview not started</p>
                  )}
                </div>
                {isInterviewStarted && (
                  <div className="absolute bottom-4 left-4">
                    {isMicOn ? (
                      <Mic className={`text-2xl ${isAudioActive ? 'text-green-500 animate-pulse' : 'text-white'}`} />
                    ) : (
                      <MicOff className="text-white text-2xl" />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          {!isInterviewStarted ? (
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
          ) : (
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
          )}
        </div>
      </div>
    </>
  );
};
