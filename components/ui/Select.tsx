'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { useBackAction } from '@/lib/platform/back';

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps<T extends string | number> {
  value: T;
  options: readonly SelectOption<T>[];
  onValueChange: (value: T) => void;
  ariaLabel: string;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  tone?: 'default' | 'dark';
  size?: 'sm' | 'md';
  className?: string;
  menuClassName?: string;
}

export function getSelectableIndex<T extends string | number>(
  options: readonly SelectOption<T>[],
  value: T
): number {
  const selected = options.findIndex((option) => Object.is(option.value, value) && !option.disabled);
  if (selected >= 0) return selected;
  return options.findIndex((option) => !option.disabled);
}

export function getNextSelectableIndex<T extends string | number>(
  options: readonly SelectOption<T>[],
  currentIndex: number,
  direction: 1 | -1
): number {
  if (!options.length) return -1;
  let index = currentIndex;
  for (let step = 0; step < options.length; step += 1) {
    index = (index + direction + options.length) % options.length;
    if (!options[index].disabled) return index;
  }
  return currentIndex;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function SelectComponent<T extends string | number>({
  value,
  options,
  onValueChange,
  ariaLabel,
  id,
  disabled = false,
  placeholder = 'Pilih',
  tone = 'default',
  size = 'md',
  className = '',
  menuClassName = '',
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => getSelectableIndex(options, value));
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 320 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const menuId = useId();
  const selectedOption = options.find((option) => Object.is(option.value, value));

  useBackAction(isOpen, () => {
    close();
    return true;
  }, 100);

  useEffect(() => {
    if (!isOpen) setActiveIndex(getSelectableIndex(options, value));
  }, [isOpen, options, value]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || typeof window === 'undefined') return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportPadding = 8;
    const menuGap = 4;
    const menuMaxHeight = 320;
    const estimatedHeight = Math.min(menuMaxHeight, Math.max(40, options.length * 40 + 8));
    const measuredHeight = Math.max(40, menuRef.current?.scrollHeight ?? estimatedHeight);
    const desiredHeight = Math.min(menuMaxHeight, measuredHeight);
    const spaceBelow = Math.max(0, window.innerHeight - rect.bottom - viewportPadding - menuGap);
    const spaceAbove = Math.max(0, rect.top - viewportPadding - menuGap);
    const opensUp = spaceBelow < desiredHeight && spaceAbove > spaceBelow;
    const availableSpace = opensUp ? spaceAbove : spaceBelow;
    const maxHeight = Math.max(80, Math.min(menuMaxHeight, availableSpace || menuMaxHeight));
    const visibleHeight = Math.min(desiredHeight, maxHeight);
    const preferredTop = opensUp
      ? rect.top - visibleHeight - menuGap
      : rect.bottom + menuGap;
    const top = clamp(
      preferredTop,
      viewportPadding,
      Math.max(viewportPadding, window.innerHeight - visibleHeight - viewportPadding)
    );
    const width = Math.min(Math.max(rect.width, 180), window.innerWidth - viewportPadding * 2);
    const left = clamp(rect.left, viewportPadding, window.innerWidth - width - viewportPadding);
    setPosition({ top, left, width, maxHeight });
  }, [options]);

  const close = useCallback((restoreFocus = true) => {
    setIsOpen(false);
    if (restoreFocus) window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  const open = () => {
    if (disabled || !options.some((option) => !option.disabled)) return;
    setActiveIndex(getSelectableIndex(options, value));
    updatePosition();
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const handleOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close(false);
    };
    const handleViewportChange = () => updatePosition();
    document.addEventListener('pointerdown', handleOutsidePointer);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [close, isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen || activeIndex < 0) return;
    const frame = window.requestAnimationFrame(() => optionRefs.current[activeIndex]?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen, activeIndex]);

  const moveActive = (direction: 1 | -1) => {
    setActiveIndex((current) => getNextSelectableIndex(options, current, direction));
  };

  const selectActive = () => {
    const option = options[activeIndex];
    if (!option || option.disabled) return;
    onValueChange(option.value);
    close();
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) open();
      else moveActive(event.key === 'ArrowUp' ? -1 : 1);
    }
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      close();
    }
  };

  const handleOptionKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(options.findIndex((option) => !option.disabled));
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex([...options].map((option) => !option.disabled).lastIndexOf(true));
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectActive();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      close(false);
    }
  };

  const triggerStyles = tone === 'dark'
    ? 'border-white/10 bg-white/10 text-white hover:bg-white/15 focus-visible:ring-primary-300'
    : 'border-surface-200 bg-surface-50 text-slate-700 hover:border-surface-300 hover:bg-white dark:border-surface-700 dark:bg-surface-800 dark:text-slate-200 dark:hover:border-surface-600 focus-visible:ring-primary-500';
  const menuStyles = tone === 'dark'
    ? 'border-white/15 bg-slate-900 text-white shadow-2xl'
    : 'border-surface-200 bg-white text-slate-700 shadow-xl shadow-slate-950/10 dark:border-surface-700 dark:bg-surface-900 dark:text-slate-200';
  const sizeStyles = size === 'sm' ? 'min-h-11 px-3 py-2 text-xs sm:min-h-9' : 'min-h-11 px-3.5 py-2.5 text-sm';

  const menu = isOpen && typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="listbox"
          aria-label={ariaLabel}
          className={`fixed z-[100] overflow-y-auto rounded-xl border p-1 outline-none transition duration-150 ease-out motion-reduce:transition-none ${menuStyles} ${menuClassName}`}
          style={{ top: position.top, left: position.left, width: position.width, maxHeight: position.maxHeight }}
        >
          {options.map((option, index) => {
            const isSelected = Object.is(option.value, value);
            const isActive = index === activeIndex;
            return (
              <div
                key={String(option.value)}
                ref={(element) => { optionRefs.current[index] = element; }}
                role="option"
                tabIndex={option.disabled ? -1 : 0}
                aria-selected={isSelected}
                aria-disabled={option.disabled || undefined}
                onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                onClick={() => {
                  if (option.disabled) return;
                  onValueChange(option.value);
                  close();
                }}
                onKeyDown={handleOptionKeyDown}
                className={`flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm outline-none transition-colors motion-reduce:transition-none ${
                  option.disabled
                    ? 'cursor-not-allowed opacity-45'
                    : isActive
                    ? tone === 'dark'
                      ? 'bg-white/10 text-white'
                      : 'bg-primary-50 text-primary-900 dark:bg-primary-950/70 dark:text-primary-100'
                    : 'hover:bg-surface-50 dark:hover:bg-surface-800'
                }`}
              >
                {option.icon && <span className="shrink-0" aria-hidden="true">{option.icon}</span>}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{option.label}</span>
                  {option.description && <span className="mt-0.5 block truncate text-[11px] opacity-65">{option.description}</span>}
                </span>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-300" aria-hidden="true" />}
              </div>
            );
          })}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        disabled={disabled}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={handleTriggerKeyDown}
        className={`inline-flex max-w-full items-center justify-between gap-2 rounded-xl border font-medium outline-none transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${sizeStyles} ${triggerStyles} ${className}`}
      >
        <span className="min-w-0 truncate text-left">{selectedOption?.label ?? placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 opacity-70 transition-transform duration-150 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {menu}
    </>
  );
}

export const Select = SelectComponent;
