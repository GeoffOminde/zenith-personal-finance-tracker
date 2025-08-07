
import React, { useState, useEffect } from 'react';
import type { UseFinanceReturn } from '../hooks/useFinance';
import { AIBudgetSuggestion } from '../types';
import { getAIBudgetSuggestions } from '../services/geminiService';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Card from './ui/Card';

interface AIBudgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    finance: UseFinanceReturn;
    apiKey: string | null;
}

const LoadingState: React.FC = () => (
    <div className="text-center py-10">
        <div className="flex justify-center items-center space-x-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
        </div>
        <p className="mt-4 text-gray-300">Zenith AI is analyzing your spending habits...</p>
        <p className="text-sm text-gray-500">This might take a moment.</p>
    </div>
);

const ErrorState: React.FC<{ error: string, onRetry: () => void }> = ({ error, onRetry }) => (
    <div className="text-center py-10 text-yellow-400 bg-yellow-900/20 rounded-lg p-4">
        <p className="font-semibold">Could not generate suggestions</p>
        <p className="text-sm my-2">{error}</p>
        <Button variant="secondary" onClick={onRetry}>Try Again</Button>
    </div>
);

const SuggestionItem: React.FC<{ 
    suggestion: AIBudgetSuggestion,
    categoryName: string 
}> = ({ suggestion, categoryName }) => (
    <Card className="bg-gray-700/50 p-4">
        <div className="flex justify-between items-center">
            <h4 className="font-semibold text-white">{categoryName}</h4>
            <p className="text-lg font-bold text-blue-400">${suggestion.suggestedAmount.toFixed(2)}</p>
        </div>
        <p className="text-sm text-gray-400 mt-1">{suggestion.reasoning}</p>
    </Card>
);

const AIBudgetModal: React.FC<AIBudgetModalProps> = ({ isOpen, onClose, finance, apiKey }) => {
    const { getCategoryById, addBudget } = finance;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<AIBudgetSuggestion[]>([]);

    const fetchSuggestions = async () => {
        if (!apiKey) {
            setError("API Key is not set.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const result = await getAIBudgetSuggestions(finance.transactions, finance.categories, apiKey);
            setSuggestions(result);
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchSuggestions();
        } else {
            // Reset state when modal is closed
            setSuggestions([]);
            setError(null);
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleApplyBudgets = () => {
        suggestions.forEach(sug => {
            addBudget({ categoryId: sug.categoryId, amount: sug.suggestedAmount });
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI-Powered Budget Plan">
            {isLoading && <LoadingState />}
            {!isLoading && error && <ErrorState error={error} onRetry={fetchSuggestions} />}
            {!isLoading && !error && suggestions.length > 0 && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {suggestions.map(sug => (
                        <SuggestionItem 
                            key={sug.categoryId} 
                            suggestion={sug}
                            categoryName={getCategoryById(sug.categoryId)?.name || 'Unknown Category'}
                        />
                    ))}
                </div>
            )}
             {!isLoading && !error && suggestions.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-gray-400">Could not generate any budget suggestions.</p>
                    <p className="text-sm text-gray-500">This can happen if you don't have enough expense history.</p>
                </div>
            )}
            
            {!isLoading && !error && suggestions.length > 0 && (
                <div className="mt-6">
                    <Button size="lg" className="w-full" onClick={handleApplyBudgets}>
                        Apply Suggested Budget
                    </Button>
                </div>
            )}
        </Modal>
    );
};

export default AIBudgetModal;
