import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import { creditCardDB } from '../services/creditCardDB';
import { ccTransactionDB } from '../services/ccTransactionDB';
import { formatCurrency } from '../utils/currency';
import { format, parseISO } from 'date-fns';

const CreditCardDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [card, setCard] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    loadData();

    // Listen for sync changes
    const handleSyncChange = () => {
      loadData();
    };

    window.addEventListener('sync-change', handleSyncChange);

    return () => {
      window.removeEventListener('sync-change', handleSyncChange);
    };
  }, [id]);

  const loadData = async () => {
    try {
      const [cardData, txnData] = await Promise.all([
        creditCardDB.getById(id),
        ccTransactionDB.getByCreditCard(id),
      ]);

      if (!cardData) {
        setAlertModal({
          isOpen: true,
          title: 'Error',
          message: 'Credit card not found',
          type: 'error',
        });
        setTimeout(() => navigate('/credit-cards'), 2000);
        return;
      }

      setCard(cardData);
      setTransactions(txnData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Credit Card?',
      message: `Are you sure you want to delete "${card.name}"? This will also delete all associated transactions. This action cannot be undone.`,
      onConfirm: async () => {
        try {
          // Delete all transactions first
          for (const txn of transactions) {
            await ccTransactionDB.delete(txn.id);
          }
          // Delete card
          await creditCardDB.delete(id);
          
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
          setAlertModal({
            isOpen: true,
            title: 'Deleted',
            message: 'Credit card and all transactions deleted successfully',
            type: 'success',
          });
          setTimeout(() => navigate('/credit-cards'), 1500);
        } catch (error) {
          console.error('Error deleting credit card:', error);
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to delete credit card',
            type: 'error',
          });
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ios-blue mx-auto"></div>
          <p className="mt-4 text-ios-gray-600 dark:text-ios-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!card) return null;

  const utilization = card.maxLimit > 0 ? (card.currentBalance / card.maxLimit) * 100 : 0;
  const available = card.maxLimit - card.currentBalance;

  return (
    <div className="page-container">
      <Header title={card.name} />

      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        {/* Card Details */}
        <div
          className="ios-card-lg p-6 mb-6 text-white"
          style={{
            background: `linear-gradient(135deg, ${card.color}dd 0%, ${card.color} 100%)`,
          }}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{card.name}</h2>
              {card.cardNumber && (
                <p className="text-lg opacity-90">•••• {card.cardNumber}</p>
              )}
            </div>
            <svg className="w-10 h-10 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-baseline">
              <span className="text-sm opacity-80">Current Balance</span>
              <span className="text-3xl font-bold">{formatCurrency(card.currentBalance)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm opacity-80">Available Credit</span>
              <span className="text-xl font-semibold">{formatCurrency(available)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm opacity-80">Credit Limit</span>
              <span className="text-lg">{formatCurrency(card.maxLimit)}</span>
            </div>
          </div>

          {/* Utilization Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs opacity-80">
              <span>Utilization</span>
              <span>{utilization.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all"
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>
          </div>

          {card.notes && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-sm opacity-90">{card.notes}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link to={`/credit-cards/${id}/charge`}>
            <Button variant="primary" fullWidth>
              New Charge
            </Button>
          </Link>
          <Link to={`/credit-cards/${id}/payment`}>
            <Button variant="secondary" fullWidth>
              
              Make Payment
            </Button>
          </Link>
        </div>

        {/* Transactions */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-ios-gray-900 dark:text-white mb-3">Transactions</h3>
          
          {transactions.length > 0 ? (
            <div className="ios-card divide-y divide-ios-gray-200 dark:divide-ios-gray-700">
              {transactions.map((txn) => (
                <div key={txn.id} className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        txn.type === 'charge' ? 'bg-ios-red/10' : 'bg-ios-green/10'
                      }`}>
                        {txn.type === 'charge' ? (
                          <svg className="w-4 h-4 text-ios-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-ios-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-ios-gray-900 dark:text-white">
                          {txn.description || (txn.type === 'charge' ? 'Purchase' : 'Payment')}
                        </p>
                        <p className="text-xs text-ios-gray-600 dark:text-ios-gray-400">
                          {format(parseISO(txn.date), 'MMM d, yyyy')}
                          {txn.category && ` • ${txn.category}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      txn.type === 'charge' ? 'text-ios-red' : 'text-ios-green'
                    }`}>
                      {txn.type === 'charge' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ios-card p-8 text-center">
              <p className="text-ios-gray-600 dark:text-ios-gray-400">No transactions yet</p>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="ios-card divide-y divide-ios-gray-200 dark:divide-ios-gray-700 mb-20">
          <Link to={`/credit-cards/${id}/edit`} className="block p-4 hover:bg-ios-gray-50 dark:hover:bg-ios-gray-800 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-ios-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="font-medium text-ios-gray-900 dark:text-white">Edit Card Details</span>
              </div>
              <svg className="w-5 h-5 text-ios-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <button
            onClick={handleDelete}
            className="w-full p-4 hover:bg-ios-gray-50 dark:hover:bg-ios-gray-800 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-ios-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="font-medium text-ios-red">Delete Credit Card</span>
            </div>
          </button>
        </div>
      </div>

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, title: '', message: '', type: 'info' })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default CreditCardDetail;
