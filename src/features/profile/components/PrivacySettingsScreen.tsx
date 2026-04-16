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

  const handleVisibilityChange = async (type: 'lastSeen' | 'profilePhoto' | 'about', value: VisibilityOption) => {
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
      setBlockedUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('User unblocked');
    } catch (error) {
      toast.error('Failed to unblock user');
    }
  };

  const getVisibilityLabel = (value: VisibilityOption) => {
    return visibilityOptions.find(o => o.value === value)?.label || 'Everyone';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-full h-[90vh] max-h-[700px] p-0 gap-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-3 sm:p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 sm:h-10 sm:w-10">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <DialogTitle className="text-base sm:text-lg">Privacy</DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : settings && (
              <div className="space-y-6">
                {/* Who can see my personal info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                    Who can see my personal info
                  </h3>
                  <div className="bg-card rounded-xl overflow-hidden border border-border">
                    <button
                      onClick={() => setShowVisibilityModal({ type: 'lastSeen', current: settings.lastSeenVisibility })}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm">Last Seen</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-xs">{getVisibilityLabel(settings.lastSeenVisibility)}</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </button>

                    <button
                      onClick={() => setShowVisibilityModal({ type: 'profilePhoto', current: settings.profilePhotoVisibility })}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Eye className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm">Profile Photo</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-xs">{getVisibilityLabel(settings.profilePhotoVisibility)}</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </button>

                    <button
                      onClick={() => setShowVisibilityModal({ type: 'about', current: settings.aboutVisibility })}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm">About</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-xs">{getVisibilityLabel(settings.aboutVisibility)}</span>
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
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                    Messaging
                  </h3>
                  <div className="bg-card rounded-xl overflow-hidden border border-border">
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <div className="flex-1">
                        <p className="text-sm font-medium">Read Receipts</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Let others see when you've read messages
                        </p>
                      </div>
                      <Switch
                        checked={settings.readReceipts}
                        onCheckedChange={(v) => handleToggle('readReceipts', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <div className="flex-1">
                        <p className="text-sm font-medium">Typing Indicators</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
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
                        <p className="text-xs text-muted-foreground mt-0.5">
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
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                    Blocked Contacts
                  </h3>
                  <div className="bg-card rounded-xl overflow-hidden border border-border">
                    <button
                      onClick={() => setShowBlockedUsers(true)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-destructive/10">
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
              className="fixed inset-0 bg-black/60 z-[60]"
              onClick={() => setShowVisibilityModal({ type: null, current: 'everyone' })}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[60] bg-background rounded-t-3xl"
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
              </div>
              <div className="px-4 pb-4 border-b border-border">
                <h2 className="text-lg font-semibold text-center capitalize">
                  {showVisibilityModal.type?.replace(/([A-Z])/g, ' $1').trim()}
                </h2>
              </div>
              <div className="p-4 space-y-2 pb-safe">
                {visibilityOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleVisibilityChange(showVisibilityModal.type!, option.value)}
                    className={cn(
                      'w-full flex items-center justify-between p-4 rounded-xl transition-all',
                      showVisibilityModal.current === option.value
                        ? 'bg-primary/10 border-2 border-primary'
                        : 'bg-card border-2 border-transparent hover:bg-muted/50'
                    )}
                  >
                    <span className={cn(
                      'font-medium',
                      showVisibilityModal.current === option.value ? 'text-primary' : 'text-foreground'
                    )}>
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
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {blockedUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No blocked users
              </p>
            ) : (
              blockedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-card rounded-lg"
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblock(user.id)}
                  >
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
