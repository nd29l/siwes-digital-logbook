/**
 * @file src/components/ui/EmptyState.tsx
 * @description Standardized empty state presentation with icon, title, description, and action button.
 */

import React from 'react';
import { cn } from '@/utils';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button, ButtonProps } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  actionVariant?: ButtonProps['variant'];
  className?: string;
  id?: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction,
  actionVariant = 'primary',
  className,
  id,
  children,
}) => {
  return (
    <div
      id={id}
      className={cn(
        'p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white space-y-4 max-w-lg mx-auto shadow-2xs',
        className
      )}
    >
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-purple-50 text-purple-700 mx-auto flex items-center justify-center border border-purple-100 shadow-2xs">
        <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actionText && onAction && (
        <div className="pt-2">
          <Button
            type="button"
            variant={actionVariant}
            size="sm"
            onClick={onAction}
            className="text-xs"
          >
            {actionText}
          </Button>
        </div>
      )}

      {children}
    </div>
  );
};
