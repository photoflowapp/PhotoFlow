import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  dotColor?: string;
  sublabel?: string;
}

interface CustomSelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  size?: 'sm' | 'md';
  align?: 'left' | 'right';
}

interface MenuCoords {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  openUpward: boolean;
  bottom: number;
}

export function CustomSelect<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  triggerClassName = '',
  size = 'md',
  align = 'left',
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<MenuCoords | null>(null);

  const selected = options.find((o) => o.value === value);

  const updateCoords = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;
    const spaceBelow = viewportH - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const openUpward = spaceBelow < 220 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(140, Math.min(280, openUpward ? spaceAbove : spaceBelow));
    const minWidth = Math.max(rect.width, 168);

    let left = align === 'right' ? rect.right - minWidth : rect.left;
    if (left + minWidth > viewportW - 8) {
      left = Math.max(8, viewportW - minWidth - 8);
    }
    if (left < 8) left = 8;

    setCoords({
      top: rect.bottom + 4,
      bottom: viewportH - rect.top + 4,
      left,
      width: minWidth,
      maxHeight,
      openUpward,
    });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) return;
    updateCoords();
    const handleResizeOrScroll = () => updateCoords();
    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);
    return () => {
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
    };
  }, [open, updateCoords]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [open]);

  const sizeClasses =
    size === 'sm'
      ? 'h-8 px-2.5 text-xs gap-1.5'
      : 'h-9 px-3 text-sm gap-2';

  return (
    <div className={`relative inline-block w-full ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full inline-flex items-center justify-between rounded-md bg-white border border-neutral-200 hover:bg-neutral-50 text-black transition-colors focus:outline-none focus:border-black cursor-pointer ${sizeClasses} ${triggerClassName}`}
      >
        <span className="flex items-center gap-2 truncate">
          {selected?.dotColor && (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: selected.dotColor }}
            />
          )}
          <span className={selected ? 'text-black truncate' : 'text-neutral-400 truncate'}>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform duration-150 ${
            open ? 'rotate-180 text-black' : ''
          }`}
        />
      </button>

      {open &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9998] cursor-default"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
            }}
          >
            <div
              role="listbox"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                left: `${coords.left}px`,
                width: `${coords.width}px`,
                maxHeight: `${coords.maxHeight}px`,
                ...(coords.openUpward
                  ? { bottom: `${coords.bottom}px` }
                  : { top: `${coords.top}px` }),
              }}
              className="z-[9999] overflow-y-auto rounded-lg bg-white border border-neutral-200 shadow-2xl py-1"
            >
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-100 text-black font-medium'
                        : 'text-neutral-700 hover:bg-neutral-50 hover:text-black'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      {opt.dotColor && (
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: opt.dotColor }}
                        />
                      )}
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-xs text-neutral-400 truncate">
                          {opt.sublabel}
                        </span>
                      )}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-black shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
