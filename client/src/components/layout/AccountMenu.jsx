import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SVGIcon } from '../shared/SVGIcon';

// Account button in the navbar. Signed out, it opens the sign-in window (components/auth/AuthModal).
// Signed in, it shows the profile picture (from Google) and a panel with the account and Sign out.
export function AccountMenu() {
  const { authEnabled, status, email, profile, profileError, retryProfile, signOut, openAuthModal } = useAuth();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const location = useLocation();
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    setImageFailed(false);
  }, [profile?.imageUrl]);

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
        onClick={() => setOpen((prev) => !prev)}
      >
        {showImage ? (
          // no-referrer: Google's image server can refuse requests that send a referrer
          <img className="account-avatar" src={profile.imageUrl} alt="" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} />
        ) : (
          <SVGIcon type="account" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div className="account-panel">
          <p className="account-title">{name ? `@${name}` : 'Signed in'}</p>
          <p className="account-text">{email}</p>
          {status === 'error' && (
            <>
              <p className="feedback-error" role="alert">
                Your account couldn't be loaded ({profileError}), so progress and favorites aren't being saved.
              </p>
              <button type="button" className="link-button" onClick={retryProfile}>Try again</button>
            </>
          )}
          <button type="button" className="feedback-submit" onClick={handleSignOut} disabled={signingOut}>
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}
