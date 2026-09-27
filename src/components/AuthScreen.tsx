import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  sendPasswordReset,
  signInWithEmail,
  signUpWithEmail,
  updateUserPassword,
} from '../lib/supabase/authService';
import { usePhotoFlowStore } from '../stores/usePhotoFlowStore';

type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';

export const AuthScreen: React.FC = () => {
  const setAuthenticatedUser = usePhotoFlowStore((s) => s.setAuthenticatedUser);
  const addToast = usePhotoFlowStore((s) => s.addToast);

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (mode === 'forgot') {
      if (!email.trim()) {
        setError('Enter your email address.');
        return;
      }
      setLoading(true);
      try {
        await sendPasswordReset(email);
        setInfoMessage('Password reset link sent to your email.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not send reset email.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'reset') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      setLoading(true);
      try {
        await updateUserPassword(password);
        addToast('Password updated', undefined, 'success');
        setMode('signin');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update password.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const user = await signInWithEmail(email, password);
        await setAuthenticatedUser(user);
      } else {
        const { user, confirmationRequired } = await signUpWithEmail(email, password);
        if (confirmationRequired) {
          setInfoMessage('Check your email to confirm your account, then sign in.');
          setMode('signin');
        } else if (user) {
          await setAuthenticatedUser(user);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-black">PhotoFlow</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {mode === 'signin' && 'Sign in to your workspace'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'forgot' && 'Reset your password'}
            {mode === 'reset' && 'Set a new password'}
          </p>
        </div>

        {/* Mode switch */}
        {(mode === 'signin' || mode === 'signup') && (
          <div className="flex gap-4 border-b border-neutral-200 mb-6 text-sm">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`pb-2.5 -mb-px border-b-2 transition-colors cursor-pointer ${
                mode === 'signin'
                  ? 'border-black text-black font-medium'
                  : 'border-transparent text-neutral-400 hover:text-black'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`pb-2.5 -mb-px border-b-2 transition-colors cursor-pointer ${
                mode === 'signup'
                  ? 'border-black text-black font-medium'
                  : 'border-transparent text-neutral-400 hover:text-black'
              }`}
            >
              Create account
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 px-3 py-2 rounded-md bg-neutral-100 text-red-600 text-xs">
            {error}
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 px-3 py-2 rounded-md bg-neutral-100 text-emerald-700 text-xs">
            {infoMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode !== 'reset' && (
            <div>
              <label htmlFor="auth-email" className="block text-xs text-neutral-500 mb-1.5">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.com"
                className="w-full h-9 px-3 rounded-md bg-white border border-neutral-200 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors"
              />
            </div>
          )}

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="auth-password" className="block text-xs text-neutral-500">
                  {mode === 'reset' ? 'New password' : 'Password'}
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="text-xs text-neutral-400 hover:text-black cursor-pointer"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-9 px-3 rounded-md bg-white border border-neutral-200 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors"
              />
            </div>
          )}

          {(mode === 'signup' || mode === 'reset') && (
            <div>
              <label htmlFor="auth-confirm" className="block text-xs text-neutral-500 mb-1.5">
                Confirm password
              </label>
              <input
                id="auth-confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-9 px-3 rounded-md bg-white border border-neutral-200 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 rounded-md bg-black hover:bg-neutral-800 disabled:opacity-50 text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>
              {mode === 'signin' && 'Sign in'}
              {mode === 'signup' && 'Create account'}
              {mode === 'forgot' && 'Send reset link'}
              {mode === 'reset' && 'Update password'}
            </span>
          </button>

          {(mode === 'forgot' || mode === 'reset') && (
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className="w-full text-center text-xs text-neutral-500 hover:text-black py-1 cursor-pointer"
            >
              Back to sign in
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

