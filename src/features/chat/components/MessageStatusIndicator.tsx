import { MessageStatus } from '@/features/chat/types';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MessageStatusIndicatorProps {
  status: MessageStatus;
  translate: (key: string) => string;
}

export function MessageStatusIndicator({ status, translate }: MessageStatusIndicatorProps) {
  const config: Record<
    MessageStatus,
    {
      icon: typeof Check;
      color: string;
      animate: boolean;
      tooltip: string;
      showPulse?: boolean;
    }
  > = {
    pending: {
      icon: Loader2,
      color: 'text-muted-foreground',
      animate: true,
      tooltip: translate('status.pending'),
    },
    sent: {
      icon: Check,
      color: 'text-muted-foreground',
      animate: false,
      tooltip: translate('status.sent'),
    },
    delivered: {
      icon: CheckCheck,
      color: 'text-muted-foreground',
      animate: false,
      tooltip: translate('status.delivered'),
    },
    read: {
      icon: CheckCheck,
      color: 'text-primary',
      animate: false,
      tooltip: translate('status.read'),
    },
    failed: {
      icon: AlertCircle,
      color: 'text-destructive',
      animate: false,
      tooltip: translate('status.failed'),
      showPulse: true,
    },
  };

  const { icon: Icon, color, animate, tooltip, showPulse } = config[status];

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={cn('relative flex items-center', color)}
            >
              <Icon
                className={cn(
                  'h-3.5 w-3.5 transition-colors duration-200',
                  animate && 'animate-spin'
                )}
              />

              {/* Pulse effect for read status */}
              {status === 'read' && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-primary"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.6 }}
                />
              )}

              {/* Error pulse for failed */}
              {showPulse && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-destructive"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </TooltipTrigger>
        <TooltipContent side="left" className="text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
