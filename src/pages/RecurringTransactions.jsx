import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import RecurringItem from '../components/RecurringItem';
import Button from '../components/Button';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import { recurringDB } from '../services/recurringDB';
import { accountDB } from '../services/db';
import { formatCurrency } from '../utils/currency';
import { useModal } from '../hooks/useModal';

const RecurringTransactions = () => {
  const navigate = useNavigate();
  const [recurring, setRecurring] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [filter, setFilter] = useState('all'); // all, active, paused
  const [loading, setLoading] = useState(true);
  const { alertModal, confirmModal, showAlert, hideAlert, showConfirm, hideConfirm } = useModal();

  useEffect(() => {
    loadData();
    
    // Listen for automatic executions
    const handleRecurringExecuted = (event) => {
      console.log('Recurring transaction executed:', event.detail);
      loadData(); // Reload to show updated nextDate
    };
    
    // Listen for sync changes
    const handleSyncChange = () => {
      loadData();
    };
    
    window.addEventListener('recurring-executed', handleRecurringExecuted);
    window.addEventListener('sync-change', handleSyncChange);
    
    return () => {
      window.removeEventListener('recurring-executed', handleRecurringExecuted);
      window.removeEventListener('sync-change', handleSyncChange);
    };
  }, []);

  const loadData = async () => {
    try {
      const [allRecurring, allAccounts] = await Promise.all([
        recurringDB.getAll(),
        accountDB.getAll(),
      ]);
      
      setRecurring(allRecurring);
      setAccounts(allAccounts);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (item) => {
    try {
      await recurringDB.toggleActive(item.id);
      setRecurring(prev => 
        prev.map(r => 
          r.id === item.id ? { ...r, isActive: !r.isActive } : r
        )
      );
    } catch (error) {
      console.error('Error toggling recurring transaction:', error);
      showAlert('Error', 'Failed to update status', 'error');
    }
  };

  const handleEdit = (item) => {
    showAlert('Coming Soon', 'Edit feature coming soon! For now, you can delete and create a new one.', 'info');
  };

  const handleDelete = async (item) => {
    showConfirm(
      'Delete Recurring Transaction?',
      `Are you sure you want to delete recurring ${item.description}? This will not affect transactions already created.`,
      async () => {
        try {
          await recurringDB.delete(item.id);
          setRecurring(prev => prev.filter(r => r.id !== item.id));
          hideConfirm();
        } catch (error) {
          console.error('Error deleting recurring transaction:', error);
          hideConfirm();
          showAlert('Error', 'Failed to delete', 'error');
        }
      },
      'danger',
      'Delete',
      'Cancel'
    );
  };

  const filteredRecurring = recurring.filter(r => {
    if (filter === 'active') return r.isActive;
    if (filter === 'paused') return !r.isActive;
    return true;
  });

  const stats = {
    total: recurring.length,
    active: recurring.filter(r => r.isActive).length,
    paused: recurring.filter(r => !r.isActive).length,
    monthlyIncome: recurring
      .filter(r => r.isActive && r.type === 'deposit' && r.frequency === 'monthly')
      .reduce((sum, r) => sum + r.amount, 0),
    monthlyExpenses: recurring
      .filter(r => r.isActive && r.type === 'withdraw' && r.frequency === 'monthly')
      .reduce((sum, r) => sum + r.amount, 0),
  };

  if (loading) {
    return (
      <div className="page-container">
        <Header title="Recurring Transactions" />
        <div className="flex items-center justify-center h-64">
          <div className="text-ios-gray-600 dark:text-ios-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header 
        title="Recurring Transactions"
        subtitle={`${stats.total} total • Running Balance:${stats.monthlyIncome - stats.monthlyExpenses >= 0 ? ' +' : ' '}${formatCurrency(stats.monthlyIncome - stats.monthlyExpenses)}`}
      />

      <div className="relative w-full max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Stats Overview */}
        <div className="relative grid grid-cols-2 gap-3">
          <div className="ios-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-ios-gray-600 dark:text-ios-gray-400">Monthly Income</span>
              <span className="hidden text-xs bg-ios-green/10 text-ios-green px-2 py-1 rounded-full">
                Auto
              </span>
            </div>
            <div className="text-xl font-bold text-ios-green">
              {formatCurrency(stats.monthlyIncome)}
            </div>
          </div>
          
          <div className="ios-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-ios-gray-600 dark:text-ios-gray-400">Monthly Expenses</span>
              <span className="hidden text-xs bg-ios-red/10 text-ios-red px-2 py-1 rounded-full">
                Auto
              </span>
            </div>
            <div className="text-xl font-bold text-ios-red">
              {formatCurrency(stats.monthlyExpenses)}
            </div>
          </div>
     
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 ios-card p-1">
          <button
            onClick={() => setFilter('all')}
            className={`text-sm flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-ios-blue text-white'
                : 'text-ios-gray-600 dark:text-ios-gray-400 hover:bg-ios-gray-100 dark:hover:bg-ios-gray-700'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`text-sm flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              filter === 'active'
                ? 'bg-ios-blue text-white'
                : 'text-ios-gray-600 dark:text-ios-gray-400 hover:bg-ios-gray-100 dark:hover:bg-ios-gray-700'
            }`}
          >
            Active ({stats.active})
          </button>
          <button
            onClick={() => setFilter('paused')}
            className={`text-sm flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              filter === 'paused'
                ? 'bg-ios-blue text-white'
                : 'text-ios-gray-600 dark:text-ios-gray-400 hover:bg-ios-gray-100 dark:hover:bg-ios-gray-700'
            }`}
          >
            Paused ({stats.paused})
          </button>
        </div>

       

        {/* Info Card */}
        <div className="ios-card p-4 bg-ios-blue/5 dark:bg-ios-blue/10 border border-ios-blue/20 dark:border-ios-blue/30">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">🤖</div>
            <div>
              <h3 className="font-semibold text-ios-gray-900 dark:text-white mb-1">Automatic Processing</h3>
              <p className="text-sm text-ios-gray-700 dark:text-ios-gray-300">
                The system checks every 60 seconds and automatically creates transactions when they're due. 
                Active recurring transactions will run on schedule.
              </p>
            </div>
          </div>
        </div>

        {/* Recurring List */}
        {filteredRecurring.length === 0 ? (
          <div className="ios-card p-8 text-center">
            <div className="text-6xl mb-4">🔄</div>
            <h3 className="text-xl font-bold text-ios-gray-900 dark:text-white mb-2">
              {filter === 'all' ? 'No Recurring Transactions' : `No ${filter} Recurring Transactions`}
            </h3>
            <p className="text-ios-gray-600 dark:text-ios-gray-400 mb-4">
              {filter === 'all' 
                ? 'Set up automatic transactions for recurring income or expenses'
                : `You don't have any ${filter} recurring transactions`
              }
            </p>
            {filter === 'all' && (
              <Button variant="primary" onClick={() => navigate('/recurring/new')}>
                Create Recurring Transaction
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecurring.map((item) => {
              const account = accounts.find(a => a.id === item.accountId);
              return (
                <RecurringItem
                  key={item.id}
                  recurring={item}
                  account={account}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/recurring/new')}
        className="fixed bottom-24 right-6 w-14 h-14 bg-ios-blue text-white rounded-full shadow-ios-lg flex items-center justify-center hover:bg-ios-blue-dark transition-colors z-40"
        aria-label="Add recurring transaction"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Modals */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={hideConfirm}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        variant={confirmModal.variant}
      />
    </div>
  );
};

export default RecurringTransactions;
