import React from 'react';
import { Home, PlusCircle, MessageSquare, Brain, Pill } from 'lucide-react';
import { ViewState } from '../types';

interface Props {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  children: React.ReactNode;
}

const Layout: React.FC<Props> = ({ currentView, setView, children }) => {
  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => setView(view)}
      className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
        currentView === view ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <Icon size={currentView === view ? 24 : 22} strokeWidth={currentView === view ? 2.5 : 2} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative">
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        {children}
      </main>

      <nav className="h-20 bg-white border-t border-slate-200 flex justify-around items-center px-2 pb-2 z-50">
        <NavItem view="DASHBOARD" icon={Home} label="Home" />
        <NavItem view="MINDFULNESS" icon={Brain} label="Mind" />
        
        <div className="relative -top-6">
          <button
            onClick={() => setView('CHECKIN')}
            className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-400/50 hover:scale-105 transition-transform"
          >
            <PlusCircle size={28} />
          </button>
        </div>

        <NavItem view="SUPPLEMENTS" icon={Pill} label="Blend" />
        <NavItem view="COACH" icon={MessageSquare} label="Coach" />
      </nav>
    </div>
  );
};

export default Layout;
