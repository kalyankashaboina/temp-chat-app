import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { mockSettingsApi } from '@/features/settings/settingsService';

export type Theme = 'dark' | 'light' | 'system';
export type Language = 'en' | 'es';
export type NotificationTone = 'default' | 'chime' | 'bell' | 'pop' | 'silent';

interface SettingsState {
  theme: Theme;
  language: Language;
  notificationTone: NotificationTone;
  notifications: boolean;
  readReceipts: boolean;
  typingIndicators: boolean;
  mediaAutoDownload: boolean;
  fontSize: 'small' | 'medium' | 'large';
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const initialState: SettingsState = {
  theme: loadFromStorage<Theme>('settings_theme', 'dark'),
  language: loadFromStorage<Language>('settings_language', 'en'),
  notificationTone: loadFromStorage<NotificationTone>('settings_tone', 'default'),
  notifications: loadFromStorage<boolean>('settings_notifications', true),
  readReceipts: loadFromStorage<boolean>('settings_readReceipts', true),
  typingIndicators: loadFromStorage<boolean>('settings_typingIndicators', true),
  mediaAutoDownload: loadFromStorage<boolean>('settings_mediaAutoDownload', true),
  fontSize: loadFromStorage<'small' | 'medium' | 'large'>('settings_fontSize', 'medium'),
  isLoading: false,
  isSaving: false,
  error: null,
};

// Async thunks for mock API calls
export const updateTheme = createAsyncThunk(
  'settings/updateTheme',
  async (theme: Theme, { rejectWithValue }) => {
    try {
      await mockSettingsApi.updateTheme(theme);
      localStorage.setItem('settings_theme', JSON.stringify(theme));
      return theme;
    } catch (error) {
      return rejectWithValue('Failed to update theme');
    }
  }
);

export const updateLanguage = createAsyncThunk(
  'settings/updateLanguage',
  async (language: Language, { rejectWithValue }) => {
    try {
      await mockSettingsApi.updateLanguage(language);
      localStorage.setItem('settings_language', JSON.stringify(language));
      return language;
    } catch (error) {
      return rejectWithValue('Failed to update language');
    }
  }
);

export const updateNotificationTone = createAsyncThunk(
  'settings/updateNotificationTone',
  async (tone: NotificationTone, { rejectWithValue }) => {
    try {
      await mockSettingsApi.updateNotificationTone(tone);
      localStorage.setItem('settings_tone', JSON.stringify(tone));
      return tone;
    } catch (error) {
      return rejectWithValue('Failed to update notification tone');
    }
  }
);

export const updateNotifications = createAsyncThunk(
  'settings/updateNotifications',
  async (enabled: boolean, { rejectWithValue }) => {
    try {
      await mockSettingsApi.updateNotifications(enabled);
      localStorage.setItem('settings_notifications', JSON.stringify(enabled));
      return enabled;
    } catch (error) {
      return rejectWithValue('Failed to update notifications');
    }
  }
);

export const updateReadReceipts = createAsyncThunk(
  'settings/updateReadReceipts',
  async (enabled: boolean, { rejectWithValue }) => {
    try {
      await mockSettingsApi.updateReadReceipts(enabled);
      localStorage.setItem('settings_readReceipts', JSON.stringify(enabled));
      return enabled;
    } catch (error) {
      return rejectWithValue('Failed to update read receipts');
    }
  }
);

export const updateFontSize = createAsyncThunk(
  'settings/updateFontSize',
  async (size: 'small' | 'medium' | 'large', { rejectWithValue }) => {
    try {
      await mockSettingsApi.updateFontSize(size);
      localStorage.setItem('settings_fontSize', JSON.stringify(size));
      return size;
    } catch (error) {
      return rejectWithValue('Failed to update font size');
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTypingIndicators: (state, action: PayloadAction<boolean>) => {
      state.typingIndicators = action.payload;
      localStorage.setItem('settings_typingIndicators', JSON.stringify(action.payload));
    },
    setMediaAutoDownload: (state, action: PayloadAction<boolean>) => {
      state.mediaAutoDownload = action.payload;
      localStorage.setItem('settings_mediaAutoDownload', JSON.stringify(action.payload));
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Theme
    builder.addCase(updateTheme.pending, (state) => {
      state.isSaving = true;
      state.error = null;
    });
    builder.addCase(updateTheme.fulfilled, (state, action) => {
      state.isSaving = false;
      state.theme = action.payload;
    });
    builder.addCase(updateTheme.rejected, (state, action) => {
      state.isSaving = false;
      state.error = action.payload as string;
    });

    // Language
    builder.addCase(updateLanguage.pending, (state) => {
      state.isSaving = true;
      state.error = null;
    });
    builder.addCase(updateLanguage.fulfilled, (state, action) => {
      state.isSaving = false;
      state.language = action.payload;
    });
    builder.addCase(updateLanguage.rejected, (state, action) => {
      state.isSaving = false;
      state.error = action.payload as string;
    });

    // Notification Tone
    builder.addCase(updateNotificationTone.pending, (state) => {
      state.isSaving = true;
      state.error = null;
    });
    builder.addCase(updateNotificationTone.fulfilled, (state, action) => {
      state.isSaving = false;
      state.notificationTone = action.payload;
    });
    builder.addCase(updateNotificationTone.rejected, (state, action) => {
      state.isSaving = false;
      state.error = action.payload as string;
    });

    // Notifications
    builder.addCase(updateNotifications.pending, (state) => {
      state.isSaving = true;
    });
    builder.addCase(updateNotifications.fulfilled, (state, action) => {
      state.isSaving = false;
      state.notifications = action.payload;
    });
    builder.addCase(updateNotifications.rejected, (state, action) => {
      state.isSaving = false;
      state.error = action.payload as string;
    });

    // Read Receipts
    builder.addCase(updateReadReceipts.pending, (state) => {
      state.isSaving = true;
    });
    builder.addCase(updateReadReceipts.fulfilled, (state, action) => {
      state.isSaving = false;
      state.readReceipts = action.payload;
    });
    builder.addCase(updateReadReceipts.rejected, (state, action) => {
      state.isSaving = false;
      state.error = action.payload as string;
    });

    // Font Size
    builder.addCase(updateFontSize.pending, (state) => {
      state.isSaving = true;
    });
    builder.addCase(updateFontSize.fulfilled, (state, action) => {
      state.isSaving = false;
      state.fontSize = action.payload;
    });
    builder.addCase(updateFontSize.rejected, (state, action) => {
      state.isSaving = false;
      state.error = action.payload as string;
    });
  },
});

export const { setTypingIndicators, setMediaAutoDownload, clearError } = settingsSlice.actions;
export default settingsSlice.reducer;
