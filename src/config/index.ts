// ─── Central config — all env vars accessed here, never inline ─────────────
// Set these in your .env file at the project root

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

// Auth cookie name — must match backend AUTH.COOKIE_NAME
export const AUTH_COOKIE = 'relay_token';

// Local-storage keys
export const STORAGE_KEYS = {
  USER:              'relay-user',
  SETTINGS_THEME:    'settings_theme',
  SETTINGS_LANGUAGE: 'settings_language',
  SETTINGS_TONE:     'settings_tone',
  SETTINGS_NOTIFS:   'settings_notifications',
  SETTINGS_RECEIPTS: 'settings_readReceipts',
  SETTINGS_TYPING:   'settings_typingIndicators',
  SETTINGS_MEDIA:    'settings_mediaAutoDownload',
  SETTINGS_FONT:     'settings_fontSize',
  NOTIF_PREFS:       'notification_preferences',
} as const;

// File upload limits (keep in sync with BE)
export const UPLOAD = {
  MAX_SIZE_BYTES: 25 * 1024 * 1024,
  ALLOWED_MIMES: [
    'image/jpeg','image/png','image/gif','image/webp',
    'video/mp4','video/webm',
    'audio/mpeg','audio/ogg','audio/webm','audio/wav',
    'application/pdf','application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ] as string[],
} as const;

// Socket event names — mirror backend SOCKET_EVENTS
export const SOCKET_EVENTS = {
  PRESENCE_INIT:  'presence:init',
  USER_ONLINE:    'user:online',
  USER_OFFLINE:   'user:offline',

  MSG_SEND:       'message:send',
  MSG_NEW:        'message:new',
  MSG_SENT:       'message:sent',
  MSG_DELIVERED:  'message:delivered',
  MSG_READ:       'message:read',
  MSG_DELETE:     'message:delete',
  MSG_DELETED:    'message:deleted',
  MSG_EDIT:       'message:edit',
  MSG_EDITED:     'message:edited',
  MSG_FAILED:     'message:failed',

  MSG_REACT:      'message:react',
  MSG_UNREACT:    'message:unreact',
  REACTION_ADDED: 'reaction:added',
  REACTION_REMOVED:'reaction:removed',

  TYPING_START:   'typing:start',
  TYPING_STOP:    'typing:stop',

  CONV_READ:      'conversation:read',
  CONV_NEW:       'conversation:new',

  CALL_INITIATE:  'call:initiate',
  CALL_INCOMING:  'call:incoming',
  CALL_ACCEPT:    'call:accept',
  CALL_ACCEPTED:  'call:accepted',
  CALL_REJECT:    'call:reject',
  CALL_REJECTED:  'call:rejected',
  CALL_END:       'call:end',
  CALL_ENDED:     'call:ended',
  CALL_BUSY:      'call:busy',
} as const;
