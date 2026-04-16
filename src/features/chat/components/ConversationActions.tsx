import { motion } from 'framer-motion';
import { 
  BellOff, 
  Bell, 
  Archive, 
  ArchiveRestore,
  Pin,
  Trash2, 
  MoreVertical 
} from 'lucide-react';
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
          className="flex h-7 w-7 items-center justify-center rounded-full bg-card border border-border shadow-sm hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4 text-muted-foreground" />
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPin(); }} className="gap-2 cursor-pointer">
          <Pin className={cn('h-4 w-4', isPinned && 'text-primary')} />
          {isPinned ? translate('conversation.unpin') : translate('conversation.pin')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMute(); }} className="gap-2 cursor-pointer">
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
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(); }} className="gap-2 cursor-pointer">
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
          onClick={(e) => { e.stopPropagation(); onDelete(); }} 
          className="gap-2 text-destructive focus:text-destructive cursor-pointer"
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
    <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center">
      <BellOff className="h-2.5 w-2.5 text-muted-foreground" />
    </div>
  );
}

// Pinned indicator badge
export function PinnedBadge() {
  return (
    <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center">
      <Pin className="h-2.5 w-2.5 text-primary" />
    </div>
  );
}
