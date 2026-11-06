import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SVGIcon } from '../shared/SVGIcon';

// Account button in the navbar. Signed out, it asks for an email and sends a sign-in link.
// Signed in, it shows who's signed in and a Sign out button.
export function AccountMenu() {
  const { authEnabled, status, email, profile, profileError, signInWithEmail, signOut, retryProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [linkStatus, setLinkStatus] = useState('idle'); // idle | sending | sent | error
  const [linkError, setLinkError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const location = useLocation();
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

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

  const sendLink = async (e) => {
    e.preventDefault();
    const address = emailInput.trim();
    if (!address || linkStatus === 'sending') return;
    setLinkStatus('sending');
    try {
      await signInWithEmail(address);
      setLinkStatus('sent');
    } catch (err) {
      console.error('Could not send sign-in link:', err);
      setLinkError(err.status === 429 ? 'Too many sign-in emails were sent. Wait a bit and try again.' : err.message || "Couldn't send the link. Please try again.");
      setLinkStatus('error');
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      setLinkStatus('idle');
      setOpen(false);
    } catch (err) {
      console.error('Could not sign out:', err);
    } finally {
      setSigningOut(false);
    }
  };

  const signedIn = status === 'signedIn' || status === 'error';
  const label = signedIn ? `Account (${email})` : 'Sign in';

  return (
    <div className="account-menu" ref={wrapperRef}>
      <button
        type="button"
        ref={buttonRef}
        className={`account-button${signedIn ? ' is-signed-in' : ''}`}
        aria-label={label}
        title={label}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <SVGIcon type="account" aria-hidden="true" />
      </button>

      {open && (
        <div className="account-panel">
          {status === 'loading' && <p className="account-text">Loading…</p>}

          {status === 'signedOut' && (linkStatus === 'sent' ? (
            <>
              <p className="account-title">Check your email</p>
              <p className="account-text">We sent a sign-in link to {emailInput.trim()}. Open it to finish signing in.</p>
              <button type="button" className="link-button" onClick={() => setLinkStatus('idle')}>Use a different email</button>
            </>
          ) : (
            <form onSubmit={sendLink}>
              <p className="account-title">Sign in</p>
              <p className="account-text">Save your progress and favorites across devices. We'll email you a link; no password needed.</p>
              <label className="form-label" htmlFor="account-email">Email</label>
              <input
                id="account-email"
                className="form-input"
                type="email"
                autoComplete="email"
                required
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (linkStatus === 'error') setLinkStatus('idle');
                }}
                disabled={linkStatus === 'sending'}
              />
              {linkStatus === 'error' && <p className="feedback-error" role="alert">{linkError}</p>}
              <button type="submit" className="feedback-submit" disabled={!emailInput.trim() || linkStatus === 'sending'}>
                {linkStatus === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
              </button>
            </form>
          ))}

          {signedIn && (
            <>
              <p className="account-title">{profile?.userName || 'Signed in'}</p>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
