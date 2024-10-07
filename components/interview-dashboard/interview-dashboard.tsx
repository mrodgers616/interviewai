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
import Fastify from 'fastify';
import WebSocket from 'ws';
import fastifyFormBody from '@fastify/formbody';
import fastifyWs from '@fastify/websocket';

// Add a new utility function to update the system status
const updateSystemStatus = (setSystemStatus: React.Dispatch<React.SetStateAction<"idle" | "listening" | "processing" | "speaking">>, status: "idle" | "listening" | "processing" | "speaking") => {
  setSystemStatus(status);
};


export const InterviewDashboard: FC = () => {
  const { OPENAI_API_KEY } = process.env;
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
  const fastify = Fastify();
  fastify.register(fastifyFormBody);
  fastify.register(fastifyWs);

  const SYSTEM_MESSAGE = `You are an advanced AI-powered interview assistant designed to conduct realistic and insightful job interviews. Your role is to: 1. Ask relevant and challenging questions based on the specific job role and industry. 2. Adapt your questioning style and difficulty level based on the candidates responses. 3. Provide a natural, conversational flow to the interview, including appropriate follow-up questions. 4. Assess the candidates responses in real-time, considering factors such as relevance, depth, clarity, and problem-solving skills. 5. Maintain a professional and encouraging demeanor throughout the interview. 6. Avoid interrupting the candidate while they are speaking. 7. Provide brief, constructive feedback or ask for clarification when appropriate. 8. Keep track of the interview's progress and ensure all key areas are covered within the allotted time. 9. Conclude the interview with a summary and an opportunity for the candidate to ask questions. Remember to tailor your language and tone to match the seniority level of the position and the company culture. Your goal is to create a realistic interview experience that helps candidates improve their skills and confidence.`;
  const VOICE = 'alloy';

  const openAiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
    headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1"
    }
  });

  const LOG_EVENT_TYPES = [
    'response.content.done',
    'rate_limits.updated',
    'response.done',
    'input_audio_buffer.committed',
    'input_audio_buffer.speech_stopped',
    'input_audio_buffer.speech_started',
    'session.created'
  ];

  let streamSid = null;

  const sendSessionUpdate = () => {
    const sessionUpdate = {
        type: 'session.update',
        session: {
            turn_detection: { type: 'server_vad' },
            input_audio_format: 'g711_ulaw',
            output_audio_format: 'g711_ulaw',
            voice: VOICE,
            instructions: SYSTEM_MESSAGE,
            modalities: ["text", "audio"],
            temperature: 0.8,
        }
    };

    console.log('Sending session update:', JSON.stringify(sessionUpdate));
    openAiWs.send(JSON.stringify(sessionUpdate));
  };

  const setDebouncedSystemStatus = useCallback(
    debounce((status: "idle" | "listening" | "processing" | "speaking") => {
      setSystemStatus(status);
    }, 300),
    []
  );

  const debouncedSendTranscriptionToLLM = useCallback(
    debounce((text: string) => {
      if (!isUserSpeaking && !isSpeaking) {
        sendTranscriptionToLLM(text);
      }
    }, 1000), // Reduced debounce time to 1 second
    [isUserSpeaking, isSpeaking]
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
            silenceTimeoutRef.current = null;
          }
        } else {
          if (!silenceTimeoutRef.current) {
            silenceTimeoutRef.current = setTimeout(() => {
              setIsUserSpeaking(false);
              if (lastTranscriptRef.current.trim() !== transcription.trim()) {
                lastTranscriptRef.current = transcription;
                debouncedSendTranscriptionToLLM(transcription);
              }
              silenceTimeoutRef.current = null;
            }, 1000); // Reduced silence time to 1 second
          }
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
  }, [isMicOn, stream, isInterviewStarted, transcription, setDebouncedSystemStatus, debouncedSendTranscriptionToLLM]);

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
    fastify.register(async (fastify) => {
      fastify.get('/media-stream', { websocket: true }, (connection, req) => {
          console.log('Client connected');
  
  
          const openAiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
              headers: {
                  Authorization: `Bearer ${OPENAI_API_KEY}`,
                  "OpenAI-Beta": "realtime=v1"
              }
          });
  
          let streamSid: any = null;
  
          const sendSessionUpdate = () => {
              const sessionUpdate = {
                  type: 'session.update',
                  session: {
                      turn_detection: { type: 'server_vad' },
                      input_audio_format: 'g711_ulaw',
                      output_audio_format: 'g711_ulaw',
                      voice: VOICE,
                      instructions: SYSTEM_MESSAGE,
                      modalities: ["text", "audio"],
                      temperature: 0.8,
                  }
              };
  
              console.log('Sending session update:', JSON.stringify(sessionUpdate));
              openAiWs.send(JSON.stringify(sessionUpdate));
          };
  
          // Open event for OpenAI WebSocket
          openAiWs.on('open', () => {
              console.log('Connected to the OpenAI Realtime API');
              setTimeout(sendSessionUpdate, 250); // Ensure connection stability, send after .25 seconds
          });
  
          // Listen for messages from the OpenAI WebSocket (and send to Twilio if necessary)
          openAiWs.on('message', (data: any) => {
              try {
                  const response = JSON.parse(data);
  
                  if (response.type === 'input_audio_buffer.speech_started') {
                      console.log('User started speaking');
                      const clearMessage = {
                          event: 'clear',
                          streamSid: streamSid,
                      };
                      connection.send(JSON.stringify(clearMessage));
                  }
  
                  if (LOG_EVENT_TYPES.includes(response.type)) {
                      console.log(`Received event: ${response.type}`, response);
                  }
  
                  if (response.type === 'session.updated') {
                      console.log('Session updated successfully:', response);
                  }
  
                  if (response.type === 'response.audio.delta' && response.delta) {
                      const audioDelta = {
                          event: 'media',
                          streamSid: streamSid,
                          media: { payload: Buffer.from(response.delta, 'base64').toString('base64') }
                      };
                      connection.send(JSON.stringify(audioDelta));
                  }
              } catch (error) {
                  console.error('Error processing OpenAI message:', error, 'Raw message:', data);
              }
          });
  
          // Handle incoming messages from Twilio
          connection.on('message', (message: any) => {
              try {
                  const data = JSON.parse(message);
  
                  switch (data.event) {
                      case 'media':
                          if (openAiWs.readyState === WebSocket.OPEN) {
                              const audioAppend = {
                                  type: 'input_audio_buffer.append',
                                  audio: data.media.payload
                              };
  
                              openAiWs.send(JSON.stringify(audioAppend));
                          }
                          break;
                      case 'start':
                          streamSid = data.start.streamSid;
                          console.log('Incoming stream has started', streamSid);
                          break;
                      default:
                          console.log('Received non-media event:', data.event);
                          break;
                  }
              } catch (error) {
                  console.error('Error parsing message:', error, 'Message:', message);
              }
          });
  
          // Handle connection close
          connection.on('close', () => {
              if (openAiWs.readyState === WebSocket.OPEN) openAiWs.close();
              console.log('Client disconnected.');
          });
  
          // Handle WebSocket close and errors
          openAiWs.on('close', () => {
              console.log('Disconnected from the OpenAI Realtime API');
          });
  
          openAiWs.on('error', (error) => {
              console.error('Error in the OpenAI WebSocket:', error);
          });
      });
  });
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
        sendSessionUpdate();
        
        if (audioTracks.length > 0) {
          setStream(mediaStream);
          setIsMicOn(true);
          // Ensure the microphone is unmuted
          audioTracks.forEach(track => {
            track.enabled = true;
          });
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
          // setCurrentQuestion("Tell me about yourself and your background.");
          // speakQuestion("Tell me about yourself and your background.");

          
          
        } else {
          console.error("Failed to start microphone");
          mediaStream.getTracks().forEach(track => track.stop());
        }
      } 
      else {
        console.error("Failed to get media stream");
      }

      
    } catch (error) {
      console.error("Error accessing media devices:", error);
    } finally {
      setIsLoading(false);
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

        recognition.onstart = () => {
          console.log("Speech recognition started");
        };

        recognition.onresult = (event: any) => {
          console.log("Speech recognition result received");
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              fullTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }
          const currentTranscript = fullTranscript + interimTranscript;
          console.log("Transcription:", currentTranscript);
          setTranscription(currentTranscript);
          setIsUserSpeaking(true);
          setDebouncedSystemStatus("listening");
          
          // Trigger LLM call when there's a final result
          if (event.results[event.results.length - 1].isFinal) {
            debouncedSendTranscriptionToLLM(currentTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
        };

        recognition.onend = () => {
          console.log("Speech recognition ended");
          if (isInterviewStarted) {
            console.log("Restarting speech recognition");
            recognition.start();
          }
        };

        recognition.start();
      } else {
        console.error('Speech recognition not supported');
      }
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

  const sendTranscriptionToLLM = async (text: string) => {
    console.log("Sending transcription to LLM:", text);
    if (isUserSpeaking || isSpeaking) return;
    
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
      console.log("LLM response:", data);
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
        lastTranscriptRef.current = ""; // Reset the last transcript
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
          <div className="flex">
            <div className="w-3/5 pr-4">
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
            </div>
            <div className="w-2/5 pl-4">
              <div className="text-center text-lg font-semibold mb-4">
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
        </div>
      </div>
    </>
  );
};