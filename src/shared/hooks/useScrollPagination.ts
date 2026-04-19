import { useCallback, useEffect, useRef, useState } from 'react';

interface UseScrollPaginationOptions {
  threshold?: number; // Distance from top to trigger load more
  containerRef: React.RefObject<HTMLElement>;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

interface UseScrollPaginationResult {
  isNearBottom: boolean;
  scrollToBottom: (smooth?: boolean) => void;
  newMessagesCount: number;
  setNewMessagesCount: React.Dispatch<React.SetStateAction<number>>;
  handleScroll: () => void;
}

export function useScrollPagination({
  threshold = 100,
  containerRef,
  hasMore,
  isLoading,
  onLoadMore,
}: UseScrollPaginationOptions): UseScrollPaginationResult {
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const previousScrollHeightRef = useRef<number>(0);
  const isLoadingRef = useRef(isLoading);

  // Keep loading ref in sync
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  // Maintain scroll position after loading more messages
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isLoading) return;

    // If we just loaded more messages, restore scroll position
    if (previousScrollHeightRef.current > 0) {
      const newScrollHeight = container.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeightRef.current;
      container.scrollTop += scrollDiff;
      previousScrollHeightRef.current = 0;
    }
  }, [isLoading, containerRef]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;

    // Check if near bottom (within 150px)
    const nearBottom = scrollHeight - scrollTop - clientHeight < 150;
    setIsNearBottom(nearBottom);

    // Clear new message count when scrolling to bottom
    if (nearBottom) {
      setNewMessagesCount(0);
    }

    // Check if near top and should load more
    if (scrollTop < threshold && hasMore && !isLoadingRef.current) {
      // Store current scroll height to maintain position
      previousScrollHeightRef.current = container.scrollHeight;
      onLoadMore();
    }
  }, [containerRef, hasMore, onLoadMore, threshold]);

  const scrollToBottom = useCallback(
    (smooth = true) => {
      const container = containerRef.current;
      if (!container) return;

      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
      setNewMessagesCount(0);
    },
    [containerRef]
  );

  return {
    isNearBottom,
    scrollToBottom,
    newMessagesCount,
    setNewMessagesCount,
    handleScroll,
  };
}
