import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import { transactionDB, accountDB } from '../services/db';
import { formatCurrency } from '../utils/currency';
import { formatDateTime } from '../utils/date';
import { useModal } from '../hooks/useModal';

const TransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const { alertModal, confirmModal, showAlert, hideAlert, showConfirm, hideConfirm } = useModal();

  useEffect(() => {
    loadTransaction();
  }, [id]);

  const loadTransaction = async () => {
    try {
      const txn = await transactionDB.getById(parseInt(id));
      if (!txn) {
        showAlert('Not Found', 'Transaction not found', 'error');
        setTimeout(() => navigate('/transactions'), 1500);
        return;
      }
      
      const acc = await accountDB.getById(txn.accountId);
      setTransaction(txn);
      setAccount(acc);
    } catch (error) {
      console.error('Error loading transaction:', error);
      showAlert('Error', 'Failed to load transaction', 'error');
      setTimeout(() => navigate('/transactions'), 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    showConfirm(
      'Delete Transaction?',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      async () => {
        try {
          // Reverse the transaction on the account
          const reverseAmount = transaction.type === 'deposit' 
            ? -transaction.amount 
            : transaction.amount;
          
          await accountDB.updateBalance(transaction.accountId, reverseAmount);
          await transactionDB.delete(transaction.id);
          
          hideConfirm();
          showAlert('Success', 'Transaction deleted successfully', 'success');
          setTimeout(() => navigate('/transactions'), 1500);
        } catch (error) {
          console.error('Error deleting transaction:', error);
          hideConfirm();
          showAlert('Error', 'Failed to delete transaction', 'error');
        }
      },
      'danger',
      'Delete',
      'Cancel'
    );
  };

  if (loading) {
    return (
      <div className="page-container">
        <Header title="Transaction Details" />
        <div className="flex items-center justify-center h-64">
          <div className="text-ios-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!transaction) return null;

  const isDeposit = transaction.type === 'deposit';
  const categoryIcons = {
    // Deposit categories
    salary: '💼',
    business: '🏢',
    investment: '📈',
    gift: '🎁',
    refund: '↩️',
    other: '💰',
    // Withdrawal categories
    food: '🍔',
    shopping: '🛍️',
    transport: '🚗',
    bills: '📄',
    utilities: '💡',
    subscription: '📱',
    entertainment: '🎬',
    health: '🏥',
    education: '📚',
    travel: '✈️',
    gifts: '🎁',
    rent: '🏠',
    insurance: '🛡️',
    loan: '💳',
  };

  return (
    <div className="page-container">
      <Header 
        title="Transaction Details"
        rightAction={
          <button onClick={() => navigate(-1)} className="text-ios-blue font-medium">
            Close
          </button>
        }
      />

      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        {/* Amount Card */}
        <div className={`ios-card-lg p-8 mb-6 text-center ${
          isDeposit ? 'bg-gradient-to-br from-ios-green to-emerald-500' : 'bg-gradient-to-br from-ios-red to-rose-500'
        } text-white`}>
          <div className="text-6xl mb-4">
            {categoryIcons[transaction.category] || (isDeposit ? '💰' : '💸')}
          </div>
          <div className="text-5xl font-bold mb-2">
            {isDeposit ? '+' : '-'}{formatCurrency(transaction.amount)}
          </div>
          <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
            isDeposit ? 'bg-white/20' : 'bg-white/20'
          }`}>
            {isDeposit ? 'Income' : 'Expense'}
          </div>
        </div>

        {/* Details Card */}
        <div className="ios-card mb-4">
          <div className="divide-y divide-ios-gray-200">
            {/* Description */}
            <div className="p-4 flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-ios-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-ios-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-ios-gray-600 mb-1 dark:text-ios-gray-400">Description</p>
                  <p className="font-semibold text-ios-gray-900 dark:text-white">{transaction.description}</p>
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="p-4 flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-ios-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-ios-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-ios-gray-600 mb-1 dark:text-ios-gray-400">Category</p>
                  <p className="font-semibold text-ios-gray-900 dark:text-white capitalize">{transaction.category.replace('_', ' ')}</p>
                </div>
              </div>
            </div>

            {/* Account */}
            <div className="p-4 flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-ios-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">{account?.icon || '💳'}</span>
                </div>
                <div>
                  <p className="text-sm text-ios-gray-600 mb-1 dark:text-ios-gray-400">Account</p>
                  <p className="font-semibold text-ios-gray-900 dark:text-white">{account?.name || 'Unknown Account'}</p>
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="p-4 flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-ios-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-ios-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-ios-gray-600 mb-1 dark:text-ios-gray-400">Date & Time</p>
                  <p className="font-semibold text-ios-gray-900 dark:text-white">{formatDateTime(transaction.date)}</p>
                </div>
              </div>
            </div>

            {/* Transaction ID */}
            <div className="p-4 flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-ios-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-ios-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-ios-gray-600 mb-1 dark:text-ios-gray-400">Transaction ID</p>
                  <p className="font-mono text-sm text-ios-gray-900 dark:text-white">#{transaction.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-20">
          <Button
            variant="danger"
            fullWidth
            onClick={handleDelete}
          >
            Delete Transaction
          </Button>
          <Button
            variant="outline"
            fullWidth
            onClick={() => navigate('/transactions')}
          >
            Back to Transactions
          </Button>
        </div>
      </div>

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

export default TransactionDetail;
