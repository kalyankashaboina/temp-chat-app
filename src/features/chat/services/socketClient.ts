// Real Socket.IO client — replaces the old MockSocket class.
// Named "socketClient" for drop-in compatibility with existing imports.

import { io, type Socket } from 'socket.io-client';
import { SOCKET_URL, SOCKET_EVENTS } from '@/config';

// ── Re-export event types so existing useSocket.ts imports still work ────────

export type SocketEventType =
  | 'message:received' | 'message:status' | 'message:new'
  | 'message:sent'     | 'message:delivered' | 'message:read'
  | 'message:deleted'  | 'message:edited'    | 'message:failed'
  | 'typing:start'     | 'typing:stop'
  | 'user:online'      | 'user:offline'
  | 'reaction:added'   | 'reaction:removed'
  | 'read:receipt'     | 'connection:status'
  | 'presence:init'    | 'conversation:new'
  | 'call:incoming'    | 'call:accepted'     | 'call:rejected'
  | 'call:ended'       | 'call:busy';

export interface SocketEvent<T = unknown> {
  type: SocketEventType;
  payload: T;
  timestamp: Date;
}

export interface MessageReceivedPayload {
  conversationId: string;
  message: {
    id: string; content: string; senderId: string;
    senderName: string; timestamp: Date;
  };
}

export interface MessageStatusPayload {
  messageId: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface TypingPayload {
  conversationId: string;
  userId?: string;
  userName: string;
}

export interface UserPresencePayload {
  userId: string;
  userName?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface ReadReceiptPayload {
  conversationId: string;
  messageId: string;
  userId: string;
  userName: string;
  readAt: Date;
}

export interface ReactionPayload {
  conversationId: string;
  messageId: string;
  userId: string;
  userName: string;
  emoji: string;
}

export interface ConnectionStatusPayload {
  connected: boolean;
  latency?: number;
}

// ── Socket singleton ──────────────────────────────────────────────────────────

class RealSocket {
  private socket: Socket | null = null;
  private _connected = false;

  /** Call once after login — creates the socket with cookie auth */
  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      withCredentials: true,      // sends relay_token cookie
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    });

    this.socket.on('connect',    () => { this._connected = true; });
    this.socket.on('disconnect', () => { this._connected = false; });
  }

  /** Call on logout */
  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this._connected = false;
  }

  reconnect(): void {
    this.socket?.connect();
  }

  getConnectionStatus(): boolean {
    return this.socket?.connected ?? false;
  }

  // ── Subscribe ─────────────────────────────────────────────────────────────

  on<T = unknown>(event: SocketEventType, callback: (event: SocketEvent<T>) => void): () => void {
    if (!this.socket) return () => {};

    const handler = (payload: T) => {
      callback({ type: event, payload, timestamp: new Date() });
    };

    this.socket.on(event, handler);
    return () => { this.socket?.off(event, handler); };
  }

  // ── Emit helpers (used by useChat / CallOverlay) ──────────────────────────

  sendMessage(payload: { conversationId: string; content: string; tempId: string; replyTo?: unknown }): void {
    this.socket?.emit(SOCKET_EVENTS.MSG_SEND, payload);
  }

  deleteMessage(messageId: string): void {
    this.socket?.emit(SOCKET_EVENTS.MSG_DELETE, { messageId });
  }

  editMessage(messageId: string, content: string): void {
    this.socket?.emit(SOCKET_EVENTS.MSG_EDIT, { messageId, content });
  }

  react(messageId: string, emoji: string, conversationId: string): void {
    this.socket?.emit(SOCKET_EVENTS.MSG_REACT, { messageId, emoji, conversationId });
  }

  unreact(messageId: string, emoji: string, conversationId: string): void {
    this.socket?.emit(SOCKET_EVENTS.MSG_UNREACT, { messageId, emoji, conversationId });
  }

  typingStart(conversationId: string): void {
    this.socket?.emit(SOCKET_EVENTS.TYPING_START, { conversationId });
  }

  typingStop(conversationId: string): void {
    this.socket?.emit(SOCKET_EVENTS.TYPING_STOP, { conversationId });
  }

  markRead(conversationId: string): void {
    this.socket?.emit(SOCKET_EVENTS.CONV_READ, { conversationId });
  }

  initiateCall(toUserId: string, type: 'audio' | 'video'): void {
    this.socket?.emit(SOCKET_EVENTS.CALL_INITIATE, { toUserId, type });
  }

  acceptCall(fromUserId: string): void {
    this.socket?.emit(SOCKET_EVENTS.CALL_ACCEPT, { fromUserId });
  }

  rejectCall(fromUserId: string): void {
    this.socket?.emit(SOCKET_EVENTS.CALL_REJECT, { fromUserId });
  }

  endCall(toUserId: string): void {
    this.socket?.emit(SOCKET_EVENTS.CALL_END, { toUserId });
  }

  // Legacy compat stubs used by useSocket.ts hook
  triggerTyping(conversationId: string, _userId: string, _userName: string): void {
    this.typingStart(conversationId);
  }

  triggerMessageReceived(_conversationId: string, _message: unknown): void { /* server-driven */ }
  triggerReadReceipt(conversationId: string, _messageId: string, _userId: string, _userName: string): void {
    this.markRead(conversationId);
  }
  triggerReaction(conversationId: string, messageId: string, _userId: string, _userName: string, emoji: string, added: boolean): void {
    if (added) this.react(messageId, emoji, conversationId);
    else        this.unreact(messageId, emoji, conversationId);
  }
  queueMessageStatusUpdate(_messageId: string): void { /* server handles status */ }
}

export const socketClient = new RealSocket();
