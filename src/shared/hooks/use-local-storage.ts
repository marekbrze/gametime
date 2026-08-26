import { useCallback, useRef, useState } from 'react';

/**
 * LocalStorage z obsługą awarii zapisu (private mode, quota):
 * najpierw zapis, potem setState — na błędzie stan SIĘ NIE ZMIENIA (rollback
 * wizualny: gwiazdka nie "łapie" się, jeśli nic nie zapisano), a `writeError`
 * trafia do UI (banner). Konsument może destrukturyzować krótszą krotkę.
 *
 * Funkcyjne updatory łańcuchują się po refie z ostatnią wartością, nie po
 * stanie z closure'u renderu — dwa wywołania w jednym zdarzeniu (np. remove +
 * add przy migracji gwiazdki na nową instancję, ADR-0018) nie nadpisują się
 * nawzajem.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const latest = useRef(storedValue);
  latest.current = storedValue;

  const [writeError, setWriteError] = useState<unknown>(null);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      const valueToStore = value instanceof Function ? value(latest.current) : value;
      latest.current = valueToStore;
      try {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        setStoredValue(valueToStore);
        setWriteError(null);
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
        setWriteError(error);
      }
    },
    [key],
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      latest.current = initialValue;
      setStoredValue(initialValue);
      setWriteError(null);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
      setWriteError(error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue, writeError] as const;
}
