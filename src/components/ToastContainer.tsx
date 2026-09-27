import React from 'react';
import { X } from 'lucide-react';
import { usePhotoFlowStore } from '../stores/usePhotoFlowStore';

export const ToastContainer: React.FC = () => {
  const toasts = usePhotoFlowStore((s) => s.toasts);
  const dismissToast = usePhotoFlowStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-16 md:bottom-5 right-4 z-50 flex flex-col gap-2 max-w-xs w-full pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg bg-black text-white text-xs shadow-md"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                t.variant === 'error'
                  ? 'bg-red-400'
                  : t.variant === 'success'
                    ? 'bg-emerald-400'
                    : 'bg-white'
              }`}
            />
            <span className="truncate font-medium">
              {t.title}
              {t.description ? ` · ${t.description}` : ''}
            </span>
          </div>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
