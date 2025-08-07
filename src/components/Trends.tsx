
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { UseFinanceReturn } from '../hooks/useFinance';
import Card from './ui/Card';

interface TrendsProps {
  finance: UseFinanceReturn;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
        <p className="label text-sm text-white">{`${label}`}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.color }} className="text-xs">
            {`${pld.name}: ${formatCurrency(pld.value)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Trends: React.FC<TrendsProps> = ({ finance }) => {
  const { monthlySummary, netWorthData } = finance;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Financial Trends</h1>

      <Card>
        <h2 className="text-xl font-semibold mb-4 text-white">Monthly Cash Flow (Last 12 Months)</h2>
        {monthlySummary.length > 0 ? (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={monthlySummary} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                <XAxis dataKey="month" stroke="#A0AEC0" tick={{ fontSize: 12 }} />
                <YAxis stroke="#A0AEC0" tickFormatter={(value) => `$${Number(value) / 1000}k`} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{fontSize: "14px"}} />
                <Bar dataKey="income" fill="#48BB78" name="Income" />
                <Bar dataKey="expenses" fill="#F56565" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-10">Not enough data for a monthly cash flow trend. Add more transactions.</p>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4 text-white">Net Worth Progression</h2>
        {netWorthData.length > 1 ? (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={netWorthData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                <XAxis dataKey="month" stroke="#A0AEC0" tick={{ fontSize: 12 }} />
                <YAxis stroke="#A0AEC0" tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="balance" name="Net Worth" stroke="#3B82F6" fillOpacity={1} fill="url(#colorBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-10">Not enough monthly data to show your net worth progression.</p>
        )}
      </Card>
    </div>
  );
};

export default Trends;