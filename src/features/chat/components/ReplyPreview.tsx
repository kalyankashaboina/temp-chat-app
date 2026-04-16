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
      <div className="flex items-start gap-2 mb-2 pb-2 border-b border-current/10">
        <div className="w-0.5 h-full min-h-[24px] bg-primary/50 rounded-full self-stretch" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-primary/80">{replyTo.senderName}</p>
          <p className="text-xs opacity-70 truncate">{replyTo.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 bg-muted/50 border-l-4 border-primary rounded-r-lg p-3">
      <Reply className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-primary">{replyTo.senderName}</p>
        <p className="text-sm text-muted-foreground truncate">{replyTo.content}</p>
      </div>
      <button
        onClick={onCancel}
        className="p-1.5 hover:bg-muted rounded-full transition-colors flex-shrink-0"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
