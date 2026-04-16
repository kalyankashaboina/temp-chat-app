import { MessageReaction } from '@/features/chat/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ReactionDetailsProps {
  open: boolean;
  onClose: () => void;
  reactions: MessageReaction[];
  translate: (key: string) => string;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = ['bg-primary', 'bg-status-online', 'bg-warning', 'bg-destructive', 'bg-accent'];
  return colors[name.charCodeAt(0) % colors.length];
}

export function ReactionDetails({ open, onClose, reactions, translate }: ReactionDetailsProps) {
  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, r) => {
    if (!acc[r.emoji]) {
      acc[r.emoji] = [];
    }
    acc[r.emoji].push(r);
    return acc;
  }, {} as Record<string, MessageReaction[]>);

  const emojiList = Object.keys(groupedReactions);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{translate('reactions.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Emoji tabs summary */}
          <div className="flex flex-wrap gap-2 border-b pb-3">
            {emojiList.map(emoji => (
              <div
                key={emoji}
                className="flex items-center gap-1 bg-muted rounded-full px-2 py-1 text-sm"
              >
                <span className="text-base">{emoji}</span>
                <span className="text-muted-foreground">{groupedReactions[emoji].length}</span>
              </div>
            ))}
          </div>

          {/* Users who reacted */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {emojiList.map(emoji => (
              <div key={emoji} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{emoji}</span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {groupedReactions[emoji].length} {translate('reactions.people')}
                  </span>
                </div>
                <div className="space-y-1 pl-2">
                  {groupedReactions[emoji].map((reaction, idx) => (
                    <div key={idx} className="flex items-center gap-2 py-1">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground',
                        getAvatarColor(reaction.userName)
                      )}>
                        {getInitials(reaction.userName)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{reaction.userName}</p>
                        {reaction.timestamp && (
                          <p className="text-xs text-muted-foreground">
                            {format(reaction.timestamp, 'MMM d, HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
