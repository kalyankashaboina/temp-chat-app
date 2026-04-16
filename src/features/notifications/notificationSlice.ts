import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface NotificationPreferences {
  pushEnabled: boolean;
  messageNotifications: boolean;
  callNotifications: boolean;
  groupNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showPreview: boolean;
}

interface NotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
  preferences: NotificationPreferences;
  isLoading: boolean;
  error: string | null;
}

const loadPreferences = (): NotificationPreferences => {
  try {
    const stored = localStorage.getItem('notification_preferences');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return {
    pushEnabled: true,
    messageNotifications: true,
    callNotifications: true,
    groupNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    showPreview: true,
  };
};

const initialState: NotificationState = {
  permission: typeof window !== 'undefined' && 'Notification' in window 
    ? Notification.permission 
    : 'default',
  isSupported: typeof window !== 'undefined' && 'Notification' in window,
  preferences: loadPreferences(),
  isLoading: false,
  error: null,
};

// Request notification permission
export const requestNotificationPermission = createAsyncThunk(
  'notification/requestPermission',
  async (_, { rejectWithValue }) => {
    try {
      if (!('Notification' in window)) {
        return 'denied' as NotificationPermission;
      }
      const result = await Notification.requestPermission();
      return result;
    } catch (error) {
      return rejectWithValue('Failed to request notification permission');
    }
  }
);

// Update notification preferences
export const updateNotificationPreferences = createAsyncThunk(
  'notification/updatePreferences',
  async (preferences: Partial<NotificationPreferences>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { notification: NotificationState };
      const newPreferences = {
        ...state.notification.preferences,
        ...preferences,
      };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
      
      localStorage.setItem('notification_preferences', JSON.stringify(newPreferences));
      return newPreferences;
    } catch (error) {
      return rejectWithValue('Failed to update notification preferences');
    }
  }
);

// Send a push notification
export const sendPushNotification = createAsyncThunk(
  'notification/sendPush',
  async (
    { title, body, icon, tag, data }: {
      title: string;
      body: string;
      icon?: string;
      tag?: string;
      data?: Record<string, unknown>;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { notification: NotificationState };
      
      if (state.notification.permission !== 'granted') {
        return { success: false, reason: 'Permission not granted' };
      }
      
      if (!state.notification.preferences.pushEnabled) {
        return { success: false, reason: 'Push notifications disabled' };
      }

      const notification = new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        tag,
        badge: '/favicon.ico',
        data,
        silent: !state.notification.preferences.soundEnabled,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      // Vibrate if enabled and supported
      if (state.notification.preferences.vibrationEnabled && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      return { success: true };
    } catch (error) {
      return rejectWithValue('Failed to send notification');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setPermission: (state, action: PayloadAction<NotificationPermission>) => {
      state.permission = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Request permission
    builder.addCase(requestNotificationPermission.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(requestNotificationPermission.fulfilled, (state, action) => {
      state.isLoading = false;
      state.permission = action.payload;
    });
    builder.addCase(requestNotificationPermission.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Update preferences
    builder.addCase(updateNotificationPreferences.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(updateNotificationPreferences.fulfilled, (state, action) => {
      state.isLoading = false;
      state.preferences = action.payload;
    });
    builder.addCase(updateNotificationPreferences.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { setPermission, clearError } = notificationSlice.actions;
export default notificationSlice.reducer;
