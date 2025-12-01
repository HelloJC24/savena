import React, { useState, useEffect } from 'react';
import { syncService } from '../services/syncService';

const SyncStatus = () => {
  const [syncSettings, setSyncSettings] = useState(null);
  const [syncState, setSyncState] = useState('idle'); // idle, syncing, paused, error

  useEffect(() => {
    loadSyncSettings();

    // Listen for sync events
    const handleSyncChange = () => setSyncState('syncing');
    const handleSyncPaused = () => setSyncState('paused');
    const handleSyncActive = () => setSyncState('syncing');
    const handleSyncError = () => setSyncState('error');
    const handleSyncSettingsChanged = (event) => {
      setSyncSettings(event.detail);
      if (!event.detail?.enabled) {
        setSyncState('idle');
      }
    };

    window.addEventListener('sync-change', handleSyncChange);
    window.addEventListener('sync-paused', handleSyncPaused);
    window.addEventListener('sync-active', handleSyncActive);
    window.addEventListener('sync-error', handleSyncError);
    window.addEventListener('sync-settings-changed', handleSyncSettingsChanged);

    return () => {
      window.removeEventListener('sync-change', handleSyncChange);
      window.removeEventListener('sync-paused', handleSyncPaused);
      window.removeEventListener('sync-active', handleSyncActive);
      window.removeEventListener('sync-error', handleSyncError);
      window.removeEventListener('sync-settings-changed', handleSyncSettingsChanged);
    };
  }, []);

  const loadSyncSettings = () => {
    const settings = syncService.getSyncSettings();
    setSyncSettings(settings);
  };

  if (!syncSettings?.enabled) return null;

  const stateConfig = {
    idle: {
      icon: '☁️',
      text: 'Synced',
      color: 'text-ios-green',
      bg: 'bg-ios-green/10'
    },
    syncing: {
      icon: '🔄',
      text: 'Syncing...',
      color: 'text-ios-blue',
      bg: 'bg-ios-blue/10'
    },
    paused: {
      icon: '⏸️',
      text: 'Paused',
      color: 'text-ios-orange',
      bg: 'bg-ios-orange/10'
    },
    error: {
      icon: '⚠️',
      text: 'Error',
      color: 'text-ios-red',
      bg: 'bg-ios-red/10'
    }
  };

  const config = stateConfig[syncState];

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full ${config.bg}`}>
      <span className={syncState === 'syncing' ? 'animate-spin' : ''}>
        {config.icon}
      </span>
      <span className={`text-xs font-semibold ${config.color}`}>
        {config.text}
      </span>
    </div>
  );
};

export default SyncStatus;
