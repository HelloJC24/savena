import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import TransactionItem from '../components/TransactionItem';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import { accountDB, transactionDB } from '../services/db';
import { formatCurrency } from '../utils/currency';
import { format } from 'date-fns';
import { useModal } from '../hooks/useModal';

const AccountDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { alertModal, confirmModal, showAlert, hideAlert, showConfirm, hideConfirm } = useModal();

  useEffect(() => {
    loadAccount();

    // Listen for data updates from sync
    const handleDataUpdate = () => {
      loadAccount();
    };

    window.addEventListener('data-updated', handleDataUpdate);

    return () => {
      window.removeEventListener('data-updated', handleDataUpdate);
    };
  }, [id]);

  const loadAccount = async () => {
    try {
      const acc = await accountDB.getById(parseInt(id));
      if (!acc) {
        showAlert('Not Found', 'Account not found', 'error');
        setTimeout(() => navigate('/accounts'), 1500);
        return;
      }
      
      const txns = await transactionDB.getByAccount(parseInt(id));
      setAccount(acc);
      setTransactions(txns);
    } catch (error) {
      console.error('Error loading account:', error);
      showAlert('Error', 'Failed to load account', 'error');
      setTimeout(() => navigate('/accounts'), 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (transactions.length > 0) {
      showAlert('Cannot Delete', 'Cannot delete account with transactions. Please delete all transactions first.', 'warning');
      return;
    }

    showConfirm(
      'Delete Account?',
      `Are you sure you want to delete ${account.name}? This action cannot be undone.`,
      async () => {
        try {
          await accountDB.delete(account.id);
          hideConfirm();
          showAlert('Success', 'Account deleted successfully', 'success');
          setTimeout(() => navigate('/accounts'), 1500);
        } catch (error) {
          console.error('Error deleting account:', error);
          hideConfirm();
          showAlert('Error', 'Failed to delete account', 'error');
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
        <Header title="Account Details" />
        <div className="flex items-center justify-center h-64">
          <div className="text-ios-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!account) return null;

  const stats = {
    totalDeposits: transactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0),
    totalWithdrawals: transactions
      .filter(t => t.type === 'withdraw')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0),
  };

  return (
    <div className="page-container">
      <Header 
        title={account.name}
        rightAction={
          <button onClick={() => navigate(-1)} className="text-ios-blue font-medium">
            Close
          </button>
        }
      />

      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        {/* Balance Card */}
        <div className={`ios-card-lg p-8 mb-6 text-center bg-gradient-to-br ${
          account.color || 'from-ios-blue to-ios-indigo'
        } text-white`}>
          <div className="text-6xl mb-4">
            {account.icon || '💳'}
          </div>
          <p className="text-sm opacity-90 mb-2">Current Balance</p>
          <h2 className="text-5xl font-bold mb-2">
            {formatCurrency(account.balance)}
          </h2>
          {account.description && (
            <p className="text-sm opacity-75 mt-2">{account.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="ios-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-ios-gray-600 dark:text-ios-gray-400">Total Deposits</span>
              <svg className="w-5 h-5 text-ios-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-xl font-bold text-ios-green">
              {formatCurrency(stats.totalDeposits)}
            </div>
          </div>
          
          <div className="ios-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-ios-gray-600 dark:text-ios-gray-400">Total Withdrawals</span>
              <svg className="w-5 h-5 text-ios-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
            <div className="text-xl font-bold text-ios-red">
              {formatCurrency(stats.totalWithdrawals)}
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="ios-card mb-4">
          <div className="divide-y divide-ios-gray-200">
            <div className="p-4">
              <p className="text-sm text-ios-gray-600 dark:text-ios-gray-400 mb-1">Account Name</p>
              <p className="font-semibold text-ios-gray-900 dark:text-white">{account.name}</p>
            </div>
            <div className="p-4">
              <p className="text-sm text-ios-gray-600 dark:text-ios-gray-400 mb-1">Created</p>
              <p className="font-semibold text-ios-gray-900 dark:text-white">
                {format(new Date(account.createdAt), 'MMMM dd, yyyy')}
              </p>
            </div>
            <div className="p-4">
              <p className="text-sm text-ios-gray-600 dark:text-ios-gray-400 mb-1">Last Updated</p>
              <p className="font-semibold text-ios-gray-900 dark:text-white">
                {format(new Date(account.updatedAt), 'MMMM dd, yyyy h:mm a')}
              </p>
            </div>
            <div className="p-4">
              <p className="text-sm text-ios-gray-600 dark:text-ios-gray-400 mb-1">Total Transactions</p>
              <p className="font-semibold text-ios-gray-900 dark:text-white">{transactions.length}</p>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-ios-gray-900 dark:text-white">Transactions</h3>
            <Link to={`/transactions/new?accountId=${account.id}`}>
              <span className="text-ios-blue text-sm font-medium">Add New</span>
            </Link>
          </div>
          
          {transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <Link key={transaction.id} to={`/transactions/${transaction.id}`}>
                  <TransactionItem
                    transaction={transaction}
                    account={account}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="ios-card p-8 text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-ios-gray-600 mb-4">No transactions yet</p>
              <Link to={`/transactions/new?accountId=${account.id}`}>
                <Button variant="primary">Add Transaction</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3 mb-20">
          <Link to={`/transactions/new?accountId=${account.id}&type=deposit`}>
            <Button variant="success" fullWidth>
              Add Deposit
            </Button>
          </Link>
          <Link to={`/transactions/new?accountId=${account.id}&type=withdraw`}>
            <Button variant="outline" fullWidth>
              Add Withdrawal
            </Button>
          </Link>
          <Button
            variant="danger"
            fullWidth
            onClick={handleDelete}
          >
            Delete Account
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

export default AccountDetail;
