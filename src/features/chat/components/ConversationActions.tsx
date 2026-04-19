import { motion } from 'framer-motion';
import { BellOff, Bell, Archive, ArchiveRestore, Pin, Trash2, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ConversationActionsProps {
  isMuted: boolean;
  isArchived: boolean;
  isPinned: boolean;
  onMute: () => void;
  onArchive: () => void;
  onPin: () => void;
  onDelete: () => void;
  translate: (key: string) => string;
}

export function ConversationActions({
  isMuted,
  isArchived,
  isPinned,
  onMute,
  onArchive,
  onPin,
  onDelete,
  translate,
}: ConversationActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card opacity-0 shadow-sm transition-colors hover:bg-muted focus:opacity-100 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4 text-muted-foreground" />
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onPin();
          }}
          className="cursor-pointer gap-2"
        >
          <Pin className={cn('h-4 w-4', isPinned && 'text-primary')} />
          {isPinned ? translate('conversation.unpin') : translate('conversation.pin')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onMute();
          }}
          className="cursor-pointer gap-2"
        >
          {isMuted ? (
            <>
              <Bell className="h-4 w-4" />
              {translate('conversation.unmute')}
            </>
          ) : (
            <>
              <BellOff className="h-4 w-4" />
              {translate('conversation.mute')}
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onArchive();
          }}
          className="cursor-pointer gap-2"
        >
          {isArchived ? (
            <>
              <ArchiveRestore className="h-4 w-4" />
              {translate('conversation.unarchive')}
            </>
          ) : (
            <>
              <Archive className="h-4 w-4" />
              {translate('conversation.archive')}
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="cursor-pointer gap-2 text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          {translate('conversation.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Mute indicator badge
export function MutedBadge() {
  return (
    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-muted">
      <BellOff className="h-2.5 w-2.5 text-muted-foreground" />
    </div>
  );
}

// Pinned indicator badge
export function PinnedBadge() {
  return (
    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20">
      <Pin className="h-2.5 w-2.5 text-primary" />
    </div>
  );
}
