import { ReadReceipt } from '@/features/chat/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CheckCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ReadReceiptsModalProps {
  open: boolean;
  onClose: () => void;
  receipts: ReadReceipt[];
  translate: (key: string) => string;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = ['bg-primary', 'bg-green-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'];
  return colors[name.charCodeAt(0) % colors.length];
}

export function ReadReceiptsModal({ open, onClose, receipts, translate }: ReadReceiptsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCheck className="h-5 w-5 text-primary" />
            Read by {receipts.length}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {receipts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No one has read this message yet
            </p>
          ) : (
            receipts.map((receipt, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white',
                  getAvatarColor(receipt.userName)
                )}>
                  {getInitials(receipt.userName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{receipt.userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(receipt.readAt, 'MMM d, HH:mm')}
                  </p>
                </div>
                <CheckCheck className="h-4 w-4 text-primary flex-shrink-0" />
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
