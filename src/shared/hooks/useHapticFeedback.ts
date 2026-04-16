import { useCallback } from 'react';
import { useDeviceInfo } from './useDeviceInfo';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const hapticPatterns: Record<HapticType, number[]> = {
  light: [10],
  medium: [20],
  heavy: [30],
  success: [10, 50, 10],
  warning: [30, 50, 30],
  error: [50, 100, 50, 100, 50],
};

export function useHapticFeedback() {
  const { supportsVibration, platform } = useDeviceInfo();

  const trigger = useCallback((type: HapticType = 'light') => {
    if (!supportsVibration) return;

    // iOS uses different API through webkit
    if (platform === 'ios') {
      // Try to use iOS-specific haptic if available
      try {
        const webkit = (window as Window & { webkit?: { messageHandlers?: { haptic?: { postMessage: (msg: string) => void } } } }).webkit;
        if (webkit?.messageHandlers?.haptic) {
          webkit.messageHandlers.haptic.postMessage(type);
          return;
        }
      } catch {
        // Fall back to vibration API
      }
    }

    navigator.vibrate(hapticPatterns[type]);
  }, [supportsVibration, platform]);

  const lightImpact = useCallback(() => trigger('light'), [trigger]);
  const mediumImpact = useCallback(() => trigger('medium'), [trigger]);
  const heavyImpact = useCallback(() => trigger('heavy'), [trigger]);
  const successNotification = useCallback(() => trigger('success'), [trigger]);
  const warningNotification = useCallback(() => trigger('warning'), [trigger]);
  const errorNotification = useCallback(() => trigger('error'), [trigger]);

  return {
    trigger,
    lightImpact,
    mediumImpact,
    heavyImpact,
    successNotification,
    warningNotification,
    errorNotification,
    isSupported: supportsVibration,
  };
}
