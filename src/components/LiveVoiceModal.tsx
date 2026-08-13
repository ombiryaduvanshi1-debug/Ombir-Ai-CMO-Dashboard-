import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Radio,
  Sparkles,
  Zap,
  RotateCcw,
  Bot,
  User,
  Activity,
  AlertCircle
} from 'lucide-react';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TranscriptItem {
  id: string;
  sender: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isOutputMuted, setIsOutputMuted] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [currentModelText, setCurrentModelText] = useState('');
  const [currentUserText, setCurrentUserText] = useState('');
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, currentModelText, currentUserText]);

  useEffect(() => {
    if (isOpen) {
      startLiveSession();
    } else {
      stopLiveSession();
    }
    return () => {
      stopLiveSession();
    };
  }, [isOpen]);

  // Convert Float32Array to 16-bit PCM Little Endian ArrayBuffer
  const float32ToPCM16 = (float32Array: Float32Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
  };

  // Convert ArrayBuffer to Base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Convert Base64 to Uint8Array
  const base64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // Convert 16-bit PCM Little Endian ArrayBuffer to Float32Array
  const pcm16ToFloat32 = (arrayBuffer: ArrayBuffer): Float32Array => {
    const view = new DataView(arrayBuffer);
    const float32 = new Float32Array(arrayBuffer.byteLength / 2);
    for (let i = 0; i < float32.length; i++) {
      const int16 = view.getInt16(i * 2, true);
      float32[i] = int16 < 0 ? int16 / 32768 : int16 / 32767;
    }
    return float32;
  };

  const playAudioChunk = (base64Pcm: string) => {
    if (isOutputMuted) return;

    try {
      if (!outputAudioCtxRef.current) {
        outputAudioCtxRef.current = new AudioContext({ sampleRate: 24000 });
      }

      const audioCtx = outputAudioCtxRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const u8Array = base64ToUint8Array(base64Pcm);
      const float32Data = pcm16ToFloat32(u8Array.buffer);

      if (float32Data.length === 0) return;

      const buffer = audioCtx.createBuffer(1, float32Data.length, 24000);
      buffer.getChannelData(0).set(float32Data);

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);

      const currentTime = audioCtx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += buffer.duration;

      setIsModelSpeaking(true);
      setTimeout(() => {
        if (audioCtx.currentTime >= nextStartTimeRef.current - 0.1) {
          setIsModelSpeaking(false);
        }
      }, (nextStartTimeRef.current - currentTime) * 1000);

    } catch (e) {
      console.error('Error playing audio chunk:', e);
    }
  };

  const startLiveSession = async () => {
    setStatus('connecting');
    setErrorMessage(null);

    // Determine WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/live`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log('Connected to Live WebSocket endpoint');
        setStatus('connected');
        await setupMicrophoneCapture();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.error) {
            setErrorMessage(data.error);
            setStatus('error');
            return;
          }

          if (data.audio) {
            playAudioChunk(data.audio);
          }

          if (data.modelTranscript) {
            setCurrentModelText(prev => {
              const updated = prev + data.modelTranscript;
              return updated;
            });
          }

          if (data.userTranscript) {
            setCurrentUserText(prev => {
              const updated = prev + data.userTranscript;
              return updated;
            });
          }

          if (data.interrupted) {
            // Stop scheduled audio on interruption
            if (outputAudioCtxRef.current) {
              nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
            }
            setIsModelSpeaking(false);
          }

          if (data.turnComplete) {
            // Flush turn to transcript history
            setCurrentModelText(modelText => {
              if (modelText.trim()) {
                setTranscripts(prev => [
                  ...prev,
                  {
                    id: `model-${Date.now()}`,
                    sender: 'model',
                    text: modelText.trim(),
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                ]);
              }
              return '';
            });

            setCurrentUserText(userText => {
              if (userText.trim()) {
                setTranscripts(prev => [
                  ...prev,
                  {
                    id: `user-${Date.now()}`,
                    sender: 'user',
                    text: userText.trim(),
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                ]);
              }
              return '';
            });

            setIsModelSpeaking(false);
          }

        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setErrorMessage('Failed to establish WebSocket connection for Live API.');
        setStatus('error');
      };

      ws.onclose = () => {
        console.log('Live WebSocket connection closed');
        if (status !== 'error') {
          setStatus('disconnected');
        }
      };

    } catch (err: any) {
      console.error('Failed to initialize Live Session:', err);
      setErrorMessage(err?.message || 'Could not connect to server.');
      setStatus('error');
    }
  };

  const setupMicrophoneCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      mediaStreamRef.current = stream;

      const inputAudioCtx = new AudioContext({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputAudioCtx;

      const source = inputAudioCtx.createMediaStreamSource(stream);
      const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      source.connect(processor);
      processor.connect(inputAudioCtx.destination);

      processor.onaudioprocess = (e) => {
        if (isMuted) {
          setIsUserSpeaking(false);
          return;
        }

        const inputBuffer = e.inputBuffer.getChannelData(0);
        
        // Calculate RMS volume for visual indicator
        let sum = 0;
        for (let i = 0; i < inputBuffer.length; i++) {
          sum += inputBuffer[i] * inputBuffer[i];
        }
        const rms = Math.sqrt(sum / inputBuffer.length);
        setIsUserSpeaking(rms > 0.02);

        // Convert and send PCM audio chunk
        const pcm16Buffer = float32ToPCM16(inputBuffer);
        const base64Audio = arrayBufferToBase64(pcm16Buffer);

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ audio: base64Audio }));
        }
      };

    } catch (err: any) {
      console.error('Microphone access denied or error:', err);
      setErrorMessage('Microphone access was denied or is unavailable on this browser.');
      setStatus('error');
    }
  };

  const stopLiveSession = () => {
    if (processorRefAndStreamCleanup()) {
      // cleaned
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('disconnected');
    setIsModelSpeaking(false);
    setIsUserSpeaking(false);
  };

  const processorRefAndStreamCleanup = () => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    return true;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="flex h-3 w-3 relative">
                {status === 'connected' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  status === 'connected' ? 'bg-emerald-500' : status === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
                }`}></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Gemini Live Voice Conversation
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  gemini-3.1-flash-live-preview
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {status === 'connected' ? 'Real-Time Bidirectional Speech Stream Active' : status === 'connecting' ? 'Connecting to Live API WebSocket...' : 'Disconnected'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center Visualizer & Status */}
        <div className="p-8 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-indigo-950/30 to-slate-900 border-b border-slate-800/80">
          
          {status === 'connecting' ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <div className="relative flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
                <Radio className="w-8 h-8 text-indigo-400 absolute" />
              </div>
              <p className="text-xs font-semibold text-slate-300 animate-pulse">
                Establishing Low-Latency Voice Session with Gemini Live...
              </p>
            </div>
          ) : status === 'error' ? (
            <div className="flex flex-col items-center justify-center space-y-3 text-center py-6">
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertCircle className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-red-300 max-w-md">
                {errorMessage || 'Live voice session encountered an error.'}
              </p>
              <button
                onClick={startLiveSession}
                className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 border border-slate-700"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reconnect Live Session</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-6 w-full">
              {/* Dynamic Sound Wave Sphere / Orb Visualizer */}
              <div className="relative flex items-center justify-center py-4">
                {/* Glow Ring 1 */}
                <div className={`absolute w-36 h-36 rounded-full transition-all duration-300 ${
                  isModelSpeaking
                    ? 'bg-indigo-500/30 scale-125 animate-ping opacity-75'
                    : isUserSpeaking
                    ? 'bg-emerald-500/30 scale-110 animate-pulse'
                    : 'bg-indigo-500/10 scale-100'
                }`} />

                {/* Glow Ring 2 */}
                <div className={`absolute w-28 h-28 rounded-full transition-all duration-300 ${
                  isModelSpeaking
                    ? 'bg-purple-500/40 blur-md scale-110'
                    : isUserSpeaking
                    ? 'bg-emerald-400/40 blur-md scale-105'
                    : 'bg-slate-800'
                }`} />

                {/* Central Orb */}
                <div className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
                  isModelSpeaking
                    ? 'bg-gradient-to-tr from-indigo-600 to-purple-500 ring-4 ring-purple-400/50 shadow-purple-500/50'
                    : isUserSpeaking
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 ring-4 ring-emerald-400/50 shadow-emerald-500/50'
                    : 'bg-slate-800 ring-2 ring-slate-700'
                }`}>
                  {isModelSpeaking ? (
                    <Sparkles className="w-10 h-10 text-white animate-bounce" />
                  ) : isUserSpeaking ? (
                    <Mic className="w-10 h-10 text-white animate-pulse" />
                  ) : (
                    <Radio className="w-10 h-10 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Status Indicator Pill */}
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border ${
                  isModelSpeaking
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse'
                    : isUserSpeaking
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                    : isMuted
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  <Activity className="w-3.5 h-3.5" />
                  <span>
                    {isModelSpeaking
                      ? 'Gemini Speaking...'
                      : isUserSpeaking
                      ? 'Listening to You...'
                      : isMuted
                      ? 'Microphone Muted'
                      : 'Listening (Speak Anytime)'}
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Live Subtitle Transcript Container */}
        <div
          ref={scrollRef}
          className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-950/60 min-h-[180px] max-h-[260px] text-xs"
        >
          {transcripts.length === 0 && !currentModelText && !currentUserText && (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-6 space-y-1">
              <Bot className="w-6 h-6 opacity-40" />
              <p className="font-medium">Speak into your microphone to start conversing.</p>
              <p className="text-[11px] text-slate-600">e.g. "What is our current monthly marketing ROI and lead breakdown?"</p>
            </div>
          )}

          {transcripts.map((t) => (
            <div
              key={t.id}
              className={`flex items-start gap-2.5 ${t.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {t.sender === 'model' && (
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div className={`p-3 rounded-2xl max-w-[85%] font-medium leading-relaxed ${
                t.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-xs'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-xs'
              }`}>
                <p>{t.text}</p>
                <span className="text-[9px] opacity-60 mt-1 block text-right">{t.timestamp}</span>
              </div>

              {t.sender === 'user' && (
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {/* Active Model Stream Transcript */}
          {currentModelText && (
            <div className="flex items-start gap-2.5 justify-start animate-fade-in">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="p-3 rounded-2xl max-w-[85%] bg-indigo-950/80 border border-indigo-500/40 text-indigo-100 rounded-tl-xs">
                <p className="font-medium">{currentModelText}</p>
              </div>
            </div>
          )}

          {/* Active User Stream Transcript */}
          {currentUserText && (
            <div className="flex items-start gap-2.5 justify-end animate-fade-in">
              <div className="p-3 rounded-2xl max-w-[85%] bg-emerald-950/80 border border-emerald-500/40 text-emerald-100 rounded-tr-xs">
                <p className="font-medium">{currentUserText}</p>
              </div>
              <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                <Mic className="w-3.5 h-3.5" />
              </div>
            </div>
          )}
        </div>

        {/* Footer Control Controls */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              disabled={status !== 'connected'}
              className={`p-3 rounded-2xl font-semibold text-xs flex items-center gap-2 border transition-all ${
                isMuted
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isMuted ? <MicOff className="w-4 h-4 text-amber-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
              <span className="hidden sm:inline">{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
            </button>

            <button
              onClick={() => setIsOutputMuted(!isOutputMuted)}
              disabled={status !== 'connected'}
              className={`p-3 rounded-2xl font-semibold text-xs flex items-center gap-2 border transition-all ${
                isOutputMuted
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isOutputMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
              <span className="hidden sm:inline">{isOutputMuted ? 'Unmute Speaker' : 'Mute Speaker'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/20 transition-all flex items-center gap-2"
          >
            <span>End Call</span>
          </button>
        </div>

      </div>
    </div>
  );
};
