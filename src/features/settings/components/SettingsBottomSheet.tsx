import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Option<T> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface SettingsBottomSheetProps<T> {
  open: boolean;
  onClose: () => void;
  title: string;
  options: Option<T>[];
  currentValue: T;
  onConfirm: (value: T) => void;
  isLoading?: boolean;
}

export function SettingsBottomSheet<T extends string>({
  open,
  onClose,
  title,
  options,
  currentValue,
  onConfirm,
  isLoading = false,
}: SettingsBottomSheetProps<T>) {
  const [selectedValue, setSelectedValue] = useState<T>(currentValue);

  // Reset selection when opened
  useEffect(() => {
    if (open) {
      setSelectedValue(currentValue);
    }
  }, [open, currentValue]);

  const handleConfirm = () => {
    onConfirm(selectedValue);
  };

  const handleCancel = () => {
    setSelectedValue(currentValue);
    onClose();
  };

  const hasChanged = selectedValue !== currentValue;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={handleCancel}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[80vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-4 border-b border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-muted-foreground"
              >
                Cancel
              </Button>
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleConfirm}
                disabled={!hasChanged || isLoading}
                className={cn(
                  'font-semibold',
                  hasChanged && !isLoading ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Done'
                )}
              </Button>
            </div>

            {/* Options */}
            <div className="overflow-y-auto max-h-[60vh] p-4">
              <div className="space-y-2">
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedValue(option.value)}
                    className={cn(
                      'w-full flex items-center justify-between p-4 rounded-xl transition-all',
                      selectedValue === option.value
                        ? 'bg-primary/10 border-2 border-primary'
                        : 'bg-card border-2 border-transparent hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {option.icon && (
                        <div className={cn(
                          'p-2 rounded-lg',
                          selectedValue === option.value ? 'bg-primary/20' : 'bg-muted'
                        )}>
                          {option.icon}
                        </div>
                      )}
                      <div className="text-left">
                        <p className={cn(
                          'font-medium',
                          selectedValue === option.value ? 'text-primary' : 'text-foreground'
                        )}>
                          {option.label}
                        </p>
                        {option.description && (
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        )}
                      </div>
                    </div>
                    {selectedValue === option.value && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Safe area for mobile */}
            <div className="h-safe-area-inset-bottom pb-6" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
