import React from 'react';
import { formatCurrency } from '../utils/currency';
import { format } from 'date-fns';

const RecurringItem = ({ recurring, account, onEdit, onDelete, onToggle }) => {
  const isDeposit = recurring.type === 'deposit';
  
  const frequencyIcons = {
    daily: '📅',
    weekly: '📆',
    biweekly: '🗓️',
    monthly: '📊',
    quarterly: '📈',
    yearly: '🎯',
  };

  const frequencyLabels = {
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
  };

  return (
    <div className={`ios-card p-4 transition-all ${!recurring.isActive ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">
            {frequencyIcons[recurring.frequency]}
          </div>
          <div>
            <h3 className="font-semibold text-ios-gray-900 dark:text-white">{recurring.description}</h3>
            <p className="text-sm text-ios-gray-600 dark:text-ios-gray-400">
              {account?.name} • {frequencyLabels[recurring.frequency]}
            </p>
          </div>
        </div>
        
        <div className={`text-right ${isDeposit ? 'text-ios-green' : 'text-ios-red'}`}>
          <div className="font-bold text-lg">
            {isDeposit ? '+' : '-'}{formatCurrency(recurring.amount)}
          </div>
          <div className="text-xs text-ios-gray-600 dark:text-ios-gray-400 capitalize">
            {recurring.category}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-ios-gray-100 dark:border-ios-gray-700">
        <div className="flex items-center space-x-2 text-sm">
          <svg className="w-4 h-4 text-ios-gray-600 dark:text-ios-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-ios-gray-700 dark:text-ios-gray-300">
            {recurring.isActive ? 'Next:' : 'Paused on:'} {format(new Date(recurring.nextDate), 'MMM dd, yyyy')}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Toggle Active/Inactive */}
          <button
            onClick={() => onToggle(recurring)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              recurring.isActive
                ? 'bg-ios-blue/10 text-ios-blue'
                : 'bg-ios-gray-200 dark:bg-ios-gray-700 text-ios-gray-600 dark:text-ios-gray-400'
            }`}
          >
            {recurring.isActive ? 'Active' : 'Paused'}
          </button>

          {/* Edit Button */}
          <button
            onClick={() => onEdit(recurring)}
            className="p-2 text-ios-blue hover:bg-ios-blue/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(recurring)}
            className="p-2 text-ios-red hover:bg-ios-red/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {recurring.lastExecuted && (
        <div className="mt-2 pt-2 border-t border-ios-gray-100">
          <div className="flex items-center space-x-2 text-xs text-ios-gray-600">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span>Last executed: {format(new Date(recurring.lastExecuted), 'MMM dd, yyyy h:mm a')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringItem;
