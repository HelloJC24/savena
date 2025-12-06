import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '../components/Button';
import AlertModal from '../components/AlertModal';
import { creditCardDB } from '../services/creditCardDB';
import { formatCurrency } from '../utils/currency';

const CARD_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Green', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Black', value: '#1f2937' },
];

const CreditCardForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = id && id !== 'new';

  const [formData, setFormData] = useState({
    name: '',
    cardNumber: '',
    maxLimit: '',
    currentBalance: '',
    billingDay: '1',
    color: '#3b82f6',
    notes: '',
  });

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    if (isEditing) {
      loadCard();
    }
  }, [id]);

  const loadCard = async () => {
    try {
      const card = await creditCardDB.getById(id);
      if (card) {
        setFormData({
          name: card.name,
          cardNumber: card.cardNumber || '',
          maxLimit: card.maxLimit.toString(),
          currentBalance: card.currentBalance.toString(),
          billingDay: card.billingDay.toString(),
          color: card.color,
          notes: card.notes || '',
        });
      } else {
        setAlertModal({
          isOpen: true,
          title: 'Error',
          message: 'Credit card not found',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error loading credit card:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setAlertModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please enter a card name',
        type: 'error',
      });
      return false;
    }

    if (!formData.maxLimit || parseFloat(formData.maxLimit) <= 0) {
      setAlertModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please enter a valid credit limit',
        type: 'error',
      });
      return false;
    }

    if (parseFloat(formData.currentBalance) < 0) {
      setAlertModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Current balance cannot be negative',
        type: 'error',
      });
      return false;
    }

    if (parseFloat(formData.currentBalance) > parseFloat(formData.maxLimit)) {
      setAlertModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Current balance cannot exceed credit limit',
        type: 'error',
      });
      return false;
    }

    const billingDay = parseInt(formData.billingDay);
    if (billingDay < 1 || billingDay > 31) {
      setAlertModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Billing day must be between 1 and 31',
        type: 'error',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      if (isEditing) {
        await creditCardDB.update(id, {
          name: formData.name.trim(),
          cardNumber: formData.cardNumber.trim(),
          maxLimit: parseFloat(formData.maxLimit),
          billingDay: parseInt(formData.billingDay),
          color: formData.color,
          notes: formData.notes.trim(),
        });

        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'Credit card updated successfully',
          type: 'success',
        });
      } else {
        await creditCardDB.create({
          name: formData.name.trim(),
          cardNumber: formData.cardNumber.trim(),
          maxLimit: parseFloat(formData.maxLimit),
          currentBalance: parseFloat(formData.currentBalance) || 0,
          billingDay: parseInt(formData.billingDay),
          color: formData.color,
          notes: formData.notes.trim(),
        });

        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'Credit card added successfully',
          type: 'success',
        });
      }

      setTimeout(() => {
        navigate('/credit-cards');
      }, 1500);
    } catch (error) {
      console.error('Error saving credit card:', error);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to save credit card. Please try again.',
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

  return (
    <div className="page-container">
      <Header title={isEditing ? 'Edit Credit Card' : 'New Credit Card'} />

      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card Preview */}
          <div
            className="ios-card p-6 text-white"
            style={{
              background: `linear-gradient(135deg, ${formData.color}dd 0%, ${formData.color} 100%)`,
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm opacity-80 mb-1">Card Name</p>
                <h3 className="text-xl font-bold">{formData.name || 'Card Name'}</h3>
              </div>
              <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            {formData.cardNumber && (
              <p className="text-lg mb-4">•••• {formData.cardNumber}</p>
            )}
            <div className="flex justify-between text-sm opacity-90">
              <span>Limit: {formData.maxLimit ? formatCurrency(parseFloat(formData.maxLimit)) : formatCurrency(0)}</span>
              <span>Due: Day {formData.billingDay}</span>
            </div>
          </div>

          {/* Form Fields */}
          <div className="ios-card p-4 space-y-4">
            <Input
              label="Card Name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Visa Gold, Mastercard"
              required
            />

            <Input
              label="Last 4 Digits (Optional)"
              value={formData.cardNumber}
              onChange={(e) => handleChange('cardNumber', e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="1234"
              maxLength={4}
            />

            <Input
              label="Credit Limit"
              type="number"
              value={formData.maxLimit}
              onChange={(e) => handleChange('maxLimit', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />

            {!isEditing && (
              <Input
                label="Current Balance"
                type="number"
                value={formData.currentBalance}
                onChange={(e) => handleChange('currentBalance', e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                helpText="If you already have a balance on this card"
              />
            )}

            <Input
              label="Billing Day of Month"
              type="number"
              value={formData.billingDay}
              onChange={(e) => handleChange('billingDay', e.target.value)}
              placeholder="1"
              min="1"
              max="31"
              required
            />

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium text-ios-gray-700 dark:text-ios-gray-300 mb-2">
                Card Color
              </label>
              <div className="grid grid-cols-5 gap-3">
                {CARD_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleChange('color', color.value)}
                    className={`h-12 rounded-ios-lg transition-all ${
                      formData.color === color.value
                        ? 'ring-4 ring-ios-blue ring-offset-2 dark:ring-offset-ios-gray-900'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ios-gray-700 dark:text-ios-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional information about this card..."
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
              onClick={() => navigate('/credit-cards')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" fullWidth disabled={submitting}>
              {submitting ? 'Saving...' : isEditing ? 'Update Card' : 'Add Card'}
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

export default CreditCardForm;
