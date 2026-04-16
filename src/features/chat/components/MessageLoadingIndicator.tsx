import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface MessageLoadingIndicatorProps {
  translate: (key: string) => string;
}

export function MessageLoadingIndicator({ translate }: MessageLoadingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center justify-center py-3"
    >
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{translate('messages.loadingMore')}</span>
      </div>
    </motion.div>
  );
}
