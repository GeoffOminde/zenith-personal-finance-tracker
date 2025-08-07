
import React, { useState, useMemo, useEffect } from 'react';
import type { UseFinanceReturn } from '../hooks/useFinance';
import { Bill, Category, Account } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;

interface BillsProps {
    finance: UseFinanceReturn;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const BillForm: React.FC<{
    onSave: (bill: Omit<Bill, 'id'>) => void;
    onEdit: (bill: Bill) => void;
    onClose: () => void;
    initialData?: Bill | null;
    categories: Category[];
    accounts: Account[];
}> = ({ onSave, onEdit, onClose, initialData, categories, accounts }) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState<string>('');
    const [dueDay, setDueDay] = useState('1');
    const [accountId, setAccountId] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setAmount(String(initialData.amount));
            setCategoryId(initialData.categoryId);
            setDueDay(String(initialData.dueDay));
            setAccountId(initialData.accountId);
        } else {
            setName('');
            setAmount('');
            setCategoryId(categories.find(c => c.name === "Bills")?.id || categories[0]?.id || '');
            setDueDay('1');
            setAccountId(null);
        }
    }, [initialData, categories]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !amount || !categoryId || !dueDay) return;

        const billData = {
            name,
            amount: parseFloat(amount),
            categoryId,
            dueDay: parseInt(dueDay, 10),
            accountId,
        };
        
        if (initialData) {
            onEdit({ ...initialData, ...billData });
        } else {
            onSave(billData);
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Bill Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g., Netflix" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300">Amount ($)</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="0.01" step="0.01" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Category</label>
                    <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                       {categories.filter(c => c.name !== 'Transfer').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300">Due Day of Month</label>
                    <input type="number" value={dueDay} onChange={e => setDueDay(e.target.value)} required min="1" max="31" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300">Default Payment Account (Optional)</label>
                <select value={accountId || ''} onChange={e => setAccountId(e.target.value || null)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="">None</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
            </div>
            <div className="flex justify-end pt-4">
                <Button type="submit">{initialData ? 'Save Changes' : 'Add Bill'}</Button>
            </div>
        </form>
    );
};

const MarkAsPaidForm: React.FC<{
    bill: Bill;
    accounts: Account[];
    onConfirm: (billId: string, fromAccountId: string) => void;
    onClose: () => void;
}> = ({ bill, accounts, onConfirm, onClose }) => {
    const [fromAccountId, setFromAccountId] = useState(bill.accountId || accounts[0]?.id || '');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!fromAccountId) return;
        onConfirm(bill.id, fromAccountId);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p>You are marking <strong className="text-white">{bill.name}</strong> as paid for <strong className="text-white">{formatCurrency(bill.amount)}</strong>.</p>
            <div>
                <label className="block text-sm font-medium text-gray-300">Pay from which account?</label>
                <select value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>)}
                </select>
            </div>
            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={!fromAccountId}>Confirm Payment</Button>
            </div>
        </form>
    );
};

const Bills: React.FC<BillsProps> = ({ finance }) => {
    const { bills, categories, accounts, addBill, editBill, deleteBill, markBillAsPaid } = finance;
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isPaidModalOpen, setPaidModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

    const handleOpenFormModal = (bill: Bill | null = null) => {
        setSelectedBill(bill);
        setFormModalOpen(true);
    };

    const handleOpenPaidModal = (bill: Bill) => {
        if(accounts.length === 0) {
            alert("Please add a payment account first!");
            return;
        }
        setSelectedBill(bill);
        setPaidModalOpen(true);
    };

    const billStatus = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const upcoming: Bill[] = [];
        const paid: Bill[] = [];
        
        bills.forEach(bill => {
            const lastPaid = bill.lastPaidDate ? new Date(bill.lastPaidDate) : null;
            if (lastPaid && lastPaid.getMonth() === currentMonth && lastPaid.getFullYear() === currentYear) {
                paid.push(bill);
            } else {
                upcoming.push(bill);
            }
        });
        return { upcoming, paid };
    }, [bills]);

    const getDueDateForBill = (bill: Bill) => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const dueDay = Math.min(bill.dueDay, daysInMonth);
        return new Date(currentYear, currentMonth, dueDay);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-white">Bill Management</h1>
                <Button onClick={() => handleOpenFormModal()}>Add Bill</Button>
            </div>

            <Card>
                <h2 className="text-xl font-semibold text-white mb-4">Upcoming & Overdue</h2>
                <div className="space-y-3">
                    {billStatus.upcoming.length > 0 ? (
                        billStatus.upcoming.map(bill => {
                            const dueDate = getDueDateForBill(bill);
                            const isOverdue = dueDate < new Date();
                            return (
                                <div key={bill.id} className={`p-4 rounded-lg flex items-center justify-between gap-4 ${isOverdue ? 'bg-red-900/40' : 'bg-gray-700/50'}`}>
                                    <div>
                                        <p className="font-semibold text-white">{bill.name}</p>
                                        <p className={`text-sm ${isOverdue ? 'text-red-300' : 'text-gray-400'}`}>
                                            Due on {dueDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="text-lg font-bold text-white">{formatCurrency(bill.amount)}</p>
                                        <Button onClick={() => handleOpenPaidModal(bill)}>Mark as Paid</Button>
                                        <button onClick={() => handleOpenFormModal(bill)} className="text-gray-400 hover:text-blue-400 p-1"><EditIcon /></button>
                                        <button onClick={() => deleteBill(bill.id)} className="text-gray-400 hover:text-red-400 p-1"><DeleteIcon /></button>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <p className="text-center text-gray-500 py-4">You've paid all your bills for this month. Great job!</p>
                    )}
                </div>
            </Card>
            
            <Card>
                <h2 className="text-xl font-semibold text-white mb-4">Paid This Month</h2>
                 <div className="space-y-3">
                    {billStatus.paid.length > 0 ? (
                        billStatus.paid.map(bill => (
                            <div key={bill.id} className="p-4 rounded-lg bg-gray-700/50 flex items-center justify-between gap-4 opacity-60">
                                <div className="flex items-center gap-3">
                                    <CheckCircleIcon />
                                    <div>
                                        <p className="font-semibold text-white">{bill.name}</p>
                                        <p className="text-sm text-gray-400">Paid on {new Date(bill.lastPaidDate!).toLocaleDateString(undefined, { timeZone: 'UTC' })}</p>
                                    </div>
                                </div>
                                <p className="text-lg font-bold text-white">{formatCurrency(bill.amount)}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-4">No bills paid yet this month.</p>
                    )}
                </div>
            </Card>

            <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} title={selectedBill ? "Edit Bill" : "Add New Bill"}>
                <BillForm 
                    onSave={addBill}
                    onEdit={editBill}
                    onClose={() => setFormModalOpen(false)}
                    initialData={selectedBill}
                    categories={categories}
                    accounts={accounts}
                />
            </Modal>
            
            {selectedBill && (
                <Modal isOpen={isPaidModalOpen} onClose={() => setPaidModalOpen(false)} title={`Pay Bill: ${selectedBill.name}`}>
                    <MarkAsPaidForm
                        bill={selectedBill}
                        accounts={accounts}
                        onConfirm={markBillAsPaid}
                        onClose={() => setPaidModalOpen(false)}
                    />
                </Modal>
            )}

        </div>
    )
};

export default Bills;
