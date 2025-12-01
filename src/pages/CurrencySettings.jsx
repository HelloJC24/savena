import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import AlertModal from '../components/AlertModal';
import { CURRENCIES, getCurrencySettings, setCurrencySettings } from '../services/currencySettings';
import { formatCurrency } from '../utils/currency';
import { useModal } from '../hooks/useModal';

const CurrencySettings = () => {
  const navigate = useNavigate();
  const [selectedCurrency, setSelectedCurrency] = useState(getCurrencySettings());
  const [searchQuery, setSearchQuery] = useState('');
  const { alertModal, showAlert, hideAlert } = useModal();

  const handleSave = () => {
    setCurrencySettings(selectedCurrency);
    showAlert('Success', 'Currency updated successfully! The app will refresh.', 'success');
    setTimeout(() => window.location.reload(), 1500);
  };

  const filteredCurrencies = CURRENCIES.filter(currency =>
    currency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sampleAmount = 1234.56;

  return (
    <div className="page-container">
      <Header 
        title="Currency Settings"
        rightAction={
          <button onClick={() => navigate(-1)} className="text-ios-blue font-medium">
            Cancel
          </button>
        }
      />

      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        {/* Current Preview */}
        <div className="ios-card p-6 mb-6 text-center bg-gradient-to-br from-ios-blue to-ios-indigo text-white">
          <p className="text-sm opacity-90 mb-2">Preview</p>
          <h2 className="text-4xl font-bold mb-2">
            {new Intl.NumberFormat(selectedCurrency.locale, {
              style: 'currency',
              currency: selectedCurrency.code,
            }).format(sampleAmount)}
          </h2>
          <p className="text-sm opacity-75">{selectedCurrency.name}</p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search currency..."
              className="w-full px-4 py-3 pl-10 rounded-ios-lg border border-ios-gray-200 focus:border-ios-blue focus:ring-2 focus:ring-ios-blue/20 outline-none transition-all"
            />
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ios-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Currency List */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-ios-gray-600 uppercase mb-3">
            Select Currency
          </h3>
          <div className="ios-card divide-y divide-ios-gray-200">
            {filteredCurrencies.map((currency) => (
              <button
                key={currency.code}
                onClick={() => setSelectedCurrency(currency)}
                className={`w-full p-4 flex items-center justify-between hover:bg-ios-gray-50 transition-colors ${
                  selectedCurrency.code === currency.code ? 'bg-ios-blue/5' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold ${
                    selectedCurrency.code === currency.code 
                      ? 'bg-ios-blue text-white' 
                      : 'bg-ios-gray-100 text-ios-gray-600'
                  }`}>
                    {currency.symbol}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-ios-gray-900">{currency.name}</p>
                    <p className="text-sm text-ios-gray-600">{currency.code}</p>
                  </div>
                </div>
                {selectedCurrency.code === currency.code && (
                  <svg className="w-6 h-6 text-ios-blue" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Info Card */}
        <div className="ios-card p-4 mb-6 bg-ios-blue/5 border border-ios-blue/20">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">ℹ️</div>
            <div>
              <h3 className="font-semibold text-ios-gray-900 mb-1">Currency Display</h3>
              <p className="text-sm text-ios-gray-700">
                All amounts throughout the app will be displayed in your selected currency. 
                This setting is stored locally on your device.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mb-20">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={handleSave}
          >
            Save Currency Settings
          </Button>
        </div>
      </div>

      {/* Modals */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
};

export default CurrencySettings;
