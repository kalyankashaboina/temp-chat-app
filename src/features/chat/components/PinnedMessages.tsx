import { Message } from '@/features/chat/types';
import { Pin, X, ChevronRight, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface PinnedMessagesProps {
  pinnedMessages: Message[];
  onNavigate: (messageId: string) => void;
  onUnpin: (messageId: string) => void;
  onClose: () => void;
  translate: (key: string) => string;
}

export function PinnedMessages({
  pinnedMessages,
  onNavigate,
  onUnpin,
  onClose,
  translate,
}: PinnedMessagesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (pinnedMessages.length === 0) return null;

  return (
    <div className="border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-yellow-500/10">
      <div className="px-3 py-2 sm:px-4">
        <button
          onClick={() =>
            pinnedMessages.length > 1
              ? setIsExpanded(!isExpanded)
              : onNavigate(pinnedMessages[0].id)
          }
          className="group flex w-full items-center gap-2 text-left"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20">
            <Pin className="h-4 w-4 text-amber-500" />
          </div>
          <div className="min-w-0 flex-1">
            {pinnedMessages.length === 1 ? (
              <p className="truncate text-sm">{pinnedMessages[0].content || 'Media message'}</p>
            ) : (
              <p className="text-sm font-medium text-amber-600">
                {pinnedMessages.length} pinned messages
              </p>
            )}
          </div>
          {pinnedMessages.length > 1 ? (
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                isExpanded && 'rotate-180'
              )}
            />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </button>

        {/* Expanded list */}
        {isExpanded && pinnedMessages.length > 1 && (
          <div className="mt-2 space-y-1 border-t border-amber-500/20 pt-2">
            {pinnedMessages.map((message) => (
              <div
                key={message.id}
                className="group flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-amber-500/10"
              >
                <button onClick={() => onNavigate(message.id)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm">{message.content || 'Media message'}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(message.timestamp, 'MMM d, HH:mm')}
                  </p>
                </button>
                <button
                  onClick={() => onUnpin(message.id)}
                  className="rounded-full p-1 opacity-0 transition-all hover:bg-muted group-hover:opacity-100"
                  title="Unpin"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
