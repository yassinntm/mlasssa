import React from 'react';

type View = 'dashboard' | 'add_trade' | 'ai_analyzer';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const NavLink: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  // Fix: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
  icon: React.ReactElement;
}> = ({ label, isActive, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
      isActive
        ? 'bg-primary text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const ChartBarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" />
    </svg>
);

const PlusCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L13 12l-1.293-1.293a1 1 0 010-1.414L14 7l2.293 2.293a1 1 0 010 1.414L15 13l-1.293-1.293a1 1 0 010-1.414L16 9m-5 11l2-2 2 2m-2-2v-4m-4 4h4" />
    </svg>
);

export const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView }) => {
  return (
    <header className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary">MLASSA Trading Tracker v3</h1>
          </div>
          <nav className="flex space-x-2 md:space-x-4">
            <NavLink
              label="Dashboard"
              icon={<ChartBarIcon />}
              isActive={currentView === 'dashboard'}
              onClick={() => setCurrentView('dashboard')}
            />
            <NavLink
              label="Add Trade"
              icon={<PlusCircleIcon />}
              isActive={currentView === 'add_trade'}
              onClick={() => setCurrentView('add_trade')}
            />
            <NavLink
              label="AI Analyzer"
              icon={<SparklesIcon />}
              isActive={currentView === 'ai_analyzer'}
              onClick={() => setCurrentView('ai_analyzer')}
            />
          </nav>
        </div>
      </div>
    </header>
  );
};