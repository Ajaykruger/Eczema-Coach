
import React, { useState, useEffect } from 'react';
import { UserProfile, DailyLog, BlendStatus, SkinType } from '../types';
import { Package, RefreshCw, Info, Lock, TrendingUp, X, CreditCard, Plus, Minus, Search, ShoppingBag, Shield, Zap, Droplet, ArrowRight, Star, Edit3, Check, ChevronDown, Sparkles } from 'lucide-react';
import { analyzeSymptomTrend } from '../services/logicEngine';
import { INGREDIENTS_DB, Ingredient } from '../services/ingredients';

interface Props {
  profile: UserProfile;
  logs: DailyLog[];
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
}

// Map categories to "Benefit Marketing Headers"
const getBenefitCategory = (cat: string) => {
    switch(cat) {
        case 'Proteins': return 'Barrier Builders';
        case 'Fats': return 'Moisture Locks';
        case 'Vitamins': return 'Cellular Repair';
        case 'Minerals': return 'Reaction Calmness';
        case 'Amino Acids': return 'Growth Factors';
        case 'Other': return 'Specialized Actives';
        default: return cat;
    }
};

const getPersonalizedReason = (name: string, profile: UserProfile): string => {
  const q = profile.questionnaire;
  const c = profile.computed;
  
  // Fallbacks if data missing
  if (!q || !c) return "Standard protocol for barrier repair.";

  const n = name.toLowerCase();

  // --- CORE & STRUCTURAL ---
  if (n.includes('zinc')) {
    if (c.inflammationLevel === 'High') return "Your redness score indicated high inflammation. Zinc is critical for calming the cytokine storm.";
    return "The 'Master Mineral' for skin. Essential for DNA synthesis and wound healing.";
  }
  if (n.includes('collagen')) {
    if (q.medicationUsage === 'Steroids') return "Steroids can thin the skin over time. Collagen peptides are added to help maintain dermal thickness and resilience.";
    if (q.skinType === SkinType.DRY || q.skinType === SkinType.COMBINATION) return "Your dry skin type lacks structural integrity. Collagen peptides provide the scaffold to hold moisture.";
    return "Provides high levels of Glycine and Proline, the specific amino acids needed to repair damaged skin tissue.";
  }
  if (n.includes('mct')) {
      if (q.visualAppearance.includes('Dry')) return "Your skin is signaling lipid depletion. MCT provides clean fatty acids to rebuild your oil barrier from within.";
      return "Provides rapid energy for cellular regeneration without triggering insulin spikes.";
  }

  // --- INFLAMMATION & ITCH ---
  if (n.includes('quercetin')) {
    if (q.primaryStruggle === 'Itch') return `Since your primary struggle is Itch, we've prioritized Quercetin as a natural antihistamine to stabilize mast cells.`;
    if (q.itchScore > 4) return `You reported an Itch Score of ${q.itchScore}/10. Quercetin acts to stop the itch signal at the source.`;
    return "Potent antioxidant to reduce oxidative stress on your skin barrier.";
  }
  if (n.includes('vitamin c')) {
      if (q.visualAppearance.includes('Weeping') || q.deficiencySymptoms.includes('Slow Healing')) return "Critical for collagen cross-linking to close open wounds and speed up healing.";
      return "Works synergistically with Quercetin to stabilize mast cells.";
  }

  // --- LIFESTYLE ---
  if (n.includes('electrolyte')) {
      if (q.exerciseLevel === 'Active' || q.exerciseLevel === 'Athlete') return "Heavy sweating depletes minerals and can alkalize skin pH. Electrolytes help maintain balance during your workouts.";
      return "Maintains cellular hydration.";
  }

  // --- GUT HEALTH ---
  if (n.includes('glutamine')) {
    if (q.gutHealth !== 'good' && q.gutHealth !== 'Good') return `You noted '${q.gutHealth}' gut issues. Glutamine fuels enterocytes to seal the gut lining, stopping triggers from entering your bloodstream.`;
    if (q.dietStyle === 'Standard') return "Added to repair gut mucosal integrity compromised by dietary gaps.";
    return "Supports the Gut-Skin Axis by ensuring your intestinal barrier is strong.";
  }
  if (n.includes('probiotic')) {
      return "Restores microbiome diversity to reduce systemic inflammation stemming from the gut.";
  }
  if (n.includes('digezyme')) {
      return "Ensures you actually absorb these nutrients despite reported gut sensitivity.";
  }

  // --- STRESS & MOOD ---
  if (n.includes('magnesium')) {
    if (q.primaryStruggle === 'Sleep') return "Since Sleep is your #1 goal, Magnesium is critical here to activate GABA receptors for deep, restorative rest.";
    if (q.perceivedStress !== 'low' && q.perceivedStress !== 'Low') return `High stress depletes Magnesium rapidly. Replenishing this lowers cortisol to break the stress-itch cycle.`;
    return "Relaxation mineral to support nervous system health.";
  }
  if (n.includes('ashwagandha') || n.includes('rhodiola')) {
      if (q.perceivedStress === 'high' || q.perceivedStress === 'overwhelmed' || q.perceivedStress === 'High' || q.perceivedStress === 'Overwhelmed') return "A potent adaptogen added to help your body physically handle the high stress load you reported.";
      return "Modulates cortisol levels to prevent stress-induced flare ups.";
  }

  // --- DEFICIENCIES ---
  if (n.includes('vitamin d')) {
      return "Regulates the immune system's response to triggers.";
  }
  if (n.includes('vitamin k2')) {
      return "Works with Vitamin D to ensure calcium is deposited in bones, not soft tissue.";
  }
  if (n.includes('iron')) {
      if (q.deficiencySymptoms?.includes('Fatigue')) return "Added to address the fatigue you reported, supporting oxygen transport to skin cells.";
      return "Essential for blood health and energy.";
  }

  // Generic lookup
  const item = INGREDIENTS_DB.find(i => i.name === name);
  if (item && item.category === 'Amino Acids') return "Building blocks for repairing damaged skin tissue.";
  if (item && item.category === 'Vitamins') return "Micronutrient support for cellular health.";

  return "Selected to optimize your specific skin recovery profile.";
};

const Supplements: React.FC<Props> = ({ profile, logs, onUpdateProfile }) => {
  const [activeTab, setActiveTab] = useState<'current' | 'builder' | 'roadmap'>('current');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Builder State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [customFormula, setCustomFormula] = useState<string[]>([]);
  
  // Custom Name State
  const [blendName, setBlendName] = useState(profile.customBlendName || `${profile.name.split(' ')[0]}'s Formula`);
  const [isEditingName, setIsEditingName] = useState(false);

  // Accordion State
  const [expandedIngredients, setExpandedIngredients] = useState<string[]>([]);

  const computed = profile.computed;
  const prediction = analyzeSymptomTrend(logs);

  // Initialize custom formula from profile
  useEffect(() => {
    if (profile.currentFormula.additives) {
      setCustomFormula(profile.currentFormula.additives.map(a => a.name));
    }
  }, [profile.currentFormula]);

  const toggleIngredient = (name: string) => {
    setCustomFormula(prev => {
      if (prev.includes(name)) return prev.filter(i => i !== name);
      return [...prev, name];
    });
  };

  const toggleAccordion = (name: string) => {
    setExpandedIngredients(prev => 
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    );
  };

  const calculateTotal = (ingredients: string[]) => {
    let total = 0;
    ingredients.forEach(name => {
      const item = INGREDIENTS_DB.find(i => i.name === name);
      if (item) total += item.price;
    });
    // Add Base Price if applicable
    const baseItem = INGREDIENTS_DB.find(i => i.name === profile.currentFormula.base);
    if (baseItem) total += baseItem.price;
    
    return total;
  };

  const currentTotal = calculateTotal(customFormula);
  const dailyCost = currentTotal / 30; // 30 day supply

  const handleOrder = async () => {
    setIsProcessing(true);
    // Simulate API call to Tailorblend
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update Profile Status
    onUpdateProfile({ 
        blendStatus: BlendStatus.ORDERED,
        customBlendName: blendName,
        currentFormula: {
            ...profile.currentFormula,
            additives: customFormula.map(name => ({ name, dose: 'Clinical' }))
        } 
    });
    setIsProcessing(false);
    setShowOrderModal(false);
    alert(`Order for ${blendName} successfully sent!`);
  };

  const categories = ['All', ...Array.from(new Set(INGREDIENTS_DB.map(i => i.category)))];

  const filteredIngredients = INGREDIENTS_DB.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
    <div className="p-4 space-y-6 pb-24 max-w-2xl mx-auto">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Your Tailorblend</h2>
        <p className="text-slate-500">Precision formulated to rebuild your {profile.skinType.toLowerCase()} skin barrier.</p>
      </header>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl">
        <button 
            onClick={() => setActiveTab('current')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'current' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
        >
            Current Blend
        </button>
        <button 
            onClick={() => setActiveTab('builder')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'builder' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
        >
            Edit Formula
        </button>
        <button 
            onClick={() => setActiveTab('roadmap')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'roadmap' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
        >
            The Journey
        </button>
      </div>

      {activeTab === 'current' && (
        <div className="space-y-6 animate-fade-in">
             {/* Urgent "Basket" Logic */}
             {profile.blendStatus !== BlendStatus.ORDERED && profile.blendStatus !== BlendStatus.SHIPPED && (
                 <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-start gap-3">
                    <Info size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-rose-800 text-sm">Your formula is pending</h4>
                        <p className="text-rose-700 text-xs mt-1">
                            This custom blend is sitting in the lab. Every day you wait is another day your skin fights inflammation alone.
                        </p>
                    </div>
                 </div>
             )}

             {/* Main Status Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-slate-900 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    
                    <div className="relative z-10">
                        {/* Custom Name Editor */}
                        <div className="mb-4">
                            {isEditingName ? (
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        value={blendName} 
                                        onChange={(e) => setBlendName(e.target.value)}
                                        className="bg-white text-slate-900 px-2 py-1 rounded border border-white outline-none text-lg font-bold w-full"
                                        autoFocus
                                        onBlur={() => setIsEditingName(false)}
                                    />
                                    <button onClick={() => setIsEditingName(false)} className="bg-teal-600 p-1 rounded"><Check size={16}/></button>
                                </div>
                            ) : (
                                <div className="flex justify-between items-start">
                                    <div className="group cursor-pointer" onClick={() => setIsEditingName(true)}>
                                        <h3 className="font-bold text-lg flex items-center gap-2">
                                            {blendName}
                                            <Edit3 size={14} className="opacity-0 group-hover:opacity-50 text-slate-400" />
                                        </h3>
                                        <p className="text-slate-400 text-sm">#TB-{profile.name.split(' ')[0].toUpperCase()}-01</p>
                                    </div>
                                    <div className={`text-xs font-bold px-2 py-1 rounded text-white uppercase tracking-wider ${
                                        profile.blendStatus === BlendStatus.ACTIVE ? 'bg-teal-500' : 
                                        profile.blendStatus === BlendStatus.ORDERED ? 'bg-indigo-500' : 'bg-green-500'
                                    }`}>
                                        {profile.blendStatus}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex gap-4 mt-6">
                            {profile.blendStatus === BlendStatus.ACTIVE ? (
                                <button 
                                    onClick={() => setShowOrderModal(true)}
                                    className="flex-1 bg-white text-slate-900 font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-lg"
                                >
                                    <ShoppingBag size={18} className="text-teal-600" />
                                    Start My 30-Day Reset
                                </button>
                            ) : (
                                <div className="flex-1 bg-slate-800 text-slate-400 font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 cursor-default">
                                    <Package size={16} />
                                    Processing Order
                                </div>
                            )}
                        </div>
                        <p className="text-center text-xs text-slate-400 mt-3">
                            Starts at <b>R {dailyCost.toFixed(2)} / day</b> to reclaim your skin.
                        </p>
                    </div>
                </div>
                
                <div className="p-6">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Shield size={16} className="text-teal-500"/> 
                        What's inside & Why
                    </h4>
                    <div className="space-y-2">
                        {customFormula.map((name, idx) => {
                             const item = INGREDIENTS_DB.find(i => i.name === name);
                             const benefitCat = item ? getBenefitCategory(item.category) : 'Active';
                             const isExpanded = expandedIngredients.includes(name);
                             const reason = getPersonalizedReason(name, profile);
                             
                             return (
                                <div key={idx} className="border-b border-slate-50 last:border-0">
                                    <div 
                                        className="flex justify-between items-center py-3 cursor-pointer group"
                                        onClick={() => toggleAccordion(name)}
                                    >
                                        <div>
                                            <div className="text-slate-800 font-bold text-sm flex items-center gap-2">
                                                {name}
                                                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </div>
                                            <div className="text-teal-600 text-[10px] uppercase font-bold tracking-wide mt-0.5">{benefitCat}</div>
                                        </div>
                                        <span className="text-slate-400 font-mono text-xs">
                                            {item ? `R ${item.price.toFixed(2)}` : '-'}
                                        </span>
                                    </div>
                                    
                                    {isExpanded && (
                                        <div className="bg-teal-50/50 p-3 rounded-lg mb-3 animate-fade-in text-sm border border-teal-100/50">
                                            <div className="flex gap-2">
                                                <Sparkles size={14} className="text-teal-500 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <span className="block text-[10px] font-bold text-teal-700 uppercase mb-0.5">Why for you?</span>
                                                    <p className="text-slate-600 leading-relaxed text-xs">
                                                        {reason}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                             );
                        })}
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
                        <span className="font-bold">Base:</span> {profile.currentFormula.base} 
                        <span className="text-slate-300">|</span>
                        <span className="font-bold">Flavor:</span> {profile.currentFormula.flavor}
                    </div>
                    <div className="text-center mt-6">
                        <a href="https://www.tailorblend.co.za/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-400 hover:text-teal-600 underline transition-colors">
                            Manufactured in Cape Town via Tailorblend™
                        </a>
                    </div>
                </div>
            </div>

            {/* Micro Testimonials */}
            <div className="grid grid-cols-2 gap-3">
                 <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                     <div className="flex text-yellow-400 mb-1"><Star size={10} fill="currentColor"/><Star size={10} fill="currentColor"/><Star size={10} fill="currentColor"/><Star size={10} fill="currentColor"/><Star size={10} fill="currentColor"/></div>
                     <p className="text-xs text-slate-600 italic leading-snug">"I didn't think powder could help until week 2... now I sleep without scratching."</p>
                     <p className="text-[10px] text-slate-400 font-bold mt-2">- Sarah J.</p>
                 </div>
                 <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                     <div className="flex text-yellow-400 mb-1"><Star size={10} fill="currentColor"/><Star size={10} fill="currentColor"/><Star size={10} fill="currentColor"/><Star size={10} fill="currentColor"/><Star size={10} fill="currentColor"/></div>
                     <p className="text-xs text-slate-600 italic leading-snug">"The calm I feel is real. My neck flares are gone."</p>
                     <p className="text-[10px] text-slate-400 font-bold mt-2">- Mike T.</p>
                 </div>
            </div>

            {/* Why Card */}
            <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                <h4 className="font-bold text-indigo-900 text-sm mb-2">Why we built this for you</h4>
                <p className="text-indigo-800 text-sm leading-relaxed">
                    {computed?.rootCauseSummary || "Customized based on your skin profile."}
                    <br/><br/>
                    <b>We recommend sticking to Phase 1 for at least 30 days to see clinical results.</b>
                </p>
            </div>
        </div>
      )}

      {activeTab === 'builder' && (
          <div className="animate-fade-in pb-16">
              <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4 shadow-sm">
                  <h3 className="font-bold text-slate-900 text-sm">Expert Mode</h3>
                  <p className="text-xs text-slate-500">You can adjust your formula below. Warning: altering the AI recommendation may impact results.</p>
              </div>

              {/* Search & Filter */}
              <div className="sticky top-0 bg-slate-50 z-10 space-y-3 mb-4">
                  <div className="relative">
                      <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search specific nutrients..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                      />
                  </div>
              </div>

              {/* Ingredient List */}
              <div className="space-y-3">
                  {filteredIngredients.map(item => {
                      const isSelected = customFormula.includes(item.name);
                      return (
                        <div key={item.id} className={`p-4 rounded-xl border flex justify-between items-center transition-all ${
                            isSelected ? 'bg-teal-50 border-teal-200 shadow-sm' : 'bg-white border-slate-100'
                        }`}>
                            <div>
                                <h4 className={`font-bold text-sm ${isSelected ? 'text-teal-900' : 'text-slate-800'}`}>{item.name}</h4>
                                <p className="text-xs text-slate-400 mt-0.5">{getBenefitCategory(item.category)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-sm font-mono ${isSelected ? 'text-teal-700 font-bold' : 'text-slate-500'}`}>
                                    R {item.price.toFixed(2)}
                                </span>
                                <button 
                                    onClick={() => toggleIngredient(item.name)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                        isSelected ? 'bg-teal-500 text-white hover:bg-red-500' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                    }`}
                                >
                                    {isSelected ? <Minus size={16} /> : <Plus size={16} />}
                                </button>
                            </div>
                        </div>
                      );
                  })}
              </div>

              {/* Sticky Footer Total */}
              <div className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex justify-between items-center z-20">
                  <div>
                      <p className="text-xs text-slate-400">Monthly Total</p>
                      <p className="text-xl font-bold">R {currentTotal.toFixed(2)}</p>
                  </div>
                  <button 
                    onClick={() => setShowOrderModal(true)}
                    className="bg-white text-slate-900 px-6 py-2 rounded-xl font-bold text-sm hover:bg-teal-50 transition-colors flex items-center gap-2"
                  >
                      <ShoppingBag size={16} />
                      Start Reset
                  </button>
              </div>
          </div>
      )}

      {activeTab === 'roadmap' && computed && (
          <div className="space-y-6 animate-fade-in">
              <div className="text-center py-2">
                  <h3 className="font-bold text-slate-900">Your Healing Journey</h3>
                  <p className="text-xs text-slate-500">Healing happens in layers. Trust the process.</p>
              </div>

              {/* Phase 1 */}
              <div className="bg-white p-5 rounded-xl border-l-4 border-teal-500 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                      <Shield size={64} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Current Phase</span>
                        <span className="text-xs font-bold text-slate-400">Week 1 of 4</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-100 rounded-full mb-3 overflow-hidden">
                        <div className="h-full bg-teal-500 w-1/4 rounded-full"></div>
                    </div>

                    <h3 className="font-bold text-slate-800 text-lg mb-2">The "Ceasefire" Protocol</h3>
                    <p className="text-sm text-slate-600 mb-4">
                        Goal: Put out the fire. We focus on lowering systemic inflammation and reducing cortisol to give your barrier a chance to breathe.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {computed.supplementProtocol.phase1.map(item => (
                            <span key={item} className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-md font-medium border border-teal-100">{item}</span>
                        ))}
                    </div>
                  </div>
              </div>

              {/* Phase 2 */}
              <div className="bg-slate-50 p-5 rounded-xl border-l-4 border-slate-300 opacity-80 relative group">
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-20 group-hover:bg-white/30 transition-all cursor-not-allowed">
                        <div className="bg-white px-4 py-2 rounded-full shadow-sm flex items-center gap-2 text-xs font-bold text-slate-500">
                            <Lock size={12} />
                            Unlocks after Week 4
                        </div>
                  </div>
                  <div className="flex justify-between items-start opacity-50">
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Phase 2 • Weeks 5-8</span>
                        <h3 className="font-bold text-slate-700 text-lg">Restore the Gut</h3>
                        <p className="text-sm text-slate-500 mt-1 mb-3">Goal: Heal the root. We introduce targeted probiotics to fix dysbiosis.</p>
                        <div className="flex flex-wrap gap-2">
                            {computed.supplementProtocol.phase2.map(item => (
                                <span key={item} className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-md font-medium">{item}</span>
                            ))}
                        </div>
                    </div>
                  </div>
              </div>

              {/* Phase 3 */}
              <div className="bg-slate-50 p-5 rounded-xl border-l-4 border-slate-300 opacity-60 relative">
                 <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-20 cursor-not-allowed">
                        <div className="bg-white px-4 py-2 rounded-full shadow-sm flex items-center gap-2 text-xs font-bold text-slate-500">
                            <Lock size={12} />
                            Unlocks after Week 8
                        </div>
                  </div>
                  <div className="opacity-50">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Phase 3 • Maintenance</span>
                        <h3 className="font-bold text-slate-700 text-lg">Resilient Skin</h3>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {computed.supplementProtocol.phase3.map(item => (
                                <span key={item} className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-md font-medium">{item}</span>
                            ))}
                        </div>
                  </div>
              </div>
          </div>
      )}
    </div>

    {/* Order Modal */}
    {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-slide-up sm:animate-fade-in">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-900">Review Order</h3>
                    <button onClick={() => setShowOrderModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    {/* Product Summary */}
                    <div className="flex gap-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                             <Package size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">{blendName}</h4>
                            <p className="text-xs text-slate-500">{customFormula.length} Active Ingredients • Flavor: {profile.currentFormula.flavor}</p>
                            <p className="text-teal-600 font-bold mt-1 text-lg">R {currentTotal.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="border-t border-b border-slate-100 py-4 space-y-2">
                         <div className="flex justify-between text-sm">
                             <span className="text-slate-500">Monthly Subtotal</span>
                             <span className="text-slate-900 font-medium">R {currentTotal.toFixed(2)}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                             <span className="text-slate-500">Shipping (Standard)</span>
                             <span className="text-slate-900 font-medium">Free</span>
                         </div>
                         <div className="flex justify-between text-base pt-2">
                             <span className="font-bold text-slate-900">Total</span>
                             <span className="font-bold text-slate-900">R {currentTotal.toFixed(2)}</span>
                         </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <button 
                        onClick={handleOrder}
                        disabled={isProcessing}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70 shadow-lg shadow-teal-200"
                    >
                        {isProcessing ? (
                            <>
                                <RefreshCw className="animate-spin" size={20} />
                                Confirming...
                            </>
                        ) : (
                            <>
                                <CreditCard size={20} />
                                Pay & Start Phase 1
                            </>
                        )}
                    </button>
                    <div className="text-center mt-3 text-[10px] text-slate-400 flex items-center justify-center gap-1">
                        <Lock size={10} />
                        Secure Payment via PayFast
                    </div>
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default Supplements;
