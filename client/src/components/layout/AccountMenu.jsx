import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { themesSupported } from '../../utils/theme';
import { SVGIcon } from '../shared/SVGIcon';
import { ThemeList } from './ThemeList';

// Account button in the navbar. Signed out, it opens the sign-in window (components/auth/AuthModal).
// Signed in, it shows the profile picture (from Google) and a menu: Themes (the color theme list, which
// replaces the navbar's palette button while signed in), Question Bank, Settings and Sign out.
export function AccountMenu() {
  const { authEnabled, status, email, profile, profileError, retryProfile, signOut, openAuthModal } = useAuth();
  const [open, setOpen] = useState(false);
  // 'menu' or 'themes'
  const [view, setView] = useState('menu');
  const [signingOut, setSigningOut] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const location = useLocation();
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);
  const themesItemRef = useRef(null);
  // Set when the user switches views, so focus follows to the new one
  const viewSwitched = useRef(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    setImageFailed(false);
  }, [profile?.imageUrl]);

  useEffect(() => {
    if (!viewSwitched.current) return;
    viewSwitched.current = false;
    if (view === 'themes') wrapperRef.current?.querySelector('.theme-option.is-selected')?.focus();
    else themesItemRef.current?.focus();
  }, [view]);

  // Close on Escape or a click outside
  useEffect(() => {
    if (!open) return;
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

  if (!authEnabled) return null;

  const signedIn = status === 'signedIn' || status === 'error' || status === 'needsUsername';

  const switchView = (next) => {
    viewSwitched.current = true;
    setView(next);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      setOpen(false);
    } catch (err) {
      console.error('Could not sign out:', err);
    } finally {
      setSigningOut(false);
    }
  };

  if (!signedIn) {
    return (
      <div className="account-menu">
        <button
          type="button"
          className="account-button"
          aria-label="Sign in"
          title="Sign in"
          disabled={status === 'loading'}
          onClick={() => openAuthModal('signIn')}
        >
          <SVGIcon type="account" aria-hidden="true" />
        </button>
      </div>
    );
  }

  const name = profile?.username;
  const label = `Account (${name || email})`;
  const showImage = profile?.imageUrl && !imageFailed;

  return (
    <div className="account-menu" ref={wrapperRef}>
      <button
        type="button"
        ref={buttonRef}
        className="account-button is-signed-in"
        aria-label={label}
        title={label}
        aria-expanded={open}
        onClick={() => {
          setOpen((prev) => !prev);
          setView('menu');
        }}
      >
        {showImage ? (
          // no-referrer: Google's image server can refuse requests that send a referrer
          <img className="account-avatar" src={profile.imageUrl} alt="" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} />
        ) : (
          <SVGIcon type="account" aria-hidden="true" />
        )}
      </button>

      {open && view === 'themes' && (
        <div className="account-panel">
          <button type="button" className="account-back" onClick={() => switchView('menu')}>
            <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
            <span>Themes</span>
          </button>
          <ThemeList className="account-theme-list" />
        </div>
      )}

      {open && view === 'menu' && (
        <div className="account-panel">
          <div className="account-header">
            <p className="account-title">{name ? `@${name}` : 'Signed in'}</p>
            <p className="account-text">{email}</p>
          </div>
          {status === 'error' && (
            <div className="account-error">
              <p className="feedback-error" role="alert">
                Your account couldn't be loaded ({profileError}), so progress and favorites aren't being saved.
              </p>
              <button type="button" className="link-button" onClick={retryProfile}>Try again</button>
            </div>
          )}
          <div className="account-items">
            {themesSupported && (
              <button type="button" ref={themesItemRef} className="account-item" onClick={() => switchView('themes')}>
                <i className="fa-solid fa-palette account-item-icon" aria-hidden="true"></i>
                <span className="account-item-label">Themes</span>
                <i className="fa-solid fa-chevron-right account-item-arrow" aria-hidden="true"></i>
              </button>
            )}
            <Link className="account-item" to="/question-bank" onClick={() => setOpen(false)}>
              <i className="fa-solid fa-book account-item-icon" aria-hidden="true"></i>
              <span className="account-item-label">Question Bank</span>
            </Link>
            <Link className="account-item" to="/settings" onClick={() => setOpen(false)}>
              <i className="fa-solid fa-gear account-item-icon" aria-hidden="true"></i>
              <span className="account-item-label">Settings</span>
            </Link>
            <div className="account-items-divider" aria-hidden="true"></div>
            <button type="button" className="account-item" onClick={handleSignOut} disabled={signingOut}>
              <i className="fa-solid fa-arrow-right-from-bracket account-item-icon" aria-hidden="true"></i>
              <span className="account-item-label">{signingOut ? 'Signing out…' : 'Sign out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
