import React, { useState, useEffect } from 'react';
import { CurrencyCode } from '../../types';
import {
  formatNumberForCurrency,
  getCurrencyConfig,
  parseLocalizedCurrencyInput,
} from '../../utils/format';

interface CurrencyInputProps {
  value: number;
  onChange: (num: number) => void;
  currency: CurrencyCode;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  currency,
  placeholder,
  className = '',
  required = false,
}) => {
  const cfg = getCurrencyConfig(currency);
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!focused) {
      if (!value || value === 0) {
        setText('');
      } else {
        setText(formatNumberForCurrency(value, currency, false));
      }
    }
  }, [value, currency, focused]);

  const defaultPlaceholder =
    placeholder ??
    (cfg.decimals === 0 ? '0' : `0${cfg.decimalSep}00`);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.,]/g, '');
    setText(raw);
    const parsed = parseLocalizedCurrencyInput(raw, currency);
    onChange(parsed);
  };

  const handleBlur = () => {
    setFocused(false);
    const parsed = parseLocalizedCurrencyInput(text, currency);
    onChange(parsed);
    if (!parsed || parsed === 0) {
      setText('');
    } else {
      setText(formatNumberForCurrency(parsed, currency, false));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.blur();
    }
  };

  return (
    <div className="relative flex items-center">
      {cfg.symbolPosition === 'prefix' && (
        <span className="absolute left-3 text-xs text-neutral-400 pointer-events-none select-none">
          {cfg.symbol.trim()}
        </span>
      )}
      <input
        type="text"
        inputMode="decimal"
        required={required}
        value={text}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={defaultPlaceholder}
        className={`w-full h-9 rounded-md bg-white border border-neutral-200 text-sm text-black tabular-nums focus:outline-none focus:border-black ${
          cfg.symbolPosition === 'prefix' ? 'pl-8 pr-3' : 'pl-3 pr-9'
        } ${className}`}
      />
      {cfg.symbolPosition === 'suffix' && (
        <span className="absolute right-3 text-xs text-neutral-400 pointer-events-none select-none">
          {cfg.symbol.trim()}
        </span>
      )}
    </div>
  );
};
