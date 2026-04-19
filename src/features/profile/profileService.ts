import { api } from '@/lib/apiClient';
import type {
  UserProfile,
  PrivacySettings,
  BlockedUser,
  StorageStats,
  FAQItem,
} from '@/features/profile/types';

export const profileApi = {
  async getProfile(): Promise<UserProfile> {
    const res = await api.get<{ data: UserProfile }>('/auth/me');
    return res.data;
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const res = await api.put<{ data: UserProfile }>('/users/me', updates);
    return res.data;
  },

  async updateAvatar(avatarUrl: string): Promise<string> {
    await api.put('/users/me', { avatar: avatarUrl });
    return avatarUrl;
  },

  async getPrivacySettings(): Promise<PrivacySettings> {
    const res = await api.get<{ data: PrivacySettings }>('/users/me/privacy');
    return res.data;
  },

  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    const res = await api.put<{ data: PrivacySettings }>('/users/me/privacy', settings);
    return res.data;
  },

  async getBlockedUsers(): Promise<BlockedUser[]> {
    const res = await api.get<{ data: BlockedUser[] }>('/users/me/blocked');
    return res.data;
  },

  async blockUser(user: { id: string; name: string; avatar: string }): Promise<BlockedUser> {
    await api.post(`/users/${user.id}/block`);
    return { ...user, blockedAt: new Date() };
  },

  async unblockUser(userId: string): Promise<void> {
    await api.delete(`/users/${userId}/block`);
  },

  async getStorageStats(): Promise<StorageStats> {
    // Server doesn't have a storage endpoint — return local estimate
    return {
      totalSize: 0,
      mediaSize: 0,
      documentsSize: 0,
      cacheSize: 0,
      messagesCount: 0,
      mediaCount: 0,
    };
  },

  async clearCache(): Promise<void> {
    // Clear local caches
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  },

  async clearAllData(): Promise<void> {
    localStorage.clear();
    await profileApi.clearCache();
  },

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },

  async requestAccountDeletion(_password: string): Promise<{ success: boolean; error?: string }> {
    try {
      await api.delete('/users/me');
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },

  async getFAQs(): Promise<FAQItem[]> {
    return [
      {
        id: '1',
        question: 'How do I change my profile picture?',
        answer: 'Go to Settings > Edit Profile and tap on your profile picture.',
        category: 'Account',
      },
      {
        id: '2',
        question: 'How do I enable dark mode?',
        answer: 'Go to Settings > Appearance > Theme and select Dark mode.',
        category: 'Appearance',
      },
      {
        id: '3',
        question: 'How can I block someone?',
        answer: 'Open the chat, tap on the user name, scroll down and tap Block.',
        category: 'Privacy',
      },
      {
        id: '4',
        question: 'What is Vanish Mode?',
        answer: 'Vanish Mode makes messages disappear after they are viewed.',
        category: 'Features',
      },
    ];
  },

  async submitFeedback(message: string, category: string): Promise<{ success: boolean }> {
    // Future: POST /feedback
    console.info('Feedback submitted:', { message, category });
    return { success: true };
  },
};

// Legacy export name used by some components
export const mockProfileApi = profileApi;
