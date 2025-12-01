import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const CategoryChart = ({ transactions, type = 'withdraw' }) => {
  const categoryData = useMemo(() => {
    const filtered = transactions.filter(t => t.type === type);
    const grouped = filtered.reduce((acc, t) => {
      const category = t.category || 'other';
      if (!acc[category]) {
        acc[category] = { category, total: 0, count: 0 };
      }
      acc[category].total += parseFloat(t.amount);
      acc[category].count += 1;
      return acc;
    }, {});

    return Object.values(grouped)
      .sort((a, b) => b.total - a.total)
      .map(item => ({
        name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
        value: item.total,
        count: item.count,
      }));
  }, [transactions, type]);

  const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5AC8FA', '#FFCC00', '#FF2D55'];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-ios shadow-ios-lg border border-ios-gray-200">
          <p className="font-semibold text-ios-gray-900">{payload[0].name}</p>
          <p className="text-ios-blue font-bold">{formatCurrency(payload[0].value)}</p>
          <p className="text-sm text-ios-gray-600">{payload[0].payload.count} transaction{payload[0].payload.count !== 1 ? 's' : ''}</p>
        </div>
      );
    }
    return null;
  };

  if (categoryData.length === 0) {
    return (
      <div className="text-center py-8 text-ios-gray-600">
        <p>No {type === 'deposit' ? 'deposits' : 'withdrawals'} to display</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={categoryData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {categoryData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry) => `${value}: ${formatCurrency(entry.payload.value)}`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryChart;
