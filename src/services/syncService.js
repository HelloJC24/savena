import { nanoid } from 'nanoid';

// Cloudflare Worker API endpoint
const API_URL = 'https://savena-sync-api.johncharlie1272.workers.dev';

class SyncService {
  constructor() {
    this.syncInterval = null;
    this.isInitialized = false;
  }

  // Generate a new wallet ID
  generateWalletId() {
    return `wallet_${nanoid(12)}`;
  }

  // Get current sync settings from localStorage
  getSyncSettings() {
    const settings = localStorage.getItem('savena_sync_settings');
    return settings ? JSON.parse(settings) : null;
  }

  // Save sync settings
  saveSyncSettings(settings) {
    localStorage.setItem('savena_sync_settings', JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('sync-settings-changed', { detail: settings }));
  }

  // Clear sync settings
  clearSyncSettings() {
    localStorage.removeItem('savena_sync_settings');
    window.dispatchEvent(new CustomEvent('sync-settings-changed', { detail: null }));
  }

  // Check if sync is enabled
  isSyncEnabled() {
    const settings = this.getSyncSettings();
    return settings && settings.enabled && settings.walletId;
  }

  // Create a new wallet and start syncing
  async createWallet(password) {
    try {
      const walletId = this.generateWalletId();
      
      // Get current local data
      const { accountDB, transactionDB } = await import('./db');
      const { recurringDB } = await import('./recurringDB');
      const { creditCardDB } = await import('./creditCardDB');
      const { ccTransactionDB } = await import('./ccTransactionDB');
      const accounts = await accountDB.getAll();
      const transactions = await transactionDB.getAll();
      const recurring = await recurringDB.getAll();
      const creditCards = await creditCardDB.getAll();
      const ccTransactions = await ccTransactionDB.getAll();

      // Create wallet on server
      const response = await fetch(`${API_URL}/api/wallet/${walletId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`
        },
        body: JSON.stringify({
          accounts,
          transactions,
          recurring,
          creditCards,
          ccTransactions
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create wallet');
      }

      // Save settings
      const settings = {
        enabled: true,
        walletId,
        hasPassword: !!password,
        createdAt: new Date().toISOString(),
        lastSync: new Date().toISOString()
      };
      this.saveSyncSettings(settings);

      // Start auto-sync
      await this.startSync();

      return { success: true, walletId };
    } catch (error) {
      console.error('Error creating wallet:', error);
      return { success: false, error: error.message };
    }
  }

  // Join an existing wallet
  async joinWallet(walletId, password) {
    try {
      // Fetch wallet data from server
      const response = await fetch(`${API_URL}/api/wallet/${walletId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${password}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join wallet');
      }

      const walletData = await response.json();

      // Import data to local IndexedDB
      const { accountDB, transactionDB, initDB } = await import('./db');
      const { recurringDB, initRecurringDB } = await import('./recurringDB');
      const { creditCardDB, initCreditCardDB } = await import('./creditCardDB');
      const { ccTransactionDB, initCCTransactionDB } = await import('./ccTransactionDB');
      
      // Get direct database access to preserve IDs
      const db = await initDB();
      const recurringDb = await initRecurringDB();
      const ccDb = await initCreditCardDB();
      const ccTxnDb = await initCCTransactionDB();
      
      // Clear existing data
      const existingAccounts = await accountDB.getAll();
      const existingTransactions = await transactionDB.getAll();
      const existingRecurring = await recurringDB.getAll();
      const existingCreditCards = await creditCardDB.getAll();
      const existingCCTransactions = await ccTransactionDB.getAll();
      
      for (const acc of existingAccounts) {
        await accountDB.delete(acc.id);
      }
      for (const txn of existingTransactions) {
        await transactionDB.delete(txn.id);
      }
      for (const rec of existingRecurring) {
        await recurringDB.delete(rec.id);
      }
      for (const cc of existingCreditCards) {
        await creditCardDB.delete(cc.id);
      }
      for (const cctxn of existingCCTransactions) {
        await ccTransactionDB.delete(cctxn.id);
      }

      // Import wallet data with ORIGINAL IDs preserved using direct db.put
      for (const acc of walletData.accounts || []) {
        await db.put('accounts', acc);
      }
      for (const txn of walletData.transactions || []) {
        await db.put('transactions', txn);
      }
      for (const rec of walletData.recurring || []) {
        await recurringDb.put('recurring', rec);
      }
      for (const cc of walletData.creditCards || []) {
        await ccDb.put('creditCards', cc);
      }
      for (const cctxn of walletData.ccTransactions || []) {
        await ccTxnDb.put('ccTransactions', cctxn);
      }

      // Save settings
      const settings = {
        enabled: true,
        walletId,
        hasPassword: !!password,
        joinedAt: new Date().toISOString(),
        lastSync: new Date().toISOString()
      };
      this.saveSyncSettings(settings);

      // Start auto-sync
      await this.startSync();

      return { success: true, walletId };
    } catch (error) {
      console.error('Error joining wallet:', error);
      return { success: false, error: error.message };
    }
  }

  // Sync local data to server
  async syncToServer() {
    try {
      const settings = this.getSyncSettings();
      if (!settings || !settings.enabled) {
        return { success: false, error: 'Sync not enabled' };
      }

      // Get password from storage (you'll need to store this securely)
      const password = sessionStorage.getItem('savena_wallet_password');
      if (!password) {
        console.warn('No password in session - skipping sync');
        return { success: false, error: 'No password available' };
      }

      // Get current local data
      const { accountDB, transactionDB } = await import('./db');
      const { recurringDB } = await import('./recurringDB');
      const { creditCardDB } = await import('./creditCardDB');
      const { ccTransactionDB } = await import('./ccTransactionDB');
      const accounts = await accountDB.getAll();
      const transactions = await transactionDB.getAll();
      const recurring = await recurringDB.getAll();
      const creditCards = await creditCardDB.getAll();
      const ccTransactions = await ccTransactionDB.getAll();

      console.log('[Sync Push] Sending to server:', {
        accounts: accounts.length,
        transactions: transactions.length,
        recurring: recurring.length,
        creditCards: creditCards.length,
        ccTransactions: ccTransactions.length
      });

      // Update wallet on server
      const response = await fetch(`${API_URL}/api/wallet/${settings.walletId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`
        },
        body: JSON.stringify({
          accounts,
          transactions,
          recurring,
          creditCards,
          ccTransactions
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sync');
      }

      this.updateLastSyncTime();
      window.dispatchEvent(new CustomEvent('sync-change', { detail: { direction: 'push' } }));
      
      // Small delay then dispatch complete
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('sync-complete'));
      }, 500);

      return { success: true };
    } catch (error) {
      console.error('Error syncing to server:', error);
      window.dispatchEvent(new CustomEvent('sync-error', { detail: error }));
      return { success: false, error: error.message };
    }
  }

  // Start auto-sync (every 10 seconds when online)
  async startSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Initial sync (push then pull)
    try {
      console.log('[Sync] Starting initial sync...');
      await this.syncToServer();
      await this.pullFromServer();
      console.log('[Sync] Initial sync completed');
    } catch (error) {
      console.error('[Sync] Initial sync error:', error);
      // Continue to set up the interval even if initial sync fails
    }

    // Auto-sync every 10 seconds (bidirectional)
    this.syncInterval = setInterval(async () => {
      if (navigator.onLine) {
        try {
          console.log('[Sync] Auto-sync running...');
          await this.syncToServer();
          await this.pullFromServer();
          console.log('[Sync] Auto-sync completed');
        } catch (error) {
          console.error('[Sync] Auto-sync error:', error);
          // Don't throw - let the interval continue
        }
      }
    }, 10000); // 10 seconds

    this.isInitialized = true;
    window.dispatchEvent(new CustomEvent('sync-active'));
    console.log('[Sync] Auto-sync initialized');
    return { success: true };
  }

  // Stop sync
  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isInitialized = false;
    window.dispatchEvent(new CustomEvent('sync-paused'));
  }

  // Disconnect and disable sync
  async disconnect() {
    this.stopSync();
    this.clearSyncSettings();
    sessionStorage.removeItem('savena_wallet_password');
  }

  // Update last sync time
  updateLastSyncTime() {
    const settings = this.getSyncSettings();
    if (settings) {
      settings.lastSync = new Date().toISOString();
      this.saveSyncSettings(settings);
    }
  }

  // Trigger immediate sync (call after create/update/delete operations)
  async syncChange(type, data) {
    if (this.isSyncEnabled()) {
      try {
        console.log('[Sync] Manual sync triggered for:', type);
        await this.syncToServer();
        console.log('[Sync] Manual sync completed');
      } catch (error) {
        console.error('[Sync] Manual sync error:', error);
        // Don't throw - let the operation complete
      }
    }
    return { success: true };
  }

  // Trigger immediate sync (call after delete operations)
  async syncDelete(type, id) {
    if (this.isSyncEnabled()) {
      try {
        console.log('[Sync] Manual sync triggered for delete:', type, id);
        await this.syncToServer();
        console.log('[Sync] Manual sync completed');
      } catch (error) {
        console.error('[Sync] Manual sync error:', error);
        // Don't throw - let the operation complete
      }
    }
    return { success: true };
  }

  // Pull fresh data from server and update local database
  async pullFromServer() {
    try {
      const settings = this.getSyncSettings();
      if (!settings || !settings.enabled) {
        return { success: false, error: 'Sync not enabled' };
      }

      const password = sessionStorage.getItem('savena_wallet_password');
      if (!password) {
        return { success: false, error: 'No password available' };
      }

      window.dispatchEvent(new CustomEvent('sync-active'));

      // Fetch wallet data from server
      const response = await fetch(`${API_URL}/api/wallet/${settings.walletId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${password}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch data');
      }

      const walletData = await response.json();

      // Update local IndexedDB without clearing existing data
      const { accountDB, transactionDB, initDB } = await import('./db');
      const { recurringDB, initRecurringDB } = await import('./recurringDB');
      const { creditCardDB, initCreditCardDB } = await import('./creditCardDB');
      const { ccTransactionDB, initCCTransactionDB } = await import('./ccTransactionDB');
      const db = await initDB();
      const recurringDb = await initRecurringDB();
      const ccDb = await initCreditCardDB();
      const ccTxnDb = await initCCTransactionDB();
      
      console.log('[Sync Pull] Received from server:', {
        accounts: walletData.accounts?.length || 0,
        transactions: walletData.transactions?.length || 0,
        recurring: walletData.recurring?.length || 0,
        creditCards: walletData.creditCards?.length || 0,
        ccTransactions: walletData.ccTransactions?.length || 0
      });
      
      // Merge accounts (update existing, add new) - use direct db.put to avoid triggering sync
      let accountsUpdated = 0;
      let accountsAdded = 0;
      for (const acc of walletData.accounts || []) {
        const existing = await accountDB.getById(acc.id);
        if (existing) {
          if (new Date(acc.updatedAt) > new Date(existing.updatedAt)) {
            console.log('[Sync Pull] Updating account:', acc.id, acc.name, 'balance:', acc.balance);
            await db.put('accounts', acc);
            accountsUpdated++;
          }
        } else {
          console.log('[Sync Pull] Adding new account:', acc.id, acc.name);
          await db.put('accounts', acc);
          accountsAdded++;
        }
      }
      if (accountsUpdated > 0 || accountsAdded > 0) {
        console.log(`[Sync Pull] Accounts - Updated: ${accountsUpdated}, Added: ${accountsAdded}`);
      }

      // Merge transactions (update existing, add new) - use direct db.put
      let transactionsAdded = 0;
      for (const txn of walletData.transactions || []) {
        const existing = await transactionDB.getById(txn.id);
        if (!existing) {
          console.log('[Sync Pull] Adding new transaction:', txn.id, txn.type, txn.amount);
          await db.put('transactions', txn);
          transactionsAdded++;
        }
      }
      if (transactionsAdded > 0) {
        console.log(`[Sync Pull] Transactions - Added: ${transactionsAdded}`);
      }

      // Merge recurring transactions (update existing, add new)
      for (const rec of walletData.recurring || []) {
        const existing = await recurringDB.getById(rec.id);
        if (existing) {
          // Update if server version is newer
          if (new Date(rec.updatedAt || rec.createdAt) > new Date(existing.updatedAt || existing.createdAt)) {
            await recurringDb.put('recurring', rec);
          }
        } else {
          // Create new recurring transaction with existing ID
          await recurringDb.put('recurring', rec);
        }
      }

      // Merge credit cards (update existing, add new)
      for (const cc of walletData.creditCards || []) {
        const existing = await creditCardDB.getById(cc.id);
        if (existing) {
          // Update if server version is newer
          if (new Date(cc.updatedAt) > new Date(existing.updatedAt)) {
            await ccDb.put('creditCards', cc);
          }
        } else {
          // Create new credit card with existing ID
          await ccDb.put('creditCards', cc);
        }
      }

      // Merge credit card transactions (update existing, add new)
      for (const cctxn of walletData.ccTransactions || []) {
        const existing = await ccTransactionDB.getById(cctxn.id);
        if (!existing) {
          // Create new credit card transaction with existing ID
          // Note: linkedTransactionId may reference a transaction that will be synced separately
          await ccTxnDb.put('ccTransactions', cctxn);
        }
      }

      this.updateLastSyncTime();
      window.dispatchEvent(new CustomEvent('sync-change', { detail: { direction: 'pull' } }));
      
      // Dispatch event to notify components to reload their data
      window.dispatchEvent(new CustomEvent('data-updated'));
      
      // Small delay then dispatch complete
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('sync-complete'));
      }, 500);

      return { success: true };
    } catch (error) {
      console.error('Error pulling from server:', error);
      window.dispatchEvent(new CustomEvent('sync-error', { detail: error }));
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const syncService = new SyncService();
export default syncService;
