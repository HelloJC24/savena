import { openDB } from 'idb';
import { nanoid } from 'nanoid';

const DB_NAME = 'savena-credit-card-transactions';
const DB_VERSION = 1;
const STORE_NAME = 'ccTransactions';

export const initCCTransactionDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('creditCardId', 'creditCardId', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    },
  });
};

export const ccTransactionDB = {
  async getAll() {
    const db = await initCCTransactionDB();
    return db.getAll(STORE_NAME);
  },

  async getById(id) {
    const db = await initCCTransactionDB();
    return db.get(STORE_NAME, id);
  },

  async getByCreditCard(creditCardId) {
    const db = await initCCTransactionDB();
    const allTransactions = await db.getAllFromIndex(STORE_NAME, 'creditCardId', creditCardId);
    return allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async create(transactionData) {
    const db = await initCCTransactionDB();
    
    const transaction = {
      id: `cctxn_${nanoid(12)}`,
      type: transactionData.type, // 'charge' or 'payment'
      creditCardId: transactionData.creditCardId,
      amount: parseFloat(transactionData.amount),
      description: transactionData.description || '',
      category: transactionData.category || 'Other',
      date: transactionData.date || new Date().toISOString(),
      accountId: transactionData.accountId || null, // For payments from account
      notes: transactionData.notes || '',
      createdAt: new Date().toISOString(),
    };

    await db.add(STORE_NAME, transaction);

    // Update credit card balance
    const creditCardDB = await import('./creditCardDB');
    await creditCardDB.creditCardDB.updateBalance(
      transaction.creditCardId,
      transaction.amount,
      transaction.type
    );

    // If payment from account, update account balance
    if (transaction.type === 'payment' && transaction.accountId) {
      const accountDB = await import('./db');
      const account = await accountDB.accountDB.getById(transaction.accountId);
      if (account) {
        await accountDB.accountDB.update(account.id, {
          balance: account.balance - transaction.amount
        });
      }
    }

    // Trigger sync if enabled
    const syncService = await import('./syncService');
    await syncService.syncService.syncChange('ccTransaction', transaction);

    return transaction;
  },

  async update(id, updates) {
    const db = await initCCTransactionDB();
    const transaction = await db.get(STORE_NAME, id);
    if (!transaction) throw new Error('Credit card transaction not found');

    // Revert old balance change
    const creditCardDB = await import('./creditCardDB');
    const reverseType = transaction.type === 'charge' ? 'payment' : 'charge';
    await creditCardDB.creditCardDB.updateBalance(
      transaction.creditCardId,
      transaction.amount,
      reverseType
    );

    // Revert account balance if it was a payment
    if (transaction.type === 'payment' && transaction.accountId) {
      const accountDB = await import('./db');
      const account = await accountDB.accountDB.getById(transaction.accountId);
      if (account) {
        await accountDB.accountDB.update(account.id, {
          balance: account.balance + transaction.amount
        });
      }
    }

    const updatedTransaction = {
      ...transaction,
      ...updates,
      id: transaction.id,
      createdAt: transaction.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await db.put(STORE_NAME, updatedTransaction);

    // Apply new balance change
    await creditCardDB.creditCardDB.updateBalance(
      updatedTransaction.creditCardId,
      updatedTransaction.amount,
      updatedTransaction.type
    );

    // Apply new account balance if it's a payment
    if (updatedTransaction.type === 'payment' && updatedTransaction.accountId) {
      const accountDB = await import('./db');
      const account = await accountDB.accountDB.getById(updatedTransaction.accountId);
      if (account) {
        await accountDB.accountDB.update(account.id, {
          balance: account.balance - updatedTransaction.amount
        });
      }
    }

    // Trigger sync if enabled
    const syncService = await import('./syncService');
    await syncService.syncService.syncChange('ccTransaction', updatedTransaction);

    return updatedTransaction;
  },

  async delete(id) {
    const db = await initCCTransactionDB();
    const transaction = await db.get(STORE_NAME, id);
    if (!transaction) throw new Error('Credit card transaction not found');

    // Revert balance change
    const creditCardDB = await import('./creditCardDB');
    const reverseType = transaction.type === 'charge' ? 'payment' : 'charge';
    await creditCardDB.creditCardDB.updateBalance(
      transaction.creditCardId,
      transaction.amount,
      reverseType
    );

    // Revert account balance if it was a payment
    if (transaction.type === 'payment' && transaction.accountId) {
      const accountDB = await import('./db');
      const account = await accountDB.accountDB.getById(transaction.accountId);
      if (account) {
        await accountDB.accountDB.update(account.id, {
          balance: account.balance + transaction.amount
        });
      }
    }

    await db.delete(STORE_NAME, id);

    // Trigger sync if enabled
    const syncService = await import('./syncService');
    await syncService.syncService.syncDelete('ccTransaction', id);

    return { success: true };
  },
};

export default ccTransactionDB;
