/**
 * Avatar - Presentational Component
 * Pure UI component for displaying user avatars
 * DUMB component - no business logic, just props
 */

import { cn } from '@/lib/utils';
import { getInitials, getAvatarColor } from '@/shared/lib/chatUtils';

export interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
} as const;

export function Avatar({ src, name, size = 'md', online, className }: AvatarProps) {
  const sizeClass = SIZE_CLASSES[size];
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  return (
    <div className={cn('relative inline-block', className)}>
      <div
        className={cn(
          'flex items-center justify-center overflow-hidden rounded-full font-medium',
          sizeClass
        )}
        style={{ backgroundColor: src ? 'transparent' : bgColor }}
      >
        {src ? (
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-white">{initials}</span>
        )}
      </div>

      {online !== undefined && (
        <div
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white',
            online ? 'bg-green-500' : 'bg-gray-400',
            size === 'xs' ? 'h-2 w-2' : size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'
          )}
        />
      )}
    </div>
  );
}
