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
import { toast } from 'react-hot-toast';
import { encodeAudioToBase64 } from '@/utils/audioUtils'; // Add this import

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
  const [audioQueue, setAudioQueue] = useState<ArrayBuffer[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'open' | 'closed'>('closed');

  const sendAudioChunk = useCallback((audioChunk: Float32Array) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Convert Float32Array to Int16Array
      const pcmBuffer = new Int16Array(audioChunk.length);
      for (let i = 0; i < audioChunk.length; i++) {
        pcmBuffer[i] = Math.max(-32768, Math.min(32767, Math.floor(audioChunk[i] * 32767)));
      }
      
      // Encode the Int16Array to base64
      const base64Audio = encodeAudioToBase64(pcmBuffer);
      
      wsRef.current.send(JSON.stringify({
        type: 'audio',
        data: base64Audio
      }));
    }
  }, []);

  const setDebouncedSystemStatus = useCallback(
    debounce((status: "idle" | "listening" | "processing" | "speaking") => {
      setSystemStatus(status);
    }, 300),
    []
  );

  const commitAudioBuffer = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
    }
  }, []);

  useEffect(() => {
    // Initialize audio context here
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('Audio context initialized');
    }
  }, []); // Empty dependency array ensures this runs once on component mount

  useEffect(() => {
    if (isMicOn && stream) {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
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
        const newIsAudioActive = average > 20;
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
              silenceTimeoutRef.current = null;
            }, 1000);
          }
        }

        if (isInterviewStarted) {
          requestAnimationFrame(updateAudioLevel);
        }
      };

      updateAudioLevel();

      // Set up ScriptProcessorNode for streaming audio
      const scriptNode = audioContext.createScriptProcessor(4096, 1, 1);
      scriptNode.onaudioprocess = (audioProcessingEvent) => {
        const inputBuffer = audioProcessingEvent.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        
        // Resample to 24kHz if necessary
        const resampledData = resampleAudio(inputData, audioContext.sampleRate, 24000);
        
        sendAudioChunk(resampledData);
      };

      microphone.connect(scriptNode);
      scriptNode.connect(audioContext.destination);

      return () => {
        scriptNode.disconnect();
        microphone.disconnect();
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
      };
    }
  }, [isMicOn, stream, isInterviewStarted, setDebouncedSystemStatus, sendAudioChunk]);

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
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: true,
      }).catch(() => {
        return navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          }
        });
      });

      if (mediaStream) {
        const audioTracks = mediaStream.getAudioTracks();
        const videoTracks = mediaStream.getVideoTracks();
        
        if (audioTracks.length > 0) {
          setStream(mediaStream);
          setIsMicOn(true);
          audioTracks.forEach(track => {
            track.enabled = true;
          });
          
          if (videoTracks.length > 0) {
            setIsCameraOn(true);
            setIsCameraAvailable(true);
          } else {
            setIsCameraAvailable(false);
          }
          
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'session.update',
              session: {
                turn_detection: { type: 'server_vad' },
                input_audio_format: 'pcm16',
                output_audio_format: 'pcm16',
                voice: 'alloy',
                instructions: 'You are an AI-powered interview assistant. Conduct a professional interview, asking relevant questions and providing constructive feedback.',
                modalities: ["text", "audio"],
                temperature: 0.8,
              }
            }));
          }
          
          setIsInterviewStarted(true);
          setDebouncedSystemStatus("listening");
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

  const toggleTimer = () => {
    setIsTimerEnabled(!isTimerEnabled);
  };

  useEffect(() => {
    const connectWebSocket = () => {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      let wsUrl;

      if (isLocalhost) {
        wsUrl = `${wsProtocol}//${window.location.hostname}:3001/api/realtime-api`;
      } else {
        // Remove the extra 'https//' from the URL
        wsUrl = 'wss://84d9-2601-c2-1b81-4e0-1472-61e5-cfd5-be30.ngrok-free.app/api/realtime-api';
      }

      console.log('Attempting to connect to WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      setWsStatus('connecting');

      ws.onopen = () => {
        console.log('Connected to server WebSocket');
        setWsStatus('open');
      };

      ws.onmessage = (event) => {
        console.log('Received WebSocket message:', event.data);
        const message = JSON.parse(event.data);
        if (message.type === 'audio' && message.data) {
          console.log('Received audio data, length:', message.data.length);
          const audioArrayBuffer = base64ToArrayBuffer(message.data);
          setAudioQueue(prevQueue => [...prevQueue, audioArrayBuffer]);
          console.log('Audio queue length:', audioQueue.length + 1);
        } else if (message.type === 'text' && message.data) {
          setTranscription(prev => prev + message.data);
        } else if (message.type === 'error') {
          console.error('OpenAI API error:', message.error);
        } else {
          console.log('Unhandled message type:', message.type);
        }
      }; 

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event);
        setWsStatus('closed');
        setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (audioQueue.length > 0 && !isPlaying) {
      playNextAudio();
    }
  }, [audioQueue, isPlaying]);

  const playNextAudio = useCallback(() => {
    if (audioQueue.length > 0 && !isPlaying) {
      setIsPlaying(true);
      console.log('Playing next audio chunk');
      const audioData = audioQueue[0];
      
      if (!audioContextRef.current) {
        console.log('Initializing audio context');
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      // Log information about the audio data
      console.log('Audio data type:', typeof audioData);
      console.log('Audio data length:', audioData.byteLength);
      
      // Ensure the audio context is in a running state
      if (audioContext.state !== 'running') {
        audioContext.resume().then(() => {
          decodeAndPlayAudio(audioContext, audioData);
        });
      } else {
        decodeAndPlayAudio(audioContext, audioData);
      }
    } else {
      console.log('Audio queue is empty or audio is already playing');
    }
  }, [audioQueue, isPlaying]);

  const decodeAndPlayAudio = (audioContext: AudioContext, audioData: ArrayBuffer) => {
    // Convert PCM data to WAV
    const wavData = pcmToWav(audioData);
    
    audioContext.decodeAudioData(wavData, (buffer) => {
      console.log('Audio data decoded successfully');
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.onended = () => {
        console.log('Audio chunk playback ended');
        setIsPlaying(false);
        setAudioQueue(prevQueue => prevQueue.slice(1));
      };
      source.start(0);
      console.log('Started playing audio chunk');
    }, (error) => {
      console.error('Error decoding audio data:', error);
      setIsPlaying(false);
      setAudioQueue(prevQueue => prevQueue.slice(1));
    });
  };

  // Function to convert PCM to WAV
  function pcmToWav(pcmData: ArrayBuffer): ArrayBuffer {
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    
    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + pcmData.byteLength, true);
    writeString(view, 8, 'WAVE');
    
    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 24000, true);
    view.setUint32(28, 48000, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    
    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, pcmData.byteLength, true);
    
    const wavFile = new Uint8Array(wavHeader.byteLength + pcmData.byteLength);
    wavFile.set(new Uint8Array(wavHeader), 0);
    wavFile.set(new Uint8Array(pcmData), wavHeader.byteLength);
    
    return wavFile.buffer;
  }

  function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    console.log('Converting base64 to ArrayBuffer');
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // Add this new function for resampling audio
  const resampleAudio = (audioBuffer: Float32Array, fromSampleRate: number, toSampleRate: number): Float32Array => {
    if (fromSampleRate === toSampleRate) {
      return audioBuffer;
    }
    const ratio = fromSampleRate / toSampleRate;
    const newLength = Math.round(audioBuffer.length / ratio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
      let accum = 0, count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < audioBuffer.length; i++) {
        accum += audioBuffer[i];
        count++;
      }
      result[offsetResult] = accum / count;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
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
        <div className="container mx-auto py-8 border-t">
      <h1 className="text-3xl font-bold mb-6">Interview</h1>
      <div className="flex h-16 items-center bg-muted px-6 rounded-xl mb-6">
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
              <TranscriptionDisplay
                transcription={transcription}
                currentQuestion={currentQuestion}
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
      </div>
    </>
  );
};