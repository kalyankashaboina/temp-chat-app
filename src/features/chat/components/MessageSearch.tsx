import { useState, useMemo, useEffect, useCallback } from 'react';
import { Message } from '@/features/chat/types';
import { cn } from '@/lib/utils';
import { Search, X, ChevronUp, ChevronDown, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageSearchProps {
  messages: Message[];
  onClose: () => void;
  onNavigateToMessage: (messageId: string) => void;
  translate: (key: string) => string;
}

export function MessageSearch({ messages, onClose, onNavigateToMessage, translate }: MessageSearchProps) {
  const [query, setQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return messages.filter(m => 
      !m.isDeleted && m.content.toLowerCase().includes(lowerQuery)
    );
  }, [messages, query]);

  // Navigate to result when index changes
  useEffect(() => {
    if (results.length > 0 && results[currentIndex]) {
      onNavigateToMessage(results[currentIndex].id);
    }
  }, [currentIndex, results, onNavigateToMessage]);

  const handlePrev = useCallback(() => {
    if (results.length === 0) return;
    setCurrentIndex(prev => prev > 0 ? prev - 1 : results.length - 1);
  }, [results.length]);

  const handleNext = useCallback(() => {
    if (results.length === 0) return;
    setCurrentIndex(prev => prev < results.length - 1 ? prev + 1 : 0);
  }, [results.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        if (e.shiftKey) {
          handlePrev();
        } else {
          handleNext();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handlePrev, handleNext]);

  const handleResultClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="absolute inset-x-0 top-0 z-20 bg-card border-b border-border shadow-lg animate-in slide-in-from-top-2">
      <div className="flex items-center gap-2 p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCurrentIndex(0); }}
            placeholder={translate('input.search')}
            className="pl-10 bg-secondary border-0"
            autoFocus
          />
        </div>
        
        {results.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {currentIndex + 1} / {results.length}
            </span>
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        )}
        
        <button
          onClick={onClose}
          className="p-2 rounded-md hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Results list */}
      {query.trim() && results.length > 0 && (
        <div className="max-h-64 overflow-y-auto border-t border-border">
          {results.slice(0, 10).map((msg, index) => (
            <button
              key={msg.id}
              onClick={() => handleResultClick(index)}
              className={cn(
                'w-full text-left p-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0',
                index === currentIndex && 'bg-primary/10'
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-medium text-primary">
                  {msg.isOwn ? 'You' : 'Contact'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(msg.timestamp, 'MMM d, HH:mm')}
                </span>
              </div>
              <p className="text-sm text-foreground line-clamp-2">
                {highlightMatch(msg.content, query)}
              </p>
            </button>
          ))}
          {results.length > 10 && (
            <p className="text-xs text-center text-muted-foreground py-2">
              +{results.length - 10} more results
            </p>
          )}
        </div>
      )}
      
      {query.trim() && results.length === 0 && (
        <div className="p-4 text-center text-sm text-muted-foreground border-t border-border">
          No messages found
        </div>
      )}
    </div>
  );
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() 
      ? <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">{part}</mark>
      : part
  );
}
