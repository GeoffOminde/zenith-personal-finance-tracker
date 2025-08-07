import React, { useState } from 'react';
import type { UseFinanceReturn } from '../hooks/useFinance';
import { AIMonthlySummary } from '../types';
import { getAIMonthlyBriefing } from '../services/geminiService';
import Card from './ui/Card';
import Button from './ui/Button';

// --- ICONS ---
const ArrowUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l.293.293a1 1 0 001.414-1.414l-3-3z" clipRule="evenodd" /></svg>;
const ArrowDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.707-4.707a1 1 0 001.414 1.414l3-3a1 1 0 00-1.414-1.414L11 10.586V7a1 1 0 10-2 0v3.586L8.293 9.293a1 1 0 00-1.414 1.414l3 3z" clipRule="evenodd" /></svg>;

const LoadingState = () => (
    <div className="text-center py-8">
        <div className="flex justify-center items-center space-x-2">
            <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
            <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
            <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse"></div>
        </div>
        <p className="mt-3 text-gray-400 text-sm">Zenith AI is analyzing your month...</p>
    </div>
);

const ErrorState: React.FC<{ error: string, onRetry: () => void }> = ({ error, onRetry }) => (
    <div className="text-center py-6 text-yellow-400 bg-yellow-900/20 rounded-lg p-3">
        <p className="font-semibold text-sm">Briefing Error</p>
        <p className="text-xs my-2">{error}</p>
        <Button variant="secondary" size="sm" onClick={onRetry}>Try Again</Button>
    </div>
);


interface AIBriefingCardProps {
    finance: UseFinanceReturn;
    apiKey: string | null;
}

const AIBriefingCard: React.FC<AIBriefingCardProps> = ({ finance, apiKey }) => {
    const { transactions, categories } = finance;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<AIMonthlySummary | null>(null);

    const handleGenerate = async () => {
        if (!apiKey) {
            setError("API Key not set in Settings.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setSummary(null);

        try {
            const result = await getAIMonthlyBriefing(transactions, categories, apiKey);
            setSummary(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Card className="h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">AI Monthly Briefing</h2>
                <Button variant="secondary" size="sm" onClick={handleGenerate} disabled={isLoading || !apiKey}>
                   {isLoading ? 'Generating...' : 'Generate Briefing'}
                </Button>
            </div>
            
            {isLoading && <LoadingState />}
            {!isLoading && error && <ErrorState error={error} onRetry={handleGenerate} />}
            {!isLoading && !error && !summary && (
                <div className="text-center py-8 text-gray-500">
                    <p>Click "Generate Briefing" for your personalized monthly summary.</p>
                </div>
            )}
            {!isLoading && summary && (
                <div className="space-y-4">
                    <p className="text-gray-300 italic">"{summary.summaryText}"</p>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <p className="text-sm text-gray-400">Spending vs. Last Month</p>
                            <div className={`flex items-center text-2xl font-bold ${summary.spendingChangePercentage > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {summary.spendingChangePercentage > 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
                                <span className="ml-1">{Math.abs(summary.spendingChangePercentage).toFixed(0)}%</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Top Category This Month</p>
                            {summary.topCategory ? (
                                <>
                                <p className="text-lg font-bold text-white truncate">{summary.topCategory.name}</p>
                                <p className="text-sm text-gray-400">${summary.topCategory.amount.toFixed(2)}</p>
                                </>
                            ) : (
                                <p className="text-lg font-bold text-gray-500">None</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default AIBriefingCard;
