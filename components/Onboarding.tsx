
import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Check, Sparkles, Activity, Brain, Utensils, AlertCircle, Sun, Pill, Camera, Scan, Upload, X, Trash2, Plus, Info, Heart, Shield, Moon, EyeOff, Zap, Target, Dumbbell, Syringe, Home, ChevronRight, Wind, Droplet, Shirt } from 'lucide-react';
import { SkinType, UserProfile, QuestionnaireData } from '../types';
import { runLogicEngine } from '../services/logicEngine';
import { analyzeSkinCondition } from '../services/geminiService';

interface Props {
  onComplete: (profile: Partial<UserProfile>) => void;
  onCancel?: () => void;
}

// --- CONFIGURATION ---

type QuestionType = 'single' | 'multi' | 'input' | 'slider' | 'biometrics';

interface QuestionConfig {
  id: keyof QuestionnaireData | 'scan' | 'intro' | 'analysis';
  phase: string;
  title: string;
  subtitle: string;
  type: QuestionType;
  options?: string[] | { label: string; icon?: any; value?: string }[];
  min?: number;
  max?: number;
  education?: string; // Micro-education text
}

const QUESTIONS: QuestionConfig[] = [
  // PHASE 1: Clinical Calibration
  {
    id: 'intro',
    phase: 'Calibration',
    title: 'The Basics',
    subtitle: 'Let\'s start with your clinical baseline.',
    type: 'input' 
    // Custom renderer for Name/Age
  },
  {
    id: 'biologicalSex',
    phase: 'Calibration',
    title: 'Biological Profile',
    subtitle: 'Hormones influence skin barrier function.',
    type: 'single',
    options: ['Male', 'Female'],
    education: 'We need this to calibrate nutrient dosage safely.'
  },
  {
    id: 'pregnancyStatus',
    phase: 'Calibration',
    title: 'Safety Check',
    subtitle: 'Are you currently pregnant or breastfeeding?',
    type: 'single',
    options: ['None', 'Pregnant', 'Breastfeeding'],
    education: 'Some herbs (like Ashwagandha) are restricted during pregnancy.'
  },
  {
    id: 'height', 
    phase: 'Calibration',
    title: 'Body Metrics',
    subtitle: 'To calculate your precise metabolic dosage.',
    type: 'biometrics', // Custom for Height/Weight
    education: 'We use this to determine the exact grams of protein base you need.'
  },

  // PHASE 2: Eczema Profile
  {
    id: 'skinType',
    phase: 'Skin Profile',
    title: 'Current State',
    subtitle: 'Which best describes your skin today?',
    type: 'single',
    options: Object.values(SkinType),
    education: 'Dry skin needs lipids. Weeping skin needs astringents.'
  },
  {
    id: 'eczemaOnset',
    phase: 'Skin Profile',
    title: 'History',
    subtitle: 'When did your journey start?',
    type: 'single',
    options: ['Childhood', 'Adulthood', 'Recent (<6 months)'],
    education: 'Childhood onset often indicates a genetic Filaggrin deficiency.'
  },
  {
    id: 'eczemaLocations',
    phase: 'Skin Profile',
    title: 'Locations',
    subtitle: 'Where do you flare the most?',
    type: 'multi',
    options: ['Face', 'Neck', 'Hands', 'Arms', 'Legs', 'Torso'],
    education: 'Facial skin absorbs nutrients differently than body skin.'
  },
  {
    id: 'atopicHistory',
    phase: 'Skin Profile',
    title: 'The Atopic Triad',
    subtitle: 'Do you suffer from other atopic conditions?',
    type: 'multi',
    options: ['Asthma', 'Hayfever', 'None'],
    education: 'These conditions share the same inflammatory pathway as eczema.'
  },
  {
    id: 'scratchTiming',
    phase: 'Skin Profile',
    title: 'The Itch Clock',
    subtitle: 'When is the itch most intense?',
    type: 'multi',
    options: ['Morning', 'Evening', 'Night (Sleep)', 'Stress-induced', 'Constant'],
    education: 'Nocturnal itching (night) is often linked to a drop in cortisol and rise in temperature.'
  },

  // PHASE 3: Environmental Load (NEW DEEP DIVE)
  {
    id: 'showerTemp',
    phase: 'Environmental Load',
    title: 'Shower Habits',
    subtitle: 'How hot do you like your showers?',
    type: 'single',
    options: ['Hot (Steaming)', 'Warm', 'Cold/Lukewarm'],
    education: 'Hot water strips natural lipid oils (ceramides), damaging the barrier instantly.'
  },
  {
    id: 'moisturizerTexture',
    phase: 'Environmental Load',
    title: 'Topical Routine',
    subtitle: 'What texture do you mostly use?',
    type: 'single',
    options: ['Lotion (Watery)', 'Cream', 'Ointment (Greasy)', 'Oil', 'None'],
    education: 'Lotions often contain high alcohol content which can sting. Ointments seal moisture best.'
  },
  {
    id: 'clothingFabrics',
    phase: 'Environmental Load',
    title: 'Fabric Contact',
    subtitle: 'What fabrics touch your skin most often?',
    type: 'multi',
    options: ['Cotton', 'Wool', 'Synthetic/Polyester', 'Bamboo/Silk'],
    education: 'Wool fibers have microscopic barbs that physically irritate open skin.'
  },
  {
    id: 'laundryDetergent',
    phase: 'Environmental Load',
    title: 'Chemical Load',
    subtitle: 'What kind of detergent do you use?',
    type: 'single',
    options: ['Scented/Regular', 'Hypoallergenic/Baby'],
    education: 'Fragrances in detergents are top contact allergens that stay on clothes all day.'
  },
  {
    id: 'pets',
    phase: 'Environmental Load',
    title: 'Household',
    subtitle: 'Do you live with any animals?',
    type: 'multi',
    options: ['Dog', 'Cat', 'Rodent', 'Bird', 'None'],
    education: 'Pet dander is a potent protein allergen that can trigger flares even without direct contact.'
  },
  {
    id: 'climate',
    phase: 'Environmental Load',
    title: 'Your Climate',
    subtitle: 'Describe the air where you live.',
    type: 'single',
    options: ['Dry/Cold', 'Humid/Tropical', 'Moderate'],
    education: 'Dry air sucks moisture from the skin. Humid air can trigger sweat-induced itching.'
  },
  {
    id: 'sunEffect',
    phase: 'Environmental Load',
    title: 'Sun Response',
    subtitle: 'How does your skin react to sunlight?',
    type: 'single',
    options: ['Improves', 'Worsens', 'No Change'],
    education: 'If sun helps, you may benefit from UV phototherapy or higher Vitamin D.'
  },
  {
    id: 'sweatTrigger',
    phase: 'Environmental Load',
    title: 'Sweat Reaction',
    subtitle: 'Does sweating make you itch immediately?',
    type: 'single',
    options: ['Yes (Stings)', 'No'],
    education: 'This is often "Cholinergic Urticaria" - where sweat pH irritates micro-tears.'
  },

  // PHASE 4: Internal Triggers
  {
    id: 'dietStyle',
    phase: 'Internal Triggers',
    title: 'Fuel Source',
    subtitle: 'What is your primary way of eating?',
    type: 'single',
    options: ['Standard', 'Vegan', 'Vegetarian', 'Keto', 'AIP', 'Low Histamine'],
    education: 'Vegans often need extra B12 and Iron support.'
  },
  {
    id: 'suspectedTriggers',
    phase: 'Internal Triggers',
    title: 'The "Big 3"',
    subtitle: 'Do you suspect any of these spike your flares?',
    type: 'multi',
    options: ['Dairy', 'Gluten', 'Sugar', 'None'],
    education: 'Dairy is a common trigger for "damp" or weeping eczema.'
  },
  {
    id: 'gutHealth',
    phase: 'Internal Triggers',
    title: 'Gut Check',
    subtitle: '70% of your immune system lives in your gut.',
    type: 'single',
    options: ['Good', 'Bloating', 'Reflux', 'Irregularity'],
    education: 'Bloating often signals SIBO or dysbiosis driving inflammation.'
  },
  {
    id: 'hydration',
    phase: 'Internal Triggers',
    title: 'Hydration',
    subtitle: 'How much water do you drink daily?',
    type: 'single',
    options: ['<1L', '1-2L', '>2L'],
    education: 'Cellular dehydration makes the skin barrier brittle.'
  },
  {
    id: 'smoking',
    phase: 'Internal Triggers',
    title: 'Toxic Load',
    subtitle: 'Do you smoke or vape?',
    type: 'single',
    options: ['Never', 'Occasional', 'Regular'],
    education: 'Smoking depletes Vitamin C rapidly, hindering collagen repair.'
  },
  {
    id: 'alcohol',
    phase: 'Internal Triggers',
    title: 'Histamine Load',
    subtitle: 'Alcohol intake per week (units)?',
    type: 'single',
    options: ['None', 'Low (<4)', 'Moderate (4-10)', 'High (>10)'],
    education: 'Alcohol releases histamine, a direct cause of itching.'
  },

  // PHASE 5: Psychodermatology
  {
    id: 'perceivedStress',
    phase: 'Mind-Skin Axis',
    title: 'Stress Baseline',
    subtitle: 'Stress releases Cortisol, which shreds the skin barrier.',
    type: 'single',
    options: ['Low', 'Moderate', 'High', 'Overwhelmed'],
    education: 'We add adaptogens like Ashwagandha for high stress profiles.'
  },
  {
    id: 'itchScore',
    phase: 'Mind-Skin Axis',
    title: 'The Itch',
    subtitle: 'Rate your average itch severity (1-10).',
    type: 'slider',
    min: 1,
    max: 10,
    education: 'High itch requires nervous system calmatives like Magnesium.'
  },
  {
    id: 'sleepImpact',
    phase: 'Mind-Skin Axis',
    title: 'Sleep Quality',
    subtitle: 'Does eczema wake you up at night?',
    type: 'single',
    options: ['None', 'Mild', 'Moderate', 'Severe'],
    education: 'Deep sleep is when your skin does 80% of its healing.'
  },
  {
    id: 'mentalImpact',
    phase: 'Mind-Skin Axis',
    title: 'Emotional Toll',
    subtitle: 'Does your skin affect your mental state?',
    type: 'multi',
    options: ['Shame', 'Social Anxiety', 'Depression', 'None'],
    education: 'We tailor your mindfulness tracks based on this answer.'
  },

  // PHASE 6: Safety & Goals
  {
    id: 'medicationUsage',
    phase: 'Final Checks',
    title: 'Medications',
    subtitle: 'What are you currently using?',
    type: 'single',
    options: ['None', 'Topical Steroids', 'Protopic', 'Biologics', 'TSW (Withdrawal)'],
    education: 'Long-term steroid use increases Calcium and Collagen needs.'
  },
  {
    id: 'steroidUsageHistory',
    phase: 'Final Checks',
    title: 'Steroid History',
    subtitle: 'How long have you used topical steroids in your life?',
    type: 'single',
    options: ['Never', '<1 year', '1-5 years', '>5 years'],
    education: 'Extended use (>5 years) can thin the dermis, requiring intensive structural support.'
  },
  {
    id: 'exerciseLevel',
    phase: 'Final Checks',
    title: 'Movement',
    subtitle: 'How active are you?',
    type: 'single',
    options: ['Sedentary', 'Moderate', 'Active', 'Athlete'],
    education: 'Athletes lose electrolytes through sweat, which can trigger flares.'
  },
  {
    id: 'boneJointHealth',
    phase: 'Final Checks',
    title: 'Bone Health',
    subtitle: 'Any history of the following?',
    type: 'multi',
    options: ['Osteoporosis', 'Joint Pain', 'Fractures', 'None'],
    education: 'Inflammation often affects joints (Psoriatic Arthritis risk).'
  },
  {
    id: 'primaryGoal',
    phase: 'Final Checks',
    title: 'The Magic Wand',
    subtitle: 'What are your top priorities? (Select all that apply)',
    type: 'multi', 
    options: ['Stop Itch', 'Heal Redness', 'Sleep Better', 'Confidence'],
    education: 'We will prioritize ingredients that target these specific goals.'
  },
];

const loadingMessages = [
    "Correlating your stress levels with inflammation...",
    "Checking gut health markers against redness score...",
    "Analyzing onset history for genetic factors...",
    "Reviewing environmental load (water, fabrics, pets)...",
    "Identifying nutrient gaps in your diet...",
    "Measuring eczema severity (PO-SCORAD)...",
    "Formulating your unique relief blend..."
];

const Onboarding: React.FC<Props> = ({ onComplete, onCancel }) => {
  // State
  const [currentView, setCurrentView] = useState<'scan' | 'questions' | 'analysis' | 'plan'>('scan');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isFinalAnalyzing, setIsFinalAnalyzing] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  
  // Background Analysis
  const [isBackgroundAnalyzing, setIsBackgroundAnalyzing] = useState(false);
  const [backgroundAnalysisComplete, setBackgroundAnalysisComplete] = useState(false);

  // Camera/Images
  const [images, setImages] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Data
  const [formData, setFormData] = useState<QuestionnaireData>({
    scanImages: [],
    fullName: '',
    age: 30,
    biologicalSex: '',
    pregnancyStatus: 'None',
    height: 170,
    weight: 70,

    skinType: SkinType.DRY,
    eczemaOnset: '',
    eczemaLocations: [],
    visualAppearance: [],
    atopicHistory: [],
    scratchTiming: [], // New

    // New Deep Dive fields
    showerTemp: '',
    moisturizerTexture: '',
    clothingFabrics: [],
    laundryDetergent: '',
    pets: [],
    climate: '',
    sunEffect: '',
    sweatTrigger: '',

    dietStyle: '',
    suspectedTriggers: [],
    gutHealth: '',
    antibioticUse: false,
    hydration: '',
    smoking: '',
    alcohol: '',

    perceivedStress: '',
    itchScore: 5,
    sleepImpact: '',
    mentalImpact: [],

    medicationUsage: '',
    steroidUsageHistory: '', // New
    exerciseLevel: '',
    boneJointHealth: [],
    primaryGoal: [],
    
    // Legacy defaults for safety
    confirmedDeficiencies: [],
    deficiencySymptoms: []
  });

  const [generatedReport, setGeneratedReport] = useState<any>(null);

  // Cleanup
  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Loading Cycle
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isFinalAnalyzing) {
        interval = setInterval(() => {
            setLoadingTextIndex(prev => (prev + 1) % loadingMessages.length);
        }, 800);
    }
    return () => clearInterval(interval);
  }, [isFinalAnalyzing]);

  // --- CAMERA LOGIC ---
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err) {
      alert("Camera access denied.");
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
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        setImages(prev => [...prev, base64]);
        stopCamera();
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages: string[] = [];
      const files = Array.from(e.target.files) as File[];
      for (const file of files) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        newImages.push(base64);
      }
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const handleStartAnalysis = () => {
    setCurrentView('questions');
    if (images.length > 0) {
        setIsBackgroundAnalyzing(true);
        analyzeSkinCondition(images[0])
            .then(analysis => {
                setFormData(prev => ({
                    ...prev,
                    scanImages: images,
                    visualAppearance: analysis.visualAppearance || prev.visualAppearance,
                    eczemaLocations: analysis.eczemaLocations || prev.eczemaLocations
                }));
                setIsBackgroundAnalyzing(false);
                setBackgroundAnalysisComplete(true);
            })
            .catch(() => setIsBackgroundAnalyzing(false));
    }
  };

  // --- FORM LOGIC ---
  const updateField = (field: keyof QuestionnaireData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: keyof QuestionnaireData, item: string) => {
    const arr = (formData[field] as string[]) || [];
    if (arr.includes(item)) {
      updateField(field, arr.filter(i => i !== item));
    } else {
      updateField(field, [...arr, item]);
    }
  };

  const handleOptionSelect = (field: keyof QuestionnaireData, val: string, type: QuestionType) => {
    if (type === 'multi') {
        toggleArrayItem(field, val);
    } else {
        updateField(field, val);
        // Auto-advance for single select
        if (questionIndex < QUESTIONS.length - 1) {
            setTimeout(() => {
                setQuestionIndex(prev => prev + 1);
            }, 350);
        }
    }
  };

  const handleNextQuestion = () => {
    if (questionIndex < QUESTIONS.length - 1) {
      setQuestionIndex(prev => prev + 1);
    } else {
      finishQuestionnaire();
    }
  };

  const handlePrevQuestion = () => {
    if (questionIndex > 0) {
      setQuestionIndex(prev => prev - 1);
    } else {
      setCurrentView('scan');
    }
  };

  const finishQuestionnaire = () => {
    setCurrentView('analysis');
    setIsFinalAnalyzing(true);
    setTimeout(() => {
        const computed = runLogicEngine(formData);
        const formula = {
            base: 'Vegan Rice Protein',
            additives: computed.supplementProtocol.phase1.map(name => ({ name, dose: 'Clinical' })),
            flavor: 'Baobab Vanilla'
        };
        setGeneratedReport({ computed, formula });
        setIsFinalAnalyzing(false);
        setCurrentView('plan');
    }, 4000);
  };

  const handleDevRandomFill = () => {
    const newFormData = { ...formData };
    
    // Set Basics
    newFormData.fullName = `Random User ${Math.floor(Math.random() * 100)}`;
    newFormData.age = Math.floor(Math.random() * 50) + 18;
    newFormData.height = Math.floor(Math.random() * 50) + 150;
    newFormData.weight = Math.floor(Math.random() * 60) + 50;
    
    // Iterate specific questions to randomize
    QUESTIONS.forEach(q => {
        if (q.id === 'intro' || q.id === 'height') return; // Handled manually
        if (q.options) {
             const opts = q.options.map(o => typeof o === 'string' ? o : o.value);
             
             if (q.type === 'single') {
                 // Pick 1 random
                 const rand = opts[Math.floor(Math.random() * opts.length)];
                 // @ts-ignore
                 newFormData[q.id] = rand;
             } else if (q.type === 'multi') {
                 // Pick 1-3 randoms
                 const num = Math.floor(Math.random() * 3) + 1;
                 const shuffled = [...opts].sort(() => 0.5 - Math.random());
                 // @ts-ignore
                 newFormData[q.id] = shuffled.slice(0, num);
             }
        }
        if (q.type === 'slider') {
             // @ts-ignore
             newFormData[q.id] = Math.floor(Math.random() * (q.max! - q.min!)) + q.min!;
        }
    });

    setFormData(newFormData);
    // Skip to end
    setQuestionIndex(QUESTIONS.length - 1);
  };

  // --- RENDERERS ---

  const renderQuestion = () => {
    const q = QUESTIONS[questionIndex];
    
    // Custom Biometrics Renderer
    if (q.type === 'biometrics') {
        return (
            <div className="space-y-6 animate-fade-in">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Height (cm)</label>
                    <div className="flex items-center gap-4">
                        <input 
                            type="range" min="120" max="220" 
                            value={formData.height} 
                            onChange={e => updateField('height', parseInt(e.target.value))}
                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                        />
                        <span className="w-16 font-bold text-xl text-slate-900">{formData.height} cm</span>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Weight (kg)</label>
                    <div className="flex items-center gap-4">
                        <input 
                            type="range" min="40" max="150" 
                            value={formData.weight} 
                            onChange={e => updateField('weight', parseInt(e.target.value))}
                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                        />
                        <span className="w-16 font-bold text-xl text-slate-900">{formData.weight} kg</span>
                    </div>
                </div>
            </div>
        );
    }

    // Custom Basics Renderer
    if (q.id === 'intro') {
        return (
            <div className="space-y-4 animate-fade-in">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input 
                        type="text" 
                        value={formData.fullName}
                        onChange={e => updateField('fullName', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none"
                        placeholder="Jane Doe"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                    <input 
                        type="number" 
                        value={formData.age}
                        onChange={e => updateField('age', parseInt(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                </div>
            </div>
        );
    }

    if (q.type === 'slider') {
        return (
            <div className="space-y-6 animate-fade-in">
                 <div className="flex justify-center mb-4">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold border-4 ${
                         (formData[q.id] as number) > 7 ? 'border-rose-500 text-rose-600 bg-rose-50' : 
                         (formData[q.id] as number) > 4 ? 'border-orange-500 text-orange-600 bg-orange-50' :
                         'border-teal-500 text-teal-600 bg-teal-50'
                    }`}>
                        {formData[q.id] as number}
                    </div>
                 </div>
                 <input 
                    type="range" 
                    min={q.min || 1} 
                    max={q.max || 10} 
                    value={formData[q.id] as number} 
                    onChange={e => updateField(q.id as keyof QuestionnaireData, parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                 />
                 <div className="flex justify-between text-xs text-slate-400 font-bold uppercase">
                     <span>Mild</span>
                     <span>Severe</span>
                 </div>
            </div>
        );
    }

    // Default: Single or Multi Select Cards
    return (
        <div className="space-y-3 animate-fade-in">
            {q.options?.map((opt) => {
                const label = typeof opt === 'string' ? opt : opt.label;
                const val = typeof opt === 'string' ? opt : opt.value;
                const isSelected = q.type === 'multi' 
                    ? (formData[q.id as keyof QuestionnaireData] as string[]).includes(val!)
                    : formData[q.id as keyof QuestionnaireData] === val;

                return (
                    <button
                        key={val}
                        onClick={() => handleOptionSelect(q.id as keyof QuestionnaireData, val!, q.type)}
                        className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between group ${
                            isSelected 
                            ? 'bg-teal-600 text-white border-teal-600 shadow-md transform scale-[1.02]' 
                            : 'bg-white border-slate-200 text-slate-700 hover:border-teal-300 hover:bg-slate-50'
                        }`}
                    >
                        <span className="font-medium text-lg">{label}</span>
                        {isSelected && <Check size={20} className="text-white" />}
                        {!isSelected && <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-teal-300"></div>}
                    </button>
                );
            })}
        </div>
    );
  };

  return (
    <>
    {/* CAMERA OVERLAY */}
    {isCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
            <div className="flex-1 relative overflow-hidden">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-0 pointer-events-none border-2 border-white/30 m-8 rounded-3xl"></div>
            </div>
            <div className="h-32 bg-black flex items-center justify-between px-8 pb-4">
                <button onClick={stopCamera} className="p-3 bg-slate-800 text-white rounded-full"><X/></button>
                <button 
                  onClick={capturePhoto}
                  className="w-20 h-20 bg-white rounded-full border-4 border-slate-300 shadow-lg flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
                >
                   <div className="w-16 h-16 bg-white rounded-full border-2 border-black"></div>
                </button>
                <div className="w-12"></div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
    )}

    <div className={`min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 ${isCameraOpen ? 'hidden' : ''}`}>
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative min-h-[600px] flex flex-col">
        
        {/* VIEW 1: SCAN */}
        {currentView === 'scan' && (
            <div className="flex-1 p-8 flex flex-col items-center text-center animate-fade-in">
                 <div className="flex-1 flex flex-col items-center justify-center w-full">
                    <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mb-6">
                        <Scan size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Let's see your skin story.</h2>
                    <p className="text-slate-500 mb-8 max-w-xs">
                        Take a photo. Our AI will analyze inflammation severity while you complete your profile.
                    </p>

                    {images.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2 w-full mb-8">
                             {images.map((img, i) => (
                                 <div key={i} className="aspect-square rounded-xl overflow-hidden relative">
                                     <img src={img} className="w-full h-full object-cover" />
                                 </div>
                             ))}
                             {images.length < 5 && (
                                 <button onClick={startCamera} className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-teal-500 hover:text-teal-500 hover:bg-teal-50 transition-colors">
                                     <Plus />
                                 </button>
                             )}
                        </div>
                    ) : (
                        <div className="w-full space-y-4 mb-8">
                            <button 
                                onClick={startCamera}
                                className="w-full py-5 bg-teal-600 text-white rounded-xl shadow-lg shadow-teal-200 font-bold flex items-center justify-center gap-3 hover:bg-teal-700 transition-all transform active:scale-95"
                            >
                                <Camera size={24} />
                                <span className="text-lg">Take Photo</span>
                            </button>
                            
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-5 bg-white border-2 border-slate-100 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-200 transition-all"
                            >
                                <Upload size={24} />
                                <span className="text-lg">Upload from Gallery</span>
                            </button>
                        </div>
                    )}
                 </div>

                 <div className="w-full space-y-3">
                     {images.length > 0 && (
                         <button 
                            onClick={handleStartAnalysis}
                            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
                         >
                            <Zap size={20} className="text-yellow-400" />
                            Analyze & Continue
                         </button>
                     )}
                     <div className="flex justify-center gap-6 text-sm font-medium">
                        {images.length > 0 && (
                            <button onClick={() => fileInputRef.current?.click()} className="text-teal-600">Add more photos</button>
                        )}
                        <button onClick={handleStartAnalysis} className="text-slate-400 hover:text-slate-600">Skip Scan</button>
                     </div>
                     <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                 </div>
                 
                 {/* Navigation Header for Scan Step */}
                 {(onCancel) && (
                    <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center pointer-events-none">
                        <button 
                          onClick={onCancel}
                          className="p-2 rounded-full bg-white/80 backdrop-blur border border-slate-100 text-slate-500 hover:text-slate-800 hover:bg-white shadow-sm pointer-events-auto transition-all"
                          title="Home"
                        >
                          <Home size={20} />
                        </button>
                    </div>
                )}
            </div>
        )}

        {/* VIEW 2: QUESTIONS */}
        {currentView === 'questions' && (
            <div className="flex-1 flex flex-col relative">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <button onClick={handlePrevQuestion} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{QUESTIONS[questionIndex].phase}</span>
                        <div className="flex gap-1 mt-1">
                            {QUESTIONS.map((_, i) => (
                                <div key={i} className={`h-1 w-2 rounded-full transition-colors ${i <= questionIndex ? 'bg-teal-500' : 'bg-slate-200'}`}></div>
                            ))}
                        </div>
                    </div>
                    <div className="w-8"></div> {/* Spacer */}
                </div>
                
                {/* Dev Skip */}
                <button onClick={handleDevRandomFill} className="absolute top-2 right-2 text-[8px] text-slate-300 z-50 p-2 border border-slate-100 rounded hover:bg-slate-50">DEV: RANDOM FILL</button>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">{QUESTIONS[questionIndex].title}</h2>
                        <p className="text-slate-500 text-lg leading-relaxed">{QUESTIONS[questionIndex].subtitle}</p>
                    </div>
                    
                    {renderQuestion()}

                    {/* Micro-Education Toast */}
                    {QUESTIONS[questionIndex].education && (
                        <div className="mt-8 bg-indigo-50 p-4 rounded-xl flex gap-3 items-start border border-indigo-100 animate-slide-up">
                            <Info size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-indigo-800 leading-relaxed">
                                <span className="font-bold">Did you know?</span> {QUESTIONS[questionIndex].education}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-white">
                    <button 
                        onClick={handleNextQuestion}
                        className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-teal-700 transition-all flex items-center justify-center gap-2"
                    >
                        {questionIndex === QUESTIONS.length - 1 ? 'Finish Analysis' : 'Next'}
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        )}

        {/* VIEW 3: ANALYSIS LOADING */}
        {currentView === 'analysis' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-fade-in">
                <div className="relative mb-8">
                    <div className="w-24 h-24 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Brain size={32} className="text-teal-600" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 h-16 flex items-center justify-center">
                    {loadingMessages[loadingTextIndex]}
                </h3>
            </div>
        )}

        {/* VIEW 4: PLAN & REPORT */}
        {currentView === 'plan' && generatedReport && (
            <div className="flex-1 flex flex-col p-8 overflow-y-auto animate-fade-in">
                 <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mx-auto mb-4">
                        <Check size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Your Skin's Truth</h2>
                    <p className="text-slate-500">Based on your {generatedReport.computed.psychodermProfile} Profile</p>
                </div>

                <div className="space-y-4 mb-8">
                     {/* Severity Card */}
                     <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Inflammation Load</p>
                                <p className="text-3xl font-bold">{generatedReport.computed.poScorad}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase bg-white/20 text-white`}>
                                {generatedReport.computed.severityClass}
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-700">
                             <p className="text-sm text-slate-300 leading-relaxed">
                                 {generatedReport.computed.rootCauseSummary}
                             </p>
                        </div>
                     </div>

                     {/* Protocol Preview */}
                     <div className="bg-white border border-slate-200 p-6 rounded-2xl">
                         <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                             <Sparkles size={18} className="text-teal-500" /> Phase 1 Protocol
                         </h3>
                         <ul className="space-y-3">
                            {generatedReport.computed.supplementProtocol.phase1.slice(0, 3).map((item: string, i: number) => (
                                <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                    <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0">
                                        <Check size={12} />
                                    </div>
                                    {item}
                                </li>
                            ))}
                            {generatedReport.computed.supplementProtocol.phase1.length > 3 && (
                                <li className="text-xs text-slate-400 pl-8">+ {generatedReport.computed.supplementProtocol.phase1.length - 3} more tailored ingredients</li>
                            )}
                         </ul>
                     </div>
                </div>

                <button 
                  onClick={() => onComplete({
                    name: formData.fullName,
                    skinType: formData.skinType,
                    questionnaire: formData,
                    computed: generatedReport.computed,
                    currentFormula: generatedReport.formula,
                    customBlendName: `${formData.fullName.split(' ')[0]}'s ${generatedReport.computed.psychodermProfile.split('-')[0]} Formula`
                  })}
                  className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-teal-700 transition-all flex items-center justify-center gap-2"
                >
                    Start Transformation Journey <ArrowRight size={20} />
                </button>
            </div>
        )}

      </div>
    </div>
    </>
  );
};

export default Onboarding;
