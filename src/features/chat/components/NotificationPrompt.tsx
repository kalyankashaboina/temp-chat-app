import { useState, useEffect } from 'react';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationPromptProps {
  translate: (key: string) => string;
}

export function NotificationPrompt({ translate }: NotificationPromptProps) {
  const { isSupported, permission, requestPermission, isLoading } = useNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show if supported and not yet granted/denied
    const hasDismissed = localStorage.getItem('notification-prompt-dismissed');
    if (isSupported && permission === 'default' && !hasDismissed) {
      // Delay showing the prompt
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission]);

  const handleEnable = async () => {
    await requestPermission();
    setShow(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
    localStorage.setItem('notification-prompt-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {show && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80"
        >
          <div className="rounded-xl border border-border bg-card p-4 shadow-xl backdrop-blur-lg">
            <button
              onClick={handleDismiss}
              className="absolute right-2 top-2 rounded-full p-1 transition-colors hover:bg-muted"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="flex gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="mb-1 text-sm font-semibold">{translate('notification.enable')}</h4>
                <p className="mb-3 text-xs text-muted-foreground">
                  {translate('notification.enableDesc')}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleEnable} className="flex-1" disabled={isLoading}>
                    {isLoading ? 'Enabling...' : 'Enable'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDismiss}>
                    {translate('notification.later')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
