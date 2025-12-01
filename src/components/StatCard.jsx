import React from 'react';

const StatCard = ({ title, value, change, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-ios-blue/10 text-ios-blue',
    green: 'bg-ios-green/10 text-ios-green',
    red: 'bg-ios-red/10 text-ios-red',
    orange: 'bg-ios-orange/10 text-ios-orange',
  };

  return (
    <div className="ios-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
            change >= 0 ? 'bg-ios-green/10 text-ios-green' : 'bg-ios-red/10 text-ios-red'
          }`}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-sm text-ios-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-ios-gray-900">{value}</p>
    </div>
  );
};

export default StatCard;
