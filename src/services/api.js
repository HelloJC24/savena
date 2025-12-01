// Fruitask Developer API Service
// Ready for integration with actual API endpoints

const API_BASE_URL = 'https://api.fruitask.com'; // Replace with actual Fruitask API URL
const API_KEY = ''; // Set your API key here

class APIService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.apiKey = API_KEY;
  }

  // Helper method for making API requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Account API endpoints
  accounts = {
    // Get all accounts from API
    getAll: async () => {
      return this.request('/accounts', { method: 'GET' });
    },

    // Get single account
    getById: async (id) => {
      return this.request(`/accounts/${id}`, { method: 'GET' });
    },

    // Create new account
    create: async (accountData) => {
      return this.request('/accounts', {
        method: 'POST',
        body: JSON.stringify(accountData),
      });
    },

    // Update account
    update: async (id, updates) => {
      return this.request(`/accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    // Delete account
    delete: async (id) => {
      return this.request(`/accounts/${id}`, { method: 'DELETE' });
    },

    // Sync local account to API
    sync: async (accountData) => {
      return this.request('/accounts/sync', {
        method: 'POST',
        body: JSON.stringify(accountData),
      });
    },
  };

  // Transaction API endpoints
  transactions = {
    // Get all transactions
    getAll: async () => {
      return this.request('/transactions', { method: 'GET' });
    },

    // Get transactions by account
    getByAccount: async (accountId) => {
      return this.request(`/transactions?accountId=${accountId}`, { method: 'GET' });
    },

    // Get single transaction
    getById: async (id) => {
      return this.request(`/transactions/${id}`, { method: 'GET' });
    },

    // Create new transaction
    create: async (transactionData) => {
      return this.request('/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData),
      });
    },

    // Update transaction
    update: async (id, updates) => {
      return this.request(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    // Delete transaction
    delete: async (id) => {
      return this.request(`/transactions/${id}`, { method: 'DELETE' });
    },

    // Filter transactions
    filter: async (filters) => {
      const queryParams = new URLSearchParams(filters).toString();
      return this.request(`/transactions/filter?${queryParams}`, { method: 'GET' });
    },

    // Sync local transaction to API
    sync: async (transactionData) => {
      return this.request('/transactions/sync', {
        method: 'POST',
        body: JSON.stringify(transactionData),
      });
    },
  };

  // Sync operations
  sync = {
    // Full sync - pull from API and merge with local
    fullSync: async () => {
      return this.request('/sync', { method: 'POST' });
    },

    // Push local changes to API
    push: async (data) => {
      return this.request('/sync/push', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    // Pull changes from API
    pull: async (lastSyncTime) => {
      return this.request(`/sync/pull?since=${lastSyncTime}`, { method: 'GET' });
    },
  };

  // User/Auth endpoints (if needed)
  auth = {
    login: async (credentials) => {
      return this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },

    logout: async () => {
      return this.request('/auth/logout', { method: 'POST' });
    },

    register: async (userData) => {
      return this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },
  };
}

// Export singleton instance
export const apiService = new APIService();

// Export class for custom instances if needed
export default APIService;
