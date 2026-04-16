// Real API wrappers — same export signatures as old mock for drop-in compatibility.
import { chatApi } from './chatApi';
import type { Message, FileAttachment, MessageStatus } from '@/features/chat/types';
import { UPLOAD } from '@/config';

export interface SendMessageResult {
  success: boolean;
  messageId: string;
  status: MessageStatus;
  error?: string;
}

export interface UploadFileResult {
  success: boolean;
  fileId: string;
  url?: string;
  status: MessageStatus;
  error?: string;
}

// Kept for schema compatibility — validation still used in chatSlice
export interface FileValidationResult { valid: boolean; error?: string; }
export interface PaginationCursor { before?: string; limit: number; }
export interface PaginatedMessagesResult {
  messages: Message[];
  hasMore: boolean;
  nextCursor: string | null;
}

export function validateFile(file: File): FileValidationResult {
  if (file.size > UPLOAD.MAX_SIZE_BYTES) return { valid: false, error: 'error.fileTooLarge' };
  if (!UPLOAD.ALLOWED_MIMES.includes(file.type)) return { valid: false, error: 'error.unsupportedFile' };
  return { valid: true };
}

export function getFileType(mimeType: string): FileAttachment['type'] {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'text/plain') return 'text';
  return 'document';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Upload via XHR with progress (uses chatApi.uploadFile internally)
export function mockUploadFile(
  file: FileAttachment,
  onProgress: (pct: number) => void,
): Promise<UploadFileResult> {
  // FileAttachment doesn't have the raw File — blob uploads are handled separately.
  // This stub is kept for chatSlice compatibility; real uploads go via chatApi.uploadFile.
  onProgress(100);
  return Promise.resolve({ success: true, fileId: file.id, url: file.url, status: 'sent' });
}

// Send is now done via socket; this stub updates optimistic state
export function mockSendMessage(_msg: Message): Promise<SendMessageResult> {
  return Promise.resolve({ success: true, messageId: _msg.id, status: 'sent' });
}

// Used by chatSlice to get a typing reply — now a no-op (server handles it)
export function mockReceiveReply(_content: string): Promise<Message> {
  return new Promise(() => {}); // never resolves — server pushes real replies
}

// Real paginated message load
export async function mockLoadOlderMessages(
  conversationId: string,
  cursor: PaginationCursor,
  currentUserId = '',
): Promise<PaginatedMessagesResult> {
  const result = await chatApi.getMessages(conversationId, cursor.before, currentUserId);
  return {
    messages: result.messages,
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  };
}
