import { useCallback, useMemo, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { t } from '@/shared/lib/i18n';
import { eventLogger } from '@/shared/services/eventLogger';
import {
  sendMessageAsync,
  retryMessageAsync,
  retryFileUploadAsync,
  loadMoreMessagesAsync,
  processQueueAsync,
  fetchConversations,
  fetchMessages,
  fetchUsers,
  startNewChatAsync,
  createGroupAsync,
  setOnline,
  setTyping as setTypingAction,
  setTypingUsers,
  setShowConversationList as setShowConvListAction,
  setSearchQuery as setSearchQueryAction,
  setReplyingTo as setReplyingToAction,
  setLanguage as setLanguageAction,
  setActiveConversation as setActiveConvAction,
  editMessage as editMessageAction,
  deleteMessage as deleteMessageAction,
  applyRemoteDelete,
  applyRemoteEdit,
  addReaction as addReactionAction,
  removeReaction as removeReactionAction,
  applyRemoteReaction,
  starMessage as starMessageAction,
  unstarMessage as unstarMessageAction,
  pinMessage as pinMessageAction,
  unpinMessage as unpinMessageAction,
  forwardMessage as forwardMessageAction,
  markViewOnceAsViewed as markViewOnceAction,
  startNewChat as startNewChatLocal,
  createGroup as createGroupLocal,
  toggleVanishMode as toggleVanishModeAction,
  muteConversation as muteConvAction,
  archiveConversation as archiveConvAction,
  pinConversation as pinConvAction,
  deleteConversation as deleteConvAction,
  addCallToHistory as addCallAction,
  addTypingUser,
  removeTypingUser,
  updateUserPresence,
  setOnlineUsers,
  addIncomingMessage,
  updateMessageStatus,
  confirmMessage,
  removeVanishedMessage,
  upsertConversation,
  setCurrentUserId,
} from '@/features/chat/chatSlice';
import { socketClient } from '@/features/chat/services/socketClient';
import type {
  Language,
  Conversation,
  User,
  ReplyTo,
  CallRecord,
  Message,
} from '@/features/chat/types';
import { useAppSelector as useSelector } from '@/store';

export function useChat() {
  const dispatch = useAppDispatch();

  const activeConversationId = useAppSelector((s) => s.chat.activeConversationId);
  const conversations = useAppSelector((s) => s.chat.conversations);
  const messagesMap = useAppSelector((s) => s.chat.messagesMap);
  const isOnline = useAppSelector((s) => s.chat.isOnline);
  const queue = useAppSelector((s) => s.chat.queue);
  const language = useAppSelector((s) => s.chat.language);
  const isTyping = useAppSelector((s) => s.chat.isTyping);
  const typingUsers = useAppSelector((s) => s.chat.typingUsers);
  const showConversationList = useAppSelector((s) => s.chat.showConversationList);
  const callHistory = useAppSelector((s) => s.chat.callHistory);
  const allUsers = useAppSelector((s) => s.chat.allUsers);
  const searchQuery = useAppSelector((s) => s.chat.searchQuery);
  const replyingTo = useAppSelector((s) => s.chat.replyingTo);
  const isProcessingQueue = useAppSelector((s) => s.chat.isProcessingQueue);
  const isLoadingMore = useAppSelector((s) => s.chat.isLoadingMore);
  const hasMoreMessagesMap = useAppSelector((s) => s.chat.hasMoreMessages);
  const currentUserId = useAppSelector((s) => s.chat.currentUserId);

  const authUser = useAppSelector((s) => s.auth.user);

  // Keep currentUserId in sync with auth user
  useEffect(() => {
    if (authUser?.id && authUser.id !== currentUserId) {
      dispatch(setCurrentUserId(authUser.id));
    }
  }, [authUser?.id, currentUserId, dispatch]);



  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );
  const messages = useMemo(
    () => (activeConversationId ? messagesMap[activeConversationId] || [] : []),
    [activeConversationId, messagesMap]
  );
  const pinnedMessages = useMemo(() => messages.filter((m) => m.isPinned), [messages]);
  const starredMessages = useMemo(() => messages.filter((m) => m.isStarred), [messages]);
  const hasMoreMessages = activeConversationId
    ? (hasMoreMessagesMap[activeConversationId] ?? true)
    : false;
  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;

  const currentUser = useMemo(
    () => ({
      id: authUser?.id || '',
      name: authUser?.name || 'You',
      email: authUser?.email || '',
      avatar: authUser?.avatar || '',
      isOnline: true,
    }),
    [authUser]
  );

  const translate = useCallback(
    (key: string) => t(key as Parameters<typeof t>[0], language),
    [language]
  );

  useEffect(() => {
  console.log('[UI] messages updated', {
    conv: activeConversationId,
    count: messages.length,
    last: messages[messages.length - 1],
  });
}, [messages, activeConversationId]);

  // ── Socket event listeners ────────────────────────────────────────────────

  const activeConvIdRef = useRef(activeConversationId);
  activeConvIdRef.current = activeConversationId;
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  useEffect(() => {
    const subs = [
      // Presence
      socketClient.on('presence:init', (e) => {
        const payload = e.payload as { onlineUsers: string[] };
        dispatch(setOnlineUsers(payload.onlineUsers));
      }),
      socketClient.on('user:online', (e) =>
        dispatch(
          updateUserPresence({ userId: (e.payload as { userId: string }).userId, isOnline: true })
        )
      ),
      socketClient.on('user:offline', (e) =>
        dispatch(
          updateUserPresence({ userId: (e.payload as { userId: string }).userId, isOnline: false })
        )
      ),

      // Messages
     socketClient.on('message:new', (e) => {
  const p = e.payload as {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    createdAt: string;
    tempId?: string;
  };

  eventLogger.log('MESSAGE_NEW', {
    messageId: p.id,
    tempId: p.tempId,
    conversationId: p.conversationId,
    userId: p.senderId,
    payload: { content: p.content },
  });

  const isOwn = p.senderId === currentUserIdRef.current;

  const incoming: Message = {
    id: p.id,
    content: p.content,
    senderId: p.senderId,
    timestamp: p.createdAt, // ✅ FIX (string, not Date)
    status: 'sent',
    attachments: [],
    isOwn,
    reactions: [],
  };

  // ✅ ONLY add messages from OTHER users
  if (!isOwn) {
    dispatch(
      addIncomingMessage({
        conversationId: p.conversationId,
        message: incoming,
      })
    );

    eventLogger.log('MESSAGE_RECEIVED', {
      messageId: p.id,
      conversationId: p.conversationId,
      userId: p.senderId,
    });
  }

  // ❌ DO NOT call confirmMessage here
}),
      socketClient.on('message:sent', (e) => {
        const p = e.payload as {
          tempId: string;
          messageId: string;
          conversationId: string;
          createdAt: string;
        };
        eventLogger.log('MESSAGE_SENT', {
          tempId: p.tempId,
          messageId: p.messageId,
          conversationId: p.conversationId,
        });
        dispatch(
          confirmMessage({
            conversationId: p.conversationId,
            tempId: p.tempId,
            realId: p.messageId,
            createdAt: p.createdAt,
          })
        );
      }),
      
      // BUG FIX #4: Listen for message:confirmed from queue processor (real MongoDB ID)
      socketClient.on('message:confirmed', (e) => {
        const p = e.payload as {
          tempId: string;
          realId: string;
          conversationId: string;
          createdAt: string;
        };
        eventLogger.log('MESSAGE_CONFIRMED', {
          tempId: p.tempId,
          messageId: p.realId,
          conversationId: p.conversationId,
        });
        dispatch(
          confirmMessage({
            conversationId: p.conversationId,
            tempId: p.tempId,
            realId: p.realId,
            createdAt: p.createdAt,
          })
        );
      }),
      
      socketClient.on('message:delivered', (e) => {
        const p = e.payload as { messageId: string; conversationId: string };
        eventLogger.log('MESSAGE_DELIVERED', {
          messageId: p.messageId,
          conversationId: p.conversationId,
        });
        if (p.conversationId)
          dispatch(
            updateMessageStatus({
              conversationId: p.conversationId,
              messageId: p.messageId,
              status: 'delivered',
            })
          );
      }),
      socketClient.on('message:read', (e) => {
        const p = e.payload as { conversationId: string; messageIds: string[] };
        eventLogger.log('MESSAGE_READ', {
          conversationId: p.conversationId,
          payload: { messageIds: p.messageIds },
        });
        p.messageIds?.forEach((mid) =>
          dispatch(
            updateMessageStatus({
              conversationId: p.conversationId,
              messageId: mid,
              status: 'read',
            })
          )
        );
      }),
      socketClient.on('message:failed', (e) => {
        // BUG FIX #3: Use conversationId from payload, not activeConvIdRef
        const p = e.payload as { tempId: string; conversationId?: string; reason?: string };
        const convId = p.conversationId || activeConvIdRef.current;
        eventLogger.log('MESSAGE_FAILED', {
          tempId: p.tempId,
          conversationId: convId,
          error: p.reason,
        });
        if (convId && p.tempId) {
          dispatch(
            updateMessageStatus({ conversationId: convId, messageId: p.tempId, status: 'failed' })
          );
          if (p.reason) {
            console.error(`Message failed: ${p.reason}`);
          }
        }
      }),
      socketClient.on('message:deleted', (e) => {
        const p = e.payload as { messageId: string; conversationId: string };
        eventLogger.log('MESSAGE_DELETED', {
          messageId: p.messageId,
          conversationId: p.conversationId,
        });
        dispatch(applyRemoteDelete({ conversationId: p.conversationId, messageId: p.messageId }));
      }),
      socketClient.on('message:edited', (e) => {
        const p = e.payload as {
          messageId: string;
          conversationId: string;
          content: string;
          editedAt: string;
        };
        eventLogger.log('MESSAGE_EDITED', {
          messageId: p.messageId,
          conversationId: p.conversationId,
          payload: { content: p.content },
        });
        dispatch(
          applyRemoteEdit({
            conversationId: p.conversationId,
            messageId: p.messageId,
            content: p.content,
            editedAt: p.editedAt,
          })
        );
      }),

      // Reactions
      socketClient.on('reaction:added', (e) => {
        const p = e.payload as {
          conversationId: string;
          messageId: string;
          emoji: string;
          userId: string;
          username: string;
        };
        eventLogger.log('REACTION_ADDED', {
          messageId: p.messageId,
          conversationId: p.conversationId,
          userId: p.userId,
          payload: { emoji: p.emoji },
        });
        dispatch(applyRemoteReaction({ ...p, added: true }));
      }),
      socketClient.on('reaction:removed', (e) => {
        const p = e.payload as {
          conversationId: string;
          messageId: string;
          emoji: string;
          userId: string;
          username: string;
        };
        eventLogger.log('REACTION_REMOVED', {
          messageId: p.messageId,
          conversationId: p.conversationId,
          userId: p.userId,
          payload: { emoji: p.emoji },
        });
        dispatch(applyRemoteReaction({ ...p, added: false }));
      }),

      // Typing - BUG FIX #8: Use per-conversation typing state
      socketClient.on('typing:start', (e) => {
        const p = e.payload as { conversationId: string; userName: string };
        eventLogger.log('TYPING_START', {
          conversationId: p.conversationId,
          payload: { userName: p.userName },
        });
        dispatch(addTypingUser({ conversationId: p.conversationId, username: p.userName }));
      }),
      socketClient.on('typing:stop', (e) => {
        const p = e.payload as { conversationId: string; userName: string };
        eventLogger.log('TYPING_STOP', {
          conversationId: p.conversationId,
          payload: { userName: p.userName },
        });
        dispatch(removeTypingUser({ conversationId: p.conversationId, username: p.userName }));
      }),

      // New conversation pushed from server
      socketClient.on('conversation:new', (e) => {
        dispatch(upsertConversation(e.payload as Conversation));
      }),

      // BUG FIX #6: Call event listeners
      socketClient.on('call:incoming', (e) => {
        const p = e.payload as { fromUserId: string; callType: 'audio' | 'video'; offer: RTCSessionDescriptionInit };
        eventLogger.log('CALL_INCOMING', {
          userId: p.fromUserId,
          payload: { callType: p.callType },
        });
        console.log('Incoming call from:', p.fromUserId, p.callType);
        // TODO: Show incoming call UI, integrate with CallOverlay
        // For now, just log it - UI integration needed in CallOverlay component
      }),
      socketClient.on('call:accepted', (e) => {
        const p = e.payload as { userId: string };
        eventLogger.log('CALL_ACCEPTED', { userId: p.userId });
        console.log('Call accepted by:', p.userId);
        // TODO: Transition to connected state in CallOverlay
      }),
      socketClient.on('call:rejected', (e) => {
        const p = e.payload as { userId: string; reason?: string };
        eventLogger.log('CALL_REJECTED', { userId: p.userId, error: p.reason });
        console.log('Call rejected by:', p.userId, p.reason);
        // TODO: Show toast and cleanup in CallOverlay
      }),
      socketClient.on('call:ended', (e) => {
        const p = e.payload as { userId: string };
        eventLogger.log('CALL_ENDED', { userId: p.userId });
        console.log('Call ended by:', p.userId);
        // TODO: Cleanup call state in CallOverlay
      }),
      socketClient.on('call:busy', (e) => {
        const p = e.payload as { userId: string };
        eventLogger.log('CALL_INCOMING', { userId: p.userId, payload: { busy: true } });
        console.log('User is busy:', p.userId);
        // TODO: Show "user is busy" toast
      }),
    ];
    return () => subs.forEach((unsub) => unsub());
  }, [dispatch]);

  // Process offline queue when back online
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isProcessingQueue) {
      dispatch(processQueueAsync());
    }
  }, [isOnline, queue.length, isProcessingQueue, dispatch]);

  // Browser online/offline
  useEffect(() => {
    const on = () => dispatch(setOnline(true));
    const off = () => dispatch(setOnline(false));
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, [dispatch]);

  // Vanish timer cleanup
  const vanishTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  useEffect(() => {
    if (!activeConversationId) return;
    (messagesMap[activeConversationId] || []).forEach((msg) => {
      if (msg.isVanish && msg.vanishAt && !vanishTimers.current.has(msg.id)) {
        const left = new Date(msg.vanishAt).getTime() - Date.now();
        if (left > 0) {
          const timer = setTimeout(() => {
            dispatch(
              removeVanishedMessage({ conversationId: activeConversationId, messageId: msg.id })
            );
            vanishTimers.current.delete(msg.id);
          }, left);
          vanishTimers.current.set(msg.id, timer);
        } else {
          dispatch(
            removeVanishedMessage({ conversationId: activeConversationId, messageId: msg.id })
          );
        }
      }
    });
  }, [messagesMap, activeConversationId, dispatch]);
  useEffect(
    () => () => {
      vanishTimers.current.forEach(clearTimeout);
    },
    []
  );

  // Typing debounce
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setTyping = useCallback(
    (typing: boolean) => {
      if (!activeConversationId) return;
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      if (typing) {
        socketClient.typingStart(activeConversationId);
        typingTimeout.current = setTimeout(() => {
          socketClient.typingStop(activeConversationId);
        }, 5000);
      } else {
        socketClient.typingStop(activeConversationId);
        // Clear typing users for this conversation
        if (activeConversationId) {
          dispatch(setTypingUsers({ conversationId: activeConversationId, users: [] }));
        }
      }
    },
    [activeConversationId, dispatch]
  );

  // ── Action wrappers ───────────────────────────────────────────────────────

  const sendMessage = useCallback(
    (content: string, files?: File[], options?: { isVanish?: boolean; viewOnce?: boolean }) =>
      dispatch(sendMessageAsync({ content, files, options })).unwrap(),
    [dispatch]
  );
  const retryMessage = useCallback(
    (messageId: string) => dispatch(retryMessageAsync(messageId)).unwrap(),
    [dispatch]
  );
  const retryFileUpload = useCallback(
    (messageId: string, fileId: string) =>
      dispatch(retryFileUploadAsync({ messageId, fileId })).unwrap(),
    [dispatch]
  );
  const editMessageFn = useCallback(
    (messageId: string, newContent: string) =>
      dispatch(editMessageAction({ messageId, newContent })),
    [dispatch]
  );
  const deleteMessageFn = useCallback(
    (messageId: string) => dispatch(deleteMessageAction(messageId)),
    [dispatch]
  );
  const addReactionFn = useCallback(
    (messageId: string, emoji: string) => dispatch(addReactionAction({ messageId, emoji })),
    [dispatch]
  );
  const removeReactionFn = useCallback(
    (messageId: string, emoji: string) => dispatch(removeReactionAction({ messageId, emoji })),
    [dispatch]
  );
  const starMessageFn = useCallback(
    (messageId: string) => dispatch(starMessageAction(messageId)),
    [dispatch]
  );
  const unstarMessageFn = useCallback(
    (messageId: string) => dispatch(unstarMessageAction(messageId)),
    [dispatch]
  );
  const pinMessageFn = useCallback(
    (messageId: string) => dispatch(pinMessageAction(messageId)),
    [dispatch]
  );
  const unpinMessageFn = useCallback(
    (messageId: string) => dispatch(unpinMessageAction(messageId)),
    [dispatch]
  );
  const forwardMessageFn = useCallback(
    (messageId: string, toConvId: string) =>
      dispatch(forwardMessageAction({ messageId, toConversationId: toConvId })),
    [dispatch]
  );
  const markViewOnce = useCallback(
    (messageId: string, attachmentId: string) =>
      dispatch(markViewOnceAction({ messageId, attachmentId })),
    [dispatch]
  );
  const loadMoreMessages = useCallback(
    () => dispatch(loadMoreMessagesAsync()).unwrap(),
    [dispatch]
  );

  const setActiveConversation = useCallback(
    (conv: Conversation) => {
      dispatch(setActiveConvAction(conv.id));
      // Fetch messages for this conversation
      dispatch(fetchMessages({ conversationId: conv.id }));
    },
    [dispatch]
  );

  const startNewChat = useCallback((user: User) => dispatch(startNewChatAsync(user)), [dispatch]);
  const createGroupFn = useCallback(
    (name: string, members: User[]) => dispatch(createGroupAsync({ name, members })),
    [dispatch]
  );

  const setLanguageFn = useCallback(
    (lang: Language) => dispatch(setLanguageAction(lang)),
    [dispatch]
  );
  const setShowConversationList = useCallback(
    (show: boolean) => dispatch(setShowConvListAction(show)),
    [dispatch]
  );
  const setSearchQuery = useCallback((q: string) => dispatch(setSearchQueryAction(q)), [dispatch]);
  const setReplyingTo = useCallback(
    (r: ReplyTo | null) => dispatch(setReplyingToAction(r)),
    [dispatch]
  );
  const toggleOnline = useCallback(() => dispatch(setOnline(!isOnline)), [dispatch, isOnline]);
  const toggleVanishMode = useCallback(
    (conversationId: string, enabled: boolean, timer?: number) =>
      dispatch(toggleVanishModeAction({ conversationId, enabled, timer })),
    [dispatch]
  );
  const muteConversation = useCallback(
    (conversationId: string, muted: boolean) => dispatch(muteConvAction({ conversationId, muted })),
    [dispatch]
  );
  const archiveConversation = useCallback(
    (conversationId: string, archived: boolean) =>
      dispatch(archiveConvAction({ conversationId, archived })),
    [dispatch]
  );
  const pinConversation = useCallback(
    (conversationId: string, pinned: boolean) =>
      dispatch(pinConvAction({ conversationId, pinned })),
    [dispatch]
  );
  const deleteConversation = useCallback(
    (conversationId: string) => dispatch(deleteConvAction(conversationId)),
    [dispatch]
  );
  const addCallToHistory = useCallback(
    (call: Omit<CallRecord, 'id'>) => dispatch(addCallAction(call)),
    [dispatch]
  );
  const loadUsers = useCallback((q?: string) => dispatch(fetchUsers(q)), [dispatch]);
  const loadConversations = useCallback(() => dispatch(fetchConversations()), [dispatch]);

  return {
    messages,
    conversations,
    activeConversation,
    isOnline,
    queue,
    language,
    currentUser,
    isTyping,
    typingUsers,
    showConversationList,
    callHistory,
    allUsers,
    searchQuery,
    replyingTo,
    isProcessingQueue,
    pinnedMessages,
    starredMessages,
    isLoadingMore,
    hasMoreMessages,
    lastMessageId,
    sendMessage,
    retryMessage,
    retryFileUpload,
    editMessage: editMessageFn,
    deleteMessage: deleteMessageFn,
    addReaction: addReactionFn,
    removeReaction: removeReactionFn,
    starMessage: starMessageFn,
    unstarMessage: unstarMessageFn,
    pinMessage: pinMessageFn,
    unpinMessage: unpinMessageFn,
    forwardMessage: forwardMessageFn,
    markViewOnceAsViewed: markViewOnce,
    setActiveConversation,
    toggleOnline,
    setLanguage: setLanguageFn,
    translate,
    setTyping,
    setShowConversationList,
    addCallToHistory,
    startNewChat,
    setSearchQuery,
    createGroup: createGroupFn,
    toggleVanishMode,
    setReplyingTo,
    loadMoreMessages,
    muteConversation,
    archiveConversation,
    pinConversation,
    deleteConversation,
    loadUsers,
    loadConversations,
  };
}
