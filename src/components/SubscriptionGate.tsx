import React, { useEffect, useState } from 'react';
import { Check, Loader2, ArrowUpRight, RefreshCw, Leaf } from 'lucide-react';
import { usePhotoFlowStore } from '../stores/usePhotoFlowStore';
import {
  fetchStripePlanSummary,
  startStripeSubscriptionCheckout,
  StripePlanSummary,
} from '../lib/stripe/stripeService';
import { PhotoFlowLogo } from './PhotoFlowLogo';

export const SubscriptionGate: React.FC = () => {
  const user = usePhotoFlowStore((s) => s.user);
  const refreshSubscriptionStatus = usePhotoFlowStore((s) => s.refreshSubscriptionStatus);
  const signOut = usePhotoFlowStore((s) => s.signOut);

  const [plan, setPlan] = useState<StripePlanSummary>({
    name: 'PhotoFlow Studio',
    amountFormatted: '$19',
    interval: 'month',
  });
  const [redirecting, setRedirecting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchStripePlanSummary().then((summary) => {
      if (active) setPlan(summary);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSubscribe = async () => {
    if (!user) return;
    setError(null);
    setRedirecting(true);
    try {
      await startStripeSubscriptionCheckout(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open Stripe Checkout.');
      setRedirecting(false);
    }
  };

  const handleRefresh = async () => {
    setError(null);
    setCheckingStatus(true);
    try {
      await refreshSubscriptionStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify subscription.');
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-7">
          <PhotoFlowLogo className="w-9 h-9 text-black mb-4" />
          <h1 className="text-2xl font-semibold tracking-tight text-black">
            Subscribe to {plan.name}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Signed in as <span className="text-black font-medium">{user?.email}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2.5 rounded-md bg-neutral-100 text-red-600 text-xs leading-relaxed">
            {error}
          </div>
        )}

        <div className="border border-neutral-200 rounded-xl p-5 mb-5">
          <div className="flex items-baseline justify-between pb-4 border-b border-neutral-100">
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Full Access
              </p>
              <p className="text-sm font-medium text-black mt-0.5">{plan.name}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-semibold tracking-tight text-black">
                {plan.amountFormatted}
              </span>
              <span className="text-xs text-neutral-400">/{plan.interval}</span>
            </div>
          </div>

          <ul className="py-4 space-y-2.5 text-xs text-neutral-700">
            <li className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-black shrink-0" />
              <span>End-to-end AES-256 encrypted studio vault</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-black shrink-0" />
              <span>Unlimited photography projects, shoots & pipeline</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-black shrink-0" />
              <span>Cancel or manage anytime via Stripe</span>
            </li>
          </ul>

          <button
            type="button"
            onClick={handleSubscribe}
            disabled={redirecting || checkingStatus}
            className="w-full h-10 rounded-md bg-black hover:bg-neutral-800 disabled:opacity-50 text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {redirecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Redirecting to Stripe...</span>
              </>
            ) : (
              <>
                <span>Subscribe with Stripe</span>
                <ArrowUpRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="mt-4 pt-3.5 border-t border-neutral-100 flex items-start gap-2.5">
            <Leaf className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-xs text-neutral-700 font-medium leading-snug">
              PhotoFlow will contribute 1.5% of your purchase to remove CO₂ from the atmosphere.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={checkingStatus || redirecting}
            className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-black transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingStatus ? 'animate-spin' : ''}`} />
            <span>Verify subscription</span>
          </button>

          <button
            type="button"
            onClick={() => signOut()}
            className="text-neutral-500 hover:text-black transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};
