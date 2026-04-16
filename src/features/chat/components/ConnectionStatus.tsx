import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Signal, Loader2 } from 'lucide-react';
import { socketClient, ConnectionStatusPayload } from '@/features/chat/services/socketClient';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className }: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState(socketClient.getConnectionStatus());
  const [latency, setLatency] = useState<number | null>(null);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const unsubscribe = socketClient.on<ConnectionStatusPayload>('connection:status', (event) => {
      setIsConnected(event.payload.connected);
      if (event.payload.latency) {
        setLatency(Math.round(event.payload.latency));
      }
      
      // Show status briefly when it changes
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    });

    return unsubscribe;
  }, []);

  const getLatencyColor = () => {
    if (!latency) return 'text-muted-foreground';
    if (latency < 50) return 'text-primary';
    if (latency < 150) return 'text-yellow-500';
    return 'text-destructive';
  };

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cn(
            'fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg',
            isConnected 
              ? 'bg-primary/20 text-primary border border-primary/30' 
              : 'bg-destructive/20 text-destructive border border-destructive/30',
            className
          )}
        >
          {isConnected ? (
            <>
              <Signal className={cn('h-3 w-3', getLatencyColor())} />
              <span>Connected</span>
              {latency && (
                <span className={cn('opacity-70', getLatencyColor())}>
                  {latency}ms
                </span>
              )}
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
