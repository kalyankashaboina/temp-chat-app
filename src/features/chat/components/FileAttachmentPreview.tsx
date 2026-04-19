import { FileAttachment } from '@/features/chat/types';
import { formatFileSize } from '@/features/chat/services/messageService';
import { useChat } from '@/features/chat/useChat';
import { cn } from '@/lib/utils';
import {
  Image,
  Video,
  Music,
  FileText,
  File,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface FileAttachmentPreviewProps {
  attachment: FileAttachment;
  messageId: string;
  isOwn: boolean;
}

const fileTypeIcons = {
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
  text: File,
};

export function FileAttachmentPreview({
  attachment,
  messageId,
  isOwn,
}: FileAttachmentPreviewProps) {
  const { retryFileUpload, translate } = useChat();
  const Icon = fileTypeIcons[attachment.type] || File;

  const handleRetry = () => {
    retryFileUpload(messageId, attachment.id);
  };

  return (
    <div
      className={cn(
        'rounded-lg p-3 transition-all duration-200',
        isOwn ? 'bg-message-own/30' : 'bg-secondary/50',
        attachment.uploadStatus === 'failed' && 'ring-1 ring-destructive/50'
      )}
    >
      {/* Image preview */}
      {attachment.type === 'image' && (
        <div className="relative mb-2 overflow-hidden rounded-md">
          <img
            src={attachment.url}
            alt={attachment.name}
            className={cn(
              'max-h-48 w-full object-cover transition-opacity duration-200',
              attachment.uploadStatus === 'pending' && 'opacity-50'
            )}
          />
          {attachment.uploadStatus === 'pending' && attachment.uploadProgress > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                <span className="mt-2 text-sm font-medium">
                  {Math.round(attachment.uploadProgress)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* File info */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            isOwn ? 'bg-message-own/50' : 'bg-secondary'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{attachment.name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatFileSize(attachment.size)}</span>
            <span>•</span>
            <span className="capitalize">
              {translate(`file.${attachment.type}` as Parameters<typeof translate>[0])}
            </span>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex-shrink-0">
          {attachment.uploadStatus === 'pending' && (
            <div className="flex items-center gap-1 text-status-pending">
              <Loader2 className="h-4 w-4 animate-spin" />
              {attachment.uploadProgress > 0 && (
                <span className="text-xs font-medium">
                  {Math.round(attachment.uploadProgress)}%
                </span>
              )}
            </div>
          )}
          {attachment.uploadStatus === 'sent' && (
            <CheckCircle className="h-4 w-4 text-status-online" />
          )}
          {attachment.uploadStatus === 'failed' && (
            <button
              onClick={handleRetry}
              className="flex items-center gap-1 text-destructive transition-colors hover:text-destructive/80"
            >
              <AlertCircle className="h-4 w-4" />
              <RefreshCw className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {attachment.uploadStatus === 'pending' && attachment.uploadProgress > 0 && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${attachment.uploadProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}
