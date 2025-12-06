import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import AlertModal from '../components/AlertModal';
import ImportOptionsModal from '../components/ImportOptionsModal';
import ConfirmModal from '../components/ConfirmModal';
import SyncModal from '../components/SyncModal';
import { getCurrencySettings } from '../services/currencySettings';
import { syncService } from '../services/syncService';
import { useTheme } from '../hooks/useTheme';
import savenaLogo from '../assets/savena-logo.svg';

const Settings = () => {
  const navigate = useNavigate();
  const currentCurrency = getCurrencySettings();
  const { theme, isDark, toggleTheme } = useTheme();

  // Modal states
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [importModal, setImportModal] = useState({ isOpen: false, data: null, summary: null });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [syncModal, setSyncModal] = useState(false);
  
  // Sync state
  const [syncSettings, setSyncSettings] = useState(null);
  const [syncEnabled, setSyncEnabled] = useState(false);

  useEffect(() => {
    loadSyncSettings();

    // Listen for sync settings changes
    const handleSyncSettingsChanged = (event) => {
      setSyncSettings(event.detail);
      setSyncEnabled(!!event.detail?.enabled);
    };

    window.addEventListener('sync-settings-changed', handleSyncSettingsChanged);

    return () => {
      window.removeEventListener('sync-settings-changed', handleSyncSettingsChanged);
    };
  }, []);

  const loadSyncSettings = () => {
    const settings = syncService.getSyncSettings();
    setSyncSettings(settings);
    setSyncEnabled(!!settings?.enabled);
  };

  const validateImportData = (data) => {
    // Check if data has the required structure
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Invalid file format' };
    }

    // Check for required fields
    if (!data.version || !data.exportDate) {
      return { valid: false, error: 'Missing required metadata (version or exportDate)' };
    }

    // Validate accounts array
    if (!Array.isArray(data.accounts)) {
      return { valid: false, error: 'Invalid or missing accounts data' };
    }

    // Validate transactions array
    if (!Array.isArray(data.transactions)) {
      return { valid: false, error: 'Invalid or missing transactions data' };
    }

    // Validate account structure
    for (const account of data.accounts) {
      if (!account.name || typeof account.balance !== 'number') {
        return { valid: false, error: 'Invalid account structure' };
      }
    }

    // Validate transaction structure
    for (const transaction of data.transactions) {
      if (!transaction.type || !transaction.amount || !transaction.accountId) {
        return { valid: false, error: 'Invalid transaction structure' };
      }
      if (!['deposit', 'withdraw'].includes(transaction.type)) {
        return { valid: false, error: 'Invalid transaction type' };
      }
    }

    return { valid: true };
  };

  const performImport = async (data, shouldReplace = false) => {
    try {
      const { accountDB, transactionDB } = await import('../services/db');
      
      // If replace mode, clear existing data first
      if (shouldReplace) {
        const allAccounts = await accountDB.getAll();
        const allTransactions = await transactionDB.getAll();
        
        for (const transaction of allTransactions) {
          await transactionDB.delete(transaction.id);
        }
        
        for (const account of allAccounts) {
          await accountDB.delete(account.id);
        }
      }

      let importedAccounts = 0;
      let importedTransactions = 0;

      // Import accounts
      for (const account of data.accounts) {
        try {
          const { id, ...accountData } = account;
          await accountDB.create(accountData);
          importedAccounts++;
        } catch (error) {
          console.error('Error importing account:', error);
        }
      }

      // Import transactions (after accounts are created)
      const newAccounts = await accountDB.getAll();
      for (const transaction of data.transactions) {
        try {
          // Map old account ID to new account ID by name
          const oldAccount = data.accounts.find(a => a.id === transaction.accountId);
          const newAccount = newAccounts.find(a => a.name === oldAccount?.name);
          
          if (newAccount) {
            const { id, ...transactionData } = transaction;
            await transactionDB.create({
              ...transactionData,
              accountId: newAccount.id,
            });
            importedTransactions++;
          }
        } catch (error) {
          console.error('Error importing transaction:', error);
        }
      }

      setAlertModal({
        isOpen: true,
        title: 'Import Completed!',
        message: `Successfully imported:\n\nAccounts: ${importedAccounts}/${data.accounts.length}\nTransactions: ${importedTransactions}/${data.transactions.length}`,
        type: 'success',
      });

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error importing data:', error);
      setAlertModal({
        isOpen: true,
        title: 'Import Failed',
        message: 'An error occurred while importing data. Please try again.',
        type: 'error',
      });
    }
  };

  const handleImportData = async () => {
    try {
      // Create file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
          const text = await file.text();
          const data = JSON.parse(text);

          // Validate the imported data
          const validation = validateImportData(data);
          if (!validation.valid) {
            setAlertModal({
              isOpen: true,
              title: 'Import Failed',
              message: validation.error,
              type: 'error',
            });
            return;
          }

          // Show import options modal
          setImportModal({
            isOpen: true,
            data: data,
            summary: {
              accounts: data.accounts.length,
              transactions: data.transactions.length,
              exportDate: new Date(data.exportDate).toLocaleString(),
            },
          });
        } catch (error) {
          console.error('Error parsing file:', error);
          setAlertModal({
            isOpen: true,
            title: 'Import Failed',
            message: 'Failed to parse file. Please ensure the file is a valid Savena backup JSON.',
            type: 'error',
          });
        }
      };

      input.click();
    } catch (error) {
      console.error('Error importing data:', error);
      setAlertModal({
        isOpen: true,
        title: 'Import Failed',
        message: 'An error occurred while selecting file.',
        type: 'error',
      });
    }
  };

  const handleClearData = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear All Data?',
      message: 'Are you sure you want to clear all data? This action cannot be undone.\n\nAll accounts, transactions, and settings will be permanently deleted.',
      onConfirm: async () => {
        try {
          // Clear IndexedDB
          const databases = await window.indexedDB.databases();
          databases.forEach(db => {
            window.indexedDB.deleteDatabase(db.name);
          });
          
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
          setAlertModal({
            isOpen: true,
            title: 'Data Cleared',
            message: 'All data has been successfully cleared.',
            type: 'success',
          });
          
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (error) {
          console.error('Error clearing data:', error);
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to clear data. Please try again.',
            type: 'error',
          });
        }
      },
    });
  };

  const handleExportData = async () => {
    try {
      const { accountDB, transactionDB } = await import('../services/db');
      const accounts = await accountDB.getAll();
      const transactions = await transactionDB.getAll();
      
      const data = {
        accounts,
        transactions,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `savena-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setAlertModal({
        isOpen: true,
        title: 'Export Successful',
        message: 'Your data has been exported successfully.',
        type: 'success',
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      setAlertModal({
        isOpen: true,
        title: 'Export Failed',
        message: 'Failed to export data. Please try again.',
        type: 'error',
      });
    }
  };

  const handleSyncToggle = () => {
    if (syncEnabled && syncSettings) {
      // Disable sync
      setConfirmModal({
        isOpen: true,
        title: 'Disable Sync?',
        message: 'Are you sure you want to disconnect from the synced wallet? Your local data will remain intact.',
        onConfirm: async () => {
          await syncService.disconnect();
          loadSyncSettings();
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
          setAlertModal({
            isOpen: true,
            title: 'Sync Disabled',
            message: 'Your wallet is no longer syncing.',
            type: 'success',
          });
        },
      });
    } else {
      // Enable sync - show modal
      setSyncModal(true);
    }
  };

  const handleCopyWalletId = () => {
    if (syncSettings?.walletId) {
      navigator.clipboard.writeText(syncSettings.walletId);
      setAlertModal({
        isOpen: true,
        title: 'Copied!',
        message: 'Wallet ID copied to clipboard.',
        type: 'success',
      });
    }
  };

  return (
    <div className="page-container">
      <Header title="Settings" subtitle="Manage your app" />

      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        {/* App Info */}
        <div className="ios-card p-6 mb-4 text-center">
          <div className="text-6xl mb-4">
            <img src={savenaLogo} alt="Savena Logo" className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-ios-gray-900 dark:text-white mb-2">Savena</h2>
          <p className="text-ios-gray-600 dark:text-ios-gray-400">Virtual Bank App</p>
          <p className="text-sm text-ios-gray-500 dark:text-ios-gray-500 mt-2">Version 1.2.9</p>
        </div>

        {/* Features */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-ios-gray-900 dark:text-white mb-3">Features</h3>
          
          <div className="space-y-4 ios-card dark:bg-ios-gray-800 divide-y divide-ios-gray-200 dark:divide-ios-gray-700">
            <button
              onClick={() => navigate('/currency')}
              className="w-full p-4 flex items-center justify-between hover:bg-ios-gray-50 dark:hover:bg-ios-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-ios-green/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-ios-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-ios-gray-900 dark:text-white">Currency Settings</p>
                  <p className="text-sm text-ios-gray-600 dark:text-ios-gray-400">{currentCurrency.code} - {currentCurrency.name}</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-ios-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => navigate('/recurring')}
              className="w-full p-4 flex items-center justify-between hover:bg-ios-gray-50 dark:hover:bg-ios-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-ios-blue/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-ios-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-ios-gray-900 dark:text-white">Recurring Transactions</p>
                  <p className="text-sm text-ios-gray-600 dark:text-ios-gray-400">Automatic payments & income</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-ios-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => navigate('/credit-cards')}
              className="w-full p-4 flex items-center justify-between hover:bg-ios-gray-50 dark:hover:bg-ios-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-ios-indigo/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-ios-indigo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-ios-gray-900 dark:text-white">Credit Cards</p>
                  <p className="text-sm text-ios-gray-600 dark:text-ios-gray-400">Track card expenses & payments</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-ios-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-ios-purple/10 flex items-center justify-center">
                  {isDark ? (
                    <svg className="w-5 h-5 text-ios-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-ios-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-ios-gray-900 dark:text-white">Appearance</p>
                  <p className="text-sm text-ios-gray-600 dark:text-ios-gray-400">{isDark ? 'Dark' : 'Light'} Mode</p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  isDark ? 'bg-ios-blue' : 'bg-ios-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    isDark ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-ios-gray-900 dark:text-white mb-3">Data Management</h3>
          
          <div className="space-y-4 ios-card divide-y divide-ios-gray-200 dark:divide-ios-gray-700">
            {/* Sync Toggle */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full ${syncEnabled ? 'bg-ios-green/10' : 'bg-ios-gray-100 dark:bg-ios-gray-700'} flex items-center justify-center`}>
                    <svg className={`w-5 h-5 ${syncEnabled ? 'text-ios-green' : 'text-ios-gray-600 dark:text-ios-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-ios-gray-900 dark:text-white">Wallet Sync</p>
                    <p className="text-sm text-ios-gray-600 dark:text-ios-gray-400">
                      {syncEnabled ? 'Syncing with cloud' : 'Enable family sharing'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSyncToggle}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    syncEnabled ? 'bg-ios-green' : 'bg-ios-gray-300 dark:bg-ios-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      syncEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {syncEnabled && syncSettings && (
                <div className="mt-3 space-y-2">
                  <div className="bg-ios-gray-50 dark:bg-ios-gray-700 rounded-ios p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-ios-gray-600 dark:text-ios-gray-400">Wallet ID:</p>
                      <button
                        onClick={handleCopyWalletId}
                        className="text-xs text-ios-blue font-semibold"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="font-mono text-xs text-ios-gray-900 dark:text-white break-all">{syncSettings.walletId}</p>
                  </div>
                  {syncSettings.lastSync && (
                    <p className="text-xs text-ios-gray-600 dark:text-ios-gray-400">
                      Last synced: {new Date(syncSettings.lastSync).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handleImportData}
              className="w-full p-4 flex items-center justify-between hover:bg-ios-gray-50 dark:hover:bg-ios-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-ios-green/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-ios-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-ios-gray-900 dark:text-white">Import Data</p>
                  <p className="text-sm text-ios-gray-600 dark:text-ios-gray-400">Restore from backup JSON</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-ios-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={handleExportData}
              className="w-full p-4 flex items-center justify-between hover:bg-ios-gray-50 dark:hover:bg-ios-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-ios-blue/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-ios-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-ios-gray-900 dark:text-white">Export Data</p>
                  <p className="text-sm text-ios-gray-600 dark:text-ios-gray-400">Download backup as JSON</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-ios-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={handleClearData}
              className="w-full p-4 flex items-center justify-between hover:bg-ios-gray-50 dark:hover:bg-ios-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-ios-red/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-ios-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-ios-red">Clear All Data</p>
                  <p className="text-sm text-ios-gray-600 dark:text-ios-gray-400">Delete all accounts & transactions</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-ios-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* API Configuration */}
        <div className="hidden mb-4">
          <h3 className="text-lg font-bold text-ios-gray-900 mb-3">API Integration</h3>
          
          <div className="ios-card p-4">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-ios-orange/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-ios-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-ios-gray-900 mb-1">Fruitask Developer API</p>
                <p className="text-sm text-ios-gray-600">
                  API integration is ready. Configure your API key in <code className="px-1 py-0.5 bg-ios-gray-100 rounded text-xs">src/services/api.js</code>
                </p>
              </div>
            </div>
            <div className="text-xs text-ios-gray-500 bg-ios-gray-50 p-3 rounded-ios">
              <p className="font-mono">API_BASE_URL: https://api.fruitask.com</p>
              <p className="font-mono mt-1">Status: Not Configured</p>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-ios-gray-900 dark:text-white mb-3">About</h3>
          
          <div className="ios-card p-4">
            <p className="text-sm text-ios-gray-600 dark:text-ios-gray-400 leading-relaxed">
              Savena is designed to help you track your finances. 
              Create multiple accounts, record deposits and withdrawals, setup recurring transactions, and monitor your 
              financial flow with ease. All data is stored locally on your device for privacy 
              and offline access.
            </p>
          </div>
        </div>

        {/* Install PWA */}
        <div className="mb-20">
          <div className="ios-card p-6 text-center bg-gradient-to-br from-ios-blue to-ios-indigo text-white">
            <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-bold mb-2">Install Savena</h3>
            <p className="text-sm opacity-90 mb-4">
              Add this app to your home screen for a better experience
            </p>
            <div className="text-xs opacity-75">
              Look for the "Add to Home Screen" option in your browser menu
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, title: '', message: '', type: 'info' })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      <ImportOptionsModal
        isOpen={importModal.isOpen}
        onClose={() => setImportModal({ isOpen: false, data: null, summary: null })}
        onMerge={() => {
          setImportModal({ isOpen: false, data: null, summary: null });
          performImport(importModal.data, false);
        }}
        onReplace={() => {
          setImportModal({ isOpen: false, data: null, summary: null });
          performImport(importModal.data, true);
        }}
        importSummary={importModal.summary}
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

      <SyncModal
        isOpen={syncModal}
        onClose={() => setSyncModal(false)}
      />
    </div>
  );
};

export default Settings;
