export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  phone?: string;
  status: 'available' | 'busy' | 'away' | 'invisible';
  lastSeen?: Date;
  createdAt: Date;
}

export interface PrivacySettings {
  lastSeenVisibility: 'everyone' | 'contacts' | 'nobody';
  profilePhotoVisibility: 'everyone' | 'contacts' | 'nobody';
  aboutVisibility: 'everyone' | 'contacts' | 'nobody';
  readReceipts: boolean;
  typingIndicators: boolean;
  onlineStatus: boolean;
}

export interface BlockedUser {
  id: string;
  name: string;
  avatar: string;
  blockedAt: Date;
}

export interface StorageStats {
  totalSize: number;
  mediaSize: number;
  documentsSize: number;
  cacheSize: number;
  messagesCount: number;
  mediaCount: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}
