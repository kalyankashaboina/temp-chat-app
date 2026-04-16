import { useState, useEffect } from 'react';
import { useChat } from '@/features/chat/useChat';
import { Conversation } from '@/features/chat/types';
import { cn } from '@/lib/utils';
import { MessageSquare, Users, Search, Plus, Timer, BellOff, Pin, Archive } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CreateGroupModal } from './CreateGroupModal';
import { ConversationActions, MutedBadge, PinnedBadge } from './ConversationActions';
import { format, isToday, isYesterday } from 'date-fns';
import { motion } from 'framer-motion';
import { socketClient, TypingPayload } from '@/features/chat/services/socketClient';

import { getInitials, getAvatarColor } from '@/shared/lib/chatUtils';

function formatTime(date?: Date): string {
  if (!date) return '';
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  isTyping?: boolean;
  onMute: () => void;
  onArchive: () => void;
  onPin: () => void;
  onDelete: () => void;
  translate: (key: string) => string;
}

function TypingDots() {
  return (
    <span className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1 w-1 rounded-full bg-primary"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </span>
  );
}

function ConversationItem({ 
  conversation, 
  isActive, 
  onClick, 
  isTyping, 
  onMute, 
  onArchive, 
  onPin, 
  onDelete, 
  translate 
}: ConversationItemProps) {
  const displayName = conversation.isGroup ? conversation.groupName : conversation.user?.name || 'Unknown';
  const isOnline = conversation.isGroup ? conversation.users?.some(u => u.isOnline) : conversation.user?.isOnline;
  const memberCount = conversation.isGroup ? conversation.users?.length : undefined;
  const lastMessageTime = conversation.lastMessage?.timestamp;

  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200',
          isActive 
            ? 'bg-primary/10 border border-primary/20 shadow-sm' 
            : 'hover:bg-secondary/80 border border-transparent'
        )}
      >
        <div className="relative">
          {conversation.isGroup ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
              <Users className="h-5 w-5" />
            </div>
          ) : (
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white',
              getAvatarColor(displayName || '')
            )}>
              {getInitials(displayName || '')}
            </div>
          )}
          {!conversation.isGroup && (
            <div className={cn(
              'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-sidebar',
              isOnline ? 'bg-green-500' : 'bg-muted'
            )} />
          )}
          {conversation.isVanishMode && (
            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Timer className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 text-left overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-foreground truncate">{displayName}</span>
              {/* Badges */}
              {conversation.isPinned && <PinnedBadge />}
              {conversation.isMuted && <MutedBadge />}
            </div>
            <div className="flex items-center gap-2">
              {lastMessageTime && (
                <span className="text-xs text-muted-foreground">{formatTime(lastMessageTime)}</span>
              )}
              {conversation.unreadCount > 0 && !conversation.isMuted && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                  {conversation.unreadCount}
                </span>
              )}
              {conversation.unreadCount > 0 && conversation.isMuted && (
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/50" />
              )}
            </div>
          </div>
          <div className="text-sm text-muted-foreground truncate">
            {isTyping ? (
              <span className="flex items-center gap-1.5 text-primary">
                <TypingDots />
                <span>typing...</span>
              </span>
            ) : conversation.isGroup ? (
              `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`
            ) : (
              conversation.lastMessage?.content || 'Start a conversation'
            )}
          </div>
        </div>
      </button>

      {/* Actions dropdown - appears on hover */}
      <div className="absolute top-1/2 right-2 -translate-y-1/2">
        <ConversationActions
          isMuted={conversation.isMuted || false}
          isArchived={conversation.isArchived || false}
          isPinned={conversation.isPinned || false}
          onMute={onMute}
          onArchive={onArchive}
          onPin={onPin}
          onDelete={onDelete}
          translate={translate}
        />
      </div>
    </div>
  );
}

export function ConversationList() {
  const { conversations, activeConversation, setActiveConversation, translate, allUsers, createGroup, isTyping, typingUsers, muteConversation, archiveConversation, pinConversation, deleteConversation } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [typingConversations, setTypingConversations] = useState<Map<string, string[]>>(new Map());

  // Listen for typing events from all conversations
  useEffect(() => {
    const unsubStart = socketClient.on<TypingPayload>('typing:start', (event) => {
      setTypingConversations(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(event.payload.conversationId) || [];
        if (!current.includes(event.payload.userName)) {
          newMap.set(event.payload.conversationId, [...current, event.payload.userName]);
        }
        return newMap;
      });
    });

    const unsubStop = socketClient.on<TypingPayload>('typing:stop', (event) => {
      setTypingConversations(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(event.payload.conversationId) || [];
        newMap.set(
          event.payload.conversationId, 
          current.filter(name => name !== event.payload.userName)
        );
        return newMap;
      });
    });

    return () => {
      unsubStart();
      unsubStop();
    };
  }, []);

  const isConversationTyping = (convId: string) => {
    const socketTyping = typingConversations.get(convId);
    if (socketTyping && socketTyping.length > 0) return true;
    // Also check active conversation typing from context
    return activeConversation?.id === convId && isTyping;
  };

  // Filter out archived conversations and apply search
  const filteredConversations = conversations
    .filter(conv => !conv.isArchived)
    .filter(conv => {
      const name = conv.isGroup ? conv.groupName : conv.user?.name;
      return name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

  const handleCreateGroup = (name: string, members: import("@/features/chat/types").User[]) => {
    createGroup(name, members);
    setShowCreateGroup(false);
  };

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Header with search */}
      <div className="p-3 space-y-3 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-sidebar-foreground">{translate('conversations.title')}</h2>
          </div>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors text-primary"
            title={translate('group.create')}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={translate('input.search')}
            className="pl-10 bg-muted/50 border-0"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <MessageSquare className="h-6 w-6 opacity-50" />
            </div>
            <p className="text-sm font-medium">{translate('users.noResults')}</p>
            <p className="text-xs">Try a different search</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={activeConversation?.id === conversation.id}
              onClick={() => setActiveConversation(conversation)}
              isTyping={isConversationTyping(conversation.id)}
              onMute={() => muteConversation(conversation.id, !conversation.isMuted)}
              onArchive={() => archiveConversation(conversation.id, !conversation.isArchived)}
              onPin={() => pinConversation(conversation.id, !conversation.isPinned)}
              onDelete={() => deleteConversation(conversation.id)}
              translate={translate}
            />
          ))
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        users={allUsers}
        onCreateGroup={handleCreateGroup}
        translate={translate}
      />
    </div>
  );
}
