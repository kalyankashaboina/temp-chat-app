import { useAppDispatch, useAppSelector } from '@/store';
import { closeBottomSheet } from '@/store/uiSlice';
import {
  requestNotificationPermission,
  updateNotificationPreferences,
} from '@/features/notifications/notificationSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, MessageSquare, Phone, Users, Volume2, Vibrate, Eye, BellOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function NotificationSettingsBottomSheet() {
  const dispatch = useAppDispatch();
  const { activeBottomSheet } = useAppSelector((state) => state.ui);
  const { permission, preferences, isSupported, isLoading } = useAppSelector(
    (state) => state.notification
  );

  const isOpen = activeBottomSheet === 'notificationSettings';

  const handleClose = () => {
    dispatch(closeBottomSheet());
  };

  const handleRequestPermission = () => {
    dispatch(requestNotificationPermission());
  };

  const handleTogglePreference = (key: keyof typeof preferences) => {
    dispatch(updateNotificationPreferences({ [key]: !preferences[key] }));
  };

  const notificationOptions = [
    {
      key: 'messageNotifications' as const,
      icon: MessageSquare,
      label: 'Message Notifications',
      description: 'Get notified for new messages',
    },
    {
      key: 'callNotifications' as const,
      icon: Phone,
      label: 'Call Notifications',
      description: 'Get notified for incoming calls',
    },
    {
      key: 'groupNotifications' as const,
      icon: Users,
      label: 'Group Notifications',
      description: 'Get notified for group messages',
    },
    {
      key: 'soundEnabled' as const,
      icon: Volume2,
      label: 'Notification Sound',
      description: 'Play sound with notifications',
    },
    {
      key: 'vibrationEnabled' as const,
      icon: Vibrate,
      label: 'Vibration',
      description: 'Vibrate with notifications',
    },
    {
      key: 'showPreview' as const,
      icon: Eye,
      label: 'Show Preview',
      description: 'Show message preview in notification',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[85vh] flex-col overflow-hidden rounded-t-3xl bg-card"
          >
            {/* Handle */}
            <div className="flex justify-center pb-2 pt-3">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Notification Settings</h2>
                  <p className="text-xs text-muted-foreground">
                    Manage how you receive notifications
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="rounded-full p-2 transition-colors hover:bg-muted"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {/* Permission Status */}
              {!isSupported ? (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4">
                  <div className="flex items-center gap-3">
                    <BellOff className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="font-medium text-destructive">Not Supported</p>
                      <p className="text-xs text-muted-foreground">
                        Push notifications are not supported in this browser
                      </p>
                    </div>
                  </div>
                </div>
              ) : permission === 'denied' ? (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4">
                  <div className="flex items-center gap-3">
                    <BellOff className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="font-medium text-destructive">Notifications Blocked</p>
                      <p className="text-xs text-muted-foreground">
                        Please enable notifications in your browser settings
                      </p>
                    </div>
                  </div>
                </div>
              ) : permission === 'default' ? (
                <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">Enable Push Notifications</p>
                        <p className="text-xs text-muted-foreground">
                          Stay updated with new messages
                        </p>
                      </div>
                    </div>
                    <Button size="sm" onClick={handleRequestPermission} disabled={isLoading}>
                      {isLoading ? 'Enabling...' : 'Enable'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-green-500">Notifications Enabled</p>
                      <p className="text-xs text-muted-foreground">
                        You'll receive push notifications
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Master Toggle */}
              <div
                className={cn(
                  'rounded-xl border p-4 transition-colors',
                  preferences.pushEnabled ? 'border-border bg-card' : 'border-muted bg-muted/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'rounded-lg p-2 transition-colors',
                        preferences.pushEnabled ? 'bg-primary/10' : 'bg-muted'
                      )}
                    >
                      <Bell
                        className={cn(
                          'h-5 w-5',
                          preferences.pushEnabled ? 'text-primary' : 'text-muted-foreground'
                        )}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Push Notifications</p>
                      <p className="text-xs text-muted-foreground">
                        {preferences.pushEnabled
                          ? 'All notifications are on'
                          : 'All notifications are off'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.pushEnabled}
                    onCheckedChange={() => handleTogglePreference('pushEnabled')}
                    disabled={permission !== 'granted'}
                  />
                </div>
              </div>

              {/* Individual Notification Settings */}
              <div className="space-y-1">
                <h3 className="mb-2 px-1 text-sm font-medium text-muted-foreground">
                  Notification Types
                </h3>
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  {notificationOptions.map((option, index) => {
                    const Icon = option.icon;
                    const isEnabled = preferences.pushEnabled && preferences[option.key];

                    return (
                      <div
                        key={option.key}
                        className={cn(
                          'flex items-center justify-between p-4 transition-colors',
                          !preferences.pushEnabled && 'opacity-50',
                          index !== notificationOptions.length - 1 && 'border-b border-border'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'rounded-lg p-2 transition-colors',
                              isEnabled ? 'bg-primary/10' : 'bg-muted'
                            )}
                          >
                            <Icon
                              className={cn(
                                'h-4 w-4',
                                isEnabled ? 'text-primary' : 'text-muted-foreground'
                              )}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{option.label}</p>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                          </div>
                        </div>
                        <Switch
                          checked={preferences[option.key]}
                          onCheckedChange={() => handleTogglePreference(option.key)}
                          disabled={!preferences.pushEnabled || permission !== 'granted'}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Test Notification Button */}
              {permission === 'granted' && preferences.pushEnabled && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    new Notification('Test Notification', {
                      body: 'Push notifications are working correctly!',
                      icon: '/favicon.ico',
                    });
                  }}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Send Test Notification
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
