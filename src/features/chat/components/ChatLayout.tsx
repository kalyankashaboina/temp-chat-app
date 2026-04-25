import { useState, useEffect, lazy, Suspense } from 'react';
import { useChat } from '@/features/chat/useChat';

const ConversationList = lazy(() =>
  import('./ConversationList').then((m) => ({ default: m.ConversationList }))
);

const ChatWindow = lazy(() => import('./ChatWindow').then((m) => ({ default: m.ChatWindow })));

const CallHistory = lazy(() => import('./CallHistory').then((m) => ({ default: m.CallHistory })));

const UsersList = lazy(() => import('./UsersList').then((m) => ({ default: m.UsersList })));

const AIChat = lazy(() => import('./AIChat').then((m) => ({ default: m.AIChat })));

const ProfileScreen = lazy(() =>
  import('./ProfileScreen').then((m) => ({ default: m.ProfileScreen }))
);

const MediaGallery = lazy(() =>
  import('./MediaGallery').then((m) => ({ default: m.MediaGallery }))
);

const InstallPrompt = lazy(() =>
  import('./InstallPrompt').then((m) => ({ default: m.InstallPrompt }))
);

const UpdatePrompt = lazy(() =>
  import('./UpdatePrompt').then((m) => ({ default: m.UpdatePrompt }))
);

import { NotificationPrompt } from './NotificationPrompt';
import { OnlineStatusIndicator } from './OnlineStatusIndicator';
import { ConnectionStatus } from './ConnectionStatus';

import { useSwipeGesture } from '@/shared/hooks/useSwipeGesture';
import { cn } from '@/lib/utils';
import { MessageSquare, Phone, UserPlus, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ErrorBoundary from '@/components/ErrorBoundary';

type TabType = 'chats' | 'calls' | 'users';

function ChatContent() {
  const {
    showConversationList,
    setShowConversationList,
    callHistory,
    allUsers,
    conversations,
    activeConversation,
    startNewChat,
    translate,
    isOnline,
    queue,
    isProcessingQueue,
    loadConversations,
    loadUsers,
  } = useChat();

  // Load conversations and users when app mounts
  useEffect(() => {
    loadConversations();
    loadUsers();
  }, []);
  const [activeTab, setActiveTab] = useState<TabType>('chats');
  const [showProfile, setShowProfile] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [aiChatEnabled, setAiChatEnabled] = useState(false);

  // Swipe gestures for mobile navigation
  const { handlers: swipeHandlers } = useSwipeGesture({
    onSwipeRight: () => {
      if (!showConversationList && activeConversation) {
        setShowConversationList(true);
      }
    },
    onSwipeLeft: () => {
      if (showConversationList && activeConversation) {
        setShowConversationList(false);
      }
    },
  });

  // Handle back button on mobile
  useEffect(() => {
    const handlePopState = () => {
      if (!showConversationList && activeConversation) {
        setShowConversationList(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showConversationList, setShowConversationList, activeConversation]);

  const existingUserIds = conversations.filter((c) => !c.isGroup && c.user).map((c) => c.user!.id);
  const handleCallBack = (_call: unknown) => {
    /* call callback */
  };

  const tabs = [
    {
      id: 'chats' as const,
      label: translate('tabs.chats'),
      icon: MessageSquare,
      count: conversations.reduce((acc, c) => acc + c.unreadCount, 0),
    },
    {
      id: 'calls' as const,
      label: translate('tabs.calls'),
      icon: Phone,
      count: callHistory.filter((c) => c.status === 'missed').length,
    },
    { id: 'users' as const, label: translate('tabs.users'), icon: UserPlus },
  ];

  // Determine what to show on mobile
  const showSidebar = showConversationList || !activeConversation;
  const showChatWindow = !showConversationList && activeConversation;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background" {...swipeHandlers}>
      {/* Global online status indicator */}
      <OnlineStatusIndicator
        isOnline={isOnline}
        queueCount={queue.length}
        isProcessing={isProcessingQueue}
        translate={translate}
      />

      <div className="relative flex flex-1 overflow-hidden">
        {/* Sidebar - Always visible on desktop, conditionally on mobile */}
        <div
          className={cn(
            'flex flex-shrink-0 flex-col border-r border-border bg-card',
            // Desktop: always visible with fixed width
            'md:relative md:w-80 md:translate-x-0 md:opacity-100 lg:w-96',
            // Mobile: full width, slide in/out based on state
            'absolute inset-0 z-30 w-full transition-transform duration-300 ease-out md:relative',
            // Mobile visibility
            showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          )}
        >
          {/* Tabs header */}
          <div className="safe-top flex flex-shrink-0 items-center border-b border-border bg-card">
            <div className="flex flex-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'touch-target relative flex flex-1 items-center justify-center gap-1.5 py-3.5 text-sm font-medium transition-all',
                      activeTab === tab.id
                        ? 'border-b-2 border-primary bg-primary/5 text-primary'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground active:bg-muted'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="xs:inline hidden sm:inline">{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-2 top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground sm:static sm:ml-1"
                      >
                        {tab.count > 99 ? '99+' : tab.count}
                      </motion.span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Settings button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowProfile(true)}
              className="mx-2 text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'chats' && (
                <motion.div
                  key="chats"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="h-full"
                >
                  <ErrorBoundary>
                    <Suspense fallback={null}>
                      <ConversationList />
                    </Suspense>
                  </ErrorBoundary>
                </motion.div>
              )}
              {activeTab === 'calls' && (
                <motion.div
                  key="calls"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="h-full"
                >
                  <CallHistory
                    calls={callHistory}
                    onCallBack={handleCallBack}
                    translate={translate}
                  />
                </motion.div>
              )}
              {activeTab === 'users' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="h-full"
                >
                  <UsersList
                    users={allUsers}
                    existingConversationUserIds={existingUserIds}
                    onStartChat={startNewChat}
                    translate={translate}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Main chat area */}
        <div
          className={cn(
            'flex min-w-0 flex-1 flex-col',
            // On mobile: hide when sidebar is showing
            !showChatWindow && 'hidden md:flex'
          )}
        >
          <ErrorBoundary>
            <Suspense fallback={null}>
              <ChatWindow onOpenMediaGallery={() => setShowMediaGallery(true)} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>

      {/* Notification prompt */}
      <NotificationPrompt translate={translate} />

      {/* AI Chat floating button */}
      {aiChatEnabled && <AIChat translate={translate} />}

      {/* Profile Screen */}
      <ErrorBoundary>
        <Suspense fallback={null}>
          <ProfileScreen open={showProfile} onClose={() => setShowProfile(false)} />
        </Suspense>
      </ErrorBoundary>
      {/* Media Gallery */}
      <MediaGallery open={showMediaGallery} onClose={() => setShowMediaGallery(false)} />

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* App Update Prompt */}
      <UpdatePrompt />

      {/* Connection Status Toast */}
      <ConnectionStatus />
    </div>
  );
}

export function ChatLayout() {
  return <ChatContent />;
}
