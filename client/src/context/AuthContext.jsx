import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authEnabled, authLinkError, openedFromPasswordResetLink, supabase } from '../lib/supabase';
import * as api from '../lib/api';

const AuthContext = createContext(null);

// Where Google sign-in and email links bring the user back to: the page they're on. Every such address
// must be allowed in Supabase (Authentication > URL Configuration > Redirect URLs), or Supabase sends
// them to the Site URL instead.
function returnUrl() {
  const { origin, pathname, search } = window.location;
  return origin + pathname + search;
}

// status:
//   'loading'       - still finding out whether someone is signed in, or loading their profile
//   'signedOut'     - nobody is signed in (always the case when accounts are turned off)
//   'needsUsername' - signed in, but no username yet; the sign-in window asks for one before anything
//                     is saved to the account
//   'signedIn'      - signed in with a username, so the API can be used
//   'error'         - signed in, but the profile couldn't be loaded (see profileError)
//
// modalView is the sign-in window's screen, or null when it's closed. 'username' and 'newPassword' are
// forced: they show whenever they apply and can't be dismissed.
export function AuthProvider({ children }) {
  // undefined until Supabase reports the saved session (if any), then a session or null
  const [session, setSession] = useState(authEnabled ? undefined : null);
  const sessionRef = useRef(null);
  // The server profile, tagged with the user it belongs to so a stale one is never used.
  // usernameTaken: the username picked at sign-up was taken by someone else in the meantime.
  const [profileState, setProfileState] = useState({ userId: null, profile: null, error: null, usernameTaken: false });
  const [retryCount, setRetryCount] = useState(0);
  // Opened from a password reset link: ask for a new password
  const [recovering, setRecovering] = useState(openedFromPasswordResetLink);
  // The screen the user opened the sign-in window on
  const [requestedView, setRequestedView] = useState(authLinkError ? 'linkError' : null);

  useEffect(() => {
    if (!supabase) return;
    // Fires right away with the saved session (INITIAL_SESSION), then on every sign-in, sign-out and
    // token refresh. Nothing async in here: Supabase warns that awaiting its calls inside this
    // callback can deadlock, so the profile is loaded in the effect below.
    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      sessionRef.current = newSession;
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      if (event === 'SIGNED_OUT') setRecovering(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    // On a retry, show loading again instead of the old error
    setProfileState((state) => (state.userId === userId && state.error ? { userId, profile: null, error: null, usernameTaken: false } : state));
    (async () => {
      try {
        let profile = await api.ensureUser();
        let usernameTaken = false;
        // Email sign-ups pick a username on the form; Supabase keeps it with the account until the
        // email is confirmed, and it's saved here. Google sign-ups are asked for one instead.
        const chosen = sessionRef.current?.user?.user_metadata?.username;
        if (!profile.username && typeof chosen === 'string' && api.USERNAME_PATTERN.test(chosen)) {
          try {
            profile = await api.setUsername(chosen);
          } catch (err) {
            if (err.code !== 'USERNAME_TAKEN') throw err;
            usernameTaken = true;
          }
        }
        if (!cancelled) setProfileState({ userId, profile, error: null, usernameTaken });
      } catch (err) {
        console.error('Could not load your profile:', err);
        if (!cancelled) setProfileState({ userId, profile: null, error: err.message, usernameTaken: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, retryCount]);

  const current = profileState.userId === userId ? profileState : { profile: null, error: null, usernameTaken: false };
  let status;
  if (session === undefined) status = 'loading';
  else if (!session) status = 'signedOut';
  else if (current.profile) status = current.profile.username ? 'signedIn' : 'needsUsername';
  else if (current.error) status = 'error';
  else status = 'loading';

  // Signing in closes the window the user opened (e.g. after confirming their email in another tab)
  useEffect(() => {
    if (status === 'signedIn') setRequestedView(null);
  }, [status]);

  let modalView = requestedView;
  if (recovering && session) modalView = 'newPassword';
  else if (status === 'needsUsername') modalView = 'username';
  else if (status === 'error' && requestedView) modalView = 'accountError';

  const signInWithGoogle = useCallback(async () => {
    // Leaves the site for Google, then comes back to this page signed in
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: returnUrl() } });
    if (error) throw error;
  }, []);

  const signInWithPassword = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  // Returns { needsConfirmation, alreadyRegistered }. needsConfirmation: Supabase emailed a link to
  // confirm first. alreadyRegistered: the email already has an account, so Supabase sent nothing; it
  // signals this with an empty identities list instead of an error.
  const signUp = useCallback(async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: returnUrl(), data: { username } },
    });
    if (error) throw error;
    const alreadyRegistered = Array.isArray(data.user?.identities) && data.user.identities.length === 0;
    return { needsConfirmation: !data.session, alreadyRegistered };
  }, []);

  const resendConfirmation = useCallback(async (email) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: returnUrl() } });
    if (error) throw error;
  }, []);

  const sendPasswordReset = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: returnUrl() });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    setRecovering(false);
  }, []);

  // Saves the username; throws ApiError with code 'USERNAME_TAKEN' if someone else has it
  const chooseUsername = useCallback(async (username) => {
    const profile = await api.setUsername(username);
    setProfileState({ userId: profile.id, profile, error: null, usernameTaken: false });
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const retryProfile = useCallback(() => setRetryCount((count) => count + 1), []);
  const openAuthModal = useCallback((view = 'signIn') => setRequestedView(view), []);
  const closeAuthModal = useCallback(() => setRequestedView(null), []);

  const value = useMemo(() => ({
    authEnabled,
    status,
    email: session?.user?.email ?? null,
    profile: current.profile,
    profileError: current.error,
    usernameTaken: current.usernameTaken,
    // What the username form starts with: the one picked at sign-up, or the start of the email address
    suggestedUsername: suggestUsername(session),
    modalView,
    linkError: authLinkError,
    openAuthModal,
    closeAuthModal,
    signInWithGoogle,
    signInWithPassword,
    signUp,
    resendConfirmation,
    sendPasswordReset,
    updatePassword,
    chooseUsername,
    signOut,
    retryProfile,
  }), [session, status, current.profile, current.error, current.usernameTaken, modalView, openAuthModal, closeAuthModal,
    signInWithGoogle, signInWithPassword, signUp, resendConfirmation, sendPasswordReset, updatePassword, chooseUsername,
    signOut, retryProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function suggestUsername(session) {
  const chosen = session?.user?.user_metadata?.username;
  if (typeof chosen === 'string' && chosen) return chosen;
  const fromEmail = (session?.user?.email ?? '').split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
  return fromEmail.length >= 3 ? fromEmail : '';
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
