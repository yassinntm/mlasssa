import React, { useState } from 'react';
import { Trade } from '../types';
import { analyzeTradesWithAI } from '../services/geminiService';
import { SlSweepAnalyzer } from './SlSweepAnalyzer';

interface AiAnalyzerProps {
  trades: Trade[];
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

type AnalyzerTab = 'chat' | 'slSweep';

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L13 12l-1.293-1.293a1 1 0 010-1.414L14 7l2.293 2.293a1 1 0 010 1.414L15 13l-1.293-1.293a1 1 0 010-1.414L16 9m-5 11l2-2 2 2m-2-2v-4m-4 4h4" />
    </svg>
);

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
            isActive ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700'
        }`}
    >
        {label}
    </button>
);


const ChatAnalyzer: React.FC<{ trades: Trade[] }> = ({ trades }) => {
    const [prompt, setPrompt] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading) return;

        const userMessage: Message = { sender: 'user', text: prompt };
        setMessages(prev => [...prev, userMessage]);
        setPrompt('');
        setIsLoading(true);

        try {
            const aiResponse = await analyzeTradesWithAI(prompt, trades);
            const aiMessage: Message = { sender: 'ai', text: aiResponse };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error(error);
            const errorMessage: Message = { sender: 'ai', text: "I'm having trouble connecting to my analysis server. Please try again later." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const suggestionPrompts = [
        "What are my biggest strengths and weaknesses?",
        "Identify any negative patterns in my losing trades.",
        "How can I improve my win rate?",
        "Summarize my performance over the last month."
    ];

    return (
        <>
            <div className="flex-grow p-6 overflow-y-auto space-y-6">
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 flex flex-col items-center justify-center h-full">
                        <p className="mb-4">Ask me anything about your trading performance.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                            {suggestionPrompts.map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPrompt(p)}
                                    className="bg-gray-700/50 hover:bg-gray-700 text-sm text-left p-3 rounded-lg transition-colors"
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xl lg:max-w-2xl px-4 py-3 rounded-lg ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-gray-700'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-xl lg:max-w-2xl px-4 py-3 rounded-lg bg-gray-700 flex items-center space-x-2">
                            <span className="animate-pulse">.</span><span className="animate-pulse delay-75">.</span><span className="animate-pulse delay-150">.</span>
                            <span className="text-sm">Analyzing...</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-700 bg-gray-800">
                <form onSubmit={handleSubmit} className="flex items-center space-x-3">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., What patterns do you see in my losing trades?"
                        disabled={isLoading}
                        className="flex-grow bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary disabled:opacity-50"
                    />
                    <button type="submit" disabled={isLoading || !prompt.trim()} className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                        Send
                    </button>
                </form>
            </div>
        </>
    )
}

export const AiAnalyzer: React.FC<AiAnalyzerProps> = ({ trades }) => {
  const [activeTab, setActiveTab] = useState<AnalyzerTab>('chat');
  
  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-10rem)] bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <SparklesIcon />
                <h2 className="text-xl font-bold text-primary">AI Performance Analyzer</h2>
            </div>
            <div className="flex items-center space-x-1 rounded-lg bg-gray-900 p-1">
                <TabButton label="Chat" isActive={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
                <TabButton label="SL Sweep Analysis" isActive={activeTab === 'slSweep'} onClick={() => setActiveTab('slSweep')} />
            </div>
        </div>

        {activeTab === 'chat' ? (
            <ChatAnalyzer trades={trades} />
        ) : (
            <SlSweepAnalyzer trades={trades} />
        )}
    </div>
  );
};
