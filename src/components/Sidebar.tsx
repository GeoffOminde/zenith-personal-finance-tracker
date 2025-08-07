
import React from 'react';
import type { View } from '../types';
import type { UseAuthReturn } from '../hooks/useAuth';

const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  auth: UseAuthReturn;
  openPremiumModal: () => void;
  openExportModal: () => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}> = ({ icon, label, isActive = false, onClick, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-blue-600 text-white'
        : disabled 
        ? 'text-gray-500 cursor-not-allowed'
        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
    }`}
  >
    {icon}
    <span className="ml-3">{label}</span>
    {disabled && <LockIcon className="ml-auto h-4 w-4 text-gray-500" />}
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, auth, openPremiumModal, openExportModal }) => {
  const { user } = auth;
  const navItems: { id: View; label: string; icon: JSX.Element, premium?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'transactions', label: 'Transactions', icon: <TransactionsIcon /> },
    { id: 'accounts', label: 'Accounts', icon: <AccountsIcon /> },
    { id: 'investments', label: 'Investments', icon: <InvestmentsIcon /> },
    { id: 'recurring', label: 'Recurring', icon: <RecurringIcon /> },
    { id: 'bills', label: 'Bills', icon: <BillsIcon /> },
    { id: 'loans', label: 'Loans', icon: <LoansIcon /> },
    { id: 'categories', label: 'Categories', icon: <CategoryIcon /> },
    { id: 'budgets', label: 'Budgets', icon: <BudgetsIcon /> },
    { id: 'goals', label: 'Goals', icon: <GoalsIcon /> },
    { id: 'trends', label: 'Trends', icon: <TrendsIcon /> },
    { id: 'forecasting', label: 'Forecasting', icon: <ForecastingIcon /> },
    { id: 'health', label: 'Health Check', icon: <HealthIcon /> },
    { id: 'debt', label: 'Debt Planner', icon: <DebtPlannerIcon />, premium: true },
    { id: 'insights', label: 'AI Insights', icon: <InsightsIcon />, premium: true },
  ];
  
  const handleConnectClick = () => {
      if (user?.plan === 'premium') {
          setActiveView('banksync');
      } else {
          openPremiumModal();
      }
  }

  const handleExportClick = () => {
      if (user?.plan === 'premium') {
          openExportModal();
      } else {
          openPremiumModal();
      }
  }

  const handleNavItemClick = (item: typeof navItems[0]) => {
    if (item.premium && user?.plan === 'free') {
      openPremiumModal();
    } else {
      setActiveView(item.id);
    }
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-800 p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center mb-10 px-2">
           <svg className="w-8 h-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
           </svg>
           <h1 className="text-2xl font-bold ml-2 text-white">Zenith</h1>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              isActive={activeView === item.id}
              onClick={() => handleNavItemClick(item)}
              disabled={item.premium && user?.plan === 'free'}
            />
          ))}
        </nav>
         <div className="mt-6 border-t border-gray-700 pt-6 space-y-2">
            <NavItem label="Settings" icon={<SettingsIcon />} isActive={activeView === 'settings'} onClick={() => setActiveView('settings')} />
            <NavItem label="Connect Accounts" icon={<LinkIcon />} isActive={activeView === 'banksync'} onClick={handleConnectClick} />
            <NavItem label="Export Data" icon={<ExportIcon />} onClick={handleExportClick} />
        </div>
      </div>
       
      <div>
         {user?.plan === 'free' ? (
            <div className="p-4 mb-2 bg-blue-900/50 rounded-lg text-center">
                  <h3 className="font-semibold text-white">Unlock More Features</h3>
                  <p className="text-xs text-blue-200 mt-1 mb-3">Go premium for AI insights, bank sync, and more.</p>
                  <button onClick={openPremiumModal} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">
                    Upgrade to Premium
                  </button>
            </div>
         ) : (
            <div className="p-3 mb-2 bg-yellow-400/10 border border-yellow-400/20 rounded-lg text-center flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M10 2a8 8 0 100 16A8 8 0 0010 2zM3 10a7 7 0 1114 0A7 7 0 013 10z" clipRule="evenodd" />
                </svg>
                <h3 className="font-semibold text-yellow-300 text-sm">Premium Member</h3>
            </div>
         )}
       </div>
    </aside>
  );
};

// SVG Icons
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const TransactionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
const AccountsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const InvestmentsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const RecurringIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>;
const BillsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /></svg>;
const LoansIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CategoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>;
const BudgetsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const GoalsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M4 17v4m-2-2h4m11-4v4m2-2h-4M12 3c-3.314 0-6 2.686-6 6v2c0 1.105.895 2 2 2h8c1.105 0 2-.895 2-2v-2c0-3.314-2.686-6-6-6zm0 14c-3.314 0-6-2.686-6-6h12c0 3.314-2.686 6-6 6z" /></svg>;
const TrendsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const ForecastingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const HealthIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.5 12.5L14 14l-2.5-2.5L9 14l-1.5-1.5" /></svg>;
const DebtPlannerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const InsightsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.536a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
const ExportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const LockIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>;

export default Sidebar;
