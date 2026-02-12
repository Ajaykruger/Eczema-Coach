
import React, { useState } from 'react';
import { ArrowRight, Star, Shield, Brain, Zap, Check, Lock, Activity, Users, Camera, Microscope, Leaf, Menu, X, CheckCircle, Beaker, Gift, FileText, Smartphone, ChevronDown, PlayCircle, HelpCircle, Sparkles, Terminal } from 'lucide-react';

interface Props {
  onGetStarted: () => void;
  onDevEntry?: () => void;
}

const LandingPage: React.FC<Props> = ({ onGetStarted, onDevEntry }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900 overflow-x-hidden">
      
      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-b border-slate-100 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
              <Activity size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">EczemaCoach<span className="text-teal-600">SA</span></span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <button onClick={() => scrollToSection('science')} className="hover:text-teal-600 transition-colors">The Science</button>
            <button onClick={() => scrollToSection('features')} className="hover:text-teal-600 transition-colors">Features</button>
            <button onClick={() => scrollToSection('reviews')} className="hover:text-teal-600 transition-colors">Stories</button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-teal-600 transition-colors">FAQ</button>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:block">
            <button 
              onClick={onGetStarted}
              className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-slate-800 transition-all hover:scale-105 shadow-xl shadow-slate-900/20"
            >
              Analyze My Skin
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-slate-600">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 p-6 absolute w-full shadow-2xl animate-slide-down z-50">
             <div className="flex flex-col gap-6 text-center font-medium text-lg">
                <button onClick={() => scrollToSection('science')}>The Science</button>
                <button onClick={() => scrollToSection('features')}>Features</button>
                <button onClick={() => scrollToSection('offer')}>Pricing</button>
                <button onClick={onGetStarted} className="bg-teal-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-teal-500/20">Start Analysis</button>
             </div>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal-50/50 rounded-full blur-[100px] -mr-60 -mt-60 -z-10 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-[100px] -ml-40 -mb-40 -z-10"></div>
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          <div className="text-center lg:text-left lg:col-span-7">
             <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 mb-8 shadow-sm animate-fade-in hover:border-teal-300 transition-colors cursor-default">
                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="text-xs font-bold tracking-wide uppercase text-slate-600">South Africa's First Psychoderm App</span>
             </div>
             
             <h1 className="text-4xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6 text-slate-900">
               Stop The Itch-Scratch-Flare Cycle And Start <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-indigo-600">Building Skin You're Confident In</span>
             </h1>
             
             <p className="text-lg text-slate-500 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
               Using AI Technology And SCORAD Clinical Scans To Create A <b className="text-slate-900">Custom Plan</b> That Fixes Your Mindset, Gut Health, And Skin Health—<b className="text-slate-900">Without Depending On Endless Creams</b>, Steroids, Or Treatments That Stop Working After A Few Days
             </p>

             <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
               <button 
                 onClick={onGetStarted}
                 className="w-full sm:w-auto px-8 py-4 bg-teal-600 text-white font-bold text-lg rounded-2xl hover:bg-teal-700 transition-all transform hover:scale-[1.02] shadow-xl shadow-teal-500/30 flex items-center justify-center gap-2"
               >
                 Take the Skin Quiz <ArrowRight size={20} />
               </button>
               <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                 <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-sm">
                            <img src={`https://i.pravatar.cc/100?img=${i + 15}`} alt="User" />
                        </div>
                    ))}
                 </div>
                 <span className="pl-2">4,600+ Healing in SA</span>
               </div>
             </div>
             
             <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1"><Shield size={12}/> POPIA Compliant</span>
                <span className="flex items-center gap-1"><Lock size={12}/> Secure Medical Data</span>
             </div>
          </div>

          {/* Hero Visual */}
          <div className="relative mx-auto lg:ml-auto lg:mr-0 max-w-[300px] lg:max-w-[340px] lg:col-span-5 hidden md:block">
             <div className="relative z-10 bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl border-4 border-slate-100 rotate-[-3deg] hover:rotate-0 transition-transform duration-700">
                 <div className="bg-slate-50 rounded-[2rem] overflow-hidden aspect-[9/19] relative flex flex-col">
                    {/* Simulated App Screen */}
                    <div className="bg-gradient-to-b from-teal-600 to-teal-500 p-8 text-white h-[35%]">
                        <div className="flex justify-between items-start mb-6">
                           <div className="w-10 h-10 bg-white/20 rounded-full backdrop-blur-md flex items-center justify-center"><Menu size={20}/></div>
                           <div className="w-10 h-10 bg-white/20 rounded-full backdrop-blur-md overflow-hidden">
                              <img src="https://i.pravatar.cc/100?img=32" />
                           </div>
                        </div>
                        <div className="text-2xl font-bold mb-1">Hi, Sarah</div>
                        <div className="opacity-80 text-sm">Let's calm your skin today.</div>
                    </div>
                    <div className="flex-1 bg-slate-50 p-6 -mt-8 rounded-t-3xl relative z-10">
                        {/* Mock Card 1 */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase">AI Insight</span>
                                <span className="bg-rose-50 text-rose-500 text-[10px] font-bold px-2 py-0.5 rounded-full">Alert</span>
                            </div>
                            <div className="font-bold text-slate-800 text-sm">High Stress Detected</div>
                            <p className="text-xs text-slate-500 mt-1">Your logs correlate stress with tomorrow's flare.</p>
                        </div>
                        
                        {/* Mock Card 2 */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 border border-slate-100 flex gap-3 items-center">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center">
                                <PlayCircle size={20} fill="currentColor" className="text-indigo-200" />
                            </div>
                            <div>
                                <div className="font-bold text-slate-800 text-sm">SOS Itch Relief</div>
                                <div className="text-xs text-slate-400">3 min • Audio Therapy</div>
                            </div>
                        </div>

                         {/* Mock Card 3 */}
                         <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100">
                            <div className="font-bold text-teal-800 text-sm mb-2">Daily Supplement</div>
                            <div className="flex gap-1">
                                <div className="h-2 w-8 bg-teal-200 rounded-full"></div>
                                <div className="h-2 w-8 bg-teal-200 rounded-full"></div>
                                <div className="h-2 w-4 bg-teal-200 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                 </div>
             </div>
             
             {/* Floating Elements */}
             <div className="absolute top-1/3 -right-12 bg-white p-4 rounded-2xl shadow-xl animate-bounce delay-700 border border-slate-50 z-20">
                 <div className="flex items-center gap-3">
                     <div className="bg-green-100 p-2 rounded-full text-green-600"><Check size={16}/></div>
                     <div>
                         <p className="font-bold text-slate-800 text-sm">Itch Reduced</p>
                         <p className="text-xs text-slate-400">Week 2 Check-in</p>
                     </div>
                 </div>
             </div>
          </div>
        </div>
      </header>

      {/* --- SOCIAL PROOF --- */}
      <section className="py-10 border-y border-slate-100 bg-slate-50/50">
         <div className="max-w-7xl mx-auto px-6">
             <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Trusted by 4,000+ South Africans</p>
             <div className="flex flex-wrap justify-center gap-12 lg:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                {/* Simulated Logos */}
                <span className="text-2xl font-bold font-serif text-slate-800">VOGUE</span>
                <span className="text-2xl font-bold font-sans tracking-widest text-slate-800">WomensHealth</span>
                <span className="text-2xl font-bold font-mono text-slate-800">Men'sHealth</span>
                <span className="text-2xl font-bold font-serif italic text-slate-800">Goop</span>
             </div>
         </div>
      </section>

      {/* --- THE PROBLEM (Psychodermatology) --- */}
      <section id="science" className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center mb-16">
           <h2 className="text-teal-600 font-bold tracking-widest uppercase text-sm mb-3">The Root Cause</h2>
           <h3 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Why "just moisturizing" fails.</h3>
           <p className="text-lg text-slate-500 leading-relaxed">
             Traditional dermatology treats the skin in isolation. But eczema is a <b>systemic loop</b> involving your nervous system and gut health.
           </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-[2rem] border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Brain size={32} />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">1. The Brain</h4>
                <p className="text-slate-500 leading-relaxed">Stress triggers cortisol, which physically shreds your skin barrier from the inside out. We call this the "Skin-Brain Axis".</p>
            </div>

            <div className="group p-8 rounded-[2rem] border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Zap size={32} />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">2. The Flare</h4>
                <p className="text-slate-500 leading-relaxed">A weakened barrier lets allergens in. Your immune system panics, spiking histamine. You feel the "fire" under your skin.</p>
            </div>

            <div className="group p-8 rounded-[2rem] border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Activity size={32} />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">3. The Damage</h4>
                <p className="text-slate-500 leading-relaxed">You scratch. The barrier breaks further. Stress increases. The loop repeats. We exist to break this cycle.</p>
            </div>
        </div>
      </section>

      {/* --- FEATURE DEEP DIVE --- */}
      <section id="features" className="py-20 px-6 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-24">
            
            {/* Feature 1: AI Translation */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="order-2 lg:order-1 relative">
                    <div className="absolute inset-0 bg-teal-500/20 blur-[60px] rounded-full"></div>
                    <div className="relative bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-slate-700 flex-shrink-0"></div>
                            <div className="flex-1 bg-slate-700 rounded-2xl rounded-tl-none p-4 text-sm text-slate-300">
                                <span className="font-mono text-xs text-teal-400 block mb-2">CLINICAL NOTE:</span>
                                "Patient exhibits diffuse erythema with lichenification on dorsal aspects..."
                            </div>
                        </div>
                        <div className="flex justify-center mb-2">
                             <div className="bg-slate-900 rounded-full p-2 border border-slate-700">
                                 <ArrowRight size={16} className="text-teal-400 rotate-90" />
                             </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="flex-1 bg-teal-900/50 border border-teal-800 rounded-2xl rounded-tr-none p-4 text-sm">
                                <span className="font-bold text-teal-400 block mb-2 flex items-center gap-2"><Sparkles size={12}/> PLAIN ENGLISH:</span>
                                "Your skin barrier is thickened from scratching, and the redness shows active inflammation. We need to cool this down."
                            </div>
                             <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center font-bold">AI</div>
                        </div>
                    </div>
                </div>
                <div className="order-1 lg:order-2">
                    <div className="w-12 h-12 bg-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center mb-6">
                        <Microscope size={24} />
                    </div>
                    <h3 className="text-3xl font-bold mb-4">Your Doctor Speaks Latin. <br/>We Speak Human.</h3>
                    <p className="text-slate-400 text-lg leading-relaxed mb-6">
                        Medical anxiety is real. Our AI analyzes your skin photos (approximating clinical scores like PO-SCORAD) and translates the medical jargon into plain English, so you actually understand what's happening to your body.
                    </p>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-slate-300"><CheckCircle size={18} className="text-teal-500"/> Instant Severity Grading (0-100)</li>
                        <li className="flex items-center gap-3 text-slate-300"><CheckCircle size={18} className="text-teal-500"/> Visual Symptom Identification</li>
                        <li className="flex items-center gap-3 text-slate-300"><CheckCircle size={18} className="text-teal-500"/> Privacy-First Encryption</li>
                    </ul>
                </div>
            </div>

            {/* Feature 2: SOS Audio */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                    <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center mb-6">
                        <Zap size={24} />
                    </div>
                    <h3 className="text-3xl font-bold mb-4">The Panic Button for Your Skin.</h3>
                    <p className="text-slate-400 text-lg leading-relaxed mb-6">
                        The urge to scratch is neurological. Willpower isn't enough. Our <b>SOS Audio</b> tracks use psychoacoustic techniques to interrupt the itch signal in your brain in under 3 minutes.
                    </p>
                    <button 
                        onClick={onGetStarted}
                        className="flex items-center gap-3 text-rose-400 font-bold hover:text-rose-300 transition-colors"
                    >
                        <PlayCircle size={24} /> Listen to a sample
                    </button>
                </div>
                <div className="relative">
                    <div className="absolute inset-0 bg-rose-500/20 blur-[60px] rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-rose-600 to-orange-600 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <Zap size={40} className="text-white" fill="currentColor" />
                        </div>
                        <h4 className="text-2xl font-bold mb-2">SOS Mode Active</h4>
                        <p className="text-white/80 mb-8">Interrupting itch signal...</p>
                        <div className="w-full bg-black/20 rounded-full h-12 flex items-center px-4 justify-between">
                            <div className="flex gap-1 h-4 items-end">
                                {[1,3,2,4,2,3].map((h, i) => (
                                    <div key={i} className={`w-1 bg-white/80 rounded-full animate-music`} style={{height: `${h*25}%`, animationDelay: `${i*0.1}s`}}></div>
                                ))}
                            </div>
                            <span className="text-xs font-mono">00:45 / 03:00</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature 3: Tailorblend */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="order-2 lg:order-1 relative">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full"></div>
                    <div className="relative bg-white rounded-3xl p-8 shadow-2xl text-slate-900">
                        <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                            <div>
                                <h4 className="font-bold text-lg">Sarah's Blend</h4>
                                <p className="text-xs text-slate-400">Batch #90210 • Formulated 24 Oct</p>
                            </div>
                            <div className="bg-teal-100 text-teal-700 px-2 py-1 rounded text-xs font-bold">Phase 1</div>
                        </div>
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                                <span className="font-bold text-sm">Zinc Picolinate</span>
                                <span className="text-xs text-slate-500">For Inflammation</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                                <span className="font-bold text-sm">L-Glutamine</span>
                                <span className="text-xs text-slate-500">For Gut Lining</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                                <span className="font-bold text-sm">Ashwagandha</span>
                                <span className="text-xs text-slate-500">For Cortisol</span>
                            </div>
                        </div>
                        <div className="text-center text-xs text-slate-400">
                            Manufactured in Cape Town via Tailorblend™
                        </div>
                    </div>
                </div>
                <div className="order-1 lg:order-2">
                    <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center mb-6">
                        <Beaker size={24} />
                    </div>
                    <h3 className="text-3xl font-bold mb-4">No More Pill Fatigue. <br/>One Custom Scoop.</h3>
                    <p className="text-slate-400 text-lg leading-relaxed mb-6">
                        Stop buying 10 different generic vitamins. We analyze your data to create a single, powdered daily blend that targets <i>your</i> specific deficiencies. 
                    </p>
                    <p className="text-sm text-teal-400 font-bold mb-4 flex items-center gap-2">
                        <CheckCircle size={16}/> Powered by <a href="https://www.tailorblend.co.za/" target="_blank" className="hover:underline">Tailorblend (SA)</a>
                    </p>
                </div>
            </div>

        </div>
      </section>

      {/* --- PRICING OFFER --- */}
      <section id="offer" className="py-20 px-6 bg-teal-50">
          <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] shadow-xl border border-teal-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-bl-xl z-10">
                  LAUNCH OFFER
              </div>

              {/* Header */}
              <div className="p-8 md:p-12 text-center border-b border-slate-100">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">The "Eczema Detective" Protocol</h2>
                  <p className="text-slate-500 text-lg">Everything you need to find your triggers.</p>
              </div>
              
              <div className="grid md:grid-cols-2">
                  {/* Left Col */}
                  <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-100">
                       <h3 className="font-bold text-slate-900 text-lg mb-6 flex items-center gap-2">
                          <div className="p-2 bg-teal-100 rounded-lg text-teal-600"><Activity size={18}/></div>
                          Deep Analysis
                       </h3>
                       <ul className="space-y-4">
                          <li className="flex items-start gap-3 text-slate-600 text-sm">
                              <CheckCircle size={18} className="text-teal-500 flex-shrink-0 mt-0.5" />
                              <span><b>AI Inflammation Scan</b> (ASCORAD Score)</span>
                          </li>
                          <li className="flex items-start gap-3 text-slate-600 text-sm">
                              <CheckCircle size={18} className="text-teal-500 flex-shrink-0 mt-0.5" />
                              <span><b>Root Cause Mapping</b> (Gut vs Stress vs Barrier)</span>
                          </li>
                          <li className="flex items-start gap-3 text-slate-600 text-sm">
                              <CheckCircle size={18} className="text-teal-500 flex-shrink-0 mt-0.5" />
                              <span><b>Plain English</b> Clinical Translation</span>
                          </li>
                       </ul>
                  </div>
                  
                  {/* Right Col */}
                  <div className="p-8 md:p-12 bg-slate-50/50">
                       <h3 className="font-bold text-slate-900 text-lg mb-6 flex items-center gap-2">
                          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><FileText size={18}/></div>
                          Your Action Plan
                       </h3>
                       <ul className="space-y-4">
                          <li className="flex items-start gap-3 text-slate-600 text-sm">
                              <CheckCircle size={18} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                              <span><b>Custom Tailorblend™</b> Formula Design</span>
                          </li>
                          <li className="flex items-start gap-3 text-slate-600 text-sm">
                              <CheckCircle size={18} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                              <span><b>SOS Audio Access</b> (7 Days Free)</span>
                          </li>
                          <li className="flex items-start gap-3 text-slate-600 text-sm">
                              <CheckCircle size={18} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                              <span><b>AI Coach</b> Chat Support</span>
                          </li>
                       </ul>
                  </div>
              </div>
              
              {/* Footer Bar */}
              <div className="p-8 bg-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-white text-center md:text-left">
                      <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                          <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">One-time Analysis Fee</span>
                          <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full">Save 70%</span>
                      </div>
                      <div className="text-4xl font-bold">R125<span className="text-xl font-normal text-slate-500">.00</span></div>
                  </div>
                  <button 
                      onClick={onGetStarted}
                      className="w-full md:w-auto px-10 py-4 bg-teal-500 text-slate-900 font-bold text-lg rounded-xl hover:bg-teal-400 transition-all shadow-xl shadow-teal-500/20 flex items-center justify-center gap-2 transform hover:scale-105"
                  >
                      Get My Plan <ArrowRight size={20}/>
                  </button>
              </div>
              <div className="bg-slate-100 p-3 text-center border-t border-slate-200">
                  <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                      <Lock size={10} /> Secure checkout via PayFast • 30-Day Money Back Guarantee • No supplement purchase required
                  </p>
              </div>
          </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section id="faq" className="py-20 px-6 bg-white">
          <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">Frequently Asked Questions</h2>
              <div className="space-y-4">
                  {[
                      { q: "Is this a subscription?", a: "The R125 analysis is a one-time fee. You get your results, formula, and a 7-day app trial. If you choose to order your custom supplement, that is a separate monthly purchase, but there is no obligation." },
                      { q: "Do you ship the supplements?", a: "Yes! We partner with Tailorblend in Cape Town. They manufacture your unique formula (based on our AI analysis) and courier it door-to-door anywhere in South Africa." },
                      { q: "Is my photo data safe?", a: "Absolutely. We use enterprise-grade encryption. Your photos are analyzed by AI and then stored securely. We comply fully with POPIA (South Africa) regulations." },
                      { q: "What if I'm vegan?", a: "Our logic engine accommodates vegans, vegetarians, and allergen-free requirements. The base protein is a high-quality Vegan Rice Protein." }
                  ].map((item, i) => (
                      <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden">
                          <button 
                            onClick={() => toggleFaq(i)}
                            className="w-full flex justify-between items-center p-5 text-left bg-white hover:bg-slate-50 transition-colors"
                          >
                              <span className="font-bold text-slate-800">{item.q}</span>
                              <ChevronDown size={20} className={`text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                          </button>
                          {openFaq === i && (
                              <div className="p-5 pt-0 text-slate-600 leading-relaxed bg-slate-50 border-t border-slate-100">
                                  {item.a}
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* --- REVIEWS --- */}
      <section id="reviews" className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
            <h2 className="text-center text-3xl font-bold text-slate-900 mb-16">Results you can see.</h2>
            <div className="grid md:grid-cols-3 gap-8">
                {[
                    { text: "I've slept through the night for the first time in 3 years. The magnesium blend changed everything.", name: "Sarah J.", loc: "Cape Town", role: "Severe Eczema" },
                    { text: "The SOS audio actually stops me from scratching. It's magic. My skin has finally closed up.", name: "David M.", loc: "Johannesburg", role: "TSW Sufferer" },
                    { text: "Finally, a supplement stack that doesn't flare my gut. My redness is down 80%.", name: "Priya K.", loc: "Durban", role: "Chronic Dermatitis" }
                ].map((t, i) => (
                    <div key={i} className="bg-white p-8 rounded-3xl hover:shadow-xl transition-all border border-slate-100">
                        <div className="flex text-yellow-400 mb-4">
                            {[1,2,3,4,5].map(s => <Star key={s} size={16} fill="currentColor"/>)}
                        </div>
                        <p className="text-slate-700 italic mb-6 leading-relaxed">"{t.text}"</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 text-xs">
                                {t.name.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                                <p className="text-xs text-slate-400">{t.role} • {t.loc}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* --- FOOTER CTA --- */}
      <section className="py-24 px-6 bg-slate-900 text-white text-center relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full bg-teal-500/5 z-0"></div>
         <div className="max-w-2xl mx-auto relative z-10">
             <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to reclaim your skin?</h2>
             <p className="text-slate-400 mb-10 text-lg">
                Join 4,000+ others healing from the inside out. <br/>
                Start your comprehensive analysis today.
             </p>
             <button 
               onClick={onGetStarted}
               className="w-full md:w-auto px-12 py-5 bg-teal-500 text-slate-900 font-bold text-xl rounded-2xl hover:bg-teal-400 transition-all transform hover:scale-105 shadow-2xl shadow-teal-500/20"
             >
               Start Healing Now
             </button>
         </div>
      </section>
      
      {/* --- FOOTER LINKS --- */}
      <footer className="bg-slate-950 py-12 px-6 border-t border-slate-900">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-teal-600">
                  <Activity size={20} />
                </div>
                <span className="font-bold text-slate-200">EczemaCoach<span className="text-teal-600">SA</span></span>
            </div>
            <div className="text-slate-500 text-sm">
                &copy; 2024 <a href="https://www.tailorblend.co.za/" target="_blank" className="hover:text-white">Tailorblend</a> x EczemaCoach. All rights reserved.
            </div>
            <div className="flex gap-6 text-slate-400 text-sm">
                <a href="#" className="hover:text-white">Privacy</a>
                <a href="#" className="hover:text-white">Terms</a>
                <a href="#" className="hover:text-white">Contact</a>
            </div>
            {/* Dev Mode Link */}
            {onDevEntry && (
              <button 
                onClick={onDevEntry}
                className="text-slate-800 hover:text-teal-600 transition-colors flex items-center gap-1 text-xs"
                title="Populate with mock data"
              >
                <Terminal size={12} /> Dev Mode
              </button>
            )}
         </div>
      </footer>

      {/* Sticky Mobile Buy Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 md:hidden z-50">
          <button 
             onClick={onGetStarted}
             className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"
          >
             Start for R125 <ArrowRight size={20} />
          </button>
      </div>

    </div>
  );
};

export default LandingPage;
