import { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

const EMOJI_CATEGORIES = {
  smileys: ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '🥰', '😘', '😗', '😙', '😚', '🙂', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '🥱', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲'],
  gestures: ['👍', '👎', '👌', '🤌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  objects: ['🎉', '🎊', '🎈', '🎁', '🏆', '⭐', '✨', '💡', '🔥', '💯', '✅', '❌', '⚠️', '📌', '📍', '💬', '💭', '🗯️', '📱', '💻', '⌨️', '🖥️', '📷', '📹', '🎵', '🎶', '🎤', '🎧', '📞', '📧'],
};

const emojiAnimations: Record<string, { scale: number[]; rotate?: number[] }> = {
  '❤️': { scale: [1, 1.3, 1], rotate: undefined },
  '💕': { scale: [1, 1.2, 1], rotate: undefined },
  '🔥': { scale: [1, 1.4, 1], rotate: [-5, 5, -5] },
  '🎉': { scale: [1, 1.3, 1], rotate: [-10, 10, -10] },
  '👍': { scale: [1, 1.2, 1], rotate: [-10, 10, 0] },
  '😂': { scale: [1, 1.15, 1], rotate: undefined },
};

export function EmojiPicker({ onEmojiSelect, className }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smileys');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Load recent emojis from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recent_emojis');
    if (stored) {
      try {
        setRecentEmojis(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    
    // Update recent emojis
    const updated = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 8);
    setRecentEmojis(updated);
    localStorage.setItem('recent_emojis', JSON.stringify(updated));
    
    setIsOpen(false);
  };

  const categoryIcons: Record<keyof typeof EMOJI_CATEGORIES, string> = {
    smileys: '😀',
    gestures: '👍',
    hearts: '❤️',
    objects: '🎉',
  };

  return (
    <div ref={pickerRef} className={cn('relative', className)}>
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground touch-target"
      >
        <Smile className="h-5 w-5" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute bottom-12 left-0 z-50 w-72 rounded-xl border border-border bg-card shadow-xl"
          >
            {/* Recent emojis */}
            {recentEmojis.length > 0 && (
              <div className="border-b border-border p-2">
                <p className="text-xs text-muted-foreground mb-1 px-1">Recent</p>
                <div className="flex flex-wrap gap-1">
                  {recentEmojis.map((emoji, index) => {
                    const animation = emojiAnimations[emoji];
                    return (
                      <motion.button
                        key={`recent-${emoji}-${index}`}
                        type="button"
                        onClick={() => handleEmojiClick(emoji)}
                        whileHover={animation ? { 
                          scale: animation.scale,
                          rotate: animation.rotate,
                        } : { scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-muted"
                      >
                        {emoji}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category tabs */}
            <div className="flex border-b border-border p-1">
              {(Object.keys(EMOJI_CATEGORIES) as Array<keyof typeof EMOJI_CATEGORIES>).map((category) => (
                <motion.button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    'flex-1 rounded-lg p-2 text-lg transition-colors',
                    activeCategory === category
                      ? 'bg-primary/10 text-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  {categoryIcons[category]}
                </motion.button>
              ))}
            </div>

            {/* Emoji grid */}
            <div className="grid max-h-48 grid-cols-8 gap-1 overflow-y-auto p-2">
              {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => {
                const animation = emojiAnimations[emoji];
                return (
                  <motion.button
                    key={`${emoji}-${index}`}
                    type="button"
                    onClick={() => handleEmojiClick(emoji)}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.01 }}
                    whileHover={animation ? { 
                      scale: animation.scale,
                      rotate: animation.rotate,
                    } : { scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-muted"
                  >
                    {emoji}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
