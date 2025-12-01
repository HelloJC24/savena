import { useState, useEffect } from 'react';
import { accountDB } from '../services/db';

export const useAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await accountDB.getAll();
      setAccounts(data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const createAccount = async (accountData) => {
    try {
      const newAccount = await accountDB.create(accountData);
      setAccounts(prev => [...prev, newAccount]);
      return newAccount;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateAccount = async (id, updates) => {
    try {
      const updatedAccount = await accountDB.update(id, updates);
      setAccounts(prev => prev.map(acc => acc.id === id ? updatedAccount : acc));
      return updatedAccount;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteAccount = async (id) => {
    try {
      await accountDB.delete(id);
      setAccounts(prev => prev.filter(acc => acc.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const getAccountById = (id) => {
    return accounts.find(acc => acc.id === id);
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  return {
    accounts,
    loading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    getAccountById,
    totalBalance,
    refreshAccounts: loadAccounts,
  };
};
