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
      const accounts = await accountDB.getAll();
      const transactions = await transactionDB.getAll();

      // Create wallet on server
      const response = await fetch(`${API_URL}/api/wallet/${walletId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`
        },
        body: JSON.stringify({
          accounts,
          transactions
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
      const { accountDB, transactionDB } = await import('./db');
      const { recurringDB } = await import('./recurringDB');
      
      // Clear existing data
      const existingAccounts = await accountDB.getAll();
      const existingTransactions = await transactionDB.getAll();
      const existingRecurring = await recurringDB.getAll();
      
      for (const acc of existingAccounts) {
        await accountDB.delete(acc.id);
      }
      for (const txn of existingTransactions) {
        await transactionDB.delete(txn.id);
      }
      for (const rec of existingRecurring) {
        await recurringDB.delete(rec.id);
      }

      // Import wallet data
      for (const acc of walletData.accounts || []) {
        const { id, ...data } = acc;
        await accountDB.create(data);
      }
      for (const txn of walletData.transactions || []) {
        const { id, ...data } = txn;
        await transactionDB.create(data);
      }
      for (const rec of walletData.recurring || []) {
        const { id, ...data } = rec;
        await recurringDB.create(data);
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
      const accounts = await accountDB.getAll();
      const transactions = await transactionDB.getAll();
      const recurring = await recurringDB.getAll();

      // console.log('Pushing data to server:', {
      //   accounts: accounts.length,
      //   transactions: transactions.length,
      //   recurring: recurring.length
      // });

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
          recurring
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
    await this.syncToServer();
    await this.pullFromServer();

    // Auto-sync every 10 seconds (bidirectional)
    this.syncInterval = setInterval(async () => {
      if (navigator.onLine) {
        await this.syncToServer();
        await this.pullFromServer();
      }
    }, 10000); // 10 seconds

    this.isInitialized = true;
    window.dispatchEvent(new CustomEvent('sync-active'));
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
      await this.syncToServer();
    }
    return { success: true };
  }

  // Trigger immediate sync (call after delete operations)
  async syncDelete(type, id) {
    if (this.isSyncEnabled()) {
      await this.syncToServer();
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
      const db = await initDB();
      const recurringDb = await initRecurringDB();
      
      // console.log('Pulling data from server:', {
      //   accounts: walletData.accounts?.length || 0,
      //   transactions: walletData.transactions?.length || 0,
      //   recurring: walletData.recurring?.length || 0
      // });
      
      // Merge accounts (update existing, add new) - use direct db.put to avoid triggering sync
      for (const acc of walletData.accounts || []) {
        const existing = await accountDB.getById(acc.id);
        if (existing) {
          if (new Date(acc.updatedAt) > new Date(existing.updatedAt)) {
            // Use direct db.put to avoid triggering sync and balance recalculation
            // console.log('Updating account:', acc.id);
            await db.put('accounts', acc);
          }
        } else {
          // Create new account with existing ID
          // console.log('Adding new account:', acc.id);
          await db.put('accounts', acc);
        }
      }

      // Merge transactions (update existing, add new) - use direct db.put
      for (const txn of walletData.transactions || []) {
        const existing = await transactionDB.getById(txn.id);
        if (!existing) {
          // Create new transaction with existing ID - no balance update needed as accounts already synced
          // console.log('Adding new transaction:', txn.id, txn.description || txn.type);
          await db.put('transactions', txn);
        }
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

      this.updateLastSyncTime();
      window.dispatchEvent(new CustomEvent('sync-change', { detail: { direction: 'pull' } }));
      
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
