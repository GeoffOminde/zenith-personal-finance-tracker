
import React, { useState } from 'react';
import type { UseFinanceReturn } from '../hooks/useFinance';
import { AIFinancialHealthAnalysis } from '../types';
import { getFinancialHealthAnalysis } from '../services/geminiService';
import Card from './ui/Card';
import Button from './ui/Button';

// --- ICONS ---
const SparkleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 2zM5.404 4.343a.75.75 0 010 1.06l-2.5 2.5a.75.75 0 11-1.06-1.06l2.5-2.5a.75.75 0 011.06 0zm9.192 0a.75.75 0 011.06 0l2.5 2.5a.75.75 0 01-1.06 1.06l-2.5-2.5a.75.75 0 010-1.06zM2 10a.75.75 0 01.75-.75h3.5a.75.75 0 010 1.5h-3.5A.75.75 0 012 10zM17.25 10a.75.75 0 000-1.5h-3.5a.75.75 0 000 1.5h3.5zM7.904 12.096a.75.75 0 011.06 0l2.5 2.5a.75.75 0 01-1.06 1.06l-2.5-2.5a.75.75 0 010-1.06zM4.343 14.596a.75.75 0 011.06 0l2.5 2.5a.75.75 0 11-1.06 1.06l-2.5-2.5a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>;
const LoadingDots = () => <div className="flex items-center space-x-1 justify-center"><div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div></div>;

interface FinancialHealthProps {
    finance: UseFinanceReturn;
    apiKey: string | null;
}

const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
};

const getRating = (score: number, maxScore: number): string => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Fair';
    return 'Needs Improvement';
};

const ScoreGauge: React.FC<{ score: number }> = ({ score }) => (
    <div className="relative w-48 h-48">
        <svg className="w-full h-full" viewBox="0 0 36 36">
            <path className="text-gray-700" strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className={`${getScoreColor(score)} transition-all duration-1000 ease-out`} strokeWidth="4" fill="none" strokeDasharray={`${score}, 100`} strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-6xl font-bold ${getScoreColor(score)}`}>{score}</span>
            <span className="text-sm text-gray-400">/ 100</span>
        </div>
    </div>
);

const MetricCard: React.FC<{ title: string; value: string; rating: string; score: number; maxScore: number; children: React.ReactNode }> = ({ title, value, rating, score, maxScore, children }) => (
    <Card className="flex flex-col">
        <div className="flex justify-between items-baseline">
            <h3 className="font-semibold text-white">{title}</h3>
            <span className={`font-bold text-lg ${getScoreColor(score * 100 / maxScore)}`}>{value}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5 my-2">
            <div className={`h-1.5 rounded-full ${getScoreColor(score * 100 / maxScore).replace('text-','bg-')}`} style={{ width: `${score*100/maxScore}%` }}></div>
        </div>
        <p className="text-xs text-gray-400 self-end font-medium">{rating}</p>
        <p className="text-sm text-gray-400 mt-2 flex-grow">{children}</p>
    </Card>
);

const FinancialHealth: React.FC<FinancialHealthProps> = ({ finance, apiKey }) => {
    const { financialHealth } = finance;
    const [aiAnalysis, setAiAnalysis] = useState<AIFinancialHealthAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateAnalysis = async () => {
        if (!apiKey) {
            setError("API Key is not set in Settings.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setAiAnalysis(null);
        try {
            const result = await getFinancialHealthAnalysis(apiKey, financialHealth);
            setAiAnalysis(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">Financial Health Check</h1>

            <Card className="flex flex-col md:flex-row items-center justify-center text-center md:text-left gap-8 p-8">
                <ScoreGauge score={financialHealth.overallScore} />
                <div>
                    <h2 className="text-2xl font-bold text-white">Your Financial Health Score is {financialHealth.overallScore}</h2>
                    <p className="text-gray-400 mt-2 max-w-xl">This score represents a holistic view of your financial standing, based on key metrics like savings, debt, and spending habits. Use it as a guide to identify strengths and areas for growth.</p>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <MetricCard title="Savings Rate" value={`${financialHealth.metrics.savingsRate.value.toFixed(1)}%`} rating={getRating(financialHealth.metrics.savingsRate.score, 30)} score={financialHealth.metrics.savingsRate.score} maxScore={30}>
                    The percentage of your income you save each month. A higher rate accelerates wealth building. Aim for 20% or more.
                </MetricCard>
                 <MetricCard title="Debt-to-Income (DTI)" value={`${financialHealth.metrics.debtToIncomeRatio.value.toFixed(1)}%`} rating={getRating(financialHealth.metrics.debtToIncomeRatio.score, 25)} score={financialHealth.metrics.debtToIncomeRatio.score} maxScore={25}>
                    How much of your monthly income goes to debt payments. A lower DTI is crucial for financial flexibility. Under 36% is considered healthy.
                </MetricCard>
                 <MetricCard title="Emergency Fund" value={`${financialHealth.metrics.emergencyFund.value.toFixed(1)} mo`} rating={getRating(financialHealth.metrics.emergencyFund.score, 25)} score={financialHealth.metrics.emergencyFund.score} maxScore={25}>
                    How many months of expenses you can cover with liquid assets. A 3-6 month fund provides a strong safety net.
                </MetricCard>
            </div>
            
             <Card>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-white">AI Analysis & Recommendations</h2>
                        <p className="text-sm text-gray-400 mt-1">Get a personalized analysis and actionable tips to improve your score.</p>
                    </div>
                    <Button onClick={handleGenerateAnalysis} disabled={isLoading || !apiKey} className="w-full sm:w-auto flex-shrink-0">
                        <SparkleIcon /> {isLoading ? 'Analyzing...' : 'Generate AI Analysis'}
                    </Button>
                </div>
                {!apiKey && <p className="text-center text-sm text-yellow-400 mt-4">Please set your API key in Settings to use this feature.</p>}
                {isLoading && <div className="text-center py-10"><LoadingDots /><p className="mt-2 text-gray-400 text-sm">AI is preparing your custom report...</p></div>}
                {error && <div className="text-center text-sm text-red-400 bg-red-900/20 rounded-lg p-4 mt-4">{error}</div>}
                {aiAnalysis && (
                    <div className="mt-6 border-t border-gray-700 pt-6 space-y-6">
                        <p className="text-gray-300 italic text-center text-lg">"{aiAnalysis.summary}"</p>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg text-green-400">Strengths</h3>
                                {aiAnalysis.strengths.map((item, i) => (
                                    <div key={i}>
                                        <p className="font-semibold text-white">{item.title}</p>
                                        <p className="text-sm text-gray-400">{item.explanation}</p>
                                    </div>
                                ))}
                            </div>
                             <div className="space-y-3">
                                <h3 className="font-semibold text-lg text-yellow-400">Areas for Improvement</h3>
                                {aiAnalysis.areasForImprovement.map((item, i) => (
                                    <div key={i}>
                                        <p className="font-semibold text-white">{item.title}</p>
                                        <p className="text-sm text-gray-400">{item.explanation}</p>
                                        <p className="text-sm text-blue-300 bg-blue-900/30 p-2 rounded-md mt-2"><strong>Suggestion:</strong> {item.suggestion}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Card>

        </div>
    );
};

export default FinancialHealth;