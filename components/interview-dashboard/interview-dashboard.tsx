import { FC, useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { MainNav } from "@/components/demo-dashboard/main-nav";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { VideoDisplay } from "./VideoDisplay";
import { AudioLevelIndicator } from "./AudioLevelIndicator";
import { TimerDisplay } from "./TimerDisplay";
import { ControlButtons } from "./ControlButtons";
import { TranscriptionDisplay } from "./TranscriptionDisplay";
import debounce from 'lodash/debounce';

export const InterviewDashboard: FC = () => {
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isCameraAvailable, setIsCameraAvailable] = useState(true);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [interviewTime, setInterviewTime] = useState(0);
  const [isTimerEnabled, setIsTimerEnabled] = useState(true);
  const [transcription, setTranscription] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isQuestionRead, setIsQuestionRead] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [systemStatus, setSystemStatus] = useState<"idle" | "listening" | "processing" | "speaking">("idle");
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const lastTranscriptRef = useRef<string>("");

  const setDebouncedSystemStatus = useCallback(
    debounce((status: "idle" | "listening" | "processing" | "speaking") => {
      setSystemStatus(status);
    }, 300),
    []
  );

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
        const newIsAudioActive = average > 20; // Increased threshold
        setIsAudioActive(newIsAudioActive);
        setIsUserSpeaking(newIsAudioActive);

        if (newIsAudioActive) {
          setDebouncedSystemStatus("listening");
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }
        } else {
          silenceTimeoutRef.current = setTimeout(() => {
            if (audioChunksRef.current.length > 0) {
              audioChunksRef.current = [];
              setIsUserSpeaking(false);
              setDebouncedSystemStatus("processing");
              if (lastTranscriptRef.current.trim() !== transcription.trim()) {
                lastTranscriptRef.current = transcription;
                sendTranscriptionToLLM(transcription);
              }
            }
          }, 2000); // Reduced silence timeout to 2 seconds
        }

        if (isInterviewStarted) {
          requestAnimationFrame(updateAudioLevel);
        }
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
  }, [isMicOn, stream, isInterviewStarted, transcription, setDebouncedSystemStatus]);

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

  const startMedia = async () => {
    setIsLoading(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      }).catch(() => {
        // If video fails, try audio only
        return navigator.mediaDevices.getUserMedia({ audio: true });
      });

      if (mediaStream) {
        const audioTracks = mediaStream.getAudioTracks();
        const videoTracks = mediaStream.getVideoTracks();
        
        if (audioTracks.length > 0) {
          setStream(mediaStream);
          setIsMicOn(true);
          startSpeechRecognition();
          
          if (videoTracks.length > 0) {
            setIsCameraOn(true);
            setIsCameraAvailable(true);
          } else {
            setIsCameraAvailable(false);
          }
          
          setIsInterviewStarted(true);
          setDebouncedSystemStatus("listening");
          // Set initial question
          setCurrentQuestion("Tell me about yourself and your background.");
          speakQuestion("Tell me about yourself and your background.");
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
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setTranscription("");
    setCurrentQuestion("");
    setIsQuestionRead(false);
    setIsUserSpeaking(false);
    setIsSpeaking(false);
    lastTranscriptRef.current = "";
    setDebouncedSystemStatus("idle");
    
    // Cancel any ongoing speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const startSpeechRecognition = () => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognitionRef.current = recognition;

        let fullTranscript = '';

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              fullTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }
          setTranscription(fullTranscript + interimTranscript);
          setIsUserSpeaking(true);
          setDebouncedSystemStatus("listening");
        };

        recognition.onend = () => {
          if (isInterviewStarted) {
            recognition.start();
          }
        };

        recognition.start();
      } else {
        console.error('Speech recognition not supported');
      }
    }
  };

  const sendTranscriptionToLLM = async (text: string) => {
    if (isUserSpeaking || isSpeaking) return; // Don't send if the user or system is speaking
    
    setDebouncedSystemStatus("processing");
    try {
      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from LLM');
      }
      
      const data = await response.json();
      if (data.question) {
        setCurrentQuestion(data.question);
        setIsQuestionRead(false);
        setDebouncedSystemStatus("speaking");
        speakQuestion(data.question);
      } else {
        throw new Error('No question received from LLM');
      }
    } catch (error) {
      console.error('Error sending transcription to LLM:', error);
      setDebouncedSystemStatus("idle");
    }
  };

  const speakQuestion = (question: string) => {
    if ('speechSynthesis' in window && !isQuestionRead && !isUserSpeaking) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(question);
      utterance.onstart = () => {
        setIsQuestionRead(true);
        setIsSpeaking(true);
        setDebouncedSystemStatus("speaking");
        // Mute the microphone while speaking
        if (stream) {
          stream.getAudioTracks().forEach(track => {
            track.enabled = false;
          });
        }
      };
      utterance.onend = () => {
        setIsQuestionRead(true);
        setIsSpeaking(false);
        setDebouncedSystemStatus("listening");
        setTranscription(""); // Clear the transcription for the new question
        // Unmute the microphone after speaking
        if (stream) {
          stream.getAudioTracks().forEach(track => {
            track.enabled = true;
          });
        }
      };
      window.speechSynthesis.speak(utterance);
    } else if (!('speechSynthesis' in window)) {
      console.error('Text-to-speech not supported');
      setDebouncedSystemStatus("idle");
    }
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
                <VideoDisplay
                  isLoading={isLoading}
                  isInterviewStarted={isInterviewStarted}
                  isCameraOn={isCameraOn}
                  isCameraAvailable={isCameraAvailable}
                  stream={stream}
                />
                {isInterviewStarted && (
                  <AudioLevelIndicator
                    isMicOn={isMicOn}
                    isAudioActive={isAudioActive}
                  />
                )}
              </div>
            </CardContent>
          </Card>
          <div className="text-center text-lg font-semibold">
            System Status: {systemStatus}
          </div>
          <TranscriptionDisplay
            transcription={transcription}
            currentQuestion={currentQuestion}
            systemStatus={systemStatus}
          />
          <ControlButtons
            isInterviewStarted={isInterviewStarted}
            isLoading={isLoading}
            isMicOn={isMicOn}
            isCameraOn={isCameraOn}
            isCameraAvailable={isCameraAvailable}
            startMedia={startMedia}
            toggleMic={toggleMic}
            toggleCamera={toggleCamera}
            endCall={endCall}
          />
          <TimerDisplay
            isInterviewStarted={isInterviewStarted}
            isTimerEnabled={isTimerEnabled}
            interviewTime={interviewTime}
            toggleTimer={toggleTimer}
          />
        </div>
      </div>
    </>
  );
};
