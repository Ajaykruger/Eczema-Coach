
import { DailyLog, SkinType, BlendStatus, UserProfile } from '../types';

export const MOCK_LOGS: DailyLog[] = [
  { id: '1', date: '2023-10-24', itchScore: 8, stressScore: 7, sleepHours: 5, notes: 'Bad flare up' },
  { id: '2', date: '2023-10-25', itchScore: 7, stressScore: 8, sleepHours: 6, notes: 'Work stress high' },
  { id: '3', date: '2023-10-26', itchScore: 6, stressScore: 6, sleepHours: 6.5, notes: 'Used SOS cream' },
  { id: '4', date: '2023-10-27', itchScore: 5, stressScore: 4, sleepHours: 7, notes: 'Better sleep' },
  { id: '5', date: '2023-10-28', itchScore: 4, stressScore: 5, sleepHours: 7.5, notes: 'Weekend rest' },
  { id: '6', date: '2023-10-29', itchScore: 3, stressScore: 3, sleepHours: 8, notes: 'Skin feels calm' },
  { id: '7', date: '2023-10-30', itchScore: 5, stressScore: 6, sleepHours: 6, notes: 'Monday blues' },
];

export const INITIAL_PROFILE: UserProfile = {
  name: 'Dev User',
  skinType: SkinType.DRY,
  blendStatus: BlendStatus.ACTIVE,
  currentFormula: {
    base: 'Vegan Rice Protein',
    additives: [
      { name: 'Quercetin', dose: '500mg' },
      { name: 'Bromelain', dose: '250mg' },
      { name: 'Zinc A.A.C.', dose: '22mg' },
      { name: 'Ashwagandha', dose: '300mg'}
    ],
    flavor: 'Baobab Vanilla'
  },
  customBlendName: "Dev's Relief Blend",
  mindset: {
    persona: 'The Fighter',
    assignedModuleId: 'rewire-itch',
    startDate: new Date().toISOString(),
    currentDay: 1,
    completedDays: [],
    quizAnswers: {},
    streak: 3
  },
  questionnaire: {
    scanImages: [],
    fullName: 'Dev User',
    age: 30,
    biologicalSex: 'Female',
    pregnancyStatus: 'None',
    height: 170,
    weight: 65,

    skinType: SkinType.DRY,
    eczemaOnset: 'Childhood',
    eczemaLocations: ['Arms', 'Neck'],
    visualAppearance: ['Red', 'Dry'],
    atopicHistory: ['Hayfever'],
    scratchTiming: ['Night', 'Stress-induced'],

    showerTemp: 'Hot',
    moisturizerTexture: 'Lotion',
    clothingFabrics: ['Cotton', 'Synthetic'],
    laundryDetergent: 'Scented',
    pets: ['Cat'],
    climate: 'Dry',
    sunEffect: 'Improves',
    sweatTrigger: 'Yes',

    dietStyle: 'Standard',
    suspectedTriggers: ['Dairy'],
    gutHealth: 'Bloating',
    antibioticUse: false,
    hydration: '1-2L',
    smoking: 'Never',
    alcohol: 'Low (<4)',

    perceivedStress: 'High',
    itchScore: 7,
    sleepImpact: 'Moderate',
    mentalImpact: ['Anxiety'],

    medicationUsage: 'Topical Steroids',
    steroidUsageHistory: '1-5 years',
    exerciseLevel: 'Moderate',
    boneJointHealth: ['None'],
    primaryGoal: ['Stop Itch', 'Sleep Better'],
    
    confirmedDeficiencies: [],
    deficiencySymptoms: []
  },
  computed: {
      severityClass: 'Moderate',
      poScorad: 35,
      easiScore: 12,
      psychodermProfile: 'Stress-Reactive',
      inflammationLevel: 'Moderate',
      rootCauseSummary: "Simulated dev profile with moderate inflammation markers driven by stress and environmental heat triggers.",
      supplementProtocol: {
          phase1: ['Zinc A.A.C.', 'Quercetin', 'Collagen Peptides', 'Ashwagandha'],
          phase2: ['Probiotic', 'L-Glutamine'],
          phase3: ['Vitamin D3']
      },
      mindsetRoadmap: {
          sos: "Cooling Visualization",
          sleepSupport: "Deep Delta Wave Hypnosis",
          cbtPathway: "Stress Reframing"
      },
      nutritionSuggestions: ["Reduce dairy", "Increase Omega-3"],
      lifestyleTips: ["Switch to lukewarm showers", "Rinse sweat immediately"]
  }
};
