// App configuration constants

export const APP_NAME = 'Savena';
export const APP_VERSION = '1.2.0';
export const APP_DESCRIPTION = 'Virtual Bank App - Track your finances';

// Database configuration
export const DB_NAME = 'savena-db';
export const DB_VERSION = 1;

// Account colors
export const ACCOUNT_COLORS = [
  { value: 'bg-ios-blue', label: 'Blue', color: '#007AFF' },
  { value: 'bg-ios-green', label: 'Green', color: '#34C759' },
  { value: 'bg-ios-purple', label: 'Purple', color: '#AF52DE' },
  { value: 'bg-ios-pink', label: 'Pink', color: '#FF2D55' },
  { value: 'bg-ios-orange', label: 'Orange', color: '#FF9500' },
  { value: 'bg-ios-teal', label: 'Teal', color: '#5AC8FA' },
  { value: 'bg-ios-red', label: 'Red', color: '#FF3B30' },
  { value: 'bg-ios-indigo', label: 'Indigo', color: '#5856D6' },
  { value: 'bg-ios-yellow', label: 'Yellow', color: '#FFCC00' },
];

// Account icons
export const ACCOUNT_ICONS = [
  '💳', '🏦', '💰', '💵', '💸', 
  '🏧', '💴', '💶', '💷', '💲',
  '🪙', '💎', '🎯', '📈', '💼',
];

// Transaction categories
export const DEPOSIT_CATEGORIES = [
  { value: 'salary', label: 'Salary', icon: '💼' },
  { value: 'business', label: 'Business', icon: '🏢' },
  { value: 'investment', label: 'Investment', icon: '📈' },
  { value: 'gift', label: 'Gift', icon: '🎁' },
  { value: 'refund', label: 'Refund', icon: '↩️' },
  { value: 'other', label: 'Other', icon: '💰' },
];

export const WITHDRAWAL_CATEGORIES = [
  { value: 'food', label: 'Food & Dining', icon: '🍔' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'transport', label: 'Transportation', icon: '🚗' },
  { value: 'bills', label: 'Bills & Utilities', icon: '📄' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'health', label: 'Health', icon: '🏥' },
  { value: 'education', label: 'Education', icon: '📚' },
  { value: 'travel', label: 'Travel', icon: '✈️' },
  { value: 'gifts', label: 'Gifts', icon: '🎁' },
  { value: 'other', label: 'Other', icon: '💸' },
];

// Sort options
export const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'createdAt', label: 'Created' },
];

export const SORT_ORDER_OPTIONS = [
  { value: 'desc', label: 'Newest First' },
  { value: 'asc', label: 'Oldest First' },
];

// Transaction types
export const TRANSACTION_TYPES = {
  DEPOSIT: 'deposit',
  WITHDRAW: 'withdraw',
};

// API endpoints (when using Fruitask Developer API)
export const API_ENDPOINTS = {
  ACCOUNTS: '/accounts',
  TRANSACTIONS: '/transactions',
  SYNC: '/sync',
  AUTH: '/auth',
};

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'savena_theme',
  LAST_SYNC: 'savena_last_sync',
  USER_PREFERENCES: 'savena_preferences',
};

// Currency options
export const CURRENCIES = [
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
  { value: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { value: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
];

// Default currency
export const DEFAULT_CURRENCY = 'USD';
