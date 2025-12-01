// Currency settings management

const CURRENCY_KEY = 'savena-currency-settings';

export const CURRENCIES = [
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', locale: 'en-PH' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'en-EU' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', locale: 'ko-KR' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', locale: 'en-HK' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', locale: 'th-TH' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', locale: 'en-MY' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', locale: 'id-ID' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', locale: 'vi-VN' },
];

// Default currency is Philippine Peso
const DEFAULT_CURRENCY = {
  code: 'PHP',
  symbol: '₱',
  name: 'Philippine Peso',
  locale: 'en-PH',
};

export const getCurrencySettings = () => {
  try {
    const saved = localStorage.getItem(CURRENCY_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading currency settings:', error);
  }
  return DEFAULT_CURRENCY;
};

export const setCurrencySettings = (currency) => {
  try {
    localStorage.setItem(CURRENCY_KEY, JSON.stringify(currency));
    // Dispatch event for real-time updates
    window.dispatchEvent(new CustomEvent('currency-changed', { detail: currency }));
    return true;
  } catch (error) {
    console.error('Error saving currency settings:', error);
    return false;
  }
};

export const formatCurrencyWithSettings = (amount) => {
  const settings = getCurrencySettings();
  return new Intl.NumberFormat(settings.locale, {
    style: 'currency',
    currency: settings.code,
  }).format(amount || 0);
};
