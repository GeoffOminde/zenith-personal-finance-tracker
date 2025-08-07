
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, AreaChart } from 'recharts';
import type { UseFinanceReturn } from '../hooks/useFinance';
import { TransactionType, AIForecast, RecurringFrequency } from '../types';
import { getAIForecast } from '../services/geminiService';
import Card from './ui/Card';
import Button from './ui/Button';

// --- ICONS ---
const SparkleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 2zM5.404 4.343a.75.75 0 010 1.06l-2.5 2.5a.75.75 0 11-1.06-1.06l2.5-2.5a.75.75 0 011.06 0zm9.192 0a.75.75 0 011.06 0l2.5 2.5a.75.75 0 01-1.06 1.06l-2.5-2.5a.75.75 0 010-1.06zM2 10a.75.75 0 01.75-.75h3.5a.75.75 0 010 1.5h-3.5A.75.75 0 012 10zM17.25 10a.75.75 0 000-1.5h-3.5a.75.75 0 000 1.5h3.5zM7.904 12.096a.75.75 0 011.06 0l2.5 2.5a.75.75 0 01-1.06 1.06l-2.5-2.5a.75.75 0 010-1.06zM4.343 14.596a.75.75 0 011.06 0l2.5 2.5a.75.75 0 11-1.06 1.06l-2.5-2.5a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>;
const IssueIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.636-1.214 2.852-1.214 3.488 0l5.516 10.532c.632 1.208-.28 2.72-1.744 2.72H4.485c-1.464 0-2.376-1.512-1.744-2.72L8.257 3.099zM9 13a1 1 0 112 0 1 1 0 01-2 0zm1-4a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const GoalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" /><path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;

const LoadingDots: React.FC = () => (
    <div className="flex items-center space-x-1 justify-center">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
    </div>
);

interface ForecastingProps {
  finance: UseFinanceReturn;
  apiKey: string | null;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
          <p className="label text-sm text-white">{`${label}`}</p>
          <p className="text-xs text-blue-300">
            Projected Balance: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

const Forecasting: React.FC<ForecastingProps> = ({ finance, apiKey }) => {
    const { transactions, recurringTransactions, summary, goals } = finance;
    const [period, setPeriod] = useState(6); // 6 months
    const [aiForecast, setAiForecast] = useState<AIForecast | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const forecastData = useMemo(() => {
        // Calculate average monthly non-recurring income/expense from last 3 months
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const recurringIds = new Set(recurringTransactions.map(r => r.id));
        const nonRecurringTransactions = transactions.filter(t => !t.id.startsWith('recurring-') && new Date(t.date) > threeMonthsAgo);
        
        const monthlyAverages: { income: number; expense: number } = { income: 0, expense: 0 };
        const monthlyTotals: Record<string, { income: number, expense: number}> = {};

        nonRecurringTransactions.forEach(t => {
            const monthKey = new Date(t.date).toISOString().slice(0, 7); // YYYY-MM
            if (!monthlyTotals[monthKey]) monthlyTotals[monthKey] = { income: 0, expense: 0 };
            if (t.type === TransactionType.Income) monthlyTotals[monthKey].income += t.amount;
            else monthlyTotals[monthKey].expense += t.amount;
        });

        const numMonths = Object.keys(monthlyTotals).length;
        if(numMonths > 0) {
            for(const key in monthlyTotals) {
                monthlyAverages.income += monthlyTotals[key].income;
                monthlyAverages.expense += monthlyTotals[key].expense;
            }
            monthlyAverages.income /= numMonths;
            monthlyAverages.expense /= numMonths;
        }

        // Project balance for the selected period
        let currentBalance = summary.netWorth;
        const data = [{ month: 'Now', balance: currentBalance }];
        const now = new Date();

        for (let i = 1; i <= period; i++) {
            const forecastMonth = new Date(now.getFullYear(), now.getMonth() + i, 1);
            let monthlyIncome = monthlyAverages.income;
            let monthlyExpense = monthlyAverages.expense;
            
            // Add recurring transactions for this month
            recurringTransactions.forEach(r => {
                // This is a simplified logic. A real app would need a more robust date-iteration logic.
                if (r.frequency === RecurringFrequency.Monthly) {
                    if (r.type === TransactionType.Income) monthlyIncome += r.amount;
                    else monthlyExpense += r.amount;
                }
            });
            
            currentBalance += (monthlyIncome - monthlyExpense);
            data.push({
                month: forecastMonth.toLocaleString('default', { month: 'short', year: '2-digit' }),
                balance: currentBalance
            });
        }
        return data;
    }, [period, transactions, recurringTransactions, summary.netWorth]);

    const handleGenerateForecast = async () => {
        if (!apiKey) {
            setError("API Key is not set in Settings.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setAiForecast(null);
        try {
            const recentTransactions = transactions.filter(t => new Date(t.date) > new Date(new Date().setMonth(new Date().getMonth() - 3)));
            const result = await getAIForecast(apiKey, recentTransactions, recurringTransactions, goals, summary.netWorth, period);
            setAiForecast(result);
        } catch(e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">Financial Forecast</h1>
            
            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-xl font-semibold text-white">Projected Balance</h2>
                    <div className="flex items-center bg-gray-700 rounded-lg p-1">
                        {[3, 6, 12].map(p => (
                            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${period === p ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>
                                {p} Months
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <AreaChart data={forecastData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                             <defs>
                                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                            <XAxis dataKey="month" stroke="#A0AEC0" tick={{ fontSize: 12 }} />
                            <YAxis stroke="#A0AEC0" tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{fontSize: "14px"}} />
                            <Area type="monotone" dataKey="balance" name="Projected Balance" stroke="#3B82F6" fillOpacity={1} fill="url(#colorBalance)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-white">AI Forecast Analysis</h2>
                        <p className="text-sm text-gray-400 mt-1">Get a narrative analysis of your financial future based on your habits, goals, and recurring payments.</p>
                    </div>
                    <Button onClick={handleGenerateForecast} disabled={isLoading || !apiKey} className="w-full sm:w-auto flex-shrink-0">
                        <SparkleIcon /> {isLoading ? 'Analyzing...' : 'Generate AI Analysis'}
                    </Button>
                </div>
                {!apiKey && <p className="text-center text-sm text-yellow-400 mt-4">Please set your API key in Settings to use this feature.</p>}
                {isLoading && <div className="text-center py-10"><LoadingDots /><p className="mt-2 text-gray-400 text-sm">AI is calculating future possibilities...</p></div>}
                {error && <div className="text-center text-sm text-red-400 bg-red-900/20 rounded-lg p-4 mt-4">{error}</div>}
                {aiForecast && (
                    <div className="mt-6 space-y-6 border-t border-gray-700 pt-6">
                        <div>
                            <h3 className="font-semibold text-lg text-white mb-2">Overall Summary</h3>
                            <p className="text-gray-300 italic">{aiForecast.summary}</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg text-white">Potential Issues</h3>
                                {aiForecast.potentialIssues.length > 0 ? aiForecast.potentialIssues.map((issue, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <IssueIcon />
                                        <div>
                                            <p className="font-semibold text-yellow-300">{issue.month}</p>
                                            <p className="text-sm text-gray-400">{issue.reason}</p>
                                        </div>
                                    </div>
                                )) : <p className="text-sm text-gray-500">No major issues detected.</p>}
                            </div>
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg text-white">Goal Impact</h3>
                                {aiForecast.goalImpact.length > 0 ? aiForecast.goalImpact.map((g, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <GoalIcon />
                                        <div>
                                            <p className="font-semibold text-green-300">{g.goalName}</p>
                                            <p className="text-sm text-gray-400">{g.forecast}</p>
                                        </div>
                                    </div>
                                )) : <p className="text-sm text-gray-500">No goals to analyze.</p>}
                            </div>
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg text-white">Recommendations</h3>
                                {aiForecast.recommendations.length > 0 ? aiForecast.recommendations.map((rec, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <CheckIcon />
                                        <p className="text-sm text-gray-400">{rec}</p>
                                    </div>
                                )) : <p className="text-sm text-gray-500">Keep up the good work!</p>}
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Forecasting;