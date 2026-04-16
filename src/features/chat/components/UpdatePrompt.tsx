import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useServiceWorker } from '@/shared/hooks/useServiceWorker';

export function UpdatePrompt() {
  const { hasUpdate, updateApp } = useServiceWorker();

  if (!hasUpdate) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm"
      >
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          {/* Animated gradient */}
          <motion.div
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-x-0 top-0 h-1"
            style={{
              background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))',
              backgroundSize: '200% 100%',
            }}
          />
          
          <div className="p-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="h-5 w-5 text-primary animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">Update Available</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  A new version is ready. Refresh to get the latest features!
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                onClick={updateApp}
                className="flex-1 gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Update now
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
