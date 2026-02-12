
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Moon, Zap, Activity, Save, Check, MapPin, Tag, FileText, Plus, X, Image as ImageIcon, Scan, RefreshCw, Smile, Loader2, Sparkles, BookOpen } from 'lucide-react';
import { DailyLog } from '../types';
import { analyzeDailyInflammation, DailyAnalysisResult } from '../services/geminiService';

interface Props {
  onSave: (log: DailyLog) => void;
  onCancel: () => void;
}

const CheckIn: React.FC<Props> = ({ onSave, onCancel }) => {
  const [itch, setItch] = useState(5);
  const [stress, setStress] = useState(5);
  const [sleep, setSleep] = useState(7);
  const [mood, setMood] = useState('😐');
  const [notes, setNotes] = useState('');
  
  // Image State
  const [images, setImages] = useState<string[]>([]);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [aiAnalysis, setAiAnalysis] = useState<DailyAnalysisResult | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Explanation Modal State
  const [showExplanation, setShowExplanation] = useState(false);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      // Wait for state update to render video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("We couldn't access your camera. Please check your browser permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // OPTIMIZATION: Resize image to prevent massive payload
      const MAX_WIDTH = 800;
      const scale = video.videoWidth > MAX_WIDTH ? MAX_WIDTH / video.videoWidth : 1;
      
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Convert to quality JPEG to save space
        const base64 = canvas.toDataURL('image/jpeg', 0.7);
        
        // Add to images (Max 10)
        if (images.length < 10) {
            setImages(prev => [...prev, base64]);
            setAiAnalysis(null); // Reset analysis
        }
        stopCamera();
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages: string[] = [];
      const files = Array.from(e.target.files) as File[];
      
      const remainingSlots = 10 - images.length;
      const filesToProcess = files.slice(0, remainingSlots);

      for (const file of filesToProcess) {
        // Resize loaded images too
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
        });
        newImages.push(base64);
      }
      
      setImages(prev => [...prev, ...newImages]);
      setAiAnalysis(null);
    }
    if (e.target) e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setAiAnalysis(null);
  };

  const runAnalysis = async () => {
    if (images.length === 0) return;
    
    setIsAnalysing(true);
    try {
      const result = await analyzeDailyInflammation(images);
      setAiAnalysis(result);
      if (!notes && result.notes) {
        setNotes(result.notes);
      }
    } catch (error) {
      console.error("Analysis failed", error);
      setAiAnalysis({ score: 0, status: 'Error', locations: [], symptoms: [], notes: '', explanation: '' });
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    // Create timestamp for specific time of day tracking
    const now = new Date();
    
    const newLog: DailyLog = {
      id: Date.now().toString(),
      date: now.toISOString().split('T')[0], // YYYY-MM-DD for grouping
      timestamp: now.toISOString(), // Full ISO for time tracking
      itchScore: itch,
      stressScore: stress,
      sleepHours: sleep,
      mood: mood,
      photoUrl: images.length > 0 ? images[0] : undefined,
      images: images,
      aiRednessScore: aiAnalysis?.score,
      aiLocations: aiAnalysis?.locations || [],
      aiSymptoms: aiAnalysis?.symptoms || [],
      notes: notes
    };
    
    // Slight delay to allow UI to show saving state before potential unmount/navigation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    onSave(newLog);
  };

  const Slider = ({ label, value, setValue, min, max, icon: Icon, colorClass }: any) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10 text-opacity-100`}>
             <Icon size={18} />
          </div>
          {label}
        </div>
        <span className="text-2xl font-bold text-slate-900">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={0.5}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
      />
      <div className="flex justify-between mt-2 text-xs text-slate-400 font-medium uppercase tracking-wide">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );

  const moodOptions = ['🥴', '😐', '🙂', '🌞'];

  return (
    <>
      {/* --- Live Camera Overlay --- */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="flex-1 relative bg-black overflow-hidden flex items-center justify-center">
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Guide overlay */}
            <div className="absolute inset-0 pointer-events-none border-2 border-white/30 m-8 rounded-3xl"></div>
            <div className="absolute top-8 left-0 right-0 text-center text-white/80 text-sm font-medium">
              Align affected area
            </div>
          </div>
          
          <div className="h-32 bg-black flex items-center justify-between px-8 pb-8 pt-4">
            <button 
              onClick={stopCamera}
              className="p-3 bg-slate-800 text-white rounded-full hover:bg-slate-700"
            >
              <X size={24} />
            </button>
            
            <button 
              onClick={capturePhoto}
              className="w-20 h-20 bg-white rounded-full border-4 border-slate-300 shadow-lg flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
            >
               <div className="w-16 h-16 bg-white rounded-full border-2 border-black"></div>
            </button>
            
            <div className="w-12"></div> {/* Spacer for balance */}
          </div>
          
          {/* Hidden Canvas for Capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* --- Main Check-in UI --- */}
      <div className={`p-4 space-y-6 pb-24 max-w-2xl mx-auto animate-fade-in ${isCameraOpen ? 'hidden' : ''}`}>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Daily Check-in</h2>
          <p className="text-slate-500">Track your skin-brain balance.</p>
        </div>

        <div className="space-y-4">
           {/* Mood Slider */}
           <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 text-slate-700 font-semibold mb-4">
                    <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
                        <Smile size={18} />
                    </div>
                    Skin Mood
                </div>
                <div className="flex justify-between px-4">
                    {moodOptions.map(m => (
                        <button 
                            key={m}
                            onClick={() => setMood(m)}
                            className={`text-4xl transition-transform hover:scale-110 ${mood === m ? 'scale-125 drop-shadow-md' : 'opacity-50 grayscale'}`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
           </div>

          <Slider 
              label="Itch Severity" 
              value={itch} 
              setValue={setItch} 
              min={1} 
              max={10} 
              icon={Zap}
              colorClass="text-rose-500 bg-rose-500"
          />
          <Slider 
              label="Stress Level" 
              value={stress} 
              setValue={setStress} 
              min={1} 
              max={10} 
              icon={Activity}
              colorClass="text-indigo-500 bg-indigo-500"
          />
          <Slider 
              label="Hours Slept" 
              value={sleep} 
              setValue={setSleep} 
              min={0} 
              max={12} 
              icon={Moon}
              colorClass="text-blue-500 bg-blue-500"
          />
          
          {/* ASCORAD Integration */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
                      <Camera size={18} />
                  </div>
                  <div>
                      <span className="font-semibold text-slate-700 block">ASCORAD Clinical Scan</span>
                      <span className="text-xs text-slate-400">Measure inflammation with AI</span>
                  </div>
              </div>
              
              {/* Action Buttons */}
              {images.length < 10 && !isAnalysing && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button 
                      onClick={startCamera}
                      className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="bg-slate-100 p-3 rounded-full mb-2 text-slate-600">
                        <Camera size={24} />
                      </div>
                      <span className="text-sm font-bold text-slate-700">Take Photo</span>
                    </button>

                    <input 
                        type="file" 
                        ref={galleryInputRef}
                        className="hidden" 
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                    />
                    <button 
                      onClick={() => galleryInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="bg-slate-100 p-3 rounded-full mb-2 text-slate-600">
                        <ImageIcon size={24} />
                      </div>
                      <span className="text-sm font-bold text-slate-700">Gallery</span>
                    </button>
                  </div>
              )}

              {/* Thumbnails Grid */}
              {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {images.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200">
                          <img src={img} alt={`Log ${idx}`} className="w-full h-full object-cover" />
                          <button 
                              onClick={() => removeImage(idx)}
                              disabled={isAnalysing}
                              className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors"
                          >
                              <X size={12} />
                          </button>
                        </div>
                    ))}
                  </div>
              )}

              {/* Analysis State */}
              {images.length > 0 && (
                  <div className="border-t border-slate-100 pt-4">
                      {!aiAnalysis && !isAnalysing && (
                          <button 
                              onClick={runAnalysis}
                              className="w-full py-3 bg-teal-50 text-teal-700 font-bold rounded-xl hover:bg-teal-100 transition-colors flex items-center justify-center gap-2"
                          >
                              <Scan size={18} />
                              Analyze Inflammation
                          </button>
                      )}

                      {isAnalysing && (
                          <div className="flex flex-col items-center animate-pulse py-2">
                              <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-2"></div>
                              <span className="text-teal-600 text-sm font-medium">Analyzing {images.length} images...</span>
                          </div>
                      )}

                      {aiAnalysis && (
                          <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                              <div className="flex justify-between items-center mb-3">
                                  <div>
                                      <span className="text-xs text-teal-600 font-bold uppercase tracking-wider">Clinical Score</span>
                                      <div className="text-3xl font-bold text-teal-900">{aiAnalysis.score}<span className="text-base font-normal text-teal-600">/100</span></div>
                                  </div>
                                  <div className="text-right">
                                      <span className="block text-xs text-teal-600 font-bold uppercase tracking-wider mb-1">Status</span>
                                      <span className="inline-block bg-white text-teal-800 text-xs font-bold px-2 py-1 rounded shadow-sm border border-teal-100">
                                          {aiAnalysis.status}
                                      </span>
                                  </div>
                              </div>
                              
                              {/* Locations */}
                              {aiAnalysis.locations && aiAnalysis.locations.length > 0 && (
                                  <div className="flex items-start gap-2 mb-2">
                                      <MapPin size={16} className="text-teal-400 mt-1 flex-shrink-0" />
                                      <div className="flex flex-wrap gap-1">
                                          {aiAnalysis.locations.map(loc => (
                                              <span key={loc} className="text-xs bg-white text-slate-600 px-2 py-1 rounded font-medium border border-teal-100">
                                                  {loc}
                                              </span>
                                          ))}
                                      </div>
                                  </div>
                              )}
                              {/* Symptoms */}
                              {aiAnalysis.symptoms && aiAnalysis.symptoms.length > 0 && (
                                  <div className="flex items-start gap-2">
                                      <Tag size={16} className="text-teal-400 mt-1 flex-shrink-0" />
                                      <div className="flex flex-wrap gap-1">
                                          {aiAnalysis.symptoms.map(sym => (
                                              <span key={sym} className="text-xs bg-rose-50 text-rose-600 px-2 py-1 rounded font-medium border border-rose-100">
                                                  {sym}
                                              </span>
                                          ))}
                                      </div>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              )}
          </div>
          
          {/* Notes Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative">
              <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <FileText size={18} />
                      <span>Notes</span>
                  </div>
                  {/* Translate Button - Only visible if we have an explanation */}
                  {aiAnalysis?.explanation && (
                      <button 
                        onClick={() => setShowExplanation(true)}
                        className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 hover:bg-indigo-100 transition-colors animate-fade-in"
                      >
                          <Sparkles size={12} />
                          Translate to English
                      </button>
                  )}
              </div>
              <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How are you feeling detected by AI or add your own..."
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 h-24 resize-none"
              />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isAnalysing || isSaving}
          className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? (
             <>
               <Loader2 className="animate-spin" size={20} />
               Saving...
             </>
          ) : (
             <>
               <Save size={20} />
               Save Daily Log
             </>
          )}
        </button>
        
        <button 
          onClick={onCancel}
          disabled={isSaving}
          className="w-full text-slate-500 py-2 font-medium"
        >
          Cancel
        </button>
      </div>

      {/* --- EXPLANATION MODAL --- */}
      {showExplanation && aiAnalysis?.explanation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden relative">
                  <div className="bg-indigo-600 p-4 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                          <BookOpen size={20} />
                          <h3 className="font-bold">Clinical Decoded</h3>
                      </div>
                      <button onClick={() => setShowExplanation(false)} className="bg-white/20 p-1 rounded-full hover:bg-white/30 text-white">
                          <X size={16} />
                      </button>
                  </div>
                  <div className="p-6">
                      <div className="mb-4">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Clinical Note</p>
                          <p className="text-sm text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                              "{aiAnalysis.notes}"
                          </p>
                      </div>
                      <div className="flex justify-center mb-4">
                          <div className="bg-indigo-50 rounded-full p-2">
                              <Sparkles size={20} className="text-indigo-500" />
                          </div>
                      </div>
                      <div>
                          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Plain English</p>
                          <p className="text-slate-800 font-medium leading-relaxed">
                              {aiAnalysis.explanation}
                          </p>
                      </div>
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                      <button 
                        onClick={() => setShowExplanation(false)}
                        className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-100 transition-colors"
                      >
                          Got it
                      </button>
                  </div>
              </div>
          </div>
      )}
    </>
  );
};

export default CheckIn;
