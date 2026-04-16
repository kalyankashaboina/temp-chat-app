import { useEffect, useCallback, useRef } from 'react';
import { socketClient } from '@/features/chat/services/socketClient';
import type {
  SocketEventType, MessageReceivedPayload, MessageStatusPayload,
  TypingPayload, UserPresencePayload, ReadReceiptPayload,
  ReactionPayload, ConnectionStatusPayload,
} from '@/features/chat/services/socketClient';

export function useSocketEvent<T>(
  eventType: SocketEventType,
  callback: (payload: T, timestamp: Date) => void,
  deps: React.DependencyList = [],
): void {
  const callbackRef = useRef(callback);
  useEffect(() => { callbackRef.current = callback; }, [callback, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const unsub = socketClient.on<T>(eventType, (event) => {
      callbackRef.current(event.payload, event.timestamp);
    });
    return unsub;
  }, [eventType]);  
}

export function useSocketConnection() {
  const isConnected = socketClient.getConnectionStatus();
  const reconnect   = useCallback(() => socketClient.reconnect(), []);
  const disconnect  = useCallback(() => socketClient.disconnect(), []);
  return { isConnected, reconnect, disconnect };
}

export function useSocketActions() {
  const triggerTyping = useCallback((conversationId: string, userId: string, userName: string) => {
    socketClient.triggerTyping(conversationId, userId, userName);
  }, []);
  const triggerMessageReceived = useCallback((conversationId: string, message: MessageReceivedPayload['message']) => {
    socketClient.triggerMessageReceived(conversationId, message);
  }, []);
  const triggerReadReceipt = useCallback((conversationId: string, messageId: string, userId: string, userName: string) => {
    socketClient.triggerReadReceipt(conversationId, messageId, userId, userName);
  }, []);
  const triggerReaction = useCallback((conversationId: string, messageId: string, userId: string, userName: string, emoji: string, added: boolean) => {
    socketClient.triggerReaction(conversationId, messageId, userId, userName, emoji, added);
  }, []);
  const queueMessageStatus = useCallback((messageId: string) => {
    socketClient.queueMessageStatusUpdate(messageId);
  }, []);
  return { triggerTyping, triggerMessageReceived, triggerReadReceipt, triggerReaction, queueMessageStatus };
}

export type {
  MessageReceivedPayload, MessageStatusPayload, TypingPayload,
  UserPresencePayload, ReadReceiptPayload, ReactionPayload, ConnectionStatusPayload,
};
