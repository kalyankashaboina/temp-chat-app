/**
 * Common constants used across the application
 * Single source of truth for magic numbers and strings
 */

// Message limits
export const MESSAGE_LIMITS = {
  MAX_LENGTH: 10000,
  PREVIEW_LENGTH: 100,
  SEARCH_DEBOUNCE_MS: 300,
} as const;

// File upload
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 25,
  MAX_SIZE_BYTES: 25 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm'],
  ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/ogg', 'audio/webm', 'audio/wav'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
  IMAGE_COMPRESSION: {
    MAX_WIDTH: 1920,
    MAX_HEIGHT: 1080,
    QUALITY: 0.8,
  },
} as const;

// Voice recording
export const VOICE_RECORDING = {
  MAX_DURATION_MS: 10 * 60 * 1000, // 10 minutes
  SAMPLE_RATE: 48000,
  CHANNELS: 1,
} as const;

// Pagination
export const PAGINATION = {
  MESSAGES_PER_PAGE: 40,
  CONVERSATIONS_PER_PAGE: 20,
  USERS_PER_PAGE: 20,
  SCROLL_THRESHOLD: 100, // pixels from top to trigger load more
} as const;

// Timeouts & Intervals
export const TIMEOUTS = {
  TYPING_TIMEOUT_MS: 8000,
  TOAST_DURATION_MS: 3000,
  RETRY_DELAY_MS: 1000,
  DEBOUNCE_MS: 300,
} as const;

// Animation durations
export const ANIMATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// WebRTC
export const WEBRTC = {
  ICE_CONNECTION_TIMEOUT_MS: 10000,
  CALL_TIMEOUT_MS: 60000,
  RING_DURATION_MS: 30000,
} as const;

// Validation
export const VALIDATION = {
  USERNAME_MIN: 3,
  USERNAME_MAX: 50,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
  BIO_MAX: 300,
  GROUP_NAME_MAX: 100,
} as const;

// UI
export const UI = {
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  SIDEBAR_WIDTH: 280,
  HEADER_HEIGHT: 64,
  AVATAR_SIZES: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  },
} as const;

// Storage keys
export const STORAGE_KEYS = {
  USER: 'relay-user',
  THEME: 'relay-theme',
  LANGUAGE: 'relay-language',
  SETTINGS: 'relay-settings',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_FAILED: 'Authentication failed. Please login again.',
  FILE_TOO_LARGE: `File size exceeds ${FILE_UPLOAD.MAX_SIZE_MB}MB limit.`,
  INVALID_FILE_TYPE: 'Invalid file type.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
} as const;
