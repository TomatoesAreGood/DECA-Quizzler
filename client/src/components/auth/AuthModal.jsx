import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuth } from '../../context/AuthContext';
import { getEnabledProviders } from '../../lib/supabase';
import { googleClientId, googlePopupReady, loadGooglePopup, requestGoogleCode } from '../../lib/googleSignIn';
import { apiEnabled, checkUsername, USERNAME_PATTERN, USERNAME_RULE } from '../../lib/api';

const MIN_PASSWORD_LENGTH = 8;

// The forms use noValidate: the browser's own validation popups would block submitting before these
// screens can show their messages, and wouldn't match the site's style.

const TITLES = {
  signIn: 'Sign in',
  signUp: 'Create your account',
  checkEmail: 'Check your email',
  forgot: 'Reset your password',
  resetSent: 'Check your email',
  newPassword: 'Choose a new password',
  username: 'Choose a username',
  linkError: "That link didn't work",
  accountError: "Couldn't load your account",
};

// Supabase Auth's error code (see https://supabase.com/docs/guides/auth/debugging/error-codes). The two
// that change what the screen offers are also recognized by their message, in case a response has no code.
function authErrorCode(err) {
  if (err?.code) return err.code;
  if (/invalid login credentials/i.test(err?.message ?? '')) return 'invalid_credentials';
  if (/email not confirmed/i.test(err?.message ?? '')) return 'email_not_confirmed';
  return undefined;
}

// Friendly text for errors from Supabase Auth
function authErrorMessage(err) {
  switch (authErrorCode(err)) {
    case 'invalid_credentials': return 'Wrong email or password.';
    case 'email_not_confirmed': return 'Confirm your email first. We sent you a link when you signed up.';
    case 'user_already_exists':
    case 'email_exists': return 'An account with this email already exists. Sign in instead.';
    case 'weak_password': return err.message || 'Choose a stronger password.';
    case 'same_password': return 'Choose a password different from your current one.';
    case 'email_address_invalid': return "That email address doesn't look right.";
    case 'over_email_send_rate_limit': return 'Too many emails were sent. Wait a few minutes and try again.';
    case 'over_request_rate_limit': return 'Too many attempts. Wait a few minutes and try again.';
    case 'signup_disabled': return 'New sign-ups are turned off right now.';
    default:
      if (err?.status === 0 || err?.name === 'AuthRetryableFetchError') return "Couldn't reach the sign-in service. Check your connection.";
      return err?.message || 'Something went wrong. Please try again.';
  }
}

export function AuthModal() {
  const auth = useAuth();
  const view = auth.modalView;
  // Email typed on one screen carries over to the next (sign in -> forgot password, sign up -> check email)
  const [email, setEmail] = useState('');

  if (!auth.authEnabled) return null;

  const forced = view === 'username' || view === 'newPassword';
  const show = (next) => auth.openAuthModal(next);

  return (
    <Dialog.Root open={Boolean(view)} onOpenChange={(open) => { if (!open && !forced) auth.closeAuthModal(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="auth-overlay" />
        <Dialog.Content
          className="auth-dialog"
          aria-describedby={undefined}
          onEscapeKeyDown={(e) => forced && e.preventDefault()}
          onInteractOutside={(e) => forced && e.preventDefault()}
        >
          <div className="auth-header">
            <span className="auth-brand" aria-hidden="true">
              <span className="logo-deca">DECA</span>
              <span className="auth-brand-divider"></span>
              <span className="logo-quizzler">Quizzer</span>
            </span>
            {!forced && (
              <Dialog.Close className="auth-close" aria-label="Close">×</Dialog.Close>
            )}
          </div>
          <Dialog.Title className="auth-title">{TITLES[view] ?? ''}</Dialog.Title>

          {view === 'signIn' && <SignInView email={email} setEmail={setEmail} show={show} />}
          {view === 'signUp' && <SignUpView email={email} setEmail={setEmail} show={show} />}
          {view === 'checkEmail' && <CheckEmailView email={email} show={show} />}
          {view === 'forgot' && <ForgotView email={email} setEmail={setEmail} show={show} />}
          {view === 'resetSent' && <ResetSentView email={email} show={show} />}
          {view === 'newPassword' && <NewPasswordView />}
          {view === 'username' && <UsernameView />}
          {view === 'linkError' && <LinkErrorView show={show} />}
          {view === 'accountError' && <AccountErrorView />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ---- pieces shared by the screens ----

// Continue with Google. Opens Google's popup when it's ready (the user stays on the page, and Google's
// window names this site); otherwise goes to Google and back (the redirect sign-in).
function GoogleButton({ label }) {
  const { signInWithGoogle, signInWithGoogleCode } = useAuth();
  // idle | popup (Google's popup is open) | signingIn | redirecting
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [googleOff, setGoogleOff] = useState(false);
  const [popupReady, setPopupReady] = useState(googlePopupReady);
  // Only the latest click's popup counts: clicking again (e.g. after losing the popup behind the
  // window) opens a new one, and anything the old one sends back later is ignored
  const attemptRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    // Both are needed before the click: the popup has to open right inside it, or the browser blocks it
    getEnabledProviders().then((providers) => {
      if (mountedRef.current && providers && !providers.google) setGoogleOff(true);
    });
    if (googleClientId && apiEnabled) {
      loadGooglePopup()
        .then(() => mountedRef.current && setPopupReady(true))
        .catch((err) => console.warn('Using the redirect Google sign-in:', err));
    }
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const redirect = async () => {
    setStatus('redirecting');
    try {
      await signInWithGoogle(); // the page goes to Google from here
    } catch (err) {
      console.error('Google sign-in failed:', err);
      if (!mountedRef.current) return;
      setError(authErrorMessage(err));
      setStatus('idle');
    }
  };

  const handleClick = () => {
    setError('');
    if (googleOff) {
      setError("Google sign-in isn't turned on yet. Use your email instead.");
      return;
    }
    if (!popupReady || !googleClientId || !apiEnabled) {
      redirect();
      return;
    }
    const attempt = ++attemptRef.current;
    const current = () => mountedRef.current && attempt === attemptRef.current;
    setStatus('popup');
    // No await before this: it opens the popup
    requestGoogleCode()
      .then(async (code) => {
        if (!current()) return;
        setStatus('signingIn');
        await signInWithGoogleCode(code); // signed in: the window moves on by itself
        if (current()) setStatus('idle');
      })
      .catch((err) => {
        if (!current()) return;
        if (err.code === 'popup_closed') {
          setStatus('idle');
        } else if (err.code === 'popup_failed_to_open' || err.code === 'GOOGLE_NOT_CONFIGURED') {
          // A blocked popup, or a server without the Google client secret: go to Google instead
          console.warn('Using the redirect Google sign-in:', err);
          redirect();
        } else {
          console.error('Google sign-in failed:', err);
          setError(authErrorMessage(err));
          setStatus('idle');
        }
      });
  };

  const busy = status === 'signingIn' || status === 'redirecting';
  let text = label;
  if (status === 'popup') text = 'Continue in the Google window…';
  else if (status === 'signingIn') text = 'Signing in…';
  else if (status === 'redirecting') text = 'Opening Google…';

  return (
    <>
      <button type="button" className="auth-google" onClick={handleClick} disabled={busy} aria-busy={status !== 'idle'}>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        <span>{text}</span>
      </button>
      {error && <p className="feedback-error" role="alert">{error}</p>}
      <div className="auth-divider"><span>or</span></div>
    </>
  );
}

function Field({ id, label, aside, ...inputProps }) {
  return (
    <>
      <div className="auth-label-row">
        <label className="form-label" htmlFor={id}>{label}</label>
        {aside}
      </div>
      <input id={id} className="form-input" {...inputProps} />
    </>
  );
}

function SubmitButton({ busy, busyLabel, children, disabled }) {
  return (
    <button type="submit" className="feedback-submit" disabled={busy || disabled}>
      {busy ? busyLabel : children}
    </button>
  );
}

// "Resend confirmation email", with a short pause between sends
function ResendConfirmation({ email }) {
  const { resendConfirmation } = useAuth();
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  const resend = async () => {
    setStatus('sending');
    try {
      await resendConfirmation(email);
      setStatus('sent');
    } catch (err) {
      console.error('Could not resend confirmation:', err);
      setError(authErrorMessage(err));
      setStatus('error');
    }
  };

  // Inline elements only, since this sits inside a sentence on the "check your email" screen
  if (status === 'sent') return <span className="auth-note" role="status">Sent! Check your email for a new link.</span>;
  return (
    <span className="auth-resend">
      <button type="button" className="link-button" onClick={resend} disabled={status === 'sending' || !email}>
        {status === 'sending' ? 'Sending…' : 'resend the confirmation email'}
      </button>
      {status === 'error' && <span className="auth-inline-error" role="alert">{error}</span>}
    </span>
  );
}

// ---- screens ----

function SignInView({ email, setEmail, show }) {
  const { signInWithPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await signInWithPassword(email.trim(), password);
      // Stays busy: the window closes by itself once the account has loaded
    } catch (err) {
      console.error('Sign-in failed:', err);
      setError(err);
      setBusy(false);
    }
  };

  return (
    <>
      <GoogleButton label="Continue with Google" />
      <form onSubmit={submit} noValidate>
        <Field id="signin-email" label="Email" type="email" autoComplete="email" required value={email}
          onChange={(e) => setEmail(e.target.value)} disabled={busy} />
        <Field id="signin-password" label="Password" type="password" autoComplete="current-password" required value={password}
          onChange={(e) => setPassword(e.target.value)} disabled={busy}
          aside={<button type="button" className="link-button auth-aside" onClick={() => show('forgot')}>Forgot password?</button>} />
        {error && <p className="feedback-error" role="alert">{authErrorMessage(error)}</p>}
        {authErrorCode(error) === 'email_not_confirmed' && <p className="auth-text auth-muted">Didn't get it? <ResendConfirmation email={email.trim()} /></p>}
        <SubmitButton busy={busy} busyLabel="Signing in…" disabled={!email.trim() || !password}>Sign in</SubmitButton>
      </form>
      <p className="auth-footer">
        New to DECA Quizzer?{' '}
        <button type="button" className="link-button" onClick={() => show('signUp')}>Create an account</button>
      </p>
    </>
  );
}

function SignUpView({ email, setEmail, show }) {
  const { signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setUsernameError('');
    if (!USERNAME_PATTERN.test(username)) {
      setUsernameError(USERNAME_RULE);
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError({ message: `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.` });
      return;
    }

    setBusy(true);
    try {
      // Catch a taken username now rather than after the email is confirmed. If the check itself
      // fails, sign up anyway: a taken name is asked for again after confirming.
      const result = await checkUsername(username).catch(() => null);
      if (result && !result.available) {
        setUsernameError('That username is taken. Try another.');
        setBusy(false);
        return;
      }
      const { needsConfirmation, alreadyRegistered } = await signUp(email.trim(), password, username);
      if (alreadyRegistered) {
        setError({ code: 'email_exists' });
        setBusy(false);
        return;
      }
      if (needsConfirmation) show('checkEmail');
      // Otherwise they're signed in already, and the window closes once the account has loaded
    } catch (err) {
      console.error('Sign-up failed:', err);
      setError(err);
      setBusy(false);
    }
  };

  return (
    <>
      <GoogleButton label="Sign up with Google" />
      <form onSubmit={submit} noValidate>
        <Field id="signup-username" label="Username" type="text" autoComplete="username" required value={username}
          maxLength={20} spellCheck={false} autoCapitalize="none"
          onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/\s/g, '')); setUsernameError(''); }} disabled={busy} />
        <p className={usernameError ? 'feedback-error' : 'auth-hint'} role={usernameError ? 'alert' : undefined}>
          {usernameError || USERNAME_RULE}
        </p>
        <Field id="signup-email" label="Email" type="email" autoComplete="email" required value={email}
          onChange={(e) => setEmail(e.target.value)} disabled={busy} />
        <Field id="signup-password" label="Password" type="password" autoComplete="new-password" required value={password}
          onChange={(e) => setPassword(e.target.value)} disabled={busy} />
        <p className="auth-hint">At least {MIN_PASSWORD_LENGTH} characters</p>
        {error && <p className="feedback-error" role="alert">{authErrorMessage(error)}</p>}
        {authErrorCode(error) === 'email_exists' && (
          <p className="auth-text auth-muted">
            Never set a password (e.g. you signed in with Google or an email link)?{' '}
            <button type="button" className="link-button" onClick={() => show('forgot')}>Set one with a reset link</button>
          </p>
        )}
        <SubmitButton busy={busy} busyLabel="Creating account…" disabled={!username || !email.trim() || !password}>Create account</SubmitButton>
      </form>
      <p className="auth-footer">
        Already have an account?{' '}
        <button type="button" className="link-button" onClick={() => show('signIn')}>Sign in</button>
      </p>
    </>
  );
}

function CheckEmailView({ email, show }) {
  return (
    <>
      <p className="auth-text">
        We sent a confirmation link to <strong>{email.trim()}</strong>. Open it to finish creating your account.
      </p>
      <p className="auth-text auth-muted">
        Can't find it? Check your spam folder, or <ResendConfirmation email={email.trim()} />
      </p>
      <button type="button" className="feedback-submit" onClick={() => show('signIn')}>Back to sign in</button>
    </>
  );
}

function ForgotView({ email, setEmail, show }) {
  const { sendPasswordReset } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await sendPasswordReset(email.trim());
      show('resetSent');
    } catch (err) {
      console.error('Password reset failed:', err);
      setError(err);
      setBusy(false);
    }
  };

  return (
    <>
      <p className="auth-text">Enter your account's email and we'll send you a link to choose a new password.</p>
      <form onSubmit={submit} noValidate>
        <Field id="forgot-email" label="Email" type="email" autoComplete="email" required value={email}
          onChange={(e) => setEmail(e.target.value)} disabled={busy} />
        {error && <p className="feedback-error" role="alert">{authErrorMessage(error)}</p>}
        <SubmitButton busy={busy} busyLabel="Sending…" disabled={!email.trim()}>Send reset link</SubmitButton>
      </form>
      <p className="auth-footer">
        <button type="button" className="link-button" onClick={() => show('signIn')}>Back to sign in</button>
      </p>
    </>
  );
}

function ResetSentView({ email, show }) {
  return (
    <>
      <p className="auth-text">
        If there's an account for <strong>{email.trim()}</strong>, we sent it a link to choose a new password.
      </p>
      <button type="button" className="feedback-submit" onClick={() => show('signIn')}>Back to sign in</button>
    </>
  );
}

function NewPasswordView() {
  const { email, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError({ message: `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.` });
      return;
    }
    if (password !== confirm) {
      setError({ message: "The passwords don't match." });
      return;
    }
    setBusy(true);
    try {
      await updatePassword(password);
    } catch (err) {
      console.error('Could not update password:', err);
      setError(err);
      setBusy(false);
    }
  };

  return (
    <>
      <p className="auth-text">For <strong>{email}</strong></p>
      <form onSubmit={submit} noValidate>
        <Field id="new-password" label="New password" type="password" autoComplete="new-password" required value={password}
          onChange={(e) => setPassword(e.target.value)} disabled={busy} />
        <p className="auth-hint">At least {MIN_PASSWORD_LENGTH} characters</p>
        <Field id="confirm-password" label="Confirm new password" type="password" autoComplete="new-password" required value={confirm}
          onChange={(e) => setConfirm(e.target.value)} disabled={busy} />
        {error && <p className="feedback-error" role="alert">{authErrorMessage(error)}</p>}
        <SubmitButton busy={busy} busyLabel="Saving…" disabled={!password || !confirm}>Save password</SubmitButton>
      </form>
    </>
  );
}

function UsernameView() {
  const { email, suggestedUsername, usernameTaken, chooseUsername, signOut } = useAuth();
  const [username, setUsername] = useState(suggestedUsername);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(usernameTaken ? 'The username you picked was taken. Choose another.' : '');

  // The suggestion arrives with the session; fill it in if nothing's been typed yet
  useEffect(() => {
    setUsername((typed) => typed || suggestedUsername);
  }, [suggestedUsername]);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    if (!USERNAME_PATTERN.test(username)) {
      setError(USERNAME_RULE);
      return;
    }
    setBusy(true);
    try {
      await chooseUsername(username); // the window closes once it's saved
    } catch (err) {
      console.error('Could not save username:', err);
      setError(err.code === 'USERNAME_TAKEN' ? 'That username is taken. Try another.' : "Couldn't save your username. Please try again.");
      setBusy(false);
    }
  };

  return (
    <>
      <p className="auth-text">Pick a username for your account. It's how you'll show up on DECA Quizzer.</p>
      <form onSubmit={submit} noValidate>
        <Field id="choose-username" label="Username" type="text" autoComplete="username" required value={username}
          maxLength={20} spellCheck={false} autoCapitalize="none"
          onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/\s/g, '')); setError(''); }} disabled={busy} />
        <p className={error ? 'feedback-error' : 'auth-hint'} role={error ? 'alert' : undefined}>{error || USERNAME_RULE}</p>
        <SubmitButton busy={busy} busyLabel="Saving…" disabled={!username}>Continue</SubmitButton>
      </form>
      <p className="auth-footer">
        Signed in as {email}.{' '}
        <button type="button" className="link-button" onClick={() => signOut().catch((err) => console.error('Could not sign out:', err))}>
          Sign out
        </button>
      </p>
    </>
  );
}

function LinkErrorView({ show }) {
  const { linkError } = useAuth();
  return (
    <>
      <p className="auth-text">{linkError || 'The link is invalid or has expired.'}</p>
      <p className="auth-text auth-muted">Links from our emails only work once and expire after a while. Sign in, or ask for a new one.</p>
      <button type="button" className="feedback-submit" onClick={() => show('signIn')}>Go to sign in</button>
    </>
  );
}

function AccountErrorView() {
  const { profileError, retryProfile, signOut } = useAuth();
  return (
    <>
      <p className="auth-text">You're signed in, but your account couldn't be loaded{profileError ? ` (${profileError})` : ''}.</p>
      <button type="button" className="feedback-submit" onClick={retryProfile}>Try again</button>
      <p className="auth-footer">
        <button type="button" className="link-button" onClick={() => signOut().catch((err) => console.error('Could not sign out:', err))}>
          Sign out
        </button>
      </p>
    </>
  );
}
