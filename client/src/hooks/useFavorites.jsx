import { useFavoritesContext } from '../context/FavoritesContext';

// { favExams, loaded, isFavorite(examCode, number), toggleFavorite(examCode, number) }
// Signed out, favorites are kept in localStorage; signed in, on the server (see FavoritesContext).
export function useFavorites() {
  return useFavoritesContext();
}
