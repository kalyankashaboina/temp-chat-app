/**
 * LoadingSpinner - Presentational Component
 * Pure UI component for loading states
 */

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const SIZE_CLASSES = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
} as const;

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-primary', SIZE_CLASSES[size])} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
