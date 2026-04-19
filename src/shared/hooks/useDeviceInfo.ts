import { useState, useEffect } from 'react';

type Platform = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface DeviceInfo {
  platform: Platform;
  deviceType: DeviceType;
  isTouchDevice: boolean;
  isStandalone: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  prefersReducedMotion: boolean;
  prefersDarkMode: boolean;
  supportsVibration: boolean;
  supportsNotifications: boolean;
  supportsCamera: boolean;
  supportsMicrophone: boolean;
}

function getPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/win/.test(ua)) return 'windows';
  if (/mac/.test(ua)) return 'macos';
  if (/linux/.test(ua)) return 'linux';

  return 'unknown';
}

function getDeviceType(): DeviceType {
  const width = window.innerWidth;

  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export function useDeviceInfo(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => ({
    platform: getPlatform(),
    deviceType: getDeviceType(),
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    isStandalone:
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio || 1,
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    supportsVibration: 'vibrate' in navigator,
    supportsNotifications: 'Notification' in window,
    supportsCamera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    supportsMicrophone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
  }));

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo((prev) => ({
        ...prev,
        deviceType: getDeviceType(),
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
      }));
    };

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setDeviceInfo((prev) => ({ ...prev, prefersReducedMotion: e.matches }));
    };

    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleDarkChange = (e: MediaQueryListEvent) => {
      setDeviceInfo((prev) => ({ ...prev, prefersDarkMode: e.matches }));
    };

    window.addEventListener('resize', handleResize);
    motionQuery.addEventListener('change', handleMotionChange);
    darkQuery.addEventListener('change', handleDarkChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      motionQuery.removeEventListener('change', handleMotionChange);
      darkQuery.removeEventListener('change', handleDarkChange);
    };
  }, []);

  return deviceInfo;
}
