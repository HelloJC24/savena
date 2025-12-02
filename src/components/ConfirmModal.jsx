import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'primary' }) => {
  if (!isOpen) return null;

  const variantStyles = {
    primary: 'bg-ios-blue hover:bg-blue-600',
    danger: 'bg-ios-red hover:bg-red-600',
    success: 'bg-ios-green hover:bg-green-600',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-ios-gray-900 rounded-ios-lg shadow-ios-xl max-w-md w-full mx-4 overflow-hidden animate-scale-up">
        <div className="p-6">
          <h3 className="text-xl font-bold text-ios-gray-900 mb-2 dark:text-white">{title}</h3>
          <div className="text-ios-gray-700 whitespace-pre-line dark:text-ios-gray-400">{message}</div>
        </div>
        <div className="flex gap-3 p-4 bg-ios-gray-50 border-t border-ios-gray-200 dark:bg-ios-gray-800 dark:border-ios-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-ios font-semibold text-ios-gray-700 dark:text-ios-gray-400 bg-white dark:bg-ios-gray-900 border border-ios-gray-300 dark:border-ios-gray-700 hover:bg-ios-gray-50 dark:hover:bg-ios-gray-700 active:scale-95 transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 rounded-ios font-semibold text-white ${variantStyles[variant]} active:scale-95 transition-all`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
