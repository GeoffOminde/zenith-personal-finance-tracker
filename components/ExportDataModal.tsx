
import React from 'react';
import type { UseFinanceReturn } from '../hooks/useFinance';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Card from './ui/Card';

interface ExportDataModalProps {
    isOpen: boolean;
    onClose: () => void;
    finance: UseFinanceReturn;
}

const ExportDataModal: React.FC<ExportDataModalProps> = ({ isOpen, onClose, finance }) => {
    const { 
        transactions, 
        categories, 
        budgets, 
        goals, 
        recurringTransactions, 
        getCategoryById 
    } = finance;

    const downloadCSV = (data: any[], filename: string) => {
        if (data.length === 0) {
            alert(`No data available to export for ${filename}.`);
            return;
        }

        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];

        for (const row of data) {
            const values = headers.map(header => {
                const escaped = ('' + row[header]).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        const today = new Date().toISOString().split('T')[0];
        link.setAttribute("href", url);
        link.setAttribute("download", `zenith_${filename}_${today}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportTransactions = () => {
        const data = transactions.map(t => ({
            ...t,
            categoryName: getCategoryById(t.categoryId)?.name || 'N/A'
        }));
        downloadCSV(data, 'transactions');
    };

    const handleExportBudgets = () => {
        const data = budgets.map(b => ({
            ...b,
            categoryName: getCategoryById(b.categoryId)?.name || 'Unknown'
        }));
        downloadCSV(data, 'budgets');
    };

    const exportableData = [
        { name: 'Transactions', count: transactions.length, action: handleExportTransactions },
        { name: 'Budgets', count: budgets.length, action: () => handleExportBudgets() },
        { name: 'Goals', count: goals.length, action: () => downloadCSV(goals, 'goals') },
        { name: 'Recurring Transactions', count: recurringTransactions.length, action: () => downloadCSV(recurringTransactions.map(r => ({...r, categoryName: getCategoryById(r.categoryId)?.name || 'N/A'})), 'recurring_transactions') },
        { name: 'Categories', count: categories.length, action: () => downloadCSV(categories, 'categories') },
    ];


    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Export Your Financial Data">
            <div className="space-y-4">
                <p className="text-gray-400 text-sm">
                    Select a data type to download it as a CSV file. This is a premium feature.
                </p>
                {exportableData.map(item => (
                    <Card key={item.name} className="bg-gray-700/50 flex justify-between items-center p-4">
                        <div>
                            <h3 className="font-semibold text-white">{item.name}</h3>
                            <p className="text-xs text-gray-400">{item.count} items</p>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={item.action}
                            disabled={item.count === 0}
                        >
                            Download CSV
                        </Button>
                    </Card>
                ))}
            </div>
        </Modal>
    );
};

export default ExportDataModal;
