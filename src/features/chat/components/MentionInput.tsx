import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/features/chat/types';
import { cn } from '@/lib/utils';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  users: User[];
  onMention?: (user: User) => void;
  placeholder?: string;
  className?: string;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

interface MentionSuggestion {
  user: User;
  isSelected: boolean;
}

export function MentionInput({
  value,
  onChange,
  users,
  onMention,
  placeholder,
  className,
  textareaRef: externalRef,
  onKeyDown,
  onFocus,
  onBlur,
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef || internalRef;
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Find the @ symbol and query
  const findMentionQuery = useCallback((text: string, cursor: number): string | null => {
    // Look backwards from cursor to find @
    let startIdx = cursor - 1;
    while (startIdx >= 0) {
      const char = text[startIdx];
      if (char === '@') {
        const query = text.substring(startIdx + 1, cursor);
        // Check if there's a space before @ or it's at the start
        if (startIdx === 0 || text[startIdx - 1] === ' ' || text[startIdx - 1] === '\n') {
          return query;
        }
        return null;
      }
      if (char === ' ' || char === '\n') {
        return null;
      }
      startIdx--;
    }
    return null;
  }, []);

  // Update suggestions when typing
  useEffect(() => {
    const query = findMentionQuery(value, cursorPosition);
    
    if (query !== null) {
      const filtered = users
        .filter(user => 
          user.name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5)
        .map((user, idx) => ({
          user,
          isSelected: idx === selectedIndex,
        }));
      
      setSuggestions(filtered);
      setMentionQuery(query);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [value, cursorPosition, users, findMentionQuery, selectedIndex]);

  const insertMention = (user: User) => {
    const query = findMentionQuery(value, cursorPosition);
    if (query === null) return;

    // Find where the @ starts
    const atIndex = cursorPosition - query.length - 1;
    const beforeMention = value.substring(0, atIndex);
    const afterMention = value.substring(cursorPosition);
    
    const newValue = `${beforeMention}@${user.name} ${afterMention}`;
    onChange(newValue);
    
    // Update cursor position
    const newCursorPos = atIndex + user.name.length + 2; // +2 for @ and space
    setCursorPosition(newCursorPos);
    
    // Focus and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
    
    setShowSuggestions(false);
    onMention?.(user);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % suggestions.length);
          return;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
          return;
        case 'Enter':
          if (showSuggestions) {
            e.preventDefault();
            insertMention(suggestions[selectedIndex].user);
            return;
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowSuggestions(false);
          return;
        case 'Tab':
          if (showSuggestions) {
            e.preventDefault();
            insertMention(suggestions[selectedIndex].user);
            return;
          }
          break;
      }
    }
    
    onKeyDown?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setCursorPosition(e.currentTarget.selectionStart);
  };

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [mentionQuery]);

  function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  function getAvatarColor(name: string): string {
    const colors = ['bg-primary', 'bg-green-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'];
    return colors[name.charCodeAt(0) % colors.length];
  }

  return (
    <div className="relative flex-1">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={1}
        className={cn(
          'max-h-32 min-h-[40px] w-full flex-1 resize-none bg-transparent px-2 py-2 text-sm placeholder:text-muted-foreground focus:outline-none',
          className
        )}
        style={{
          height: 'auto',
          minHeight: '40px',
        }}
      />

      {/* Mention suggestions dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-border bg-popover shadow-xl z-50 overflow-hidden"
          >
            <div className="p-1">
              <p className="px-3 py-1.5 text-xs text-muted-foreground font-medium">
                Mention someone
              </p>
              {suggestions.map(({ user, isSelected }, index) => (
                <motion.button
                  key={user.id}
                  onClick={() => insertMention(user)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                    isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                  )}
                  whileHover={{ x: 2 }}
                >
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white',
                    getAvatarColor(user.name)
                  )}>
                    {getInitials(user.name)}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  {user.isOnline && (
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Utility to highlight mentions in text
export function highlightMentions(text: string, currentUserId: string): React.ReactNode[] {
  const mentionRegex = /@(\w+\s?\w*)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Add highlighted mention
    const mentionName = match[1];
    const isCurrentUser = mentionName.toLowerCase() === 'you';
    
    parts.push(
      <span
        key={match.index}
        className={cn(
          'font-semibold rounded px-0.5',
          isCurrentUser ? 'bg-primary/20 text-primary' : 'text-primary'
        )}
      >
        @{mentionName}
      </span>
    );
    
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
