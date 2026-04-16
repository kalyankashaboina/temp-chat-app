import { ThemeBottomSheet } from './ThemeBottomSheet';
import { LanguageBottomSheet } from './LanguageBottomSheet';
import { NotificationToneBottomSheet } from './NotificationToneBottomSheet';
import { FontSizeBottomSheet } from './FontSizeBottomSheet';
import { NotificationSettingsBottomSheet } from './NotificationSettingsBottomSheet';

/**
 * SettingsProvider - Contains all bottom sheet modals for settings
 * This component should be placed at the root level to ensure proper z-index stacking
 */
export function SettingsProvider() {
  return (
    <>
      <ThemeBottomSheet />
      <LanguageBottomSheet />
      <NotificationToneBottomSheet />
      <FontSizeBottomSheet />
      <NotificationSettingsBottomSheet />
    </>
  );
}
