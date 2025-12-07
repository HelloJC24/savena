import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import AccountCard from '../components/AccountCard';
import Button from '../components/Button';
import { accountDB } from '../services/db';
import { formatCurrency } from '../utils/currency';
const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();

    // Listen for sync changes and reload data
    const handleSyncChange = () => {
      loadAccounts();
    };

    // Listen for data updates from pull sync
    const handleDataUpdate = () => {
      loadAccounts();
    };

    window.addEventListener('sync-change', handleSyncChange);
    window.addEventListener('data-updated', handleDataUpdate);

    return () => {
      window.removeEventListener('sync-change', handleSyncChange);
      window.removeEventListener('data-updated', handleDataUpdate);
    };
  }, []);

  const loadAccounts = async () => {
    try {
      const allAccounts = await accountDB.getAll();
      setAccounts(allAccounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const formattedTotal = formatCurrency(totalBalance);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ios-blue mx-auto"></div>
          <p className="mt-4 text-ios-gray-600 dark:text-ios-gray-400">Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header 
        title="Accounts" 
        subtitle={`Total: ${formattedTotal}`}
        rightAction={
          <Link to="/accounts/new">
            <Button size="sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </Link>
        }
      />

      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        {accounts.length > 0 ? (
          <div className="space-y-3">
            {accounts.map((account) => (
              <Link key={account.id} to={`/accounts/${account.id}`}>
                <AccountCard
                  account={account}
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-8xl mb-6">💳</div>
            <h3 className="text-2xl font-bold text-ios-gray-900 mb-2 dark:text-white">No Accounts</h3>
            <p className="text-ios-gray-600 dark:text-ios-gray-400 mb-6 text-center max-w-sm">
              Create your first account to start tracking your finances
            </p>
            <Link to="/accounts/new">
              <Button variant="primary" size="lg">
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Account
                </span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Accounts;
