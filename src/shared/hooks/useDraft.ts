import { useState, useEffect, useCallback, useRef } from 'react';

interface DraftData {
  content: string;
  conversationId: string;
  timestamp: number;
}

const DRAFT_STORAGE_KEY = 'chat_drafts';
const AUTO_SAVE_DELAY = 500; // ms

export function useDraft(conversationId: string | null) {
  const [draft, setDraft] = useState('');
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load draft on conversation change
  useEffect(() => {
    if (!conversationId) {
      setDraft('');
      return;
    }

    const drafts = getDrafts();
    const existingDraft = drafts[conversationId];
    if (existingDraft) {
      setDraft(existingDraft.content);
    } else {
      setDraft('');
    }
  }, [conversationId]);

  const getDrafts = useCallback((): Record<string, DraftData> => {
    try {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }, []);

  const saveDraft = useCallback(
    (content: string) => {
      if (!conversationId) return;

      // Clear existing timeout
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }

      // Debounced save
      saveTimeout.current = setTimeout(() => {
        const drafts = getDrafts();

        if (content.trim()) {
          drafts[conversationId] = {
            content,
            conversationId,
            timestamp: Date.now(),
          };
        } else {
          delete drafts[conversationId];
        }

        try {
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
        } catch (e) {
          // removed console.warn
        }
      }, AUTO_SAVE_DELAY);

      setDraft(content);
    },
    [conversationId, getDrafts]
  );

  const clearDraft = useCallback(() => {
    if (!conversationId) return;

    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    const drafts = getDrafts();
    delete drafts[conversationId];

    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
    } catch (e) {
      // removed console.warn
    }

    setDraft('');
  }, [conversationId, getDrafts]);

  const hasDraft = draft.trim().length > 0;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, []);

  return {
    draft,
    saveDraft,
    clearDraft,
    hasDraft,
  };
}
