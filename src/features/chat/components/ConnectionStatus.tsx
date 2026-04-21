import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Signal, Loader2 } from 'lucide-react';
import { socketClient } from '@/features/chat/services/socketClient';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className }: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState(socketClient.getConnectionStatus());
  const [showStatus, setShowStatus] = useState(false);

  // BUG FIX #9: Use onConnectionChange instead of non-existent connection:status event
  useEffect(() => {
    const unsubscribe = socketClient.onConnectionChange((connected) => {
      setIsConnected(connected);

      // Show status briefly when it changes
      setShowStatus(true);
      const timeout = setTimeout(() => setShowStatus(false), 3000);

      return () => clearTimeout(timeout);
    });

    return unsubscribe;
  }, []);

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cn(
            'fixed left-1/2 top-2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg',
            isConnected
              ? 'border border-primary/30 bg-primary/20 text-primary'
              : 'border border-destructive/30 bg-destructive/20 text-destructive',
            className
          )}
        >
          {isConnected ? (
            <>
              <Wifi className="h-3 w-3" />
              <span>Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              <span>Reconnecting...</span>
              <Loader2 className="h-3 w-3 animate-spin" />
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
