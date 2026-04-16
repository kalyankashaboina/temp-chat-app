import { Type } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateFontSize } from '@/features/settings/settingsSlice';
import { closeBottomSheet } from '@/store/uiSlice';
import { SettingsBottomSheet } from './SettingsBottomSheet';

type FontSize = 'small' | 'medium' | 'large';

const fontSizeOptions = [
  {
    value: 'small' as FontSize,
    label: 'Small',
    icon: <Type className="h-4 w-4 text-muted-foreground" />,
    description: 'Compact text size',
  },
  {
    value: 'medium' as FontSize,
    label: 'Medium',
    icon: <Type className="h-5 w-5 text-foreground" />,
    description: 'Default text size',
  },
  {
    value: 'large' as FontSize,
    label: 'Large',
    icon: <Type className="h-6 w-6 text-primary" />,
    description: 'Easier to read',
  },
];

export function FontSizeBottomSheet() {
  const dispatch = useAppDispatch();
  const { fontSize, isSaving } = useAppSelector((state) => state.settings);
  const { activeBottomSheet } = useAppSelector((state) => state.ui);

  const handleConfirm = async (value: FontSize) => {
    await dispatch(updateFontSize(value));
    dispatch(closeBottomSheet());
  };

  return (
    <SettingsBottomSheet
      open={activeBottomSheet === 'fontSize'}
      onClose={() => dispatch(closeBottomSheet())}
      title="Font Size"
      options={fontSizeOptions}
      currentValue={fontSize}
      onConfirm={handleConfirm}
      isLoading={isSaving}
    />
  );
}
