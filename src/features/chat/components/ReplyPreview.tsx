import { ReplyTo } from '@/features/chat/types';
import { X, Reply } from 'lucide-react';

interface ReplyPreviewProps {
  replyTo: ReplyTo;
  onCancel: () => void;
  isInMessage?: boolean;
}

export function ReplyPreview({ replyTo, onCancel, isInMessage }: ReplyPreviewProps) {
  if (isInMessage) {
    return (
      <div className="border-current/10 mb-2 flex items-start gap-2 border-b pb-2">
        <div className="h-full min-h-[24px] w-0.5 self-stretch rounded-full bg-primary/50" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-primary/80">{replyTo.senderName}</p>
          <p className="truncate text-xs opacity-70">{replyTo.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-r-lg border-l-4 border-primary bg-muted/50 p-3">
      <Reply className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-primary">{replyTo.senderName}</p>
        <p className="truncate text-sm text-muted-foreground">{replyTo.content}</p>
      </div>
      <button
        onClick={onCancel}
        className="flex-shrink-0 rounded-full p-1.5 transition-colors hover:bg-muted"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
