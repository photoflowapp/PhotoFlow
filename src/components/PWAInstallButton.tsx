import React from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  if (isInstalled || !isInstallable) return null;

  return (
    <button
      type="button"
      onClick={install}
      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
      title="Install app"
    >
      <Download className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Install</span>
    </button>
  );
};
