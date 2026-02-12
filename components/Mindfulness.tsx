
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Brain, ChevronRight, ChevronLeft, Sparkles, CheckCircle, Zap, LayoutGrid, Clock, Target, ArrowLeft, Terminal, Sun, Moon, BookOpen, Lightbulb, Lock, MessageSquare } from 'lucide-react';
import { UserProfile } from '../types';
import { analyzeMindsetQuiz } from '../services/logicEngine';

interface Props {
  profile?: UserProfile;
  onUpdateProfile?: (updates: Partial<UserProfile>) => void;
  onTalkToCoach?: (context: string) => void;
}

// --- TYPES & DATA ---

interface DayPlan {
  title: string;
  morning: {
    title: string;
    task: string;
    science: string; // "The Science"
  };
  evening: {
    title: string;
    task: string;
    reflection: string;
  };
}

interface ModuleContent {
  title: string;
  description: string;
  aim: string;
  duration: string;
  tags: string[];
  days: DayPlan[]; // Changed from tasks string[] to DayPlan[]
  audio: string;
}

const MINDSET_MODULES: Record<string, ModuleContent> = {
  'rewire-itch': {
    title: "Rewire the Itch Loop",
    description: "Break the mental feedback loop between stress, negative thoughts, and the itch-scratch cycle.",
    aim: "Stop subconscious scratching",
    duration: "7 Days",
    tags: ["NLP", "Habit Reversal", "CBT"],
    audio: "Reset Skin Identity",
    days: [
      {
        title: "Awareness",
        morning: {
          title: "The Pause Button",
          task: "Today, do not try to stop scratching. Just DELAY it by 10 seconds. Count to 10 before you touch your skin.",
          science: "This engages your Prefrontal Cortex (logic), interrupting the automatic Amygdala (panic) loop."
        },
        evening: {
          title: "Trigger Log",
          task: "Write down the 3 times you scratched most today. Was it boredom, stress, or heat?",
          reflection: "Awareness is the first step to reprogramming."
        }
      },
      {
        title: "Safety Signals",
        morning: {
          title: "Speak Safety",
          task: "When the itch hits, say aloud: 'I am safe. This is just a sensation. It will pass.'",
          science: "Itch is interpreted by the brain as a 'threat'. Verbalizing safety downregulates the threat response."
        },
        evening: {
          title: "Cooling Down",
          task: "Use an ice pack instead of nails for your worst itch tonight.",
          reflection: "Temperature receptors override itch receptors in the spinal cord."
        }
      },
      {
        title: "Language Shift",
        morning: {
          title: "Reframe the Flare",
          task: "Catch yourself saying 'My Eczema'. Change it to 'The Skin'. Dissociate your identity from the condition.",
          science: "Linguistic distancing reduces emotional inflammation."
        },
        evening: {
          title: "Gratitude Scan",
          task: "Find one part of your body that DOES NOT itch. Focus on it for 2 minutes.",
          reflection: "Retraining the brain to notice comfort, not just discomfort."
        }
      },
      {
        title: "Hand Distraction",
        morning: {
          title: "Busy Hands",
          task: "Wear a ring, hold a stone, or use a fidget toy whenever you sit still (working/watching TV).",
          science: "Habit Reversal Training (HRT) requires a competing physical response."
        },
        evening: {
          title: "Progressive Release",
          task: "Squeeze your fists tight for 5s, then release. Repeat 10x.",
          reflection: "Releasing physical tension often releases the urge to scratch."
        }
      },
      {
        title: "Visual Healing",
        morning: {
          title: "The Cool Light",
          task: "Close your eyes. Visualize cool, blue healing light coating your itchy spots.",
          science: "Visualization activates the same neural pathways as actual sensory input."
        },
        evening: {
          title: "Forgiveness",
          task: "If you scratched today, say 'I forgive myself'. Guilt leads to stress, which leads to more itch.",
          reflection: "Shame fuels the inflammatory cycle."
        }
      },
      {
        title: "Environment",
        morning: {
          title: "Friction Check",
          task: "Check your clothes tags and seams. Remove anything creating 'micro-friction'.",
          science: "Mechanical irritation triggers mast cell degranulation (histamine release)."
        },
        evening: {
          title: "Sanctuary Setup",
          task: "Ensure your bedroom is cool (18-19°C).",
          reflection: "Heat is a primary nocturnal itch trigger."
        }
      },
      {
        title: "New Identity",
        morning: {
          title: "The Healer",
          task: "Write down: 'My body knows how to heal. I am supporting it.'",
          science: "Affirmations build new neural pathways over time (Neuroplasticity)."
        },
        evening: {
          title: "The Contract",
          task: "Commit to one habit from this week to keep forever.",
          reflection: "Consistency creates the cure."
        }
      }
    ]
  },
  'attract-healed': {
    title: "Attract the Healed You",
    description: "Shift from a mindset of 'fixing a problem' to 'embodying health'. Uses visualization to pull you out of the 'stuck' mindset.",
    aim: "Boost hope & manifestation",
    duration: "7 Days",
    tags: ["Visualization", "Manifestation", "Hope"],
    audio: "Future Self Embodiment",
    days: [
        {
            title: "The Vision",
            morning: {
                title: "Future Scripting",
                task: "Write 3 sentences in the present tense about your healed skin. e.g. 'I wake up with smooth, calm skin.'",
                science: "The brain cannot distinguish vividly imagined events from reality."
            },
            evening: {
                title: "Mirror Work",
                task: "Look in the mirror. Look into your eyes, ignoring your skin. Say 'I see you.'",
                reflection: "Reconnecting with the self beneath the surface."
            }
        },
        {
            title: "Sensory Shift",
            morning: {
                title: "Feel the Smoothness",
                task: "Touch a smooth surface (silk, glass). Imagine your skin feeling exactly like that.",
                science: "Sensory substitution trains the brain to expect healing."
            },
            evening: {
                title: "The Beach Walk",
                task: "Visualize yourself walking on a beach, salt air, no pain, confident.",
                reflection: "Embedding the feeling of freedom."
            }
        },
        {
            title: "Act As If",
            morning: {
                title: "Wardrobe Win",
                task: "Wear an outfit you usually avoid. Wear it for just 30 mins at home.",
                science: "Behavioral activation breaks the 'avoidance' cycle."
            },
            evening: {
                title: "Social Confidence",
                task: "Imagine walking into a room and no one looking at your skin.",
                reflection: "Projection creates perception."
            }
        },
        {
            title: "Release Doubt",
            morning: {
                title: "Burn the Old Story",
                task: "Write down 'I will always suffer'. Then cross it out vigorously.",
                science: "Physical symbolic acts help the brain discard limiting beliefs."
            },
            evening: {
                title: "Sleep Expectation",
                task: "Tell yourself: 'Tonight I heal while I sleep.'",
                reflection: "Setting the Reticular Activating System (RAS)."
            }
        },
        {
            title: "Gratitude",
            morning: {
                title: "Body Thanks",
                task: "Thank your legs for walking, your hands for holding. Shift focus from appearance to function.",
                science: "Gratitude reduces cortisol by 23%."
            },
            evening: {
                title: "Review Wins",
                task: "List 3 small improvements, no matter how tiny.",
                reflection: "What we focus on expands."
            }
        },
        {
            title: "Vibrational Rise",
            morning: {
                title: "Power Pose",
                task: "Stand like Superman for 2 minutes. Hands on hips.",
                science: "Increases testosterone (confidence) and lowers cortisol."
            },
            evening: {
                title: "Self-Love Letter",
                task: "Write a love letter to your future healed self.",
                reflection: "Bridging the gap between now and then."
            }
        },
        {
            title: "Anchor",
            morning: {
                title: "The Anchor",
                task: "Pick a physical object (bracelet, stone). Touch it and feel 'Healed'.",
                science: "NLP Anchoring technique."
            },
            evening: {
                title: "Release",
                task: "Let go of the 'need' to be healed. Trust it is coming.",
                reflection: "Detachment reduces resistance."
            }
        }
    ]
  },
  'stress-safety': {
    title: "From Stress to Safety",
    description: "Move your body from Sympathetic (Fight/Flight) to Parasympathetic (Rest/Digest) to lower cortisol spikes.",
    aim: "Calm the nervous system",
    duration: "7 Days",
    tags: ["Somatic", "Breathwork", "Vagus Nerve"],
    audio: "Vagus Nerve Calm",
    days: [
        {
            title: "The Breath",
            morning: {
                title: "Box Breathing",
                task: "Inhale 4s, Hold 4s, Exhale 4s, Hold 4s. Repeat 4 times.",
                science: "Directly hacks the Vagus Nerve to lower heart rate."
            },
            evening: {
                title: "Jaw Release",
                task: "Unclench your jaw. Drop your tongue from the roof of your mouth.",
                reflection: "Stress often hides in the jaw, signaling danger to the brain."
            }
        },
        {
            title: "Cold Reset",
            morning: {
                title: "Dive Reflex",
                task: "Splash ice-cold water on your face for 30 seconds.",
                science: "Triggers the Mammalian Dive Reflex, instantly slowing metabolism and anxiety."
            },
            evening: {
                title: "Digital Sunset",
                task: "No screens 1 hour before bed. Blue light keeps cortisol high.",
                reflection: "Protecting your melatonin production."
            }
        },
        {
            title: "Shake it Off",
            morning: {
                title: "Somatic Shaking",
                task: "Shake your hands and legs vigorously for 1 minute.",
                science: "Animals shake to discharge adrenaline after a threat. Humans need to do the same."
            },
            evening: {
                title: "Legs Up Wall",
                task: "Lie down with legs up the wall for 5 mins.",
                reflection: "Promotes venous drainage and parasympathetic activation."
            }
        },
        {
            title: "Vocal Tone",
            morning: {
                title: "The Hum",
                task: "Hum a low tone ('Voooooo') for 2 minutes.",
                science: "The Vagus nerve passes through vocal cords. Vibration stimulates it."
            },
            evening: {
                title: "Silence",
                task: "Sit in absolute silence for 5 minutes. No phone, no music.",
                reflection: "Giving the nervous system zero input to process."
            }
        },
        {
            title: "Touch",
            morning: {
                title: "Self-Havening",
                task: "Stroke your upper arms downwards gently, like hugging yourself.",
                science: "Produces Delta waves in the brain, associated with deep safety."
            },
            evening: {
                title: "Weighted Blanket",
                task: "Use a heavy blanket or piles of blankets tonight.",
                reflection: "Deep pressure stimulation increases serotonin."
            }
        },
        {
            title: "Nature",
            morning: {
                title: "Sky Gaze",
                task: "Look at the sky/horizon for 5 mins (panoramic vision).",
                science: "Panoramic vision engages the parasympathetic system; focused vision (screens) engages stress."
            },
            evening: {
                title: "Grounding",
                task: "Stand barefoot on the floor/ground. Feel gravity.",
                reflection: "Connecting to stability."
            }
        },
        {
            title: "Integration",
            morning: {
                title: "Stress Audit",
                task: "Identify 1 stressor you can simply delete from your life today.",
                science: "Reduction is better than management."
            },
            evening: {
                title: "Safety Anchor",
                task: "Place hand on heart. Say 'I am safe' 3 times.",
                reflection: "Creating a portable safety mechanism."
            }
        }
    ]
  },
  'rebuild-identity': {
    title: "Rebuild Skin Identity",
    description: "Separate your self-worth from your skin barrier function. Ideal for those who hide their skin.",
    aim: "Build confidence & reduce shame",
    duration: "7 Days",
    tags: ["Confidence", "Self-Worth", "Exposure"],
    audio: "Skin Confidence Primer",
    days: [
        {
            title: "Separation",
            morning: {
                title: "Who Am I?",
                task: "List 5 things about yourself that are not physical (e.g., kind, funny, smart).",
                science: "Diversifying your identity reduces the impact of skin flares."
            },
            evening: {
                title: "The Observer",
                task: "Notice your skin without judging it. Just say 'It is red', not 'It looks horrible'.",
                reflection: "Neutrality neutralizes shame."
            }
        },
        {
            title: "Exposure",
            morning: {
                title: "Show a Little",
                task: "Roll up your sleeves or wear shorts at home for 1 hour.",
                science: "Gradual exposure therapy reduces social anxiety."
            },
            evening: {
                title: "Selfie Challenge",
                task: "Take a selfie. Don't post it. Just look at it with kindness.",
                reflection: "Accepting your visual reality."
            }
        },
        {
            title: "Values",
            morning: {
                title: "Value Align",
                task: "Does your skin stop you from being a good friend? No. Focus on that.",
                science: "Realigning with core values builds resilience."
            },
            evening: {
                title: "Inner Child",
                task: "Imagine a child with eczema. Would you hide them? No. Be that kind to yourself.",
                reflection: "Compassion is a skill."
            }
        },
        {
            title: "Boundaries",
            morning: {
                title: "The Script",
                task: "Prepare a line for if someone asks: 'It's just eczema, I'm healing.'",
                science: "Preparedness reduces anticipatory anxiety."
            },
            evening: {
                title: "No Apology",
                task: "Do not apologize for your appearance today.",
                reflection: "You do not owe the world 'perfect' skin."
            }
        },
        {
            title: "Confidence",
            morning: {
                title: "Posture Hack",
                task: "Shoulders back, chin up. Even if you want to hide.",
                science: "Open posture improves mood and lowers stress hormones."
            },
            evening: {
                title: "Compliment File",
                task: "Recall a compliment someone gave you recently.",
                reflection: "Others see your light, not just your skin."
            }
        },
        {
            title: "Connection",
            morning: {
                title: "Reach Out",
                task: "Text a friend. Focus the convo on THEM, not your skin.",
                science: "Social connection buffers stress."
            },
            evening: {
                title: "Forgiveness",
                task: "Forgive your body for 'failing' you. It is trying its best.",
                reflection: "Your body is fighting FOR you, not against you."
            }
        },
        {
            title: "Integration",
            morning: {
                title: "I Am More",
                task: "Look in mirror. Say 'I am more than my skin'.",
                science: "Identity consolidation."
            },
            evening: {
                title: "Freedom",
                task: "Plan an activity for next week you would normally avoid.",
                reflection: "Reclaiming your life."
            }
        }
    ]
  },
  'release-battle': {
    title: "Release the Battle",
    description: "Stop fighting your body. Start parenting it. Connect with the wounded parts of yourself that need safety.",
    aim: "Inner child healing",
    duration: "7 Days",
    tags: ["Inner Child", "Compassion", "Softening"],
    audio: "Apology to Body",
    days: [
        {
            title: "Surrender",
            morning: {
                title: "Drop the Weapons",
                task: "Stop 'fighting' the flare. Say 'I accept this is happening right now'.",
                science: "Resistance creates tension; tension increases pain."
            },
            evening: {
                title: "Gentle Touch",
                task: "Apply cream as if you were applying it to a baby.",
                reflection: "Touch communicates safety or aggression. Choose safety."
            }
        },
        {
            title: "Listening",
            morning: {
                title: "Body Scan",
                task: "Ask your body: 'What do you need?' (Rest? Water? Silence?)",
                science: "Interoception improves emotional regulation."
            },
            evening: {
                title: "The Letter",
                task: "Write 'I am sorry for hating you' to your skin.",
                reflection: "Grief and anger must be processed to heal."
            }
        },
        {
            title: "Nurture",
            morning: {
                title: "Comfort Food",
                task: "Eat something warm and nourishing slowly.",
                science: "Signaling safety through the gut-brain axis."
            },
            evening: {
                title: "Nest",
                task: "Make your bed extra comfortable. You deserve comfort.",
                reflection: "Creating a safe container."
            }
        },
        {
            title: "Emotion",
            morning: {
                title: "Name It",
                task: "Name the emotion under the itch. Is it Anger? Sadness?",
                science: "'Name it to tame it' - labeling reduces amygdala activity."
            },
            evening: {
                title: "Cry it Out",
                task: "If you need to cry, do it. Tears release cortisol.",
                reflection: "Emotional release often prevents skin eruption."
            }
        },
        {
            title: "Play",
            morning: {
                title: "Play Time",
                task: "Do something pointless and fun for 10 mins. Doodle, dance.",
                science: "Play engages the ventral vagal state (social engagement)."
            },
            evening: {
                title: "Soothing Audio",
                task: "Listen to the 'Apology to Body' track tonight.",
                reflection: "Auditory healing."
            }
        },
        {
            title: "Protection",
            morning: {
                title: "Say No",
                task: "Set one boundary today. Say no to a demand.",
                science: "Over-giving depletes the immune system."
            },
            evening: {
                title: "Bubble",
                task: "Visualize a protective bubble around you.",
                reflection: "You are allowed to protect your energy."
            }
        },
        {
            title: "Partnership",
            morning: {
                title: "Team Talk",
                task: "Say 'We are in this together' to your body.",
                science: "Shifting from adversary to ally."
            },
            evening: {
                title: "Peace Treaty",
                task: "Declare the war with your skin over.",
                reflection: "Healing flows where peace exists."
            }
        }
    ]
  }
};

const QUIZ_QUESTIONS = [
  {
    id: 'feeling',
    text: "When your skin flares, what do you feel first?",
    options: ["Ashamed", "Angry", "Anxious", "Disconnected"]
  },
  {
    id: 'hiding',
    text: "How often do you hide your skin?",
    options: ["Daily", "Weekly", "Rarely", "Never"]
  },
  {
    id: 'thought',
    text: "Which thought feels most familiar?",
    options: ["I'll never fix this", "Why me?", "I hate how I look", "I can't control this"]
  },
  {
    id: 'inner_voice',
    text: "Describe your inner voice:",
    options: ["Harsh / Judgmental", "Overwhelmed", "Lost", "Trying to be hopeful"]
  },
  {
    id: 'belief',
    text: "Do you believe you can heal?",
    options: ["No", "Maybe", "I hope so", "Absolutely"]
  },
  // --- NEW QUESTIONS ---
  {
    id: 'social',
    text: "How does your skin affect your social life?",
    options: ["I cancel plans often", "I go but I hide", "I feel awkward", "It doesn't stop me"]
  },
  {
    id: 'mirror',
    text: "How often do you check your skin in the mirror?",
    options: ["Constantly / Obsessively", "Morning and Night", "I avoid mirrors entirely", "Only when treating it"]
  },
  {
    id: 'sleep_anxiety',
    text: "What keeps you awake at night?",
    options: ["The Itch", "Worrying about tomorrow's skin", "General life stress", "Nothing, I sleep well"]
  },
  {
    id: 'control',
    text: "Do you feel in control of your body?",
    options: ["Completely", "Sometimes", "My skin controls me", "I am fighting it"]
  },
  {
    id: 'intimacy',
    text: "Does your skin affect intimacy or dating?",
    options: ["I pull away / Avoid touch", "I feel unlovable", "It makes me self-conscious", "No impact"]
  },
  {
    id: 'focus',
    text: "How does the itch affect your work/school?",
    options: ["I can't focus at all", "It's distracting", "I push through it", "No issue"]
  },
  {
    id: 'soothing',
    text: "What is your go-to soothing method when stressed?",
    options: ["Scratching until it hurts", "Scalding hot water", "Applying cream", "Distracting myself"]
  },
  {
    id: 'comparison',
    text: "Do you compare your skin to others?",
    options: ["Always / Triggers envy", "Only on bad days", "Sometimes", "Never"]
  },
  {
    id: 'trigger_awareness',
    text: "What seems to trigger a flare most?",
    options: ["Emotional Stress", "Food / Diet", "Weather / Heat", "I have no idea"]
  },
  {
    id: 'motivation',
    text: "Why do you want to heal *now*?",
    options: ["I have a big event coming", "I'm exhausted by the pain", "For my family/partner", "To feel free again"]
  }
];

const Mindfulness: React.FC<Props> = ({ profile, onUpdateProfile, onTalkToCoach }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Flow State
  const [viewMode, setViewMode] = useState<'QUIZ' | 'LIBRARY' | 'ACTIVE_MODULE'>('QUIZ');
  const [activeTab, setActiveTab] = useState<'morning' | 'evening'>('morning');
  
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  
  // Dev State for previewing days
  const [previewDayOffset, setPreviewDayOffset] = useState(0);
  
  // Initialize view
  useEffect(() => {
    if (profile?.mindset) {
        setViewMode('LIBRARY');
        // Set tab based on time of day
        const hour = new Date().getHours();
        setActiveTab(hour >= 17 ? 'evening' : 'morning');
    } else {
        setViewMode('QUIZ');
    }
  }, []);

  // Audio Logic
  useEffect(() => {
    if (playingId) {
      setProgress(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setPlayingId(null);
            return 0;
          }
          return prev + 1;
        });
      }, 200);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(0);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playingId]);

  const togglePlay = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
    }
  };

  // --- QUIZ HANDLERS ---
  const handleQuizAnswer = (answer: string) => {
    const currentQ = QUIZ_QUESTIONS[quizIndex];
    const newAnswers = { ...quizAnswers, [currentQ.id]: answer };
    setQuizAnswers(newAnswers);

    if (quizIndex < QUIZ_QUESTIONS.length - 1) {
      setQuizIndex(prev => prev + 1);
    } else {
      finishQuiz(newAnswers);
    }
  };

  const handleDevRandomizeQuiz = () => {
    const randomAnswers: Record<string, string> = {};
    QUIZ_QUESTIONS.forEach(q => {
        randomAnswers[q.id] = q.options[Math.floor(Math.random() * q.options.length)];
    });
    setQuizAnswers(randomAnswers);
    finishQuiz(randomAnswers);
  };

  const finishQuiz = (answers: Record<string, string>) => {
    const result = analyzeMindsetQuiz(answers);
    const newMindset = {
        persona: result.persona,
        assignedModuleId: result.moduleId,
        startDate: new Date().toISOString(),
        currentDay: 1,
        completedDays: [],
        quizAnswers: answers,
        streak: 0
    };
    
    if (onUpdateProfile) {
        onUpdateProfile({ mindset: newMindset });
    }
    setViewMode('LIBRARY');
  };

  // --- MODULE HANDLERS ---
  const handleSelectModule = (moduleId: string) => {
      if (onUpdateProfile && profile?.mindset) {
          onUpdateProfile({ 
              mindset: {
                  ...profile.mindset,
                  assignedModuleId: moduleId
              }
          });
      }
      setPreviewDayOffset(0);
      setViewMode('ACTIVE_MODULE');
  };

  const completeDailyTask = () => {
    if (!profile?.mindset || !onUpdateProfile) return;
    
    const currentCompleted = profile.mindset.completedDays || [];
    const today = new Date().toISOString().split('T')[0];
    
    if (currentCompleted.includes(today)) return;

    const newCompleted = [...currentCompleted, today];
    const newStreak = (profile.mindset.streak || 0) + 1;
    const nextDay = Math.min((profile.mindset.currentDay || 1) + 1, 7);

    onUpdateProfile({
      mindset: {
        ...profile.mindset,
        completedDays: newCompleted,
        streak: newStreak,
        currentDay: nextDay
      }
    });
  };

  const resetModule = () => {
    setViewMode('QUIZ');
    setQuizIndex(0);
    setQuizAnswers({});
  };

  // --- PERSONALIZATION ENGINE (DYNAMIC) ---
  const getPersonalizedInsight = (dayIndex: number, moduleId: string, taskTitle: string) => {
      if (!profile) return "Consistency creates change.";
      
      const { questionnaire, computed, mindset } = profile;
      if (!questionnaire) return "Every step counts.";

      // Universal Day 1 Logic
      if (dayIndex === 1) {
          if (mindset?.persona === 'The Fighter') return "Fighters often use scratching to regain control. This task pauses that reflex.";
          if (questionnaire.itchScore > 7) return "With an itch score of 8+, your neural pathways are firing rapidly. We need to interrupt the signal before it starts.";
          return "Awareness is 90% of the battle. You can't change what you don't notice.";
      }

      // Universal Day 2-3 Logic (Safety/Calm)
      if (dayIndex === 2 || dayIndex === 3) {
           if (computed?.inflammationLevel === 'High') return "Your inflammation score is high. Calming the mind sends a physical signal to cool the skin.";
           if (questionnaire.perceivedStress === 'High') return "High stress floods your system with cortisol. This exercise lowers the 'threat level' in your brain.";
      }

      // Module Specific Logic
      if (moduleId === 'rebuild-identity' || moduleId === 'attract-healed') {
           if (questionnaire.mentalImpact?.includes('Shame')) return "Shame thrives in secrecy. This task is about bringing light to your experience.";
           if (questionnaire.mentalImpact?.includes('Social Anxiety')) return "You mentioned social anxiety. This specific technique reduces the 'spotlight effect' when you go out.";
      }

      if (moduleId === 'rewire-itch') {
           if (taskTitle.includes('Hands')) return "Physical distraction competes with the scratch reflex in the brain.";
      }
      
      return "Your personalized plan targets the root of your flare triggers.";
  };

  // --- RENDERERS ---

  if (viewMode === 'QUIZ') {
    const q = QUIZ_QUESTIONS[quizIndex];
    return (
      <div className="p-6 max-w-2xl mx-auto min-h-[60vh] flex flex-col justify-center animate-fade-in relative">
         <button 
            onClick={handleDevRandomizeQuiz}
            className="absolute top-0 right-0 text-[10px] text-slate-400 flex items-center gap-1 hover:text-teal-600 border border-slate-200 px-2 py-1 rounded-full"
         >
            <Terminal size={10} /> Random Fill
         </button>

         <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Mind Relief System</h2>
            <p className="text-slate-500">Uncover the emotional roots of your flare-ups.</p>
         </div>
         
         <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
             <div className="flex justify-between text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">
                 <span>Question {quizIndex + 1} of {QUIZ_QUESTIONS.length}</span>
                 <span>Step 1</span>
             </div>
             <h3 className="text-xl font-bold text-slate-900 mb-6">{q.text}</h3>
             <div className="space-y-3">
                 {q.options.map(opt => (
                     <button
                        key={opt}
                        onClick={() => handleQuizAnswer(opt)}
                        className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all font-medium text-slate-700"
                     >
                         {opt}
                     </button>
                 ))}
             </div>
         </div>
      </div>
    );
  }

  // --- LIBRARY VIEW ---
  if (viewMode === 'LIBRARY') {
      const assignedId = profile?.mindset?.assignedModuleId || '';
      
      return (
        <div className="p-4 space-y-6 pb-24 max-w-2xl mx-auto animate-fade-in">
            <header className="mb-2">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
                    <LayoutGrid size={12} />
                    The Library
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Choose your path</h2>
                <p className="text-slate-500 text-sm mt-1">Based on your quiz, we recommend starting with the highlighted module.</p>
            </header>

            <div className="space-y-4">
                {Object.entries(MINDSET_MODULES).map(([id, module]) => {
                    const isRecommended = id === assignedId;
                    return (
                        <div 
                            key={id}
                            onClick={() => handleSelectModule(id)}
                            className={`relative rounded-2xl p-6 transition-all cursor-pointer group ${
                                isRecommended 
                                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 transform scale-[1.02]' 
                                : 'bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md'
                            }`}
                        >
                            {isRecommended && (
                                <div className="absolute -top-3 left-6 bg-white text-indigo-600 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                                    <Sparkles size={10} /> RECOMMENDED
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-bold text-lg ${isRecommended ? 'text-white' : 'text-slate-900'}`}>
                                    {module.title}
                                </h3>
                                <div className={`text-[10px] font-bold border px-2 py-1 rounded-lg flex items-center gap-1 ${
                                    isRecommended ? 'border-white/20 text-indigo-100' : 'border-slate-100 text-slate-400'
                                }`}>
                                    <Clock size={10} /> {module.duration}
                                </div>
                            </div>

                            <p className={`text-sm mb-4 leading-relaxed ${isRecommended ? 'text-indigo-100' : 'text-slate-500'}`}>
                                {module.description}
                            </p>

                            <div className="flex items-center gap-2 mb-4">
                                <Target size={14} className={isRecommended ? 'text-indigo-300' : 'text-teal-500'} />
                                <span className={`text-xs font-bold uppercase tracking-wide ${isRecommended ? 'text-indigo-200' : 'text-slate-400'}`}>
                                    Aim: {module.aim}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {module.tags.map(tag => (
                                    <span key={tag} className={`text-[10px] px-2 py-1 rounded-md font-medium ${
                                        isRecommended ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-500'
                                    }`}>
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                            
                            <div className={`absolute bottom-6 right-6 p-2 rounded-full transition-transform group-hover:translate-x-1 ${
                                isRecommended ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400'
                            }`}>
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="text-center pt-8">
                <button onClick={resetModule} className="text-xs text-slate-400 hover:text-slate-600 underline">
                    Retake Persona Quiz
                </button>
            </div>
        </div>
      );
  }

  // --- ACTIVE MODULE VIEW ---
  
  if (!profile?.mindset) return null;

  const currentModuleId = profile.mindset.assignedModuleId || 'rewire-itch';
  const currentModule = MINDSET_MODULES[currentModuleId] || MINDSET_MODULES['rewire-itch'];
  const currentDay = profile.mindset.currentDay || 1;
  const completedDays = profile.mindset.completedDays || [];
  const today = new Date().toISOString().split('T')[0];
  const isTaskComplete = completedDays.includes(today);

  // If completed today, show the task we just completed (Day X-1), otherwise show new task (Day X)
  const actualDisplayDay = (isTaskComplete && currentDay > 1) ? currentDay - 1 : currentDay;
  
  // Calculate view day (actual + offset)
  const displayDayIndex = Math.max(1, actualDisplayDay + previewDayOffset);
  
  // Get Day Plan (Safe access)
  const safeDayIndex = (displayDayIndex - 1) % currentModule.days.length;
  const currentPlan = currentModule.days[safeDayIndex];
  
  return (
    <div className="p-4 space-y-6 pb-24 max-w-2xl mx-auto animate-fade-in relative">
      <div className="flex justify-between items-center mb-2">
        <button 
            onClick={() => {
                setViewMode('LIBRARY');
                setPreviewDayOffset(0);
            }}
            className="flex items-center gap-1 text-slate-400 text-xs font-medium hover:text-slate-600"
        >
            <ArrowLeft size={14} /> Back to Library
        </button>

        {/* DEV CONTROLS */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button 
                onClick={() => setPreviewDayOffset(prev => Math.max(prev - 1, 1 - actualDisplayDay))}
                className="p-1 hover:bg-white rounded-md text-slate-500 transition-colors"
                title="Previous Day"
            >
                <ChevronLeft size={12} />
            </button>
            <span className="text-[10px] font-mono text-slate-500 px-1">DEV VIEW</span>
            <button 
                onClick={() => setPreviewDayOffset(prev => prev + 1)}
                className="p-1 hover:bg-white rounded-md text-slate-500 transition-colors"
                title="Next Day"
            >
                <ChevronRight size={12} />
            </button>
        </div>
      </div>

      <header className="mb-2">
         <div className="flex items-center justify-between">
            <div>
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
                    <Brain size={12} />
                    {currentModule.title}
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Day {displayDayIndex}: {currentPlan.title}</h2>
            </div>
            {isTaskComplete && previewDayOffset === 0 && (
                <div className="bg-green-100 text-green-700 p-2 rounded-full">
                    <CheckCircle size={24} />
                </div>
            )}
         </div>
         {/* Progress Bar */}
         <div className="w-full bg-slate-100 rounded-full h-2 mt-4">
             <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${(Math.min(displayDayIndex, 7) / 7) * 100}%` }}></div>
         </div>
      </header>

      {/* --- PERSONALIZED INSIGHT --- */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-lg flex items-start gap-3">
          <Lightbulb size={20} className="text-yellow-300 flex-shrink-0 mt-0.5" />
          <div>
              <h4 className="font-bold text-xs uppercase tracking-wider opacity-90 mb-1">Why you specifically?</h4>
              <p className="text-sm leading-relaxed font-medium">
                  "{getPersonalizedInsight(displayDayIndex, currentModuleId, currentPlan.morning.title)}"
              </p>
          </div>
      </div>

      {/* --- DAY PLAN TABS --- */}
      <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('morning')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'morning' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
          >
              <Sun size={16} /> Morning Ritual
          </button>
          <button 
            onClick={() => setActiveTab('evening')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'evening' ? 'bg-white shadow-sm text-indigo-900' : 'text-slate-400'}`}
          >
              <Moon size={16} /> Evening Reflection
          </button>
      </div>

      {/* --- TASK CONTENT --- */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden relative min-h-[300px]">
          {activeTab === 'morning' ? (
              <div className="p-6 space-y-6 animate-fade-in">
                  <div>
                      <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">Start Here</span>
                      <h3 className="text-xl font-bold text-slate-900 mt-2 mb-1">{currentPlan.morning.title}</h3>
                      <p className="text-slate-600 text-lg leading-relaxed">
                          "{currentPlan.morning.task}"
                      </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-400 mb-2">
                          <BookOpen size={14} />
                          <span className="text-xs font-bold uppercase">The Science</span>
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed italic">
                          {currentPlan.morning.science}
                      </p>
                  </div>

                  {/* Talk to Coach Button (Morning Context) */}
                  <button 
                    onClick={() => onTalkToCoach && onTalkToCoach(`I'm working on Day ${displayDayIndex} of ${currentModule.title}: "${currentPlan.morning.title}". The task is to ${currentPlan.morning.task}. Can you give me some tips?`)}
                    className="w-full mt-4 text-indigo-600 text-xs font-bold flex items-center justify-center gap-1 hover:underline"
                  >
                      <MessageSquare size={12} />
                      Get more help from your coach
                  </button>
              </div>
          ) : (
              <div className="p-6 space-y-6 animate-fade-in">
                   <div>
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">Check In</span>
                      <h3 className="text-xl font-bold text-slate-900 mt-2 mb-1">{currentPlan.evening.title}</h3>
                      <p className="text-slate-600 text-lg leading-relaxed">
                          "{currentPlan.evening.task}"
                      </p>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                      <div className="flex items-center gap-2 text-indigo-400 mb-2">
                          <Sparkles size={14} />
                          <span className="text-xs font-bold uppercase">Reflect</span>
                      </div>
                      <p className="text-sm text-indigo-800 leading-relaxed font-medium">
                          {currentPlan.evening.reflection}
                      </p>
                  </div>

                   {/* Talk to Coach Button (Evening Context) */}
                   <button 
                    onClick={() => onTalkToCoach && onTalkToCoach(`I'm reflecting on Day ${displayDayIndex} of ${currentModule.title}. The evening reflection is: "${currentPlan.evening.task}". Can you help me process this?`)}
                    className="w-full text-indigo-600 text-xs font-bold flex items-center justify-center gap-1 hover:underline -mb-2"
                  >
                      <MessageSquare size={12} />
                      Discuss this reflection with Coach
                  </button>

                  {/* Complete Button (Only visible in Evening tab) */}
                   <div className="pt-4 border-t border-slate-100">
                      {previewDayOffset === 0 ? (
                          !isTaskComplete ? (
                              <button 
                                onClick={completeDailyTask}
                                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                              >
                                  <CheckCircle size={20} /> Complete Day {displayDayIndex}
                              </button>
                          ) : (
                              <div className="w-full py-3 bg-green-50 text-green-700 font-bold rounded-xl border border-green-100 flex items-center justify-center gap-2">
                                  <CheckCircle size={20} /> Day Complete!
                              </div>
                          )
                      ) : (
                          <div className="w-full py-3 bg-slate-50 text-slate-400 font-bold rounded-xl border border-slate-100 flex items-center justify-center gap-2 cursor-not-allowed">
                              <Terminal size={16} /> Preview Mode (Read Only)
                          </div>
                      )}
                  </div>
              </div>
          )}
      </div>

      {/* SOS Button */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-orange-400 p-6 shadow-lg shadow-orange-200 transition-all ${playingId === 'sos' ? 'scale-105 shadow-xl' : ''}`}>
        <div className="relative z-10 text-white">
            <h3 className="text-2xl font-bold mb-1">SOS Relief</h3>
            <p className="opacity-90 text-sm mb-4">Sudden flare? Press here immediately.</p>
            
            {playingId === 'sos' ? (
                 <div className="space-y-3">
                    <div className="h-1 bg-rose-200/50 rounded-full overflow-hidden">
                        <div className="h-full bg-white transition-all duration-200" style={{ width: `${progress}%` }}></div>
                    </div>
                    <button onClick={() => togglePlay('sos')} className="bg-white text-rose-500 font-bold py-3 px-6 rounded-full flex items-center gap-2 hover:bg-rose-50 transition-colors">
                        <Pause size={20} fill="currentColor" />
                        Pause Session
                    </button>
                 </div>
            ) : (
                <button onClick={() => togglePlay('sos')} className="bg-white text-rose-500 font-bold py-3 px-6 rounded-full flex items-center gap-2 hover:scale-105 transition-transform shadow-sm">
                    <Play size={20} fill="currentColor" />
                    Play Emergency Audio
                </button>
            )}
        </div>
      </div>
      
      {/* Module Audio Player */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-800">Module Audio</h3>
        <div className={`bg-white p-4 rounded-xl border flex flex-col justify-center transition-all ${
            playingId === 'module-audio' ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500 bg-indigo-50/10' : 'border-slate-100'
        }`}>
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                <button 
                    onClick={() => togglePlay('module-audio')}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        playingId === 'module-audio' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    {playingId === 'module-audio' ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
                </button>
                <div>
                    <h4 className={`font-semibold ${playingId === 'module-audio' ? 'text-indigo-700' : 'text-slate-800'}`}>
                    {currentModule.audio}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-medium">Daily Practice</span>
                    <span>• 5 min</span>
                    </div>
                </div>
                </div>
            </div>
            {playingId === 'module-audio' && (
                <div className="mt-3 h-1 bg-indigo-100 rounded-full overflow-hidden w-full">
                    <div className="h-full bg-indigo-500 transition-all duration-200" style={{ width: `${progress}%` }}></div>
                </div>
            )}
        </div>
      </div>

    </div>
  );
};

export default Mindfulness;
