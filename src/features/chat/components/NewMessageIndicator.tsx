import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NewMessageIndicatorProps {
  count: number;
  onClick: () => void;
  translate: (key: string) => string;
}

export function NewMessageIndicator({ count, onClick, translate }: NewMessageIndicatorProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30"
        >
          <Button
            onClick={onClick}
            className={cn(
              'rounded-full shadow-lg gap-2 px-4 py-2',
              'bg-primary hover:bg-primary/90 text-primary-foreground',
              'flex items-center'
            )}
            size="sm"
          >
            <ChevronDown className="h-4 w-4 animate-bounce" />
            <span className="font-medium">
              {count === 1 
                ? translate('messages.newMessage')
                : translate('messages.newMessages').replace('{count}', count.toString())}
            </span>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
