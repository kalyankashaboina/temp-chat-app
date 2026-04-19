import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Plus, Smartphone, Monitor, Tablet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDeviceInfo } from '@/shared/hooks/useDeviceInfo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const { platform, isStandalone, deviceType } = useDeviceInfo();

  useEffect(() => {
    // Don't show if already installed
    if (isStandalone) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after delay
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // For iOS, show instructions after delay
    if (platform === 'ios' && !isStandalone) {
      setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [platform, isStandalone]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // iOS doesn't support the install prompt API
      if (platform === 'ios') {
        setShowIOSInstructions(true);
      }
      return;
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    setShowPrompt(false);
  };

  const dismiss = () => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
    // Remember dismissal
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  // Check if user dismissed recently
  useEffect(() => {
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      // Don't show for 7 days after dismissal
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setShowPrompt(false);
      }
    }
  }, []);

  const DeviceIcon =
    deviceType === 'mobile' ? Smartphone : deviceType === 'tablet' ? Tablet : Monitor;

  if (isStandalone || !showPrompt) return null;

  return (
    <>
      {/* Install banner */}
      <AnimatePresence>
        {showPrompt && !showIOSInstructions && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm"
          >
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
              {/* Gradient accent */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

              <div className="p-4">
                <button
                  onClick={dismiss}
                  className="absolute right-3 top-3 rounded-full p-1 transition-colors hover:bg-muted"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <DeviceIcon className="h-6 w-6 text-primary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground">Install ChatApp</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add to your home screen for the best experience. Works offline!
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="ghost" size="sm" onClick={dismiss} className="flex-1">
                    Not now
                  </Button>
                  <Button size="sm" onClick={handleInstall} className="flex-1 gap-2">
                    <Download className="h-4 w-4" />
                    Install
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Instructions Modal */}
      <AnimatePresence>
        {showIOSInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={dismiss}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Install on iOS</h3>
                  <button onClick={dismiss} className="rounded-full p-1 hover:bg-muted">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-lg font-bold text-primary">1</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Tap the</span>
                      <Share className="h-5 w-5 text-primary" />
                      <span>Share button</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-lg font-bold text-primary">2</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Scroll down and tap</span>
                      <div className="flex items-center gap-1 rounded bg-muted px-2 py-1">
                        <Plus className="h-4 w-4" />
                        <span className="text-sm">Add to Home Screen</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-lg font-bold text-primary">3</span>
                    </div>
                    <span>Tap "Add" to install</span>
                  </div>
                </div>

                <Button onClick={dismiss} className="mt-6 w-full">
                  Got it!
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
