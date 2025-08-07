
import React, { useState, useEffect, useMemo } from 'react';
import type { UseFinanceReturn } from '../hooks/useFinance';
import { Account, AccountType } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

interface AccountsProps {
  finance: UseFinanceReturn;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const AccountForm: React.FC<{
    onSave: (name: string, type: AccountType, initialBalance: number, interestRate?: number) => void;
    onEdit: (account: Account) => void;
    onClose: () => void;
    initialData?: Account | null;
}> = ({ onSave, onEdit, onClose, initialData }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<AccountType>(AccountType.Checking);
    const [initialBalance, setInitialBalance] = useState('0');
    const [interestRate, setInterestRate] = useState('');

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setType(initialData.type);
            setInitialBalance(String(initialData.balance));
            setInterestRate(initialData.interestRate ? String(initialData.interestRate) : '');
        } else {
            setName('');
            setType(AccountType.Checking);
            setInitialBalance('0');
            setInterestRate('');
        }
    }, [initialData]);
    
    useEffect(() => {
        if(type === AccountType.Investment) {
            setInitialBalance('0');
        }
    }, [type])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        
        const rate = parseFloat(interestRate);

        if (initialData) {
            onEdit({ ...initialData, name, type, interestRate: type === AccountType.CreditCard && rate > 0 ? rate : undefined });
        } else {
            onSave(name, type, parseFloat(initialBalance), type === AccountType.CreditCard && rate > 0 ? rate : undefined);
        }
        onClose();
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="account-name" className="block text-sm font-medium text-gray-300">Account Name</label>
                <input id="account-name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g., Main Checking" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label htmlFor="account-type" className="block text-sm font-medium text-gray-300">Account Type</label>
                <select id="account-type" value={type} onChange={e => setType(e.target.value as AccountType)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    {Object.values(AccountType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
             {type === AccountType.CreditCard && (
                <div>
                    <label htmlFor="interest-rate" className="block text-sm font-medium text-gray-300">Annual Interest Rate (APR) %</label>
                    <input id="interest-rate" type="number" value={interestRate} onChange={e => setInterestRate(e.target.value)} placeholder="e.g., 19.99" min="0" step="0.01" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
            )}
             <div>
                <label htmlFor="initial-balance" className="block text-sm font-medium text-gray-300">
                    {initialData ? 'Current Balance' : 'Initial Balance ($)'}
                </label>
                <input id="initial-balance" type="number" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} required step="0.01" disabled={!!initialData || type === AccountType.Investment} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" />
                {initialData && <p className="text-xs text-gray-500 mt-1">Balance can only be changed via transactions.</p>}
                {type === AccountType.Investment && <p className="text-xs text-gray-500 mt-1">Investment account value is calculated from its holdings.</p>}
            </div>
            <div className="flex justify-end pt-4">
                <Button type="submit">{initialData ? 'Save Changes' : 'Create Account'}</Button>
            </div>
        </form>
    );
}

const Accounts: React.FC<AccountsProps> = ({ finance }) => {
    const { accounts, addAccount, editAccount, deleteAccount, portfolioData } = finance;
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

    const accountValues = useMemo(() => {
        const valueMap: Record<string, number> = {};
        const investmentAccountsHoldings: Record<string, number> = portfolioData.holdings.reduce((acc, holding) => {
            acc[holding.accountId] = (acc[holding.accountId] || 0) + holding.currentValue;
            return acc;
        }, {} as Record<string, number>);
        
        accounts.forEach(acc => {
            if (acc.type === AccountType.Investment) {
                valueMap[acc.id] = investmentAccountsHoldings[acc.id] || 0;
            } else {
                valueMap[acc.id] = acc.balance;
            }
        });
        return valueMap;
    }, [accounts, portfolioData]);

    const handleOpenModal = (account: Account | null = null) => {
        setSelectedAccount(account);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedAccount(null);
    }

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this account? This can only be done if it has no associated transactions.")) {
            deleteAccount(id);
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-white">Accounts</h1>
                <Button onClick={() => handleOpenModal()}>Add New Account</Button>
            </div>

            {accounts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accounts.map(account => (
                        <Card key={account.id} className="flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-semibold text-white">{account.name}</h3>
                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">{account.type}</span>
                                </div>
                                <p className={`text-3xl font-bold my-4 ${account.type === AccountType.CreditCard && account.balance > 0 ? 'text-red-400' : 'text-white'}`}>
                                    {formatCurrency(accountValues[account.id] || 0)}
                                </p>
                                {account.type === AccountType.CreditCard && account.interestRate && (
                                     <p className="text-sm text-gray-400 -mt-2 mb-4">
                                        {account.interestRate}% APR
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end items-center gap-2 border-t border-gray-700/50 pt-3 mt-3">
                                <Button size="sm" variant="secondary" onClick={() => handleOpenModal(account)}>
                                    <EditIcon /> <span className="ml-1">Edit</span>
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => handleDelete(account.id)} className="bg-red-900/50 hover:bg-red-800/60 text-red-300">
                                    <DeleteIcon /> <span className="ml-1">Delete</span>
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="text-center py-16 bg-gray-800/50 border border-dashed border-gray-700">
                    <div className="text-4xl mb-4">🏦</div>
                    <h3 className="text-xl font-semibold text-white">Create Your First Account</h3>
                    <p className="text-gray-400 mt-2 mb-4">Track your checking, savings, or credit cards.</p>
                    <Button onClick={() => handleOpenModal()}>Add Account</Button>
                </Card>
            )}

             <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedAccount ? 'Edit Account' : 'Add New Account'}>
                <AccountForm 
                    onSave={addAccount} 
                    onEdit={editAccount} 
                    onClose={handleCloseModal} 
                    initialData={selectedAccount} 
                />
            </Modal>
        </div>
    );
};

export default Accounts;
