import { api } from '@/lib/apiClient';
import { STORAGE_KEYS } from '@/config';

// Settings are stored locally + synced to server notification prefs where applicable
export const mockSettingsApi = {
  async updateTheme(theme: string): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.SETTINGS_THEME, JSON.stringify(theme));
  },
  async updateLanguage(language: string): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.SETTINGS_LANGUAGE, JSON.stringify(language));
  },
  async updateNotificationTone(tone: string): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.SETTINGS_TONE, JSON.stringify(tone));
  },
  async updateNotifications(enabled: boolean): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.SETTINGS_NOTIFS, JSON.stringify(enabled));
    try {
      await api.put('/users/me/notifications', { pushEnabled: enabled, messageNotifications: enabled });
    } catch { /* local-only fallback */ }
  },
  async updateReadReceipts(enabled: boolean): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.SETTINGS_RECEIPTS, JSON.stringify(enabled));
    try {
      await api.put('/users/me/privacy', { readReceipts: enabled });
    } catch { /* local-only fallback */ }
  },
  async updateFontSize(size: string): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.SETTINGS_FONT, JSON.stringify(size));
  },
};
