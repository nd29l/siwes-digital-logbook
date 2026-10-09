/**
 * @file src/components/ui/LoadingState.tsx
 * @description Accessible loading indicator with animated spinner and informative status message.
 */

import React from 'react';
import { cn } from '@/utils';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  size = 'md',
  className,
}) => {
  const spinnerSizes = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-2xs',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'py-12 sm:py-16 flex flex-col items-center justify-center space-y-3 text-center',
        className
      )}
    >
      <Loader2
        className={cn('animate-spin text-purple-600', spinnerSizes[size])}
        aria-hidden="true"
      />
      {message && (
        <p className={cn('text-slate-500 font-medium', textSizes[size])}>
          {message}
        </p>
      )}
      <span className="sr-only">{message}</span>
    </div>
  );
};
