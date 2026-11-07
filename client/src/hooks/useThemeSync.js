import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';
import { canUseTheme, getCurrentThemeId, setTheme, subscribeToTheme, themesSupported } from '../utils/theme';

// Keeps a signed-in user's color theme on their account. Mounted once, in App.
//
// Signed out, the theme lives only in localStorage (utils/theme.js), exactly as before.
// Signed in, the account's theme is used, replacing the browser's. An account with no theme yet (new
// accounts, and everyone who signed up before themes were saved) takes the theme the browser already
// has, so nobody's theme resets. Every change while signed in is saved to the account, and still to
// localStorage as a backup: that copy draws the page in the right colors before the account loads, and
// stays in use if the account can't be reached. Signing out keeps the theme that was in use.
export function useThemeSync() {
  const { status, profile } = useAuth();
  const userId = status === 'signedIn' ? profile.id : null;

  useEffect(() => {
    if (!userId) return;
    // Runs once per sign-in, so this is the profile as it was loaded; later profile changes (e.g. from
    // this hook's own saves) don't reapply it
    const sync = { accountTheme: profile.theme ?? null, saving: false, next: null, active: true };

    // Saves run one at a time and only the latest pick is sent, so clicking through themes to compare
    // them can't leave an earlier one on the account
    const save = async (themeId) => {
      sync.next = themeId;
      if (sync.saving) return;
      sync.saving = true;
      while (sync.active && sync.next !== null) {
        const theme = sync.next;
        sync.next = null;
        if (theme === sync.accountTheme) continue;
        try {
          await api.setAccountTheme(theme);
          sync.accountTheme = theme;
        } catch (err) {
          // The browser still has it; the next change tries again
          console.error('Could not save your theme to your account:', err);
        }
      }
      sync.saving = false;
    };

    if (sync.accountTheme === null) {
      if (themesSupported) save(getCurrentThemeId());
    } else if (canUseTheme(sync.accountTheme)) {
      setTheme(sync.accountTheme);
    }
    // Otherwise the account has a theme this site no longer has (or this browser can't show), so the
    // browser's stays in use until the user picks another

    const unsubscribe = subscribeToTheme(() => save(getCurrentThemeId()));
    return () => {
      sync.active = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per signed-in user, see above
  }, [userId]);
}
