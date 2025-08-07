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


const App: React.FC = () => {
  const auth = useAuth();

  if (auth.loading) {
      return (
          <div className="flex h-screen bg-gray-900 justify-center items-center text-white">
              <h1 className="text-3xl font-bold animate-pulse">Loading Zenith...</h1>
          </div>
      );
  }

  // With the new useAuth, user should always exist. This is for type safety.
  if (!auth.user) {
    return <div>Loading user profile...</div>;
  }

  return <MainApp auth={auth} />;
};

const MainApp: React.FC<{ auth: UseAuthReturn }> = ({ auth }) => {
    const [activeView, setActiveView] = useState<View>('dashboard');
    const finance = useFinance(auth.user!.id, auth.user!.plan);
    const notifications = useNotifications(finance);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem('zenith_apiKey'));

    useEffect(() => {
        if (apiKey) {
            localStorage.setItem('zenith_apiKey', apiKey);
        } else {
            localStorage.removeItem('zenith_apiKey');
        }
    }, [apiKey]);

    const renderView = () => {
        switch (activeView) {
          case 'dashboard':
            return <Dashboard finance={finance} apiKey={apiKey} setActiveView={setActiveView} />;
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
            return <Budgets finance={finance} apiKey={apiKey} />;
          case 'goals':
            return <Goals finance={finance} />;
          case 'trends':
            return <Trends finance={finance} />;
          case 'forecasting':
            return <Forecasting finance={finance} apiKey={apiKey} />;
          case 'debt':
            return <DebtPlanner finance={finance} />;
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
            return <Dashboard finance={finance} apiKey={apiKey} setActiveView={setActiveView} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100">
          <ExportDataModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} finance={finance} />
          <Sidebar 
            activeView={activeView} 
            setActiveView={setActiveView} 
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

export default App;
