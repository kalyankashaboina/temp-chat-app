import { useAppDispatch, useAppSelector } from '@/store';
import { updateLanguage, Language } from '@/features/settings/settingsSlice';
import { closeBottomSheet } from '@/store/uiSlice';
import { SettingsBottomSheet } from './SettingsBottomSheet';

const languageOptions = [
  {
    value: 'en' as Language,
    label: 'English',
    description: 'Default language',
  },
  {
    value: 'es' as Language,
    label: 'Español',
    description: 'Spanish',
  },
  {
    value: 'fr' as Language,
    label: 'Français',
    description: 'French',
  },
  {
    value: 'de' as Language,
    label: 'Deutsch',
    description: 'German',
  },
  {
    value: 'pt' as Language,
    label: 'Português',
    description: 'Portuguese',
  },
];

export function LanguageBottomSheet() {
  const dispatch = useAppDispatch();
  const { language, isSaving } = useAppSelector((state) => state.settings);
  const { activeBottomSheet } = useAppSelector((state) => state.ui);

  const handleConfirm = async (value: Language) => {
    await dispatch(updateLanguage(value));
    dispatch(closeBottomSheet());
  };

  return (
    <SettingsBottomSheet
      open={activeBottomSheet === 'language'}
      onClose={() => dispatch(closeBottomSheet())}
      title="Choose Language"
      options={languageOptions}
      currentValue={language}
      onConfirm={handleConfirm}
      isLoading={isSaving}
    />
  );
}
