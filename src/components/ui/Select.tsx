/**
 * @file src/components/ui/Select.tsx
 * @description Accessible select component styled consistently with form inputs, focus rings, and labels.
 */

import React from 'react';
import { cn } from '@/utils';
import { ChevronDown, LucideIcon } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  options?: SelectOption[];
  id: string;
  children?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      options,
      id,
      className,
      disabled,
      required,
      children,
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
          </div>
        )}

        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Icon className="w-4 h-4" />
            </div>
          )}

          <select
            ref={ref}
            id={id}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId || helperId}
            className={cn(
              'w-full appearance-none rounded-xl border bg-white text-base sm:text-sm font-medium text-slate-900 transition-colors cursor-pointer min-h-[42px] sm:min-h-[38px]',
              'py-2.5 pr-9 pl-3.5',
              Icon && 'pl-10',
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                : 'border-slate-300 hover:border-slate-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-100',
              'focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed',
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

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

Select.displayName = 'Select';
