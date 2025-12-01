import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

const SyncModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState('intro'); // intro, create, join, qrcode, success
  const [walletId, setWalletId] = useState('');
  const [remoteUrl, setRemoteUrl] = useState('');
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
        remoteUrl,
        app: 'Savena'
      });
      const url = await QRCode.toDataURL(data, { width: 300 });
      setQrDataUrl(url);
    } catch (err) {
      console.error('QR generation error:', err);
    }
  };

  const handleCreateWallet = async () => {
    if (!remoteUrl) {
      setError('Please enter CouchDB URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { syncService } = await import('../services/syncService');
      const result = await syncService.createWallet(remoteUrl, password);

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
    if (!walletId || !remoteUrl) {
      setError('Please enter Wallet ID and CouchDB URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { syncService } = await import('../services/syncService');
      const result = await syncService.joinWallet(walletId, remoteUrl, password);

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
      <div className="bg-white rounded-ios-lg shadow-ios-xl max-w-md w-full mx-4 overflow-hidden animate-scale-up">
        
        {/* Intro Step */}
        {step === 'intro' && (
          <>
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-ios-blue/10 flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 h-8 text-ios-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-ios-gray-900 mb-2">Wallet Sync</h3>
              <p className="text-sm text-ios-gray-700 mb-4">
                Sync your wallet data across devices and share with family members.
              </p>
              
              <div className="bg-ios-yellow/10 rounded-ios p-3 mb-4 text-left border border-ios-yellow/20">
                <p className="text-xs text-ios-gray-800 font-semibold mb-1">Privacy Notice:</p>
                <ul className="text-xs text-ios-gray-700 space-y-1">
                  <li>• Data syncs to your own CouchDB server</li>
                  <li>• Optional password protection</li>
                  <li>• You control who has access</li>
                  <li>• Local backup always maintained</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-ios-gray-50 border-t border-ios-gray-200 space-y-2">
              <button
                onClick={() => setStep('create')}
                className="w-full px-4 py-3 rounded-ios font-semibold text-white bg-ios-blue hover:bg-blue-600 active:scale-95 transition-all"
              >
                Create New Wallet
              </button>
              <button
                onClick={() => setStep('join')}
                className="w-full px-4 py-3 rounded-ios font-semibold text-ios-blue bg-white border-2 border-ios-blue hover:bg-ios-blue/5 active:scale-95 transition-all"
              >
                Join Existing Wallet
              </button>
              <button
                onClick={onClose}
                className="w-full px-4 py-3 rounded-ios font-semibold text-ios-gray-700 bg-ios-gray-100 hover:bg-ios-gray-200 active:scale-95 transition-all"
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
              <h3 className="text-xl font-bold text-ios-gray-900 mb-4">Create New Wallet</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ios-gray-900 mb-2">
                    CouchDB URL *
                  </label>
                  <input
                    type="url"
                    value={remoteUrl}
                    onChange={(e) => setRemoteUrl(e.target.value)}
                    placeholder="https://your-couchdb.com"
                    className="w-full px-4 py-3 rounded-ios border-2 border-ios-gray-300 focus:border-ios-blue focus:outline-none"
                  />
                  <p className="text-xs text-ios-gray-600 mt-1">
                    Use IBM Cloudant (free) or your own CouchDB server
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ios-gray-900 mb-2">
                    Password (optional)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave empty for no password"
                    className="w-full px-4 py-3 rounded-ios border-2 border-ios-gray-300 focus:border-ios-blue focus:outline-none"
                  />
                  <p className="text-xs text-ios-gray-600 mt-1">
                    Recommended for shared wallets
                  </p>
                </div>

                {error && (
                  <div className="bg-ios-red/10 border border-ios-red/20 rounded-ios p-3">
                    <p className="text-sm text-ios-red">{error}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-ios-gray-50 border-t border-ios-gray-200 space-y-2">
              <button
                onClick={handleCreateWallet}
                disabled={loading || !remoteUrl}
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
              <h3 className="text-xl font-bold text-ios-gray-900 mb-4">Join Existing Wallet</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ios-gray-900 mb-2">
                    Wallet ID *
                  </label>
                  <input
                    type="text"
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    placeholder="wallet_xxxxxxxxxxxx"
                    className="w-full px-4 py-3 rounded-ios border-2 border-ios-gray-300 focus:border-ios-blue focus:outline-none font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ios-gray-900 mb-2">
                    CouchDB URL *
                  </label>
                  <input
                    type="url"
                    value={remoteUrl}
                    onChange={(e) => setRemoteUrl(e.target.value)}
                    placeholder="https://your-couchdb.com"
                    className="w-full px-4 py-3 rounded-ios border-2 border-ios-gray-300 focus:border-ios-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ios-gray-900 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter if wallet has password"
                    className="w-full px-4 py-3 rounded-ios border-2 border-ios-gray-300 focus:border-ios-blue focus:outline-none"
                  />
                </div>

                {error && (
                  <div className="bg-ios-red/10 border border-ios-red/20 rounded-ios p-3">
                    <p className="text-sm text-ios-red">{error}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-ios-gray-50 border-t border-ios-gray-200 space-y-2">
              <button
                onClick={handleJoinWallet}
                disabled={loading || !walletId || !remoteUrl}
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
              <h3 className="text-xl font-bold text-ios-gray-900 mb-2">Wallet Created!</h3>
              <p className="text-sm text-ios-gray-700 mb-4">
                Share this QR code or Wallet ID with family members
              </p>

              {qrDataUrl && (
                <div className="bg-white p-4 rounded-ios border-2 border-ios-gray-200 mb-4">
                  <img src={qrDataUrl} alt="QR Code" className="w-full max-w-xs mx-auto" />
                </div>
              )}

              <div className="bg-ios-gray-50 rounded-ios p-3 mb-2">
                <p className="text-xs text-ios-gray-600 mb-1">Wallet ID:</p>
                <p className="font-mono text-sm text-ios-gray-900 break-all">{walletId}</p>
              </div>

              <div className="bg-ios-gray-50 rounded-ios p-3">
                <p className="text-xs text-ios-gray-600 mb-1">CouchDB URL:</p>
                <p className="font-mono text-xs text-ios-gray-900 break-all">{remoteUrl}</p>
              </div>
            </div>

            <div className="p-4 bg-ios-gray-50 border-t border-ios-gray-200">
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
              <h3 className="text-xl font-bold text-ios-gray-900 mb-2">Successfully Connected!</h3>
              <p className="text-sm text-ios-gray-700 mb-4">
                Your wallet is now syncing. Changes will automatically sync across all connected devices.
              </p>

              <div className="bg-ios-blue/10 rounded-ios p-4 mb-4">
                <p className="text-sm text-ios-gray-800">
                  The app will reload to apply sync settings.
                </p>
              </div>
            </div>

            <div className="p-4 bg-ios-gray-50 border-t border-ios-gray-200">
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
