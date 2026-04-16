import { useState, useEffect, useCallback } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  registration: ServiceWorkerRegistration | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isOnline: navigator.onLine,
    hasUpdate: false,
    registration: null,
  });

  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!state.isSupported) return;

    navigator.serviceWorker.ready.then((registration) => {
      setState(prev => ({ ...prev, isRegistered: true, registration }));

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState(prev => ({ ...prev, hasUpdate: true }));
            }
          });
        }
      });
    });
  }, [state.isSupported]);

  const updateApp = useCallback(() => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [state.registration]);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'denied';
    
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission;
    }
    
    return Notification.permission;
  }, []);

  const showNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    const permission = await requestNotificationPermission();
    
    if (permission === 'granted' && state.registration) {
      // vibrate is supported but not in TypeScript's type definition
      const notificationOptions = {
        icon: '/placeholder.svg',
        badge: '/placeholder.svg',
        ...options,
      };
      state.registration.showNotification(title, notificationOptions);
      
      // Trigger vibration separately for supported devices
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  }, [state.registration, requestNotificationPermission]);

  return {
    ...state,
    updateApp,
    requestNotificationPermission,
    showNotification,
  };
}
