import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, Loader2, UserX, Eye, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockProfileApi } from '@/features/profile/profileService';
import { PrivacySettings, BlockedUser } from '@/features/profile/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PrivacySettingsScreenProps {
  open: boolean;
  onClose: () => void;
}

type VisibilityOption = 'everyone' | 'contacts' | 'nobody';

const visibilityOptions: { value: VisibilityOption; label: string }[] = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'contacts', label: 'My Contacts' },
  { value: 'nobody', label: 'Nobody' },
];

export function PrivacySettingsScreen({ open, onClose }: PrivacySettingsScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState<{
    type: 'lastSeen' | 'profilePhoto' | 'about' | null;
    current: VisibilityOption;
  }>({ type: null, current: 'everyone' });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [privacyData, blocked] = await Promise.all([
        mockProfileApi.getPrivacySettings(),
        mockProfileApi.getBlockedUsers(),
      ]);
      setSettings(privacyData);
      setBlockedUsers(blocked);
    } catch (error) {
      toast.error('Failed to load privacy settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (key: keyof PrivacySettings, value: boolean) => {
    if (!settings) return;
    try {
      const updated = await mockProfileApi.updatePrivacySettings({ [key]: value });
      setSettings(updated);
    } catch (error) {
      toast.error('Failed to update setting');
    }
  };

  const handleVisibilityChange = async (
    type: 'lastSeen' | 'profilePhoto' | 'about',
    value: VisibilityOption
  ) => {
    if (!settings) return;
    const key = `${type}Visibility` as keyof PrivacySettings;
    try {
      const updated = await mockProfileApi.updatePrivacySettings({ [key]: value });
      setSettings(updated);
      setShowVisibilityModal({ type: null, current: 'everyone' });
      toast.success('Privacy setting updated');
    } catch (error) {
      toast.error('Failed to update setting');
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await mockProfileApi.unblockUser(userId);
      setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success('User unblocked');
    } catch (error) {
      toast.error('Failed to unblock user');
    }
  };

  const getVisibilityLabel = (value: VisibilityOption) => {
    return visibilityOptions.find((o) => o.value === value)?.label || 'Everyone';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="flex h-[90vh] max-h-[700px] w-[95vw] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:w-full">
          <DialogHeader className="flex-shrink-0 border-b border-border p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <DialogTitle className="text-base sm:text-lg">Privacy</DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              settings && (
                <div className="space-y-6">
                  {/* Who can see my personal info */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Who can see my personal info
                    </h3>
                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                      <button
                        onClick={() =>
                          setShowVisibilityModal({
                            type: 'lastSeen',
                            current: settings.lastSeenVisibility,
                          })
                        }
                        className="flex w-full items-center justify-between border-b border-border p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-primary/10 p-2">
                            <Clock className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm">Last Seen</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="text-xs">
                            {getVisibilityLabel(settings.lastSeenVisibility)}
                          </span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </button>

                      <button
                        onClick={() =>
                          setShowVisibilityModal({
                            type: 'profilePhoto',
                            current: settings.profilePhotoVisibility,
                          })
                        }
                        className="flex w-full items-center justify-between border-b border-border p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-primary/10 p-2">
                            <Eye className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm">Profile Photo</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="text-xs">
                            {getVisibilityLabel(settings.profilePhotoVisibility)}
                          </span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </button>

                      <button
                        onClick={() =>
                          setShowVisibilityModal({
                            type: 'about',
                            current: settings.aboutVisibility,
                          })
                        }
                        className="flex w-full items-center justify-between p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-primary/10 p-2">
                            <Shield className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm">About</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="text-xs">
                            {getVisibilityLabel(settings.aboutVisibility)}
                          </span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </button>
                    </div>
                  </motion.div>

                  {/* Messaging privacy */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                  >
                    <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Messaging
                    </h3>
                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                      <div className="flex items-center justify-between border-b border-border p-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium">Read Receipts</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Let others see when you've read messages
                          </p>
                        </div>
                        <Switch
                          checked={settings.readReceipts}
                          onCheckedChange={(v) => handleToggle('readReceipts', v)}
                        />
                      </div>

                      <div className="flex items-center justify-between border-b border-border p-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium">Typing Indicators</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Show when you're typing a message
                          </p>
                        </div>
                        <Switch
                          checked={settings.typingIndicators}
                          onCheckedChange={(v) => handleToggle('typingIndicators', v)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium">Online Status</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Show when you're online
                          </p>
                        </div>
                        <Switch
                          checked={settings.onlineStatus}
                          onCheckedChange={(v) => handleToggle('onlineStatus', v)}
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Blocked Users */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Blocked Contacts
                    </h3>
                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                      <button
                        onClick={() => setShowBlockedUsers(true)}
                        className="flex w-full items-center justify-between p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-destructive/10 p-2">
                            <UserX className="h-4 w-4 text-destructive" />
                          </div>
                          <span className="text-sm">Blocked Users</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="text-xs">{blockedUsers.length}</span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </button>
                    </div>
                  </motion.div>
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Visibility Selection Modal */}
      <AnimatePresence>
        {showVisibilityModal.type && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/60"
              onClick={() => setShowVisibilityModal({ type: null, current: 'everyone' })}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[60] rounded-t-3xl bg-background"
            >
              <div className="flex justify-center pb-2 pt-3">
                <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="border-b border-border px-4 pb-4">
                <h2 className="text-center text-lg font-semibold capitalize">
                  {showVisibilityModal.type?.replace(/([A-Z])/g, ' $1').trim()}
                </h2>
              </div>
              <div className="pb-safe space-y-2 p-4">
                {visibilityOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleVisibilityChange(showVisibilityModal.type!, option.value)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl p-4 transition-all',
                      showVisibilityModal.current === option.value
                        ? 'border-2 border-primary bg-primary/10'
                        : 'border-2 border-transparent bg-card hover:bg-muted/50'
                    )}
                  >
                    <span
                      className={cn(
                        'font-medium',
                        showVisibilityModal.current === option.value
                          ? 'text-primary'
                          : 'text-foreground'
                      )}
                    >
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Blocked Users Modal */}
      <Dialog open={showBlockedUsers} onOpenChange={setShowBlockedUsers}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Blocked Users</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] space-y-2 overflow-y-auto">
            {blockedUsers.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No blocked users</p>
            ) : (
              blockedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Blocked {new Date(user.blockedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleUnblock(user.id)}>
                    Unblock
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
