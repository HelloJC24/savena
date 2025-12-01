import { useState, useEffect } from 'react';
import { transactionDB } from '../services/db';

export const useTransactions = (accountId = null) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = accountId 
        ? await transactionDB.getByAccount(accountId)
        : await transactionDB.getAll();
      setTransactions(data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [accountId]);

  const createTransaction = async (transactionData) => {
    try {
      const newTransaction = await transactionDB.create(transactionData);
      setTransactions(prev => [newTransaction, ...prev]);
      return newTransaction;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateTransaction = async (id, updates) => {
    try {
      const updatedTransaction = await transactionDB.update(id, updates);
      setTransactions(prev => 
        prev.map(trans => trans.id === id ? updatedTransaction : trans)
      );
      return updatedTransaction;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await transactionDB.delete(id);
      setTransactions(prev => prev.filter(trans => trans.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const filterTransactions = async (filters) => {
    try {
      setLoading(true);
      const filtered = await transactionDB.filter(filters);
      setTransactions(filtered);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const totalDeposits = transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdraw')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return {
    transactions,
    loading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    filterTransactions,
    totalDeposits,
    totalWithdrawals,
    refreshTransactions: loadTransactions,
  };
};
