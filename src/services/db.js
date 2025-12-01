import { openDB } from 'idb';

const DB_NAME = 'savena-db';
const DB_VERSION = 1;

// Initialize IndexedDB
export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Accounts store
      if (!db.objectStoreNames.contains('accounts')) {
        const accountStore = db.createObjectStore('accounts', {
          keyPath: 'id',
          autoIncrement: true,
        });
        accountStore.createIndex('name', 'name', { unique: false });
        accountStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Transactions store
      if (!db.objectStoreNames.contains('transactions')) {
        const transactionStore = db.createObjectStore('transactions', {
          keyPath: 'id',
          autoIncrement: true,
        });
        transactionStore.createIndex('accountId', 'accountId', { unique: false });
        transactionStore.createIndex('type', 'type', { unique: false });
        transactionStore.createIndex('date', 'date', { unique: false });
        transactionStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    },
  });
};

// Account operations
export const accountDB = {
  // Create new account
  async create(accountData) {
    const db = await initDB();
    const account = {
      ...accountData,
      balance: accountData.initialBalance || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const id = await db.add('accounts', account);
    return { ...account, id };
  },

  // Get all accounts
  async getAll() {
    const db = await initDB();
    return db.getAll('accounts');
  },

  // Get account by ID
  async getById(id) {
    const db = await initDB();
    return db.get('accounts', id);
  },

  // Update account
  async update(id, updates) {
    const db = await initDB();
    const account = await db.get('accounts', id);
    if (!account) throw new Error('Account not found');
    
    const updatedAccount = {
      ...account,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await db.put('accounts', updatedAccount);
    return updatedAccount;
  },

  // Delete account
  async delete(id) {
    const db = await initDB();
    await db.delete('accounts', id);
    // Also delete all transactions for this account
    const transactions = await transactionDB.getByAccount(id);
    for (const transaction of transactions) {
      await db.delete('transactions', transaction.id);
    }
  },

  // Update account balance
  async updateBalance(id, amount) {
    const db = await initDB();
    const account = await db.get('accounts', id);
    if (!account) throw new Error('Account not found');
    
    account.balance += amount;
    account.updatedAt = new Date().toISOString();
    await db.put('accounts', account);
    return account;
  },
};

// Transaction operations
export const transactionDB = {
  // Create new transaction
  async create(transactionData) {
    const db = await initDB();
    const transaction = {
      ...transactionData,
      createdAt: new Date().toISOString(),
    };
    
    // Update account balance
    const amount = transaction.type === 'deposit' 
      ? parseFloat(transaction.amount) 
      : -parseFloat(transaction.amount);
    
    await accountDB.updateBalance(transaction.accountId, amount);
    
    const id = await db.add('transactions', transaction);
    return { ...transaction, id };
  },

  // Get all transactions
  async getAll() {
    const db = await initDB();
    const transactions = await db.getAll('transactions');
    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  // Get transactions by account
  async getByAccount(accountId) {
    const db = await initDB();
    const transactions = await db.getAllFromIndex('transactions', 'accountId', accountId);
    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  // Get transaction by ID
  async getById(id) {
    const db = await initDB();
    return db.get('transactions', id);
  },

  // Update transaction
  async update(id, updates) {
    const db = await initDB();
    const oldTransaction = await db.get('transactions', id);
    if (!oldTransaction) throw new Error('Transaction not found');
    
    // Reverse old transaction effect on balance
    const oldAmount = oldTransaction.type === 'deposit' 
      ? -parseFloat(oldTransaction.amount) 
      : parseFloat(oldTransaction.amount);
    await accountDB.updateBalance(oldTransaction.accountId, oldAmount);
    
    // Apply new transaction effect
    const newAmount = updates.type === 'deposit' 
      ? parseFloat(updates.amount) 
      : -parseFloat(updates.amount);
    await accountDB.updateBalance(updates.accountId, newAmount);
    
    const updatedTransaction = {
      ...oldTransaction,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await db.put('transactions', updatedTransaction);
    return updatedTransaction;
  },

  // Delete transaction
  async delete(id) {
    const db = await initDB();
    const transaction = await db.get('transactions', id);
    if (!transaction) throw new Error('Transaction not found');
    
    // Reverse transaction effect on balance
    const amount = transaction.type === 'deposit' 
      ? -parseFloat(transaction.amount) 
      : parseFloat(transaction.amount);
    await accountDB.updateBalance(transaction.accountId, amount);
    
    await db.delete('transactions', id);
  },

  // Filter transactions
  async filter({ accountId, type, startDate, endDate, sortBy = 'date', sortOrder = 'desc' }) {
    let transactions = await this.getAll();
    
    // Filter by account
    if (accountId) {
      transactions = transactions.filter(t => t.accountId === accountId);
    }
    
    // Filter by type
    if (type) {
      transactions = transactions.filter(t => t.type === type);
    }
    
    // Filter by date range
    if (startDate) {
      transactions = transactions.filter(t => new Date(t.date) >= new Date(startDate));
    }
    if (endDate) {
      transactions = transactions.filter(t => new Date(t.date) <= new Date(endDate));
    }
    
    // Sort
    transactions.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'date' || sortBy === 'createdAt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (sortBy === 'amount') {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return transactions;
  },
};

// Initialize database on module load
initDB().catch(console.error);
