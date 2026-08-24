import { useLocalStorage } from '@/shared/hooks/use-local-storage';
import type { FavoriteTeam } from '../types';

const FAVORITES_KEY = 'gametime.favoriteTeams';

/** Minimalna implementacja na potrzeby MyTeamsFilter i podświetleń — pełny moduł teams dostanie własne lofi. */
export function useFavoriteTeams() {
  const [favorites, setFavorites] = useLocalStorage<FavoriteTeam[]>(FAVORITES_KEY, []);

  const favoriteTeamIds = favorites.map((f) => f.teamId);
  const isFavorite = (teamId: string) => favoriteTeamIds.includes(teamId);

  const toggle = (teamId: string) => {
    if (isFavorite(teamId)) {
      setFavorites(favorites.filter((f) => f.teamId !== teamId));
    } else {
      setFavorites([...favorites, { teamId, addedAt: new Date().toISOString() }]);
    }
  };

  return { favorites, favoriteTeamIds, isFavorite, toggle, storageKey: FAVORITES_KEY };
}
