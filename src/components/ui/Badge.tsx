/**
 * @file src/components/ui/Badge.tsx
 * @description Reusable badge component for statuses, tags, and role indicators.
 */

import React from 'react';
import { cn } from '@/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'info' | 'neutral' | 'purple' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  className,
  children,
  id,
  ...props
}) => {
  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 font-medium',
    warning: 'bg-amber-50 text-amber-900 border-amber-200/90 font-medium',
    info: 'bg-sky-50 text-sky-900 border-sky-200/90 font-medium',
    neutral: 'bg-slate-100 text-slate-800 border-slate-200/90 font-medium',
    purple: 'bg-purple-50 text-purple-900 border-purple-200/90 font-medium',
    danger: 'bg-rose-50 text-rose-900 border-rose-200/90 font-medium',
  };

  const sizeStyles = {
    sm: 'text-2xs sm:text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  return (
    <span
      id={id}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border tracking-wide whitespace-nowrap transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
