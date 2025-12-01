import { openDB } from 'idb';

const DB_NAME = 'savena-recurring-db';
const DB_VERSION = 1;

// Initialize Recurring Transactions DB
export const initRecurringDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('recurring')) {
        const recurringStore = db.createObjectStore('recurring', {
          keyPath: 'id',
          autoIncrement: true,
        });
        recurringStore.createIndex('accountId', 'accountId', { unique: false });
        recurringStore.createIndex('nextDate', 'nextDate', { unique: false });
        recurringStore.createIndex('isActive', 'isActive', { unique: false });
        recurringStore.createIndex('frequency', 'frequency', { unique: false });
      }

      // Store for tracking executed recurring transactions
      if (!db.objectStoreNames.contains('recurring_history')) {
        const historyStore = db.createObjectStore('recurring_history', {
          keyPath: 'id',
          autoIncrement: true,
        });
        historyStore.createIndex('recurringId', 'recurringId', { unique: false });
        historyStore.createIndex('executedAt', 'executedAt', { unique: false });
      }
    },
  });
};

// Recurring Transaction Operations
export const recurringDB = {
  // Create new recurring transaction
  async create(recurringData) {
    const db = await initRecurringDB();
    const recurring = {
      ...recurringData,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastExecuted: null,
    };
    const id = await db.add('recurring', recurring);
    return { ...recurring, id };
  },

  // Get all recurring transactions
  async getAll() {
    const db = await initRecurringDB();
    return db.getAll('recurring');
  },

  // Get active recurring transactions
  async getActive() {
    const db = await initRecurringDB();
    const all = await db.getAll('recurring');
    return all.filter(r => r.isActive);
  },

  // Get by account
  async getByAccount(accountId) {
    const db = await initRecurringDB();
    return db.getAllFromIndex('recurring', 'accountId', accountId);
  },

  // Get by ID
  async getById(id) {
    const db = await initRecurringDB();
    return db.get('recurring', id);
  },

  // Update recurring transaction
  async update(id, updates) {
    const db = await initRecurringDB();
    const recurring = await db.get('recurring', id);
    if (!recurring) throw new Error('Recurring transaction not found');
    
    const updated = {
      ...recurring,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await db.put('recurring', updated);
    return updated;
  },

  // Delete recurring transaction
  async delete(id) {
    const db = await initRecurringDB();
    await db.delete('recurring', id);
  },

  // Toggle active status
  async toggleActive(id) {
    const recurring = await this.getById(id);
    return this.update(id, { isActive: !recurring.isActive });
  },

  // Mark as executed
  async markExecuted(id, transactionId) {
    const db = await initRecurringDB();
    const recurring = await db.get('recurring', id);
    
    // Calculate next execution date
    const nextDate = this.calculateNextDate(recurring.nextDate, recurring.frequency);
    
    // Update recurring record
    await this.update(id, {
      lastExecuted: new Date().toISOString(),
      nextDate: nextDate.toISOString().split('T')[0],
    });

    // Add to history
    await db.add('recurring_history', {
      recurringId: id,
      transactionId,
      executedAt: new Date().toISOString(),
      amount: recurring.amount,
    });
  },

  // Calculate next execution date based on frequency
  calculateNextDate(currentDate, frequency) {
    const date = new Date(currentDate);
    
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'biweekly':
        date.setDate(date.getDate() + 14);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }
    
    return date;
  },

  // Get history for a recurring transaction
  async getHistory(recurringId) {
    const db = await initRecurringDB();
    const all = await db.getAllFromIndex('recurring_history', 'recurringId', recurringId);
    return all.sort((a, b) => new Date(b.executedAt) - new Date(a.executedAt));
  },
};

// Initialize database
initRecurringDB().catch(console.error);
