/**
 * Debug Utilities for Event Logging
 * Expose event logger on window object for browser console debugging
 */

import { eventLogger } from '@/shared/services/eventLogger';

// Export functions to window for console access
declare global {
  interface Window {
    $debug: {
      // Get all event logs
      getLogs: () => ReturnType<typeof eventLogger.getLogs>;
      // Get logs for a specific message
      getMessageLogs: (messageId: string) => ReturnType<typeof eventLogger.getLogsForMessage>;
      // Get logs for a specific conversation
      getConversationLogs: (conversationId: string) => ReturnType<typeof eventLogger.getLogsForConversation>;
      // Get message lifecycle (trace from send to delivery)
      getMessageLifecycle: (messageId: string) => ReturnType<typeof eventLogger.getMessageLifecycle>;
      // Print message lifecycle to console
      printMessageLifecycle: (messageId: string) => void;
      // Print all messages that were sent but not received
      printUnreceivedMessages: () => void;
      // Clear all logs
      clearLogs: () => void;
      // Export logs as JSON
      exportLogs: () => string;
      // Get logs by event type
      getLogsByType: (type: string) => ReturnType<typeof eventLogger.getLogsByType>;
      // Get current logging status
      isLoggingEnabled: () => boolean;
      // Enable/disable logging
      setLoggingEnabled: (enabled: boolean) => void;
    };
  }
}

/**
 * Initialize debug utilities
 * Call this once on app startup
 */
export function initDebugUtils(): void {
  window.$debug = {
    getLogs: () => eventLogger.getLogs(),
    getMessageLogs: (messageId: string) => eventLogger.getLogsForMessage(messageId),
    getConversationLogs: (conversationId: string) => eventLogger.getLogsForConversation(conversationId),
    getMessageLifecycle: (messageId: string) => eventLogger.getMessageLifecycle(messageId),
    printMessageLifecycle: (messageId: string) => eventLogger.printMessageSummary(messageId),
    printUnreceivedMessages: () => eventLogger.printUnreceivedMessages(),
    clearLogs: () => eventLogger.clear(),
    exportLogs: () => eventLogger.export(),
    getLogsByType: (type: string) => {
      return eventLogger.getLogsByType(type as any);
    },
    isLoggingEnabled: () => eventLogger.isLoggingEnabled(),
    setLoggingEnabled: (enabled: boolean) => {
      eventLogger.setEnabled(enabled);
      console.log(`Event logging ${enabled ? 'enabled' : 'disabled'}`);
    },
  };

  console.log(
    '%c✓ Debug utilities initialized',
    'color: #00AA00; font-weight: bold;'
  );
  console.log(
    '%cUsage: window.$debug.getLogs(), window.$debug.getMessageLifecycle("messageId"), etc.',
    'color: #666;'
  );
}
