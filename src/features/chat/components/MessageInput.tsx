import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/features/chat/useChat';
import { validateFile } from '@/features/chat/services/messageService';
import { useDraft } from '@/shared/hooks/useDraft';
import { cn } from '@/lib/utils';
import {
  Send,
  X,
  Image,
  Video,
  Music,
  FileText,
  File,
  Timer,
  Eye,
  Mic,
  Clock,
  FileEdit,
  AtSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { EmojiPicker } from './EmojiPicker';
import { AttachmentMenu } from './AttachmentMenu';
import { VoiceRecorder } from './VoiceRecorder';
import { ScheduleMessageModal } from './ScheduleMessageModal';
import { ScheduledMessages } from './ScheduledMessages';
import { MentionInput } from './MentionInput';
import { ScheduledMessage } from '@/features/chat/types';
import { motion, AnimatePresence } from 'framer-motion';

interface SelectedFile {
  file: File;
  preview?: string;
}

const fileTypeIcons: Record<string, typeof File> = {
  image: Image,
  video: Video,
  audio: Music,
  text: FileText,
  default: File,
};

function getFileCategory(type: string): string {
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (type.startsWith('text/')) return 'text';
  return 'default';
}

interface MessageInputProps {
  editingMessage?: { id: string; content: string } | null;
  onCancelEdit?: () => void;
  onSaveEdit?: (id: string, content: string) => void;
}

export function MessageInput({ editingMessage, onCancelEdit, onSaveEdit }: MessageInputProps) {
  const { sendMessage, translate, isOnline, setTyping, activeConversation, allUsers } = useChat();

  // Draft support
  const { draft, saveDraft, clearDraft, hasDraft } = useDraft(activeConversation?.id || null);

  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scheduledTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Load draft on mount/conversation change
  useEffect(() => {
    if (draft && !editingMessage) {
      setMessage(draft);
    }
  }, [draft, editingMessage]);

  // Update message when editing starts
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content);
    }
  }, [editingMessage]);

  // Cleanup scheduled message timers on unmount
  useEffect(() => {
    return () => {
      scheduledTimers.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const handleFileSelect = (files: FileList, _type: 'image' | 'video' | 'audio' | 'file') => {
    const fileArray = Array.from(files);
    const validFiles: SelectedFile[] = [];

    for (const file of fileArray) {
      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error(translate(validation.error || 'error.generic'));
        continue;
      }

      const selectedFile: SelectedFile = { file };

      if (file.type.startsWith('image/')) {
        selectedFile.preview = URL.createObjectURL(file);
      }

      validFiles.push(selectedFile);
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const newFiles = [...prev];
      const removed = newFiles.splice(index, 1)[0];
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return newFiles;
    });
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);
      saveDraft(newMessage);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      const newMessage = message + emoji;
      setMessage(newMessage);
      saveDraft(newMessage);
    }
  };

  const handleVoiceSend = async (audioBlob: Blob) => {
    const audioFile = new window.File([audioBlob], `voice-${Date.now()}.webm`, {
      type: 'audio/webm',
    });
    await sendMessage('', [audioFile]);
    setIsRecording(false);
    toast.success('Voice message sent');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() && selectedFiles.length === 0) return;

    if (editingMessage && onSaveEdit) {
      onSaveEdit(editingMessage.id, message.trim());
      setMessage('');
      return;
    }

    // Store values BEFORE clearing for optimistic UI
    const messageContent = message.trim();
    const files = selectedFiles.map((sf) => sf.file);
    const isVanish = activeConversation?.isVanishMode;
    const shouldShowViewOnce = isViewOnce && selectedFiles.length > 0;
    const wasOffline = !isOnline;

    // Clear input IMMEDIATELY for optimistic UI (before async operation)
    setMessage('');
    setSelectedFiles([]);
    setTyping(false);
    setIsViewOnce(false);
    clearDraft();

    // Show offline toast immediately if offline
    if (wasOffline) {
      toast.info(translate('error.offline'));
    }

    // Send message asynchronously (doesn't block UI)
    sendMessage(messageContent, files, { isVanish, viewOnce: shouldShowViewOnce });
  };

  const handleScheduleMessage = (scheduledAt: Date) => {
    if (!message.trim() && selectedFiles.length === 0) return;

    const scheduleId = `schedule-${Date.now()}`;
    const newScheduledMessage: ScheduledMessage = {
      id: scheduleId,
      content: message,
      scheduledAt: scheduledAt.toISOString(),
      attachments: selectedFiles.map((sf) => sf.file),
    };

    setScheduledMessages((prev) => [...prev, newScheduledMessage]);

    const timeUntilSend = scheduledAt.getTime() - Date.now();
    const timer = setTimeout(async () => {
      const files = newScheduledMessage.attachments;
      const isVanish = activeConversation?.isVanishMode;
      await sendMessage(newScheduledMessage.content, files, { isVanish, viewOnce: false });
      setScheduledMessages((prev) => prev.filter((m) => m.id !== scheduleId));
      scheduledTimers.current.delete(scheduleId);
      toast.success('Scheduled message sent!');
    }, timeUntilSend);

    scheduledTimers.current.set(scheduleId, timer);

    setMessage('');
    setSelectedFiles([]);
    setTyping(false);
    setIsViewOnce(false);
    clearDraft();

    toast.success(`Message scheduled for ${scheduledAt.toLocaleString()}`);
  };

  const handleCancelScheduledMessage = (id: string) => {
    const timer = scheduledTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      scheduledTimers.current.delete(id);
    }
    setScheduledMessages((prev) => prev.filter((m) => m.id !== id));
    toast.info('Scheduled message cancelled');
  };

  const handleEditScheduledMessage = (scheduledMessage: ScheduledMessage) => {
    handleCancelScheduledMessage(scheduledMessage.id);
    setMessage(scheduledMessage.content);
    if (scheduledMessage.attachments) {
      setSelectedFiles(scheduledMessage.attachments.map((file) => ({ file })));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === 'Escape' && editingMessage && onCancelEdit) {
      onCancelEdit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    saveDraft(value);
    if (value.length > 0) {
      setTyping(true);
    } else {
      setTyping(false);
    }
  };

  const handleCancelEdit = () => {
    setMessage('');
    onCancelEdit?.();
  };

  const hasMediaFiles = selectedFiles.some(
    (sf) => sf.file.type.startsWith('image/') || sf.file.type.startsWith('video/')
  );

  // Show voice recorder
  if (isRecording) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-t border-border bg-card p-3 sm:p-4"
      >
        <VoiceRecorder
          onSend={handleVoiceSend}
          onCancel={() => setIsRecording(false)}
          translate={translate}
        />
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border bg-card p-3 sm:p-4">
      {/* Draft indicator */}
      <AnimatePresence>
        {hasDraft && !editingMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
          >
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileEdit className="h-3 w-3" />
              {translate('draft.saved')}
            </span>
            <button
              type="button"
              onClick={clearDraft}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {translate('draft.clear')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editing indicator */}
      <AnimatePresence>
        {editingMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2"
          >
            <span className="text-sm text-primary">Editing message</span>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vanish mode indicator */}
      <AnimatePresence>
        {activeConversation?.isVanishMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 flex items-center gap-2 rounded-lg border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-3 py-2"
          >
            <Timer className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-purple-300">
              Messages will disappear after {activeConversation.vanishTimer}s
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected files preview */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 space-y-2"
          >
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((sf, index) => {
                const category = getFileCategory(sf.file.type);
                const Icon = fileTypeIcons[category] || File;

                return (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="group relative flex items-center gap-2 rounded-lg bg-secondary p-2 pr-8"
                  >
                    {sf.preview ? (
                      <img
                        src={sf.preview}
                        alt={sf.file.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <span className="max-w-[80px] truncate text-sm sm:max-w-[120px]">
                      {sf.file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-1 opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* View once toggle for media */}
            {hasMediaFiles && (
              <motion.button
                type="button"
                onClick={() => setIsViewOnce(!isViewOnce)}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                  isViewOnce
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20'
                )}
              >
                <Eye className="h-3.5 w-3.5" />
                {isViewOnce ? 'View once enabled' : 'Enable view once'}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scheduled messages */}
      <div className="mb-2 flex items-center gap-2">
        <ScheduledMessages
          scheduledMessages={scheduledMessages}
          onCancel={handleCancelScheduledMessage}
          onEdit={handleEditScheduledMessage}
          translate={translate}
        />
      </div>

      {/* Input area */}
      <motion.div
        animate={{
          scale: isFocused ? 1.01 : 1,
          boxShadow: isFocused ? '0 0 0 2px hsl(var(--primary) / 0.2)' : '0 0 0 0px transparent',
        }}
        className={cn(
          'flex items-end gap-1 rounded-2xl bg-secondary p-2 transition-all duration-200 sm:gap-2'
        )}
      >
        {/* Attachment menu */}
        {!editingMessage && (
          <AttachmentMenu onFileSelect={handleFileSelect} translate={translate} />
        )}

        {/* Emoji picker */}
        <EmojiPicker onEmojiSelect={handleEmojiSelect} />

        {/* Text input - use MentionInput for group chats */}
        {activeConversation?.isGroup ? (
          <MentionInput
            value={message}
            onChange={(value) => {
              setMessage(value);
              saveDraft(value);
              if (value.length > 0) {
                setTyping(true);
              } else {
                setTyping(false);
              }
            }}
            users={allUsers}
            placeholder={translate('input.placeholder')}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              setTyping(false);
            }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              setTyping(false);
            }}
            onKeyDown={handleKeyDown}
            placeholder={translate('input.placeholder')}
            rows={1}
            className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm placeholder:text-muted-foreground focus:outline-none"
            style={{
              height: 'auto',
              minHeight: '40px',
            }}
          />
        )}

        {/* Voice message button - show when no text */}
        {!message.trim() && selectedFiles.length === 0 && !editingMessage && (
          <motion.button
            type="button"
            onClick={() => setIsRecording(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="touch-target flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-all duration-200 hover:bg-muted-foreground/20"
          >
            <Mic className="h-5 w-5" />
          </motion.button>
        )}

        {/* Schedule button */}
        {(message.trim() || selectedFiles.length > 0) && !editingMessage && (
          <motion.button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="touch-target flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-all duration-200 hover:bg-amber-500/20 hover:text-amber-500"
            title="Schedule message"
          >
            <Clock className="h-5 w-5" />
          </motion.button>
        )}

        {/* Send button */}
        <motion.button
          type="submit"
          disabled={!message.trim() && selectedFiles.length === 0}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'touch-target flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-200',
            message.trim() || selectedFiles.length > 0
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90'
              : 'hidden bg-muted text-muted-foreground'
          )}
        >
          <Send className="h-5 w-5" />
        </motion.button>
      </motion.div>

      {/* Schedule message modal */}
      <ScheduleMessageModal
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSchedule={handleScheduleMessage}
        translate={translate}
      />
    </form>
  );
}
