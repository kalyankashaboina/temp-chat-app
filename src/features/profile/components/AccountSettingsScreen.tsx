import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Key, Shield, Trash2, AlertTriangle, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { mockProfileApi } from '@/features/profile/profileService';
import { toast } from 'sonner';

interface AccountSettingsScreenProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function AccountSettingsScreen({ open, onClose, onLogout }: AccountSettingsScreenProps) {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete account
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Two-factor
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await mockProfileApi.changePassword(currentPassword, newPassword);
      if (result.success) {
        toast.success('Password changed successfully');
        setShowChangePassword(false);
        resetPasswordForm();
      } else {
        toast.error(result.error || 'Failed to change password');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
  };

  const handleEnableTwoFactor = async () => {
    // 2FA not yet implemented — placeholder
    toast.info('Two-factor authentication coming soon');
  };

  const handleConfirmTwoFactor = () => {
    if (twoFactorCode === '123456') {
      setTwoFactorEnabled(true);
      setShowTwoFactor(false);
      setTwoFactorCode('');
      toast.success('Two-factor authentication enabled');
    } else {
      toast.error('Invalid verification code');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      const result = await mockProfileApi.requestAccountDeletion(deletePassword);
      if (result.success) {
        toast.success('Account deletion scheduled');
        onLogout();
      } else {
        toast.error(result.error || 'Failed to delete account');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const accountItems = [
    {
      icon: Key,
      label: 'Change Password',
      description: 'Update your account password',
      action: () => setShowChangePassword(true),
      color: 'primary',
    },
    {
      icon: Shield,
      label: 'Two-Factor Authentication',
      description: twoFactorEnabled ? 'Enabled' : 'Add extra security to your account',
      action: twoFactorEnabled ? () => {} : handleEnableTwoFactor,
      color: 'primary',
      badge: twoFactorEnabled ? 'On' : undefined,
    },
    {
      icon: Trash2,
      label: 'Delete Account',
      description: 'Permanently delete your account and data',
      action: () => setShowDeleteAccount(true),
      color: 'destructive',
    },
  ];

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
              <DialogTitle className="text-base sm:text-lg">Account</DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {accountItems.map((item, index) => {
                const Icon = item.icon;
                const isDestructive = item.color === 'destructive';

                return (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={item.action}
                    className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50"
                  >
                    <div
                      className={`rounded-lg p-2.5 ${isDestructive ? 'bg-destructive/10' : 'bg-primary/10'}`}
                    >
                      <Icon
                        className={`h-5 w-5 ${isDestructive ? 'text-destructive' : 'text-primary'}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${isDestructive ? 'text-destructive' : 'text-foreground'}`}
                      >
                        {item.label}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    {item.badge && (
                      <span className="rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {item.badge}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Security Tips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 rounded-xl bg-muted/50 p-4"
            >
              <h4 className="mb-2 text-sm font-medium">Security Tips</h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>• Use a unique password you don't use elsewhere</li>
                <li>• Enable two-factor authentication for extra security</li>
                <li>• Never share your password with anyone</li>
                <li>• Log out from devices you don't recognize</li>
              </ul>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your current password and choose a new one</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">At least 8 characters</p>
            </div>

            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePassword(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Two-Factor Modal */}
      <Dialog open={showTwoFactor} onOpenChange={setShowTwoFactor}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code from your authenticator app
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="mb-2 text-sm text-muted-foreground">Your secret key:</p>
              <code className="font-mono text-primary">{twoFactorSecret}</code>
            </div>

            <div className="space-y-2">
              <Label>Verification Code</Label>
              <Input
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-xl tracking-widest"
                maxLength={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTwoFactor(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmTwoFactor}>Verify & Enable</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Modal */}
      <Dialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <DialogTitle className="text-destructive">Delete Account</DialogTitle>
            </div>
            <DialogDescription>
              This action cannot be undone. All your data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            <div className="space-y-2">
              <Label>Type DELETE to confirm</Label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                placeholder="DELETE"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteAccount(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmText !== 'DELETE'}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
