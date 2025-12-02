import React from 'react';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/currency';

const TransactionItem = ({ transaction, account }) => {
  const isDeposit = transaction.type === 'deposit';
  const formattedAmount = formatCurrency(Math.abs(transaction.amount));

  return (
    <div className="ios-card p-4 mb-2 cursor-pointer active:scale-[0.98] transition-transform">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isDeposit ? 'bg-ios-green/10' : 'bg-ios-red/10'
          }`}>
            {isDeposit ? (
              <svg className="w-5 h-5 text-ios-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-ios-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ios-gray-900 dark:text-white truncate">
              {transaction.description || (isDeposit ? 'Deposit' : 'Withdrawal')}
            </p>
            <div className="flex items-center space-x-2 text-sm text-ios-gray-600 dark:text-ios-gray-400">
              <span>{account?.name || 'Unknown Account'}</span>
              <span>•</span>
              <span>{format(new Date(transaction.date), 'MMM d, yyyy')}</span>
            </div>
            {transaction.category && (
              <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-ios-gray-100 dark:bg-ios-gray-700 text-ios-gray-700 dark:text-ios-gray-300">
                {transaction.category}
              </span>
            )}
          </div>
        </div>
        <div className="text-right ml-4">
          <p className={`text-lg font-bold ${
            isDeposit ? 'text-ios-green' : 'text-ios-red'
          }`}>
            {isDeposit ? '+' : '-'}{formattedAmount}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TransactionItem;
