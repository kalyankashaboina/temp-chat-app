import { useState } from 'react';
import { Conversation, Message } from '@/features/chat/types';
import { cn } from '@/lib/utils';
import { Forward, Users, Search, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = ['bg-primary', 'bg-green-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'];
  return colors[name.charCodeAt(0) % colors.length];
}

interface ForwardMessageModalProps {
  open: boolean;
  onClose: () => void;
  message: Message | null;
  conversations: Conversation[];
  onForward: (messageId: string, toConversationId: string) => void;
  translate: (key: string) => string;
}

export function ForwardMessageModal({
  open,
  onClose,
  message,
  conversations,
  onForward,
  translate,
}: ForwardMessageModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const filteredConversations = conversations.filter((conv) => {
    const name = conv.isGroup ? conv.groupName : conv.user?.name;
    return name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleForward = () => {
    if (message && selectedConversation) {
      onForward(message.id, selectedConversation);
      onClose();
      setSelectedConversation(null);
      setSearchQuery('');
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedConversation(null);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Forward className="h-5 w-5 text-primary" />
            {translate('action.forward')}
          </DialogTitle>
        </DialogHeader>

        {/* Message preview */}
        {message && (
          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {message.content || (message.attachments.length > 0 ? '📎 Attachment' : '')}
            </p>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={translate('input.search')}
            className="pl-10"
          />
        </div>

        {/* Conversation list */}
        <ScrollArea className="-mx-6 h-[300px] px-6">
          <div className="space-y-1">
            {filteredConversations.map((conv) => {
              const displayName = conv.isGroup ? conv.groupName : conv.user?.name || 'Unknown';
              const isSelected = selectedConversation === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl p-3 transition-all duration-200',
                    isSelected
                      ? 'border border-primary/30 bg-primary/10 ring-1 ring-primary/20'
                      : 'border border-transparent hover:bg-secondary'
                  )}
                >
                  <div className="relative">
                    {conv.isGroup ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                        <Users className="h-4 w-4" />
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white',
                          getAvatarColor(displayName)
                        )}
                      >
                        {getInitials(displayName)}
                      </div>
                    )}
                  </div>
                  <span className="flex-1 truncate text-left font-medium">{displayName}</span>
                  {isSelected && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose}>
            {translate('action.cancel')}
          </Button>
          <Button onClick={handleForward} disabled={!selectedConversation} className="gap-2">
            <Forward className="h-4 w-4" />
            {translate('action.forward')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
