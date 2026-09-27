import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { CurrencyCode } from '../types';
import { usePhotoFlowStore } from '../stores/usePhotoFlowStore';
import { SUPPORTED_CURRENCIES } from '../utils/format';
import { CustomSelect } from './ui/CustomSelect';

export const EncryptionVaultGate: React.FC = () => {
  const user = usePhotoFlowStore((s) => s.user);
  const vaultStatus = usePhotoFlowStore((s) => s.vaultStatus);
  const setupEncryptionVault = usePhotoFlowStore((s) => s.setupEncryptionVault);
  const unlockEncryptionVault = usePhotoFlowStore((s) => s.unlockEncryptionVault);
  const signOut = usePhotoFlowStore((s) => s.signOut);

  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [studioName, setStudioName] = useState('PhotoFlow');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSetup = vaultStatus === 'needs_setup';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (passphrase.trim().length < 6) {
      setError('Passphrase must be at least 6 characters.');
      return;
    }

    if (isSetup && passphrase !== confirmPassphrase) {
      setError('Passphrases do not match.');
      return;
    }

    setLoading(true);
    try {
      if (isSetup) {
        await setupEncryptionVault(passphrase, currency, studioName);
      } else {
        await unlockEncryptionVault(passphrase);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not unlock data.');
    } finally {
      setLoading(false);
    }
  };

  const currencyOptions = SUPPORTED_CURRENCIES.map((c) => ({
    value: c.code,
    label: `${c.code} (${c.symbol})`,
    sublabel: c.label,
  }));

  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-black">
            {isSetup ? 'Set up encryption' : 'Unlock workspace'}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {user?.email}
          </p>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-md bg-neutral-100 text-red-600 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSetup && (
            <>
              <div>
                <label htmlFor="vault-studio" className="block text-xs text-neutral-500 mb-1.5">
                  Studio name
                </label>
                <input
                  id="vault-studio"
                  type="text"
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  placeholder="PhotoFlow"
                  className="w-full h-9 px-3 rounded-md bg-white border border-neutral-200 text-sm text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-500 mb-1.5">
                  Currency
                </label>
                <CustomSelect
                  value={currency}
                  onChange={(val) => setCurrency(val)}
                  options={currencyOptions}
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="vault-pass" className="block text-xs text-neutral-500 mb-1.5">
              Encryption passphrase
            </label>
            <input
              id="vault-pass"
              type="password"
              required
              autoFocus
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter passphrase"
              className="w-full h-9 px-3 rounded-md bg-white border border-neutral-200 text-sm text-black focus:outline-none focus:border-black"
            />
          </div>

          {isSetup && (
            <div>
              <label htmlFor="vault-confirm" className="block text-xs text-neutral-500 mb-1.5">
                Confirm passphrase
              </label>
              <input
                id="vault-confirm"
                type="password"
                required
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                placeholder="Repeat passphrase"
                className="w-full h-9 px-3 rounded-md bg-white border border-neutral-200 text-sm text-black focus:outline-none focus:border-black"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 rounded-md bg-black hover:bg-neutral-800 disabled:opacity-50 text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isSetup ? 'Continue' : 'Unlock'}</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-neutral-100 flex justify-between items-center text-xs text-neutral-400">
          <span>AES-GCM 256-bit</span>
          <button
            type="button"
            onClick={() => signOut()}
            className="text-neutral-500 hover:text-black cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};
