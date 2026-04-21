/**
 * useMessages - Custom Hook
 * Smart hook that handles message logic and state
 * Separates business logic from UI components
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
  read?: boolean;
  delivered?: boolean;
  [key: string]: unknown;
}

export interface UseMessagesOptions {
  conversationId?: string;
  userId?: string;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
}

export interface UseMessagesReturn {
  // Data
  messages: Message[];
  groupedMessages: Record<string, Message[]>;

  // State
  isLoading: boolean;
  hasMore: boolean;

  // Actions
  loadMore: () => Promise<void>;
  markAsRead: (messageId: string) => void;
  scrollToMessage: (messageId: string) => void;
  scrollToBottom: () => void;

  // Refs
  containerRef: React.RefObject<HTMLDivElement>;
  bottomRef: React.RefObject<HTMLDivElement>;
}

export function useMessages({
  conversationId: _conversationId,
  userId: _userId,
  onLoadMore,
  hasMore: hasMoreProp = false,
}: UseMessagesOptions): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(hasMoreProp);

  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Group messages by date
  const groupedMessages = messages.reduce(
    (groups, message) => {
      const date = new Date(message.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    },
    {} as Record<string, Message[]>
  );

  // Load more messages
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || !onLoadMore) return;

    setIsLoading(true);
    try {
      await onLoadMore();
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, onLoadMore]);

  // Mark message as read
  const markAsRead = useCallback((messageId: string) => {
    setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg)));
  }, []);

  // Scroll to specific message
  const scrollToMessage = useCallback((messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight');
      setTimeout(() => element.classList.remove('highlight'), 2000);
    }
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  // Update hasMore when prop changes
  useEffect(() => {
    setHasMore(hasMoreProp);
  }, [hasMoreProp]);

  return {
    messages,
    groupedMessages,
    isLoading,
    hasMore,
    loadMore,
    markAsRead,
    scrollToMessage,
    scrollToBottom,
    containerRef,
    bottomRef,
  };
}
