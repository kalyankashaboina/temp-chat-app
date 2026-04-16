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

export function PinnedMessages({ pinnedMessages, onNavigate, onUnpin, onClose, translate }: PinnedMessagesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (pinnedMessages.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-b border-amber-500/20">
      <div className="px-3 sm:px-4 py-2">
        <button
          onClick={() => pinnedMessages.length > 1 ? setIsExpanded(!isExpanded) : onNavigate(pinnedMessages[0].id)}
          className="flex items-center gap-2 w-full text-left group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 flex-shrink-0">
            <Pin className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            {pinnedMessages.length === 1 ? (
              <p className="text-sm truncate">{pinnedMessages[0].content || 'Media message'}</p>
            ) : (
              <p className="text-sm font-medium text-amber-600">
                {pinnedMessages.length} pinned messages
              </p>
            )}
          </div>
          {pinnedMessages.length > 1 ? (
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isExpanded && "rotate-180"
            )} />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>

        {/* Expanded list */}
        {isExpanded && pinnedMessages.length > 1 && (
          <div className="mt-2 space-y-1 border-t border-amber-500/20 pt-2">
            {pinnedMessages.map((message) => (
              <div
                key={message.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-amber-500/10 transition-colors group"
              >
                <button
                  onClick={() => onNavigate(message.id)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="text-sm truncate">{message.content || 'Media message'}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(message.timestamp, 'MMM d, HH:mm')}
                  </p>
                </button>
                <button
                  onClick={() => onUnpin(message.id)}
                  className="p-1 rounded-full hover:bg-muted opacity-0 group-hover:opacity-100 transition-all"
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
