import React from 'react';

const ImportOptionsModal = ({ isOpen, onClose, onMerge, onReplace, importSummary }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-ios-gray-900 rounded-ios-lg shadow-ios-xl max-w-md w-full mx-4 overflow-hidden animate-scale-up">
        <div className="p-6">
          <h3 className="text-xl font-bold text-ios-gray-900 mb-4 text-center dark:text-white">Import Data</h3>
          
          {/* Import Summary */}
          {importSummary && (
            <div className="bg-ios-gray-50 dark:bg-ios-gray-800 rounded-ios p-4 mb-6">
              <p className="text-sm text-ios-gray-700 dark:text-ios-gray-400 mb-2">
                <strong>Import File Contains:</strong>
              </p>
              <ul className="text-sm text-ios-gray-700 dark:text-ios-gray-400 space-y-1">
                <li>📊 {importSummary.accounts} account{importSummary.accounts !== 1 ? 's' : ''}</li>
                <li>💸 {importSummary.transactions} transaction{importSummary.transactions !== 1 ? 's' : ''}</li>
                <li>📅 Exported on {importSummary.exportDate}</li>
              </ul>
            </div>
          )}

          {/* Options Description */}
          <div className="space-y-3 mb-6">
            <div className="bg-ios-blue/5 rounded-ios p-3 border border-ios-blue/20">
              <p className="text-sm font-semibold text-ios-blue mb-1">Merge with Existing</p>
              <p className="text-xs text-ios-gray-700">Add imported data to your current data. Nothing will be deleted.</p>
            </div>

            <div className="bg-ios-red/5 rounded-ios p-3 border border-ios-red/20">
              <p className="text-sm font-semibold text-ios-red mb-1">Replace All Data</p>
              <p className="text-xs text-ios-gray-700">Delete all current data and replace with imported data.</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onMerge}
              className="w-full px-4 py-3 rounded-ios font-semibold text-white bg-ios-blue hover:bg-blue-600 active:scale-95 transition-all"
            >
              Merge with Existing
            </button>
            
            <button
              onClick={onReplace}
              className="w-full px-4 py-3 rounded-ios font-semibold text-white bg-ios-red hover:bg-red-600 active:scale-95 transition-all"
            >
              Replace All Data
            </button>
            
            <button
              onClick={onClose}
              className="w-full px-4 py-3 rounded-ios font-semibold text-ios-gray-700 bg-ios-gray-100 hover:bg-ios-gray-200 active:scale-95 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportOptionsModal;
