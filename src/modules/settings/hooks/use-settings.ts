import { useMemo } from 'react';
import { useLocalStorage } from '@/shared/hooks/use-local-storage';
import { DEFAULT_SETTINGS, type UserSettings } from '../types';
import { sanitizeSettings } from '../lib/sanitize';

const SETTINGS_KEY = 'gametime.settings';

export function useSettings() {
  // Odczyt jako unknown + scalenie z domyślnymi — zepsuty kształt w storage
  // nie może być źródłem białego ekranu (harden watchlist #1, ADR-0018).
  const [rawSettings, setSettings, , writeError] = useLocalStorage<unknown>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS,
  );
  const settings = useMemo(() => sanitizeSettings(rawSettings), [rawSettings]);

  const updateTimezone = (timezone: string) => setSettings({ ...settings, timezone });
  const updateViewMode = (viewMode: UserSettings['viewMode']) => setSettings({ ...settings, viewMode });
  const reset = () => setSettings(DEFAULT_SETTINGS);

  return { settings, setSettings, updateTimezone, updateViewMode, reset, writeError };
}
