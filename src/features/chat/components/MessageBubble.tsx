import { useState } from 'react';
import { Message } from '@/features/chat/types';
import { useChat } from '@/features/chat/useChat';
import { FileAttachmentPreview } from './FileAttachmentPreview';
import { MessageReactions } from './MessageReactions';
import { MessageStatusIndicator } from './MessageStatusIndicator';
import { ReplyPreview } from './ReplyPreview';
import { ReadReceiptsModal } from './ReadReceiptsModal';
import { ForwardMessageModal } from './ForwardMessageModal';
import { MarkdownRenderer } from './MarkdownRenderer';
import { LinkPreview } from './LinkPreview';
import { StarButton } from './StarredMessages';
import { cn } from '@/lib/utils';
import { RefreshCw, MoreVertical, Pencil, Trash2, Reply, Forward, Timer, Pin, CheckCheck, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface MessageBubbleProps {
  message: Message;
  onEdit?: (message: Message) => void;
}

export function MessageBubble({ message, onEdit }: MessageBubbleProps) {
  const { retryMessage, deleteMessage, addReaction, removeReaction, translate, isOnline, currentUser, setReplyingTo, pinMessage, unpinMessage, activeConversation, conversations, forwardMessage, starMessage, unstarMessage } = useChat();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReadReceipts, setShowReadReceipts] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);

  const handleRetry = () => retryMessage(message.id);
  const handleEdit = () => onEdit?.(message);
  const handleDelete = () => setShowDeleteDialog(true);
  const confirmDelete = () => { deleteMessage(message.id); setShowDeleteDialog(false); };
  const handleAddReaction = (emoji: string) => addReaction(message.id, emoji);
  const handleRemoveReaction = (emoji: string) => removeReaction(message.id, emoji);
  const handleReply = () => setReplyingTo({ messageId: message.id, content: message.content, senderName: message.isOwn ? 'You' : 'User' });
  const handlePin = () => message.isPinned ? unpinMessage(message.id) : pinMessage(message.id);
  const handleForward = () => setShowForwardModal(true);
  const handleStar = () => message.isStarred ? unstarMessage(message.id) : starMessage(message.id);

  const isGroup = activeConversation?.isGroup;
  const isAIMessage = message.isAI;

  if (message.isDeleted) {
    return (
      <div className={cn('group flex w-full animate-slide-up', message.isOwn ? 'justify-end' : 'justify-start')}>
        <div className={cn(
          'rounded-2xl px-4 py-2.5 italic text-muted-foreground/70 bg-muted/30 border border-dashed border-muted-foreground/20',
          message.isOwn ? 'rounded-br-md' : 'rounded-bl-md'
        )}>
          <p className="text-sm">{translate('message.deleted')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn('group flex w-full animate-slide-up px-1', message.isOwn ? 'justify-end' : 'justify-start')}>
        <div className={cn('max-w-[85%] sm:max-w-[75%] space-y-1', message.isOwn ? 'items-end' : 'items-start')}>
          <div className="relative">
            <div className={cn(
              'rounded-2xl px-4 py-2.5 transition-all duration-200 shadow-sm relative',
              message.isOwn 
                ? 'rounded-br-md bg-primary text-primary-foreground' 
                : 'rounded-bl-md bg-card border border-border text-card-foreground',
              message.status === 'failed' && message.isOwn && 'ring-2 ring-destructive bg-destructive/20 animate-pulse',
              message.status === 'pending' && message.isOwn && 'opacity-80',
              message.isVanish && 'bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0',
              message.isPinned && 'ring-2 ring-amber-500/50',
              isAIMessage && !message.isOwn && 'bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30'
            )}>
              {/* Pinned indicator */}
              {message.isPinned && (
                <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center shadow-sm">
                  <Pin className="h-3 w-3 text-white" />
                </div>
              )}

              {/* Forwarded indicator */}
              {message.forwardedFrom && (
                <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                  <Forward className="h-3 w-3" />
                  <span>{translate('message.forwarded')}</span>
                </div>
              )}
              
              {/* Reply preview */}
              {message.replyTo && <ReplyPreview replyTo={message.replyTo} onCancel={() => {}} isInMessage />}
              
              {/* AI indicator */}
              {isAIMessage && !message.isOwn && (
                <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                  <Sparkles className="h-3 w-3 text-violet-400" />
                  <span>AI Response</span>
                </div>
              )}

              {/* Vanish indicator */}
              {message.isVanish && (
                <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                  <Timer className="h-3 w-3" />
                  <span>{translate('vanish.willDisappear')}</span>
                </div>
              )}
              
              {/* Message content with markdown support */}
              {message.content && (
                isAIMessage || message.content.includes('**') || message.content.includes('```') || message.content.includes('- ') || message.content.includes('|')
                  ? <MarkdownRenderer content={message.content} isOwn={message.isOwn} />
                  : <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
              )}
              
              {/* Link preview for URLs in message */}
              {message.content && <LinkPreview content={message.content} isOwn={message.isOwn} />}
            </div>

            {/* Message actions - appear on hover/tap */}
            <div className={cn(
              'absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-1',
              message.isOwn ? 'right-full mr-2' : 'left-full ml-2'
            )}>
              {/* Star button */}
              <StarButton 
                isStarred={message.isStarred || false} 
                onToggle={handleStar} 
              />
              <button 
                onClick={handleReply} 
                className="flex h-7 w-7 items-center justify-center rounded-full bg-card border border-border shadow-sm hover:bg-muted transition-colors"
                title={translate('action.reply')}
              >
                <Reply className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button 
                onClick={handleForward} 
                className="flex h-7 w-7 items-center justify-center rounded-full bg-card border border-border shadow-sm hover:bg-muted transition-colors"
                title={translate('action.forward')}
              >
                <Forward className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {message.isOwn && message.status !== 'pending' && message.status !== 'failed' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex h-7 w-7 items-center justify-center rounded-full bg-card border border-border shadow-sm hover:bg-muted transition-colors">
                      <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={handlePin} className="gap-2 cursor-pointer">
                      <Pin className="h-3.5 w-3.5" />
                      {message.isPinned ? translate('pin.unpin') : translate('pin.message')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleEdit} className="gap-2 cursor-pointer">
                      <Pencil className="h-3.5 w-3.5" />{translate('action.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDelete} className="gap-2 text-destructive focus:text-destructive cursor-pointer">
                      <Trash2 className="h-3.5 w-3.5" />{translate('action.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {message.attachments.length > 0 && (
            <div className="space-y-2">
              {message.attachments.map((attachment) => (
                <FileAttachmentPreview key={attachment.id} attachment={attachment} messageId={message.id} isOwn={message.isOwn} />
              ))}
            </div>
          )}

          <MessageReactions reactions={message.reactions || []} onAddReaction={handleAddReaction} onRemoveReaction={handleRemoveReaction} isOwn={message.isOwn} currentUserId={currentUser.id} />

          <div className={cn('flex items-center gap-2 text-xs flex-wrap', message.isOwn ? 'justify-end' : 'justify-start')}>
            <span className="text-muted-foreground">{format(message.timestamp, 'HH:mm')}</span>
            {message.isEdited && <span className="text-muted-foreground italic">({translate('message.edited')})</span>}
            {message.isOwn && <MessageStatusIndicator status={message.status} translate={translate} />}
            {/* Read receipts for group chats */}
            {isGroup && message.isOwn && message.status === 'read' && message.readBy && message.readBy.length > 0 && (
              <button
                onClick={() => setShowReadReceipts(true)}
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <CheckCheck className="h-3 w-3" />
                <span>{message.readBy.length}</span>
              </button>
            )}
            {message.isOwn && message.status === 'failed' && (
              <div className="flex items-center gap-2">
                <span className="text-destructive text-xs font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                  {translate('status.failed')}
                </span>
                <button 
                  onClick={handleRetry} 
                  disabled={!isOnline} 
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all shadow-sm',
                    isOnline 
                      ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-105 active:scale-95' 
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  )}
                >
                  <RefreshCw className={cn('h-3 w-3', isOnline && 'group-hover:animate-spin')} />
                  {translate('action.retry')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Read receipts modal */}
      <ReadReceiptsModal
        open={showReadReceipts}
        onClose={() => setShowReadReceipts(false)}
        receipts={message.readBy || []}
        translate={translate}
      />

      {/* Forward message modal */}
      <ForwardMessageModal
        open={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        message={message}
        conversations={conversations}
        onForward={forwardMessage}
        translate={translate}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translate('message.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translate('action.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{translate('action.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
