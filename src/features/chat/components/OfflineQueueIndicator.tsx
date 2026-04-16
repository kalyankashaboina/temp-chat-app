import { QueuedItem } from '@/features/chat/types';
import { cn } from '@/lib/utils';
import { Cloud, CloudOff, RefreshCw, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface OfflineQueueIndicatorProps {
  queue: QueuedItem[];
  isOnline: boolean;
  isProcessing: boolean;
  translate: (key: string) => string;
}

export function OfflineQueueIndicator({ queue, isOnline, isProcessing, translate }: OfflineQueueIndicatorProps) {
  if (queue.length === 0 && isOnline) return null;

  const pendingCount = queue.filter(q => q.status === 'pending').length;
  const failedCount = queue.filter(q => q.status === 'failed').length;

  return (
    <div className={cn(
      'mx-2 mb-2 rounded-xl p-3 transition-all animate-slide-up',
      isOnline 
        ? 'bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20' 
        : 'bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20'
    )}>
      <div className="flex items-center gap-3">
        {/* Status icon */}
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full',
          isOnline ? 'bg-primary/20' : 'bg-amber-500/20'
        )}>
          {isProcessing ? (
            <RefreshCw className="h-5 w-5 text-primary animate-spin" />
          ) : isOnline ? (
            <Cloud className="h-5 w-5 text-primary" />
          ) : (
            <CloudOff className="h-5 w-5 text-amber-500" />
          )}
        </div>

        {/* Queue info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">
            {isProcessing 
              ? translate('queue.processing')
              : isOnline 
                ? `${queue.length} ${translate('queue.itemsQueued')}`
                : translate('network.offline')
            }
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {pendingCount > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {pendingCount} pending
              </span>
            )}
            {failedCount > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertCircle className="h-3 w-3" />
                {failedCount} failed
              </span>
            )}
          </div>
        </div>

        {/* Status badge */}
        <div className={cn(
          'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
          isOnline ? 'bg-primary/20 text-primary' : 'bg-amber-500/20 text-amber-500'
        )}>
          {isOnline ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              <span className="hidden sm:inline">Online</span>
            </>
          ) : (
            <>
              <CloudOff className="h-3 w-3" />
              <span className="hidden sm:inline">Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Queue items preview */}
      {queue.length > 0 && queue.length <= 3 && (
        <div className="mt-2 space-y-1 border-t border-border/50 pt-2">
          {queue.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className={cn(
                'h-1.5 w-1.5 rounded-full',
                item.status === 'failed' ? 'bg-destructive' : 'bg-amber-500'
              )} />
              <span className="truncate flex-1">
                {item.type === 'message'
                  ? (item.data as { content?: string }).content?.slice(0, 30) || 'Media message'
                  : (item.data as { name?: string }).name
                }
              </span>
              <span className="text-muted-foreground/50">
                {format(item.createdAt, 'HH:mm')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
