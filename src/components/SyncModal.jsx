import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

const SyncModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState('intro'); // intro, create, join, qrcode, success
  const [walletId, setWalletId] = useState('');
  const [password, setPassword] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (step === 'qrcode' && walletId) {
      generateQRCode();
    }
  }, [step, walletId]);

  const generateQRCode = async () => {
    try {
      const data = JSON.stringify({
        walletId,
        app: 'Savena'
      });
      const url = await QRCode.toDataURL(data, { width: 300 });
      setQrDataUrl(url);
    } catch (err) {
      console.error('QR generation error:', err);
    }
  };

  const handleCreateWallet = async () => {
    if (!password) {
      setError('Please enter a password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { syncService } = await import('../services/syncService');
      
      // Store password in session for auto-sync
      sessionStorage.setItem('savena_wallet_password', password);
      
      const result = await syncService.createWallet(password);

      if (result.success) {
        setWalletId(result.walletId);
        setStep('qrcode');
      } else {
        setError(result.error || 'Failed to create wallet');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWallet = async () => {
    if (!walletId) {
      setError('Please enter Wallet ID');
      return;
    }
    if (!password) {
      setError('Please enter password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { syncService } = await import('../services/syncService');
      
      // Store password in session for auto-sync
      sessionStorage.setItem('savena_wallet_password', password);
      
      const result = await syncService.joinWallet(walletId, password);

      if (result.success) {
        setStep('success');
      } else {
        setError(result.error || 'Failed to join wallet');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onClose();
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-ios-gray-900 rounded-ios-lg shadow-ios-xl max-w-md w-full mx-4 overflow-hidden animate-scale-up">
        
        {/* Intro Step */}
        {step === 'intro' && (
          <>
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-ios-blue/10 flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 h-8 text-ios-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-ios-gray-900 mb-2 dark:text-white">Wallet Sync</h3>
              <p className="text-sm text-ios-gray-700 mb-4 dark:text-ios-gray-400">
                Sync your wallet data across devices and share with family members.
              </p>
              
              <div className="bg-ios-yellow/10 rounded-ios p-3 mb-4 text-left border border-ios-yellow/20">
                <p className="text-xs text-ios-gray-800 font-semibold mb-1 dark:text-ios-gray-400">Privacy Notice:</p>
                <ul className="text-xs text-ios-gray-700 space-y-1 dark:text-ios-gray-400">
                  <li>• Data syncs to secure Cloudflare R2 storage</li>
                  <li>• Password required for encryption</li>
                  <li>• Share wallet ID with family members</li>
                  <li>• Local backup always maintained</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-ios-gray-50 dark:bg-ios-gray-800 border-t border-ios-gray-200 dark:border-ios-gray-700 space-y-2">
              <button
                onClick={() => setStep('create')}
                className="w-full px-4 py-3 rounded-ios font-semibold text-white bg-ios-blue hover:bg-blue-600 active:scale-95 transition-all"
              >
                Create New Wallet
              </button>
              <button
                onClick={() => setStep('join')}
                className="w-full px-4 py-3 rounded-ios font-semibold text-ios-blue bg-white dark:bg-ios-gray-900 border-2 border-ios-blue hover:bg-ios-blue/5 active:scale-95 transition-all"
              >
                Join Existing Wallet
              </button>
              <button
                onClick={onClose}
                className="w-full px-4 py-3 rounded-ios font-semibold text-ios-gray-700 dark:text-ios-gray-400 bg-ios-gray-100 dark:bg-ios-gray-700 hover:bg-ios-gray-200 dark:hover:bg-ios-gray-600 active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {/* Create Wallet Step */}
        {step === 'create' && (
          <>
            <div className="p-6">
              <button onClick={() => setStep('intro')} className="text-ios-blue mb-4">
                ← Back
              </button>
              <h3 className="text-xl font-bold text-ios-gray-900 dark:text-white mb-4">Create New Wallet</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ios-gray-900 dark:text-ios-gray-400 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a secure password"
                    className="w-full px-4 py-3 dark:bg-ios-gray-900 rounded-ios border-2 border-ios-gray-300 focus:border-ios-blue focus:outline-none"
                  />
                  <p className="text-xs text-ios-gray-600 mt-1">
                    Required to protect your synced data
                  </p>
                </div>

                {error && (
                  <div className="bg-ios-red/10 border border-ios-red/20 rounded-ios p-3">
                    <p className="text-sm text-ios-red">{error}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-ios-gray-50 dark:bg-ios-gray-800 border-t border-ios-gray-200 dark:border-ios-gray-700 space-y-2">
              <button
                onClick={handleCreateWallet}
                disabled={loading || !password}
                className="w-full px-4 py-3 rounded-ios font-semibold text-white bg-ios-blue hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Wallet'}
              </button>
            </div>
          </>
        )}

        {/* Join Wallet Step */}
        {step === 'join' && (
          <>
            <div className="p-6">
              <button onClick={() => setStep('intro')} className="text-ios-blue mb-4">
                ← Back
              </button>
              <h3 className="text-xl font-bold text-ios-gray-900 dark:text-ios-gray-400 mb-4">Join Existing Wallet</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ios-gray-900 dark:text-ios-gray-400 mb-2">
                    Wallet ID *
                  </label>
                  <input
                    type="text"
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    placeholder="wallet_xxxxxxxxxxxx"
                    className="w-full px-4 py-3 rounded-ios dark:bg-ios-gray-900 border-2 border-ios-gray-300 focus:border-ios-blue focus:outline-none font-mono text-sm"
                  />
                  <p className="text-xs text-ios-gray-600 dark:text-ios-gray-400 mt-1">
                    Get this from the person who created the wallet
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ios-gray-900 dark:text-ios-gray-400 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter wallet password"
                    className="w-full px-4 py-3 dark:bg-ios-gray-900 rounded-ios border-2 border-ios-gray-300 focus:border-ios-blue focus:outline-none"
                  />
                </div>

                {error && (
                  <div className="bg-ios-red/10 border border-ios-red/20 rounded-ios p-3">
                    <p className="text-sm text-ios-red">{error}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-ios-gray-50 dark:bg-ios-gray-800 border-t border-ios-gray-200 dark:border-ios-gray-700 space-y-2">
              <button
                onClick={handleJoinWallet}
                disabled={loading || !walletId || !password}
                className="w-full px-4 py-3 rounded-ios font-semibold text-white bg-ios-blue hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Joining...' : 'Join Wallet'}
              </button>
            </div>
          </>
        )}

        {/* QR Code Step */}
        {step === 'qrcode' && (
          <>
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-ios-green/10 flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 h-8 text-ios-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-ios-gray-900 dark:text-ios-gray-400 mb-2">Wallet Created!</h3>
              <p className="text-sm text-ios-gray-700 dark:text-ios-gray-400 mb-4">
                Share this QR code or Wallet ID with family members
              </p>

              {qrDataUrl && (
                <div className="bg-white dark:bg-ios-gray-900 p-4 rounded-ios border-2 border-ios-gray-200 dark:border-ios-gray-700 mb-4">
                  <img src={qrDataUrl} alt="QR Code" className="w-full max-w-xs mx-auto" />
                </div>
              )}

              <div className="bg-ios-gray-50 dark:bg-ios-gray-800 rounded-ios p-3">
                <p className="text-xs text-ios-gray-600 dark:text-ios-gray-400 mb-1">Wallet ID:</p>
                <p className="font-mono text-sm text-ios-gray-900 dark:text-ios-gray-400 break-all">{walletId}</p>
              </div>

              <div className="bg-ios-blue/5 border border-ios-blue/20 rounded-ios p-3 mt-4">
                <p className="text-xs text-ios-gray-700 dark:text-ios-gray-400">
                  💡 Your data is now syncing to Cloudflare R2. Changes will automatically sync every 30 seconds.
                </p>
              </div>
            </div>

            <div className="p-4 bg-ios-gray-50 dark:bg-ios-gray-800 border-t border-ios-gray-200 dark:border-ios-gray-700">
              <button
                onClick={handleComplete}
                className="w-full px-4 py-3 rounded-ios font-semibold text-white bg-ios-green hover:bg-green-600 active:scale-95 transition-all"
              >
                Done
              </button>
            </div>
          </>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <>
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-ios-green/10 flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 h-8 text-ios-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-ios-gray-900 dark:text-ios-gray-400 mb-2">Successfully Connected!</h3>
              <p className="text-sm text-ios-gray-700 dark:text-ios-gray-400 mb-4">
                Your wallet is now syncing. Changes will automatically sync across all connected devices.
              </p>

              <div className="bg-ios-blue/10 rounded-ios p-4 mb-4">
                <p className="text-sm text-ios-gray-800 dark:text-ios-gray-400">
                  The app will reload to apply sync settings.
                </p>
              </div>
            </div>

            <div className="p-4 bg-ios-gray-50 dark:bg-ios-gray-800 border-t border-ios-gray-200 dark:border-ios-gray-700">
              <button
                onClick={handleComplete}
                className="w-full px-4 py-3 rounded-ios font-semibold text-white bg-ios-green hover:bg-green-600 active:scale-95 transition-all"
              >
                Continue
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SyncModal;
