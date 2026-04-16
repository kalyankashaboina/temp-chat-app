import { useState } from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { useAppDispatch, useAppSelector } from '@/store';
import { openBottomSheet } from '@/store/uiSlice';
import { updateNotifications, updateReadReceipts, setTypingIndicators, setMediaAutoDownload } from '@/features/settings/settingsSlice';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Camera, Bell, Lock, Palette, Globe, HelpCircle, 
  LogOut, ChevronRight, Moon, Sun, Shield, ArrowLeft,
  Volume2, Type, Eye, Download, Monitor, QrCode, Database,
  UserCog, Share2, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  EditProfileScreen,
  PrivacySettingsScreen,
  AccountSettingsScreen,
  StorageDataScreen,
  HelpScreen,
  QRCodeScreen,
} from '@/features/profile/components';

interface ProfileScreenProps {
  open: boolean;
  onClose: () => void;
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const getThemeIcon = (theme: string) => {
  switch (theme) {
    case 'light':
      return Sun;
    case 'dark':
      return Moon;
    default:
      return Monitor;
  }
};

const getThemeLabel = (theme: string) => {
  return theme.charAt(0).toUpperCase() + theme.slice(1);
};

const getLanguageLabel = (lang: string) => {
  const labels: Record<string, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    pt: 'Português',
  };
  return labels[lang] || 'English';
};

const getToneLabel = (tone: string) => {
  return tone.charAt(0).toUpperCase() + tone.slice(1);
};

const getFontSizeLabel = (size: string) => {
  return size.charAt(0).toUpperCase() + size.slice(1);
};

export function ProfileScreen({ open, onClose }: ProfileScreenProps) {
  const { user, logout } = useAuth();
  const dispatch = useAppDispatch();
  const { 
    theme, 
    language, 
    notificationTone, 
    notifications, 
    readReceipts,
    typingIndicators,
    mediaAutoDownload,
    fontSize,
  } = useAppSelector((state) => state.settings);

  const [isOnline] = useState(true);
  
  // Sub-screen states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showStorage, setShowStorage] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  const handleLogout = () => {
    logout();
    onClose();
  };

  const ThemeIcon = getThemeIcon(theme);

  const settingSections = [
    {
      title: 'Profile',
      items: [
        {
          icon: User,
          label: 'Edit Profile',
          description: 'Name, photo, bio',
          action: () => setShowEditProfile(true),
          type: 'link' as const,
        },
        {
          icon: QrCode,
          label: 'QR Code',
          description: 'Share your profile',
          action: () => setShowQRCode(true),
          type: 'link' as const,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          icon: UserCog,
          label: 'Account',
          description: 'Password, security, delete',
          action: () => setShowAccount(true),
          type: 'link' as const,
        },
        {
          icon: Bell,
          label: 'Notifications',
          info: notifications ? 'On' : 'Off',
          action: () => dispatch(openBottomSheet('notificationSettings')),
          type: 'link' as const,
        },
        {
          icon: Volume2,
          label: 'Notification Tone',
          info: getToneLabel(notificationTone),
          action: () => dispatch(openBottomSheet('notificationTone')),
          type: 'link' as const,
        },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        {
          icon: Lock,
          label: 'Privacy',
          description: 'Last seen, blocked users',
          action: () => setShowPrivacy(true),
          type: 'link' as const,
        },
        {
          icon: Eye,
          label: 'Read Receipts',
          value: readReceipts,
          action: () => dispatch(updateReadReceipts(!readReceipts)),
          type: 'toggle' as const,
        },
        {
          icon: Shield,
          label: 'End-to-End Encryption',
          type: 'info' as const,
          info: 'Enabled',
        },
      ],
    },
    {
      title: 'Appearance',
      items: [
        {
          icon: ThemeIcon,
          label: 'Theme',
          info: getThemeLabel(theme),
          action: () => dispatch(openBottomSheet('theme')),
          type: 'link' as const,
        },
        {
          icon: Globe,
          label: 'Language',
          info: getLanguageLabel(language),
          action: () => dispatch(openBottomSheet('language')),
          type: 'link' as const,
        },
        {
          icon: Type,
          label: 'Font Size',
          info: getFontSizeLabel(fontSize),
          action: () => dispatch(openBottomSheet('fontSize')),
          type: 'link' as const,
        },
      ],
    },
    {
      title: 'Data & Storage',
      items: [
        {
          icon: Database,
          label: 'Storage & Data',
          description: 'Manage storage usage',
          action: () => setShowStorage(true),
          type: 'link' as const,
        },
        {
          icon: Download,
          label: 'Auto-download Media',
          value: mediaAutoDownload,
          action: () => dispatch(setMediaAutoDownload(!mediaAutoDownload)),
          type: 'toggle' as const,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: HelpCircle,
          label: 'Help & Support',
          description: 'FAQ, contact, about',
          action: () => setShowHelp(true),
          type: 'link' as const,
        },
      ],
    },
  ];

  return (
    <>
      {/* Full-screen settings page overlay */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop for desktop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:block hidden"
              onClick={onClose}
            />
            
            {/* Full-screen panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                'fixed inset-0 z-50 bg-background flex flex-col',
                // On desktop: slide-in panel from right with max-width
                'md:left-auto md:right-0 md:w-full md:max-w-lg md:shadow-2xl md:border-l md:border-border'
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border flex-shrink-0 safe-top">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onClose} 
                    className="h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <h1 className="text-base sm:text-lg font-semibold">Settings</h1>
                </div>
                {/* Close button visible on desktop */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose} 
                  className="hidden md:flex h-8 w-8 sm:h-10 sm:w-10"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">
                {/* Profile header */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center py-6 sm:py-8 px-4 bg-gradient-to-b from-primary/10 to-transparent"
                >
                  <div className="relative">
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-background shadow-xl">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl sm:text-2xl">
                        {getInitials(user?.name || 'User')}
                      </AvatarFallback>
                    </Avatar>
                    <button 
                      onClick={() => setShowEditProfile(true)}
                      className="absolute bottom-0 right-0 p-1.5 sm:p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                    >
                      <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                  <h2 className="mt-3 sm:mt-4 text-lg sm:text-xl font-semibold text-foreground">{user?.name || 'User'}</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">{user?.email || 'user@example.com'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={cn(
                      'h-2 w-2 rounded-full',
                      isOnline ? 'bg-primary' : 'bg-muted'
                    )} />
                    <span className="text-xs text-muted-foreground">
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  
                  {/* Quick actions */}
                  <div className="flex gap-3 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQRCode(true)}
                      className="text-xs"
                    >
                      <QrCode className="h-3.5 w-3.5 mr-1.5" />
                      QR Code
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEditProfile(true)}
                      className="text-xs"
                    >
                      <User className="h-3.5 w-3.5 mr-1.5" />
                      Edit Profile
                    </Button>
                  </div>
                </motion.div>

                {/* Settings sections */}
                <div className="px-3 sm:px-4 pb-4 space-y-4 sm:space-y-6">
                  {settingSections.map((section, sectionIndex) => (
                    <motion.div
                      key={section.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: sectionIndex * 0.03 }}
                    >
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                        {section.title}
                      </h3>
                      <div className="bg-card rounded-xl overflow-hidden border border-border">
                        {section.items.map((item, itemIndex) => {
                          const Icon = item.icon;
                          const isToggle = item.type === 'toggle';
                          const isInfo = item.type === 'info';
                          
                          const content = (
                            <>
                              <div className="flex items-center gap-2.5 sm:gap-3">
                                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                                  <Icon className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm sm:text-base text-foreground">{item.label}</span>
                                  {'description' in item && item.description && (
                                    <span className="text-xs text-muted-foreground">{item.description}</span>
                                  )}
                                </div>
                              </div>
                              {isToggle ? (
                                <Switch 
                                  checked={item.value} 
                                  onCheckedChange={() => item.action()} 
                                />
                              ) : isInfo ? (
                                <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded">
                                  {item.info}
                                </span>
                              ) : (
                                <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                                  {'info' in item && item.info && <span className="text-xs sm:text-sm">{item.info}</span>}
                                  <ChevronRight className="h-4 w-4" />
                                </div>
                              )}
                            </>
                          );

                          // Use div for toggles to avoid button-inside-button, button for clickable items
                          if (isToggle) {
                            return (
                              <div
                                key={item.label}
                                className={cn(
                                  'w-full flex items-center justify-between p-3 sm:p-4 hover:bg-muted/50 transition-colors cursor-pointer',
                                  itemIndex !== section.items.length - 1 && 'border-b border-border'
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  item.action();
                                }}
                              >
                                {content}
                              </div>
                            );
                          }

                          return (
                            <button
                              key={item.label}
                              onClick={item.action}
                              className={cn(
                                'w-full flex items-center justify-between p-3 sm:p-4 hover:bg-muted/50 transition-colors',
                                itemIndex !== section.items.length - 1 && 'border-b border-border'
                              )}
                              disabled={isInfo}
                            >
                              {content}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}

                  {/* Logout button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Log Out
                    </Button>
                  </motion.div>

                  {/* App info */}
                  <div className="text-center text-xs text-muted-foreground pt-2 sm:pt-4 pb-4 safe-bottom">
                    <p>ChatApp v1.0.0</p>
                    <p className="mt-1">End-to-end encrypted</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sub-screens */}
      <EditProfileScreen open={showEditProfile} onClose={() => setShowEditProfile(false)} />
      <PrivacySettingsScreen open={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <AccountSettingsScreen open={showAccount} onClose={() => setShowAccount(false)} onLogout={handleLogout} />
      <StorageDataScreen open={showStorage} onClose={() => setShowStorage(false)} />
      <HelpScreen open={showHelp} onClose={() => setShowHelp(false)} />
      <QRCodeScreen open={showQRCode} onClose={() => setShowQRCode(false)} />
    </>
  );
}
