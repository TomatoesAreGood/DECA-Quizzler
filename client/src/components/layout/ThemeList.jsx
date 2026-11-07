import { THEMES, DEFAULT_THEME_ID } from '../../config/themes';
import { setTheme, useTheme } from '../../utils/theme';
import { trackThemeUsed } from '../../utils/analytics';

// The list of color themes, shared by the navbar's palette button (signed out) and the account menu
// (signed in). Picking one applies it right away and keeps the list open, so themes can be compared.
// Saving it to the account, when signed in, happens in hooks/useThemeSync.js.
export function ThemeList({ className }) {
  const currentTheme = useTheme();

  return (
    <div className={className} role="group" aria-label="Color theme">
      {THEMES.map((theme) => {
        const selected = theme.id === currentTheme;
        return (
          <button
            key={theme.id}
            type="button"
            className={`theme-option${selected ? ' is-selected' : ''}`}
            aria-pressed={selected}
            onClick={() => {
              setTheme(theme.id);
              if (theme.id !== DEFAULT_THEME_ID) trackThemeUsed();
            }}
          >
            <span className="theme-swatch" style={{ background: theme.background, borderColor: theme.sub }} aria-hidden="true">
              <span style={{ background: theme.main }}></span>
            </span>
            <span className="theme-option-label">{theme.label}</span>
            {selected && <i className="fa-solid fa-check theme-option-check" aria-hidden="true"></i>}
          </button>
        );
      })}
    </div>
  );
}
