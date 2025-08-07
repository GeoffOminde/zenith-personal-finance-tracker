
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import type { UseFinanceReturn } from '../hooks/useFinance';
import { InvestmentHolding, Account, AccountType } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';

// --- ICONS ---
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const InvestmentForm: React.FC<{
    onSave: (holding: Omit<InvestmentHolding, 'id'> | InvestmentHolding) => void;
    onClose: () => void;
    initialData?: InvestmentHolding | null;
    investmentAccounts: Account[];
}> = ({ onSave, onClose, initialData, investmentAccounts }) => {
    const [accountId, setAccountId] = useState(initialData?.accountId || investmentAccounts[0]?.id || '');
    const [name, setName] = useState(initialData?.name || '');
    const [ticker, setTicker] = useState(initialData?.ticker || '');
    const [type, setType] = useState<'Stock' | 'ETF' | 'Crypto' | 'Mutual Fund'>(initialData?.type || 'Stock');
    const [quantity, setQuantity] = useState(initialData?.quantity ? String(initialData.quantity) : '');
    const [avgCost, setAvgCost] = useState(initialData?.avgCost ? String(initialData.avgCost) : '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!accountId || !name.trim() || !ticker.trim() || !quantity || !avgCost) return;

        const holdingData = {
            accountId,
            name,
            ticker: ticker.toUpperCase(),
            type,
            quantity: parseFloat(quantity),
            avgCost: parseFloat(avgCost)
        };

        if (initialData) {
            onSave({ ...initialData, ...holdingData });
        } else {
            onSave(holdingData);
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300">Investment Account</label>
                <select value={accountId} onChange={e => setAccountId(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    {investmentAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-300">Asset Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Apple Inc." className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Ticker Symbol</label>
                    <input type="text" value={ticker} onChange={e => setTicker(e.target.value)} required placeholder="e.g. AAPL" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Quantity</label>
                    <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} required min="0" step="any" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Average Cost</label>
                    <input type="number" value={avgCost} onChange={e => setAvgCost(e.target.value)} required min="0" step="any" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300">Type</label>
                    <select value={type} onChange={e => setType(e.target.value as any)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        <option>Stock</option>
                        <option>ETF</option>
                        <option>Crypto</option>
                        <option>Mutual Fund</option>
                    </select>
                </div>
            </div>
            <div className="flex justify-end pt-4">
                <Button type="submit">{initialData ? 'Save Changes' : 'Add Holding'}</Button>
            </div>
        </form>
    );
};

interface InvestmentsProps {
    finance: UseFinanceReturn;
}

const Investments: React.FC<InvestmentsProps> = ({ finance }) => {
    const { accounts, addInvestment, editInvestment, deleteInvestment, portfolioData } = finance;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHolding, setEditingHolding] = useState<InvestmentHolding | null>(null);

    const investmentAccounts = useMemo(() => accounts.filter(a => a.type === AccountType.Investment), [accounts]);

    const handleOpenModal = (holding: InvestmentHolding | null = null) => {
        if (investmentAccounts.length === 0) {
            alert("Please create an 'Investment' type account first before adding holdings.");
            return;
        }
        setEditingHolding(holding);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingHolding(null);
    };

    const handleSaveHolding = (holdingData: Omit<InvestmentHolding, 'id'> | InvestmentHolding) => {
        if ('id' in holdingData) {
            editInvestment(holdingData as InvestmentHolding);
        } else {
            addInvestment(holdingData);
        }
    };

    const handleDeleteHolding = (id: string) => {
        if (window.confirm('Are you sure you want to delete this holding?')) {
            deleteInvestment(id);
        }
    };

    const allocationData = useMemo(() => {
        const dataMap: Record<string, number> = {};
        portfolioData.holdings.forEach(h => {
            dataMap[h.type] = (dataMap[h.type] || 0) + h.currentValue;
        });
        return Object.entries(dataMap).map(([name, value]) => ({ name, value }));
    }, [portfolioData.holdings]);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-white">Investments</h1>
                <Button onClick={() => handleOpenModal()} disabled={investmentAccounts.length === 0}>Add Holding</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
                <Card>
                    <p className="text-sm text-gray-400">Total Portfolio Value</p>
                    <p className="text-3xl font-bold text-white">{formatCurrency(portfolioData.totalValue)}</p>
                </Card>
                <Card>
                    <p className="text-sm text-gray-400">Total Gain / Loss</p>
                    <p className={`text-3xl font-bold ${portfolioData.totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {portfolioData.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(portfolioData.totalGainLoss)}
                    </p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <h2 className="text-xl font-semibold text-white mb-4">Your Holdings</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Holding</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Market Value</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Gain/Loss</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {portfolioData.holdings.map(h => (
                                        <tr key={h.id}>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="font-medium text-white">{h.name}</div>
                                                <div className="text-sm text-gray-400">{h.quantity} @ {formatCurrency(h.avgCost)}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="font-medium text-white">{formatCurrency(h.currentValue)}</div>
                                                <div className="text-sm text-gray-400">{formatCurrency(h.currentPrice)}</div>
                                            </td>
                                            <td className={`px-4 py-3 text-right font-medium ${h.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {formatCurrency(h.gainLoss)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                 <div className="flex justify-end items-center gap-2">
                                                    <button onClick={() => handleOpenModal(h)} className="p-2 text-gray-400 hover:text-blue-400 transition-colors rounded-full hover:bg-gray-600"><EditIcon /></button>
                                                    <button onClick={() => handleDeleteHolding(h.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-full hover:bg-gray-600"><DeleteIcon /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                             {portfolioData.holdings.length === 0 && (
                                <div className="text-center py-10 text-gray-500">
                                  {investmentAccounts.length > 0 ? "You have no holdings yet. Click 'Add Holding' to start." : "Create an 'Investment' account to begin."}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
                <div>
                    <Card>
                        <h2 className="text-xl font-semibold text-white mb-4">Allocation</h2>
                        {allocationData.length > 0 ? (
                            <div style={{ width: '100%', height: 250 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={allocationData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} fill="#8884d8" paddingAngle={5}>
                                            {allocationData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                        <Legend iconSize={10} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                             <div className="flex items-center justify-center h-[250px] text-gray-500 text-center">No holdings to analyze.</div>
                        )}
                    </Card>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingHolding ? 'Edit Holding' : 'Add New Holding'}>
                <InvestmentForm
                    onSave={handleSaveHolding}
                    onClose={handleCloseModal}
                    initialData={editingHolding}
                    investmentAccounts={investmentAccounts}
                />
            </Modal>
        </div>
    );
};

export default Investments;
