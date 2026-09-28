import React, { useEffect, useState } from 'react';
import { X, Loader2, Settings as SettingsIcon, ArrowUpRight } from 'lucide-react';
import { CurrencyCode } from '../types';
import { usePhotoFlowStore } from '../stores/usePhotoFlowStore';
import { openStripeBillingPortal } from '../lib/stripe/stripeService';
import { SUPPORTED_CURRENCIES } from '../utils/format';
import { CustomSelect } from './ui/CustomSelect';

export const SettingsModal: React.FC = () => {
  const isOpen = usePhotoFlowStore((s) => s.isSettingsOpen);
  const setSettingsOpen = usePhotoFlowStore((s) => s.setSettingsOpen);
  const user = usePhotoFlowStore((s) => s.user);
  const subscriptionRecord = usePhotoFlowStore((s) => s.subscriptionRecord);
  const addToast = usePhotoFlowStore((s) => s.addToast);
  const settings = usePhotoFlowStore((s) => s.settings);
  const updateSettings = usePhotoFlowStore((s) => s.updateSettings);
  const clearAllApplicationData = usePhotoFlowStore((s) => s.clearAllApplicationData);

  const [studioName, setStudioName] = useState(settings.studioName);
  const [currency, setCurrency] = useState<CurrencyCode>(settings.currency);
  const [defaultAutoTasks, setDefaultAutoTasks] = useState(settings.defaultAutoTasks);
  const [saving, setSaving] = useState(false);

  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const [wiping, setWiping] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStudioName(settings.studioName);
      setCurrency(settings.currency);
      setDefaultAutoTasks(settings.defaultAutoTasks);
      setShowWipeConfirm(false);
      setWipeConfirmText('');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        studioName: studioName.trim() || 'PhotoFlow',
        currency,
        defaultAutoTasks,
      });
      setSettingsOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleWipeAll = async () => {
    if (wipeConfirmText !== 'DELETE') return;
    setWiping(true);
    try {
      await clearAllApplicationData();
      setShowWipeConfirm(false);
      setWipeConfirmText('');
      setSettingsOpen(false);
    } finally {
      setWiping(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.blur();
    }
  };

  const currencyOptions = SUPPORTED_CURRENCIES.map((c) => ({
    value: c.code,
    label: `${c.code} (${c.symbol.trim()})`,
    sublabel: c.label,
  }));

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4">
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-neutral-500" />
            <h2 className="text-sm font-semibold text-black">Settings</h2>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-black hover:bg-neutral-100 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Workspace name</label>
            <input
              type="text"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              onKeyDown={handleInputKeyDown}
              className="w-full h-9 px-3 rounded-md bg-white border border-neutral-200 text-sm text-black focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-500 mb-1">Currency</label>
            <CustomSelect
              value={currency}
              onChange={(val) => setCurrency(val)}
              options={currencyOptions}
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={defaultAutoTasks}
              onChange={(e) => setDefaultAutoTasks(e.target.checked)}
              className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
            />
            <span className="text-xs text-neutral-600">
              Auto-generate tasks for new projects
            </span>
          </label>

          {/* Stripe Subscription Management */}
          <div className="pt-3.5 border-t border-neutral-100 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-black">Subscription</p>
              <p className="text-[11px] text-neutral-500">
                Active · Stripe
                {subscriptionRecord?.currentPeriodEnd
                  ? ` · Renews ${new Date(subscriptionRecord.currentPeriodEnd).toLocaleDateString()}`
                  : ''}
              </p>
            </div>
            {subscriptionRecord?.customerId && (
              <button
                type="button"
                disabled={openingPortal}
                onClick={async () => {
                  if (!user) return;
                  setOpeningPortal(true);
                  try {
                    await openStripeBillingPortal(user, subscriptionRecord);
                  } catch (err) {
                    addToast(
                      'Could not open Stripe portal',
                      err instanceof Error ? err.message : undefined,
                      'error'
                    );
                    setOpeningPortal(false);
                  }
                }}
                className="h-8 px-3 rounded-md border border-neutral-200 hover:border-black text-xs font-medium text-black inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {openingPortal ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                )}
                <span>Manage on Stripe</span>
              </button>
            )}
          </div>

          {/* Clear Workspace Data */}
          <div className="pt-3.5 border-t border-neutral-100 space-y-3">
            {!showWipeConfirm ? (
              <button
                type="button"
                onClick={() => setShowWipeConfirm(true)}
                className="text-xs text-red-600 hover:underline cursor-pointer"
              >
                Clear all workspace data...
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neutral-600">
                    Type <strong className="text-black">DELETE</strong> to wipe all data.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowWipeConfirm(false);
                      setWipeConfirmText('');
                    }}
                    className="p-1 text-neutral-400 hover:text-black cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={wipeConfirmText}
                    onChange={(e) => setWipeConfirmText(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="DELETE"
                    className="flex-1 h-8 px-2.5 rounded-md bg-white border border-neutral-200 text-xs text-black focus:outline-none focus:border-black"
                  />
                  <button
                    type="button"
                    disabled={wipeConfirmText !== 'DELETE' || wiping}
                    onClick={handleWipeAll}
                    className="h-8 px-3 rounded-md bg-red-600 disabled:opacity-40 text-white text-xs font-medium cursor-pointer"
                  >
                    {wiping ? 'Wiping...' : 'Wipe'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3.5 border-t border-neutral-100 flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="h-8 px-4 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
