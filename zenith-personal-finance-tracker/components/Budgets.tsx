
import React, { useState } from 'react';
import type { UseFinanceReturn } from '../hooks/useFinance';
import { Budget, Category, User } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import ProgressBar from './ui/ProgressBar';
import AIBudgetModal from './AIBudgetModal';

const SparkleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 2zM5.404 4.343a.75.75 0 010 1.06l-2.5 2.5a.75.75 0 11-1.06-1.06l2.5-2.5a.75.75 0 011.06 0zm9.192 0a.75.75 0 011.06 0l2.5 2.5a.75.75 0 01-1.06 1.06l-2.5-2.5a.75.75 0 010-1.06zM2 10a.75.75 0 01.75-.75h3.5a.75.75 0 010 1.5h-3.5A.75.75 0 012 10zM17.25 10a.75.75 0 000-1.5h-3.5a.75.75 0 000 1.5h3.5zM7.904 12.096a.75.75 0 011.06 0l2.5 2.5a.75.75 0 01-1.06 1.06l-2.5-2.5a.75.75 0 010-1.06zM4.343 14.596a.75.75 0 011.06 0l2.5 2.5a.75.75 0 11-1.06 1.06l-2.5-2.5a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>;

interface BudgetsProps {
  finance: UseFinanceReturn;
  user: User;
  apiKey: string | null;
  openPremiumModal: () => void;
}

const AddBudgetForm: React.FC<{ 
    onAdd: (b: Omit<Budget, 'id'>) => boolean, 
    categories: Category[],
    existingBudgetCategoryIds: string[],
    isLimitReached: boolean,
    budgetLimit: number,
    openPremiumModal: () => void,
    onOpenAISuggestions: () => void,
}> = ({ onAdd, categories, existingBudgetCategoryIds, isLimitReached, budgetLimit, openPremiumModal, onOpenAISuggestions }) => {
    const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || '');
    const [amount, setAmount] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const isUpdating = existingBudgetCategoryIds.includes(categoryId);
        if ((isLimitReached && !isUpdating) || !categoryId || !amount) {
            if (isLimitReached && !isUpdating) openPremiumModal();
            return;
        }

        const success = onAdd({ categoryId, amount: parseFloat(amount) });
        
        if (success) {
            setAmount('');
        } else {
            openPremiumModal();
        }
    };
    
    const isAtLimitAndNotUpdating = isLimitReached && !existingBudgetCategoryIds.includes(categoryId);

    return (
        <Card>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h2 className="text-xl font-semibold text-white">Set New or Update Budget</h2>
                <Button variant="secondary" onClick={onOpenAISuggestions} className="flex items-center bg-blue-900/50 hover:bg-blue-800/60 text-blue-300 ring-blue-500">
                    <SparkleIcon /> Get AI Suggestions
                </Button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                <select 
                    value={categoryId} 
                    onChange={e => setCategoryId(e.target.value)}
                    className="flex-grow bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input 
                    type="number" 
                    placeholder="Budget Amount" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    required min="1" 
                    className="bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                />
                <Button type="submit">
                    {existingBudgetCategoryIds.includes(categoryId) ? 'Update Budget' : 'Set Budget'}
                </Button>
            </form>
            {isAtLimitAndNotUpdating && (
                 <p className="text-sm text-yellow-400 mt-3 text-center">
                    You've reached your {budgetLimit}-budget limit. <strong>Upgrade to Premium</strong> for unlimited budgets.
                </p>
            )}
        </Card>
    );
};


const Budgets: React.FC<BudgetsProps> = ({ finance, user, apiKey, openPremiumModal }) => {
  const { budgets, categories, addBudget, getSpentAmountForCategory, getCategoryById, budgetLimit } = finance;
  const { plan: userPlan } = user;
  const [isAIBudgetModalOpen, setIsAIBudgetModalOpen] = useState(false);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const isBudgetLimitReached = userPlan === 'free' && budgets.length >= budgetLimit;
  
  const handleOpenAISuggestions = () => {
      if (userPlan === 'premium') {
          setIsAIBudgetModalOpen(true);
      } else {
          openPremiumModal();
      }
  };

  return (
    <>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-white">Budgets</h1>

        <AddBudgetForm 
          onAdd={addBudget} 
          categories={categories}
          existingBudgetCategoryIds={budgets.map(b => b.categoryId)}
          isLimitReached={isBudgetLimitReached}
          budgetLimit={budgetLimit}
          openPremiumModal={openPremiumModal}
          onOpenAISuggestions={handleOpenAISuggestions}
        />

        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Your Budgets ({budgets.length}/{userPlan === 'free' ? budgetLimit : '∞'})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {budgets.map(budget => {
                  const spent = getSpentAmountForCategory(budget.categoryId);
                  const categoryName = getCategoryById(budget.categoryId)?.name || 'Unknown Category';
                  return (
                      <Card key={budget.id}>
                          <div className="flex justify-between items-center mb-2">
                              <h3 className="text-lg font-semibold">{categoryName}</h3>
                              <span className="text-sm font-medium text-gray-400">
                                  {formatCurrency(budget.amount)}
                              </span>
                          </div>
                          <ProgressBar value={spent} max={budget.amount} />
                          <div className="flex justify-between text-sm mt-2 text-gray-400">
                              <span>Spent: {formatCurrency(spent)}</span>
                              <span>Remaining: {formatCurrency(Math.max(0, budget.amount - spent))}</span>
                          </div>
                      </Card>
                  )
              })}
          </div>
          {budgets.length === 0 && (
              <Card className="text-center py-10">
                  <p className="text-gray-400">You haven't set any budgets yet.</p>
                  <p className="text-gray-500">Use the form above to get started!</p>
              </Card>
          )}
        </div>
      </div>
      <AIBudgetModal
          isOpen={isAIBudgetModalOpen}
          onClose={() => setIsAIBudgetModalOpen(false)}
          finance={finance}
          apiKey={apiKey}
      />
    </>
  );
};

export default Budgets;