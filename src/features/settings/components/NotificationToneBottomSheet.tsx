import { Bell, BellRing, Volume2, VolumeX, Music } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateNotificationTone, NotificationTone } from '@/features/settings/settingsSlice';
import { closeBottomSheet } from '@/store/uiSlice';
import { SettingsBottomSheet } from './SettingsBottomSheet';

const toneOptions = [
  {
    value: 'default' as NotificationTone,
    label: 'Default',
    icon: <Bell className="h-5 w-5 text-primary" />,
    description: 'Standard notification sound',
  },
  {
    value: 'chime' as NotificationTone,
    label: 'Chime',
    icon: <Music className="h-5 w-5 text-emerald-500" />,
    description: 'Gentle melodic chime',
  },
  {
    value: 'bell' as NotificationTone,
    label: 'Bell',
    icon: <BellRing className="h-5 w-5 text-amber-500" />,
    description: 'Classic bell ring',
  },
  {
    value: 'pop' as NotificationTone,
    label: 'Pop',
    icon: <Volume2 className="h-5 w-5 text-blue-500" />,
    description: 'Quick pop sound',
  },
  {
    value: 'silent' as NotificationTone,
    label: 'Silent',
    icon: <VolumeX className="h-5 w-5 text-muted-foreground" />,
    description: 'No sound, vibration only',
  },
];

export function NotificationToneBottomSheet() {
  const dispatch = useAppDispatch();
  const { notificationTone, isSaving } = useAppSelector((state) => state.settings);
  const { activeBottomSheet } = useAppSelector((state) => state.ui);

  const handleConfirm = async (value: NotificationTone) => {
    await dispatch(updateNotificationTone(value));
    dispatch(closeBottomSheet());
  };

  return (
    <SettingsBottomSheet
      open={activeBottomSheet === 'notificationTone'}
      onClose={() => dispatch(closeBottomSheet())}
      title="Notification Tone"
      options={toneOptions}
      currentValue={notificationTone}
      onConfirm={handleConfirm}
      isLoading={isSaving}
    />
  );
}
