import React from 'react';

const AlertModal = ({ isOpen, onClose, title, message, type = 'info' }) => {
  if (!isOpen) return null;

  const icons = {
    success: (
      <div className="w-16 h-16 rounded-full bg-ios-green/10 flex items-center justify-center mb-4 mx-auto">
        <svg className="w-8 h-8 text-ios-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    error: (
      <div className="w-16 h-16 rounded-full bg-ios-red/10 flex items-center justify-center mb-4 mx-auto">
        <svg className="w-8 h-8 text-ios-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    ),
    warning: (
      <div className="w-16 h-16 rounded-full bg-ios-orange/10 flex items-center justify-center mb-4 mx-auto">
        <svg className="w-8 h-8 text-ios-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    ),
    info: (
      <div className="w-16 h-16 rounded-full bg-ios-blue/10 flex items-center justify-center mb-4 mx-auto">
        <svg className="w-8 h-8 text-ios-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-ios-lg shadow-ios-xl max-w-md w-full mx-4 overflow-hidden animate-scale-up">
        <div className="p-6 text-center">
          {icons[type]}
          <h3 className="text-xl font-bold text-ios-gray-900 mb-2">{title}</h3>
          <div className="text-ios-gray-700 whitespace-pre-line">{message}</div>
        </div>
        <div className="p-4 bg-ios-gray-50 border-t border-ios-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 rounded-ios font-semibold text-white bg-ios-blue hover:bg-blue-600 active:scale-95 transition-all"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
