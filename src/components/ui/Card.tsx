/**
 * @file src/components/ui/Card.tsx
 * @description Standard content container card adhering to the mathematical padding and hierarchy rules.
 */

import React from 'react';
import { cn } from '@/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'subtle' | 'bordered';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  id,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white border border-slate-200/90 shadow-sm',
    subtle: 'bg-slate-50/70 border border-slate-200/70',
    bordered: 'bg-white border-2 border-slate-300',
  };

  return (
    <div
      id={id}
      className={cn(
        'rounded-xl p-5 md:p-6 transition-all duration-150',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
