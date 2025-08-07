import React, { useState } from 'react';
import type { UseFinanceReturn } from '../hooks/useFinance';
import type { View } from '../types';
import { TransactionType } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';

// --- ICONS ---
const BankBuildingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const PlatformIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const Spinner = () => <svg className="animate-spin h-16 w-16 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

type Provider = { name: string; type: 'Bank' | 'Platform' };

// --- MOCK DATA ---
const MOCK_PROVIDERS: Provider[] = [
  { name: 'Zenith Bank', type: 'Bank' },
  { name: 'PayPal', type: 'Platform' },
  { name: 'Capital Trust', type: 'Bank' },
  { name: 'Venmo', type: 'Platform' },
  { name: 'Chase Secure', type: 'Bank' },
  { name: 'Wise', type: 'Platform' },
  { name: 'Bank of Metropolis', type: 'Bank' },
  { name: 'Apex Credit Union', type: 'Bank' },
];

const MOCK_BANK_TRANSACTIONS = [
  { description: 'Paycheck Deposit', amount: 2200, type: TransactionType.Income, categoryId: null, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }, // Yesterday
  { description: 'Netflix Subscription', amount: 15.99, type: TransactionType.Expense, categoryId: 'cat-4', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }, // 3 days ago
  { description: 'Starbucks Coffee', amount: 5.75, type: TransactionType.Expense, categoryId: 'cat-1', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }, // 2 days ago
];

const MOCK_PLATFORM_TRANSACTIONS = [
  { description: 'Payment from ClientWork LLC', amount: 850, type: TransactionType.Income, categoryId: null, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }, // 2 days ago
  { description: 'Online Purchase - Etsy', amount: 42.50, type: TransactionType.Expense, categoryId: 'cat-5', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }, // 4 days ago
  { description: 'Split bill with Sarah', amount: 22.00, type: TransactionType.Expense, categoryId: 'cat-1', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }, // yesterday
  { description: 'Transfer to Savings', amount: 200.00, type: TransactionType.Expense, categoryId: 'cat-7', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }, // 5 days ago
];


interface BankSyncProps {
  finance: UseFinanceReturn;
  setActiveView: (view: View) => void;
}

type SyncStep = 'select' | 'connecting' | 'success';

const BankSync: React.FC<BankSyncProps> = ({ finance, setActiveView }) => {
  const [step, setStep] = useState<SyncStep>('select');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [importedCount, setImportedCount] = useState(0);

  const handleSelectProvider = (provider: Provider) => {
    const firstAccount = finance.accounts[0];
    if (!firstAccount) {
      alert("Please create an account from the 'Accounts' page before syncing.");
      return;
    }

    setSelectedProvider(provider);
    setStep('connecting');

    const baseTransactions = provider.type === 'Bank' 
        ? MOCK_BANK_TRANSACTIONS 
        : MOCK_PLATFORM_TRANSACTIONS;
    
    const transactionsToImport = baseTransactions.map(t => ({
        ...t,
        accountId: firstAccount.id,
    }));
    
    setImportedCount(transactionsToImport.length);

    // Simulate API call and transaction import
    setTimeout(() => {
      finance.addMultipleTransactions(transactionsToImport);
      setStep('success');
    }, 2500); // 2.5 second delay
  };

  const renderContent = () => {
    switch (step) {
      case 'select':
        return (
          <>
            <p className="text-center text-gray-400 max-w-2xl mx-auto mb-10">
              Connect your accounts to automatically import transactions. Zenith uses a secure, read-only connection to keep your financial data safe.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {MOCK_PROVIDERS.map((provider) => (
                <Card 
                  key={provider.name} 
                  className="text-center hover:bg-gray-700 hover:border-blue-500 border-2 border-transparent transition-all duration-200 cursor-pointer"
                  onClick={() => handleSelectProvider(provider)}
                >
                  <div className="flex flex-col items-center justify-center h-full p-4">
                    {provider.type === 'Bank' ? <BankBuildingIcon /> : <PlatformIcon />}
                    <h3 className="mt-4 font-semibold text-white">{provider.name}</h3>
                    <p className="text-xs text-gray-500">{provider.type}</p>
                  </div>
                </Card>
              ))}
            </div>
          </>
        );
      case 'connecting':
        return (
          <Card className="max-w-md mx-auto text-center py-12">
            <Spinner />
            <h2 className="text-2xl font-bold text-white mt-6">Connecting to {selectedProvider?.name}...</h2>
            <p className="text-gray-400 mt-2">This may take a moment. Please don't close this window.</p>
          </Card>
        );
      case 'success':
        return (
          <Card className="max-w-md mx-auto text-center py-12">
            <CheckCircleIcon />
            <h2 className="text-2xl font-bold text-white mt-6">Connection Successful!</h2>
            <p className="text-gray-400 mt-2">
              Successfully connected to {selectedProvider?.name}. We've imported {importedCount} new transactions for you.
            </p>
            <Button 
              size="lg" 
              onClick={() => setActiveView('transactions')}
              className="mt-8"
            >
              View Imported Transactions
            </Button>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white text-center">Connect an Account</h1>
      {renderContent()}
    </div>
  );
};

export default BankSync;