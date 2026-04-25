/**
 * Event Logger Singleton
 * Logs all message events for debugging and troubleshooting
 * Helps track message lifecycle: sent -> confirmed -> delivered -> read
 */

export type EventType =
  | 'SOCKET_CONNECT'
  | 'SOCKET_DISCONNECT'
  | 'MESSAGE_SEND'
  | 'MESSAGE_SENT'
  | 'MESSAGE_CONFIRMED'
  | 'MESSAGE_DELIVERED'
  | 'MESSAGE_READ'
  | 'MESSAGE_DELETED'
  | 'MESSAGE_EDITED'
  | 'MESSAGE_FAILED'
  | 'MESSAGE_RECEIVED'
  | 'MESSAGE_NEW'
  | 'TYPING_START'
  | 'TYPING_STOP'
  | 'REACTION_ADDED'
  | 'REACTION_REMOVED'
  | 'CALL_INCOMING'
  | 'CALL_ACCEPTED'
  | 'CALL_REJECTED'
  | 'CALL_ENDED'
  | 'CONNECTION_STATUS_CHANGE'
  | 'OFFLINE_QUEUE_PROCESS'
  | 'OFFLINE_QUEUE_RETRY'
  | 'FILE_UPLOAD_START'
  | 'FILE_UPLOAD_PROGRESS'
  | 'FILE_UPLOAD_COMPLETE'
  | 'FILE_UPLOAD_FAILED';

export interface EventLog {
  timestamp: Date;
  type: EventType;
  messageId?: string;
  tempId?: string;
  conversationId?: string;
  userId?: string;
  payload?: unknown;
  error?: string;
}

class EventLogger {
  private static instance: EventLogger;
  private logs: EventLog[] = [];
  private maxLogs = 500; // Keep last 500 events
  private isEnabled = true;

  private constructor() {
    // Singleton pattern
  }

  /**
   * Get singleton instance
   */
  static getInstance(): EventLogger {
    if (!EventLogger.instance) {
      EventLogger.instance = new EventLogger();
    }
    return EventLogger.instance;
  }

  /**
   * Log an event
   */
  log(
    type: EventType,
    options?: {
      messageId?: string;
      tempId?: string;
      conversationId?: string;
      userId?: string;
      payload?: unknown;
      error?: string;
    }
  ): void {
    if (!this.isEnabled) return;

    const event: EventLog = {
      timestamp: new Date(),
      type,
      ...options,
    };

    this.logs.push(event);

    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      const style = this.getConsoleStyle(type);
      console.log(`%c[EVENT] ${type}`, style, {
        messageId: options?.messageId,
        tempId: options?.tempId,
        conversationId: options?.conversationId,
        payload: options?.payload,
      });
    }

    // Log errors to console always
    if (options?.error) {
      console.error(`[EVENT ERROR] ${type}:`, options.error);
    }
  }

  /**
   * Get all logs
   */
  getLogs(): EventLog[] {
    return [...this.logs];
  }

  /**
   * Get logs for a specific message
   */
  getLogsForMessage(messageId: string): EventLog[] {
    return this.logs.filter((log) => log.messageId === messageId || log.tempId === messageId);
  }

  /**
   * Get logs for a specific conversation
   */
  getLogsForConversation(conversationId: string): EventLog[] {
    return this.logs.filter((log) => log.conversationId === conversationId);
  }

  /**
   * Get logs by type
   */
  getLogsByType(type: EventType): EventLog[] {
    return this.logs.filter((log) => log.type === type);
  }

  /**
   * Get message lifecycle (all events for a message)
   */
  getMessageLifecycle(messageId: string): EventLog[] {
    return this.logs
      .filter((log) => log.messageId === messageId || log.tempId === messageId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Get current status
   */
  isLoggingEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Print summary of message events
   */
  printMessageSummary(messageId: string): void {
    const lifecycle = this.getMessageLifecycle(messageId);
    console.group(`Message Lifecycle: ${messageId}`);
    lifecycle.forEach((log) => {
      console.log(`${log.timestamp.toISOString()}: ${log.type}`, log.payload || '');
    });
    console.groupEnd();
  }

  /**
   * Print summary of all recent messages not received
   */
  printUnreceivedMessages(): void {
    const sentMessages = this.getLogsByType('MESSAGE_SENT');
    const receivedMessages = this.getLogsByType('MESSAGE_RECEIVED');
    const receivedIds = new Set(receivedMessages.map((log) => log.messageId));

    const unreceived = sentMessages.filter((log) => !receivedIds.has(log.messageId));

    console.group('Messages Sent But Not Received');
    unreceived.forEach((log) => {
      console.log(`${log.timestamp.toISOString()}: ${log.messageId}`, log);
      this.printMessageSummary(log.messageId || '');
    });
    console.groupEnd();
  }

  /**
   * Get console style based on event type
   */
  private getConsoleStyle(type: EventType): string {
    const styles: Record<EventType, string> = {
      SOCKET_CONNECT: 'color: #00AA00; font-weight: bold;',
      SOCKET_DISCONNECT: 'color: #AA0000; font-weight: bold;',
      MESSAGE_SEND: 'color: #0099CC; font-weight: bold;',
      MESSAGE_SENT: 'color: #00AA00; font-weight: bold;',
      MESSAGE_CONFIRMED: 'color: #00AA00; font-weight: bold;',
      MESSAGE_DELIVERED: 'color: #0099CC;',
      MESSAGE_READ: 'color: #0099CC;',
      MESSAGE_DELETED: 'color: #AA0000;',
      MESSAGE_EDITED: 'color: #FFAA00;',
      MESSAGE_FAILED: 'color: #AA0000; font-weight: bold;',
      MESSAGE_RECEIVED: 'color: #00AA00; font-weight: bold;',
      MESSAGE_NEW: 'color: #00AA00;',
      TYPING_START: 'color: #9900CC;',
      TYPING_STOP: 'color: #9900CC;',
      REACTION_ADDED: 'color: #FFAA00;',
      REACTION_REMOVED: 'color: #FFAA00;',
      CALL_INCOMING: 'color: #00AA00; font-weight: bold;',
      CALL_ACCEPTED: 'color: #00AA00; font-weight: bold;',
      CALL_REJECTED: 'color: #AA0000;',
      CALL_ENDED: 'color: #AA0000;',
      CONNECTION_STATUS_CHANGE: 'color: #0099CC; font-weight: bold;',
      OFFLINE_QUEUE_PROCESS: 'color: #FFAA00; font-weight: bold;',
      OFFLINE_QUEUE_RETRY: 'color: #FFAA00;',
      FILE_UPLOAD_START: 'color: #0099CC;',
      FILE_UPLOAD_PROGRESS: 'color: #0099CC;',
      FILE_UPLOAD_COMPLETE: 'color: #00AA00;',
      FILE_UPLOAD_FAILED: 'color: #AA0000;',
    };
    return styles[type] || 'color: #666;';
  }
}

// Export singleton instance
export const eventLogger = EventLogger.getInstance();
