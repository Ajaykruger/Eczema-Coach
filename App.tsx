
import React, { useState, useEffect } from 'react';
import { ViewState, DailyLog, UserProfile, SkinType, BlendStatus, QuestionnaireData, BlendFormula } from './types';
import { supabase } from './services/supabaseClient';
import { Session } from '@supabase/supabase-js';

// Components
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import CheckIn from './components/CheckIn';
import Mindfulness from './components/Mindfulness';
import Supplements from './components/Supplements';
import AiCoach from './components/AiCoach';
import Gallery from './components/Gallery';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import { Loader2, X } from 'lucide-react';
import { INITIAL_PROFILE, MOCK_LOGS } from './services/mockData';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>('ONBOARDING');
  
  // Flow State
  const [showLanding, setShowLanding] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);
  
  // Coach Context State
  const [coachInitialMessage, setCoachInitialMessage] = useState<string>('');

  // Lazy Registration State
  const [pendingProfileData, setPendingProfileData] = useState<Partial<UserProfile> | null>(null);

  // App State
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    skinType: SkinType.DRY,
    blendStatus: BlendStatus.ACTIVE,
    currentFormula: { base: '', additives: [], flavor: '' }
  });
  
  const [logs, setLogs] = useState<DailyLog[]>([]);
  
  // 1. Initialize Session
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(session);
        if (session) {
          setShowLanding(false); 
          await fetchData(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        setLoading(false);
      }
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setShowLanding(false);
        fetchData(session.user.id);
      } else {
        // Handle Logout
        setLoading(false);
        setShowLanding(true);
        setProfile({
          name: '',
          skinType: SkinType.DRY,
          blendStatus: BlendStatus.ACTIVE,
          currentFormula: { base: '', additives: [], flavor: '' }
        });
        setLogs([]);
        setIsDevMode(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Save Pending Data AFTER Auth
  useEffect(() => {
    const savePendingData = async () => {
      if (session && pendingProfileData) {
        console.log("Session established, saving pending onboarding data...");
        await handleOnboardingComplete(pendingProfileData);
        setPendingProfileData(null); // Clear pending
        setShowAuthModal(false); // Close modal
      }
    };
    savePendingData();
  }, [session, pendingProfileData]);

  // 3. Fetch Data from Supabase
  const fetchData = async (userId: string) => {
    setLoading(true);
    try {
      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Fetch Logs
      const { data: logsData, error: logsError } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (profileData) {
        // Handle name retrieval from current_formula (preferred) or legacy column
        const formulaName = profileData.current_formula?.name || profileData.custom_blend_name;

        setProfile({
          name: profileData.full_name,
          skinType: profileData.skin_type,
          blendStatus: profileData.blend_status || BlendStatus.ACTIVE,
          currentFormula: profileData.current_formula || { base: 'Pending', additives: [], flavor: '' },
          customBlendName: formulaName,
          questionnaire: profileData.questionnaire,
          computed: profileData.computed,
          mindset: profileData.mindset // Added mindset mapping
        });
        
        // Map DB snake_case to TS camelCase
        const mappedLogs: DailyLog[] = (logsData || []).map((l: any) => {
          let parsedMood = l.mood;
          let cleanNotes = l.notes;
          
          if (!parsedMood && l.notes && typeof l.notes === 'string' && l.notes.startsWith('[Mood:')) {
             const match = l.notes.match(/^\[Mood: (.*?)\]\s*(.*)/) || l.notes.match(/^\[Mood: (.*?)\]$/);
             if (match) {
                 parsedMood = match[1];
                 cleanNotes = match[2] || '';
             }
          }

          return {
            id: l.id,
            date: l.date,
            timestamp: l.created_at, // Map DB timestamp to local
            itchScore: l.itch_score,
            stressScore: l.stress_score,
            sleepHours: l.sleep_hours,
            mood: parsedMood,
            notes: cleanNotes,
            images: l.images,
            aiRednessScore: l.ai_redness_score,
            aiLocations: l.ai_locations,
            aiSymptoms: l.ai_symptoms
          };
        });
        setLogs(mappedLogs);
        
        setView('DASHBOARD');
      } else {
        // No profile found -> New User -> Onboarding
        setView('ONBOARDING');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDevEntry = () => {
    setIsDevMode(true);
    setShowLanding(false);
    setProfile(INITIAL_PROFILE);
    setLogs(MOCK_LOGS);
    setView('DASHBOARD');
  };

  const handleOnboardingComplete = async (newProfileData: Partial<UserProfile>) => {
    // If no session, save to pending state and show Auth Modal
    if (!session) {
      setPendingProfileData(newProfileData);
      setShowAuthModal(true);
      return;
    }
    
    // Embed custom blend name into the formula object to avoid schema error
    const formulaToSave: BlendFormula = {
      ...newProfileData.currentFormula!,
      name: newProfileData.customBlendName
    };

    // 1. Save Profile
    // Note: We include computed and questionnaire. If 'mindset' is added to onboarding later, add it here too.
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: session.user.id,
      full_name: newProfileData.name,
      skin_type: newProfileData.skinType,
      questionnaire: newProfileData.questionnaire,
      computed: newProfileData.computed,
      current_formula: formulaToSave,
      updated_at: new Date()
    });

    if (profileError) {
        console.error("Error saving profile", JSON.stringify(profileError));
        if (profileError.code === 'PGRST204') {
             alert("Database Schema Error: Missing columns. Please run the supabase_setup.sql script.");
        } else {
             alert("Failed to save profile. Please try again.");
        }
        return;
    }

    setProfile(prev => ({ ...prev, ...newProfileData }));

    // 2. Create Initial Log with Scanned Images
    const scanImages = newProfileData.questionnaire?.scanImages || [];
    if (scanImages.length > 0) {
        const firstLog: DailyLog = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString(),
            itchScore: newProfileData.questionnaire?.itchScore || 5,
            stressScore: 5, // Default average for baseline
            sleepHours: 7, 
            images: scanImages,
            notes: 'Initial Onboarding Scan & Assessment',
            aiRednessScore: newProfileData.computed?.poScorad // Use the calculated score as baseline
        };

        const { error: logError } = await supabase.from('daily_logs').insert({
            user_id: session.user.id,
            date: firstLog.date,
            created_at: firstLog.timestamp, // Explicitly set creation time
            itch_score: firstLog.itchScore,
            stress_score: firstLog.stressScore,
            sleep_hours: firstLog.sleepHours,
            notes: firstLog.notes,
            images: firstLog.images,
            ai_redness_score: firstLog.aiRednessScore
        });

        if (!logError) {
            setLogs(prev => [...prev, firstLog]);
        } else {
            console.error("Failed to save initial log", logError);
        }
    }

    setView('DASHBOARD');
  };

  const handleProfileUpdate = async (updates: Partial<UserProfile>) => {
    // In Dev Mode, just update local state
    if (isDevMode) {
      setProfile(prev => ({ ...prev, ...updates }));
      return;
    }

    if (!session) return;
    
    // Optimistic UI update
    setProfile(prev => ({ ...prev, ...updates }));

    // DB Update (Map camelCase to snake_case for specific fields)
    const dbUpdates: any = {};
    if (updates.blendStatus) dbUpdates.blend_status = updates.blendStatus;
    if (updates.name) dbUpdates.full_name = updates.name;
    if (updates.skinType) dbUpdates.skin_type = updates.skinType;
    if (updates.questionnaire) dbUpdates.questionnaire = updates.questionnaire;
    if (updates.computed) dbUpdates.computed = updates.computed;
    if (updates.mindset) dbUpdates.mindset = updates.mindset; // Added mindset update
    
    // Logic to update formula name inside current_formula JSONB
    if (updates.currentFormula || updates.customBlendName) {
      const formula = updates.currentFormula || profile.currentFormula;
      const name = updates.customBlendName || profile.customBlendName;
      dbUpdates.current_formula = { ...formula, name };
    }
    
    if (Object.keys(dbUpdates).length === 0) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ ...dbUpdates, updated_at: new Date() })
      .eq('id', session.user.id);

    if (error) {
      console.error("Error updating profile", JSON.stringify(error));
      if (error.code === 'PGRST204') {
        alert(`Supabase Error: Column missing. If you see 'mindset', please run the SQL migration.\n\n${error.message}`);
      }
    }
  };

  const handleSaveLog = async (log: DailyLog) => {
    // In Dev Mode, just update local state
    if (isDevMode) {
      setLogs(prev => [...prev, log]);
      setView('DASHBOARD');
      return;
    }

    if (!session) return;

    // Workaround: DB schema might be missing 'mood'. 
    const notePayload = log.mood 
        ? `[Mood: ${log.mood}] ${log.notes || ''}` 
        : log.notes;

    // Save to DB
    const { data, error } = await supabase.from('daily_logs').insert({
      user_id: session.user.id,
      date: log.date,
      created_at: log.timestamp, // Ensure time is saved
      itch_score: log.itchScore,
      stress_score: log.stressScore,
      sleep_hours: log.sleepHours,
      notes: notePayload,
      images: log.images, // Storing base64 array in jsonb
      ai_redness_score: log.aiRednessScore,
      ai_locations: log.aiLocations,
      ai_symptoms: log.aiSymptoms
    }).select();

    if (error) {
        console.error("Error saving log:", JSON.stringify(error));
        // Fallback check: If images/ai columns also fail, try minimal insert
        if (error.code === 'PGRST204' && (error.message.includes('images') || error.message.includes('ai_'))) {
             alert("Database schema mismatch. Trying basic save...");
             const { error: retryError } = await supabase.from('daily_logs').insert({
                  user_id: session.user.id,
                  date: log.date,
                  created_at: log.timestamp,
                  itch_score: log.itchScore,
                  stress_score: log.stressScore,
                  sleep_hours: log.sleepHours,
                  notes: notePayload
             });
             if (!retryError) {
                 setLogs(prev => [...prev, log]);
                 setView('DASHBOARD');
                 return;
             }
        }
        
        alert(`Failed to save log: ${error.message}`);
        return;
    }

    setLogs(prev => [...prev, log]);
    setView('DASHBOARD');
  };

  const handleTalkToCoach = (context: string) => {
      setCoachInitialMessage(context);
      setView('COACH');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );
  }

  // --- FLOW CONTROL ---

  // 1. Landing Page (Only if guest and flow active)
  if (!session && showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} onDevEntry={handleDevEntry} />;
  }

  // 2. Auth Modal (Overlay)
  const AuthModal = () => (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
       <div className="relative w-full max-w-md">
           <button 
             onClick={() => setShowAuthModal(false)}
             className="absolute top-4 right-4 z-10 p-2 bg-white/10 rounded-full text-white hover:bg-white/20"
           >
              <X size={20} />
           </button>
           <Auth prefilledMessage="Your skin analysis is ready! Create a secure account to save your results and view your custom plan." />
       </div>
    </div>
  );

  // 3. Onboarding (Guest Allowed)
  // If we are in Guest Mode (!session) but passed Landing, we show Onboarding.
  if (!session && !showLanding && !isDevMode) {
    return (
        <>
            <Onboarding 
              onComplete={handleOnboardingComplete} 
              onCancel={() => setShowLanding(true)}
            />
            {showAuthModal && <AuthModal />}
        </>
    );
  }

  // 4. Authenticated View
  if (view === 'ONBOARDING') {
    return (
        <Onboarding 
            onComplete={handleOnboardingComplete} 
            onCancel={() => supabase.auth.signOut()}
        />
    );
  }

  return (
    <Layout currentView={view} setView={setView}>
      {view === 'DASHBOARD' && <Dashboard logs={logs} profile={profile} setView={setView} />}
      {view === 'CHECKIN' && <CheckIn onSave={handleSaveLog} onCancel={() => setView('DASHBOARD')} />}
      {view === 'MINDFULNESS' && 
        <Mindfulness 
            profile={profile} 
            onUpdateProfile={handleProfileUpdate} 
            onTalkToCoach={handleTalkToCoach}
        />
      }
      {view === 'SUPPLEMENTS' && <Supplements profile={profile} logs={logs} onUpdateProfile={handleProfileUpdate} />}
      {view === 'COACH' && 
        <AiCoach 
            profile={profile} 
            logs={logs} 
            initialMessage={coachInitialMessage} 
            onClearInitialMessage={() => setCoachInitialMessage('')} 
            onUpdateProfile={handleProfileUpdate}
        />
      }
      {view === 'GALLERY' && <Gallery logs={logs} onBack={() => setView('DASHBOARD')} />}
    </Layout>
  );
};

export default App;
