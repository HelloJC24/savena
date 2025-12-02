import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import TransactionItem from '../components/TransactionItem';
import Button from '../components/Button';
import Select from '../components/Select';
import Input from '../components/Input';
import StatCard from '../components/StatCard';
import TrendChart from '../components/TrendChart';
import CategoryChart from '../components/CategoryChart';
import { transactionDB, accountDB } from '../services/db';
import { formatCurrency } from '../utils/currency';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filters, setFilters] = useState({
    accountId: '',
    type: '',
    startDate: '',
    endDate: '',
    sortBy: 'date',
    sortOrder: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('month');
  const [chartType, setChartType] = useState('trend');

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalDeposits = transactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalWithdrawals = transactions
      .filter(t => t.type === 'withdraw')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const netFlow = totalDeposits - totalWithdrawals;
    const avgTransaction = transactions.length > 0 
      ? (totalDeposits + totalWithdrawals) / transactions.length 
      : 0;

    return {
      totalDeposits,
      totalWithdrawals,
      netFlow,
      avgTransaction,
      transactionCount: transactions.length,
    };
  }, [transactions]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters]);

  const loadData = async () => {
    try {
      const [allTransactions, allAccounts] = await Promise.all([
        transactionDB.getAll(),
        accountDB.getAll(),
      ]);
      
      setTransactions(allTransactions);
      setAccounts(allAccounts);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      const filtered = await transactionDB.filter({
        accountId: filters.accountId ? parseInt(filters.accountId) : null,
        type: filters.type || null,
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
      setTransactions(filtered);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      accountId: '',
      type: '',
      startDate: '',
      endDate: '',
      sortBy: 'date',
      sortOrder: 'desc',
    });
  };

  const hasActiveFilters = filters.accountId || filters.type || filters.startDate || filters.endDate;

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ios-blue mx-auto"></div>
          <p className="mt-4 text-ios-gray-600 dark:text-ios-gray-400">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header 
        title="Transactions" 
        subtitle={`${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`}
        rightAction={
          <Link to="/transactions/new">
            <Button size="sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </Link>
        }
      />

      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        {/* Analytics Toggle & Filter Toggle Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button
            variant={showAnalytics ? 'primary' : 'secondary'}
            fullWidth
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics
            </span>
          </Button>
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            fullWidth
            onClick={() => setShowFilters(!showFilters)}
          >
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {hasActiveFilters && !showFilters && (
                <span className="ml-2 w-2 h-2 rounded-full bg-ios-red"></span>
              )}
            </span>
          </Button>
        </div>

        {/* Analytics Section */}
        {showAnalytics && (
          <div className="mb-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatCard
                title="Total Deposits"
                value={formatCurrency(analytics.totalDeposits)}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
                color="green"
              />
              <StatCard
                title="Total Withdrawals"
                value={formatCurrency(analytics.totalWithdrawals)}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                }
                color="red"
              />
              <StatCard
                title="Net Flow"
                value={formatCurrency(analytics.netFlow)}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                }
                color={analytics.netFlow >= 0 ? 'green' : 'red'}
              />
              <StatCard
                title="Avg Transaction"
                value={formatCurrency(analytics.avgTransaction)}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                }
                color="blue"
              />
            </div>

            {/* Chart Type Toggle */}
            <div className="ios-card p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-ios-gray-900 dark:text-white">Insights</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setChartType('trend')}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      chartType === 'trend'
                        ? 'bg-ios-blue text-white'
                        : 'bg-ios-gray-100 dark:bg-ios-gray-700 text-ios-gray-700 dark:text-ios-gray-300'
                    }`}
                  >
                    Trend
                  </button>
                  <button
                    onClick={() => setChartType('category')}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      chartType === 'category'
                        ? 'bg-ios-blue text-white'
                        : 'bg-ios-gray-100 dark:bg-ios-gray-700 text-ios-gray-700 dark:text-ios-gray-300'
                    }`}
                  >
                    Category
                  </button>
                </div>
              </div>

              {chartType === 'trend' ? (
                <>
                  <div className="flex justify-end mb-3">
                    <select
                      value={chartPeriod}
                      onChange={(e) => setChartPeriod(e.target.value)}
                      className="px-3 py-1 text-sm rounded-ios bg-ios-gray-50 dark:bg-ios-gray-700 border border-ios-gray-200 dark:border-ios-gray-600 text-ios-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ios-blue"
                    >
                      <option value="month">This Month</option>
                      <option value="year">This Year</option>
                    </select>
                  </div>
                  <TrendChart transactions={transactions} period={chartPeriod} />
                </>
              ) : (
                <>
                  <div className="flex justify-end mb-3">
                    <select
                      value={filters.type || 'withdraw'}
                      onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                      className="px-3 py-1 text-sm rounded-ios bg-ios-gray-50 dark:bg-ios-gray-700 border border-ios-gray-200 dark:border-ios-gray-600 text-ios-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ios-blue"
                    >
                      <option value="withdraw">Withdrawals</option>
                      <option value="deposit">Deposits</option>
                    </select>
                  </div>
                  <CategoryChart transactions={transactions} type={filters.type || 'withdraw'} />
                </>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="ios-card p-4 mb-4">
            <div className="space-y-4">
              <Select
                label="Account"
                value={filters.accountId}
                onChange={(e) => handleFilterChange('accountId', e.target.value)}
                options={[
                  { value: '', label: 'All Accounts' },
                  ...accounts.map(acc => ({ value: acc.id, label: acc.name }))
                ]}
              />

              <Select
                label="Type"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                options={[
                  { value: '', label: 'All Types' },
                  { value: 'deposit', label: 'Deposits' },
                  { value: 'withdraw', label: 'Withdrawals' },
                ]}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Start Date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
                <Input
                  label="End Date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Sort By"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  options={[
                    { value: 'date', label: 'Date' },
                    { value: 'amount', label: 'Amount' },
                    { value: 'createdAt', label: 'Created' },
                  ]}
                />
                <Select
                  label="Order"
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  options={[
                    { value: 'desc', label: 'Newest First' },
                    { value: 'asc', label: 'Oldest First' },
                  ]}
                />
              </div>

              {hasActiveFilters && (
                <Button variant="outline" fullWidth onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Transactions List */}
        {transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((transaction) => {
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
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-8xl mb-6">📊</div>
            <h3 className="text-2xl font-bold text-ios-gray-900 dark:text-white mb-2">
              {hasActiveFilters ? 'No Results' : 'No Transactions'}
            </h3>
            <p className="text-ios-gray-600 dark:text-ios-gray-400 mb-6 text-center max-w-sm">
              {hasActiveFilters 
                ? 'Try adjusting your filters'
                : 'Start tracking your finances by adding a transaction'
              }
            </p>
            {!hasActiveFilters && (
              <Link to="/transactions/new">
                <Button variant="primary" size="lg">
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Transaction
                  </span>
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
