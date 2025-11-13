import React, { useState } from 'react';
import { Trade } from '../types';
import { analyzeSlSweepsWithAI } from '../services/geminiService';

interface SlSweepAnalyzerProps {
    trades: Trade[];
}

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
)

export const SlSweepAnalyzer: React.FC<SlSweepAnalyzerProps> = ({ trades }) => {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const result = await analyzeSlSweepsWithAI(trades);
            setAnalysis(result);
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex-grow p-6 overflow-y-auto">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p className="text-lg">Analyzing your notes...</p>
                    <p className="text-sm">The AI is looking for recurring patterns in your SL sweeps.</p>
                </div>
            ) : analysis ? (
                <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-bold text-primary mb-4">SL Sweep Analysis Results</h3>
                    <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed prose prose-invert prose-p:my-2 prose-ul:my-2">
                        {analysis}
                    </div>
                     <button
                        onClick={() => setAnalysis(null)}
                        className="mt-6 text-sm font-medium text-primary hover:underline"
                    >
                        Run New Analysis
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                    <SearchIcon />
                    <h3 className="text-xl font-semibold mb-2">Analyze Stop Loss Sweep Patterns</h3>
                    <p className="max-w-md mb-6">
                        This tool uses AI to find recurring themes in your "Candle Sweep Notes". 
                        It helps you understand precisely why your stop losses are getting hit before price moves in your favor.
                    </p>
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-600 transition-colors"
                    >
                        Start Analysis
                    </button>
                    {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
                </div>
            )}
        </div>
    );
};
