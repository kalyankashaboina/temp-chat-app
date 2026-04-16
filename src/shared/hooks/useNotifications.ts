import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { 
  requestNotificationPermission, 
  sendPushNotification,
  setPermission 
} from '@/features/notifications/notificationSlice';

export function useNotifications() {
  const dispatch = useAppDispatch();
  const { permission, isSupported, preferences, isLoading } = useAppSelector(
    (state) => state.notification
  );

  useEffect(() => {
    // Sync browser permission state on mount
    if ('Notification' in window) {
      dispatch(setPermission(Notification.permission));
    }
  }, [dispatch]);

  const requestPermission = useCallback(async () => {
    const result = await dispatch(requestNotificationPermission());
    return result.payload === 'granted';
  }, [dispatch]);

  const sendNotification = useCallback(
    ({ title, body, icon, tag }: { 
      title: string; 
      body: string; 
      icon?: string; 
      tag?: string;
    }) => {
      dispatch(sendPushNotification({ title, body, icon, tag }));
    },
    [dispatch]
  );

  const notifyNewMessage = useCallback(
    (senderName: string, messagePreview: string) => {
      if (!preferences.messageNotifications) return;
      
      const body = preferences.showPreview 
        ? messagePreview.slice(0, 100) + (messagePreview.length > 100 ? '...' : '')
        : 'You have a new message';
        
      dispatch(sendPushNotification({
        title: `New message from ${senderName}`,
        body,
        tag: 'new-message',
      }));
    },
    [dispatch, preferences.messageNotifications, preferences.showPreview]
  );

  const notifyIncomingCall = useCallback(
    (callerName: string, isVideo: boolean) => {
      if (!preferences.callNotifications) return;
      
      dispatch(sendPushNotification({
        title: `Incoming ${isVideo ? 'video' : 'voice'} call`,
        body: `${callerName} is calling you`,
        tag: 'incoming-call',
      }));
    },
    [dispatch, preferences.callNotifications]
  );

  const notifyGroupMessage = useCallback(
    (groupName: string, senderName: string, messagePreview: string) => {
      if (!preferences.groupNotifications) return;
      
      const body = preferences.showPreview 
        ? `${senderName}: ${messagePreview.slice(0, 80)}${messagePreview.length > 80 ? '...' : ''}`
        : `New message from ${senderName}`;
        
      dispatch(sendPushNotification({
        title: groupName,
        body,
        tag: `group-${groupName}`,
      }));
    },
    [dispatch, preferences.groupNotifications, preferences.showPreview]
  );

  return {
    isSupported,
    permission,
    preferences,
    isLoading,
    requestPermission,
    sendNotification,
    notifyNewMessage,
    notifyIncomingCall,
    notifyGroupMessage,
  };
}
