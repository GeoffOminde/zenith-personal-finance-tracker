
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import FootageAnalyzer from './components/FootageAnalyzer';
import DrillGenerator from './components/DrillGenerator';
import TrainingPlanner from './components/TrainingPlanner';
import PlayerFeedback from './components/PlayerFeedback';
import Header from './components/Header';
import { View } from './types';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('Dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Footage Analyzer':
        return <FootageAnalyzer />;
      case 'Drill Generator':
        return <DrillGenerator />;
      case 'Training Planner':
        return <TrainingPlanner />;
      case 'Player Feedback':
        return <PlayerFeedback />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-brand-primary font-sans">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={activeView} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-brand-primary">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;
