
import React, { useState } from 'react';
import { useTrades } from './hooks/useTrades';
import { Dashboard } from './components/Dashboard';
import { TradeForm } from './components/TradeForm';
import { AiAnalyzer } from './components/AiAnalyzer';
import { Header } from './components/Header';
import { Trade } from './types';

type View = 'dashboard' | 'add_trade' | 'ai_analyzer';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const { trades, addTrade, deleteTrade } = useTrades();

  const renderView = () => {
    switch (currentView) {
      case 'add_trade':
        return <TradeForm addTrade={addTrade} onTradeAdded={() => setCurrentView('dashboard')} />;
      case 'ai_analyzer':
        return <AiAnalyzer trades={trades} />;
      case 'dashboard':
      default:
        return <Dashboard trades={trades} deleteTrade={deleteTrade} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col">
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
