import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '../components/Button';
import AlertModal from '../components/AlertModal';
import { accountDB } from '../services/db';
import { useModal } from '../hooks/useModal';

const NewAccount = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { alertModal, showAlert, hideAlert } = useModal();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    initialBalance: '0',
    icon: '💳',
    color: 'bg-ios-blue',
  });

  const colorOptions = [
    { value: 'bg-ios-blue', label: 'Blue', color: '#007AFF' },
    { value: 'bg-ios-green', label: 'Green', color: '#34C759' },
    { value: 'bg-ios-purple', label: 'Purple', color: '#AF52DE' },
    { value: 'bg-ios-pink', label: 'Pink', color: '#FF2D55' },
    { value: 'bg-ios-orange', label: 'Orange', color: '#FF9500' },
    { value: 'bg-ios-teal', label: 'Teal', color: '#5AC8FA' },
  ];

  const iconOptions = ['💳', '🏦', '💰', '💵', '💸', '🏧', '💴', '💶', '💷', '💷'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await accountDB.create({
        name: formData.name,
        description: formData.description,
        initialBalance: parseFloat(formData.initialBalance) || 0,
        icon: formData.icon,
        color: formData.color,
      });

      navigate('/accounts');
    } catch (error) {
      console.error('Error creating account:', error);
      showAlert('Error', 'Failed to create account. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="page-container">
      <Header 
        title="New Account" 
        rightAction={
          <button onClick={() => navigate(-1)} className="text-ios-blue font-medium">
            Cancel
          </button>
        }
      />

      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        <form onSubmit={handleSubmit}>
          {/* Preview Card */}
          <div className="ios-card p-5 mb-6">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${formData.color}`}>
                <span className="text-white text-3xl">{formData.icon}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-ios-gray-900 dark:text-white">
                  {formData.name || 'Account Name'}
                </h3>
                <p className="text-sm text-ios-gray-600 dark:text-ios-gray-400">
                  {formData.description || 'Account description'}
                </p>
              </div>
            </div>
          </div>

          <Input
            label="Account Name"
            type="text"
            maxLength="20"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., Savings, Checking"
            required
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
          />

          <Input
            label="Description (Optional)"
            type="text"
            maxLength="30"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="e.g., Main savings account"
          />

          <Input
            label="Initial Balance"
            type="number"
            step="0.01"
            max="9999999"
            value={formData.initialBalance}
            onChange={(e) => handleChange('initialBalance', e.target.value)}
            placeholder="0.00"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          {/* Icon Selection */}
          <div className="mb-4">
            <label className="ios-label">Icon</label>
            <div className="flex flex-wrap gap-2">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => handleChange('icon', icon)}
                  className={`w-12 h-12 rounded-ios flex justify-center items-center text-2xl transition-all ${
                    formData.icon === icon
                      ? 'bg-ios-blue text-white scale-110'
                      : 'bg-ios-gray-100'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="mb-6">
            <label className="ios-label">Color</label>
            <div className="flex flex-wrap gap-3">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('color', option.value)}
                  className={`w-12 h-12 rounded-full transition-all ${option.value} ${
                    formData.color === option.value
                      ? 'ring-4 ring-ios-gray-300 scale-110'
                      : ''
                  }`}
                  title={option.label}
                />
              ))}
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            disabled={loading || !formData.name}
          >
            {loading ? 'Creating...' : 'Create Account'}
          </Button>
        </form>
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

export default NewAccount;
