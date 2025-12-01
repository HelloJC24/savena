import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import AccountCard from '../components/AccountCard';
import TransactionItem from '../components/TransactionItem';
import Button from '../components/Button';
import StatCard from '../components/StatCard';
import SyncStatus from '../components/SyncStatus';
import { accountDB, transactionDB } from '../services/db';
import { formatCurrency } from '../utils/currency';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

const Dashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allAccounts = await accountDB.getAll();
      const allTransactions = await transactionDB.getAll();
      
      setAccounts(allAccounts);
      setRecentTransactions(allTransactions.slice(0, 5));
      
      const total = allAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
      setTotalBalance(total);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const thisMonthTransactions = recentTransactions.filter(t => {
      const transDate = parseISO(t.date);
      return transDate >= monthStart && transDate <= monthEnd;
    });
    
    const deposits = thisMonthTransactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const withdrawals = thisMonthTransactions
      .filter(t => t.type === 'withdraw')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return { deposits, withdrawals, count: thisMonthTransactions.length };
  }, [recentTransactions]);

  const formattedTotalBalance = formatCurrency(totalBalance);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ios-blue mx-auto"></div>
          <p className="mt-4 text-ios-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header 
        title="Savena" 
        subtitle={format(new Date(), 'EEEE, MMMM d')}
      />

      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        {/* Sync Status Indicator */}
        <div className="mb-4 flex justify-end">
          <SyncStatus />
        </div>

        {/* Total Balance Card */}
        <div className="ios-card-lg p-6 mb-6 bg-gradient-to-br from-ios-blue to-ios-indigo text-white">
          <p className="text-sm opacity-90 mb-2">Total Balance</p>
          <h2 className="text-4xl font-bold mb-4">{formattedTotalBalance}</h2>
          <div className="flex space-x-3">
            <Link to="/transactions/new?type=deposit" className="flex-1">
              <Button variant="secondary" fullWidth size="sm">
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Deposit
                </span>
              </Button>
            </Link>
            <Link to="/transactions/new?type=withdraw" className="flex-1">
              <Button variant="secondary" fullWidth size="sm">
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                  Withdraw
                </span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            title="Accounts"
            value={accounts.length}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
            color="blue"
          />
          <StatCard
            title="This Month"
            value={monthlyStats.count}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            color="orange"
          />
        </div>

        {/* Monthly Overview */}
        {monthlyStats.count > 0 && (
          <div className="ios-card p-4 mb-6">
            <h3 className="font-semibold text-ios-gray-900 mb-4">This Month</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-ios-green/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-ios-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-sm text-ios-gray-700">Deposits</span>
                </div>
                <span className="font-bold text-ios-green">
                  {formatCurrency(monthlyStats.deposits)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-ios-red/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-ios-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </div>
                  <span className="text-sm text-ios-gray-700">Withdrawals</span>
                </div>
                <span className="font-bold text-ios-red">
                  {formatCurrency(monthlyStats.withdrawals)}
                </span>
              </div>
              <div className="pt-3 border-t border-ios-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ios-gray-900">Net Change</span>
                  <span className={`font-bold ${monthlyStats.deposits - monthlyStats.withdrawals >= 0 ? 'text-ios-green' : 'text-ios-red'}`}>
                    {formatCurrency(monthlyStats.deposits - monthlyStats.withdrawals)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Accounts Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-ios-gray-900">Accounts</h3>
            <Link to="/accounts">
              <span className="text-ios-blue text-sm font-medium">See All</span>
            </Link>
          </div>
          {accounts.length > 0 ? (
            <div className="space-y-3">
              {accounts.slice(0, 3).map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onClick={() => window.location.href = `/accounts/${account.id}`}
                />
              ))}
            </div>
          ) : (
            <div className="ios-card p-8 text-center">
              <div className="text-6xl mb-4">💳</div>
              <p className="text-ios-gray-600 mb-4">No accounts yet</p>
              <Link to="/accounts/new">
                <Button variant="primary">Create Account</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-ios-gray-900">Recent Transactions</h3>
            <Link to="/transactions">
              <span className="text-ios-blue text-sm font-medium">See All</span>
            </Link>
          </div>
          {recentTransactions.length > 0 ? (
            <div className="space-y-2">
              {recentTransactions.map((transaction) => {
                const account = accounts.find(acc => acc.id === transaction.accountId);
                return (
                  <Link key={transaction.id} to={`/transactions/${transaction.id}`}>
                    <TransactionItem
                      transaction={transaction}
                      account={account}
                    />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="ios-card p-8 text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-ios-gray-600 mb-4">No transactions yet</p>
              <Link to="/transactions/new">
                <Button variant="primary">Add Transaction</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
