
import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { DailyLog, UserProfile, ViewState } from '../types';
import { AlertCircle, Sun, Moon, Brain, Shield, TrendingUp, Camera, Image, Flame, Smile, Award, Users, LogOut } from 'lucide-react';
import { analyzeSymptomTrend } from '../services/logicEngine';
import { supabase } from '../services/supabaseClient';

interface Props {
  logs: DailyLog[];
  profile: UserProfile;
  setView: (view: ViewState) => void;
}

const Dashboard: React.FC<Props> = ({ logs, profile, setView }) => {
  // Format data for chart
  const data = logs.map(log => ({
    name: new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' }),
    fullDate: new Date(log.date).toLocaleDateString(),
    time: log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    itch: log.itchScore,
    stress: log.stressScore,
    // Normalize AI Score (0-100) to Chart Scale (0-10) for comparison
    redness: log.aiRednessScore ? (log.aiRednessScore / 10) : null
  }));

  const lastLog = logs[logs.length - 1];
  const prediction = analyzeSymptomTrend(logs);
  
  // Count total photos
  const photoCount = logs.reduce((acc, log) => acc + (log.images?.length || (log.photoUrl ? 1 : 0)), 0);

  // Calculate Streak
  let currentStreak = 0;
  if (logs.length > 0) {
      currentStreak = logs.length; // Simplified for MVP
  }

  // Generate Mini Win
  let miniWin = "You showed up today. That's the biggest step.";
  if (logs.length >= 2) {
      const prevLog = logs[logs.length - 2];
      if (lastLog.stressScore < prevLog.stressScore) miniWin = "Your stress levels dropped since yesterday. The mindfulness is working.";
      else if (lastLog.itchScore < prevLog.itchScore) miniWin = "Itch score improved! Your barrier is calming down.";
      else if (lastLog.sleepHours > prevLog.sleepHours) miniWin = "Better sleep detected. Deep repair happens in Delta waves.";
  }

  const handleSignOut = async () => {
      await supabase.auth.signOut();
  };

  return (
    <div className="p-4 space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Dynamic Morning Briefing Header */}
      <header className="flex justify-between items-start mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Good Morning, {profile.name.split(' ')[0]}</h1>
          <p className="text-sm text-slate-500 mt-1">
             {lastLog 
                ? `Your inflammation is ${lastLog.itchScore < 5 ? 'stabilizing' : 'active'}. Let's support your skin today.`
                : "Ready to start your Day 1?"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
            <div className="flex gap-2">
                <button 
                    onClick={handleSignOut}
                    className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 hover:bg-slate-200"
                    title="Sign Out"
                >
                    <LogOut size={16} />
                </button>
                <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold border border-teal-200">
                    {profile.name.charAt(0)}
                </div>
            </div>
            {currentStreak > 0 && (
                <div className="flex items-center text-[10px] font-bold text-orange-500 mr-1">
                    <Flame size={10} fill="currentColor" /> {currentStreak} Day{currentStreak > 1 ? 's' : ''}
                </div>
            )}
        </div>
      </header>

      {/* Mini Win Banner */}
      {logs.length > 1 && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-md flex items-center gap-3 animate-fade-in">
             <div className="p-2 bg-white/20 rounded-full">
                 <Award size={20} className="text-yellow-300" />
             </div>
             <div>
                 <h4 className="font-bold text-xs uppercase tracking-wider opacity-80">Weekly Win</h4>
                 <p className="font-medium text-sm leading-tight">{miniWin}</p>
             </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Sun size={16} />
                <span className="text-xs font-medium uppercase">Skin Mood</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">
                {lastLog?.mood || '—'}
            </div>
            <div className={`text-xs mt-1 ${lastLog?.itchScore > 5 ? 'text-red-500' : 'text-teal-500'}`}>
                {lastLog?.itchScore > 5 ? 'High Cortisol' : 'Barrier Stable'}
            </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Brain size={16} />
                <span className="text-xs font-medium uppercase">Focus</span>
            </div>
            <div className="text-lg font-bold text-slate-800 leading-tight">
                {profile.computed?.mindsetRoadmap?.cbtPathway.split(' ')[0] || 'Reframing'}
            </div>
             <div className="text-xs mt-1 text-slate-400">Daily Mindset</div>
        </div>
      </div>

      {/* Gallery Link Card (Transformation Engine) */}
      <div 
        onClick={() => setView('GALLERY')}
        className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 rounded-xl shadow-lg shadow-slate-200 text-white flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
      >
          <div className="flex items-center gap-4">
             <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                 <Camera size={24} />
             </div>
             <div>
                 <h3 className="font-bold text-sm">Your Transformation</h3>
                 {photoCount === 0 ? (
                     <p className="text-xs text-slate-300 mt-1">Start your journey. Snap "Day 1" now.</p>
                 ) : (
                     <p className="text-xs text-slate-300 mt-1">{photoCount} photos • See your progress</p>
                 )}
             </div>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-full text-xs font-bold">
              {photoCount === 0 ? "Start Now" : "View Gallery"}
          </div>
      </div>

      {/* Predictive Insight (EczemaTreat) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className={prediction.color} />
            <h3 className="font-bold text-slate-800 text-sm">Clinical Outlook</h3>
        </div>
        <div className="flex justify-between items-center">
             <div>
                <p className={`text-lg font-bold ${prediction.color}`}>{prediction.status}</p>
                <p className="text-xs text-slate-500 mt-1">{prediction.advice}</p>
             </div>
             <div className="text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600">
                {prediction.action}
             </div>
        </div>
      </div>

      {/* Skin-Brain Axis Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            Your Biometrics
          </h3>
          <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">7 Days</span>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} dy={10} />
              <YAxis domain={[0, 10]} hide />
              <Tooltip 
                content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                        const dataItem = payload[0].payload;
                        return (
                            <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 text-xs">
                                <p className="font-bold text-slate-900 mb-1">{dataItem.fullDate}</p>
                                {dataItem.time && <p className="text-slate-500 mb-2">{dataItem.time}</p>}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                        <span>Itch: {dataItem.itch}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                        <span>Stress: {dataItem.stress}</span>
                                    </div>
                                    {dataItem.redness !== null && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                            <span>Redness: {(dataItem.redness * 10).toFixed(0)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    }
                    return null;
                }}
                cursor={{stroke: '#e2e8f0', strokeWidth: 2}}
              />
              <Line 
                type="monotone" 
                dataKey="itch" 
                stroke="#f43f5e" 
                strokeWidth={3} 
                dot={{fill: '#f43f5e', strokeWidth: 0, r: 4}}
                name="Subjective Itch"
              />
              <Line 
                type="monotone" 
                dataKey="stress" 
                stroke="#6366f1" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Stress Level"
              />
              <Line 
                type="monotone" 
                dataKey="redness" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{fill: '#10b981', strokeWidth: 0, r: 4}}
                name="AI Redness (ASCORAD)"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-4 text-xs font-medium flex-wrap">
             <div className="flex items-center gap-2 text-slate-600">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div> Itch
             </div>
             <div className="flex items-center gap-2 text-slate-600">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 opacity-50"></div> Stress
             </div>
             <div className="flex items-center gap-2 text-slate-600">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> AI Redness
             </div>
        </div>
      </div>

      {/* Insight */}
      <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl flex gap-3 items-start">
        <Shield className="text-teal-600 w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
            <h4 className="font-bold text-teal-900 text-sm">Protocol Update</h4>
            <p className="text-teal-700 text-xs mt-1">
                Your <b>Phase 1</b> protocol targets {profile.computed?.inflammationLevel.toLowerCase()} inflammation. 
                Keep tracking daily to unlock Phase 2 (Gut Restoration).
            </p>
        </div>
      </div>

      {/* Social Proof Footer */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pb-4">
           <Users size={12} />
           <span>You're one of 4,612 people calming their skin today.</span>
      </div>
    </div>
  );
};

export default Dashboard;
