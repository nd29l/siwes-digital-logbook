/**
 * @file src/components/ui/Textarea.tsx
 * @description Accessible textarea form control with character counter, error states, and labels.
 */

import React from 'react';
import { cn } from '@/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;
  maxLength?: number;
  id: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      showCount = false,
      maxLength,
      id,
      className,
      disabled,
      required,
      value,
      ...props
    },
    ref
  ) => {
    const errorId = error ? `${id}-error` : undefined;
    const helperId = helperText ? `${id}-helper` : undefined;

    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full space-y-1.5">
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={id}
              className="block text-xs font-semibold text-slate-700 tracking-wide"
            >
              {label}
              {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
            </label>
          )}

          {showCount && maxLength && (
            <span
              className={cn(
                'text-2xs font-mono',
                currentLength >= maxLength ? 'text-rose-600 font-bold' : 'text-slate-400'
              )}
            >
              {currentLength}/{maxLength}
            </span>
          )}
        </div>

        <textarea
          ref={ref}
          id={id}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId || helperId}
          className={cn(
            'w-full rounded-xl border bg-white px-3.5 py-2.5 text-base sm:text-sm text-slate-900 transition-colors',
            'placeholder:text-slate-400 focus:outline-none leading-relaxed',
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
              : 'border-slate-300 hover:border-slate-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-100',
            'disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />

        {error && (
          <p id={errorId} className="text-2xs text-rose-600 font-medium">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={helperId} className="text-2xs text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
