import { useMemo } from 'react';
import { useLocalStorage } from '@/shared/hooks/use-local-storage';
import type { FavoriteTeam } from '../types';

const FAVORITES_KEY = 'gametime.favoriteTeams';

/**
 * Sanityzacja kształtu jak w watchlist (harden #1, ADR-0018) + dedup po teamId
 * (harden #9, ADR-0024 — ręcznie zedytowany storage nie dubluje kafli).
 */
function sanitizeFavorites(raw: unknown): FavoriteTeam[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: FavoriteTeam[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const teamId = (entry as { teamId?: unknown }).teamId;
    if (typeof teamId !== 'string' || seen.has(teamId)) continue;
    seen.add(teamId);
    const addedAt = (entry as { addedAt?: unknown }).addedAt;
    result.push({
      teamId,
      addedAt: typeof addedAt === 'string' ? addedAt : new Date(0).toISOString(),
    });
  }
  return result;
}

export function useFavoriteTeams() {
  const [rawFavorites, setFavorites, , writeError] = useLocalStorage<unknown>(FAVORITES_KEY, []);

  const favorites = useMemo(() => sanitizeFavorites(rawFavorites), [rawFavorites]);

  const favoriteTeamIds = useMemo(() => favorites.map((f) => f.teamId), [favorites]);
  const isFavorite = (teamId: string) => favoriteTeamIds.includes(teamId);

  // Mutatory funkcyjne (prev => ...) — odroczone wywołania (Undo z toastu po 5s,
  // sprzątanie sierot) nie mogą czytać stanu z renderu, w którym powstały
  // (ta sama lekcja co ADR-0018 w useLocalStorage).
  const toEntries = (prev: unknown): FavoriteTeam[] => (Array.isArray(prev) ? sanitizeFavorites(prev) : []);

  /** Dodaje ulubioną; addedAt pozwala odtworzyć wpis verbatim po Undo (ADR-0024). */
  const add = (teamId: string, addedAt?: string) => {
    setFavorites((prev: unknown) => {
      const list = toEntries(prev);
      if (list.some((f) => f.teamId === teamId)) return list;
      return [...list, { teamId, addedAt: addedAt ?? new Date().toISOString() }];
    });
  };

  const remove = (teamId: string) => {
    setFavorites((prev: unknown) => toEntries(prev).filter((f) => f.teamId !== teamId));
  };

  const toggle = (teamId: string) => {
    setFavorites((prev: unknown) => {
      const list = toEntries(prev);
      return list.some((f) => f.teamId === teamId)
        ? list.filter((f) => f.teamId !== teamId)
        : [...list, { teamId, addedAt: new Date().toISOString() }];
    });
  };

  return {
    favorites,
    favoriteTeamIds,
    isFavorite,
    toggle,
    add,
    remove,
    storageKey: FAVORITES_KEY,
    writeError,
  };
}
