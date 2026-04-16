import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '@/features/chat/types';
import { Star, X, MessageSquare, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

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
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
            {translate('starred.title')}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {starredMessages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-64 text-center"
            >
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Star className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="font-medium text-foreground mb-1">{translate('starred.empty')}</h3>
              <p className="text-sm text-muted-foreground max-w-[200px]">
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
                    className="group relative rounded-xl border border-border bg-card p-3 hover:shadow-md transition-all"
                  >
                    {/* Star badge */}
                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
                      <Star className="h-3 w-3 text-white fill-white" />
                    </div>

                    {/* Message content */}
                    <div className="pr-8">
                      <p className="text-sm text-foreground line-clamp-3 mb-2">
                        {message.content || (message.attachments.length > 0 ? `📎 ${message.attachments.length} attachment(s)` : 'No content')}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{message.isOwn ? 'You' : 'User'}</span>
                        <span>{format(message.timestamp, 'MMM d, HH:mm')}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleNavigate(message.id)}
                        className="flex-1 gap-2 text-xs"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {translate('starred.goToMessage')}
                        <ArrowRight className="h-3 w-3 ml-auto" />
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
          : 'bg-card border border-border shadow-sm hover:bg-muted text-muted-foreground',
        className
      )}
    >
      <Star className={cn('h-3.5 w-3.5', isStarred && 'fill-current')} />
    </motion.button>
  );
}
