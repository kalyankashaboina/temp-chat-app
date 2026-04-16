import { useState, useEffect } from 'react';
import { FileAttachment } from '@/features/chat/types';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Lock, Image as ImageIcon, Video, Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface ViewOnceMediaProps {
  attachment: FileAttachment;
  onView: () => void;
  isOwn: boolean;
  translate: (key: string) => string;
}

export function ViewOnceMedia({ attachment, onView, isOwn, translate }: ViewOnceMediaProps) {
  const [isOpened, setIsOpened] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [hasViewed, setHasViewed] = useState(attachment.isViewed || false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);

  useEffect(() => {
    if (isOpened && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isOpened && countdown === 0) {
      setIsOpened(false);
      setHasViewed(true);
      onView();
    }
  }, [isOpened, countdown, onView]);

  // Hold to view effect
  useEffect(() => {
    if (!isHolding) {
      setHoldProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setHoldProgress(prev => {
        if (prev >= 100) {
          setIsHolding(false);
          setIsOpened(true);
          setCountdown(5);
          return 0;
        }
        return prev + 5;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isHolding]);

  const handleMouseDown = () => {
    if (!hasViewed && !isOwn) {
      setIsHolding(true);
    }
  };

  const handleMouseUp = () => {
    setIsHolding(false);
  };

  const isImage = attachment.type === 'image';
  const isVideo = attachment.type === 'video';
  const MediaIcon = isVideo ? Video : ImageIcon;

  // Already viewed
  if (hasViewed && !isOwn) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 rounded-xl bg-muted/30 border border-dashed border-muted-foreground/20 p-4 text-sm text-muted-foreground"
      >
        <EyeOff className="h-5 w-5" />
        <div>
          <p className="font-medium">{translate('viewOnce.opened')}</p>
          <p className="text-xs opacity-70">This media has been viewed</p>
        </div>
      </motion.div>
    );
  }

  // Own message - show thumbnail with indicator
  if (isOwn) {
    return (
      <div className="relative rounded-xl overflow-hidden">
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-black/70 text-white text-xs px-2.5 py-1.5 rounded-full backdrop-blur-sm">
          <Eye className="h-3 w-3" />
          <span className="font-medium">{translate('viewOnce.label')}</span>
        </div>
        {isImage && (
          <img
            src={attachment.url}
            alt={attachment.name}
            className="max-h-48 rounded-xl object-cover blur-md brightness-75"
          />
        )}
        {isVideo && (
          <div className="h-32 w-48 bg-muted rounded-xl flex items-center justify-center">
            <Video className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Hold to view preview */}
      <motion.button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        onTouchCancel={handleMouseUp}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'relative flex items-center gap-4 rounded-xl p-4 transition-all w-full',
          'bg-gradient-to-br from-primary/20 to-primary/5',
          'border border-primary/20 hover:border-primary/40',
          'group overflow-hidden'
        )}
      >
        {/* Hold progress bar */}
        <motion.div
          className="absolute inset-0 bg-primary/20"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: holdProgress / 100 }}
          style={{ transformOrigin: 'left' }}
        />
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="relative">
            <motion.div 
              animate={{ 
                scale: isHolding ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 0.5, repeat: isHolding ? Infinity : 0 }}
              className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center"
            >
              <MediaIcon className="h-6 w-6 text-primary" />
            </motion.div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <Lock className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
          </div>
          
          <div className="text-left">
            <p className="font-semibold text-sm">{translate('viewOnce.label')}</p>
            <p className="text-xs text-muted-foreground">
              {isHolding ? 'Keep holding...' : 'Hold to view'}
            </p>
          </div>
        </div>
        
        <Play className="relative z-10 h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
      </motion.button>

      {/* View dialog */}
      <Dialog open={isOpened} onOpenChange={() => setIsOpened(false)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden bg-black border-0">
          {/* Close button */}
          <button
            onClick={() => {
              setIsOpened(false);
              setHasViewed(true);
              onView();
            }}
            className="absolute top-4 left-4 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Countdown */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/70 text-white px-3 py-2 rounded-full backdrop-blur-sm">
            <motion.div 
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="h-2.5 w-2.5 rounded-full bg-destructive" 
            />
            <span className="text-sm font-bold tabular-nums">{countdown}s</span>
          </div>

          {/* Countdown ring */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg className="absolute h-full w-full" viewBox="0 0 100 100">
              <motion.circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
                strokeDasharray={`${(countdown / 5) * 301.59} 301.59`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
          </div>

          {/* Media */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center min-h-[300px] relative"
          >
            {isImage && (
              <img
                src={attachment.url}
                alt={attachment.name}
                className="max-h-[70vh] max-w-full object-contain"
              />
            )}
            {isVideo && (
              <video
                src={attachment.url}
                autoPlay
                playsInline
                muted
                className="max-h-[70vh] max-w-full"
              />
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-xs bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm"
          >
            {translate('viewOnce.willDisappear')}
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}
