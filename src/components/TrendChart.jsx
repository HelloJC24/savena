import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval, startOfYear } from 'date-fns';
import { formatCurrency } from '../utils/currency';

const TrendChart = ({ transactions, period = 'month' }) => {
  const chartData = useMemo(() => {
    if (transactions.length === 0) return [];

    const now = new Date();
    let dates = [];
    let formatStr = 'MMM d';

    if (period === 'month') {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      dates = eachDayOfInterval({ start, end });
      formatStr = 'MMM d';
    } else if (period === 'year') {
      const start = startOfYear(now);
      dates = eachMonthOfInterval({ start, end: now });
      formatStr = 'MMM';
    }

    const dataMap = dates.reduce((acc, date) => {
      const key = format(date, formatStr);
      acc[key] = { date: key, deposits: 0, withdrawals: 0 };
      return acc;
    }, {});

    transactions.forEach(transaction => {
      const transDate = parseISO(transaction.date);
      const key = format(transDate, formatStr);
      
      if (dataMap[key]) {
        if (transaction.type === 'deposit') {
          dataMap[key].deposits += parseFloat(transaction.amount);
        } else {
          dataMap[key].withdrawals += parseFloat(transaction.amount);
        }
      }
    });

    return Object.values(dataMap);
  }, [transactions, period]);

//   const formatCurrency = (value) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 0,
//     }).format(value);
//   };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-ios shadow-ios-lg border border-ios-gray-200">
          <p className="font-semibold text-ios-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className={`text-sm ${entry.dataKey === 'deposits' ? 'text-ios-green' : 'text-ios-red'}`}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-ios-gray-600">
        <p>No transaction data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#8E8E93' }}
            stroke="#E5E5EA"
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#8E8E93' }}
            tickFormatter={formatCurrency}
            stroke="#E5E5EA"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '14px' }}
            iconType="circle"
          />
          <Bar dataKey="deposits" fill="#34C759" name="Deposits" radius={[8, 8, 0, 0]} />
          <Bar dataKey="withdrawals" fill="#FF3B30" name="Withdrawals" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;
