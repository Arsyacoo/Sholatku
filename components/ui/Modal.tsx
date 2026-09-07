'use client';

import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { useBackAction } from '@/lib/platform/back';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  initialFocus?: React.RefObject<HTMLElement | null>;
  returnFocusSelector?: string;
}

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => {
    if (element.getAttribute('aria-hidden') === 'true') return false;
    if (element instanceof HTMLButtonElement && element.disabled) return false;
    return element.getClientRects().length > 0;
  });
}

function isSelectPortalTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('[role="listbox"]'));
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
  initialFocus,
  returnFocusSelector,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const previousFocusDescriptorRef = useRef<{ id?: string; ariaLabel?: string }>({});
  const lastOutsideFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  useBackAction(isOpen, () => {
    onCloseRef.current();
    return true;
  }, 50);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const rememberOutsideFocus = (event: FocusEvent) => {
      if (!isOpen && event.target instanceof HTMLElement && event.target !== document.body && event.target !== document.documentElement) {
        lastOutsideFocusRef.current = event.target;
      }
    };
    const rememberOutsidePointer = (event: PointerEvent) => {
      if (!isOpen && event.target instanceof Element) {
        const candidate = event.target.closest<HTMLElement>('button, a[href], [tabindex]');
        if (candidate && candidate !== document.body) lastOutsideFocusRef.current = candidate;
      }
    };
    document.addEventListener('focusin', rememberOutsideFocus, true);
    document.addEventListener('pointerdown', rememberOutsidePointer, true);
    return () => {
      document.removeEventListener('focusin', rememberOutsideFocus, true);
      document.removeEventListener('pointerdown', rememberOutsidePointer, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !dialogRef.current) return undefined;

    const dialog = dialogRef.current;
    previousFocusRef.current = lastOutsideFocusRef.current
      ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    previousFocusDescriptorRef.current = previousFocusRef.current
      ? {
          id: previousFocusRef.current.id || undefined,
          ariaLabel: previousFocusRef.current.getAttribute('aria-label') || undefined,
        }
      : {};
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusFirst = () => {
      const explicit = initialFocus?.current;
      const autoFocus = dialog.querySelector<HTMLElement>('[autofocus], input, textarea');
      const next = explicit && explicit.isConnected
        ? explicit
        : autoFocus ?? getFocusableElements(dialog)[0] ?? dialog;
      next.focus();
    };

    const focusFrame = window.requestAnimationFrame(focusFirst);
    const restoreFocus = () => {
      window.setTimeout(() => {
        let previousFocus = previousFocusRef.current;
        if (!previousFocus?.isConnected || previousFocus === document.body || previousFocus === document.documentElement) {
          const descriptor = previousFocusDescriptorRef.current;
          if (descriptor.id) previousFocus = document.getElementById(descriptor.id);
          if (!previousFocus && descriptor.ariaLabel) {
            previousFocus = Array.from(document.querySelectorAll<HTMLElement>('[aria-label]'))
              .find((element) => element.getAttribute('aria-label') === descriptor.ariaLabel) ?? null;
          }
          if (!previousFocus && returnFocusSelector) {
            previousFocus = document.querySelector<HTMLElement>(returnFocusSelector);
          }
        }
        previousFocus?.focus();
      }, 0);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Select renders its listbox in a body portal. Let the Select own Escape
        // so closing a nested menu does not also close the parent dialog.
        if (isSelectPortalTarget(event.target)) return;
        event.preventDefault();
        restoreFocus();
        if (returnFocusSelector) document.querySelector<HTMLElement>(returnFocusSelector)?.focus();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || isSelectPortalTarget(event.target)) return;
      const focusables = getFocusableElements(dialog);
      if (!focusables.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const active = document.activeElement as HTMLElement | null;
      const activeIndex = active ? focusables.indexOf(active) : -1;
      if (event.shiftKey) {
        if (activeIndex <= 0) {
          event.preventDefault();
          focusables[focusables.length - 1].focus();
        }
      } else if (activeIndex === focusables.length - 1 || activeIndex < 0) {
        event.preventDefault();
        focusables[activeIndex < 0 ? 0 : 0].focus();
      }
    };
    const handleFocusIn = (event: FocusEvent) => {
      if (dialog.contains(event.target as Node) || isSelectPortalTarget(event.target)) return;
      focusFirst();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
      document.body.style.overflow = previousOverflow;
      restoreFocus();
    };
  }, [initialFocus, isOpen, returnFocusSelector]);

  if (!isOpen) return null;

  const widthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog container */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`relative w-full ${widthStyles[maxWidth]} bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-800 overflow-hidden z-10 animate-slide-up`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-800">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
