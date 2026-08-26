'use client';

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'gold' | 'neutral' | 'success' | 'outline';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className = '' }) => {
  const variantStyles = {
    primary: 'bg-primary-50 text-primary-700 dark:bg-primary-950/70 dark:text-primary-300 border border-primary-200 dark:border-primary-800/60',
    gold: 'bg-gold-50 text-gold-700 dark:bg-gold-950/70 dark:text-gold-300 border border-gold-200 dark:border-gold-800/60',
    neutral: 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300 border border-surface-200 dark:border-surface-700',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    outline: 'border border-surface-300 dark:border-surface-700 text-surface-700 dark:text-surface-300',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
