/**
 * @file src/components/ui/Button.tsx
 * @description Accessible button component respecting 2x horizontal-to-vertical padding math.
 */

import React from 'react';
import { cn } from '@/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  id,
  type = 'button',
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary:
      'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 shadow-sm border border-slate-900',
    secondary:
      'bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300 border border-slate-200',
    outline:
      'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 active:bg-slate-100',
    ghost:
      'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 border border-transparent',
  };

  const sizeStyles = {
    // Math: Horizontal padding approx 2x vertical padding with comfortable touch target heights
    sm: 'text-xs py-1.5 px-3 rounded-lg font-medium min-h-[36px]',
    md: 'text-sm py-2 px-4 rounded-lg font-medium min-h-[42px]',
    lg: 'text-base py-2.5 px-5 rounded-lg font-semibold min-h-[46px]',
  };

  return (
    <button
      id={id}
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 cursor-pointer transition-colors duration-150 select-none whitespace-nowrap touch-manipulation',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
