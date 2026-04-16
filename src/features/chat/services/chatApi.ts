import { api } from '@/lib/apiClient';
import type { Message, Conversation, User } from '@/features/chat/types';

interface ApiMessage {
  _id: string; content: string; senderId: { _id: string; username: string; avatar: string } | string;
  createdAt: string; isEdited?: boolean; editedAt?: string; isDeleted?: boolean;
  reactions?: Array<{ userId: string; emoji: string; username: string }>;
  attachments?: Array<{ url: string; name: string; type: string; mimeType: string; size: number }>;
  replyTo?: { messageId: string; content: string; senderName: string };
  isPinned?: boolean; starredBy?: string[]; forwardedFrom?: string;
  isScheduled?: boolean; scheduledAt?: string;
}

interface ApiConversation {
  id: string; type: string; isGroup: boolean; groupName?: string;
  user?: { id: string; name: string; username: string; avatar: string; isOnline: boolean };
  users?: Array<{ id: string; name: string; username: string; avatar: string; isOnline: boolean }>;
  lastMessage?: ApiMessage; unreadCount: number; updatedAt: string;
}

interface ApiUser { id: string; username: string; name: string; email: string; avatar: string; isOnline: boolean; }

function mapMessage(m: ApiMessage, currentUserId: string): Message {
  const senderId = typeof m.senderId === 'object' ? m.senderId._id : m.senderId;
  return {
    id: m._id,
    content: m.content,
    senderId,
    timestamp: new Date(m.createdAt),
    status: 'read',
    attachments: (m.attachments ?? []).map(a => ({
      id: a.url, name: a.name, size: a.size, type: a.type as import('@/features/chat/types').FileAttachment['type'],
      mimeType: a.mimeType, url: a.url, uploadProgress: 100, uploadStatus: 'sent' as const,
    })),
    isOwn: senderId === currentUserId,
    isEdited: m.isEdited,
    editedAt: m.editedAt ? new Date(m.editedAt) : undefined,
    isDeleted: m.isDeleted,
    reactions: (m.reactions ?? []).map(r => ({ emoji: r.emoji, userId: r.userId, userName: r.username })),
    replyTo: m.replyTo ? { messageId: m.replyTo.messageId, content: m.replyTo.content, senderName: m.replyTo.senderName } : undefined,
    isPinned: m.isPinned,
    isStarred: m.starredBy?.includes(currentUserId),
    forwardedFrom: m.forwardedFrom,
  };
}

function mapConversation(c: ApiConversation): Conversation {
  return {
    id: c.id, isGroup: c.isGroup, groupName: c.groupName,
    user: c.user ? { id: c.user.id, name: c.user.name, email: '', avatar: c.user.avatar, isOnline: c.user.isOnline } : undefined,
    users: c.users?.map(u => ({ id: u.id, name: u.name, email: '', avatar: u.avatar, isOnline: u.isOnline })),
    lastMessage: undefined, unreadCount: c.unreadCount, typingUsers: [],
  };
}

function mapUser(u: ApiUser): User {
  return { id: u.id, name: u.name || u.username, email: u.email, avatar: u.avatar, isOnline: u.isOnline };
}

export const chatApi = {
  // Conversations
  async getConversations(cursor?: string): Promise<{ conversations: Conversation[]; nextCursor: string | null; hasMore: boolean }> {
    const q = cursor ? `?cursor=${cursor}` : '';
    const res = await api.get<{ conversations: ApiConversation[]; nextCursor: string | null; hasMore: boolean }>(`/conversations${q}`);
    return { conversations: res.conversations.map(mapConversation), nextCursor: res.nextCursor, hasMore: res.hasMore };
  },

  async searchConversations(query: string): Promise<Conversation[]> {
    const res = await api.get<{ conversations: ApiConversation[] }>(`/conversations/search?query=${encodeURIComponent(query)}`);
    return res.conversations.map(mapConversation);
  },

  async createDirect(targetUserId: string): Promise<Conversation> {
    const res = await api.post<{ data: ApiConversation }>('/conversations/direct', { targetUserId });
    return mapConversation(res.data);
  },

  async createGroup(name: string, memberIds: string[]): Promise<Conversation> {
    const res = await api.post<{ data: ApiConversation }>('/conversations/group', { name, memberIds });
    return mapConversation(res.data);
  },

  // Messages
  async getMessages(conversationId: string, cursor?: string, currentUserId = ''): Promise<{ messages: Message[]; nextCursor: string | null; hasMore: boolean }> {
    const q = cursor ? `?cursor=${cursor}` : '';
    const res = await api.get<{ messages: ApiMessage[]; nextCursor: string | null; hasMore: boolean }>(`/conversations/${conversationId}/messages${q}`);
    return { messages: res.messages.map(m => mapMessage(m, currentUserId)), nextCursor: res.nextCursor, hasMore: res.hasMore };
  },

  async getPinnedMessages(conversationId: string, currentUserId = ''): Promise<Message[]> {
    const res = await api.get<{ data: ApiMessage[] }>(`/conversations/${conversationId}/pinned`);
    return res.data.map(m => mapMessage(m, currentUserId));
  },

  async starMessage(messageId: string): Promise<void> {
    await api.put(`/messages/${messageId}/star`);
  },

  async unstarMessage(messageId: string): Promise<void> {
    await api.delete(`/messages/${messageId}/star`);
  },

  async pinMessage(messageId: string): Promise<void> {
    await api.put(`/messages/${messageId}/pin`);
  },

  async unpinMessage(messageId: string): Promise<void> {
    await api.delete(`/messages/${messageId}/pin`);
  },

  async forwardMessage(messageId: string, toConversationId: string): Promise<void> {
    await api.post(`/messages/${messageId}/forward`, { toConversationId });
  },

  async getScheduledMessages(): Promise<Message[]> {
    const res = await api.get<{ data: ApiMessage[] }>('/messages/scheduled');
    return res.data.map(m => mapMessage(m, ''));
  },

  async createScheduledMessage(conversationId: string, content: string, scheduledAt: Date): Promise<void> {
    await api.post('/messages/scheduled', { conversationId, content, scheduledAt: scheduledAt.toISOString() });
  },

  async deleteScheduledMessage(id: string): Promise<void> {
    await api.delete(`/messages/scheduled/${id}`);
  },

  // Users
  async getUsers(q?: string): Promise<User[]> {
    const query = q ? `?q=${encodeURIComponent(q)}` : '';
    const res = await api.get<{ data: ApiUser[] }>(`/users${query}`);
    return res.data.map(mapUser);
  },

  async uploadFile(file: File, onProgress?: (pct: number) => void): Promise<{ url: string; name: string; type: string; mimeType: string; size: number }> {
    const form = new FormData();
    form.append('file', file);
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'}/upload`);
      xhr.withCredentials = true;
      if (onProgress) xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress((e.loaded / e.total) * 100); };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText).data);
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.send(form);
    });
  },
};
