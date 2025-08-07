
import React, { useState, useMemo } from 'react';
import type { UseFinanceReturn } from '../hooks/useFinance';
import { Account, AccountType, User } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';

// --- ICONS ---
const LightningIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

interface DebtPlannerProps {
    finance: UseFinanceReturn;
    user: User;
    openPremiumModal: () => void;
}

type DebtStrategy = 'avalanche' | 'snowball';

interface PlanResult {
    payoffDate: string;
    totalInterestPaid: number;
    totalMonths: number;
    schedule: MonthDetail[];
    baselineInterest: number;
    baselineMonths: number;
}

interface MonthDetail {
    month: number;
    date: string;
    payments: { accountId: string; accountName: string; payment: number; interestPaid: number; remainingBalance: number }[];
    totalRemainingDebt: number;
}


const DebtPlanner: React.FC<DebtPlannerProps> = ({ finance, user, openPremiumModal }) => {
    const { accounts } = finance;
    const { plan: userPlan } = user;

    const [strategy, setStrategy] = useState<DebtStrategy>('avalanche');
    const [extraPayment, setExtraPayment] = useState('100');
    const [plan, setPlan] = useState<PlanResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const debtAccounts = useMemo(() => {
        return accounts.filter(acc => acc.type === AccountType.CreditCard && acc.balance > 0);
    }, [accounts]);

    const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

    const calculatePlan = (isBaseline: boolean = false): PlanResult | null => {
        let simAccounts = JSON.parse(JSON.stringify(debtAccounts)) as Account[];
        if (simAccounts.some(a => !a.interestRate || a.interestRate <= 0)) {
            setError("All debt accounts must have an interest rate greater than 0% to create a plan.");
            return null;
        }

        let totalMonths = 0;
        let totalInterestPaid = 0;
        const schedule: MonthDetail[] = [];
        
        while (simAccounts.some(a => a.balance > 0) && totalMonths < 360) {
            totalMonths++;
            
            // Sort accounts for payment priority each month
            if (strategy === 'avalanche') {
                simAccounts.sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0));
            } else { // snowball
                simAccounts.sort((a, b) => a.balance - b.balance);
            }

            let monthExtraPayment = isBaseline ? 0 : parseFloat(extraPayment) || 0;
            const monthDetail: MonthDetail = {
                month: totalMonths,
                date: new Date(new Date().setMonth(new Date().getMonth() + totalMonths)).toLocaleDateString('default', { month: 'long', year: 'numeric' }),
                payments: [],
                totalRemainingDebt: 0
            };

            // Accrue interest & calculate minimum payments
            const minPayments: Record<string, number> = {};
            simAccounts.forEach(acc => {
                if (acc.balance > 0) {
                    const monthlyRate = (acc.interestRate! / 100) / 12;
                    const interest = acc.balance * monthlyRate;
                    acc.balance += interest;
                    totalInterestPaid += interest;

                    // Simplified min payment: 1% of balance + interest, or $25, whichever is greater
                    minPayments[acc.id] = Math.max(25, acc.balance * 0.01 + interest);
                    monthDetail.payments.push({ accountId: acc.id, accountName: acc.name, payment: 0, interestPaid: interest, remainingBalance: 0 });
                }
            });

            // Apply minimum payments
            simAccounts.forEach(acc => {
                if (acc.balance > 0) {
                    const payment = Math.min(minPayments[acc.id], acc.balance);
                    acc.balance -= payment;
                    const pIndex = monthDetail.payments.findIndex(p => p.accountId === acc.id);
                    if(pIndex > -1) monthDetail.payments[pIndex].payment += payment;
                }
            });

            // Apply extra payment based on strategy
            for (const acc of simAccounts) {
                if (acc.balance > 0 && monthExtraPayment > 0) {
                    const payment = Math.min(monthExtraPayment, acc.balance);
                    acc.balance -= payment;
                    monthExtraPayment -= payment;
                    const pIndex = monthDetail.payments.findIndex(p => p.accountId === acc.id);
                    if(pIndex > -1) monthDetail.payments[pIndex].payment += payment;
                }
            }
            
            monthDetail.totalRemainingDebt = simAccounts.reduce((sum, acc) => sum + acc.balance, 0);
            simAccounts.forEach(acc => {
                const pIndex = monthDetail.payments.findIndex(p => p.accountId === acc.id);
                if(pIndex > -1) monthDetail.payments[pIndex].remainingBalance = acc.balance;
            });
            schedule.push(monthDetail);
        }

        const payoffDate = new Date();
        payoffDate.setMonth(payoffDate.getMonth() + totalMonths);

        return {
            payoffDate: payoffDate.toLocaleDateString('default', { month: 'long', year: 'numeric' }),
            totalInterestPaid,
            totalMonths,
            schedule: isBaseline ? [] : schedule,
            baselineInterest: 0,
            baselineMonths: 0,
        };
    };

    const handleCreatePlan = () => {
        setError(null);
        setPlan(null);
        if (debtAccounts.length === 0) {
            setError("No credit card debt found. Add credit card accounts with a balance to get started.");
            return;
        }

        const planResult = calculatePlan();
        if (!planResult) return;

        const baselineResult = calculatePlan(true);
        if (!baselineResult) return;

        setPlan({
            ...planResult,
            baselineInterest: baselineResult.totalInterestPaid,
            baselineMonths: baselineResult.totalMonths,
        });
    };

    if (userPlan === 'free') {
        return (
            <Card className="flex flex-col items-center justify-center text-center h-full">
                <div className="p-3 rounded-full bg-yellow-500/20 text-yellow-400 mb-4">
                    <LightningIcon />
                </div>
                <h2 className="text-2xl font-semibold text-white">Debt Payoff Planner</h2>
                <p className="text-gray-400 mt-2 max-w-md">Create a custom plan to eliminate your credit card debt faster and save money on interest. Choose between the Avalanche and Snowball methods.</p>
                <Button className="mt-6" onClick={openPremiumModal}>Upgrade to Unlock</Button>
            </Card>
        )
    }

    return (
        <div className="space-y-8">
            <Card>
                <h2 className="text-xl font-semibold text-white">Create Your Payoff Plan</h2>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Payoff Strategy</label>
                        <select value={strategy} onChange={e => setStrategy(e.target.value as DebtStrategy)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                            <option value="avalanche">Avalanche (Highest Interest First)</option>
                            <option value="snowball">Snowball (Smallest Balance First)</option>
                        </select>
                         <p className="text-xs text-gray-400 mt-1">Avalanche is recommended to save the most money.</p>
                    </div>
                    <div>
                        <label htmlFor="extra-payment" className="block text-sm font-medium text-gray-300">Extra Monthly Payment</label>
                        <div className="relative mt-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-gray-400 sm:text-sm">$</span>
                            </div>
                            <input type="number" id="extra-payment" value={extraPayment} onChange={e => setExtraPayment(e.target.value)} min="0" className="block w-full rounded-md border-gray-600 bg-gray-700 py-2 pl-7 pr-3 text-white focus:border-blue-500 focus:ring-blue-500" placeholder="0.00" />
                        </div>
                    </div>
                    <Button onClick={handleCreatePlan} className="w-full">Create Plan</Button>
                </div>
                {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
            </Card>

            {plan ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        <Card><p className="text-sm text-gray-400">Debt-Free Date</p><p className="text-2xl font-bold text-green-400">{plan.payoffDate}</p></Card>
                        <Card><p className="text-sm text-gray-400">Total Interest Saved</p><p className="text-2xl font-bold text-green-400">{formatCurrency(plan.baselineInterest - plan.totalInterestPaid)}</p></Card>
                        <Card><p className="text-sm text-gray-400">Paid Off Sooner</p><p className="text-2xl font-bold text-green-400">{plan.baselineMonths - plan.totalMonths} months</p></Card>
                    </div>
                    
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-4">Payoff Schedule</h3>
                        <div className="overflow-x-auto max-h-96">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-800 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Account</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Payment</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Balance Left</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {plan.schedule.map(month => (
                                        <React.Fragment key={month.month}>
                                            {month.payments.map((p, index) => (
                                                 <tr key={p.accountId} className={index === 0 ? "bg-gray-700/30" : ""}>
                                                    <td className="px-4 py-2 text-sm text-gray-300">{index === 0 ? month.date : ''}</td>
                                                    <td className="px-4 py-2 text-sm text-white font-medium">{p.accountName}</td>
                                                    <td className="px-4 py-2 text-sm text-right text-green-400">{formatCurrency(p.payment)}</td>
                                                    <td className="px-4 py-2 text-sm text-right text-red-400">{formatCurrency(p.remainingBalance)}</td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            ) : (
                 <Card className="text-center py-10 border-dashed border-gray-700">
                    <p className="text-gray-400">Your debt payoff plan will appear here.</p>
                </Card>
            )}
        </div>
    );
};

export default DebtPlanner;
