import { useState, useEffect, useCallback } from 'react';

interface NetworkInfo {
  isOnline: boolean;
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface NetworkConnection {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

export function useNetworkStatus() {
  const getNetworkInfo = useCallback((): NetworkInfo => {
    const connection = (navigator as Navigator & { connection?: NetworkConnection }).connection;
    
    return {
      isOnline: navigator.onLine,
      effectiveType: (connection?.effectiveType as NetworkInfo['effectiveType']) || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false,
    };
  }, []);

  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>(getNetworkInfo);

  useEffect(() => {
    const updateNetworkInfo = () => setNetworkInfo(getNetworkInfo());

    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);

    const connection = (navigator as Navigator & { connection?: NetworkConnection }).connection;
    connection?.addEventListener?.('change', updateNetworkInfo);

    return () => {
      window.removeEventListener('online', updateNetworkInfo);
      window.removeEventListener('offline', updateNetworkInfo);
      connection?.removeEventListener?.('change', updateNetworkInfo);
    };
  }, [getNetworkInfo]);

  const isSlowConnection = networkInfo.effectiveType === '2g' || networkInfo.effectiveType === 'slow-2g';
  const shouldReduceData = networkInfo.saveData || isSlowConnection;

  return {
    ...networkInfo,
    isSlowConnection,
    shouldReduceData,
  };
}
