import React from 'react';
import { Loader2, WifiOff, AlertCircle } from 'lucide-react';
import { usePhotoFlowStore } from '../stores/usePhotoFlowStore';

export const SyncStatusBadge: React.FC = () => {
  const syncStatus = usePhotoFlowStore((s) => s.syncStatus);
  const syncError = usePhotoFlowStore((s) => s.syncError);
  const loadAllDatasets = usePhotoFlowStore((s) => s.loadAllDatasets);

  if (syncStatus === 'saving' || syncStatus === 'syncing') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
        <Loader2 className="w-3 h-3 animate-spin text-neutral-500" />
        <span>Syncing</span>
      </span>
    );
  }

  if (syncStatus === 'offline') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-amber-600">
        <WifiOff className="w-3 h-3" />
        <span>Offline</span>
      </span>
    );
  }

  if (syncStatus === 'error') {
    return (
      <button
        type="button"
        onClick={() => loadAllDatasets()}
        title={syncError || 'Sync failed — click to retry'}
        className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:underline cursor-pointer"
      >
        <AlertCircle className="w-3 h-3" />
        <span>Retry sync</span>
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      <span>Saved</span>
    </span>
  );
};
