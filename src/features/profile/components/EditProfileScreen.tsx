import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Check, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/useAuth';
import { useAppDispatch } from '@/store';
import { setUser } from '@/features/auth/authSlice';
import { chatApi } from '@/features/chat/services/chatApi';
import { mockProfileApi } from '@/features/profile/profileService';
import { UserProfile } from '@/features/profile/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EditProfileScreenProps {
  open: boolean;
  onClose: () => void;
}

const statusOptions = [
  { value: 'available', label: 'Available', color: 'bg-green-500' },
  { value: 'busy', label: 'Busy', color: 'bg-red-500' },
  { value: 'away', label: 'Away', color: 'bg-yellow-500' },
  { value: 'invisible', label: 'Invisible', color: 'bg-muted' },
] as const;

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function EditProfileScreen({ open, onClose }: EditProfileScreenProps) {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<UserProfile['status']>('available');
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const data = await mockProfileApi.getProfile();
      setProfile(data);
      setName(data.name || user?.name || '');
      setUsername(data.username || '');
      setBio(data.bio || '');
      setPhone(data.phone || '');
      setStatus(data.status || 'available');
      setAvatarPreview(data.avatar || user?.avatar || '');
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      // Show local preview immediately
      const localUrl = URL.createObjectURL(file);
      setAvatarPreview(localUrl);
      // Upload to cloud
      try {
        const uploaded = await chatApi.uploadFile(file);
        setAvatarPreview(uploaded.url);
      } catch {
        toast.error('Failed to upload avatar - using local preview');
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await mockProfileApi.updateProfile({
        name: name.trim(),
        username: username.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        status,
        avatar: avatarPreview,
      });
      // Sync auth store with updated profile
      if (user) {
        dispatch(setUser({
          id: user.id,
          email: user.email,
          name: updated.name || name.trim(),
          avatar: updated.avatar || avatarPreview,
        }));
      }
      toast.success('Profile updated successfully');
      onClose();
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = profile && (
    name !== profile.name ||
    username !== profile.username ||
    bio !== profile.bio ||
    phone !== (profile.phone || '') ||
    status !== profile.status ||
    avatarPreview !== profile.avatar
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw] sm:w-full h-[90vh] max-h-[700px] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-3 sm:p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 sm:h-10 sm:w-10">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <DialogTitle className="text-base sm:text-lg">Edit Profile</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={cn(
                'font-semibold',
                hasChanges && !isSaving ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Avatar Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center"
              >
                <div className="relative">
                  <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-xl">
                    <AvatarImage src={avatarPreview} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {getInitials(name || 'User')}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 text-sm text-primary font-medium hover:underline"
                >
                  Change Photo
                </button>
              </motion.div>

              {/* Status Selection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="space-y-2"
              >
                <Label className="text-sm text-muted-foreground">Status</Label>
                <div className="flex gap-2 flex-wrap">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setStatus(option.value)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-full border-2 transition-all text-sm',
                        status === option.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className={cn('h-2 w-2 rounded-full', option.color)} />
                      {option.label}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Form Fields */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground text-right">{name.length}/50</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="username"
                    maxLength={30}
                  />
                  <p className="text-xs text-muted-foreground">
                    Only lowercase letters, numbers, and underscores
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">About</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell people about yourself"
                    rows={3}
                    maxLength={150}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">{bio.length}/150</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                    type="tel"
                  />
                </div>
              </motion.div>

              {/* Account Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="pt-4 border-t border-border"
              >
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="text-foreground">{user?.email || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member since</span>
                    <span className="text-foreground">
                      {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
