/**
 * Validation utilities
 * Reusable validation functions
 */

import { FILE_UPLOAD, VALIDATION } from '@/shared/constants';

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate username
 */
export function isValidUsername(username: string): boolean {
  return (
    username.length >= VALIDATION.USERNAME_MIN &&
    username.length <= VALIDATION.USERNAME_MAX &&
    /^[a-zA-Z0-9_]+$/.test(username)
  );
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): boolean {
  return password.length >= VALIDATION.PASSWORD_MIN && password.length <= VALIDATION.PASSWORD_MAX;
}

/**
 * Get password strength level
 */
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length < 8) return 'weak';

  let strength = 0;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  if (strength >= 4) return 'strong';
  if (strength >= 2) return 'medium';
  return 'weak';
}

/**
 * Validate file type
 */
export function isValidFileType(file: File, allowedTypes: readonly string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validate file size
 */
export function isValidFileSize(
  file: File,
  maxBytes: number = FILE_UPLOAD.MAX_SIZE_BYTES
): boolean {
  return file.size <= maxBytes;
}

/**
 * Validate image file
 */
export function isValidImage(file: File): boolean {
  return isValidFileType(file, FILE_UPLOAD.ALLOWED_IMAGE_TYPES) && isValidFileSize(file);
}

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate message content
 */
export function isValidMessage(content: string): boolean {
  return content.trim().length > 0 && content.length <= VALIDATION.GROUP_NAME_MAX * 100;
}

/**
 * Check if string is empty or whitespace
 */
export function isEmpty(value: string): boolean {
  return !value || value.trim().length === 0;
}

/**
 * Check if value is present
 */
export function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
