import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import AlertModal from '../components/AlertModal';
import { creditCardDB } from '../services/creditCardDB';
import { ccTransactionDB } from '../services/ccTransactionDB';
import { accountDB } from '../services/db';
import { formatCurrency } from '../utils/currency';

const CATEGORIES = [
  'Groceries',
  'Dining',
  'Shopping',
  'Transportation',
  'Entertainment',
  'Bills',
  'Healthcare',
  'Travel',
  'Gas',
  'Other',
];

const CCTransactionForm = () => {
  const navigate = useNavigate();
  const { id, type } = useParams(); // id is credit card ID, type is 'charge' or 'payment'
  const isCharge = type === 'charge';

  const [card, setCard] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: 'Other',
    date: new Date().toISOString().split('T')[0],
    accountId: '',
    notes: '',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [cardData, accountsData] = await Promise.all([
        creditCardDB.getById(id),
        accountDB.getAll(),
      ]);

      if (!cardData) {
        setAlertModal({
          isOpen: true,
          title: 'Error',
          message: 'Credit card not found',
          type: 'error',
        });
        setTimeout(() => navigate('/credit-cards'), 2000);
        return;
      }

      setCard(cardData);
      setAccounts(accountsData);

      // Set default account if making a payment
      if (!isCharge && accountsData.length > 0) {
        setFormData(prev => ({ ...prev, accountId: accountsData[0].id }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setAlertModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please enter a valid amount',
        type: 'error',
      });
      return false;
    }

    if (!formData.description.trim()) {
      setAlertModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please enter a description',
        type: 'error',
      });
      return false;
    }

    if (!isCharge && !formData.accountId) {
      setAlertModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please select an account to pay from',
        type: 'error',
      });
      return false;
    }

    // Check if payment amount exceeds credit card balance
    if (!isCharge && parseFloat(formData.amount) > card.currentBalance) {
      setAlertModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Payment amount cannot exceed current balance',
        type: 'error',
      });
      return false;
    }

    // Check if payment amount exceeds account balance
    if (!isCharge && formData.accountId) {
      const account = accounts.find(a => a.id === formData.accountId);
      if (account && parseFloat(formData.amount) > account.balance) {
        setAlertModal({
          isOpen: true,
          title: 'Insufficient Funds',
          message: `The selected account only has ${account.balance.toLocaleString()} available`,
          type: 'error',
        });
        return false;
      }
    }

    // Check if charge would exceed credit limit
    if (isCharge) {
      const newBalance = card.currentBalance + parseFloat(formData.amount);
      if (newBalance > card.maxLimit) {
        setAlertModal({
          isOpen: true,
          title: 'Credit Limit Exceeded',
          message: `This charge would exceed your credit limit of ${card.maxLimit.toLocaleString()}`,
          type: 'error',
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      await ccTransactionDB.create({
        type: isCharge ? 'charge' : 'payment',
        creditCardId: id,
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        category: isCharge ? formData.category : 'Payment',
        date: new Date(formData.date).toISOString(),
        accountId: !isCharge ? formData.accountId : null,
        notes: formData.notes.trim(),
      });

      setAlertModal({
        isOpen: true,
        title: 'Success',
        message: `${isCharge ? 'Charge' : 'Payment'} recorded successfully`,
        type: 'success',
      });

      setTimeout(() => {
        navigate(`/credit-cards/${id}`);
      }, 1500);
    } catch (error) {
      console.error('Error saving transaction:', error);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: error.message || 'Failed to save transaction. Please try again.',
        type: 'error',
      });
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ios-blue mx-auto"></div>
          <p className="mt-4 text-ios-gray-600 dark:text-ios-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!card) return null;

  const available = card.maxLimit - card.currentBalance;

  return (
    <div className="page-container">
      <Header title={isCharge ? 'New Charge' : 'Make Payment'} />

      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        {/* Card Info */}
        <div
          className="ios-card p-4 mb-6 text-white"
          style={{
            background: `linear-gradient(135deg, ${card.color}dd 0%, ${card.color} 100%)`,
          }}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-80">{ isCharge ? 'Available Credit' : 'Current Balance'}</p>
              <p className="text-2xl font-bold">
                {isCharge ? formatCurrency(available) : formatCurrency(card.currentBalance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">{card.name}</p>
              {card.cardNumber && (
                <p className="text-sm opacity-80">•••• {card.cardNumber}</p>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="ios-card p-4 space-y-4">
            <Input
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              required
              autoFocus
            />

            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={isCharge ? 'e.g., Grocery Store' : 'e.g., Monthly Payment'}
              required
            />

            {isCharge && (
              <Select
                label="Category"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            )}

            {!isCharge && (
              <Select
                label="Pay From Account"
                value={formData.accountId}
                onChange={(e) => handleChange('accountId', e.target.value)}
                required
              >
                <option value="">Select an account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({formatCurrency(account.balance)})
                  </option>
                ))}
              </Select>
            )}

            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-ios-gray-700 dark:text-ios-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional details..."
                rows={3}
                className="w-full px-4 py-3 rounded-ios bg-ios-gray-50 dark:bg-ios-gray-800 border border-ios-gray-200 dark:border-ios-gray-700 text-ios-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ios-blue"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => navigate(`/credit-cards/${id}`)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              fullWidth
              disabled={submitting}
              variant={isCharge ? 'primary' : 'primary'}
            >
              {submitting ? 'Saving...' : isCharge ? 'Record Charge' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </div>

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, title: '', message: '', type: 'info' })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
};

export default CCTransactionForm;
