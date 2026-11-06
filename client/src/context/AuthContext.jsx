import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authEnabled, supabase } from '../lib/supabase';
import { ensureUser } from '../lib/api';

const AuthContext = createContext(null);

// status:
//   'loading'   - still finding out whether someone is signed in, or creating their profile
//   'signedOut' - nobody is signed in (always the case when accounts are turned off)
//   'signedIn'  - signed in, and their profile exists on the server, so the API can be used
//   'error'     - signed in, but their profile couldn't be created (see profileError)
export function AuthProvider({ children }) {
  // undefined until Supabase reports the saved session (if any), then a session or null
  const [session, setSession] = useState(authEnabled ? undefined : null);
  // The server profile, tagged with the user it belongs to so a stale one is never used
  const [profileState, setProfileState] = useState({ userId: null, profile: null, error: null });
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    // Fires right away with the saved session (INITIAL_SESSION), then on every sign-in, sign-out and
    // token refresh. Nothing async in here: Supabase warns that awaiting its calls inside this
    // callback can deadlock, so the profile is loaded in the effect below.
    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    // On a retry, show loading again instead of the old error
    setProfileState((state) => (state.userId === userId && state.error ? { userId, profile: null, error: null } : state));
    ensureUser().then(
      (profile) => {
        if (!cancelled) setProfileState({ userId, profile, error: null });
      },
      (err) => {
        console.error('Could not load your profile:', err);
        if (!cancelled) setProfileState({ userId, profile: null, error: err.message });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [userId, retryCount]);

  const signInWithEmail = useCallback(async (email) => {
    // The link brings them back to the page they're on. That address must be allowed in Supabase
    // (Authentication > URL Configuration > Redirect URLs), or Supabase sends them to the Site URL.
    const { origin, pathname, search } = window.location;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: origin + pathname + search },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const retryProfile = useCallback(() => setRetryCount((count) => count + 1), []);

  const value = useMemo(() => {
    const current = profileState.userId === userId ? profileState : { profile: null, error: null };
    let status;
    if (session === undefined) status = 'loading';
    else if (!session) status = 'signedOut';
    else if (current.profile) status = 'signedIn';
    else if (current.error) status = 'error';
    else status = 'loading';

    return {
      authEnabled,
      status,
      email: session?.user?.email ?? null,
      profile: current.profile,
      profileError: current.error,
      signInWithEmail,
      signOut,
      retryProfile,
    };
  }, [session, userId, profileState, signInWithEmail, signOut, retryProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
