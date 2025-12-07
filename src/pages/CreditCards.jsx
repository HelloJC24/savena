import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import { creditCardDB } from '../services/creditCardDB';
import { ccTransactionDB } from '../services/ccTransactionDB';
import { formatCurrency } from '../utils/currency';

const CreditCards = () => {
  const navigate = useNavigate();
  const [creditCards, setCreditCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    // Listen for sync changes and reload data
    const handleSyncChange = () => {
      loadData();
    };

    // Listen for data updates from pull sync
    const handleDataUpdate = () => {
      loadData();
    };

    window.addEventListener('sync-change', handleSyncChange);
    window.addEventListener('data-updated', handleDataUpdate);

    return () => {
      window.removeEventListener('sync-change', handleSyncChange);
      window.removeEventListener('data-updated', handleDataUpdate);
    };
  }, []);

  const loadData = async () => {
    try {
      const cards = await creditCardDB.getAll();
      setCreditCards(cards);
    } catch (error) {
      console.error('Error loading credit cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (cardId) => {
    navigate(`/credit-cards/${cardId}`);
  };

  const getUtilization = (current, max) => {
    if (max === 0) return 0;
    return (current / max) * 100;
  };

  const getUtilizationColor = (percentage) => {
    if (percentage >= 90) return 'text-ios-red';
    if (percentage >= 70) return 'text-ios-orange';
    if (percentage >= 50) return 'text-ios-yellow-600';
    return 'text-ios-green';
  };

  const totalLimit = creditCards.reduce((sum, card) => sum + card.maxLimit, 0);
  const totalBalance = creditCards.reduce((sum, card) => sum + card.currentBalance, 0);
  const availableCredit = totalLimit - totalBalance;

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

  return (
    <div className="page-container">
      <Header
        title="Credit Cards"
        subtitle={`${creditCards.length} card${creditCards.length !== 1 ? 's' : ''}`}
        rightAction={
          <Link to="/credit-cards/new">
            <Button size="sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </Link>
        }
      />

      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        {creditCards.length > 0 && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="ios-card p-4 text-center">
                <p className="text-xs text-ios-gray-600 dark:text-ios-gray-400 mb-1">Total Limit</p>
                <p className="text-base font-bold text-ios-gray-900 dark:text-white">
                  {formatCurrency(totalLimit)}
                </p>
              </div>
              <div className="ios-card p-4 text-center">
                <p className="text-xs text-ios-gray-600 dark:text-ios-gray-400 mb-1">Balance</p>
                <p className="text-base font-bold text-ios-red">
                  {formatCurrency(totalBalance)}
                </p>
              </div>
              <div className="ios-card p-4 text-center">
                <p className="text-xs text-ios-gray-600 dark:text-ios-gray-400 mb-1">Available</p>
                <p className="text-base font-bold text-ios-green">
                  {formatCurrency(availableCredit)}
                </p>
              </div>
            </div>

            {/* Credit Cards List */}
            <div className="space-y-4">
              {creditCards.map((card) => {
                const utilization = getUtilization(card.currentBalance, card.maxLimit);
                const available = card.maxLimit - card.currentBalance;

                return (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(card.id)}
                    className="w-full ios-card p-5 hover:shadow-lg transition-shadow text-left"
                    style={{
                      background: `linear-gradient(135deg, ${card.color}dd 0%, ${card.color} 100%)`,
                    }}
                  >
                    <div className="text-white">
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-1">{card.name}</h3>
                          {card.cardNumber && (
                            <p className="text-sm opacity-80">•••• {card.cardNumber}</p>
                          )}
                        </div>
                        <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>

                      {/* Balance Info */}
                      <div className="mb-3">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-sm opacity-80">Current Balance</span>
                          <span className="text-2xl font-bold">{formatCurrency(card.currentBalance)}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs opacity-70">Available Credit</span>
                          <span className="text-sm font-semibold">{formatCurrency(available)}</span>
                        </div>
                      </div>

                      {/* Utilization Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs opacity-80">
                          <span>Credit Limit {formatCurrency(card.maxLimit)}</span>
                          <span>{utilization.toFixed(1)}% used</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-white h-full rounded-full transition-all"
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {creditCards.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-ios-gray-100 dark:bg-ios-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-ios-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-ios-gray-900 dark:text-white mb-2">No Credit Cards</h3>
            <p className="text-ios-gray-600 dark:text-ios-gray-400 mb-6">
              Add your first credit card to start tracking expenses
            </p>
            <Link to="/credit-cards/new">
              <Button>Add Credit Card</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditCards;
