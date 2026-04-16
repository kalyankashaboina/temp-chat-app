import { Sun, Moon, Monitor } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateTheme, Theme } from '@/features/settings/settingsSlice';
import { closeBottomSheet } from '@/store/uiSlice';
import { SettingsBottomSheet } from './SettingsBottomSheet';

const themeOptions = [
  {
    value: 'light' as Theme,
    label: 'Light',
    icon: <Sun className="h-5 w-5 text-amber-500" />,
    description: 'Bright mode for daytime use',
  },
  {
    value: 'dark' as Theme,
    label: 'Dark',
    icon: <Moon className="h-5 w-5 text-indigo-400" />,
    description: 'Easy on the eyes in low light',
  },
  {
    value: 'system' as Theme,
    label: 'System',
    icon: <Monitor className="h-5 w-5 text-muted-foreground" />,
    description: 'Follows your device settings',
  },
];

export function ThemeBottomSheet() {
  const dispatch = useAppDispatch();
  const { theme, isSaving } = useAppSelector((state) => state.settings);
  const { activeBottomSheet } = useAppSelector((state) => state.ui);

  const handleConfirm = async (value: Theme) => {
    await dispatch(updateTheme(value));
    dispatch(closeBottomSheet());
  };

  return (
    <SettingsBottomSheet
      open={activeBottomSheet === 'theme'}
      onClose={() => dispatch(closeBottomSheet())}
      title="Choose Theme"
      options={themeOptions}
      currentValue={theme}
      onConfirm={handleConfirm}
      isLoading={isSaving}
    />
  );
}
