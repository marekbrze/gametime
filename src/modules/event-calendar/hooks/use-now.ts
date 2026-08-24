import { useEffect, useState } from 'react';

/** "Teraz" odświeżane co intervalMs — napędza blok Now i statusy pochodne. */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}
