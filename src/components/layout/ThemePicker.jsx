import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { THEMES, DEFAULT_THEME_ID } from '../../config/themes';
import { setTheme, useTheme, themesSupported } from '../../utils/theme';
import { SVGIcon } from '../shared/SVGIcon';
import { trackThemeUsed } from '../../utils/analytics';

// Palette button in the navbar. Picking a theme applies it right away and keeps the list open,
// so themes can be compared; Escape, a click outside, or changing page closes it.
export function ThemePicker() {
  const currentTheme = useTheme();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;

    wrapperRef.current?.querySelector('.theme-option.is-selected')?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const handlePointerDown = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [open]);

  if (!themesSupported) return null;

  return (
    <div className="theme-picker" ref={wrapperRef}>
      <button
        type="button"
        ref={buttonRef}
        className="theme-button"
        aria-label="Change color theme"
        title="Color theme"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <SVGIcon type="palette" aria-hidden="true" />
      </button>

      {open && (
        <div className="theme-panel" role="group" aria-label="Color theme">
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
      )}
    </div>
  );
}
