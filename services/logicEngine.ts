
import { ComputedProfile, QuestionnaireData, SkinType, DailyLog, MindsetProfile, MindsetPersona } from "../types";

// --- Helper: mapSeverityScores Logic ---
const calculateClinicalScores = (data: QuestionnaireData) => {
  // 1. Area (A): Approx Rule of 9s based on locations selected
  // Face/Neck (~9%), Arms (~18%), Hands (~5%), Torso (~36%), Legs (~36%)
  let areaScore = 0;
  if (data.eczemaLocations.includes('Face')) areaScore += 4.5;
  if (data.eczemaLocations.includes('Neck')) areaScore += 1;
  if (data.eczemaLocations.includes('Hands')) areaScore += 2.5;
  if (data.eczemaLocations.includes('Arms')) areaScore += 9;
  if (data.eczemaLocations.includes('Torso')) areaScore += 18;
  if (data.eczemaLocations.includes('Legs')) areaScore += 18;
  
  // Cap Area at 100
  areaScore = Math.min(areaScore, 100);

  // 2. Intensity (B): Based on Visual Appearance count
  // Signs: Dryness, Erythema (Red), Swelling, Oozing, Excoriation, Lichenification
  let intensityItems = 0;
  if (data.visualAppearance.includes('Dry')) intensityItems += 2; 
  if (data.visualAppearance.includes('Red')) intensityItems += 2; 
  if (data.visualAppearance.includes('Weeping')) intensityItems += 3; // High weight
  if (data.visualAppearance.includes('Crusting')) intensityItems += 2;
  if (data.visualAppearance.includes('Swelling')) intensityItems += 2;
  if (data.visualAppearance.includes('Lichenified')) intensityItems += 2;
  
  const intensityScore = Math.min(intensityItems, 18);

  // 3. Subjective (C): Itch (0-10) + Sleep (0-10)
  const itch = data.itchScore;
  let sleep = 0;
  if (data.sleepImpact === 'mild' || data.sleepImpact === 'Mild') sleep = 2;
  if (data.sleepImpact === 'moderate' || data.sleepImpact === 'Moderate') sleep = 5;
  if (data.sleepImpact === 'severe' || data.sleepImpact === 'Severe') sleep = 8;
  const subjectiveScore = itch + sleep;

  // Calculate PO-SCORAD
  const poScorad = (areaScore / 5) + (7 * (intensityScore / 2)) + subjectiveScore;

  // Map to EASI (Approximation)
  const easiScore = poScorad / 2.5;

  return { 
    poScorad: parseFloat(poScorad.toFixed(1)), 
    easiScore: parseFloat(easiScore.toFixed(1)) 
  };
};

export const runLogicEngine = (data: QuestionnaireData): ComputedProfile => {
  const { poScorad, easiScore } = calculateClinicalScores(data);

  // 1. Determine Severity Class
  let severityClass: ComputedProfile['severityClass'] = 'Mild';
  if (poScorad > 50) {
    severityClass = 'High-Risk';
  } else if (poScorad > 28) {
    severityClass = 'Severe';
  } else if (poScorad > 15) {
    severityClass = 'Moderate';
  }

  // 2. Determine Psychodermatology Profile
  let psychodermProfile: ComputedProfile['psychodermProfile'] = 'Resilient';
  // Check specifically for shame/withdrawal markers first
  if (data.mentalImpact?.includes('Shame')) {
    psychodermProfile = 'Shame-Prone';
  } else if (data.mentalImpact?.includes('Social Anxiety')) {
    psychodermProfile = 'Avoidant';
  } else if (data.perceivedStress === 'high' || data.perceivedStress === 'High' || data.perceivedStress === 'overwhelmed' || data.perceivedStress === 'Overwhelmed') {
    psychodermProfile = 'Stress-Reactive';
  }

  // 3. Inflammation Level
  let inflammationLevel: ComputedProfile['inflammationLevel'] = 'Low';
  const activeSigns = ['Red', 'Weeping', 'Crusting', 'Swelling'];
  const activeSignCount = data.visualAppearance.filter(s => activeSigns.includes(s)).length;
  
  if (activeSignCount >= 2 || data.itchScore > 6 || poScorad > 40) {
    inflammationLevel = 'High';
  } else if (activeSignCount === 1 || data.itchScore > 4 || data.visualAppearance.includes('Dry')) {
    inflammationLevel = 'Moderate';
  }

  // 4. Generate Root Cause Summary (Specific & Dynamic)
  const triggers = [];
  
  if (data.eczemaOnset === 'Childhood') triggers.push('genetic filaggrin deficiency');
  if (data.medicationUsage === 'TSW (Withdrawal)' || data.medicationUsage === 'Withdrawal') triggers.push('vascular dilation (TSW)');
  
  if (data.perceivedStress === 'High' || data.perceivedStress === 'Overwhelmed') triggers.push('chronic cortisol spikes');
  if (data.gutHealth !== 'Good' && data.gutHealth !== 'good') triggers.push('gut microbiome dysbiosis');
  if (data.dietStyle === 'Standard' && data.suspectedTriggers.length > 0) triggers.push('dietary inflammation');
  if (data.hydration === '<1L') triggers.push('cellular dehydration');
  if (data.smoking !== 'Never' && data.smoking !== '') triggers.push('oxidative stress from smoking');
  if (data.pets.length > 0) triggers.push('household protein allergens'); // New
  if (data.showerTemp === 'Hot (Steaming)') triggers.push('thermal barrier stripping'); // New
  
  // New Exercise Logic
  if (data.exerciseLevel === 'Active' || data.exerciseLevel === 'Athlete') {
      if (data.eczemaLocations.includes('Arms') || data.eczemaLocations.includes('Legs')) {
          triggers.push('sweat-induced alkalization');
      }
  }

  let rootCauseSummary = "";
  if (triggers.length > 0) {
      rootCauseSummary = `Your profile suggests a complex flare loop driven by ${triggers.join(', ')}. Addressing these internal triggers is your priority.`;
  } else {
      rootCauseSummary = `Your eczema appears primarily "Barrier-Defective," meaning your skin struggles to retain lipids and water, making it hyper-reactive to environmental triggers.`;
  }

  // 5. Build Supplement Protocol (Highly Granular)
  const phase1 = new Set<string>();
  const phase2 = new Set<string>();
  const phase3 = new Set<string>();

  // --- CORE FOUNDATION ---
  phase1.add('Zinc A.A.C.');

  // --- 5.1 SKIN TYPE & STRUCTURE ---
  // If user uses steroids, Collagen is MANDATORY for Phase 1 to counter thinning
  // Smokers also need collagen support immediately
  if ([SkinType.DRY, SkinType.COMBINATION, SkinType.WEEPING].includes(data.skinType) || 
      data.medicationUsage?.includes('Steroids') || 
      data.medicationUsage?.includes('TSW') ||
      data.steroidUsageHistory === '>5 years' || // New
      data.smoking === 'Regular') {
      phase1.add('Collagen Peptides'); 
  } else {
      phase2.add('Collagen Peptides');
  }

  // --- 5.2 INFLAMMATION & ITCH ---
  const hasVisibleInflammation = data.visualAppearance.some(s => ['Red', 'Weeping', 'Crusting', 'Swelling'].includes(s));
  // If primary struggle is Itch, prioritize Quercetin
  if (data.itchScore > 4 || hasVisibleInflammation || inflammationLevel !== 'Low' || data.primaryGoal.includes('Stop Itch') || data.sweatTrigger === 'Yes (Stings)') {
      phase1.add('Quercetin');
  }

  // Vitamin C Logic: Weeping skin, slow healing, OR Smoking
  if (data.itchScore > 6 || data.visualAppearance.includes('Weeping') || data.smoking !== 'Never') {
      phase1.add('Vitamin C');
  }

  // --- 5.3 LIFESTYLE FACTORS ---
  // Electrolytes for active users (sweat management)
  if (data.exerciseLevel === 'Active' || data.exerciseLevel === 'Athlete' || data.sweatTrigger === 'Yes (Stings)') {
      phase1.add('Electrolyte Blend');
  }

  // Liver Support for Alcohol
  if (data.alcohol === 'Moderate (4-10)' || data.alcohol === 'High (>10)') {
      phase2.add('Milk Thistle');
  }

  // Vegan Support
  if (data.dietStyle === 'Vegan' || data.dietStyle === 'Vegetarian') {
      phase1.add('Vitamin B12 (Methylcobalamin)');
      phase2.add('Iron A.A.C.');
  }

  // --- 5.4 GUT-SKIN AXIS ---
  if (data.gutHealth !== 'Good' || data.suspectedTriggers.length > 0) {
      phase1.add('L-Glutamine'); 
      phase2.add('DigeZyme®');
      phase2.add('Probiotic');
  } else {
      phase2.add('Probiotic');
  }

  // --- 5.5 STRESS & NERVOUS SYSTEM ---
  // If primary struggle is Sleep, Magnesium is Priority #1
  if (data.perceivedStress !== 'Low' || data.sleepImpact !== 'None' || psychodermProfile === 'Stress-Reactive' || data.primaryGoal.includes('Sleep Better')) {
      phase1.add('Magnesium Glycinate');
  }

  if (data.perceivedStress === 'High' || data.perceivedStress === 'Overwhelmed') {
      // Check safety: pregnancy
      if (data.pregnancyStatus === 'None') {
          phase1.add('Ashwagandha');
      }
  } else if (data.perceivedStress === 'Moderate') {
       if (data.pregnancyStatus === 'None') {
          phase3.add('Ashwagandha');
       }
  }

  // --- 5.6 LIPID BARRIER ---
  if (data.visualAppearance.includes('Dry') || data.visualAppearance.includes('Lichenified') || data.skinType === SkinType.DRY || data.climate === 'Dry/Cold') {
      phase1.add('MCT Powder');
  } else {
      phase3.add('MCT Powder');
  }

  // --- 5.7 MICRONUTRIENTS & BONES ---
  // Bone health logic (Osteoporosis or Steroid use)
  if (data.boneJointHealth?.includes('Osteoporosis') || data.medicationUsage?.includes('Steroids')) {
      phase1.add('Vitamin D3');
      phase1.add('Vitamin K2');
      phase1.add('Calcium Lactate');
  } else {
      // General Maintenance
       phase1.add('Vitamin D3');
       phase1.add('Vitamin K2');
  }
  // New Sun logic
  if (data.sunEffect === 'Improves') {
      // If sun helps, they might rely on it, but still need D3 in winter
      // No change needed, but maybe less priority
  } else if (data.sunEffect === 'Worsens') {
      phase1.add('N-Acetyl-L-Cysteine'); // Antioxidant for photosensitivity
  }

  // 6. Mindset Roadmap
  let cbtPathway = "Stress Reframing";
  if (psychodermProfile === 'Shame-Prone' || data.primaryGoal.includes('Confidence')) cbtPathway = "Mirror Work & Self-Compassion";
  if (psychodermProfile === 'Avoidant') cbtPathway = "Behavioral Activation";

  let sosAudio = "Progressive Muscle Relaxation";
  if (data.itchScore > 6 || data.primaryGoal.includes('Stop Itch') || data.scratchTiming.includes('Constant')) sosAudio = "Cooling Visualization (Itch Interruption)";
  if (data.sleepImpact === 'Severe' || data.primaryGoal.includes('Sleep Better') || data.scratchTiming.includes('Night (Sleep)')) sosAudio = "Deep Sleep Hypnosis";

  // 7. Personalized Tips (Lifestyle)
  const nutritionSuggestions = [];
  if (data.gutHealth !== 'Good') nutritionSuggestions.push("Strict 4-week elimination of gluten & dairy.");
  if (data.visualAppearance.includes('Dry')) nutritionSuggestions.push("Add 2 tbsp of flaxseed or chia to breakfast.");
  if (data.medicationUsage?.includes('Steroids')) nutritionSuggestions.push("Increase Vitamin C rich foods to support skin thickness.");
  if (data.smoking !== 'Never') nutritionSuggestions.push("Double your Vitamin C intake to counter smoke-induced oxidation.");

  const lifestyleTips = [];
  if (data.perceivedStress === 'High') lifestyleTips.push("Mandatory 10min vagus nerve stimulation (humming/cold water).");
  if (data.exerciseLevel === 'Active') lifestyleTips.push("Rinse sweat immediately with cool water to prevent alkalization.");
  if (data.primaryGoal.includes('Sleep Better')) lifestyleTips.push("Keep room temperature below 19°C (66°F) to reduce itch.");
  
  // New Lifestyle Tips from deep dive
  if (data.showerTemp === 'Hot (Steaming)') lifestyleTips.push("Switch to lukewarm showers immediately. Hot water strips lipids.");
  if (data.clothingFabrics.includes('Wool') || data.clothingFabrics.includes('Synthetic/Polyester')) lifestyleTips.push("Switch to 100% cotton or bamboo layers to reduce micro-friction.");
  if (data.laundryDetergent === 'Scented/Regular') lifestyleTips.push("Switch to 'Free & Clear' detergent. Fragrance is a top contact allergen.");
  if (data.pets.length > 0) lifestyleTips.push("Keep pets out of the bedroom to create a dander-free sleep sanctuary.");
  if (data.sweatTrigger === 'Yes (Stings)') lifestyleTips.push("Carry a thermal water spray to neutralize sweat pH instantly.");

  return {
    severityClass,
    poScorad,
    easiScore,
    psychodermProfile,
    inflammationLevel,
    rootCauseSummary,
    supplementProtocol: {
      phase1: Array.from(phase1),
      phase2: Array.from(phase2),
      phase3: Array.from(phase3),
    },
    mindsetRoadmap: {
      sos: sosAudio,
      sleepSupport: "Deep Delta Wave Hypnosis",
      cbtPathway,
    },
    nutritionSuggestions,
    lifestyleTips,
  };
};

export const analyzeSymptomTrend = (logs: DailyLog[]) => {
  if (logs.length < 3) return { status: 'Calibrating', color: 'text-slate-500', advice: 'Keep logging. We need a few more days to learn your flare patterns.', action: 'Track Daily' };

  const recentLogs = logs.slice(-7);
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  const n = recentLogs.length;
  
  recentLogs.forEach((log, index) => {
    let clinicalScore = log.itchScore;
    if (log.aiRednessScore !== undefined && log.aiRednessScore > 0) {
        clinicalScore = ((log.aiRednessScore / 10) * 0.6) + (log.itchScore * 0.4);
    }
    sumX += index;
    sumY += clinicalScore;
    sumXY += index * clinicalScore;
    sumXX += index * index;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  if (slope < -0.15) {
    return { 
      status: 'Improving', 
      color: 'text-green-600',
      advice: 'The protocol is working. Inflammation velocity is dropping.',
      action: 'Continue Phase 1'
    };
  } else if (slope > 0.15) {
    return { 
      status: 'Worsening', 
      color: 'text-rose-600',
      advice: 'Inflammation is accelerating. Check food triggers.',
      action: 'Use SOS Audio'
    };
  } else {
    return { 
      status: 'Plateau', 
      color: 'text-amber-600',
      advice: 'Healing has stabilized. Stick to the routine.',
      action: 'Check Adherence'
    };
  }
};

// --- NEW MINDSET LOGIC ---
export const analyzeMindsetQuiz = (answers: Record<string, string>): { persona: MindsetPersona, moduleId: string } => {
  const q1 = answers['feeling'] || ''; // Ashamed, Angry, Anxious, etc.
  const q2 = answers['thought'] || ''; // Never fix, Hate look, Why me

  // New Deep Dive answers
  const control = answers['control'] || ''; // Fighting it, Controls me
  const soothing = answers['soothing'] || ''; // Scratching, Hot water
  const mirror = answers['mirror'] || ''; // Avoid, Obsessive
  const social = answers['social'] || ''; // Hide, Cancel plans

  let persona: MindsetPersona = 'The Burnt-Out Overthinker';
  let moduleId = 'stress-safety';

  // 1. THE FIGHTER
  // Triggered by Anger, Control issues, Aggressive soothing (scratching/hot water)
  if (q1 === 'Angry' || q2.includes('control') || soothing.includes('Scratching') || soothing.includes('Hot water') || control.includes('fighting')) {
      persona = 'The Fighter';
      moduleId = 'rewire-itch';
  } 
  // 2. THE HIDER
  // Triggered by Shame, Avoiding mirrors, Hiding socially
  else if (q1 === 'Ashamed' || q2.includes('Hate') || mirror.includes('avoid') || social.includes('hide')) {
      persona = 'The Hider';
      moduleId = 'rebuild-identity';
  } 
  // 3. THE HOPELESS HEALER
  // Triggered by "Never fix", "Controls me", Lack of belief
  else if (q2.includes('Never') || answers['belief'] === 'No' || control.includes('controls me')) {
      persona = 'The Hopeless Healer';
      moduleId = 'attract-healed';
  } 
  // 4. THE WOUNDED INNER CHILD
  // Triggered by Disconnection, Pulling away intimacy, Emotional triggers
  else if (q1 === 'Disconnected' || answers['inner_voice'] === 'Lost' || answers['intimacy']?.includes('pull away')) {
      persona = 'The Wounded Inner Child';
      moduleId = 'release-battle';
  } 
  // 5. DEFAULT: THE BURNT-OUT OVERTHINKER
  // Triggered by Anxiety, Sleep worry, Focus issues
  else {
      persona = 'The Burnt-Out Overthinker';
      moduleId = 'stress-safety';
  }

  return { persona, moduleId };
};
