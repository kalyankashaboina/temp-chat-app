import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnlineStatusIndicatorProps {
  isOnline: boolean;
  queueCount?: number;
  isProcessing?: boolean;
  translate: (key: string) => string;
}

export function OnlineStatusIndicator({ 
  isOnline, 
  queueCount = 0, 
  isProcessing = false,
  translate 
}: OnlineStatusIndicatorProps) {
  return (
    <AnimatePresence mode="wait">
      {!isOnline && (
        <motion.div
          key="offline"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-50 safe-top"
        >
          <div className="flex items-center justify-center gap-2 py-2 px-4 bg-destructive/90 text-destructive-foreground text-sm font-medium backdrop-blur-sm">
            <WifiOff className="h-4 w-4" />
            <span>{translate('network.offline')}</span>
            {queueCount > 0 && (
              <span className="flex items-center gap-1 ml-2 bg-white/20 rounded-full px-2 py-0.5 text-xs">
                <CloudOff className="h-3 w-3" />
                {queueCount} {translate('queue.itemsQueued')}
              </span>
            )}
          </div>
        </motion.div>
      )}

      {isOnline && isProcessing && queueCount > 0 && (
        <motion.div
          key="processing"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-50 safe-top"
        >
          <div className="flex items-center justify-center gap-2 py-2 px-4 bg-primary/90 text-primary-foreground text-sm font-medium backdrop-blur-sm">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw className="h-4 w-4" />
            </motion.div>
            <span>{translate('queue.processing')}</span>
            <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">
              {queueCount} {translate('queue.itemsQueued')}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Compact version for header
export function OnlineStatusBadge({ isOnline }: { isOnline: boolean }) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn(
        'flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium',
        isOnline 
          ? 'bg-green-500/10 text-green-500' 
          : 'bg-destructive/10 text-destructive'
      )}
    >
      {isOnline ? (
        <>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-1.5 w-1.5 rounded-full bg-green-500"
          />
          <Cloud className="h-3 w-3" />
        </>
      ) : (
        <>
          <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
          <CloudOff className="h-3 w-3" />
        </>
      )}
    </motion.div>
  );
}
