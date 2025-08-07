
import React, { useState, useEffect } from 'react';
import type { UseFinanceReturn } from '../hooks/useFinance';
import { Transaction, TransactionType, Category, ParsedReceipt, Account } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { getCategorySuggestion } from '../services/geminiService';
import ReceiptScanner from './ReceiptScanner';

interface TransactionsProps {
  finance: UseFinanceReturn;
  apiKey: string | null;
}

const SuggestionSpinner = () => (
    <div className="flex items-center gap-1 text-xs text-gray-400">
        <svg className="animate-spin h-3 w-3 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Thinking...</span>
    </div>
);


const TransactionForm: React.FC<{ 
    onSave: (t: Omit<Transaction, 'id' | 'date'> | Transaction) => void;
    onClose: () => void;
    initialData?: Partial<Transaction> | null;
    categories: Category[];
    accounts: Account[];
    apiKey: string | null;
}> = ({ onSave, onClose, initialData, categories, accounts, apiKey }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<TransactionType>(TransactionType.Expense);
    const [categoryId, setCategoryId] = useState<string | null>(categories[0]?.id || null);
    const [accountId, setAccountId] = useState<string>(''); // From account for transfers
    const [toAccountId, setToAccountId] = useState<string>(''); // To account for transfers
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestion, setSuggestion] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setDescription(initialData.description || '');
            setAmount(initialData.amount ? String(initialData.amount) : '');
            setType(initialData.type || TransactionType.Expense);
            setCategoryId(initialData.categoryId || categories.find(c => c.name === 'Other')?.id || categories[0]?.id || null);
            setAccountId(initialData.accountId || accounts[0]?.id || '');
            setToAccountId(initialData.toAccountId || '');
        } else {
            // Reset form for new transaction
            setDescription('');
            setAmount('');
            setType(TransactionType.Expense);
            setCategoryId(categories.find(c => c.name !== 'Transfer')?.id || null);
            setAccountId(accounts[0]?.id || '');
            setToAccountId(accounts.length > 1 ? accounts[1].id : '');
        }
        setSuggestion(null);
    }, [initialData, categories, accounts]);

    // Debounced effect for suggestions
    useEffect(() => {
        setSuggestion(null);
        if (type !== TransactionType.Expense || !apiKey || !description.trim() || description.length < 4) {
            return;
        }

        const handler = setTimeout(async () => {
            setIsSuggesting(true);
            const suggestedId = await getCategorySuggestion(description, categories.filter(c => c.name !== 'Transfer'), apiKey);
            if (suggestedId) {
                setSuggestion(suggestedId);
            }
            setIsSuggesting(false);
        }, 700); // 700ms debounce

        return () => {
            clearTimeout(handler);
            setIsSuggesting(false);
        };
    }, [description, type, categories, apiKey]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || !amount || !accountId) return;

        if (type === TransactionType.Transfer && (!toAccountId || accountId === toAccountId)) {
            alert("For a transfer, 'From' and 'To' accounts must be different.");
            return;
        }

        const transactionData = {
            description,
            amount: parseFloat(amount),
            type,
            categoryId: type === TransactionType.Expense ? categoryId : null,
            accountId, // fromAccountId for transfers
            toAccountId: type === TransactionType.Transfer ? toAccountId : undefined,
        };

        if (initialData?.id) {
            onSave({ ...initialData, ...transactionData } as Transaction);
        } else {
            onSave(transactionData);
        }
        onClose();
    };
    
    const handleApplySuggestion = () => {
        if (suggestion) {
            setCategoryId(suggestion);
            setSuggestion(null);
        }
    };


    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300">Description</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Amount</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="0.01" step="0.01" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Type</label>
                    <select value={type} onChange={e => setType(e.target.value as TransactionType)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        {Object.values(TransactionType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            {type === TransactionType.Transfer ? (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">From Account</label>
                        <select value={accountId} onChange={e => setAccountId(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">To Account</label>
                        <select value={toAccountId} onChange={e => setToAccountId(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                            {accounts.filter(a => a.id !== accountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Account</label>
                        <select value={accountId} onChange={e => setAccountId(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Category</label>
                        <select value={categoryId || ''} onChange={e => setCategoryId(e.target.value)} disabled={type === TransactionType.Income} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50">
                             {categories.filter(c => c.name !== 'Transfer').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                         {isSuggesting && <SuggestionSpinner />}
                         {suggestion && categoryId !== suggestion && !isSuggesting && (
                             <button type="button" onClick={handleApplySuggestion} className="text-xs text-blue-400 hover:underline mt-1 text-left">
                                 Suggestion: <strong>{categories.find(c => c.id === suggestion)?.name}</strong>. Apply?
                             </button>
                         )}
                    </div>
                </div>
            )}
            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={accounts.length === 0}>{initialData?.id ? 'Save Changes' : 'Add Transaction'}</Button>
            </div>
        </form>
    );
};

const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const ScanIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

const Transactions: React.FC<TransactionsProps> = ({ finance, apiKey }) => {
    const { transactions, categories, accounts, addTransaction, editTransaction, deleteTransaction, getCategoryById, getAccountById } = finance;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Partial<Transaction> | null>(null);

    const handleOpenModal = (transaction: Transaction | null = null) => {
        if (accounts.length === 0 && !transaction) {
            alert("Please add an account first before adding a transaction.");
            return;
        }
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTransaction(null);
    };

    const handleSave = (data: Omit<Transaction, 'id' | 'date'> | Transaction) => {
        if ('id' in data) {
            editTransaction(data as Transaction);
        } else {
            addTransaction(data);
        }
    };
    
    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
            deleteTransaction(id);
        }
    };

    const handleReceiptScanComplete = (data: ParsedReceipt) => {
        setIsScannerOpen(false);
        // Pre-fill the form with scanned data
        const transactionData: Partial<Transaction> = {
            description: data.description,
            amount: data.amount,
            date: data.date,
            type: TransactionType.Expense,
        };
        setEditingTransaction(transactionData);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-white">Transactions</h1>
                <div className="flex gap-2">
                    {apiKey && (
                        <Button variant="secondary" onClick={() => setIsScannerOpen(true)} disabled={accounts.length === 0}>
                            <ScanIcon /> Scan Receipt
                        </Button>
                    )}
                    <Button onClick={() => handleOpenModal()} disabled={accounts.length === 0}>Add Transaction</Button>
                </div>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Account</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {transactions.length > 0 ? transactions.map(t => (
                                <tr key={t.id} className="hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{t.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(t.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{getAccountById(t.accountId)?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-700 text-gray-300">
                                            {t.type === TransactionType.Transfer ? 'Transfer' : getCategoryById(t.categoryId)?.name || 'Uncategorized'}
                                        </span>
                                    </td>
                                    <td className={'px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ' + (t.type === TransactionType.Income ? 'text-green-400' : t.type === TransactionType.Expense ? 'text-red-400' : 'text-gray-300')}>
                                        {t.type === TransactionType.Income ? '+' : t.type === TransactionType.Expense ? '-' : ''}{formatCurrency(t.amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end items-center gap-4">
                                            <button onClick={() => handleOpenModal(t)} className="text-blue-400 hover:text-blue-300 transition-colors"><EditIcon /></button>
                                            <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-red-300 transition-colors"><DeleteIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-500">
                                        No transactions recorded yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTransaction?.id ? 'Edit Transaction' : 'Add Transaction'}>
                <TransactionForm onSave={handleSave} onClose={handleCloseModal} initialData={editingTransaction} categories={categories} accounts={accounts} apiKey={apiKey} />
            </Modal>
            <ReceiptScanner 
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onComplete={handleReceiptScanComplete}
                apiKey={apiKey}
            />
        </div>
    );
};

export default Transactions;