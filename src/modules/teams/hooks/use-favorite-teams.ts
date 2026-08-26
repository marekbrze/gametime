import { useMemo } from 'react';
import { useLocalStorage } from '@/shared/hooks/use-local-storage';
import type { FavoriteTeam } from '../types';

const FAVORITES_KEY = 'gametime.favoriteTeams';

/** Minimalna implementacja na potrzeby MyTeamsFilter i podświetleń — pełny moduł teams dostanie własne lofi.
 * Sanityzacja kształtu jak w watchlist (harden #1, ADR-0018). */
function sanitizeFavorites(raw: unknown): FavoriteTeam[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (entry): entry is FavoriteTeam =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as { teamId?: unknown }).teamId === 'string',
  );
}

export function useFavoriteTeams() {
  const [rawFavorites, setFavorites, , writeError] = useLocalStorage<unknown>(FAVORITES_KEY, []);

  const favorites = useMemo(() => sanitizeFavorites(rawFavorites), [rawFavorites]);

  const favoriteTeamIds = useMemo(() => favorites.map((f) => f.teamId), [favorites]);
  const isFavorite = (teamId: string) => favoriteTeamIds.includes(teamId);

  const toggle = (teamId: string) => {
    if (isFavorite(teamId)) {
      setFavorites(favorites.filter((f) => f.teamId !== teamId));
    } else {
      setFavorites([...favorites, { teamId, addedAt: new Date().toISOString() }]);
    }
  };

  return { favorites, favoriteTeamIds, isFavorite, toggle, storageKey: FAVORITES_KEY, writeError };
}
