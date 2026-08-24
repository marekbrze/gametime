import { useLocalStorage } from '@/shared/hooks/use-local-storage';
import { DEFAULT_SETTINGS, type UserSettings } from '../types';

const SETTINGS_KEY = 'gametime.settings';

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<UserSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);

  const updateTimezone = (timezone: string) => setSettings({ ...settings, timezone });
  const updateViewMode = (viewMode: UserSettings['viewMode']) => setSettings({ ...settings, viewMode });
  const reset = () => setSettings(DEFAULT_SETTINGS);

  return { settings, setSettings, updateTimezone, updateViewMode, reset };
}
