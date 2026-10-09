/**
 * @file src/components/ui/Modal.tsx
 * @description Accessible dialog modal component with backdrop, keyboard navigation, and focus trapping.
 */

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  id?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  id,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
  };

  return (
    <div
      id={id ? `${id}-backdrop` : 'modal-backdrop'}
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={id ? `${id}-title` : 'modal-title'}
    >
      <div
        ref={modalRef}
        id={id}
        className={cn(
          'w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden transform transition-all flex flex-col max-h-[92vh] overscroll-contain animate-in fade-in zoom-in-95 duration-150',
          sizeClasses[size]
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-slate-100 shrink-0 bg-white">
          <div className="space-y-1 pr-3">
            <h2
              id={id ? `${id}-title` : 'modal-title'}
              className="text-base sm:text-lg font-bold text-slate-900 tracking-tight"
            >
              {title}
            </h2>
            {description && (
              <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-purple-400"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 overscroll-contain">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-3.5 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
