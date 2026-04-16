import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Timer, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface VanishModeToggleProps {
  isEnabled: boolean;
  timer: number; // seconds
  onToggle: (enabled: boolean, timer: number) => void;
  translate: (key: string) => string;
}

const TIMER_OPTIONS = [
  { value: 5, label: '5 seconds' },
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
  { value: 3600, label: '1 hour' },
  { value: 86400, label: '24 hours' },
];

export function VanishModeToggle({ isEnabled, timer, onToggle, translate }: VanishModeToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = TIMER_OPTIONS.find(o => o.value === timer) || TIMER_OPTIONS[2];

  const handleTimerSelect = (value: number) => {
    onToggle(true, value);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
            isEnabled
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
              : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20'
          )}
        >
          <Timer className="h-3.5 w-3.5" />
          {isEnabled ? (
            <>
              <span className="hidden sm:inline">{translate('vanish.on')}</span>
              <span className="opacity-75 hidden sm:inline">• {currentOption.label}</span>
              <ChevronDown className="h-3 w-3" />
            </>
          ) : (
            <span className="hidden sm:inline">{translate('vanish.off')}</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Message Timer
        </div>
        {TIMER_OPTIONS.map(option => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleTimerSelect(option.value)}
            className={cn(
              'cursor-pointer',
              timer === option.value && isEnabled && 'bg-primary/10 text-primary'
            )}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
        {isEnabled && (
          <>
            <div className="h-px bg-border my-1" />
            <DropdownMenuItem
              onClick={() => onToggle(false, timer)}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              {translate('vanish.turnOff')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
