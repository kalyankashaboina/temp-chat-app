import { motion, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedEmojiProps {
  emoji: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
};

const buttonSizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
};

const emojiVariants: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.3,
    transition: { type: 'spring', stiffness: 400, damping: 10 },
  },
  tap: { scale: 0.9 },
};

const bounceVariants: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-2, 2, -2],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatType: 'reverse',
    },
  },
};

const pulseVariants: Variants = {
  initial: { scale: 1, opacity: 1 },
  animate: {
    scale: [1, 1.15, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
    },
  },
};

const spinVariants: Variants = {
  initial: { rotate: 0 },
  animate: {
    rotate: [0, 15, -15, 0],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatDelay: 2,
    },
  },
};

// Map emojis to their animation style
const getEmojiAnimation = (emoji: string): Variants => {
  const heartEmojis = ['❤️', '💕', '💖', '💗', '💓', '💞', '💝', '🧡', '💛', '💚', '💙', '💜'];
  const celebrateEmojis = ['🎉', '🎊', '🥳', '🎈', '✨', '🌟', '⭐'];
  const happyEmojis = ['😀', '😁', '😄', '😊', '🥰', '😍'];

  if (heartEmojis.includes(emoji)) return pulseVariants;
  if (celebrateEmojis.includes(emoji)) return spinVariants;
  if (happyEmojis.includes(emoji)) return bounceVariants;

  return emojiVariants;
};

export function AnimatedEmoji({
  emoji,
  onClick,
  size = 'md',
  animate = true,
  className,
}: AnimatedEmojiProps) {
  const animationVariant = animate ? getEmojiAnimation(emoji) : emojiVariants;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center rounded-xl transition-colors',
        'hover:bg-muted/80 active:bg-muted',
        buttonSizes[size],
        className
      )}
      variants={emojiVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
    >
      <motion.span
        className={cn(sizeClasses[size], 'select-none')}
        variants={animationVariant}
        initial="initial"
        animate={animate ? 'animate' : 'initial'}
      >
        {emoji}
      </motion.span>
    </motion.button>
  );
}

// Emoji burst effect for reactions
export function EmojiBurst({ emoji, onComplete }: { emoji: string; onComplete: () => void }) {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={onComplete}
    >
      {[...Array(8)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute text-3xl"
          initial={{
            x: 0,
            y: 0,
            scale: 0,
            rotate: 0,
          }}
          animate={{
            x: Math.cos((i / 8) * Math.PI * 2) * 100,
            y: Math.sin((i / 8) * Math.PI * 2) * 100,
            scale: [0, 1.5, 0],
            rotate: Math.random() * 360,
          }}
          transition={{
            duration: 0.8,
            ease: 'easeOut',
          }}
        >
          {emoji}
        </motion.span>
      ))}
    </motion.div>
  );
}

// Floating emoji for celebrations
export function FloatingEmoji({ emoji, delay = 0 }: { emoji: string; delay?: number }) {
  const startX = Math.random() * 100;

  return (
    <motion.span
      className="pointer-events-none fixed bottom-0 z-40 text-2xl"
      style={{ left: `${startX}%` }}
      initial={{ y: 0, opacity: 1, scale: 0 }}
      animate={{
        y: -window.innerHeight - 100,
        opacity: [0, 1, 1, 0],
        scale: [0, 1, 1, 0.5],
        rotate: Math.random() * 360,
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        delay,
        ease: 'easeOut',
      }}
    >
      {emoji}
    </motion.span>
  );
}
