
import React, { useState, useEffect } from 'react';
import type { UseFinanceReturn } from '../hooks/useFinance';
import { Goal, Account } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import ProgressBar from './ui/ProgressBar';

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

interface GoalsProps {
  finance: UseFinanceReturn;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const GoalForm: React.FC<{
    onSave: (goal: Omit<Goal, 'id' | 'currentAmount'> | Goal) => void;
    onClose: () => void;
    initialData?: Goal | null;
}> = ({ onSave, onClose, initialData }) => {
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [targetDate, setTargetDate] = useState(new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0]);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setTargetAmount(String(initialData.targetAmount));
            setTargetDate(initialData.targetDate);
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !targetAmount || !targetDate) return;
        
        const goalData = {
            name,
            targetAmount: parseFloat(targetAmount),
            targetDate,
        };

        if (initialData) {
            onSave({ ...initialData, ...goalData });
        } else {
            onSave(goalData);
        }
        onClose();
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="goal-name" className="block text-sm font-medium text-gray-300">Goal Name</label>
                <input id="goal-name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g., New Car Down Payment" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label htmlFor="target-amount" className="block text-sm font-medium text-gray-300">Target Amount ($)</label>
                <input id="target-amount" type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} required min="1" step="0.01" placeholder="e.g., 5000" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label htmlFor="target-date" className="block text-sm font-medium text-gray-300">Target Date</label>
                <input id="target-date" type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="flex justify-end pt-4">
                <Button type="submit">{initialData ? 'Save Changes' : 'Create Goal'}</Button>
            </div>
        </form>
    );
}

const ContributionForm: React.FC<{
    onContribute: (amount: number, fromAccountId: string) => void;
    onClose: () => void;
    goal: Goal;
    accounts: Account[];
}> = ({ onContribute, onClose, goal, accounts }) => {
    const [amount, setAmount] = useState('');
    const [fromAccountId, setFromAccountId] = useState<string>(accounts[0]?.id || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const contributionAmount = parseFloat(amount);
        if (contributionAmount > 0 && fromAccountId) {
            onContribute(contributionAmount, fromAccountId);
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-gray-300 text-center">You've saved {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)} so far.</p>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="contrib-amount" className="block text-sm font-medium text-gray-300">Amount ($)</label>
                    <input id="contrib-amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required autoFocus min="0.01" step="0.01" placeholder="e.g., 100" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label htmlFor="from-account" className="block text-sm font-medium text-gray-300">From Account</label>
                    <select id="from-account" value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        {accounts.length === 0 && <option disabled>No accounts available</option>}
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={accounts.length === 0}>Contribute</Button>
            </div>
        </form>
    );
}

const Goals: React.FC<GoalsProps> = ({ finance }) => {
    const { goals, accounts, addGoal, editGoal, deleteGoal, addContributionToGoal } = finance;
    const [isGoalModalOpen, setGoalModalOpen] = useState(false);
    const [isContribModalOpen, setContribModalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

    const handleOpenGoalModal = (goal: Goal | null = null) => {
        setSelectedGoal(goal);
        setGoalModalOpen(true);
    };
    
    const handleCloseGoalModal = () => setGoalModalOpen(false);

    const handleOpenContribModal = (goal: Goal) => {
        if (accounts.length === 0) {
            alert("Please create an account before making a contribution.");
            return;
        }
        setSelectedGoal(goal);
        setContribModalOpen(true);
    };
    
    const handleCloseContribModal = () => setContribModalOpen(false);

    const handleSaveGoal = (goalData: Omit<Goal, 'id' | 'currentAmount'> | Goal) => {
        if ('id' in goalData) {
            editGoal(goalData as Goal);
        } else {
            addGoal(goalData);
        }
    };
    
    const handleDeleteGoal = (id: string) => {
        if (window.confirm('Are you sure you want to delete this goal? This will not affect any past contributions in your transaction history.')) {
            deleteGoal(id);
        }
    };
    
    const handleContribute = (amount: number, fromAccountId: string) => {
        if (selectedGoal) {
            addContributionToGoal(selectedGoal.id, amount, fromAccountId);
        }
    };
    
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-white">Financial Goals</h1>
                <Button onClick={() => handleOpenGoalModal()}>Add New Goal</Button>
            </div>

            {goals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map(goal => (
                        <Card key={goal.id} className="flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-semibold text-white">{goal.name}</h3>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => handleOpenGoalModal(goal)} className="text-gray-400 hover:text-blue-400 transition-colors"><EditIcon /></button>
                                        <button onClick={() => handleDeleteGoal(goal.id)} className="text-gray-400 hover:text-red-400 transition-colors"><DeleteIcon /></button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400 mb-3">Target: {formatCurrency(goal.targetAmount)}</p>
                                <ProgressBar value={goal.currentAmount} max={goal.targetAmount} />
                                <div className="flex justify-between text-sm mt-2 text-gray-400">
                                    <span>{formatCurrency(goal.currentAmount)} Saved</span>
                                    <span>{Math.round((goal.currentAmount / goal.targetAmount) * 100)}%</span>
                                </div>
                            </div>
                            <Button onClick={() => handleOpenContribModal(goal)} className="w-full mt-6">Contribute</Button>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="text-center py-16 bg-gray-800/50 border border-dashed border-gray-700">
                    <div className="text-4xl mb-4">🏆</div>
                    <h3 className="text-xl font-semibold text-white">Set Your First Financial Goal</h3>
                    <p className="text-gray-400 mt-2 mb-4">Start saving for something important to you.</p>
                    <Button onClick={() => handleOpenGoalModal()}>Create a Goal</Button>
                </Card>
            )}

            <Modal isOpen={isGoalModalOpen} onClose={handleCloseGoalModal} title={selectedGoal ? 'Edit Goal' : 'Add New Goal'}>
                <GoalForm onSave={handleSaveGoal} onClose={handleCloseGoalModal} initialData={selectedGoal} />
            </Modal>
            
            {selectedGoal && (
                 <Modal isOpen={isContribModalOpen} onClose={handleCloseContribModal} title={`Contribute to "${selectedGoal.name}"`}>
                    <ContributionForm onContribute={handleContribute} onClose={handleCloseContribModal} goal={selectedGoal} accounts={accounts} />
                </Modal>
            )}
        </div>
    );
};

export default Goals;