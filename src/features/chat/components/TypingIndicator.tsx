import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TypingIndicatorProps {
  userNames: string[];
  className?: string;
  translate: (key: string) => string;
  showInline?: boolean;
}

export function TypingIndicator({ userNames, className, translate, showInline = false }: TypingIndicatorProps) {
  if (userNames.length === 0) return null;

  const displayText = userNames.length === 1
    ? `${userNames[0]} ${translate('typing.indicator')}`
    : userNames.length === 2
    ? `${userNames[0]} and ${userNames[1]} ${translate('typing.multiple')}`
    : `${userNames[0]} and ${userNames.length - 1} others ${translate('typing.multiple')}`;

  // Inline version for conversation list
  if (showInline) {
    return (
      <span className="text-primary text-xs font-medium flex items-center gap-1.5">
        <TypingDots size="sm" />
        <span className="truncate">{displayText}</span>
      </span>
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={cn('flex items-start gap-3', className)}
      >
        {/* Avatar placeholder */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          className="flex-shrink-0"
        >
          {userNames.length === 1 ? (
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-xs font-bold text-primary border-2 border-primary/20">
              {userNames[0].charAt(0).toUpperCase()}
            </div>
          ) : (
            <div className="flex -space-x-2">
              {userNames.slice(0, 3).map((name, i) => (
                <motion.div 
                  key={i}
                  initial={{ scale: 0, x: -10 }}
                  animate={{ scale: 1, x: 0 }}
                  transition={{ delay: i * 0.05, type: 'spring' }}
                  className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-[10px] font-bold text-primary border-2 border-background"
                >
                  {name.charAt(0).toUpperCase()}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <div className="flex flex-col gap-1">
          {/* Typing bubble */}
          <motion.div 
            className="relative rounded-2xl rounded-bl-md bg-card border border-border px-4 py-3 shadow-sm"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {/* Animated dots with wave effect */}
            <TypingDots size="lg" />
            
            {/* Subtle pulse ring */}
            <motion.div 
              className="absolute inset-0 rounded-2xl rounded-bl-md border-2 border-primary/20"
              animate={{ 
                scale: [1, 1.02, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
          
          {/* Username text */}
          <motion.span 
            className="text-xs text-muted-foreground pl-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {displayText}
          </motion.span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Reusable typing dots component
function TypingDots({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const dotSize = size === 'sm' ? 'h-1 w-1' : 'h-2.5 w-2.5';
  const gap = size === 'sm' ? 'gap-0.5' : 'gap-1.5';
  
  return (
    <div className={cn('flex items-center', gap)}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={cn(
            'rounded-full bg-primary',
            dotSize
          )}
          animate={{ 
            y: [0, -6, 0],
            scale: [1, 1.2, 1],
            opacity: [0.4, 1, 0.4]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.12,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

// Compact typing indicator for headers
export function TypingIndicatorCompact({ userNames, translate }: { userNames: string[], translate: (key: string) => string }) {
  if (userNames.length === 0) return null;

  return (
    <motion.span 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="text-primary text-xs flex items-center gap-1.5 font-medium"
    >
      <TypingDots size="sm" />
      <span>
        {userNames.length === 1 
          ? `${userNames[0]} ${translate('typing.indicator')}`
          : `${userNames.length} people ${translate('typing.multiple')}`}
      </span>
    </motion.span>
  );
}
