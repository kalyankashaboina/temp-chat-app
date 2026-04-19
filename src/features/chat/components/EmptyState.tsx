import { motion } from 'framer-motion';
import { MessageSquare, Search, Phone, Users, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  type: 'no-chat' | 'no-messages' | 'no-results' | 'no-calls' | 'no-users';
  title?: string;
  description?: string;
  className?: string;
}

const iconMap = {
  'no-chat': MessageSquare,
  'no-messages': MessageSquare,
  'no-results': Search,
  'no-calls': Phone,
  'no-users': Users,
};

const gradientMap = {
  'no-chat': 'from-primary/20 to-primary/5',
  'no-messages': 'from-violet-500/20 to-purple-500/5',
  'no-results': 'from-amber-500/20 to-orange-500/5',
  'no-calls': 'from-green-500/20 to-emerald-500/5',
  'no-users': 'from-blue-500/20 to-cyan-500/5',
};

const iconColorMap = {
  'no-chat': 'text-primary/60',
  'no-messages': 'text-violet-500/60',
  'no-results': 'text-amber-500/60',
  'no-calls': 'text-green-500/60',
  'no-users': 'text-blue-500/60',
};

export function EmptyState({ type, title, description, className }: EmptyStateProps) {
  const Icon = iconMap[type];
  const gradient = gradientMap[type];
  const iconColor = iconColorMap[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn('flex flex-col items-center justify-center px-4 text-center', className)}
    >
      {/* Animated icon container */}
      <motion.div
        className={cn(
          'relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br',
          gradient
        )}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Pulse rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-primary/20"
            animate={{
              scale: [1, 1.5 + i * 0.3],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeOut',
            }}
          />
        ))}

        {/* Icon */}
        <motion.div
          animate={{
            y: [0, -4, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Icon className={cn('h-12 w-12', iconColor)} />
        </motion.div>

        {/* Floating sparkles */}
        <motion.div
          className="absolute -right-1 -top-1"
          animate={{
            rotate: [0, 15, -15, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Sparkles className="h-5 w-5 text-primary/40" />
        </motion.div>
      </motion.div>

      {/* Text content */}
      <motion.h3
        className="mb-2 text-lg font-semibold text-foreground"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {title}
      </motion.h3>

      <motion.p
        className="max-w-[250px] text-sm text-muted-foreground"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {description}
      </motion.p>
    </motion.div>
  );
}

// Compact version for smaller spaces
export function EmptyStateCompact({
  icon: Icon,
  message,
  submessage,
}: {
  icon: React.ElementType;
  message: string;
  submessage?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-40 flex-col items-center justify-center text-muted-foreground"
    >
      <motion.div
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Icon className="h-6 w-6 opacity-50" />
      </motion.div>
      <p className="text-sm font-medium">{message}</p>
      {submessage && <p className="mt-1 text-xs">{submessage}</p>}
    </motion.div>
  );
}
