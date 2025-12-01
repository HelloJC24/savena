import { useState } from 'react';

export const useModal = () => {
  const [alertModal, setAlertModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    type: 'info' 
  });

  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: null,
    variant: 'primary',
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });

  const showAlert = (title, message, type = 'info') => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  const hideAlert = () => {
    setAlertModal({ isOpen: false, title: '', message: '', type: 'info' });
  };

  const showConfirm = (title, message, onConfirm, variant = 'primary', confirmText = 'Confirm', cancelText = 'Cancel') => {
    setConfirmModal({ 
      isOpen: true, 
      title, 
      message, 
      onConfirm, 
      variant, 
      confirmText, 
      cancelText 
    });
  };

  const hideConfirm = () => {
    setConfirmModal({ 
      isOpen: false, 
      title: '', 
      message: '', 
      onConfirm: null,
      variant: 'primary',
      confirmText: 'Confirm',
      cancelText: 'Cancel'
    });
  };

  return {
    alertModal,
    confirmModal,
    showAlert,
    hideAlert,
    showConfirm,
    hideConfirm,
  };
};
