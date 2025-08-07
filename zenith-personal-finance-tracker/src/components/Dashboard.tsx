import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import type { UseFinanceReturn } from '../hooks/useFinance';
import { TransactionType, SmartFeedItem, InsightType, Account, AccountType, Bill } from '../types';
import type { View } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import ProgressBar from './ui/ProgressBar';
import { GoogleGenAI, Type } from '@google/genai';
import AIBriefingCard from './AIBriefingCard';

const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

// --- ICONS ---
const PraiseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 18.734V6.5A2.5 2.5 0 019.5 4h.095c.883 0 1.714.456 2.233 1.206l2.115 2.943A2 2 0 0014 10z" /></svg>;
const WarningIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const SuggestionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
const ObservationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120 12M20 20l-1.5-1.5A9 9 0 004 12" /></svg>;
const BillIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;


const LoadingDots = () => (
    <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
    </div>
);

const INSIGHT_META: { [key in InsightType]: { color: string; icon: React.ReactNode } } = {
  Praise: { color: 'green', icon: <PraiseIcon /> },
  Warning: { color: 'yellow', icon: <WarningIcon /> },
  Suggestion: { color: 'blue', icon: <SuggestionIcon /> },
  Observation: { color: 'gray', icon: <ObservationIcon /> },
};


// --- UI COMPONENTS ---
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const StatCard: React.FC<{ title: string; amount: number; colorClass: string; icon: React.ReactNode }> = ({ title, amount, colorClass, icon }) => (
    <Card className="flex items-center">
        <div className={`p-3 rounded-full ${colorClass} bg-opacity-20`}>
            <div className={`text-2xl ${colorClass}`}>{icon}</div>
        </div>
        <div className="ml-4">
            <p className="text-gray-400 text-sm">{title}</p>
            <p className="text-2xl font-bold text-white">
                {formatCurrency(amount)}
            </p>
        </div>
    </Card>
);

const InsightCard: React.FC<{ item: SmartFeedItem }> = ({ item }) => {
    const meta = INSIGHT_META[item.type];
    const colorClasses = {
        icon: `text-${meta.color}-400`,
        bg: `bg-${meta.color}-500/10`,
        border: `border-${meta.color}-500/30`,
    };

    return (
        <div className={`flex items-start p-4 rounded-lg border ${colorClasses.bg} ${colorClasses.border}`}>
            <div className={`flex-shrink-0 mr-4 ${colorClasses.icon}`}>{meta.icon}</div>
            <div>
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.description}</p>
            </div>
        </div>
    );
};

const SmartFeed: React.FC<{ finance: UseFinanceReturn; apiKey: string | null; }> = ({ finance, apiKey }) => {
    const [feedItems, setFeedItems] = React.useState<SmartFeedItem[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const generateFeed = React.useCallback(async () => {
        if (!apiKey) {
            setError("API Key not found. Please set your Gemini API key in Settings.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        setFeedItems([]);

        try {
            const ai = new GoogleGenAI({ apiKey });
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            
            const recentTransactions = finance.transactions.filter(t => new Date(t.date) >= firstDay);
            if (recentTransactions.length < 3) {
                setError("Not enough recent activity to generate insights. Add some transactions for this month!");
                setIsLoading(false);
                return;
            }

            const financialContext = {
                summary: finance.summary,
                recentTransactions: recentTransactions.slice(0, 20),
                budgets: finance.budgets.map(b => ({ 
                    ...b, 
                    spent: finance.getSpentAmountForCategory(b.categoryId),
                    categoryName: finance.getCategoryById(b.categoryId)?.name 
                })),
                goals: finance.goals.slice(0, 5),
                categories: finance.categories
            };

            const schema = {
                type: Type.OBJECT,
                properties: {
                    insights: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                type: { type: Type.STRING, enum: ['Praise', 'Warning', 'Suggestion', 'Observation'] },
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                            },
                            required: ['id', 'type', 'title', 'description']
                        }
                    }
                }
            };
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Analyze the following financial data and generate 3-5 concise, helpful insights for a smart feed. The user's expense categories are custom, so use the provided 'categories' list to map 'categoryId' to a name. Focus on recent activity. Provide a mix of praise for good habits, warnings for overspending, suggestions for improvement, and simple observations. Today's date is ${now.toISOString().split('T')[0]}. Financial Data: ${JSON.stringify(financialContext)}`,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: schema,
                }
            });
            
            const result = JSON.parse(response.text);
            if (result.insights && result.insights.length > 0) {
                 setFeedItems(result.insights);
            } else {
                 setError("Could not generate any insights at this time.");
            }

        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
             setError(`AI Insight Error: ${message}`);
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, finance.transactions, finance.summary, finance.budgets, finance.goals, finance.categories, finance.getCategoryById, finance.getSpentAmountForCategory]);
    
    React.useEffect(() => {
        if(finance.transactions.length > 0) {
            generateFeed();
        } else {
            setIsLoading(false);
            setError("Add transactions to get insights.")
        }
    }, [finance.transactions, generateFeed]);

    return (
        <Card className="h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Smart Feed</h2>
                <Button variant="secondary" size="sm" onClick={generateFeed} disabled={isLoading || !apiKey}>
                    {isLoading ? <LoadingDots /> : <RefreshIcon />}
                </Button>
            </div>
             {isLoading && (
                <div className="flex justify-center items-center py-10">
                    <div className="text-center">
                        <LoadingDots />
                        <p className="mt-2 text-gray-400">Zenith AI is analyzing your finances...</p>
                    </div>
                </div>
            )}
            {!isLoading && error && (
                 <div className="text-center py-10 text-yellow-400 bg-yellow-900/20 rounded-lg p-4">
                    <p className="font-semibold">Smart Feed Error</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}
            {!isLoading && !error && feedItems.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    <p>No new insights right now. Check back later!</p>
                </div>
            )}
            {!isLoading && !error && feedItems.length > 0 && (
                <div className="space-y-3">
                    {feedItems.map(item => <InsightCard key={item.id} item={item} />)}
                </div>
            )}
        </Card>
    );
};

const FinancialHealthCard: React.FC<{ finance: UseFinanceReturn; setActiveView: (view: View) => void }> = ({ finance, setActiveView }) => {
    const { financialHealth } = finance;
    const score = financialHealth.overallScore;

    const getScoreColor = (s: number) => {
        if (s >= 80) return 'text-green-400';
        if (s >= 50) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getRecommendation = () => {
        const metrics = [
            { name: 'Savings Rate', score: financialHealth.metrics.savingsRate.score, weight: 30 },
            { name: 'Debt-to-Income', score: financialHealth.metrics.debtToIncomeRatio.score, weight: 25 },
            { name: 'Emergency Fund', score: financialHealth.metrics.emergencyFund.score, weight: 25 },
        ];
        const lowest = metrics.sort((a,b) => (a.score/a.weight) - (b.score/b.weight))[0];
        return `Focus on improving your ${lowest.name}.`;
    }
    
    return (
        <Card>
            <h2 className="text-xl font-semibold mb-4">Financial Health</h2>
            <div className="flex items-center justify-center gap-6">
                <div className="relative w-32 h-32">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path className="text-gray-700" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className={`${getScoreColor(score)} transition-all duration-500`} strokeWidth="3" fill="none" strokeDasharray={`${score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}</span>
                    </div>
                </div>
                <div className="flex-1">
                    <p className="text-gray-300">Your current financial health score. A higher score means a stronger financial position.</p>
                    {score < 80 && <p className="text-sm text-yellow-300 mt-2 font-semibold">{getRecommendation()}</p>}
                    <Button variant="secondary" size="sm" className="mt-3" onClick={() => setActiveView('health')}>View Full Report</Button>
                </div>
            </div>
        </Card>
    );
};


const AccountSummaryCard: React.FC<{ accounts: Account[], setActiveView: (view: View) => void }> = ({ accounts, setActiveView }) => {
    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Accounts</h2>
                <Button variant="secondary" size="sm" onClick={() => setActiveView('accounts')}>
                    Manage
                </Button>
            </div>
            <div className="space-y-3">
                {accounts.length > 0 ? accounts.slice(0, 4).map(acc => (
                    <div key={acc.id} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                        <div>
                            <p className="font-medium text-white">{acc.name}</p>
                            <p className="text-xs text-gray-400">{acc.type}</p>
                        </div>
                        <p className={`font-semibold text-lg ${acc.type === AccountType.CreditCard && acc.balance > 0 ? 'text-red-400' : 'text-white'}`}>
                            {acc.type === AccountType.Investment ? "" : formatCurrency(acc.balance)}
                        </p>
                    </div>
                )) : (
                    <div className="text-center py-5">
                        <p className="text-gray-400">No accounts created yet.</p>
                         <Button size="sm" className="mt-2" onClick={() => setActiveView('accounts')}>Add an Account</Button>
                    </div>
                )}
            </div>
        </Card>
    );
}

const PortfolioSnapshotCard: React.FC<{ finance: UseFinanceReturn, setActiveView: (view: View) => void }> = ({ finance, setActiveView }) => {
    const { portfolioData } = finance;
    const topHoldings = [...portfolioData.holdings].sort((a,b) => b.currentValue - a.currentValue).slice(0, 3);

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Portfolio</h2>
                <Button variant="secondary" size="sm" onClick={() => setActiveView('investments')}>
                    View All
                </Button>
            </div>
            <div className="text-center mb-4">
                <p className="text-sm text-gray-400">Total Value</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(portfolioData.totalValue)}</p>
                <p className={`text-sm font-semibold ${portfolioData.totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {portfolioData.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(portfolioData.totalGainLoss)}
                </p>
            </div>
            <div className="space-y-2">
                 {topHoldings.length > 0 ? topHoldings.map(h => (
                    <div key={h.id} className="flex justify-between items-center p-2 bg-gray-700/50 rounded-lg">
                        <div>
                            <p className="font-medium text-white">{h.name}</p>
                            <p className="text-xs text-gray-400">{h.quantity} @ {formatCurrency(h.avgCost)}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-medium text-white">{formatCurrency(h.currentValue)}</p>
                            <p className={`text-xs ${h.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>{h.gainLoss >= 0 ? '+' : ''}{formatCurrency(h.gainLoss)}</p>
                        </div>
                    </div>
                )) : (
                     <div className="text-center py-5">
                        <p className="text-gray-400">No holdings to track yet.</p>
                         <Button size="sm" className="mt-2" onClick={() => setActiveView('investments')}>Add a Holding</Button>
                    </div>
                )}
            </div>
        </Card>
    );
};

const LoanOverviewCard: React.FC<{ finance: UseFinanceReturn, setActiveView: (view: View) => void }> = ({ finance, setActiveView }) => {
    const { loans, summary } = finance;
    const topLoans = [...loans].sort((a,b) => b.currentBalance - a.currentBalance).slice(0, 2);

    return (
        <Card>
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Loan Overview</h2>
                <Button variant="secondary" size="sm" onClick={() => setActiveView('loans')}>
                    Manage Loans
                </Button>
            </div>
            <div className="text-center mb-4">
                <p className="text-sm text-gray-400">Total Loan Debt</p>
                <p className="text-3xl font-bold text-red-400">{formatCurrency(summary.loanDebt)}</p>
            </div>
             <div className="space-y-2">
                 {topLoans.length > 0 ? topLoans.map(l => (
                    <div key={l.id} className="flex justify-between items-center p-2 bg-gray-700/50 rounded-lg">
                        <div>
                            <p className="font-medium text-white">{l.name}</p>
                            <p className="text-xs text-gray-400">{l.type}</p>
                        </div>
                        <p className="font-semibold text-white">{formatCurrency(l.currentBalance)}</p>
                    </div>
                )) : (
                    <div className="text-center py-5">
                        <p className="text-gray-400">No loans to track yet.</p>
                         <Button size="sm" className="mt-2" onClick={() => setActiveView('loans')}>Add a Loan</Button>
                    </div>
                )}
            </div>
        </Card>
    );
};


const RecentTransactions: React.FC<{ finance: UseFinanceReturn; setActiveView: (view: View) => void }> = ({ finance, setActiveView }) => {
    const { transactions, getCategoryById, getAccountById } = finance;
    const recent = transactions.slice(0, 5);

    return (
        <Card>
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Recent Activity</h2>
                <Button variant="secondary" size="sm" onClick={() => setActiveView('transactions')}>
                    View All
                </Button>
            </div>
            <div className="space-y-3">
                {recent.length > 0 ? recent.map(t => (
                    <div key={t.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === TransactionType.Income ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                <span className={`text-xl ${t.type === TransactionType.Income ? 'text-green-400' : 'text-red-400'}`}>{t.type === TransactionType.Income ? '↓' : '↑'}</span>
                            </div>
                            <div>
                                <p className="font-medium text-white">{t.description}</p>
                                <p className="text-xs text-gray-400">
                                    {t.type === TransactionType.Transfer ? `Transfer` : getCategoryById(t.categoryId)?.name}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                           <p className={`font-semibold ${t.type === TransactionType.Income ? 'text-green-400' : t.type === TransactionType.Expense ? 'text-red-400' : 'text-gray-300'}`}>
                               {t.type === TransactionType.Income ? '+' : '-'}{formatCurrency(t.amount)}
                           </p>
                           <p className="text-xs text-gray-500">{getAccountById(t.accountId)?.name}</p>
                        </div>
                    </div>
                )) : <p className="text-center text-gray-500 py-4">No transactions yet.</p>}
            </div>
        </Card>
    );
};

const UpcomingBills: React.FC<{ bills: Bill[], setActiveView: (view: View) => void }> = ({ bills, setActiveView }) => {
    const now = new Date();
    const upcoming = bills
        .map(bill => {
            const lastPaid = bill.lastPaidDate ? new Date(bill.lastPaidDate) : null;
            if (lastPaid && lastPaid.getMonth() === now.getMonth() && lastPaid.getFullYear() === now.getFullYear()) {
                return null;
            }
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const dueDay = Math.min(bill.dueDay, daysInMonth);
            const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
            if (dueDate < now && !(dueDate.getDate() === now.getDate() && dueDate.getMonth() === now.getMonth())) return null; // Already past due date for this month
            return { ...bill, dueDate };
        })
        .filter((b): b is Bill & { dueDate: Date } => b !== null)
        .sort((a,b) => a.dueDate.getTime() - b.dueDate.getTime())
        .slice(0, 3);
    
    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Upcoming Bills</h2>
                <Button variant="secondary" size="sm" onClick={() => setActiveView('bills')}>
                    Manage
                </Button>
            </div>
            <div className="space-y-3">
                {upcoming.length > 0 ? upcoming.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <BillIcon />
                            <div>
                                <p className="font-medium text-white">{b.name}</p>
                                <p className="text-xs text-gray-400">Due: {b.dueDate.toLocaleDateString()}</p>
                            </div>
                        </div>
                        <p className="font-semibold text-lg text-white">{formatCurrency(b.amount)}</p>
                    </div>
                )) : (
                    <div className="text-center py-5">
                        <p className="text-gray-400">No upcoming bills this month.</p>
                    </div>
                )}
            </div>
        </Card>
    );
};

interface DashboardProps {
    finance: UseFinanceReturn;
    apiKey: string | null;
    setActiveView: (view: View) => void;
}


const Dashboard: React.FC<DashboardProps> = ({ finance, apiKey, setActiveView }) => {
    const { summary, expensesByCategory, goals, accounts, bills } = finance;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <StatCard 
                    title="Net Worth"
                    amount={summary.netWorth}
                    colorClass="text-blue-400"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                />
                <StatCard 
                    title="Monthly Income"
                    amount={summary.totalIncome}
                    colorClass="text-green-400"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>}
                />
                <StatCard 
                    title="Monthly Expenses"
                    amount={summary.totalExpenses}
                    colorClass="text-red-400"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                   <SmartFeed finance={finance} apiKey={apiKey} />
                </div>
                <div className="space-y-6">
                    <FinancialHealthCard finance={finance} setActiveView={setActiveView} />
                    <AIBriefingCard finance={finance} apiKey={apiKey} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <AccountSummaryCard accounts={accounts} setActiveView={setActiveView} />
                </div>
                <PortfolioSnapshotCard finance={finance} setActiveView={setActiveView} />
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <LoanOverviewCard finance={finance} setActiveView={setActiveView} />
                 <div className="lg:col-span-2">
                    <RecentTransactions finance={finance} setActiveView={setActiveView} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h2 className="text-xl font-semibold mb-4">Spending by Category</h2>
                    <div style={{ width: '100%', height: 300 }}>
                    {expensesByCategory.length > 0 ? (
                        <ResponsiveContainer>
                        <PieChart>
                            <Pie data={expensesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                            {expensesByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value: number | string) => formatCurrency(Number(value))} />
                            <Legend />
                        </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">No expense data for this month.</div>
                    )}
                    </div>
                </Card>
                <Card>
                    <h2 className="text-xl font-semibold mb-4">Goal Progress</h2>
                    <div className="space-y-4">
                        {goals.length > 0 ? goals.slice(0,3).map(goal => (
                            <div key={goal.id}>
                                <div className="flex justify-between items-baseline">
                                    <h3 className="font-semibold text-white">{goal.name}</h3>
                                    <span className="text-sm text-gray-400">{formatCurrency(goal.targetAmount)}</span>
                                </div>
                                <ProgressBar value={goal.currentAmount} max={goal.targetAmount} />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>{formatCurrency(goal.currentAmount)}</span>
                                    <span>{Math.round((goal.currentAmount / goal.targetAmount) * 100)}%</span>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 text-gray-500">
                                <p>No goals set yet. Go to the Goals page to create one!</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
             <div className="grid grid-cols-1 gap-6">
                 <UpcomingBills bills={bills} setActiveView={setActiveView} />
             </div>
        </div>
    );
};

export default Dashboard;
