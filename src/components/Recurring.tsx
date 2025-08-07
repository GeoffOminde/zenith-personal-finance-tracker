
import React, { useState, useEffect } from 'react';
import type { UseFinanceReturn } from '../hooks/useFinance';
import { RecurringTransaction, TransactionType, Category, RecurringFrequency, Account } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

interface RecurringProps {
  finance: UseFinanceReturn;
}

const RecurringTransactionForm: React.FC<{ 
    onSave: (t: Omit<RecurringTransaction, 'id' | 'lastProcessedDate'> | RecurringTransaction) => void;
    onClose: () => void;
    initialData?: RecurringTransaction | null;
    categories: Category[];
    accounts: Account[];
}> = ({ onSave, onClose, initialData, categories, accounts }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<TransactionType>(TransactionType.Expense);
    const [categoryId, setCategoryId] = useState<string | null>(categories[0]?.id || null);
    const [frequency, setFrequency] = useState<RecurringFrequency>(RecurringFrequency.Monthly);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [accountId, setAccountId] = useState<string>('');

    useEffect(() => {
        if (initialData) {
            setDescription(initialData.description);
            setAmount(String(initialData.amount));
            setType(initialData.type);
            setCategoryId(initialData.categoryId);
            setFrequency(initialData.frequency);
            setStartDate(initialData.startDate);
            setAccountId(initialData.accountId);
        } else {
            setDescription('');
            setAmount('');
            setType(TransactionType.Expense);
            setCategoryId(categories[0]?.id || null);
            setFrequency(RecurringFrequency.Monthly);
            setStartDate(new Date().toISOString().split('T')[0]);
            setAccountId(accounts[0]?.id || '');
        }
    }, [initialData, categories, accounts]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || !amount || !startDate || !accountId) return;

        const transactionData = {
            description,
            amount: parseFloat(amount),
            type,
            categoryId: type === TransactionType.Expense ? categoryId : null,
            frequency,
            startDate,
            accountId,
        };

        if (initialData) {
            onSave({ ...initialData, ...transactionData });
        } else {
            onSave(transactionData);
        }
        onClose();
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
                        {Object.values(TransactionType).filter(t => t !== TransactionType.Transfer).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Account</label>
                <select value={accountId} onChange={e => setAccountId(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    {accounts.length === 0 && <option disabled>Please add an account first</option>}
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
            </div>
            {type === TransactionType.Expense && (
                <div>
                    <label className="block text-sm font-medium text-gray-300">Category</label>
                    <select value={categoryId || ''} onChange={e => setCategoryId(e.target.value)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            )}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Frequency</label>
                    <select value={frequency} onChange={e => setFrequency(e.target.value as RecurringFrequency)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        {Object.values(RecurringFrequency).map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Start Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
            </div>
            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={accounts.length === 0}>{initialData ? 'Save Changes' : 'Add Recurring'}</Button>
            </div>
        </form>
    );
}

const Recurring: React.FC<RecurringProps> = ({ finance }) => {
    const { recurringTransactions, categories, accounts, addRecurringTransaction, editRecurringTransaction, deleteRecurringTransaction, getCategoryById, getAccountById } = finance;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);

    const handleOpenModal = (transaction: RecurringTransaction | null = null) => {
        if (accounts.length === 0 && !transaction) {
            alert("Please add an account first before adding a recurring transaction.");
            return;
        }
        setEditingRecurring(transaction);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRecurring(null);
    };

    const handleSave = (data: Omit<RecurringTransaction, 'id' | 'lastProcessedDate'> | RecurringTransaction) => {
        if ('id' in data) {
            editRecurringTransaction(data as RecurringTransaction);
        } else {
            addRecurringTransaction(data);
        }
    };
    
    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this recurring transaction? This will not delete past transactions generated by it.')) {
            deleteRecurringTransaction(id);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-white">Recurring Transactions</h1>
                <Button onClick={() => handleOpenModal()} disabled={accounts.length === 0}>Add Recurring</Button>
            </div>
    
            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Account</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Frequency</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Start Date</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {recurringTransactions.length > 0 ? recurringTransactions.map(r => (
                                <tr key={r.id} className="hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{r.description}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${r.type === TransactionType.Income ? 'text-green-400' : 'text-red-400'}`}>
                                        ${r.amount.toFixed(2)}
                                    </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{getAccountById(r.accountId)?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-700 text-gray-300">
                                            {getCategoryById(r.categoryId)?.name || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{r.frequency}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(r.startDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end items-center gap-4">
                                            <button onClick={() => handleOpenModal(r)} className="text-blue-400 hover:text-blue-300 transition-colors"><EditIcon /></button>
                                            <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-300 transition-colors"><DeleteIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-gray-500">
                                        No recurring transactions set up yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
    
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingRecurring ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}>
                <RecurringTransactionForm onSave={handleSave} onClose={handleCloseModal} initialData={editingRecurring} categories={categories} accounts={accounts} />
            </Modal>
        </div>
    );
};

export default Recurring;