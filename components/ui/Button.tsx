'use client';

import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:transform-none select-none rounded-xl';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base gap-2.5',
    icon: 'p-2.5 w-10 h-10',
  };

  const variantStyles = {
    primary:
      'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-sm hover:shadow-md focus-visible:ring-primary-500',
    secondary:
      'bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-slate-800 dark:text-slate-100 focus-visible:ring-slate-400',
    outline:
      'border border-surface-300 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 text-slate-700 dark:text-slate-200 focus-visible:ring-primary-500',
    ghost:
      'text-slate-600 dark:text-slate-300 hover:bg-surface-100 dark:hover:bg-surface-800 focus-visible:ring-slate-400',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-sm focus-visible:ring-red-500',
  };

  return (
    <button
      className={`${base} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
      ) : null}
      {children}
    </button>
  );
};
