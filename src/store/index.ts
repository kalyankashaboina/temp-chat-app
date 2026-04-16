import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import settingsReducer from '@/features/settings/settingsSlice';
import chatReducer from '@/features/chat/chatSlice';
import uiReducer from '@/store/uiSlice';
import notificationReducer from '@/features/notifications/notificationSlice';
import authReducer from '@/features/auth/authSlice';
import { api } from '@/features/api/apiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    settings: settingsReducer,
    chat: chatReducer,
    ui: uiReducer,
    notification: notificationReducer,
    // RTK Query API slice
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'chat/addOwnMessage', 'chat/addIncomingMessage', 'chat/updateMessageStatus',
          'chat/sendMessageAsync/fulfilled', 'chat/sendMessageAsync/pending',
          'chat/retryMessageAsync/fulfilled', 'chat/loadMoreMessagesAsync/fulfilled',
          'chat/enqueueItem', 'chat/addCallToHistory',
        ],
        ignoredPaths: ['chat.messagesMap', 'chat.conversations', 'chat.queue', 'chat.callHistory', 'chat.replyingTo'],
      },
    })
    // Add RTK Query middleware for caching, invalidation, polling, etc.
    .concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks for use throughout the app
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
