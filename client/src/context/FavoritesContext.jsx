import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import * as api from '../lib/api';

const FavoritesContext = createContext(null);

// Favorites are { [examCode]: questionNumber[] } everywhere in the app.
// Signed out, they live in localStorage under "favExams", as before. Signed in, they live on the
// server. The first time someone signs in on a browser, the favorites saved there are added to their
// account and removed from localStorage, so later sign-ins don't bring back ones they've removed.
const STORAGE_KEY = 'favExams';

// Same rules as the server (server/src/lib/schemas.ts), so one bad entry can't block an import
const EXAM_CODE = /^[A-Za-z0-9][A-Za-z0-9.-]*$/;
const isQuestionNum = (n) => Number.isInteger(n) && n >= 1 && n <= 32767;

function sanitizeForImport(favorites) {
  const clean = {};
  if (!favorites || typeof favorites !== 'object' || Array.isArray(favorites)) return clean;
  for (const [examCode, numbers] of Object.entries(favorites)) {
    if (examCode.length > 32 || !EXAM_CODE.test(examCode) || !Array.isArray(numbers)) continue;
    const valid = [...new Set(numbers.filter(isQuestionNum))].slice(0, 1000);
    if (valid.length > 0) clean[examCode] = valid;
  }
  return clean;
}

// [{ examCode, questionNum }] from the API -> { [examCode]: number[] }
function toMap(list) {
  const map = {};
  for (const { examCode, questionNum } of list) (map[examCode] ??= []).push(questionNum);
  return map;
}

function withFavorite(favorites, examCode, questionNum, favorited) {
  const next = { ...(favorites ?? {}) };
  const current = next[examCode] ?? [];
  if (favorited) {
    if (!current.includes(questionNum)) next[examCode] = [...current, questionNum];
  } else {
    const remaining = current.filter((n) => n !== questionNum);
    if (remaining.length > 0) next[examCode] = remaining;
    else delete next[examCode];
  }
  return next;
}

function readLocalFavorites() {
  try {
    const item = window.localStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

export function FavoritesProvider({ children }) {
  const { status } = useAuth();
  const signedIn = status === 'signedIn';
  const [localFavorites, setLocalFavorites] = useLocalStorage(STORAGE_KEY, null);
  // Signed-in favorites; null until loaded
  const [serverFavorites, setServerFavorites] = useState(null);
  const serverFavoritesRef = useRef(null);
  // Saves still running for each question, so quick repeat clicks reach the server in order
  const pendingSaves = useRef(new Map());
  // Bumped on sign-in/out so results from an earlier session are ignored
  const sessionRef = useRef(0);

  const setServer = useCallback((favorites) => {
    serverFavoritesRef.current = favorites;
    setServerFavorites(favorites);
  }, []);

  // Reloads the signed-in favorites from the server, e.g. after a save failed
  const resync = useCallback(async (session) => {
    try {
      const list = await api.getFavorites();
      if (sessionRef.current === session) setServer(toMap(list));
    } catch (err) {
      console.error('Could not load favorites:', err);
    }
  }, [setServer]);

  useEffect(() => {
    const session = ++sessionRef.current;
    pendingSaves.current = new Map();
    setServer(null);
    if (!signedIn) return;

    (async () => {
      const local = sanitizeForImport(readLocalFavorites());
      try {
        if (Object.keys(local).length > 0) {
          const { favorites } = await api.importFavorites(local);
          // Only forget the browser's copy once the account has it
          setLocalFavorites(null);
          if (sessionRef.current === session) setServer(toMap(favorites));
        } else {
          const list = await api.getFavorites();
          if (sessionRef.current === session) setServer(toMap(list));
        }
      } catch (err) {
        console.error('Could not load favorites:', err);
        // Show none rather than loading forever; saving a favorite still works and reloads the list
        if (sessionRef.current === session) setServer({});
      }
    })();
  }, [signedIn, setServer, setLocalFavorites]);

  const toggleFavorite = useCallback((examCode, questionNumber) => {
    if (!signedIn) {
      // Read fresh from localStorage in case another tab changed it
      const current = readLocalFavorites();
      const next = withFavorite(current, examCode, questionNumber, !current?.[examCode]?.includes(questionNumber));
      setLocalFavorites(Object.keys(next).length > 0 ? next : null);
      return;
    }

    const session = sessionRef.current;
    const favorited = !serverFavoritesRef.current?.[examCode]?.includes(questionNumber);
    setServer(withFavorite(serverFavoritesRef.current, examCode, questionNumber, favorited));

    // Each save sends the state the user just chose, after any earlier save for the same question
    const key = `${examCode}#${questionNumber}`;
    const previous = pendingSaves.current.get(key) ?? Promise.resolve();
    const save = previous
      .then(() => (favorited ? api.addFavorite(examCode, questionNumber) : api.removeFavorite(examCode, questionNumber)))
      .catch((err) => {
        console.error('Could not save favorite:', err);
        if (sessionRef.current === session) return resync(session);
      })
      .finally(() => {
        if (pendingSaves.current.get(key) === save) pendingSaves.current.delete(key);
      });
    pendingSaves.current.set(key, save);
  }, [signedIn, setServer, setLocalFavorites, resync]);

  const value = useMemo(() => {
    const favExams = signedIn ? serverFavorites : localFavorites;
    return {
      favExams,
      // False while sign-in is being checked or signed-in favorites are loading
      loaded: status !== 'loading' && (!signedIn || serverFavorites !== null),
      isFavorite: (examCode, questionNumber) => Boolean(favExams?.[examCode]?.includes(questionNumber)),
      toggleFavorite,
    };
  }, [signedIn, status, serverFavorites, localFavorites, toggleFavorite]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavoritesContext() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used inside <FavoritesProvider>');
  return context;
}
