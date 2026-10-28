import { useSyncExternalStore } from 'react';
import { THEMES, DEFAULT_THEME_ID } from '../config/themes';

// The saved theme is also read by the inline script in index.html, so the page draws in the
// right colors before React loads. Keep the key and stored shape in sync with that script.
export const THEME_STORAGE_KEY = 'theme';

// Dark themes derive their colors with color-mix(), so older browsers stay on Light
export const themesSupported =
  typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('color', 'color-mix(in oklab, red, blue)');

const findTheme = (id) => THEMES.find((theme) => theme.id === id);

let currentId = DEFAULT_THEME_ID;
const listeners = new Set();

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme.id === DEFAULT_THEME_ID) {
    root.removeAttribute('data-theme');
    root.style.removeProperty('--theme-bg');
    root.style.removeProperty('--theme-main');
    root.style.removeProperty('--theme-sub');
  } else {
    root.style.setProperty('--theme-bg', theme.background);
    root.style.setProperty('--theme-main', theme.main);
    root.style.setProperty('--theme-sub', theme.sub);
    root.setAttribute('data-theme', theme.id);
  }
}

function saveTheme(theme) {
  try {
    if (theme.id === DEFAULT_THEME_ID) {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      const { id, background, main, sub } = theme;
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ id, background, main, sub }));
    }
  } catch {
    // Without storage the theme just lasts until the page is closed
  }
}

// Called once before the app renders: reapplies the saved theme with its current colors from
// config/themes.js, or falls back to Light if it no longer exists
export function initTheme() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    // Unreadable value: clear it so the page starts from Light
    try {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } catch {
      // Storage unavailable
    }
  }

  const theme = (themesSupported && saved && findTheme(saved.id)) || findTheme(DEFAULT_THEME_ID);
  currentId = theme.id;
  applyTheme(theme);
  // Refresh the stored colors, or clear a theme that's gone
  if (saved) saveTheme(theme);
}

export function setTheme(id) {
  const theme = findTheme(id);
  if (!theme || (!themesSupported && id !== DEFAULT_THEME_ID)) return;
  currentId = theme.id;
  applyTheme(theme);
  saveTheme(theme);
  listeners.forEach((listener) => listener());
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getCurrentThemeId = () => currentId;

// The current theme id, re-rendering the component whenever it changes
export function useTheme() {
  return useSyncExternalStore(subscribe, () => currentId);
}

// Turns a CSS color variable into rgb() for libraries like Chart.js that can't read color-mix()
export function resolveCssColor(variable, alpha = 1) {
  const probe = document.createElement('span');
  probe.style.color = `var(${variable})`;
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = computed;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
