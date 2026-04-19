import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '@/features/chat/types';
import { Star, X, MessageSquare, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface StarredMessagesProps {
  open: boolean;
  onClose: () => void;
  starredMessages: Message[];
  onNavigateToMessage: (messageId: string) => void;
  onUnstar: (messageId: string) => void;
  translate: (key: string) => string;
}

export function StarredMessages({
  open,
  onClose,
  starredMessages,
  onNavigateToMessage,
  onUnstar,
  translate,
}: StarredMessagesProps) {
  const handleNavigate = (messageId: string) => {
    onNavigateToMessage(messageId);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
            {translate('starred.title')}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {starredMessages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex h-64 flex-col items-center justify-center text-center"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
                <Star className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="mb-1 font-medium text-foreground">{translate('starred.empty')}</h3>
              <p className="max-w-[200px] text-sm text-muted-foreground">
                {translate('starred.emptyDescription')}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {starredMessages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative rounded-xl border border-border bg-card p-3 transition-all hover:shadow-md"
                  >
                    {/* Star badge */}
                    <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 shadow-lg">
                      <Star className="h-3 w-3 fill-white text-white" />
                    </div>

                    {/* Message content */}
                    <div className="pr-8">
                      <p className="mb-2 line-clamp-3 text-sm text-foreground">
                        {message.content ||
                          (message.attachments.length > 0
                            ? `📎 ${message.attachments.length} attachment(s)`
                            : 'No content')}
                      </p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{message.isOwn ? 'You' : 'User'}</span>
                        <span>{format(message.timestamp, 'MMM d, HH:mm')}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleNavigate(message.id)}
                        className="flex-1 gap-2 text-xs"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {translate('starred.goToMessage')}
                        <ArrowRight className="ml-auto h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onUnstar(message.id)}
                        className="text-muted-foreground hover:text-amber-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Star button component for message bubbles
interface StarButtonProps {
  isStarred: boolean;
  onToggle: () => void;
  className?: string;
}

export function StarButton({ isStarred, onToggle, className }: StarButtonProps) {
  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
        isStarred
          ? 'bg-amber-500/20 text-amber-500'
          : 'border border-border bg-card text-muted-foreground shadow-sm hover:bg-muted',
        className
      )}
    >
      <Star className={cn('h-3.5 w-3.5', isStarred && 'fill-current')} />
    </motion.button>
  );
}
