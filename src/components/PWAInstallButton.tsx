import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
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
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
          title="Install on iPhone"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">iPhone App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white border border-neutral-200 p-6 shadow-xl text-black">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <h3 className="text-sm font-semibold">Install PhotoFlow on iPhone</h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-neutral-400 hover:text-black transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs text-neutral-600 leading-relaxed">
                <p>
                  Open PhotoFlow in <strong className="text-black">Safari</strong>, tap the{' '}
                  <strong className="text-black">three-dot menu (•••)</strong>, and choose{' '}
                  <strong className="text-black">Share</strong>.
                </p>
                <p>
                  From the bottom of the share sheet, tap{' '}
                  <strong className="text-black">View More</strong>, then scroll down and tap{' '}
                  <strong className="text-black">Add to Home Screen</strong>.
                </p>
                <p>
                  Tap <strong className="text-black">Add</strong> in the top-right corner without
                  adjusting anything.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full h-9 rounded-lg bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
