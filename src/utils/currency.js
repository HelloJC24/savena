// Currency formatting utilities
import { getCurrencySettings } from '../services/currencySettings';

export const formatCurrency = (amount, currency = null, locale = null) => {
  // If no currency specified, use user's settings
  if (!currency || !locale) {
    const settings = getCurrencySettings();
    currency = settings.code;
    locale = settings.locale;
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount || 0);
};

export const formatNumber = (number, decimals = 2) => {
  return parseFloat(number || 0).toFixed(decimals);
};

export const parseCurrency = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Remove currency symbols and commas
    const cleaned = value.replace(/[^0-9.-]+/g, '');
    return parseFloat(cleaned) || 0;
  }
  return 0;
};

export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return ((value / total) * 100).toFixed(1);
};
