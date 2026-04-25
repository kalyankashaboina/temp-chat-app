import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type {
  Message,
  FileAttachment,
  Conversation,
  User,
  QueuedItem,
  Language,
  CallRecord,
  MessageReaction,
  ReplyTo,
} from '@/features/chat/types';
import {
  validateFile,
  getFileType,
  mockLoadOlderMessages,
  type PaginationCursor,
} from '@/features/chat/services/messageService';
import { chatApi } from '@/features/chat/services/chatApi';
import { socketClient } from '@/features/chat/services/socketClient';
import { eventLogger } from '@/shared/services/eventLogger';
import { t } from '@/shared/lib/i18n';

// ── State ─────────────────────────────────────────────────────────────────────

interface ChatState {
  messagesMap: Record<string, Message[]>;
  conversations: Conversation[];
  activeConversationId: string | null;
  isOnline: boolean;
  queue: QueuedItem[];
  language: Language;
  isTyping: boolean;
  typingUsers: Record<string, string[]>; // conversationId -> array of typing usernames
  showConversationList: boolean;
  callHistory: CallRecord[];
  allUsers: User[];
  searchQuery: string;
  replyingTo: ReplyTo | null;
  isProcessingQueue: boolean;
  isLoadingMore: boolean;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  hasMoreMessages: Record<string, boolean>;
  paginationCursors: Record<string, string | null>;
  currentUserId: string;
}

const initialState: ChatState = {
  messagesMap: {},
  conversations: [],
  activeConversationId: null,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  queue: [],
  language: 'en',
  isTyping: false,
  typingUsers: {}, // conversationId -> usernames
  showConversationList: true,
  callHistory: [],
  allUsers: [],
  searchQuery: '',
  replyingTo: null,
  isProcessingQueue: false,
  isLoadingMore: false,
  isLoadingConversations: false,
  isLoadingMessages: false,
  hasMoreMessages: {},
  paginationCursors: {},
  currentUserId: '',
};

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { getState }) => {
    const state = (getState() as { chat: ChatState }).chat;
    return chatApi.getConversations(undefined);
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ conversationId }: { conversationId: string }, { getState }) => {
    const state = (getState() as { chat: ChatState }).chat;
    const result = await chatApi.getMessages(conversationId, undefined, state.currentUserId);
    return { conversationId, ...result };
  }
);

export const fetchUsers = createAsyncThunk('chat/fetchUsers', async (q?: string) =>
  chatApi.getUsers(q)
);

export const sendMessageAsync = createAsyncThunk(
  'chat/sendMessageAsync',
  async (
    {
      content,
      files,
      options,
    }: {
      content: string;
      files?: File[];
      options?: { isVanish?: boolean; viewOnce?: boolean };
    },
    { getState, dispatch }
  ) => {
    const state = (getState() as { chat: ChatState }).chat;
    const convId = state.activeConversationId;
    if (!convId) return;
    if (!content.trim() && (!files || files.length === 0)) return;

    const conv = state.conversations.find((c) => c.id === convId);
    const isVanish = options?.isVanish || conv?.isVanishMode;
    const vanishTimer = conv?.vanishTimer || 60;

    const tempId = `temp-${Date.now()}`;
    const attachments: FileAttachment[] = (files || []).map((file, i) => {
      const validation = validateFile(file);
      return {
        id: `file-${tempId}-${i}`,
        name: file.name,
        size: file.size,
        type: getFileType(file.type),
        mimeType: file.type,
        url: URL.createObjectURL(file),
        uploadProgress: 0,
        uploadStatus: (validation.valid ? 'pending' : 'failed') as Message['status'],
        isViewOnce: options?.viewOnce,
        isViewed: false,
      };
    });

    const optimistic: Message = {
      id: tempId,
      content,
      senderId: state.currentUserId,
      timestamp: new Date().toISOString(),
      status: 'pending',
      attachments,
      isOwn: true,
      reactions: [],
      isVanish,
      vanishTimer: isVanish ? vanishTimer : undefined,
      vanishAt: isVanish ? new Date(Date.now() + vanishTimer * 1000).toISOString() : undefined,
      replyTo: state.replyingTo || undefined,
    };

    eventLogger.log('MESSAGE_SEND', {
      tempId,
      conversationId: convId,
      payload: { content, hasAttachments: attachments.length > 0, isVanish },
    });

    dispatch(addOwnMessage({ conversationId: convId, message: optimistic }));
    dispatch(setReplyingTo(null));

    if (!state.isOnline) {
      eventLogger.log('OFFLINE_QUEUE_PROCESS', {
        tempId,
        conversationId: convId,
        payload: { reason: 'offline' },
      });
      dispatch(
        enqueueItem({
          id: `q-${tempId}`,
          type: 'message',
          data: optimistic,
          messageId: convId,
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date().toISOString(),
          status: 'pending',
        })
      );
      return;
    }

    // Emit via socket — server will broadcast message:new back
    socketClient.sendMessage({
      conversationId: convId,
      content,
      tempId,
      replyTo: state.replyingTo,
    });

    // BUG FIX #11: Timeout for pending messages
    setTimeout(() => {
      const currentState = (getState() as { chat: ChatState }).chat;
      const msgs = currentState.messagesMap[convId] || [];
      const msg = msgs.find((m) => m.id === tempId);
      // If message still pending after 10 seconds, mark as failed
      if (msg && msg.status === 'pending') {
        eventLogger.log('MESSAGE_FAILED', {
          tempId,
          conversationId: convId,
          error: 'Message timeout - no confirmation after 10s',
        });
        dispatch(
          updateMessageStatus({
            conversationId: convId,
            messageId: tempId,
            status: 'failed',
          })
        );
      }
    }, 10000); // 10 second timeout

    // Upload files if any (update progress per file)
    for (const att of attachments.filter((a) => a.uploadStatus === 'pending')) {
      const rawFile = (files || []).find((f) => f.name === att.name);
      if (!rawFile) continue;
      try {
        eventLogger.log('FILE_UPLOAD_START', {
          messageId: tempId,
          conversationId: convId,
          payload: { fileName: att.name, fileSize: att.size },
        });
        dispatch(
          updateAttachmentProgress({
            conversationId: convId,
            messageId: tempId,
            fileId: att.id,
            progress: 0,
          })
        );
        const uploaded = await chatApi.uploadFile(rawFile, (pct) => {
          eventLogger.log('FILE_UPLOAD_PROGRESS', {
            messageId: tempId,
            conversationId: convId,
            payload: { fileName: att.name, progress: pct },
          });
          dispatch(
            updateAttachmentProgress({
              conversationId: convId,
              messageId: tempId,
              fileId: att.id,
              progress: pct,
            })
          );
        });
        eventLogger.log('FILE_UPLOAD_COMPLETE', {
          messageId: tempId,
          conversationId: convId,
          payload: { fileName: att.name, url: uploaded },
        });
        dispatch(
          updateAttachmentStatus({
            conversationId: convId,
            messageId: tempId,
            fileId: att.id,
            status: 'sent',
            progress: 100,
          })
        );
        // TODO: include uploaded URL in message via socket
      } catch (error) {
        eventLogger.log('FILE_UPLOAD_FAILED', {
          messageId: tempId,
          conversationId: convId,
          error: String(error),
          payload: { fileName: att.name },
        });
        dispatch(
          updateAttachmentStatus({
            conversationId: convId,
            messageId: tempId,
            fileId: att.id,
            status: 'failed',
            progress: 0,
          })
        );
      }
    }
  }
);

export const loadMoreMessagesAsync = createAsyncThunk(
  'chat/loadMoreMessagesAsync',
  async (_, { getState }) => {
    const state = (getState() as { chat: ChatState }).chat;
    const convId = state.activeConversationId;
    if (!convId || state.isLoadingMore) return;
    if (state.hasMoreMessages[convId] === false) return;

    const cursor = state.paginationCursors[convId];
    const params: PaginationCursor = { before: cursor || undefined, limit: 40 };
    const result = await mockLoadOlderMessages(convId, params, state.currentUserId);
    return { convId, ...result };
  }
);

export const startNewChatAsync = createAsyncThunk('chat/startNewChatAsync', async (user: User) => {
  const conv = await chatApi.createDirect(user.id);
  return { conv, user };
});

export const createGroupAsync = createAsyncThunk(
  'chat/createGroupAsync',
  async ({ name, members }: { name: string; members: User[] }) => {
    return chatApi.createGroup(
      name,
      members.map((m) => m.id)
    );
  }
);

export const retryMessageAsync = createAsyncThunk(
  'chat/retryMessageAsync',
  async (messageId: string, { getState, dispatch }) => {
    const state = (getState() as { chat: ChatState }).chat;

    // BUG FIX #12: Search all conversations, not just active one
    let foundConvId = state.activeConversationId;
    let msg = state.activeConversationId
      ? (state.messagesMap[state.activeConversationId] || []).find((m) => m.id === messageId)
      : undefined;

    if (!msg) {
      // Search all conversations
      for (const [cid, msgs] of Object.entries(state.messagesMap)) {
        const found = msgs.find((m) => m.id === messageId);
        if (found) {
          msg = found;
          foundConvId = cid;
          break;
        }
      }
    }

    if (!msg || !foundConvId || !state.isOnline) {
      eventLogger.log('OFFLINE_QUEUE_RETRY', {
        messageId,
        conversationId: foundConvId,
        error: !state.isOnline ? 'offline' : 'message_not_found',
      });
      return;
    }

    eventLogger.log('OFFLINE_QUEUE_RETRY', {
      messageId,
      conversationId: foundConvId,
      payload: { content: msg.content },
    });

    dispatch(resetMessageForRetry({ conversationId: foundConvId, messageId }));
    socketClient.sendMessage({
      conversationId: foundConvId,
      content: msg.content,
      tempId: messageId,
    });
  }
);

export const retryFileUploadAsync = createAsyncThunk(
  'chat/retryFileUploadAsync',
  async (_: { messageId: string; fileId: string }) => {
    /* handled by component */
  }
);

export const processQueueAsync = createAsyncThunk(
  'chat/processQueueAsync',
  async (_, { getState, dispatch }) => {
    const state = (getState() as { chat: ChatState }).chat;
    if (state.isProcessingQueue || state.queue.length === 0 || !state.isOnline) return;
    dispatch(setProcessingQueue(true));
    for (const item of [...state.queue]) {
      const msg = item.data as Message;
      const convId = item.messageId || '';
      socketClient.sendMessage({ conversationId: convId, content: msg.content, tempId: msg.id });
      dispatch(dequeueItem(item.id));
    }
    dispatch(setProcessingQueue(false));
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentUserId: (s, a: PayloadAction<string>) => {
      s.currentUserId = a.payload;
    },
    setOnline: (s, a: PayloadAction<boolean>) => {
      s.isOnline = a.payload;
    },
    toggleOnline: (s) => {
      s.isOnline = !s.isOnline;
    },
    setTyping: (s, a: PayloadAction<boolean>) => {
      s.isTyping = a.payload;
    },
    setTypingUsers: (s, a: PayloadAction<{ conversationId: string; users: string[] }>) => {
      s.typingUsers[a.payload.conversationId] = a.payload.users;
    },
    addTypingUser: (s, a: PayloadAction<{ conversationId: string; username: string }>) => {
      const { conversationId, username } = a.payload;
      if (!s.typingUsers[conversationId]) {
        s.typingUsers[conversationId] = [];
      }
      if (!s.typingUsers[conversationId].includes(username)) {
        s.typingUsers[conversationId].push(username);
      }
      // Set isTyping if this is the active conversation
      if (s.activeConversationId === conversationId) {
        s.isTyping = true;
      }
    },
    removeTypingUser: (s, a: PayloadAction<{ conversationId: string; username: string }>) => {
      const { conversationId, username } = a.payload;
      if (s.typingUsers[conversationId]) {
        s.typingUsers[conversationId] = s.typingUsers[conversationId].filter((n) => n !== username);
        // Clear isTyping if active conversation has no typing users
        if (
          s.activeConversationId === conversationId &&
          s.typingUsers[conversationId].length === 0
        ) {
          s.isTyping = false;
        }
      }
    },
    setShowConversationList: (s, a: PayloadAction<boolean>) => {
      s.showConversationList = a.payload;
    },
    setSearchQuery: (s, a: PayloadAction<string>) => {
      s.searchQuery = a.payload;
    },
    setReplyingTo: (s, a: PayloadAction<ReplyTo | null>) => {
      s.replyingTo = a.payload;
    },
    setLanguage: (s, a: PayloadAction<Language>) => {
      s.language = a.payload;
    },

    setActiveConversation: (s, a: PayloadAction<string>) => {
      s.activeConversationId = a.payload;
      s.showConversationList = false;
      s.replyingTo = null;
      s.isTyping = false;
      // Don't clear all typing users - they're stored per conversation now
      const conv = s.conversations.find((c) => c.id === a.payload);
      if (conv) conv.unreadCount = 0;
      if (s.hasMoreMessages[a.payload] === undefined) s.hasMoreMessages[a.payload] = true;
      // Mark read on server
      socketClient.markRead(a.payload);
    },

    addOwnMessage: (s, a: PayloadAction<{ conversationId: string; message: Message }>) => {
      console.log('[REDUCER] addOwnMessage', {
        conv: a.payload.conversationId,
        id: a.payload.message.id,
        status: a.payload.message.status,
      });
      const { conversationId, message } = a.payload;
      if (!s.messagesMap[conversationId]) s.messagesMap[conversationId] = [];
      s.messagesMap[conversationId].push(message);
      const conv = s.conversations.find((c) => c.id === conversationId);
      if (conv) conv.lastMessage = message;
    },

    addIncomingMessage: (s, a: PayloadAction<{ conversationId: string; message: Message }>) => {
      console.log('[REDUCER] addIncomingMessage', {
        conv: a.payload.conversationId,
        id: a.payload.message.id,
      });
      const { conversationId, message } = a.payload;
      if (!s.messagesMap[conversationId]) s.messagesMap[conversationId] = [];
      // Avoid duplicates (tempId → real id swap handled below)
      if (s.messagesMap[conversationId].some((m) => m.id === message.id)) return;
      s.messagesMap[conversationId].push(message);

      // BUG FIX #10: Always update lastMessage, only skip unreadCount when active
      const conv = s.conversations.find((c) => c.id === conversationId);
      if (conv) {
        conv.lastMessage = message; // Always update preview
        if (s.activeConversationId !== conversationId) {
          conv.unreadCount += 1; // Only increment if not viewing
        }
      }
    },

    // When server confirms a message sent (tempId → real id)
    confirmMessage: (
      s,
      a: PayloadAction<{
        conversationId: string;
        tempId: string;
        realId: string;
        createdAt: string;
      }>
    ) => {
      const { conversationId, tempId, realId, createdAt } = a.payload;
      const msgs = s.messagesMap[conversationId];
      if (!msgs) return;

      const tempIndex = msgs.findIndex((m) => m.id === tempId);
      const realIndex = msgs.findIndex((m) => m.id === realId);

      // ✅ CASE 1: temp exists → replace
      if (tempIndex !== -1) {
        const msg = msgs[tempIndex];

        msg.id = realId;

        if (msg.status === 'pending') {
          msg.status = 'sent';
        }

        msg.timestamp = createdAt; // or new Date(createdAt)
        console.log('[REDUCER] confirm START', {
          conv: conversationId,
          tempId,
          realId,
        });
        // remove duplicate real message if exists
        if (realIndex !== -1 && realIndex !== tempIndex) {
          msgs.splice(realIndex, 1);
        }

        // ✅ update conversation preview
        const conv = s.conversations.find((c) => c.id === conversationId);
        if (conv) conv.lastMessage = msg;

        return;
      }

      // ✅ CASE 2: temp missing but real exists
      if (realIndex !== -1) {
        const msg = msgs[realIndex];

        if (msg.status === 'pending') {
          msg.status = 'sent';
        }
        msg.timestamp = createdAt;
        return;
      }

      // ❌ DO NOT inject fake message
      console.warn('confirmMessage fallback hit', a.payload);
    },
    updateMessageStatus: (
      s,
      a: PayloadAction<{ conversationId: string; messageId: string; status: Message['status'] }>
    ) => {
      console.log('[REDUCER] updateMessageStatus', {
        conv: a.payload.conversationId,
        id: a.payload.messageId,
        status: a.payload.status,
      });
      const msgs = s.messagesMap[a.payload.conversationId];
      if (msgs) {
        const m = msgs.find((m) => m.id === a.payload.messageId);
        if (m) m.status = a.payload.status;
      }
    },
    resetMessageForRetry: (s, a: PayloadAction<{ conversationId: string; messageId: string }>) => {
      const msgs = s.messagesMap[a.payload.conversationId];
      if (msgs) {
        const m = msgs.find((m) => m.id === a.payload.messageId);
        if (m) {
          m.status = 'pending';
          m.attachments = m.attachments.map((at) =>
            at.uploadStatus === 'failed'
              ? { ...at, uploadStatus: 'pending' as const, uploadProgress: 0 }
              : at
          );
        }
      }
    },

    editMessage: (s, a: PayloadAction<{ messageId: string; newContent: string }>) => {
      const convId = s.activeConversationId;
      if (!convId) return;
      const m = (s.messagesMap[convId] || []).find((m) => m.id === a.payload.messageId);
      if (m) {
        m.content = a.payload.newContent;
        m.isEdited = true;
        m.editedAt = new Date().toISOString();
      }
      socketClient.editMessage(a.payload.messageId, a.payload.newContent);
    },

    deleteMessage: (s, a: PayloadAction<string>) => {
      const convId = s.activeConversationId;
      if (!convId) return;
      const m = (s.messagesMap[convId] || []).find((m) => m.id === a.payload);
      if (m) {
        m.isDeleted = true;
        m.content = '';
      }
      socketClient.deleteMessage(a.payload);
    },

    applyRemoteDelete: (s, a: PayloadAction<{ conversationId: string; messageId: string }>) => {
      const msgs = s.messagesMap[a.payload.conversationId];
      if (msgs) {
        const m = msgs.find((m) => m.id === a.payload.messageId);
        if (m) {
          m.isDeleted = true;
          m.content = '';
        }
      }
    },

    applyRemoteEdit: (
      s,
      a: PayloadAction<{
        conversationId: string;
        messageId: string;
        content: string;
        editedAt: string;
      }>
    ) => {
      const msgs = s.messagesMap[a.payload.conversationId];
      if (msgs) {
        const m = msgs.find((m) => m.id === a.payload.messageId);
        if (m) {
          m.content = a.payload.content;
          m.isEdited = true;
          m.editedAt = a.payload.editedAt;
        }
      }
    },

    addReaction: (s, a: PayloadAction<{ messageId: string; emoji: string }>) => {
      const convId = s.activeConversationId;
      if (!convId) return;
      const m = (s.messagesMap[convId] || []).find((m) => m.id === a.payload.messageId);
      if (m) {
        if (!m.reactions) m.reactions = [];
        m.reactions.push({
          emoji: a.payload.emoji,
          userId: s.currentUserId,
          userName: 'You',
          timestamp: new Date().toISOString(),
        });
      }
      socketClient.react(a.payload.messageId, a.payload.emoji, convId);
    },
    removeReaction: (s, a: PayloadAction<{ messageId: string; emoji: string }>) => {
      const convId = s.activeConversationId;
      if (!convId) return;
      const m = (s.messagesMap[convId] || []).find((m) => m.id === a.payload.messageId);
      if (m?.reactions)
        m.reactions = m.reactions.filter(
          (r) => !(r.emoji === a.payload.emoji && r.userId === s.currentUserId)
        );
      socketClient.unreact(a.payload.messageId, a.payload.emoji, convId);
    },
    applyRemoteReaction: (
      s,
      a: PayloadAction<{
        conversationId: string;
        messageId: string;
        emoji: string;
        userId: string;
        username: string;
        added: boolean;
      }>
    ) => {
      const msgs = s.messagesMap[a.payload.conversationId];
      if (!msgs) return;
      const m = msgs.find((m) => m.id === a.payload.messageId);
      if (!m) return;
      if (!m.reactions) m.reactions = [];
      if (a.payload.added) {
        if (!m.reactions.some((r) => r.emoji === a.payload.emoji && r.userId === a.payload.userId))
          m.reactions.push({
            emoji: a.payload.emoji,
            userId: a.payload.userId,
            userName: a.payload.username,
            timestamp: new Date().toISOString(),
          });
      } else {
        m.reactions = m.reactions.filter(
          (r) => !(r.emoji === a.payload.emoji && r.userId === a.payload.userId)
        );
      }
    },

    starMessage: (s, a: PayloadAction<string>) => {
      const convId = s.activeConversationId;
      if (!convId) return;
      const m = (s.messagesMap[convId] || []).find((m) => m.id === a.payload);
      if (m) m.isStarred = true;
      chatApi.starMessage(a.payload).catch(() => {
        if (m) m.isStarred = false;
      });
    },
    unstarMessage: (s, a: PayloadAction<string>) => {
      const convId = s.activeConversationId;
      if (!convId) return;
      const m = (s.messagesMap[convId] || []).find((m) => m.id === a.payload);
      if (m) m.isStarred = false;
      chatApi.unstarMessage(a.payload).catch(() => {
        if (m) m.isStarred = true;
      });
    },
    pinMessage: (s, a: PayloadAction<string>) => {
      const convId = s.activeConversationId;
      if (!convId) return;
      const m = (s.messagesMap[convId] || []).find((m) => m.id === a.payload);
      if (m) m.isPinned = true;
      chatApi.pinMessage(a.payload).catch(() => {
        if (m) m.isPinned = false;
      });
    },
    unpinMessage: (s, a: PayloadAction<string>) => {
      const convId = s.activeConversationId;
      if (!convId) return;
      const m = (s.messagesMap[convId] || []).find((m) => m.id === a.payload);
      if (m) m.isPinned = false;
      chatApi.unpinMessage(a.payload).catch(() => {
        if (m) m.isPinned = true;
      });
    },
    forwardMessage: (s, a: PayloadAction<{ messageId: string; toConversationId: string }>) => {
      chatApi.forwardMessage(a.payload.messageId, a.payload.toConversationId);
    },
    markViewOnceAsViewed: (s, a: PayloadAction<{ messageId: string; attachmentId: string }>) => {
      const convId = s.activeConversationId;
      if (!convId) return;
      const m = (s.messagesMap[convId] || []).find((m) => m.id === a.payload.messageId);
      if (m) {
        const att = m.attachments.find((a2) => a2.id === a.payload.attachmentId);
        if (att) att.isViewed = true;
      }
    },

    updateAttachmentProgress: (
      s,
      a: PayloadAction<{
        conversationId: string;
        messageId: string;
        fileId: string;
        progress: number;
      }>
    ) => {
      const { conversationId, messageId, fileId, progress } = a.payload;
      const m = (s.messagesMap[conversationId] || []).find((m) => m.id === messageId);
      if (m) {
        const att = m.attachments.find((a2) => a2.id === fileId);
        if (att) att.uploadProgress = progress;
      }
    },
    updateAttachmentStatus: (
      s,
      a: PayloadAction<{
        conversationId: string;
        messageId: string;
        fileId: string;
        status: Message['status'];
        progress: number;
      }>
    ) => {
      const { conversationId, messageId, fileId, status, progress } = a.payload;
      const m = (s.messagesMap[conversationId] || []).find((m) => m.id === messageId);
      if (m) {
        const att = m.attachments.find((a2) => a2.id === fileId);
        if (att) {
          att.uploadStatus = status;
          att.uploadProgress = progress;
        }
      }
    },

    startNewChat: (s, a: PayloadAction<User>) => {
      const existing = s.conversations.find((c) => !c.isGroup && c.user?.id === a.payload.id);
      if (existing) {
        s.activeConversationId = existing.id;
        s.showConversationList = false;
        return;
      }
      // Optimistic local — async version creates real conv
      const newConv: Conversation = {
        id: `temp-${a.payload.id}`,
        user: a.payload,
        isGroup: false,
        unreadCount: 0,
        typingUsers: [],
      };
      s.conversations.unshift(newConv);
      s.messagesMap[newConv.id] = [];
      s.activeConversationId = newConv.id;
      s.showConversationList = false;
    },
    upsertConversation: (s, a: PayloadAction<Conversation>) => {
      const idx = s.conversations.findIndex((c) => c.id === a.payload.id);
      if (idx >= 0) s.conversations[idx] = a.payload;
      else s.conversations.unshift(a.payload);
      if (!s.messagesMap[a.payload.id]) s.messagesMap[a.payload.id] = [];
    },
    createGroup: (s, a: PayloadAction<{ name: string; members: User[] }>) => {
      // handled by createGroupAsync thunk — optimistic placeholder
      const newGroup: Conversation = {
        id: `grp-${Date.now()}`,
        users: a.payload.members,
        isGroup: true,
        groupName: a.payload.name,
        unreadCount: 0,
        typingUsers: [],
      };
      s.conversations.unshift(newGroup);
      s.messagesMap[newGroup.id] = [];
      s.activeConversationId = newGroup.id;
      s.showConversationList = false;
    },

    toggleVanishMode: (
      s,
      a: PayloadAction<{ conversationId: string; enabled: boolean; timer?: number }>
    ) => {
      const conv = s.conversations.find((c) => c.id === a.payload.conversationId);
      if (conv) {
        conv.isVanishMode = a.payload.enabled;
        conv.vanishTimer = a.payload.timer ?? 60;
      }
    },
    muteConversation: (s, a: PayloadAction<{ conversationId: string; muted: boolean }>) => {
      const conv = s.conversations.find((c) => c.id === a.payload.conversationId);
      if (conv) conv.isMuted = a.payload.muted;
    },
    archiveConversation: (s, a: PayloadAction<{ conversationId: string; archived: boolean }>) => {
      const conv = s.conversations.find((c) => c.id === a.payload.conversationId);
      if (conv) conv.isArchived = a.payload.archived;
    },
    pinConversation: (s, a: PayloadAction<{ conversationId: string; pinned: boolean }>) => {
      const conv = s.conversations.find((c) => c.id === a.payload.conversationId);
      if (conv) conv.isPinned = a.payload.pinned;
      s.conversations.sort((a2, b) => (b.isPinned ? 1 : 0) - (a2.isPinned ? 1 : 0));
    },
    deleteConversation: (s, a: PayloadAction<string>) => {
      s.conversations = s.conversations.filter((c) => c.id !== a.payload);
      delete s.messagesMap[a.payload];
      if (s.activeConversationId === a.payload) {
        s.activeConversationId = null;
        s.showConversationList = true;
      }
    },
    updateUserPresence: (s, a: PayloadAction<{ userId: string; isOnline: boolean }>) => {
      s.conversations.forEach((c) => {
        if (!c.isGroup && c.user?.id === a.payload.userId) c.user.isOnline = a.payload.isOnline;
        c.users?.forEach((u) => {
          if (u.id === a.payload.userId) u.isOnline = a.payload.isOnline;
        });
      });
    },
    setOnlineUsers: (s, a: PayloadAction<string[]>) => {
      const set = new Set(a.payload);
      s.conversations.forEach((c) => {
        if (c.user) c.user.isOnline = set.has(c.user.id);
        c.users?.forEach((u) => {
          u.isOnline = set.has(u.id);
        });
      });
    },

    addCallToHistory: (s, a: PayloadAction<Omit<CallRecord, 'id'>>) => {
      s.callHistory.unshift({ ...a.payload, id: `call-${Date.now()}` } as CallRecord);
    },

    enqueueItem: (s, a: PayloadAction<QueuedItem>) => {
      s.queue.push(a.payload);
    },
    dequeueItem: (s, a: PayloadAction<string>) => {
      s.queue = s.queue.filter((q) => q.id !== a.payload);
    },
    setProcessingQueue: (s, a: PayloadAction<boolean>) => {
      s.isProcessingQueue = a.payload;
    },

    removeVanishedMessage: (s, a: PayloadAction<{ conversationId: string; messageId: string }>) => {
      const msgs = s.messagesMap[a.payload.conversationId];
      if (msgs)
        s.messagesMap[a.payload.conversationId] = msgs.filter((m) => m.id !== a.payload.messageId);
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (s) => {
        s.isLoadingConversations = true;
      })
      .addCase(fetchConversations.fulfilled, (s, a) => {
        s.isLoadingConversations = false;
        s.conversations = a.payload.conversations;
      })
      .addCase(fetchConversations.rejected, (s) => {
        s.isLoadingConversations = false;
      })

      .addCase(fetchMessages.pending, (s) => {
        s.isLoadingMessages = true;
      })
      .addCase(fetchMessages.fulfilled, (s, a) => {
        s.isLoadingMessages = false;
        if (!a.payload) return;
        const { conversationId, messages, hasMore, nextCursor } = a.payload;

        // BUG FIX #5: Merge with existing socket-delivered messages
        const existing = s.messagesMap[conversationId] || [];
        const httpIds = new Set(messages.map((m) => m.id));
        // Keep messages that exist in store but not in HTTP result (socket-delivered)
        const socketOnly = existing.filter((m) => !httpIds.has(m.id));
        // Merge and sort by timestamp
        s.messagesMap[conversationId] = [...messages, ...socketOnly].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        s.hasMoreMessages[conversationId] = hasMore;
        s.paginationCursors[conversationId] = nextCursor;
      })
      .addCase(fetchMessages.rejected, (s) => {
        s.isLoadingMessages = false;
      })

      .addCase(fetchUsers.fulfilled, (s, a) => {
        s.allUsers = a.payload;
      })

      .addCase(loadMoreMessagesAsync.pending, (s) => {
        s.isLoadingMore = true;
      })
      .addCase(loadMoreMessagesAsync.fulfilled, (s, a) => {
        s.isLoadingMore = false;
        if (!a.payload) return;
        const { convId, messages, hasMore, nextCursor } = a.payload;
        s.messagesMap[convId] = [...messages, ...(s.messagesMap[convId] || [])];
        s.hasMoreMessages[convId] = hasMore;
        s.paginationCursors[convId] = nextCursor;
      })
      .addCase(loadMoreMessagesAsync.rejected, (s) => {
        s.isLoadingMore = false;
      })

      .addCase(startNewChatAsync.fulfilled, (s, a) => {
        if (!a.payload) return;
        const { conv } = a.payload;
        const idx = s.conversations.findIndex(
          (c) => c.id === conv.id || c.id === `temp-${conv.user?.id}`
        );
        if (idx >= 0) s.conversations[idx] = conv;
        else s.conversations.unshift(conv);
        if (!s.messagesMap[conv.id]) s.messagesMap[conv.id] = [];
        s.activeConversationId = conv.id;
        s.showConversationList = false;
      })

      .addCase(createGroupAsync.fulfilled, (s, a) => {
        if (!a.payload) return;
        const conv = a.payload;
        s.conversations.unshift(conv);
        s.messagesMap[conv.id] = [];
        s.activeConversationId = conv.id;
        s.showConversationList = false;
      });
  },
});

export const {
  setCurrentUserId,
  setOnline,
  toggleOnline,
  setTyping,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  setShowConversationList,
  setSearchQuery,
  setReplyingTo,
  setLanguage,
  setActiveConversation,
  addOwnMessage,
  addIncomingMessage,
  confirmMessage,
  updateMessageStatus,
  resetMessageForRetry,
  editMessage,
  deleteMessage,
  applyRemoteDelete,
  applyRemoteEdit,
  addReaction,
  removeReaction,
  applyRemoteReaction,
  starMessage,
  unstarMessage,
  pinMessage,
  unpinMessage,
  forwardMessage,
  markViewOnceAsViewed,
  updateAttachmentProgress,
  updateAttachmentStatus,
  startNewChat,
  upsertConversation,
  createGroup,
  toggleVanishMode,
  muteConversation,
  archiveConversation,
  pinConversation,
  deleteConversation,
  updateUserPresence,
  setOnlineUsers,
  addCallToHistory,
  enqueueItem,
  dequeueItem,
  setProcessingQueue,
  removeVanishedMessage,
} = chatSlice.actions;

export default chatSlice.reducer;

// currentUser compat export (used by some components)
export const currentUser = { id: '', name: 'You', email: '', avatar: '', isOnline: true };
