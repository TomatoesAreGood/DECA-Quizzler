import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { themesSupported } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';
import { SVGIcon } from '../shared/SVGIcon';
import { ThemeList } from './ThemeList';

// Palette button in the navbar, for visitors who aren't signed in; signed in, themes are in the account
// menu (AccountMenu.jsx). The list stays open while picking, so themes can be compared; Escape, a click
// outside, or changing page closes it.
export function ThemePicker() {
  const { status } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);

  // Also closes on signing in or out, so it isn't left open while hidden
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, status]);

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

  // Hidden while finding out whether someone is signed in, so it doesn't flash for signed-in users
  if (!themesSupported || status !== 'signedOut') return null;

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

      {open && <ThemeList className="theme-panel" />}
    </div>
  );
}
