/**
 * useInfiniteScroll Hook
 * Implements infinite scrolling for loading older messages
 */

import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  /**
   * Callback to load more items when threshold is reached
   */
  onLoadMore: () => void | Promise<void>;

  /**
   * Whether there are more items to load
   */
  hasMore: boolean;

  /**
   * Whether items are currently loading
   */
  isLoading: boolean;

  /**
   * Scroll direction: 'up' for messages (load older), 'down' for feeds (load newer)
   */
  direction?: 'up' | 'down';

  /**
   * Threshold in pixels from edge to trigger load
   * Default: 200
   */
  threshold?: number;

  /**
   * Enable/disable the infinite scroll
   */
  enabled?: boolean;
}

/**
 * Hook for infinite scrolling functionality
 * Usage: const scrollRef = useInfiniteScroll({ onLoadMore, hasMore, isLoading })
 */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  direction = 'up',
  threshold = 200,
  enabled = true,
}: UseInfiniteScrollOptions) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);
  const isLoadingRef = useRef(false);

  /**
   * Handle scroll event and trigger load when needed
   */
  const handleScroll = useCallback(() => {
    if (!enabled || isLoading || !hasMore || isLoadingRef.current) return;

    const element = scrollRef.current;
    if (!element) return;

    const shouldLoad =
      direction === 'up'
        ? element.scrollTop < threshold
        : element.scrollHeight - element.scrollTop - element.clientHeight < threshold;

    if (shouldLoad) {
      isLoadingRef.current = true;

      // Save current scroll position (for 'up' direction)
      if (direction === 'up') {
        previousScrollHeight.current = element.scrollHeight;
      }

      // Trigger load
      Promise.resolve(onLoadMore()).finally(() => {
        isLoadingRef.current = false;
      });
    }
  }, [enabled, isLoading, hasMore, direction, threshold, onLoadMore]);

  /**
   * Maintain scroll position after loading older messages
   */
  useEffect(() => {
    if (direction === 'up' && previousScrollHeight.current > 0) {
      const element = scrollRef.current;
      if (element) {
        const newScrollHeight = element.scrollHeight;
        const heightDifference = newScrollHeight - previousScrollHeight.current;

        if (heightDifference > 0) {
          element.scrollTop += heightDifference;
        }

        previousScrollHeight.current = 0;
      }
    }
  }, [direction, isLoading]);

  /**
   * Attach scroll listener
   */
  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !enabled) return;

    element.addEventListener('scroll', handleScroll);

    // Initial check in case content doesn't fill container
    handleScroll();

    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [enabled, handleScroll]);

  /**
   * Scroll to bottom (for initial load or new messages)
   */
  const scrollToBottom = useCallback((smooth = false) => {
    const element = scrollRef.current;
    if (element) {
      element.scrollTo({
        top: element.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  /**
   * Scroll to top
   */
  const scrollToTop = useCallback((smooth = false) => {
    const element = scrollRef.current;
    if (element) {
      element.scrollTo({
        top: 0,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  /**
   * Check if scrolled to bottom
   */
  const isAtBottom = useCallback((): boolean => {
    const element = scrollRef.current;
    if (!element) return false;

    const threshold = 50; // 50px tolerance
    return element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
  }, []);

  return {
    scrollRef,
    scrollToBottom,
    scrollToTop,
    isAtBottom,
  };
}

/**
 * Hook specifically for message chat scroll behavior
 */
export function useMessageScroll({
  onLoadMore,
  hasMore,
  isLoading,
  enabled = true,
}: Omit<UseInfiniteScrollOptions, 'direction'>) {
  const { scrollRef, scrollToBottom, isAtBottom } = useInfiniteScroll({
    onLoadMore,
    hasMore,
    isLoading,
    direction: 'up',
    threshold: 200,
    enabled,
  });

  const shouldScrollRef = useRef(true);

  /**
   * Scroll to bottom on mount or when new message arrives
   */
  useEffect(() => {
    if (shouldScrollRef.current) {
      scrollToBottom(false);
      shouldScrollRef.current = false;
    }
  }, [scrollToBottom]);

  /**
   * Auto-scroll to bottom when new message arrives (if already at bottom)
   */
  const handleNewMessage = useCallback(() => {
    if (isAtBottom()) {
      setTimeout(() => scrollToBottom(true), 100);
    }
  }, [isAtBottom, scrollToBottom]);

  return {
    scrollRef,
    scrollToBottom,
    handleNewMessage,
    isAtBottom,
  };
}

export default useInfiniteScroll;
