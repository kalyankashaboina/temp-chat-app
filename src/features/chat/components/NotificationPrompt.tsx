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
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50"
        >
          <div className="bg-card border border-border rounded-xl p-4 shadow-xl backdrop-blur-lg">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">{translate('notification.enable')}</h4>
                <p className="text-xs text-muted-foreground mb-3">
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
