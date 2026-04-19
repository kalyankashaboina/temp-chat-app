import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Message, FileAttachment } from '@/features/chat/types';
import {
  X,
  Phone,
  Video,
  Mail,
  Star,
  Bell,
  BellOff,
  Archive,
  Trash2,
  Image,
  File,
  Music,
  FileText,
  MoreVertical,
  ExternalLink,
  Shield,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ContactDetailsProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  messages: Message[];
  isMuted: boolean;
  isArchived: boolean;
  onMuteToggle: () => void;
  onArchiveToggle: () => void;
  onCall: (type: 'audio' | 'video') => void;
  translate: (key: string) => string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = ['bg-primary', 'bg-green-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'];
  return colors[name.charCodeAt(0) % colors.length];
}

export function ContactDetails({
  open,
  onClose,
  user,
  messages,
  isMuted,
  isArchived,
  onMuteToggle,
  onArchiveToggle,
  onCall,
  translate,
}: ContactDetailsProps) {
  const [activeTab, setActiveTab] = useState('media');

  if (!user) return null;

  // Extract media from messages
  const allAttachments = messages.flatMap((m) => m.attachments);
  const images = allAttachments.filter((a) => a.type === 'image');
  const files = allAttachments.filter((a) => a.type === 'document' || a.type === 'text');
  const audio = allAttachments.filter((a) => a.type === 'audio');

  // Get starred messages count
  const starredCount = messages.filter((m) => m.isPinned).length;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full overflow-hidden p-0 sm:max-w-md">
        {/* Header with gradient background */}
        <div className="relative h-32 bg-gradient-to-br from-primary/80 to-primary/40">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-4 top-4 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Profile section */}
        <div className="relative px-4 pb-4">
          {/* Avatar - positioned to overlap header */}
          <div className="relative -mt-16 mb-4">
            <div
              className={cn(
                'mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-background text-2xl font-bold text-white shadow-xl',
                getAvatarColor(user.name)
              )}
            >
              {getInitials(user.name)}
            </div>
            {/* Online indicator */}
            <div
              className={cn(
                'absolute bottom-1 right-1/3 h-5 w-5 rounded-full border-4 border-background',
                user.isOnline ? 'bg-green-500' : 'bg-muted'
              )}
            />
          </div>

          {/* User info */}
          <div className="mb-4 text-center">
            <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
            <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {user.email}
            </p>
            <p
              className={cn(
                'mt-1 text-xs',
                user.isOnline ? 'text-green-500' : 'text-muted-foreground'
              )}
            >
              {user.isOnline
                ? translate('status.online')
                : `Last seen ${user.lastSeen ? format(user.lastSeen, 'MMM d, HH:mm') : 'recently'}`}
            </p>
          </div>

          {/* Quick actions */}
          <div className="mb-6 flex justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCall('audio')}
              className="flex flex-col items-center gap-1"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20">
                <Phone className="h-5 w-5" />
              </div>
              <span className="text-xs text-muted-foreground">{translate('action.call')}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCall('video')}
              className="flex flex-col items-center gap-1"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20">
                <Video className="h-5 w-5" />
              </div>
              <span className="text-xs text-muted-foreground">{translate('action.videoCall')}</span>
            </motion.button>
          </div>

          {/* Settings section */}
          <div className="mb-6 space-y-1">
            <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3 transition-colors hover:bg-muted/70">
              <div className="flex items-center gap-3">
                {isMuted ? (
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Bell className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {translate('contact.muteNotifications')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isMuted ? translate('contact.muted') : translate('contact.notMuted')}
                  </p>
                </div>
              </div>
              <Switch checked={isMuted} onCheckedChange={onMuteToggle} />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3 transition-colors hover:bg-muted/70">
              <div className="flex items-center gap-3">
                <Archive className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {translate('contact.archiveChat')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isArchived ? translate('contact.archived') : translate('contact.notArchived')}
                  </p>
                </div>
              </div>
              <Switch checked={isArchived} onCheckedChange={onArchiveToggle} />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3 transition-colors hover:bg-muted/70">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {translate('starred.title')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {starredCount} {translate('starred.messages')}
                  </p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3 transition-colors hover:bg-muted/70">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {translate('encryption.title')}
                  </p>
                  <p className="text-xs text-muted-foreground">{translate('encryption.active')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Media tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="media" className="gap-1.5">
                <Image className="h-4 w-4" />
                <span className="hidden sm:inline">{translate('media.photos')}</span>
                <span className="text-xs text-muted-foreground">({images.length})</span>
              </TabsTrigger>
              <TabsTrigger value="files" className="gap-1.5">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">{translate('media.files')}</span>
                <span className="text-xs text-muted-foreground">({files.length})</span>
              </TabsTrigger>
              <TabsTrigger value="audio" className="gap-1.5">
                <Music className="h-4 w-4" />
                <span className="hidden sm:inline">{translate('media.audio')}</span>
                <span className="text-xs text-muted-foreground">({audio.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="media" className="mt-4">
              {images.length === 0 ? (
                <EmptyMediaState icon={Image} text={translate('media.noPhotos')} />
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {images.slice(0, 9).map((img, idx) => (
                    <motion.div
                      key={img.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="aspect-square overflow-hidden rounded-lg bg-muted"
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className="h-full w-full cursor-pointer object-cover transition-transform hover:scale-110"
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="files" className="mt-4">
              {files.length === 0 ? (
                <EmptyMediaState icon={File} text={translate('media.noFiles')} />
              ) : (
                <div className="space-y-2">
                  {files.slice(0, 5).map((file) => (
                    <FileItem key={file.id} file={file} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="audio" className="mt-4">
              {audio.length === 0 ? (
                <EmptyMediaState icon={Music} text={translate('media.noAudio')} />
              ) : (
                <div className="space-y-2">
                  {audio.slice(0, 5).map((file) => (
                    <FileItem key={file.id} file={file} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function EmptyMediaState({ icon: Icon, text }: { icon: typeof Image; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
        <Icon className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function FileItem({ file }: { file: FileAttachment }) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-2 transition-colors hover:bg-muted/70">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <File className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
      </div>
    </div>
  );
}
