import React from 'react';
import { View } from '../types';
import { DashboardIcon, VideoIcon, WhistleIcon, CalendarIcon, FeedbackIcon, SparklesIcon } from './common/icons';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const navItems: { view: View; icon: React.FC<{className?: string}> }[] = [
  { view: 'Dashboard', icon: DashboardIcon },
  { view: 'Footage Analyzer', icon: VideoIcon },
  { view: 'Drill Generator', icon: WhistleIcon },
  { view: 'Training Planner', icon: CalendarIcon },
  { view: 'Player Feedback', icon: FeedbackIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  return (
    <div className="w-20 lg:w-64 bg-brand-secondary p-2 lg:p-4 flex flex-col justify-between transition-all duration-300">
      <div>
        <div className="flex items-center gap-3 p-2 lg:p-4 mb-8">
          <SparklesIcon className="h-8 w-8 text-brand-cyan flex-shrink-0" />
          <h1 className="text-2xl font-bold text-brand-text hidden lg:block">Tactical AI</h1>
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={`flex items-center gap-4 p-3 rounded-lg transition-colors duration-200 ${
                activeView === item.view
                  ? 'bg-brand-cyan text-brand-primary'
                  : 'text-brand-light hover:bg-brand-accent hover:text-brand-text'
              }`}
            >
              <item.icon className="h-6 w-6 flex-shrink-0" />
              <span className="font-semibold hidden lg:block">{item.view}</span>
            </button>
          ))}
        </nav>
      </div>
       <div className="p-4 border-t border-brand-accent hidden lg:block">
            <p className="text-sm text-brand-light">© {new Date().getFullYear()} Tactical Assistant</p>
       </div>
    </div>
  );
};

export default Sidebar;