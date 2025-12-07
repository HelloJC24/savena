import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import AccountCard from '../components/AccountCard';
import TransactionItem from '../components/TransactionItem';
import Button from '../components/Button';
import StatCard from '../components/StatCard';
import SyncStatus from '../components/SyncStatus';
import BottomNav from '../components/BottomNav';
import ToastContainer from '../components/ToastContainer';
import { accountDB, transactionDB } from '../services/db';
import { creditCardDB } from '../services/creditCardDB';
import { formatCurrency } from '../utils/currency';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import * as syncService from '../services/syncService';


const Dashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      const [allAccounts, allTransactions, allCreditCards] = await Promise.all([
        accountDB.getAll(),
        transactionDB.getAll(),
        creditCardDB.getAll()
      ]);
      
      setAccounts(allAccounts);
      setCreditCards(allCreditCards);
      setRecentTransactions(allTransactions.slice(0, 5));
      
      const total = allAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
      setTotalBalance(total);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      await syncService.pullFromServer();
      await loadData();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
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
       
        {/* Total Balance Card */}
        <div className="ios-card-lg p-6 mb-6 bg-gradient-to-br from-ios-blue to-ios-indigo text-white">
          
           <div className="w-full flex justify-between items-center mb-2">
            <p className="text-sm opacity-90">Total Balance</p>
            <div className="flex justify-end items-center space-x-2">
               <SyncStatus />
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <svg 
                  className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
              </button>
             
            </div>
        </div>

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
            <h3 className="font-semibold text-ios-gray-900 dark:text-white mb-4">This Month</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-ios-green/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-ios-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-sm text-ios-gray-700 dark:text-ios-gray-400">Deposits</span>
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
                  <span className="text-sm text-ios-gray-700 dark:text-ios-gray-400">Withdrawals</span>
                </div>
                <span className="font-bold text-ios-red">
                  {formatCurrency(monthlyStats.withdrawals)}
                </span>
              </div>
              <div className="pt-3 border-t border-ios-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ios-gray-900 dark:text-white">Net Change</span>
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
            <h3 className="text-xl font-bold text-ios-gray-900 dark:text-white">Accounts</h3>
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
              <p className="text-ios-gray-600 dark:text-ios-gray-400 mb-4">No accounts yet</p>
              <Link to="/accounts/new">
                <Button variant="primary">Create Account</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Credit Cards Section */}
        {creditCards.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-ios-gray-900 dark:text-white">Credit Cards</h3>
              <Link to="/credit-cards">
                <span className="text-ios-blue text-sm font-medium">See All</span>
              </Link>
            </div>
            <div className="space-y-3">
              {creditCards.slice(0, 2).map((card) => {
                const utilization = card.maxLimit > 0 ? (card.currentBalance / card.maxLimit) * 100 : 0;
                const available = card.maxLimit - card.currentBalance;
                
                return (
                  <Link key={card.id} to={`/credit-cards/${card.id}`}>
                    <div
                      className="my-2 ios-card p-4 hover:shadow-lg transition-shadow"
                      style={{
                        background: `linear-gradient(135deg, ${card.color}dd 0%, ${card.color} 100%)`,
                      }}
                    >
                      <div className="text-white">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-lg">{card.name}</h4>
                            {card.cardNumber && (
                              <p className="text-sm opacity-80">•••• {card.cardNumber}</p>
                            )}
                          </div>
                          <svg className="w-6 h-6 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="text-xs opacity-80">Balance</span>
                          <span className="text-xl font-bold">{formatCurrency(card.currentBalance)}</span>
                        </div>
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="text-xs opacity-70">Available</span>
                          <span className="text-sm font-semibold">{formatCurrency(available)}</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-white h-full rounded-full transition-all"
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs opacity-70 mt-1">
                          <span>Limit {formatCurrency(card.maxLimit)}</span>
                          <span>{utilization.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-ios-gray-900 dark:text-white">Recent Transactions</h3>
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
              <p className="text-ios-gray-600 dark:text-ios-gray-400 mb-4">No transactions yet</p>
              <Link to="/transactions/new">
                <Button variant="primary">Add Transaction</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
      <ToastContainer />
    </div>
  );
};

export default Dashboard;
