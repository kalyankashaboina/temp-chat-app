import { Clock, X, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScheduledMessage } from '@/features/chat/types';

export type { ScheduledMessage };

interface ScheduledMessagesProps {
  scheduledMessages: ScheduledMessage[];
  onCancel: (id: string) => void;
  onEdit: (message: ScheduledMessage) => void;
  translate: (key: string) => string;
}

export function ScheduledMessages({ 
  scheduledMessages, 
  onCancel, 
  onEdit,
  translate 
}: ScheduledMessagesProps) {
  if (scheduledMessages.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
        >
          <Clock className="h-4 w-4" />
          <span className="text-xs font-medium">{scheduledMessages.length} scheduled</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3 border-b border-border">
          <h4 className="font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Scheduled Messages
          </h4>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {scheduledMessages.map((msg) => (
            <div
              key={msg.id}
              className="p-3 border-b border-border last:border-0 hover:bg-muted/50 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{msg.content || '📎 Attachment'}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(msg.scheduledAt, 'MMM d, h:mm a')}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(msg)}
                    className="p-1.5 rounded-md hover:bg-muted"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => onCancel(msg.id)}
                    className="p-1.5 rounded-md hover:bg-destructive/10"
                  >
                    <X className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
