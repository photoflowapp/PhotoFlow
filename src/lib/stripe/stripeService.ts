import { getSupabaseClient, STORAGE_BUCKET } from '../supabase/client';
import { AuthUser } from '../supabase/authService';

export interface SubscriptionRecord {
  status: 'active' | 'trialing' | 'canceled' | 'past_due' | 'none';
  customerId?: string;
  subscriptionId?: string;
  sessionId?: string;
  priceId?: string;
  planName?: string;
  amount?: number;
  currency?: string;
  interval?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  updatedAt: string;
}

export interface StripePlanSummary {
  name: string;
  amountFormatted: string;
  interval: string;
  priceId?: string;
}

function getEnv(key: string): string {
  const val = (import.meta.env as Record<string, string | undefined>)[key];
  return val ? val.trim() : '';
}

export function getStripeConfig() {
  const rawSecret = getEnv('VITE_STRIPE_SECRET_KEY');
  const rawPublishable = getEnv('VITE_STRIPE_PUBLISHABLE_KEY');
  const rawPriceId = getEnv('VITE_STRIPE_PRICE_ID');
  const rawPaymentLink = getEnv('VITE_STRIPE_PAYMENT_LINK');

  const secretKey =
    (rawSecret.startsWith('sk_') || rawSecret.startsWith('rk_')) &&
    !rawSecret.includes('your_stripe')
      ? rawSecret
      : '';

  const publishableKey =
    rawPublishable.startsWith('pk_') && !rawPublishable.includes('your_stripe')
      ? rawPublishable
      : '';

  const priceId =
    (rawPriceId.startsWith('price_') || rawPriceId.startsWith('prod_')) &&
    !rawPriceId.includes('optional_')
      ? rawPriceId
      : '';

  const paymentLink =
    rawPaymentLink.startsWith('https://buy.stripe.com/') &&
    !rawPaymentLink.includes('optional_')
      ? rawPaymentLink
      : '';

  return {
    secretKey,
    publishableKey,
    priceId,
    paymentLink,
    isConfigured: Boolean(secretKey || paymentLink || (publishableKey && priceId)),
  };
}

function getCleanAppUrl(): string {
  const url = new URL(window.location.href);
  url.searchParams.delete('stripe_checkout');
  url.searchParams.delete('session_id');
  url.searchParams.delete('subscribed');
  url.hash = '';
  return url.toString();
}

function getLocalSubKey(userId: string): string {
  return `photoflow_sub_${userId}`;
}

async function saveSubscriptionRecord(userId: string, record: SubscriptionRecord): Promise<void> {
  try {
    localStorage.setItem(getLocalSubKey(userId), JSON.stringify(record));
  } catch {
    // Ignore storage quota errors
  }

  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.auth.updateUser({
      data: {
        photoflow_subscription: record,
        subscription_status: record.status,
      },
    });
  } catch {
    // Non-fatal if metadata update fails
  }

  try {
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
    await supabase.storage.from(STORAGE_BUCKET).upload(`${userId}/subscription.json`, blob, {
      upsert: true,
      contentType: 'application/json',
      cacheControl: '0',
    });
  } catch {
    // Non-fatal if bucket object write fails
  }
}

async function loadStoredSubscriptionRecord(userId: string): Promise<SubscriptionRecord | null> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const metaSub = userData.user?.user_metadata?.photoflow_subscription as
        | SubscriptionRecord
        | undefined;
      if (metaSub && (metaSub.status === 'active' || metaSub.status === 'trialing')) {
        return metaSub;
      }
    } catch {
      // Ignore and try storage
    }

    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(`${userId}/subscription.json`);
      if (!error && data) {
        const parsed = JSON.parse(await data.text()) as SubscriptionRecord;
        if (parsed && parsed.status) {
          return parsed;
        }
      }
    } catch {
      // Ignore and fall back to localStorage
    }
  }

  try {
    const raw = localStorage.getItem(getLocalSubKey(userId));
    if (raw) {
      return JSON.parse(raw) as SubscriptionRecord;
    }
  } catch {
    // Ignore
  }

  return null;
}

async function stripeApiRequest<T>(
  path: string,
  secretKey: string,
  options?: {
    method?: 'GET' | 'POST';
    params?: Record<string, string>;
  }
): Promise<T> {
  const method = options?.method || 'GET';
  let url = `https://api.stripe.com/v1${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
  };

  let body: string | undefined;
  if (options?.params) {
    const encoded = new URLSearchParams(options.params).toString();
    if (method === 'GET') {
      url += (url.includes('?') ? '&' : '?') + encoded;
    } else {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      body = encoded;
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body,
  });

  const json = await res.json();
  if (!res.ok) {
    const message = json?.error?.message || `Stripe request failed (${res.status})`;
    throw new Error(message);
  }
  return json as T;
}

async function resolveActivePriceId(secretKey: string, configuredId?: string): Promise<{
  priceId: string;
  planName: string;
  unitAmount: number;
  currency: string;
  interval: string;
}> {
  if (configuredId && configuredId.startsWith('price_')) {
    try {
      const price = await stripeApiRequest<{
        id: string;
        unit_amount: number | null;
        currency: string;
        recurring?: { interval: string } | null;
        product: string | { name?: string };
      }>(`/prices/${configuredId}`, secretKey, {
        params: { 'expand[0]': 'product' },
      });
      const prodName =
        typeof price.product === 'object' && price.product?.name
          ? price.product.name
          : 'PhotoFlow Studio';
      return {
        priceId: price.id,
        planName: prodName,
        unitAmount: price.unit_amount ?? 1900,
        currency: (price.currency || 'usd').toUpperCase(),
        interval: price.recurring?.interval || 'month',
      };
    } catch {
      // Fall through to auto-discovery if price ID wasn't found
    }
  }

  if (configuredId && configuredId.startsWith('prod_')) {
    try {
      const list = await stripeApiRequest<{
        data: Array<{
          id: string;
          unit_amount: number | null;
          currency: string;
          recurring?: { interval: string } | null;
        }>;
      }>('/prices', secretKey, {
        params: {
          product: configuredId,
          active: 'true',
          limit: '5',
        },
      });
      const recurringPrice = list.data.find((p) => p.recurring) || list.data[0];
      if (recurringPrice) {
        return {
          priceId: recurringPrice.id,
          planName: 'PhotoFlow Studio',
          unitAmount: recurringPrice.unit_amount ?? 1900,
          currency: (recurringPrice.currency || 'usd').toUpperCase(),
          interval: recurringPrice.recurring?.interval || 'month',
        };
      }
    } catch {
      // Fall through
    }
  }

  // Auto-discover any active recurring price in the Stripe account
  const pricesList = await stripeApiRequest<{
    data: Array<{
      id: string;
      unit_amount: number | null;
      currency: string;
      recurring?: { interval: string } | null;
      product: string | { name?: string };
    }>;
  }>('/prices', secretKey, {
    params: {
      active: 'true',
      type: 'recurring',
      limit: '5',
      'expand[0]': 'data.product',
    },
  });

  if (pricesList.data.length > 0) {
    const first = pricesList.data[0];
    const prodName =
      typeof first.product === 'object' && first.product?.name
        ? first.product.name
        : 'PhotoFlow Studio';
    return {
      priceId: first.id,
      planName: prodName,
      unitAmount: first.unit_amount ?? 1900,
      currency: (first.currency || 'usd').toUpperCase(),
      interval: first.recurring?.interval || 'month',
    };
  }

  // If no recurring price exists in the Stripe account yet, create one automatically
  const createdPrice = await stripeApiRequest<{
    id: string;
    unit_amount: number | null;
    currency: string;
    recurring?: { interval: string } | null;
  }>('/prices', secretKey, {
    method: 'POST',
    params: {
      currency: 'usd',
      unit_amount: '1900',
      'recurring[interval]': 'month',
      'product_data[name]': 'PhotoFlow Studio Subscription',
    },
  });

  return {
    priceId: createdPrice.id,
    planName: 'PhotoFlow Studio',
    unitAmount: createdPrice.unit_amount ?? 1900,
    currency: (createdPrice.currency || 'usd').toUpperCase(),
    interval: createdPrice.recurring?.interval || 'month',
  };
}

export async function fetchStripePlanSummary(): Promise<StripePlanSummary> {
  const { secretKey, priceId } = getStripeConfig();
  if (secretKey) {
    try {
      const resolved = await resolveActivePriceId(secretKey, priceId);
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: resolved.currency,
        minimumFractionDigits: resolved.unitAmount % 100 === 0 ? 0 : 2,
      }).format(resolved.unitAmount / 100);
      return {
        name: resolved.planName,
        amountFormatted: formatted,
        interval: resolved.interval,
        priceId: resolved.priceId,
      };
    } catch {
      // Fallback below
    }
  }

  return {
    name: 'PhotoFlow Studio',
    amountFormatted: '$19',
    interval: 'month',
    priceId: priceId || undefined,
  };
}

export async function verifyAndLoadSubscription(user: AuthUser): Promise<{
  isSubscribed: boolean;
  record: SubscriptionRecord;
  justCompletedCheckout: boolean;
  checkoutCanceled: boolean;
}> {
  const { secretKey } = getStripeConfig();
  const url = new URL(window.location.href);
  const checkoutParam = url.searchParams.get('stripe_checkout');
  const sessionIdParam = url.searchParams.get('session_id');
  const subscribedParam = url.searchParams.get('subscribed');

  let justCompletedCheckout = false;
  const checkoutCanceled = checkoutParam === 'canceled';

  if (checkoutParam || sessionIdParam || subscribedParam) {
    const cleanUrl = getCleanAppUrl();
    window.history.replaceState({}, document.title, cleanUrl);
  }

  // 1. Handle return from successful Stripe Checkout
  if (checkoutParam === 'success' || subscribedParam === 'true') {
    justCompletedCheckout = true;
    if (secretKey && sessionIdParam && !sessionIdParam.includes('CHECKOUT_SESSION_ID')) {
      try {
        const session = await stripeApiRequest<{
          id: string;
          status: string;
          payment_status: string;
          customer?: string | null;
          subscription?:
            | string
            | {
                id: string;
                status: string;
                current_period_end?: number;
                cancel_at_period_end?: boolean;
              }
            | null;
        }>(`/checkout/sessions/${sessionIdParam}`, secretKey, {
          params: { 'expand[0]': 'subscription' },
        });

        if (session.status === 'complete' || session.payment_status === 'paid') {
          const subObj =
            typeof session.subscription === 'object' && session.subscription
              ? session.subscription
              : null;
          const record: SubscriptionRecord = {
            status: 'active',
            sessionId: session.id,
            customerId: typeof session.customer === 'string' ? session.customer : undefined,
            subscriptionId:
              subObj?.id ||
              (typeof session.subscription === 'string' ? session.subscription : undefined),
            currentPeriodEnd: subObj?.current_period_end
              ? new Date(subObj.current_period_end * 1000).toISOString()
              : undefined,
            cancelAtPeriodEnd: subObj?.cancel_at_period_end ?? false,
            updatedAt: new Date().toISOString(),
          };
          await saveSubscriptionRecord(user.id, record);
          return {
            isSubscribed: true,
            record,
            justCompletedCheckout: true,
            checkoutCanceled: false,
          };
        }
      } catch {
        // If session lookup fails or Payment Link was used, still record completion below
      }
    }

    const fallbackRecord: SubscriptionRecord = {
      status: 'active',
      sessionId: sessionIdParam || undefined,
      updatedAt: new Date().toISOString(),
    };
    await saveSubscriptionRecord(user.id, fallbackRecord);
    return {
      isSubscribed: true,
      record: fallbackRecord,
      justCompletedCheckout: true,
      checkoutCanceled: false,
    };
  }

  // 2. If Stripe Secret Key is available, verify live subscription status by customer email
  if (secretKey && user.email) {
    try {
      const customers = await stripeApiRequest<{
        data: Array<{ id: string; email: string | null }>;
      }>('/customers', secretKey, {
        params: {
          email: user.email.trim(),
          limit: '5',
        },
      });

      for (const customer of customers.data) {
        const subs = await stripeApiRequest<{
          data: Array<{
            id: string;
            status: string;
            current_period_end: number;
            cancel_at_period_end: boolean;
            items?: {
              data?: Array<{
                price?: {
                  id?: string;
                  unit_amount?: number | null;
                  currency?: string;
                  recurring?: { interval?: string } | null;
                };
              }>;
            };
          }>;
        }>('/subscriptions', secretKey, {
          params: {
            customer: customer.id,
            status: 'all',
            limit: '10',
          },
        });

        const activeSub = subs.data.find(
          (s) => s.status === 'active' || s.status === 'trialing'
        );

        if (activeSub) {
          const firstPrice = activeSub.items?.data?.[0]?.price;
          const record: SubscriptionRecord = {
            status: activeSub.status === 'trialing' ? 'trialing' : 'active',
            customerId: customer.id,
            subscriptionId: activeSub.id,
            priceId: firstPrice?.id,
            amount: firstPrice?.unit_amount ?? undefined,
            currency: firstPrice?.currency?.toUpperCase(),
            interval: firstPrice?.recurring?.interval,
            currentPeriodEnd: activeSub.current_period_end
              ? new Date(activeSub.current_period_end * 1000).toISOString()
              : undefined,
            cancelAtPeriodEnd: activeSub.cancel_at_period_end,
            updatedAt: new Date().toISOString(),
          };
          await saveSubscriptionRecord(user.id, record);
          return {
            isSubscribed: true,
            record,
            justCompletedCheckout,
            checkoutCanceled,
          };
        }
      }
    } catch {
      // Fall back to stored subscription record if offline or network error
    }
  }

  // 3. Check stored subscription record in Supabase Auth metadata / Storage / localStorage
  const stored = await loadStoredSubscriptionRecord(user.id);
  if (stored && (stored.status === 'active' || stored.status === 'trialing')) {
    return {
      isSubscribed: true,
      record: stored,
      justCompletedCheckout,
      checkoutCanceled,
    };
  }

  return {
    isSubscribed: false,
    record: stored || { status: 'none', updatedAt: new Date().toISOString() },
    justCompletedCheckout,
    checkoutCanceled,
  };
}

export async function startStripeSubscriptionCheckout(user: AuthUser): Promise<void> {
  const { secretKey, publishableKey, priceId, paymentLink } = getStripeConfig();
  const baseUrl = getCleanAppUrl();
  const separator = baseUrl.includes('?') ? '&' : '?';
  const successUrl = `${baseUrl}${separator}stripe_checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}${separator}stripe_checkout=canceled`;

  // 1. Direct Stripe Checkout Session creation (works with zero backend on GitHub Pages)
  if (secretKey) {
    const resolved = await resolveActivePriceId(secretKey, priceId);

    // Check if a Stripe customer already exists for this email
    let existingCustomerId: string | undefined;
    if (user.email) {
      try {
        const custList = await stripeApiRequest<{
          data: Array<{ id: string }>;
        }>('/customers', secretKey, {
          params: { email: user.email.trim(), limit: '1' },
        });
        existingCustomerId = custList.data[0]?.id;
      } catch {
        // Ignore
      }
    }

    const sessionParams: Record<string, string> = {
      mode: 'subscription',
      'line_items[0][price]': resolved.priceId,
      'line_items[0][quantity]': '1',
      client_reference_id: user.id,
      allow_promotion_codes: 'true',
      success_url: successUrl,
      cancel_url: cancelUrl,
    };

    if (existingCustomerId) {
      sessionParams.customer = existingCustomerId;
    } else if (user.email) {
      sessionParams.customer_email = user.email.trim();
    }

    const session = await stripeApiRequest<{ id: string; url: string | null }>(
      '/checkout/sessions',
      secretKey,
      {
        method: 'POST',
        params: sessionParams,
      }
    );

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL.');
    }

    window.location.assign(session.url);
    return;
  }

  // 2. Stripe Hosted Payment Link
  if (paymentLink) {
    const linkUrl = new URL(paymentLink);
    if (user.email) {
      linkUrl.searchParams.set('prefilled_email', user.email.trim());
    }
    linkUrl.searchParams.set('client_reference_id', user.id);
    window.location.assign(linkUrl.toString());
    return;
  }

  // 3. Client-side Stripe.js redirectToCheckout (Publishable Key + Price ID)
  if (publishableKey && priceId) {
    await new Promise<void>((resolve, reject) => {
      if ((window as unknown as { Stripe?: unknown }).Stripe) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Stripe.js'));
      document.head.appendChild(script);
    });

    const stripeFactory = (
      window as unknown as {
        Stripe?: (key: string) => {
          redirectToCheckout: (opts: Record<string, unknown>) => Promise<{ error?: { message: string } }>;
        };
      }
    ).Stripe;

    if (!stripeFactory) {
      throw new Error('Stripe.js failed to initialize.');
    }

    const stripe = stripeFactory(publishableKey);
    const result = await stripe.redirectToCheckout({
      mode: 'subscription',
      lineItems: [{ price: priceId, quantity: 1 }],
      customerEmail: user.email || undefined,
      clientReferenceId: user.id,
      successUrl: `${baseUrl}${separator}stripe_checkout=success`,
      cancelUrl,
    });

    if (result?.error?.message) {
      throw new Error(result.error.message);
    }
    return;
  }

  // 4. Optional Supabase Edge Function fallback
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        userId: user.id,
        email: user.email,
        priceId: priceId || undefined,
        successUrl,
        cancelUrl,
      },
    });
    if (!error && data?.url) {
      window.location.assign(data.url);
      return;
    }
  }

  throw new Error(
    'Stripe is not configured. Add VITE_STRIPE_SECRET_KEY (or VITE_STRIPE_PAYMENT_LINK) to your GitHub Actions secrets.'
  );
}

export async function openStripeBillingPortal(
  user: AuthUser,
  subscription: SubscriptionRecord | null
): Promise<void> {
  const { secretKey } = getStripeConfig();
  const returnUrl = getCleanAppUrl();

  if (!secretKey) {
    throw new Error('Stripe Billing Portal requires VITE_STRIPE_SECRET_KEY to be configured.');
  }

  let customerId = subscription?.customerId;
  if (!customerId && user.email) {
    const customers = await stripeApiRequest<{
      data: Array<{ id: string }>;
    }>('/customers', secretKey, {
      params: { email: user.email.trim(), limit: '1' },
    });
    customerId = customers.data[0]?.id;
  }

  if (!customerId) {
    throw new Error('No Stripe customer record found for this account.');
  }

  const portal = await stripeApiRequest<{ url: string }>('/billing_portal/sessions', secretKey, {
    method: 'POST',
    params: {
      customer: customerId,
      return_url: returnUrl,
    },
  });

  if (portal.url) {
    window.location.assign(portal.url);
  }
}
