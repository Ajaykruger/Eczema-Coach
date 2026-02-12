
export enum SkinType {
  DRY = 'Dry/Cracked',
  WEEPING = 'Weeping',
  INFLAMED = 'Red/Inflamed',
  NORMAL = 'Maintenance',
  COMBINATION = 'Combination',
  OILY = 'Oily'
}

export enum BlendStatus {
  ACTIVE = 'Active',
  ORDERED = 'Ordered',
  SHIPPED = 'Shipped',
}

export interface DailyLog {
  id: string;
  date: string; // YYYY-MM-DD for grouping
  timestamp?: string; // ISO string with time for multiple entries
  itchScore: number; // 1-10
  stressScore: number; // 1-10
  sleepHours: number;
  mood?: string; // 🥴😐🙂🌞
  photoUrl?: string; // Keep for backward compatibility (primary thumbnail)
  images?: string[]; // New: Store multiple images
  aiRednessScore?: number; // 0-100, from ASCORAD
  aiLocations?: string[];
  aiSymptoms?: string[];
  notes?: string;
}

export interface SupplementAdditives {
  name: string;
  dose: string;
}

export interface BlendFormula {
  base: string;
  additives: SupplementAdditives[];
  flavor: string;
  name?: string; // Added to store custom blend name inside JSONB
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

// --- Mindset System Types ---

export type MindsetPersona = 
  | 'The Fighter' 
  | 'The Hider' 
  | 'The Hopeless Healer' 
  | 'The Wounded Inner Child' 
  | 'The Burnt-Out Overthinker';

export interface MindsetProfile {
  persona: MindsetPersona;
  assignedModuleId: string;
  startDate: string; // ISO Date
  currentDay: number; // 1-21
  completedDays: string[]; // Array of ISO dates
  quizAnswers: Record<string, string>;
  streak: number;
}

// --- Logic Engine Types ---

export interface QuestionnaireData {
  // --- Phase 0: Initial Scan ---
  scanImages?: string[];
  
  // --- Phase 1: Clinical Calibration ---
  fullName: string;
  age: number;
  biologicalSex: string; // Male, Female
  pregnancyStatus: string; // None, Pregnant, Breastfeeding
  height: number; // cm
  weight: number; // kg

  // --- Phase 2: Eczema Profile ---
  skinType: SkinType;
  eczemaOnset: string; // Childhood, Adulthood, Recent
  eczemaLocations: string[];
  visualAppearance: string[]; // Filled by AI or user
  atopicHistory: string[]; // Asthma, Hayfever, None
  scratchTiming: string[]; // New: Morning, Evening, Night (Sleep), Stress-induced

  // --- Phase 3: Environmental & Lifestyle (Deep Dive) ---
  showerTemp: string; // New: Hot, Warm, Cold
  moisturizerTexture: string; // New: Lotion, Cream, Ointment, Oil
  clothingFabrics: string[]; // New: Wool, Synthetic, Cotton, Bamboo
  laundryDetergent: string; // New: Scented, Hypoallergenic
  pets: string[]; // New: Dog, Cat, None
  climate: string; // New: Dry, Humid, Moderate
  sunEffect: string; // New: Improves, Worsens, Neutral
  sweatTrigger: string; // New: Yes (Stings), No

  // --- Phase 4: Internal Triggers ---
  dietStyle: string; // Standard, Vegan, Keto, AIP, Low Histamine
  suspectedTriggers: string[]; // Dairy, Gluten, Sugar, Nightshades
  gutHealth: string; // Good, Bloating, Reflux, Irregularity
  antibioticUse: boolean; // Last 6 months
  hydration: string; // <1L, 1-2L, >2L
  smoking: string; // Never, Occasional, Regular
  alcohol: string; // None, Low (<4), Moderate (4-10), High (>10)

  // --- Phase 5: Psychodermatology ---
  perceivedStress: string; // Low, Moderate, High, Overwhelmed
  itchScore: number; // 1-10
  sleepImpact: string; // None, Mild, Moderate, Severe
  mentalImpact: string[]; // Shame, Social Anxiety, Depression, None

  // --- Phase 6: Safety & Goals ---
  medicationUsage: string; // Steroids, Protopic, Biologics, TSW, None
  steroidUsageHistory: string; // New: None, <1yr, 1-5yrs, >5yrs
  exerciseLevel: string; // Sedentary, Moderate, Active, Athlete
  boneJointHealth: string[]; // Osteoporosis, Joint Pain, Fractures, None
  primaryGoal: string[]; // CHANGED: Array to support multiple goals

  // Legacy/Computed fields for backward compatibility
  primaryStruggle?: string; 
  successGoal?: string;
  deficiencyTestsDone?: string[];
  confirmedDeficiencies: string[];
  deficiencySymptoms: string[];
  foodTriggers?: string[]; // Mapped to suspectedTriggers
  socialWithdrawal?: boolean; // Mapped from mentalImpact
  shameLevel?: string; // Mapped from mentalImpact
  userGoals?: string; // Mapped from primaryGoal
}

export interface ComputedProfile {
  severityClass: 'Mild' | 'Moderate' | 'Severe' | 'High-Risk';
  poScorad: number; // Clinical Score
  easiScore: number; // Mapped Clinical Score
  psychodermProfile: 'Resilient' | 'Stress-Reactive' | 'Avoidant' | 'Shame-Prone';
  inflammationLevel: 'Low' | 'Moderate' | 'High';
  rootCauseSummary: string;
  supplementProtocol: {
    phase1: string[];
    phase2: string[];
    phase3: string[];
  };
  mindsetRoadmap: {
    sos: string;
    sleepSupport: string;
    cbtPathway: string;
  };
  nutritionSuggestions: string[];
  lifestyleTips: string[];
}

export interface UserProfile {
  name: string;
  skinType: SkinType;
  blendStatus: BlendStatus;
  currentFormula: BlendFormula;
  customBlendName?: string; // New: User defined name
  // Extended Data
  questionnaire?: QuestionnaireData;
  computed?: ComputedProfile;
  mindset?: MindsetProfile; // New Mindset System
}

export type ViewState = 'ONBOARDING' | 'DASHBOARD' | 'CHECKIN' | 'MINDFULNESS' | 'SUPPLEMENTS' | 'COACH' | 'GALLERY';
