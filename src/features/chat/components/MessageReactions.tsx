import { useState } from 'react';
import { MessageReaction } from '@/features/chat/types';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const reactionAnimations: Record<string, { scale: number[]; rotate?: number[] }> = {
  '❤️': { scale: [1, 1.4, 1] },
  '🔥': { scale: [1, 1.3, 1], rotate: [-5, 5, -5, 0] },
  '👍': { scale: [1, 1.2, 1], rotate: [-10, 10, 0] },
  '😂': { scale: [1, 1.2, 1] },
  '😮': { scale: [1, 1.3, 1] },
  '😢': { scale: [1, 1.15, 1] },
};

interface MessageReactionsProps {
  reactions: MessageReaction[];
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  isOwn: boolean;
  currentUserId: string;
}

export function MessageReactions({
  reactions,
  onAddReaction,
  onRemoveReaction,
  isOwn,
  currentUserId,
}: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [animatingEmoji, setAnimatingEmoji] = useState<string | null>(null);

  if (reactions.length === 0 && !showPicker) {
    return (
      <div className={cn('flex items-center', isOwn ? 'justify-end' : 'justify-start')}>
        <motion.button
          onClick={() => setShowPicker(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-muted/50 opacity-0 transition-colors hover:bg-muted group-hover:opacity-100"
        >
          <Plus className="h-3 w-3 text-muted-foreground" />
        </motion.button>
      </div>
    );
  }

  // Group reactions by emoji
  const groupedReactions = reactions.reduce(
    (acc, r) => {
      if (!acc[r.emoji]) {
        acc[r.emoji] = [];
      }
      acc[r.emoji].push(r);
      return acc;
    },
    {} as Record<string, MessageReaction[]>
  );

  const handleReactionClick = (emoji: string) => {
    const userReacted = reactions.some((r) => r.emoji === emoji && r.userId === currentUserId);

    // Trigger animation
    setAnimatingEmoji(emoji);
    setTimeout(() => setAnimatingEmoji(null), 500);

    if (userReacted) {
      onRemoveReaction(emoji);
    } else {
      onAddReaction(emoji);
    }
    setShowPicker(false);
  };

  return (
    <div
      className={cn(
        'mt-1 flex flex-wrap items-center gap-1',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Existing reactions */}
      <AnimatePresence>
        {Object.entries(groupedReactions).map(([emoji, reacts]) => {
          const userReacted = reacts.some((r) => r.userId === currentUserId);
          const animation = reactionAnimations[emoji];
          const isAnimating = animatingEmoji === emoji;

          return (
            <motion.button
              key={emoji}
              onClick={() => handleReactionClick(emoji)}
              initial={{ scale: 0 }}
              animate={{
                scale: isAnimating && animation ? animation.scale : 1,
                rotate: isAnimating && animation?.rotate ? animation.rotate : 0,
              }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-all',
                userReacted
                  ? 'border border-primary/30 bg-primary/20'
                  : 'border border-transparent bg-muted/80 hover:bg-muted'
              )}
              title={reacts.map((r) => r.userName).join(', ')}
            >
              <motion.span
                animate={isAnimating ? { scale: [1, 1.5, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {emoji}
              </motion.span>
              {reacts.length > 1 && (
                <span className="font-medium text-muted-foreground">{reacts.length}</span>
              )}
            </motion.button>
          );
        })}
      </AnimatePresence>

      {/* Add reaction button */}
      <div className="relative">
        <motion.button
          onClick={() => setShowPicker(!showPicker)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-muted/50 transition-colors hover:bg-muted"
        >
          <Plus className="h-3 w-3 text-muted-foreground" />
        </motion.button>

        <AnimatePresence>
          {showPicker && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={() => setShowPicker(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={cn(
                  'absolute z-50 flex gap-1 rounded-full border border-border bg-card p-1.5 shadow-xl',
                  isOwn ? 'right-0' : 'left-0',
                  'bottom-full mb-2'
                )}
              >
                {QUICK_REACTIONS.map((emoji, index) => {
                  const animation = reactionAnimations[emoji];
                  return (
                    <motion.button
                      key={emoji}
                      onClick={() => handleReactionClick(emoji)}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        delay: index * 0.03,
                        type: 'spring',
                        stiffness: 400,
                        damping: 15,
                      }}
                      whileHover={
                        animation
                          ? {
                              scale: animation.scale,
                              rotate: animation.rotate,
                            }
                          : { scale: 1.3 }
                      }
                      whileTap={{ scale: 0.8 }}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition-colors hover:bg-muted"
                    >
                      {emoji}
                    </motion.button>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
