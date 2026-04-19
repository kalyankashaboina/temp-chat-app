/**
 * RTK Query API Slice - Central API management for Relay Chat
 *
 * Features:
 * - Automatic caching and cache invalidation
 * - Optimistic updates for instant UI feedback
 * - Built-in loading/error states
 * - Request deduplication
 * - Automatic re-fetching on focus/reconnect
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Message,
  Conversation,
  User,
  MessageStatus,
  FileAttachment,
  ReplyTo,
} from '@/features/chat/types';

// ========================================================================
// API BASE CONFIGURATION
// ========================================================================

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  credentials: 'include', // Send cookies (relay_token) with requests
  prepareHeaders: (headers) => {
    // Add any custom headers if needed
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

// ========================================================================
// TYPE DEFINITIONS (Backend API Response Shapes)
// ========================================================================

interface ApiMessage {
  _id: string;
  content: string;
  senderId: { _id: string; username: string; avatar: string } | string;
  createdAt: string;
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  reactions?: Array<{ userId: string; emoji: string; username: string }>;
  attachments?: Array<{
    url: string;
    name: string;
    type: string;
    mimeType: string;
    size: number;
  }>;
  replyTo?: { messageId: string; content: string; senderName: string };
  isPinned?: boolean;
  starredBy?: string[];
  forwardedFrom?: string;
  isScheduled?: boolean;
  scheduledAt?: string;
}

interface ApiConversation {
  id: string;
  type: string;
  isGroup: boolean;
  groupName?: string;
  user?: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    isOnline: boolean;
  };
  users?: Array<{
    id: string;
    name: string;
    username: string;
    avatar: string;
    isOnline: boolean;
  }>;
  lastMessage?: ApiMessage;
  unreadCount: number;
  updatedAt: string;
}

interface ApiUser {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar: string;
  isOnline: boolean;
}

interface PaginatedResponse<T> {
  data?: T[];
  messages?: T[];
  conversations?: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ========================================================================
// MAPPER FUNCTIONS (Backend API → Frontend Types)
// ========================================================================

function mapMessage(m: ApiMessage, currentUserId: string): Message {
  const senderId = typeof m.senderId === 'object' ? m.senderId._id : m.senderId;
  return {
    id: m._id,
    content: m.content,
    senderId,
    timestamp: new Date(m.createdAt),
    status: 'read' as MessageStatus,
    attachments: (m.attachments ?? []).map(
      (a): FileAttachment => ({
        id: a.url,
        name: a.name,
        size: a.size,
        type: a.type as FileAttachment['type'],
        mimeType: a.mimeType,
        url: a.url,
        uploadProgress: 100,
        uploadStatus: 'sent',
      })
    ),
    isOwn: senderId === currentUserId,
    isEdited: m.isEdited,
    editedAt: m.editedAt ? new Date(m.editedAt) : undefined,
    isDeleted: m.isDeleted,
    reactions: (m.reactions ?? []).map((r) => ({
      emoji: r.emoji,
      userId: r.userId,
      userName: r.username,
    })),
    replyTo: m.replyTo
      ? {
          messageId: m.replyTo.messageId,
          content: m.replyTo.content,
          senderName: m.replyTo.senderName,
        }
      : undefined,
    isPinned: m.isPinned,
    isStarred: m.starredBy?.includes(currentUserId),
    forwardedFrom: m.forwardedFrom,
  };
}

function mapConversation(c: ApiConversation): Conversation {
  return {
    id: c.id,
    isGroup: c.isGroup,
    groupName: c.groupName,
    user: c.user
      ? {
          id: c.user.id,
          name: c.user.name,
          email: '',
          avatar: c.user.avatar,
          isOnline: c.user.isOnline,
        }
      : undefined,
    users: c.users?.map((u) => ({
      id: u.id,
      name: u.name,
      email: '',
      avatar: u.avatar,
      isOnline: u.isOnline,
    })),
    lastMessage: undefined, // Mapped separately if needed
    unreadCount: c.unreadCount,
    typingUsers: [],
  };
}

function mapUser(u: ApiUser): User {
  return {
    id: u.id,
    name: u.name || u.username,
    email: u.email,
    avatar: u.avatar,
    isOnline: u.isOnline,
  };
}

// ========================================================================
// RTK QUERY API SLICE
// ========================================================================

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'Auth',
    'User',
    'Conversation',
    'Message',
    'PinnedMessage',
    'StarredMessage',
    'ScheduledMessage',
  ],
  endpoints: (builder) => ({
    // ====================================================================
    // AUTH ENDPOINTS
    // ====================================================================

    login: builder.mutation<{ data: User }, { email: string; password: string }>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),

    register: builder.mutation<
      { data: User },
      { username: string; email: string; password: string }
    >({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['Auth'],
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth', 'User', 'Conversation', 'Message'],
    }),

    getCurrentUser: builder.query<{ data: User }, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),

    updateProfile: builder.mutation<
      { data: User },
      Partial<{ username: string; avatar: string; bio: string }>
    >({
      query: (updates) => ({
        url: '/auth/me',
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['Auth', 'User'],
    }),

    forgotPassword: builder.mutation<void, { email: string }>({
      query: (data) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),

    resetPassword: builder.mutation<void, { token: string; password: string }>({
      query: (data) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: data,
      }),
    }),

    // ====================================================================
    // USER ENDPOINTS
    // ====================================================================

    getUsers: builder.query<User[], string | void>({
      query: (searchQuery) => ({
        url: '/users',
        params: searchQuery ? { q: searchQuery } : undefined,
      }),
      transformResponse: (response: { data: ApiUser[] }) => response.data.map(mapUser),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),

    // ====================================================================
    // CONVERSATION ENDPOINTS
    // ====================================================================

    getConversations: builder.query<
      { conversations: Conversation[]; nextCursor: string | null; hasMore: boolean },
      { cursor?: string } | void
    >({
      query: (params) => ({
        url: '/conversations',
        params: params && params.cursor ? { cursor: params.cursor } : undefined,
      }),
      transformResponse: (
        response: PaginatedResponse<ApiConversation>
      ): { conversations: Conversation[]; nextCursor: string | null; hasMore: boolean } => ({
        conversations: (response.conversations ?? []).map(mapConversation),
        nextCursor: response.nextCursor,
        hasMore: response.hasMore,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.conversations.map(({ id }) => ({
                type: 'Conversation' as const,
                id,
              })),
              { type: 'Conversation', id: 'LIST' },
            ]
          : [{ type: 'Conversation', id: 'LIST' }],
    }),

    searchConversations: builder.query<Conversation[], string>({
      query: (searchQuery) => ({
        url: '/conversations/search',
        params: { query: searchQuery },
      }),
      transformResponse: (response: { conversations: ApiConversation[] }) =>
        response.conversations.map(mapConversation),
      providesTags: [{ type: 'Conversation', id: 'SEARCH' }],
    }),

    createDirectConversation: builder.mutation<Conversation, { targetUserId: string }>({
      query: (data) => ({
        url: '/conversations/direct',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: { data: ApiConversation }) => mapConversation(response.data),
      invalidatesTags: [{ type: 'Conversation', id: 'LIST' }],
    }),

    createGroupConversation: builder.mutation<Conversation, { name: string; memberIds: string[] }>({
      query: (data) => ({
        url: '/conversations/group',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: { data: ApiConversation }) => mapConversation(response.data),
      invalidatesTags: [{ type: 'Conversation', id: 'LIST' }],
    }),

    // ====================================================================
    // MESSAGE ENDPOINTS
    // ====================================================================

    getMessages: builder.query<
      { messages: Message[]; nextCursor: string | null; hasMore: boolean },
      { conversationId: string; cursor?: string; currentUserId: string }
    >({
      query: ({ conversationId, cursor }) => ({
        url: `/conversations/${conversationId}/messages`,
        params: cursor ? { cursor } : undefined,
      }),
      transformResponse: (
        response: PaginatedResponse<ApiMessage>,
        _meta,
        arg
      ): { messages: Message[]; nextCursor: string | null; hasMore: boolean } => ({
        messages: (response.messages ?? []).map((m) => mapMessage(m, arg.currentUserId)),
        nextCursor: response.nextCursor,
        hasMore: response.hasMore,
      }),
      providesTags: (result, _error, arg) =>
        result
          ? [
              ...result.messages.map(({ id }) => ({
                type: 'Message' as const,
                id,
              })),
              { type: 'Message', id: `LIST-${arg.conversationId}` },
            ]
          : [{ type: 'Message', id: `LIST-${arg.conversationId}` }],
    }),

    getPinnedMessages: builder.query<Message[], { conversationId: string; currentUserId: string }>({
      query: ({ conversationId }) => `/conversations/${conversationId}/pinned`,
      transformResponse: (response: { data: ApiMessage[] }, _meta, arg) =>
        response.data.map((m) => mapMessage(m, arg.currentUserId)),
      providesTags: (result, _error, arg) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'PinnedMessage' as const, id })),
              { type: 'PinnedMessage', id: arg.conversationId },
            ]
          : [{ type: 'PinnedMessage', id: arg.conversationId }],
    }),

    starMessage: builder.mutation<void, string>({
      query: (messageId) => ({
        url: `/messages/${messageId}/star`,
        method: 'PUT',
      }),
      invalidatesTags: (_result, _error, messageId) => [
        { type: 'Message', id: messageId },
        { type: 'StarredMessage', id: 'LIST' },
      ],
    }),

    unstarMessage: builder.mutation<void, string>({
      query: (messageId) => ({
        url: `/messages/${messageId}/star`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, messageId) => [
        { type: 'Message', id: messageId },
        { type: 'StarredMessage', id: 'LIST' },
      ],
    }),

    pinMessage: builder.mutation<void, string>({
      query: (messageId) => ({
        url: `/messages/${messageId}/pin`,
        method: 'PUT',
      }),
      invalidatesTags: (_result, _error, messageId) => [
        { type: 'Message', id: messageId },
        { type: 'PinnedMessage', id: 'LIST' },
      ],
    }),

    unpinMessage: builder.mutation<void, string>({
      query: (messageId) => ({
        url: `/messages/${messageId}/pin`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, messageId) => [
        { type: 'Message', id: messageId },
        { type: 'PinnedMessage', id: 'LIST' },
      ],
    }),

    forwardMessage: builder.mutation<void, { messageId: string; toConversationId: string }>({
      query: ({ messageId, toConversationId }) => ({
        url: `/messages/${messageId}/forward`,
        method: 'POST',
        body: { toConversationId },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Message', id: `LIST-${arg.toConversationId}` },
        { type: 'Conversation', id: arg.toConversationId },
      ],
    }),

    // ====================================================================
    // SCHEDULED MESSAGE ENDPOINTS
    // ====================================================================

    getScheduledMessages: builder.query<Message[], void>({
      query: () => '/messages/scheduled',
      transformResponse: (response: { data: ApiMessage[] }) =>
        response.data.map((m) => mapMessage(m, '')),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: 'ScheduledMessage' as const,
                id,
              })),
              { type: 'ScheduledMessage', id: 'LIST' },
            ]
          : [{ type: 'ScheduledMessage', id: 'LIST' }],
    }),

    createScheduledMessage: builder.mutation<
      void,
      { conversationId: string; content: string; scheduledAt: Date }
    >({
      query: (data) => ({
        url: '/messages/scheduled',
        method: 'POST',
        body: {
          ...data,
          scheduledAt: data.scheduledAt.toISOString(),
        },
      }),
      invalidatesTags: [{ type: 'ScheduledMessage', id: 'LIST' }],
    }),

    deleteScheduledMessage: builder.mutation<void, string>({
      query: (id) => ({
        url: `/messages/scheduled/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'ScheduledMessage', id },
        { type: 'ScheduledMessage', id: 'LIST' },
      ],
    }),

    // ====================================================================
    // FILE UPLOAD (using XMLHttpRequest for progress)
    // ====================================================================
    // Note: This will be handled separately outside RTK Query
    // due to the need for upload progress tracking
  }),
});

// ========================================================================
// EXPORT HOOKS (Auto-generated by RTK Query)
// ========================================================================

export const {
  // Auth
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,

  // Users
  useGetUsersQuery,
  useLazyGetUsersQuery,

  // Conversations
  useGetConversationsQuery,
  useLazyGetConversationsQuery,
  useSearchConversationsQuery,
  useLazySearchConversationsQuery,
  useCreateDirectConversationMutation,
  useCreateGroupConversationMutation,

  // Messages
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useGetPinnedMessagesQuery,
  useStarMessageMutation,
  useUnstarMessageMutation,
  usePinMessageMutation,
  useUnpinMessageMutation,
  useForwardMessageMutation,

  // Scheduled Messages
  useGetScheduledMessagesQuery,
  useCreateScheduledMessageMutation,
  useDeleteScheduledMessageMutation,
} = api;

// ========================================================================
// UTILITY TYPES
// ========================================================================

export type ApiState = ReturnType<typeof api.reducer>;
export type ApiMiddleware = typeof api.middleware;
