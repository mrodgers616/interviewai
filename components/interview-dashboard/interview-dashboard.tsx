import { FC, ReactElement, useState, useRef, useEffect } from "react";
import Image from "next/image";
import { MainNav } from "@/components/demo-dashboard/main-nav";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Mic, MicOff, Loader, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import { Switch } from "@/components/ui/switch";

export const InterviewDashboard: FC = (): ReactElement => {
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isCameraAvailable, setIsCameraAvailable] = useState(true);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [interviewTime, setInterviewTime] = useState(0);
  const [isTimerEnabled, setIsTimerEnabled] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        const newIsAudioActive = average > 10; // Adjust this threshold as needed
        setIsAudioActive(newIsAudioActive);

        if (newIsAudioActive) {
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }
        } else {
          silenceTimeoutRef.current = setTimeout(() => {
            if (audioChunksRef.current.length > 0) {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              audioChunksRef.current = [];
            }
          }, 2000);
        }

        requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();

      // Set up MediaRecorder for streaming audio
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, [isMicOn, stream]);

  useEffect(() => {
    if (isInterviewStarted) {
      timerIntervalRef.current = setInterval(() => {
        setInterviewTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      setInterviewTime(0);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isInterviewStarted]);

  useEffect(() => {
    console.log("Interview started:", isInterviewStarted);
    console.log("Timer enabled:", isTimerEnabled);
    console.log("Interview time:", interviewTime);
  }, [isInterviewStarted, isTimerEnabled, interviewTime]);

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
          startSpeechRecognition(); // Add this line
          
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
      
      if (mediaRecorderRef.current) {
        if (isMicOn) {
          mediaRecorderRef.current.stop();
        } else {
          mediaRecorderRef.current.start(100);
        }
      }
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
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.stop();
      }
    }
  };

  const startSpeechRecognition = () => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        console.log("Starting speech recognition...");
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let lastTranscript = '';
        let silenceTimer: NodeJS.Timeout | null = null;

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          setTranscription((prev) => prev + ' ' + transcript);

          // Reset the silence timer
          if (silenceTimer) clearTimeout(silenceTimer);
          silenceTimer = setTimeout(() => {
            if (lastTranscript !== transcript) {
              sendTranscriptionToAI(transcript);
              lastTranscript = transcript;
              setTranscription('');
            }
          }, 1000); // Adjust this delay as needed
        };

        recognition.onend = () => {
          recognition.start();
        };

        recognition.start();
      } else {
        console.error('Speech recognition not supported');
      }
    }
  };

  const sendTranscriptionToAI = async (text: string) => {
    console.log("Sending transcription to AI:" + text);
    // Implement the logic to send the transcription to your AI model
    // This could involve making an API call to your AI service
    // Example:
    // await fetch('your-ai-endpoint', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ transcription: text })
    // });
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setIsTimerEnabled(!isTimerEnabled);
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
        <div className="flex items-center justify-between space-y-2 mb-6">
          <h2 className="text-3xl leading-5 font-bold tracking-tight">
            {isInterviewStarted ? "Interview in Progress" : "Start Interview"}
          </h2>
          {isInterviewStarted && isTimerEnabled && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Clock className="mr-2" />
                <span className="text-lg font-semibold">{formatTime(interviewTime)}</span>
              </div>
            </div>
          )}
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
              {isInterviewStarted && (
                <div className="flex items-center justify-center mt-4 space-x-4">
                  <span className="text-sm font-medium">
                    {isTimerEnabled ? 'Hide Timer' : 'Show Timer'}
                  </span>
                  <Switch
                    checked={isTimerEnabled}
                    onCheckedChange={toggleTimer}
                  />
                  {isTimerEnabled && (
                    <span className="text-lg font-semibold">{formatTime(interviewTime)}</span>
                  )}
                </div>
              )}
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

