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
      
      // Clear existing data
      const existingAccounts = await accountDB.getAll();
      const existingTransactions = await transactionDB.getAll();
      
      for (const acc of existingAccounts) {
        await accountDB.delete(acc.id);
      }
      for (const txn of existingTransactions) {
        await transactionDB.delete(txn.id);
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
      const accounts = await accountDB.getAll();
      const transactions = await transactionDB.getAll();

      // Update wallet on server
      const response = await fetch(`${API_URL}/api/wallet/${settings.walletId}`, {
        method: 'PUT',
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
        throw new Error(error.error || 'Failed to sync');
      }

      this.updateLastSyncTime();
      window.dispatchEvent(new CustomEvent('sync-change', { detail: { direction: 'push' } }));

      return { success: true };
    } catch (error) {
      console.error('Error syncing to server:', error);
      window.dispatchEvent(new CustomEvent('sync-error', { detail: error }));
      return { success: false, error: error.message };
    }
  }

  // Start auto-sync (every 30 seconds when online)
  async startSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Initial sync
    await this.syncToServer();

    // Auto-sync every 30 seconds
    this.syncInterval = setInterval(async () => {
      if (navigator.onLine) {
        await this.syncToServer();
      }
    }, 30000); // 30 seconds

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
}

// Export singleton instance
export const syncService = new SyncService();
export default syncService;
