import React from 'react';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/currency';

const AccountCard = ({ account, onClick }) => {
  const formattedBalance = formatCurrency(account.balance || 0);

  return (
    <div
      onClick={onClick}
      className="ios-card p-5 mb-3 cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            account.color || 'bg-ios-blue'
          }`}>
            <span className="text-white text-xl font-bold">
              {account.icon || account.name?.charAt(0) || '💳'}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-ios-gray-900 dark:text-white">{account.name}</h3>
            {account.description && (
              <p className="text-sm text-ios-gray-600 dark:text-ios-gray-400">{account.description}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-ios-gray-900 dark:text-white">{formattedBalance}</p>
          {account.updatedAt && (
            <p className="text-xs text-ios-gray-500 dark:text-ios-gray-400 mt-1">
              {format(new Date(account.updatedAt), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountCard;
