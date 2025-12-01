import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import AlertModal from '../components/AlertModal';
import { transactionDB, accountDB } from '../services/db';
import { format } from 'date-fns';
import { useModal } from '../hooks/useModal';

const NewTransaction = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const { alertModal, showAlert, hideAlert } = useModal();
  const [formData, setFormData] = useState({
    type: searchParams.get('type') || 'deposit',
    accountId: '',
    amount: '',
    description: '',
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const allAccounts = await accountDB.getAll();
      setAccounts(allAccounts);
      
      // Auto-select first account if only one exists
      if (allAccounts.length === 1) {
        setFormData(prev => ({ ...prev, accountId: allAccounts[0].id.toString() }));
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (accounts.length === 0) {
      showAlert('No Accounts', 'Please create an account first', 'warning');
      setTimeout(() => navigate('/accounts/new'), 1500);
      return;
    }

    setLoading(true);

    try {
      await transactionDB.create({
        type: formData.type,
        accountId: parseInt(formData.accountId),
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        date: formData.date,
      });

      navigate('/transactions');
    } catch (error) {
      console.error('Error creating transaction:', error);
      showAlert('Error', 'Failed to create transaction. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const categoryOptions = {
    deposit: [
      { value: 'salary', label: 'Salary' },
      { value: 'business', label: 'Business' },
      { value: 'investment', label: 'Investment' },
      { value: 'gift', label: 'Gift' },
      { value: 'other', label: 'Other' },
    ],
    withdraw: [
      { value: 'food', label: 'Food & Dining' },
      { value: 'shopping', label: 'Shopping' },
      { value: 'transport', label: 'Transportation' },
      { value: 'bills', label: 'Bills & Utilities' },
      { value: 'entertainment', label: 'Entertainment' },
      { value: 'health', label: 'Health' },
      { value: 'education', label: 'Education' },
      { value: 'other', label: 'Other' },
    ],
  };

  const isDeposit = formData.type === 'deposit';
  const selectedAccount = accounts.find(acc => acc.id === parseInt(formData.accountId));

  return (
    <div className="page-container">
      <Header 
        title={`New ${isDeposit ? 'Deposit' : 'Withdrawal'}`}
        rightAction={
          <button onClick={() => navigate(-1)} className="text-ios-blue font-medium">
            Cancel
          </button>
        }
      />

      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        {accounts.length === 0 ? (
          <div className="ios-card p-8 text-center">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-xl font-bold text-ios-gray-900 mb-2">No Accounts Yet</h3>
            <p className="text-ios-gray-600 mb-4">Create an account first to add transactions</p>
            <Button variant="primary" onClick={() => navigate('/accounts/new')}>
              Create Account
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Type Toggle */}
            <div className="mb-6">
              <label className="ios-label">Transaction Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('type', 'deposit')}
                  className={`p-4 rounded-ios border-2 transition-all ${
                    isDeposit
                      ? 'border-ios-green bg-ios-green/10 text-ios-green'
                      : 'border-ios-gray-200 text-ios-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="font-semibold">Deposit</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('type', 'withdraw')}
                  className={`p-4 rounded-ios border-2 transition-all ${
                    !isDeposit
                      ? 'border-ios-red bg-ios-red/10 text-ios-red'
                      : 'border-ios-gray-200 text-ios-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                    <span className="font-semibold">Withdraw</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Preview Card */}
            {selectedAccount && formData.amount && (
              <div className="ios-card p-5 mb-6 bg-gradient-to-br from-ios-gray-50 to-ios-gray-100">
                <p className="text-sm text-ios-gray-600 mb-2">{selectedAccount.name}</p>
                <p className={`text-3xl font-bold ${isDeposit ? 'text-ios-green' : 'text-ios-red'}`}>
                  {isDeposit ? '+' : '-'}${parseFloat(formData.amount || 0).toFixed(2)}
                </p>
              </div>
            )}

            <Select
              label="Account"
              value={formData.accountId}
              onChange={(e) => handleChange('accountId', e.target.value)}
              options={accounts.map(acc => ({
                value: acc.id,
                label: `${acc.name} - $${acc.balance.toFixed(2)}`,
              }))}
              placeholder="Select account"
              required
            />

            <Input
              label="Amount"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              placeholder="0.00"
              required
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            <Input
              label="Description"
              type="text"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={`e.g., ${isDeposit ? 'Monthly salary' : 'Grocery shopping'}`}
              required
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              }
            />

            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              options={categoryOptions[formData.type]}
              placeholder="Select category"
            />

            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
              required
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />

            <Button
              type="submit"
              variant={isDeposit ? 'success' : 'danger'}
              fullWidth
              size="lg"
              disabled={loading || !formData.accountId || !formData.amount || !formData.description}
            >
              {loading ? 'Processing...' : `Add ${isDeposit ? 'Deposit' : 'Withdrawal'}`}
            </Button>
          </form>
        )}
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

export default NewTransaction;
