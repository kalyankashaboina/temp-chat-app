import { useEffect, useRef, useState, useCallback } from 'react';
import { useChat } from '@/features/chat/useChat';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { LanguageSelector } from './LanguageSelector';
import { TypingIndicator } from './TypingIndicator';
import { CallOverlay, useCall } from './CallOverlay';
import { VanishModeToggle } from './VanishModeToggle';
import { ReplyPreview } from './ReplyPreview';
import { MessageSearch } from './MessageSearch';
import { PinnedMessages } from './PinnedMessages';
import { OfflineQueueIndicator } from './OfflineQueueIndicator';
import { ThemeToggle } from './ThemeToggle';
import { EncryptionIndicator, EncryptionBanner } from './EncryptionIndicator';
import { OnlineStatusBadge } from './OnlineStatusIndicator';
import { NewMessageIndicator } from './NewMessageIndicator';
import { ScrollToBottomButton } from './ScrollToBottomButton';
import { MessageLoadingIndicator } from './MessageLoadingIndicator';
import { StarredMessages } from './StarredMessages';
import { ContactDetails } from './ContactDetails';
import { useSwipeGesture } from '@/shared/hooks/useSwipeGesture';
import { useScrollPagination } from '@/shared/hooks/useScrollPagination';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  Phone,
  Video,
  LogOut,
  Users,
  ArrowLeft,
  Search,
  MoreVertical,
  Timer,
  Shield,
  Image,
  Star,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatWindowProps {
  onOpenMediaGallery?: () => void;
}

import { getInitials, getAvatarColor } from '@/shared/lib/chatUtils';

export function ChatWindow({ onOpenMediaGallery }: ChatWindowProps) {
  const {
    messages,
    activeConversation,
    translate,
    isTyping,
    typingUsers,
    toggleVanishMode,
    replyingTo,
    setReplyingTo,
    setShowConversationList,
    queue,
    isOnline,
    isProcessingQueue,
    pinnedMessages,
    unpinMessage,
    isLoadingMore,
    hasMoreMessages,
    lastMessageId,
    loadMoreMessages,
    starredMessages,
    unstarMessage,
    muteConversation,
    archiveConversation,
  } = useChat();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { callState, initiateCall, endCall, toggleMute, toggleVideo } = useCall(translate);
  const [showSearch, setShowSearch] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [showPinned, setShowPinned] = useState(true);
  const [showEncryption, setShowEncryption] = useState(false);
  const [showStarred, setShowStarred] = useState(false);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const prevLastMessageIdRef = useRef<string | null>(null);

  // Scroll pagination hook
  const { isNearBottom, scrollToBottom, newMessagesCount, setNewMessagesCount, handleScroll } =
    useScrollPagination({
      containerRef: messagesContainerRef,
      hasMore: hasMoreMessages,
      isLoading: isLoadingMore,
      onLoadMore: loadMoreMessages,
      threshold: 100,
    });

  // Swipe gesture for mobile back navigation
  const { handlers: swipeHandlers } = useSwipeGesture({
    onSwipeRight: () => {
      setShowConversationList(true);
    },
  });

  // Smart auto-scroll - only scroll to bottom if user is near bottom
  useEffect(() => {
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isNearBottom]);

  // Track new messages when user is scrolled up
  useEffect(() => {
    if (
      lastMessageId &&
      prevLastMessageIdRef.current &&
      lastMessageId !== prevLastMessageIdRef.current
    ) {
      // New message arrived
      if (!isNearBottom) {
        setNewMessagesCount((prev) => prev + 1);
      }
    }
    prevLastMessageIdRef.current = lastMessageId;
  }, [lastMessageId, isNearBottom, setNewMessagesCount]);

  // Reset new message count when conversation changes
  useEffect(() => {
    setNewMessagesCount(0);
    prevLastMessageIdRef.current = null;
  }, [activeConversation?.id, setNewMessagesCount]);

  // Highlight timer
  useEffect(() => {
    if (highlightedMessageId) {
      const timer = setTimeout(() => setHighlightedMessageId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightedMessageId]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAudioCall = () => {
    if (activeConversation && !activeConversation.isGroup && activeConversation.user) {
      initiateCall('audio', activeConversation.user);
    }
  };

  const handleVideoCall = () => {
    if (activeConversation && !activeConversation.isGroup && activeConversation.user) {
      initiateCall('video', activeConversation.user);
    }
  };

  const handleVanishToggle = (enabled: boolean, timer: number) => {
    if (activeConversation) {
      toggleVanishMode(activeConversation.id, enabled, timer);
    }
  };

  const handleBack = useCallback(() => {
    setShowConversationList(true);
    // Push state for browser back button support
    window.history.pushState({ conversationList: true }, '');
  }, [setShowConversationList]);

  const handleNavigateToMessage = (messageId: string) => {
    setHighlightedMessageId(messageId);
    setShowPinned(false);
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (!activeConversation) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-4 text-center text-muted-foreground"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
            <MessageSquare className="h-10 w-10 text-primary/60" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">No chat selected</h3>
          <p className="text-sm">{translate('conversations.empty')}</p>
        </motion.div>
      </div>
    );
  }

  const isGroup = activeConversation.isGroup;
  const displayName = isGroup ? activeConversation.groupName : activeConversation.user?.name;
  const isUserOnline = isGroup
    ? activeConversation.users?.some((u) => u.isOnline)
    : activeConversation.user?.isOnline;
  const memberCount = isGroup ? activeConversation.users?.length : undefined;
  
  // Get typing users for this specific conversation
  const activeTypingUsers = activeConversation?.id ? (typingUsers[activeConversation.id] || []) : [];
  const typingNames =
    isGroup && activeTypingUsers.length > 0
      ? activeTypingUsers
      : isTyping && activeConversation.user
        ? [activeConversation.user.name]
        : [];

  return (
    <>
      <motion.div
        className="relative flex h-full flex-col bg-background"
        {...swipeHandlers}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Search overlay */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <MessageSearch
                messages={messages}
                onClose={() => setShowSearch(false)}
                onNavigateToMessage={handleNavigateToMessage}
                translate={translate}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat header */}
        <div className="safe-top flex flex-shrink-0 items-center justify-between border-b border-border bg-card px-2 py-3 sm:px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="touch-target flex-shrink-0 text-muted-foreground hover:text-foreground md:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="relative flex-shrink-0">
              {isGroup ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-sm font-semibold text-primary-foreground">
                  <Users className="h-5 w-5" />
                </div>
              ) : (
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white',
                    getAvatarColor(displayName || '')
                  )}
                >
                  {getInitials(displayName || '')}
                </div>
              )}
              {!isGroup && (
                <motion.div
                  animate={{ scale: isUserOnline ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={cn(
                    'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card',
                    isUserOnline ? 'bg-green-500' : 'bg-muted'
                  )}
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold text-foreground">{displayName}</h3>
                <EncryptionIndicator isEncrypted compact translate={translate} />
              </div>
              <p
                className={cn(
                  'truncate text-xs',
                  typingNames.length > 0
                    ? 'text-primary'
                    : isUserOnline
                      ? 'text-green-500'
                      : 'text-muted-foreground'
                )}
              >
                {typingNames.length > 0
                  ? typingNames.length === 1
                    ? `${typingNames[0]} ${translate('typing.indicator')}`
                    : `${typingNames.join(', ')} ${translate('typing.multiple')}`
                  : isGroup
                    ? `${memberCount} ${translate('group.members')}`
                    : isUserOnline
                      ? translate('status.online')
                      : translate('status.offline')}
              </p>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-1">
            {/* Online status badge */}
            <div className="hidden sm:block">
              <OnlineStatusBadge isOnline={isOnline} />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(true)}
              className="hidden text-muted-foreground hover:text-foreground sm:flex"
              title={translate('action.search')}
            >
              <Search className="h-5 w-5" />
            </Button>

            <div className="hidden sm:block">
              <VanishModeToggle
                isEnabled={activeConversation.isVanishMode || false}
                timer={activeConversation.vanishTimer || 60}
                onToggle={handleVanishToggle}
                translate={translate}
              />
            </div>

            {!isGroup && (
              <div className="hidden items-center gap-1 md:flex">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleAudioCall}
                  className="touch-target text-muted-foreground hover:text-foreground"
                  title={translate('action.call')}
                >
                  <Phone className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleVideoCall}
                  className="touch-target text-muted-foreground hover:text-foreground"
                  title={translate('action.videoCall')}
                >
                  <Video className="h-5 w-5" />
                </Button>
              </div>
            )}

            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="touch-target text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50 w-48 bg-popover">
                <DropdownMenuItem onClick={() => setShowSearch(true)} className="sm:hidden">
                  <Search className="mr-2 h-4 w-4" />
                  {translate('action.search')}
                </DropdownMenuItem>
                {!isGroup && (
                  <DropdownMenuItem onClick={() => setShowContactDetails(true)}>
                    <User className="mr-2 h-4 w-4" />
                    View Contact
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setShowStarred(true)}>
                  <Star className="mr-2 h-4 w-4" />
                  {translate('starred.title')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowEncryption(!showEncryption)}>
                  <Shield className="mr-2 h-4 w-4" />
                  {translate('encryption.info')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleVanishToggle(!activeConversation.isVanishMode, 60)}
                >
                  <Timer className="mr-2 h-4 w-4" />
                  {activeConversation.isVanishMode
                    ? translate('vanish.turnOff')
                    : translate('vanish.off')}
                </DropdownMenuItem>
                {onOpenMediaGallery && (
                  <DropdownMenuItem onClick={onOpenMediaGallery}>
                    <Image className="mr-2 h-4 w-4" />
                    {translate('media.gallery')}
                  </DropdownMenuItem>
                )}
                {!isGroup && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleAudioCall} className="md:hidden">
                      <Phone className="mr-2 h-4 w-4" />
                      {translate('action.call')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleVideoCall} className="md:hidden">
                      <Video className="mr-2 h-4 w-4" />
                      {translate('action.videoCall')}
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {translate('action.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden lg:block">
              <LanguageSelector />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="touch-target hidden text-muted-foreground hover:text-destructive md:flex"
              title={translate('action.logout')}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Encryption banner */}
        <AnimatePresence>
          {showEncryption && <EncryptionBanner translate={translate} />}
        </AnimatePresence>

        {/* Pinned messages bar */}
        <AnimatePresence>
          {showPinned && pinnedMessages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <PinnedMessages
                pinnedMessages={pinnedMessages}
                onNavigate={handleNavigateToMessage}
                onUnpin={unpinMessage}
                onClose={() => setShowPinned(false)}
                translate={translate}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Offline queue indicator */}
        <OfflineQueueIndicator
          queue={queue}
          isOnline={isOnline}
          isProcessing={isProcessingQueue}
          translate={translate}
        />

        {/* Messages area */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="relative flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-background to-muted/20 p-3 sm:space-y-4 sm:p-4"
        >
          {/* Loading indicator at top */}
          <AnimatePresence>
            {isLoadingMore && <MessageLoadingIndicator translate={translate} />}
          </AnimatePresence>

          {/* No more messages indicator */}
          {!hasMoreMessages && messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-2 text-center"
            >
              <span className="rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
                {translate('messages.noMoreHistory')}
              </span>
            </motion.div>
          )}

          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex h-full items-center justify-center"
            >
              <div className="px-4 text-center text-muted-foreground">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
                  <MessageSquare className="h-8 w-8 opacity-50" />
                </div>
                <p className="text-sm">Start a conversation with {displayName}</p>
              </div>
            </motion.div>
          ) : (
            <>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  id={`message-${message.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.3), duration: 0.3 }}
                  className={cn(
                    'transition-all duration-500',
                    highlightedMessageId === message.id &&
                      '-mx-2 rounded-xl bg-primary/20 px-2 py-1'
                  )}
                >
                  <MessageBubble message={message} />
                </motion.div>
              ))}
              <AnimatePresence>
                {typingNames.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                  >
                    <TypingIndicator userNames={typingNames} translate={translate} />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* New message indicator */}
        <NewMessageIndicator
          count={newMessagesCount}
          onClick={() => scrollToBottom(true)}
          translate={translate}
        />

        {/* Scroll to bottom button (when no new messages but scrolled up) */}
        <ScrollToBottomButton
          visible={!isNearBottom && newMessagesCount === 0}
          onClick={() => scrollToBottom(true)}
        />

        {/* Reply preview */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex-shrink-0 px-3 pt-2 sm:px-4"
            >
              <ReplyPreview replyTo={replyingTo} onCancel={() => setReplyingTo(null)} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="safe-bottom flex-shrink-0">
          <MessageInput />
        </div>
      </motion.div>

      <CallOverlay
        callState={callState}
        onEndCall={endCall}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        translate={translate}
      />

      {/* Starred messages panel */}
      <StarredMessages
        open={showStarred}
        onClose={() => setShowStarred(false)}
        starredMessages={starredMessages}
        onNavigateToMessage={handleNavigateToMessage}
        onUnstar={unstarMessage}
        translate={translate}
      />

      {/* Contact details panel */}
      {!isGroup && activeConversation?.user && (
        <ContactDetails
          open={showContactDetails}
          onClose={() => setShowContactDetails(false)}
          user={activeConversation.user}
          messages={messages}
          isMuted={activeConversation.isMuted || false}
          isArchived={activeConversation.isArchived || false}
          onMuteToggle={() => muteConversation(activeConversation.id, !activeConversation.isMuted)}
          onArchiveToggle={() =>
            archiveConversation(activeConversation.id, !activeConversation.isArchived)
          }
          onCall={(type) => initiateCall(type, activeConversation.user!)}
          translate={translate}
        />
      )}
    </>
  );
}
