
import React, { useState, useEffect } from 'react';
import { useAuth, UseAuthReturn } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Budgets from './components/Budgets';
import FinancialInsights from './components/FinancialInsights';
import Recurring from './components/Recurring';
import Goals from './components/Goals';
import Trends from './components/Trends';
import Settings from './components/Settings';
import Categories from './components/Categories';
import BankSync from './components/BankSync';
import PremiumModal from './components/PremiumModal';
import ExportDataModal from './components/ExportDataModal';
import Header from './components/Header';
import Forecasting from './components/Forecasting';
import Accounts from './components/Accounts';
import DebtPlanner from './components/DebtPlanner';
import Investments from './components/Investments';
import Bills from './components/Bills';
import Loans from './components/Loans';
import FinancialHealth from './components/FinancialHealth';
import { useFinance } from './hooks/useFinance';
import { useNotifications } from './hooks/useNotifications';
import { View, VIEW_TITLES } from './types';


const MainApp: React.FC<{ auth: UseAuthReturn }> = ({ auth }) => {
    const [activeView, setActiveView] = useState<View>('dashboard');
    const finance = useFinance(auth.user!.id, auth.user!.plan);
    const notifications = useNotifications(finance);
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem('zenith_apiKey'));

    useEffect(() => {
        if (apiKey) {
            localStorage.setItem('zenith_apiKey', apiKey);
        } else {
            localStorage.removeItem('zenith_apiKey');
        }
    }, [apiKey]);


    const handleUpgrade = () => {
        auth.updateUser({ ...auth.user!, plan: 'premium' });
        setIsPremiumModalOpen(false);
    }

    const renderView = () => {
        const { user } = auth;
        if (!user) return null;

        switch (activeView) {
          case 'dashboard':
            return <Dashboard finance={finance} user={user} apiKey={apiKey} setActiveView={setActiveView} openPremiumModal={() => setIsPremiumModalOpen(true)} />;
          case 'transactions':
            return <Transactions finance={finance} apiKey={apiKey} />;
          case 'accounts':
            return <Accounts finance={finance} />;
          case 'investments':
            return <Investments finance={finance} />;
          case 'recurring':
            return <Recurring finance={finance} />;
          case 'bills':
            return <Bills finance={finance} />;
          case 'loans':
            return <Loans finance={finance} />;
          case 'budgets':
            return <Budgets finance={finance} user={user} apiKey={apiKey} openPremiumModal={() => setIsPremiumModalOpen(true)} />;
          case 'goals':
            return <Goals finance={finance} />;
          case 'trends':
            return <Trends finance={finance} />;
          case 'forecasting':
            return <Forecasting finance={finance} apiKey={apiKey} />;
          case 'debt':
            return <DebtPlanner finance={finance} user={user} openPremiumModal={() => setIsPremiumModalOpen(true)} />;
          case 'insights':
            return <FinancialInsights finance={finance} apiKey={apiKey} />;
          case 'health':
            return <FinancialHealth finance={finance} apiKey={apiKey} />;
          case 'settings':
            return <Settings apiKey={apiKey} setApiKey={setApiKey} resetData={finance.resetData} />;
          case 'categories':
            return <Categories finance={finance} />;
          case 'banksync':
            return <BankSync finance={finance} setActiveView={setActiveView} />;
          default:
            return <Dashboard finance={finance} user={user} apiKey={apiKey} setActiveView={setActiveView} openPremiumModal={() => setIsPremiumModalOpen(true)} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100">
          <PremiumModal isOpen={isPremiumModalOpen} onClose={() => setIsPremiumModalOpen(false)} onUpgrade={handleUpgrade} />
          <ExportDataModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} finance={finance} />
          <Sidebar 
            activeView={activeView} 
            setActiveView={setActiveView} 
            auth={auth}
            openPremiumModal={() => setIsPremiumModalOpen(true)}
            openExportModal={() => setIsExportModalOpen(true)}
          />
          <main className="flex-1 flex flex-col p-6 sm:p-8 lg:p-10 overflow-y-hidden">
            <Header title={VIEW_TITLES[activeView]} notificationsHook={notifications} />
            <div className="flex-grow overflow-y-auto mt-6 -mr-4 pr-4">
                {renderView()}
            </div>
          </main>
        </div>
    );
};


const App: React.FC = () => {
  const auth = useAuth();
  return <MainApp auth={auth} />;
};

export default App;
