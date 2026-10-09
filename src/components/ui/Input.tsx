/**
 * @file src/components/ui/Input.tsx
 * @description Accessible form input component with labels, icons, error states, and helper text.
 */

import React from 'react';
import { cn } from '@/utils';
import { LucideIcon } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  id: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      id,
      className,
      type = 'text',
      disabled,
      readOnly,
      required,
      ...props
    },
    ref
  ) => {
    const errorId = error ? `${id}-error` : undefined;
    const helperId = helperText ? `${id}-helper` : undefined;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={id}
              className="block text-xs font-semibold text-slate-700 tracking-wide"
            >
              {label}
              {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
            </label>
            {readOnly && (
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                Read-only
              </span>
            )}
          </div>
        )}

        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Icon className="w-4 h-4" />
            </div>
          )}

          <input
            ref={ref}
            id={id}
            type={type}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId || helperId}
            className={cn(
              'w-full text-base sm:text-sm rounded-xl border bg-white px-3.5 py-2.5 sm:py-2 sm:px-3 min-h-[42px] sm:min-h-[38px] text-slate-900 transition-colors duration-150 placeholder:text-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600',
              Icon && 'pl-10',
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100 text-rose-950'
                : 'border-slate-300 hover:border-slate-400',
              (disabled || readOnly) &&
                'bg-slate-50/80 text-slate-600 cursor-not-allowed border-slate-200 select-all',
              className
            )}
            {...props}
          />
        </div>

        {error && (
          <p id={errorId} className="text-xs text-rose-600 font-medium">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={helperId} className="text-xs text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
