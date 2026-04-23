export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export type FileType = 'image' | 'video' | 'audio' | 'document' | 'text';

export type Language = 'en' | 'es';
export type Theme = 'dark' | 'light' | 'system';

export type CallType = 'audio' | 'video';
export type CallStatus = 'idle' | 'calling' | 'connecting' | 'connected' | 'ended';

export interface FileAttachment {
id: string;
name: string;
size: number;
type: FileType;
mimeType: string;
url: string;
uploadProgress: number;
uploadStatus: MessageStatus;
isViewOnce?: boolean;
isViewed?: boolean;
}

export interface MessageReaction {
emoji: string;
userId: string;
userName: string;
timestamp?: string;
}

export interface ReplyTo {
messageId: string;
content: string;
senderName: string;
}

export interface ReadReceipt {
userId: string;
userName: string;
readAt: string;
}

export interface Message {
id: string;
content: string;
senderId: string;
timestamp: string;
status: MessageStatus;
attachments: FileAttachment[];
isOwn: boolean;
isEdited?: boolean;
editedAt?: string;
isDeleted?: boolean;
reactions?: MessageReaction[];
isVanish?: boolean;
vanishTimer?: number;
vanishAt?: string;
replyTo?: ReplyTo;
forwardedFrom?: string;
isPinned?: boolean;
readBy?: ReadReceipt[];
isAI?: boolean;
isStarred?: boolean;
mentions?: string[];
}

export interface User {
id: string;
name: string;
email: string;
avatar: string;
isOnline: boolean;
lastSeen?: string;
}

export interface Conversation {
id: string;
user?: User;
users?: User[];
isGroup: boolean;
groupName?: string;
groupAvatar?: string;
lastMessage?: Message;
unreadCount: number;
typingUsers?: string[];
isVanishMode?: boolean;
vanishTimer?: number;
pinnedMessages?: string[];
isAIChat?: boolean;
isMuted?: boolean;
isArchived?: boolean;
isPinned?: boolean;
}

export interface QueuedItem {
id: string;
type: 'message' | 'file';
data: Message | FileAttachment;
messageId?: string;
retryCount: number;
maxRetries: number;
createdAt: string;
status: 'pending' | 'processing' | 'failed';
}

export interface ScheduledMessage {
id: string;
content: string;
scheduledAt: string;
conversationId?: string;
attachments?: File[];
}

export interface CallState {
type: CallType;
status: CallStatus;
isMuted: boolean;
isVideoOff: boolean;
duration: number;
remoteUser?: User;
localStream?: MediaStream;
remoteStream?: MediaStream;
}

export interface CallRecord {
id: string;
type: CallType;
user: User;
timestamp: string;
duration: number;
status: 'completed' | 'missed' | 'declined';
isOutgoing: boolean;
}

export interface AuthUser {
id: string;
email: string;
name: string;
avatar: string;
}
