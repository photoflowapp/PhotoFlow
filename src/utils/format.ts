import { CurrencyCode } from '../types';

export interface CurrencyConfig {
  code: CurrencyCode;
  label: string;
  symbol: string;
  locale: string;
  thousandsSep: ',' | '.';
  decimalSep: '.' | ',';
  symbolPosition: 'prefix' | 'suffix';
  decimals: number;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  {
    code: 'USD',
    label: 'US Dollar',
    symbol: '$',
    locale: 'en-US',
    thousandsSep: ',',
    decimalSep: '.',
    symbolPosition: 'prefix',
    decimals: 2,
  },
  {
    code: 'EUR',
    label: 'Euro',
    symbol: '€',
    locale: 'de-DE',
    thousandsSep: '.',
    decimalSep: ',',
    symbolPosition: 'suffix',
    decimals: 2,
  },
  {
    code: 'GBP',
    label: 'British Pound',
    symbol: '£',
    locale: 'en-GB',
    thousandsSep: ',',
    decimalSep: '.',
    symbolPosition: 'prefix',
    decimals: 2,
  },
  {
    code: 'CAD',
    label: 'Canadian Dollar',
    symbol: 'CA$',
    locale: 'en-CA',
    thousandsSep: ',',
    decimalSep: '.',
    symbolPosition: 'prefix',
    decimals: 2,
  },
  {
    code: 'AUD',
    label: 'Australian Dollar',
    symbol: 'A$',
    locale: 'en-AU',
    thousandsSep: ',',
    decimalSep: '.',
    symbolPosition: 'prefix',
    decimals: 2,
  },
  {
    code: 'CHF',
    label: 'Swiss Franc',
    symbol: 'CHF ',
    locale: 'de-CH',
    thousandsSep: '.',
    decimalSep: ',',
    symbolPosition: 'prefix',
    decimals: 2,
  },
  {
    code: 'SEK',
    label: 'Swedish Krona',
    symbol: 'kr',
    locale: 'sv-SE',
    thousandsSep: '.',
    decimalSep: ',',
    symbolPosition: 'suffix',
    decimals: 2,
  },
  {
    code: 'NOK',
    label: 'Norwegian Krone',
    symbol: 'kr',
    locale: 'nb-NO',
    thousandsSep: '.',
    decimalSep: ',',
    symbolPosition: 'suffix',
    decimals: 2,
  },
  {
    code: 'DKK',
    label: 'Danish Krone',
    symbol: 'kr.',
    locale: 'da-DK',
    thousandsSep: '.',
    decimalSep: ',',
    symbolPosition: 'suffix',
    decimals: 2,
  },
  {
    code: 'NZD',
    label: 'New Zealand Dollar',
    symbol: 'NZ$',
    locale: 'en-NZ',
    thousandsSep: ',',
    decimalSep: '.',
    symbolPosition: 'prefix',
    decimals: 2,
  },
  {
    code: 'JPY',
    label: 'Japanese Yen',
    symbol: '¥',
    locale: 'ja-JP',
    thousandsSep: ',',
    decimalSep: '.',
    symbolPosition: 'prefix',
    decimals: 0,
  },
];

export function getCurrencyConfig(currency: CurrencyCode = 'USD'): CurrencyConfig {
  return SUPPORTED_CURRENCIES.find((c) => c.code === currency) || SUPPORTED_CURRENCIES[0];
}

export function formatNumberForCurrency(
  amount: number,
  currency: CurrencyCode = 'USD',
  forceDecimals = false
): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const cfg = getCurrencyConfig(currency);
  const isNegative = safeAmount < 0;
  const abs = Math.abs(safeAmount);

  const hasFraction = Math.round((abs % 1) * 100) !== 0;
  const decimalsToUse = cfg.decimals === 0 ? 0 : hasFraction || forceDecimals ? cfg.decimals : 0;

  const fixed = abs.toFixed(decimalsToUse);
  const [intPart, decPart] = fixed.split('.');

  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, cfg.thousandsSep);
  const numberString =
    decPart !== undefined && decimalsToUse > 0
      ? `${formattedInt}${cfg.decimalSep}${decPart}`
      : formattedInt;

  return isNegative ? `-${numberString}` : numberString;
}

export function formatCurrency(amount: number, currency: CurrencyCode = 'USD'): string {
  const cfg = getCurrencyConfig(currency);
  const numStr = formatNumberForCurrency(amount, currency, false);

  if (cfg.symbolPosition === 'prefix') {
    return `${cfg.symbol}${numStr}`;
  }
  return `${numStr} ${cfg.symbol.trim()}`;
}

/**
 * Parses a localized currency input string (respecting the currency's period/comma rules)
 * into a numeric value.
 */
export function parseLocalizedCurrencyInput(raw: string, currency: CurrencyCode = 'USD'): number {
  if (!raw || !raw.trim()) return 0;
  const cfg = getCurrencyConfig(currency);
  // Keep only digits, commas, periods
  const cleaned = raw.replace(/[^0-9.,]/g, '');
  if (!cleaned) return 0;

  if (cfg.decimals === 0) {
    return parseInt(cleaned.replace(/[.,]/g, ''), 10) || 0;
  }

  // If decimal separator is ',' (e.g. EUR, SEK, NOK, DKK, CHF):
  // '.' is thousands separator unless it's the only separator and user typed '.' as decimal
  if (cfg.decimalSep === ',') {
    if (cleaned.includes(',')) {
      const normalized = cleaned.replace(/\./g, '').replace(',', '.');
      return parseFloat(normalized) || 0;
    }
    // If only periods exist, check if last period has 1-2 digits and there's only one period
    const parts = cleaned.split('.');
    if (parts.length === 2 && parts[1].length <= 2) {
      return parseFloat(cleaned) || 0;
    }
    return parseFloat(cleaned.replace(/\./g, '')) || 0;
  } else {
    // Decimal separator is '.' (e.g. USD, GBP, CAD, AUD, NZD)
    if (cleaned.includes('.')) {
      const normalized = cleaned.replace(/,/g, '');
      return parseFloat(normalized) || 0;
    }
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      return parseFloat(cleaned.replace(',', '.')) || 0;
    }
    return parseFloat(cleaned.replace(/,/g, '')) || 0;
  }
}

export function formatShortDate(isoDate?: string): string {
  if (!isoDate) return '—';
  const parsed = new Date(isoDate.length === 10 ? `${isoDate}T00:00:00` : isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return '';
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatShortDate(isoTimestamp);
}

export function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysIso(baseIso: string, days: number): string {
  const base = baseIso
    ? new Date(baseIso.length === 10 ? `${baseIso}T00:00:00` : baseIso)
    : new Date();
  if (Number.isNaN(base.getTime())) return todayIsoDate();
  base.setDate(base.getDate() + days);
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, '0');
  const d = String(base.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
