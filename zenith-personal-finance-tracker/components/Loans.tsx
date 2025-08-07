
import React, { useState, useEffect } from 'react';
import type { UseFinanceReturn } from '../hooks/useFinance';
import { Loan, LoanType, Account } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import ProgressBar from './ui/ProgressBar';

// --- ICONS ---
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

interface LoansProps {
  finance: UseFinanceReturn;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const LoanForm: React.FC<{
    onSave: (loan: Omit<Loan, 'id' | 'currentBalance'>) => void;
    onEdit: (loan: Loan) => void;
    onClose: () => void;
    initialData?: Loan | null;
    accounts: Account[];
}> = ({ onSave, onEdit, onClose, initialData, accounts }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<LoanType>(LoanType.Personal);
    const [originalPrincipal, setOriginalPrincipal] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [termInMonths, setTermInMonths] = useState('');
    const [monthlyPayment, setMonthlyPayment] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [linkedAccountId, setLinkedAccountId] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setType(initialData.type);
            setOriginalPrincipal(String(initialData.originalPrincipal));
            setInterestRate(String(initialData.interestRate));
            setTermInMonths(String(initialData.termInMonths));
            setMonthlyPayment(String(initialData.monthlyPayment));
            setStartDate(initialData.startDate);
            setLinkedAccountId(initialData.linkedAccountId || null);
        } else {
             setName('');
             setType(LoanType.Personal);
             setOriginalPrincipal('');
             setInterestRate('');
             setTermInMonths('');
             setMonthlyPayment('');
             setStartDate(new Date().toISOString().split('T')[0]);
             setLinkedAccountId(null);
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !originalPrincipal || !interestRate || !termInMonths || !monthlyPayment || !startDate) return;

        const loanData = {
            name,
            type,
            originalPrincipal: parseFloat(originalPrincipal),
            interestRate: parseFloat(interestRate),
            termInMonths: parseInt(termInMonths, 10),
            monthlyPayment: parseFloat(monthlyPayment),
            startDate,
            linkedAccountId: linkedAccountId || undefined,
        };
        
        if (initialData) {
            onEdit({ ...initialData, ...loanData });
        } else {
            onSave(loanData);
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300">Loan Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g., Honda Civic Loan" className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Loan Type</label>
                    <select value={type} onChange={e => setType(e.target.value as LoanType)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        {Object.values(LoanType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300">Original Principal ($)</label>
                    <input type="number" value={originalPrincipal} onChange={e => setOriginalPrincipal(e.target.value)} required min="0" step="0.01" className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" disabled={!!initialData} />
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Interest Rate (APR %)</label>
                    <input type="number" value={interestRate} onChange={e => setInterestRate(e.target.value)} required min="0" step="0.01" className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Loan Term (in months)</label>
                    <input type="number" value={termInMonths} onChange={e => setTermInMonths(e.target.value)} required min="1" className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Monthly Payment ($)</label>
                    <input type="number" value={monthlyPayment} onChange={e => setMonthlyPayment(e.target.value)} required min="0" step="0.01" className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Start Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Default Payment Account (Optional)</label>
                <select value={linkedAccountId || ''} onChange={e => setLinkedAccountId(e.target.value || null)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="">None</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
            </div>
            <div className="flex justify-end pt-4">
                <Button type="submit">{initialData ? 'Save Changes' : 'Add Loan'}</Button>
            </div>
        </form>
    );
};

const MakePaymentForm: React.FC<{
    loan: Loan;
    accounts: Account[];
    onConfirm: (loanId: string, paymentAmount: number, fromAccountId: string) => void;
    onClose: () => void;
}> = ({ loan, accounts, onConfirm, onClose }) => {
    const [paymentAmount, setPaymentAmount] = useState(String(loan.monthlyPayment));
    const [fromAccountId, setFromAccountId] = useState(loan.linkedAccountId || accounts[0]?.id || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(paymentAmount);
        if (!fromAccountId || !amount || amount <= 0) return;
        onConfirm(loan.id, amount, fromAccountId);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-gray-300 text-center">Current balance for <strong className="text-white">{loan.name}</strong> is <strong className="text-white">{formatCurrency(loan.currentBalance)}</strong>.</p>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Payment Amount ($)</label>
                    <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required min="0.01" step="0.01" className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white" />
                </div>
                <div>
                     <label className="block text-sm font-medium text-gray-300">From Account</label>
                    <select value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} required className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white">
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>)}
                    </select>
                </div>
            </div>
            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={!fromAccountId}>Confirm Payment</Button>
            </div>
        </form>
    );
};

const Loans: React.FC<LoansProps> = ({ finance }) => {
    const { loans, accounts, addLoan, editLoan, deleteLoan, makeLoanPayment, summary } = finance;
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

    const handleOpenFormModal = (loan: Loan | null = null) => {
        setSelectedLoan(loan);
        setFormModalOpen(true);
    };

    const handleOpenPaymentModal = (loan: Loan) => {
        if (accounts.length === 0) {
            alert("Please add a payment account first!");
            return;
        }
        setSelectedLoan(loan);
        setPaymentModalOpen(true);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Loan & Mortgage Tracker</h1>
                    <p className="text-gray-400 mt-1">Total Loan Debt: <span className="font-bold text-red-400">{formatCurrency(summary.loanDebt)}</span></p>
                </div>
                <Button onClick={() => handleOpenFormModal()}>Add Loan</Button>
            </div>

            {loans.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {loans.map(loan => {
                        const paidOff = loan.originalPrincipal - loan.currentBalance;
                        const monthlyRate = (loan.interestRate / 100) / 12;
                        const interestComponent = loan.currentBalance * monthlyRate;
                        const principalComponent = loan.monthlyPayment - interestComponent;

                        return (
                            <Card key={loan.id}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-semibold text-white">{loan.name}</h3>
                                        <p className="text-sm text-gray-400">{loan.type}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleOpenFormModal(loan)} className="text-gray-400 hover:text-blue-400 p-1"><EditIcon /></button>
                                        <button onClick={() => deleteLoan(loan.id)} className="text-gray-400 hover:text-red-400 p-1"><DeleteIcon /></button>
                                    </div>
                                </div>
                                
                                <div className="my-4">
                                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                                        <span>Paid: {formatCurrency(paidOff)}</span>
                                        <span>Remaining: {formatCurrency(loan.currentBalance)}</span>
                                    </div>
                                    <ProgressBar value={paidOff} max={loan.originalPrincipal} />
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-center border-t border-b border-gray-700 py-3 my-4">
                                    <div>
                                        <p className="text-xs text-gray-400">Balance</p>
                                        <p className="font-semibold text-white">{formatCurrency(loan.currentBalance)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Interest Rate</p>
                                        <p className="font-semibold text-white">{loan.interestRate}%</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Monthly Payment</p>
                                        <p className="font-semibold text-white">{formatCurrency(loan.monthlyPayment)}</p>
                                    </div>
                                </div>

                                <div className="text-center text-sm text-gray-400 mb-4">
                                    Next payment: ~{formatCurrency(principalComponent)} to principal, ~{formatCurrency(interestComponent)} to interest.
                                </div>

                                <Button onClick={() => handleOpenPaymentModal(loan)} className="w-full">Make a Payment</Button>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                 <Card className="text-center py-16 bg-gray-800/50 border border-dashed border-gray-700">
                    <div className="text-4xl mb-4">🏠</div>
                    <h3 className="text-xl font-semibold text-white">Track Your Loans</h3>
                    <p className="text-gray-400 mt-2 mb-4">Add your mortgages, car loans, or student loans to get a complete financial picture.</p>
                    <Button onClick={() => handleOpenFormModal()}>Add Your First Loan</Button>
                </Card>
            )}

            <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} title={selectedLoan ? "Edit Loan" : "Add New Loan"}>
                <LoanForm
                    onSave={addLoan}
                    onEdit={editLoan}
                    onClose={() => setFormModalOpen(false)}
                    initialData={selectedLoan}
                    accounts={accounts}
                />
            </Modal>

            {selectedLoan && (
                 <Modal isOpen={isPaymentModalOpen} onClose={() => setPaymentModalOpen(false)} title={`Make Payment for ${selectedLoan.name}`}>
                    <MakePaymentForm
                        loan={selectedLoan}
                        accounts={accounts}
                        onConfirm={makeLoanPayment}
                        onClose={() => setPaymentModalOpen(false)}
                    />
                </Modal>
            )}

        </div>
    );
};

export default Loans;
