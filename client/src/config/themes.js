// Site color themes, picked from the palette button in the navbar (see components/layout/ThemePicker.jsx).
// Each theme is five colors; every other color on the site is derived from them in index.css.
//   background: page background
//   main: accent for buttons, links and highlights
//   sub: outlines and secondary accents
//   success, error: right and wrong answers. Dark text sits on them, so keep them bright enough to read.
// Light is the site's original look and uses the colors in index.css; its values here only draw its swatch.
// All other themes are dark themes.
export const THEMES = [
  { id: 'light', label: 'Light', background: '#FFFFFF', main: '#0066CC', sub: '#CBD5DF' },
  { id: 'dark', label: 'Dark', background: '#111111', main: '#C4C1BA', sub: '#444444', success: '#8FCB9B', error: '#E8877F' },
  { id: 'dracula', label: 'Dracula', background: '#282A36', main: '#BD93F9', sub: '#6272A4', success: '#7DD79B', error: '#EE7F7F' },
  { id: 'bento', label: 'Bento', background: '#2D394D', main: '#FF7A90', sub: '#4A768D', success: '#7BD9A6', error: '#F6584F' },
  { id: 'nord', label: 'Nord', background: '#242933', main: '#88C0D0', sub: '#929AAA', success: '#A3D07C', error: '#D9707A' },
  { id: 'sakura', label: 'Sakura', background: '#2A1F2B', main: '#F4A7C1', sub: '#8E5A74', success: '#9CD3A8', error: '#F2605F' },
  { id: 'serika-dark', label: 'Serika Dark', background: '#323437', main: '#E2B714', sub: '#646669', success: '#8DC262', error: '#E0606A' },
  // { id: 'catppuccin', label: 'Catppuccin', background: '#1E1E2E', main: '#CBA6F7', sub: '#7F849C', success: '#A6E3A1', error: '#F38BA8' },
  // { id: 'gruvbox-dark', label: 'Gruvbox Dark', background: '#282828', main: '#D79921', sub: '#665C54', success: '#B8BB26', error: '#FB4934' },
  // { id: 'olivia', label: 'Olivia', background: '#1C1B1D', main: '#DEAF9D', sub: '#4E3E3E', success: '#A8C69F', error: '#E0605A' },
  // { id: 'rose-pine', label: 'Rosé Pine', background: '#1F1D27', main: '#9CCFD8', sub: '#C4A7E7', success: '#8FD19E', error: '#EB6F92' },
  // { id: 'matrix', label: 'Matrix', background: '#000000', main: '#15FF00', sub: '#006500', success: '#15FF00', error: '#FF3B30' },
];

export const DEFAULT_THEME_ID = 'light';

// Analytics counters (see utils/analytics.js), shown on the traffic page: people who have picked a
// theme other than Light, and how many days each theme was in use. Theme ids name the counters,
// so renaming one starts its count over.
export const THEME_USERS_KEY = 'themeUsers';
export const getThemeUsageKey = (themeId) => `theme-${themeId}`;
