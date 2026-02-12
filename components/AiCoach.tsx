
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Mic, MicOff, Volume2, VolumeX, Loader2, Phone, PhoneOff, Activity, X, PlusCircle, CheckCircle2 } from 'lucide-react';
import { ChatMessage, DailyLog, UserProfile } from '../types';
import { generateCoachResponse, generateSpeech } from '../services/geminiService';
import { GoogleGenAI, Modality } from "@google/genai";
import { INGREDIENTS_DB } from '../services/ingredients';

interface Props {
  profile: UserProfile;
  logs: DailyLog[];
  initialMessage?: string;
  onClearInitialMessage?: () => void;
  onUpdateProfile?: (updates: Partial<UserProfile>) => void;
}

// --- LIVE API UTILS ---
const floatTo16BitPCM = (input: Float32Array) => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output.buffer;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

const downsampleTo16k = (inputData: Float32Array, inputSampleRate: number) => {
    if (inputSampleRate === 16000) return inputData;
    
    const ratio = inputSampleRate / 16000;
    const newLength = Math.ceil(inputData.length / ratio);
    const result = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
        const offset = Math.floor(i * ratio);
        if (offset < inputData.length) {
            result[i] = inputData[offset];
        }
    }
    return result;
};

// --- AUDIO PLAYBACK UTILS ---
async function decodeAudioData(
  arrayBuffer: ArrayBuffer,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataView = new DataView(arrayBuffer);
  const dataLen = arrayBuffer.byteLength / 2;
  const float32Data = new Float32Array(dataLen);
  
  for (let i = 0; i < dataLen; i++) {
     const int16 = dataView.getInt16(i * 2, true);
     float32Data[i] = int16 / 32768.0;
  }

  const buffer = ctx.createBuffer(numChannels, dataLen, sampleRate);
  buffer.getChannelData(0).set(float32Data);
  return buffer;
}

const AiCoach: React.FC<Props> = ({ profile, logs, initialMessage, onClearInitialMessage, onUpdateProfile }) => {
  // Text Chat State
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  
  // Live API State
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveStatus, setLiveStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [liveVolume, setLiveVolume] = useState(0);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hi ${profile.name}. I'm your Eczema Coach. I've reviewed your latest logs. How is your skin feeling right now?`,
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const recognitionRef = useRef<any>(null);

  const liveSessionRef = useRef<Promise<any> | null>(null);
  const liveInputContextRef = useRef<AudioContext | null>(null);
  const liveOutputContextRef = useRef<AudioContext | null>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const liveProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const liveNextStartTimeRef = useRef<number>(0);
  const liveSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (initialMessage && !isLoading && !isLiveMode) {
        handleSend(initialMessage);
        if (onClearInitialMessage) onClearInitialMessage();
    }
  }, [initialMessage]);

  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, []);

  const stopAudio = () => {
    if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current = null;
    }
    setIsSpeaking(false);
  };

  const playCoachAudio = async (text: string) => {
      if (!autoSpeak) return;

      stopAudio(); 
      
      try {
          const arrayBuffer = await generateSpeech(text);
          if (!arrayBuffer) return;

          if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }

          if (audioContextRef.current.state === 'suspended') {
              await audioContextRef.current.resume();
          }

          const audioBuffer = await decodeAudioData(arrayBuffer, audioContextRef.current);
          const source = audioContextRef.current.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContextRef.current.destination);
          
          source.onended = () => setIsSpeaking(false);
          
          sourceNodeRef.current = source;
          setIsSpeaking(true);
          source.start();

      } catch (err) {
          console.error("Audio Playback Error:", err);
          setIsSpeaking(false);
      }
  };

  const toggleListening = () => {
    if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
        return;
    }

    stopAudio(); 

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Voice input is not supported in this browser.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; 
    recognition.interimResults = true; 
    recognition.continuous = false; 
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        setIsListening(true);
        setInput(''); 
    };

    recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        if (interimTranscript) setInput(interimTranscript);
        if (finalTranscript) {
            recognition.stop();
            setIsListening(false);
            handleSend(finalTranscript);
        }
    };

    recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error", event.error);
        setIsListening(false);
    };

    recognition.onend = () => {
        setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSend = async (textOverride?: string) => {
    stopAudio(); 
    setActionFeedback(null);
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const apiHistory = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
    }));

    const response = await generateCoachResponse(apiHistory, userMsg.text, profile, logs);

    if (response.toolCalls && response.toolCalls.length > 0) {
        for (const call of response.toolCalls) {
             if (call.name === 'add_supplement_to_order') {
                 const supplementName = call.args['supplement_name'];
                 const exists = INGREDIENTS_DB.find(i => i.name.toLowerCase() === supplementName.toLowerCase());
                 
                 if (exists && onUpdateProfile) {
                     const currentAdditives = profile.currentFormula.additives || [];
                     const alreadyAdded = currentAdditives.find(a => a.name === exists.name);
                     
                     if (!alreadyAdded) {
                         const newAdditives = [...currentAdditives, { name: exists.name, dose: 'Clinical' }];
                         onUpdateProfile({
                             currentFormula: {
                                 ...profile.currentFormula,
                                 additives: newAdditives
                             }
                         });
                         setActionFeedback(`Added ${exists.name} to your formula.`);
                     } else {
                         setActionFeedback(`${exists.name} is already in your formula.`);
                     }
                 }
             }
        }
    }

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: response.text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
    playCoachAudio(response.text);
  };

  // --- LIVE API LOGIC (Gemini Native Audio) ---

  const startLiveSession = async () => {
    stopAudio(); 
    if (isListening) recognitionRef.current?.stop(); 
    
    setIsLiveMode(true);
    setLiveStatus('connecting');

    try {
        const API_KEY = process.env.API_KEY;
        if (!API_KEY) throw new Error("Missing API Key");

        // 1. Initialize Audio Contexts IMMEDIATELY on User Click
        // This ensures the AudioContext is created within a user gesture.
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const inputCtx = new AudioContextClass();
        const outputCtx = new AudioContextClass();
        liveInputContextRef.current = inputCtx;
        liveOutputContextRef.current = outputCtx;

        // 2. Request Microphone
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
             throw new Error("Microphone access is not supported.");
        }
        
        console.log("Requesting microphone access...");
        // Simple constraints for max compatibility
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("Microphone granted.");
        liveStreamRef.current = stream;

        // 3. Resume Contexts (in case they suspended)
        if (inputCtx.state === 'suspended') await inputCtx.resume();
        if (outputCtx.state === 'suspended') await outputCtx.resume();

        // 4. Gemini Init
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        
        const recentHistory = logs.slice(-3).map(l => 
            `[${l.date}] Itch: ${l.itchScore}/10, Stress: ${l.stressScore}/10, Note: ${l.notes || 'No notes'}`
        ).join('\n');

        const blendIngredients = profile.currentFormula?.additives?.map(a => a.name).join(', ') || 'None';
        const goals = profile.questionnaire?.primaryGoal?.join(', ') || 'General Health';
        const ingredientsContext = INGREDIENTS_DB.map(i => `${i.name} (${i.category})`).join(', ');

        const systemInstruction = `
            You are EczemaCoach, a compassionate psychodermatology mentor.
            USER PROFILE: Name: ${profile.name}, Goals: ${goals}, Blend: ${blendIngredients}
            RECENT LOGS: ${recentHistory}
            SUPPLEMENTS: ${ingredientsContext}
            INSTRUCTIONS: Be warm, empathetic, and concise. Speak naturally.
        `;

        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                },
                systemInstruction: systemInstruction,
            },
            callbacks: {
                onopen: () => {
                    setLiveStatus('connected');
                    console.log("Gemini Live Connected");
                    
                    if (liveInputContextRef.current) {
                        const source = liveInputContextRef.current.createMediaStreamSource(stream);
                        const processor = liveInputContextRef.current.createScriptProcessor(4096, 1, 1);
                        const inputSampleRate = liveInputContextRef.current.sampleRate;

                        processor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            const downsampledData = downsampleTo16k(inputData, inputSampleRate);
                            const pcm16 = floatTo16BitPCM(downsampledData);
                            const base64 = arrayBufferToBase64(pcm16);
                            
                            // Visualizer
                            let sum = 0;
                            const step = Math.ceil(inputData.length / 50);
                            for(let i=0; i<inputData.length; i+=step) sum += Math.abs(inputData[i]);
                            setLiveVolume(Math.min(100, (sum / 50) * 3000));

                            sessionPromise.then(session => {
                                try {
                                    session.sendRealtimeInput({
                                        media: {
                                            mimeType: 'audio/pcm;rate=16000',
                                            data: base64
                                        }
                                    });
                                } catch (err) { }
                            }).catch(() => {});
                        };
                        
                        source.connect(processor);
                        processor.connect(liveInputContextRef.current.destination);
                        liveProcessorRef.current = processor;
                    }
                },
                onmessage: async (msg) => {
                    const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (base64Audio && liveOutputContextRef.current) {
                         const rawBytes = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
                         const audioBuffer = await decodeAudioData(rawBytes.buffer, liveOutputContextRef.current, 24000);
                         
                         const source = liveOutputContextRef.current.createBufferSource();
                         source.buffer = audioBuffer;
                         source.connect(liveOutputContextRef.current.destination);
                         
                         const now = liveOutputContextRef.current.currentTime;
                         const startTime = Math.max(now, liveNextStartTimeRef.current);
                         
                         source.start(startTime);
                         liveNextStartTimeRef.current = startTime + audioBuffer.duration;
                         
                         liveSourcesRef.current.add(source);
                         source.onended = () => liveSourcesRef.current.delete(source);
                    }
                    if (msg.serverContent?.interrupted) {
                        liveSourcesRef.current.forEach(s => s.stop());
                        liveSourcesRef.current.clear();
                        liveNextStartTimeRef.current = 0;
                    }
                },
                onclose: () => {
                    console.log("Gemini Live Disconnected");
                    setLiveStatus('disconnected');
                },
                onerror: (e) => {
                    console.error("Gemini Live Error", e);
                    setLiveStatus('disconnected');
                    // DO NOT alert here to avoid spamming alerts on minor connection drops
                }
            }
        });

        sessionPromise.catch(err => {
             console.error("Gemini Live Connection Failed:", err);
             setLiveStatus('disconnected');
             setIsLiveMode(false);
             alert("Connection Error: " + (err.message || "Failed to connect to Gemini Live."));
        });
        
        liveSessionRef.current = sessionPromise;

    } catch (error: any) {
        console.error("Session Start Failed:", error);
        setLiveStatus('disconnected');
        setIsLiveMode(false);
        
        // Detailed error alerting for user
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
             alert("Microphone Access Denied. Please allow microphone permissions in your browser settings (Site Settings > Microphone).");
        } else if (error.name === 'NotFoundError') {
             alert("No microphone found on this device.");
        } else {
             alert(`Audio Session Error: ${error.name} - ${error.message}`);
        }
    }
  };

  const stopLiveSession = async () => {
    if (liveSessionRef.current) {
        try {
            const session = await liveSessionRef.current;
            session.close();
        } catch(e) {}
        liveSessionRef.current = null;
    }

    if (liveProcessorRef.current) {
        liveProcessorRef.current.disconnect();
        liveProcessorRef.current = null;
    }
    if (liveStreamRef.current) {
        liveStreamRef.current.getTracks().forEach(t => t.stop());
        liveStreamRef.current = null;
    }
    if (liveInputContextRef.current && liveInputContextRef.current.state !== 'closed') {
        liveInputContextRef.current.close();
    }
    if (liveOutputContextRef.current && liveOutputContextRef.current.state !== 'closed') {
        liveOutputContextRef.current.close();
    }
    
    liveSourcesRef.current.forEach(s => s.stop());
    liveSourcesRef.current.clear();
    
    setIsLiveMode(false);
    setLiveStatus('disconnected');
  };

  if (isLiveMode) {
      return (
          <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-900 text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                   <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-teal-500 rounded-full blur-[100px] animate-pulse-slow"></div>
                   <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] animate-pulse-slow delay-700"></div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center p-8 z-10">
                  <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center relative mb-8 shadow-2xl">
                       {liveStatus === 'connected' && (
                           <>
                               <div className="absolute inset-0 rounded-full border border-teal-500/30 animate-ping" style={{ animationDuration: '2s' }}></div>
                               <div className="absolute inset-0 rounded-full border border-teal-500/20 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.5s' }}></div>
                               <div 
                                    className="absolute inset-0 bg-teal-500/20 rounded-full transition-all duration-100" 
                                    style={{ transform: `scale(${1 + (liveVolume / 100)})` }}
                               ></div>
                           </>
                       )}
                       <Bot size={48} className="text-teal-400 relative z-10" />
                  </div>

                  <h2 className="text-2xl font-bold mb-2">EczemaCoach Live</h2>
                  <p className="text-slate-400 mb-8 font-medium">
                      {liveStatus === 'connecting' ? 'Connecting to Coach...' : 'Listening...'}
                  </p>

                  <div className="flex gap-6">
                      <button 
                        onClick={stopLiveSession}
                        className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-transform hover:scale-105"
                      >
                          <PhoneOff size={28} />
                      </button>
                  </div>
              </div>
              
              <div className="p-4 text-center text-xs text-slate-500 z-10">
                  Powered by Gemini 2.5 Native Audio
              </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-50">
      <header className="p-4 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isSpeaking ? 'bg-teal-500 text-white animate-pulse' : 'bg-teal-100 text-teal-600'}`}>
                    <Bot size={24} />
                </div>
                <div>
                    <h2 className="font-bold text-slate-900">Coach AI</h2>
                    <p className="text-xs text-teal-600 font-medium flex items-center gap-1">
                        {isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Online'}
                    </p>
                </div>
            </div>
            
            <div className="flex gap-2">
                <button 
                    onClick={startLiveSession}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-full hover:bg-indigo-700 transition-all shadow-md"
                >
                    <Phone size={14} /> Live Call
                </button>
                <button 
                    onClick={() => {
                        if (isSpeaking) stopAudio();
                        setAutoSpeak(!autoSpeak);
                    }}
                    className={`p-2 rounded-full transition-colors ${autoSpeak ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-400'}`}
                    title={autoSpeak ? "Mute Coach" : "Unmute Coach"}
                >
                    {autoSpeak ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
            </div>
        </div>
      </header>

      {actionFeedback && (
          <div className="bg-teal-50 border-b border-teal-100 p-2 flex items-center justify-center gap-2 animate-slide-down">
              <CheckCircle2 size={16} className="text-teal-600" />
              <span className="text-xs font-bold text-teal-800">{actionFeedback}</span>
          </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-slate-900 text-white rounded-tr-none'
                  : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-slate-100 flex gap-1 items-center">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <button
            onClick={toggleListening}
            className={`p-3 rounded-xl transition-all shadow-md ${
                isListening 
                ? 'bg-red-500 text-white animate-pulse shadow-red-200' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={isListening}
            placeholder={isListening ? "Listening..." : "Type or tap mic..."}
            className={`flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all ${
                isListening 
                ? 'bg-slate-50 border-slate-200 text-slate-500 italic' 
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim() || isListening}
            className="p-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
        {isListening && (
            <p className="text-center text-[10px] text-slate-400 mt-2 animate-pulse">
                Speaking... pause to send automatically.
            </p>
        )}
      </div>
    </div>
  );
};

export default AiCoach;
