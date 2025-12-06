import { openDB } from 'idb';
import { nanoid } from 'nanoid';

const DB_NAME = 'savena-credit-cards';
const DB_VERSION = 1;
const STORE_NAME = 'creditCards';

export const initCreditCardDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    },
  });
};

export const creditCardDB = {
  async getAll() {
    const db = await initCreditCardDB();
    return db.getAll(STORE_NAME);
  },

  async getById(id) {
    const db = await initCreditCardDB();
    return db.get(STORE_NAME, id);
  },

  async create(cardData) {
    const db = await initCreditCardDB();
    const card = {
      id: `cc_${nanoid(12)}`,
      name: cardData.name,
      cardNumber: cardData.cardNumber || '', // last 4 digits for display
      maxLimit: parseFloat(cardData.maxLimit) || 0,
      currentBalance: parseFloat(cardData.currentBalance) || 0,
      billingDay: parseInt(cardData.billingDay) || 1,
      color: cardData.color || '#3b82f6',
      notes: cardData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.add(STORE_NAME, card);

    // Trigger sync if enabled
    const syncService = await import('./syncService');
    await syncService.syncService.syncChange('creditCard', card);

    return card;
  },

  async update(id, updates) {
    const db = await initCreditCardDB();
    const card = await db.get(STORE_NAME, id);
    if (!card) throw new Error('Credit card not found');

    const updatedCard = {
      ...card,
      ...updates,
      id: card.id,
      createdAt: card.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await db.put(STORE_NAME, updatedCard);

    // Trigger sync if enabled
    const syncService = await import('./syncService');
    await syncService.syncService.syncChange('creditCard', updatedCard);

    return updatedCard;
  },

  async delete(id) {
    const db = await initCreditCardDB();
    await db.delete(STORE_NAME, id);

    // Trigger sync if enabled
    const syncService = await import('./syncService');
    await syncService.syncService.syncDelete('creditCard', id);

    return { success: true };
  },

  async updateBalance(id, amount, type) {
    const db = await initCreditCardDB();
    const card = await db.get(STORE_NAME, id);
    if (!card) throw new Error('Credit card not found');

    const amountFloat = parseFloat(amount);
    
    if (type === 'charge') {
      // Increase balance (spending)
      card.currentBalance += amountFloat;
    } else if (type === 'payment') {
      // Decrease balance (payment)
      card.currentBalance -= amountFloat;
    }

    // Ensure balance doesn't go negative
    card.currentBalance = Math.max(0, card.currentBalance);
    card.updatedAt = new Date().toISOString();

    await db.put(STORE_NAME, card);

    // Trigger sync if enabled
    const syncService = await import('./syncService');
    await syncService.syncService.syncChange('creditCard', card);

    return card;
  },
};

export default creditCardDB;
