import { Shield, ShieldCheck, Lock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EncryptionIndicatorProps {
  isEncrypted?: boolean;
  compact?: boolean;
  translate: (key: string) => string;
}

export function EncryptionIndicator({ isEncrypted = true, compact = false, translate }: EncryptionIndicatorProps) {
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 text-xs text-green-500"
            >
              <ShieldCheck className="h-3 w-3" />
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{translate('encryption.enabled')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium',
        isEncrypted
          ? 'bg-green-500/10 text-green-500 border border-green-500/20'
          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
      )}
    >
      {isEncrypted ? (
        <>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
          </motion.div>
          <span>{translate('encryption.enabled')}</span>
          <Lock className="h-3 w-3 ml-1" />
        </>
      ) : (
        <>
          <Shield className="h-3.5 w-3.5" />
          <span>{translate('encryption.disabled')}</span>
          <Info className="h-3 w-3 ml-1" />
        </>
      )}
    </motion.div>
  );
}

export function EncryptionBanner({ translate }: { translate: (key: string) => string }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-green-500/5 via-green-500/10 to-green-500/5 border-y border-green-500/10 text-green-600 text-xs"
    >
      <Lock className="h-3 w-3" />
      <span>{translate('encryption.banner')}</span>
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="h-1.5 w-1.5 rounded-full bg-green-500"
      />
    </motion.div>
  );
}
