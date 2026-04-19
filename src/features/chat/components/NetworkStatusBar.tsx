import { useChat } from '@/features/chat/useChat';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NetworkStatusBar() {
  const { isOnline, toggleOnline, queue, translate } = useChat();

  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-2 text-sm font-medium transition-colors duration-300',
        isOnline
          ? 'bg-status-online/10 text-status-online'
          : 'bg-status-offline/10 text-status-offline'
      )}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>{translate('status.online')}</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>{translate('status.offline')}</span>
          </>
        )}

        {queue.length > 0 && (
          <span className="ml-2 flex items-center gap-1 text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            {queue.length} {translate('queue.itemsQueued')}
          </span>
        )}
      </div>

      <button
        onClick={toggleOnline}
        className={cn(
          'rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200',
          isOnline
            ? 'bg-status-offline/20 text-status-offline hover:bg-status-offline/30'
            : 'bg-status-online/20 text-status-online hover:bg-status-online/30'
        )}
      >
        {isOnline ? 'Go Offline' : 'Go Online'}
      </button>
    </div>
  );
}
