// Google sign-in with the site's own button, in a Google popup (Google Identity Services' code flow).
// The popup gives the page a one-time code; the server swaps it for the user's Google ID token
// (POST /api/auth/google, which needs the client secret); supabase.auth.signInWithIdToken() then turns
// that into a session. The sign-in never goes through the Supabase domain, so Google's window names
// this site.
//
// Needs VITE_GOOGLE_CLIENT_ID: the OAuth client that's entered in Supabase's Google provider, with this
// site (and http://localhost plus http://localhost:5173 for development) as Authorized JavaScript
// origins. Without it, or if Google's script can't load, the site uses the redirect sign-in instead.

export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const LOAD_TIMEOUT_MS = 10000;

let scriptPromise = null;

// Loads Google's script ahead of the click: the popup has to open right inside the click, or the
// browser blocks it. Rejects if the script is blocked or doesn't load in time; a later call tries again.
export function loadGooglePopup() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    const fail = (message) => {
      clearTimeout(timer);
      script.remove();
      scriptPromise = null;
      reject(new Error(message));
    };
    const timer = setTimeout(() => fail("Google's sign-in script took too long to load"), LOAD_TIMEOUT_MS);
    script.onload = () => {
      if (!window.google?.accounts?.oauth2) return fail("Google's sign-in script didn't start");
      clearTimeout(timer);
      resolve();
    };
    script.onerror = () => fail("Google's sign-in script couldn't load");
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function googlePopupReady() {
  return Boolean(window.google?.accounts?.oauth2);
}

// An error with a code saying what happened:
//   'popup_closed'         - the user closed the popup or cancelled
//   'popup_failed_to_open' - the browser blocked the popup
//   'google_error'         - anything else
function popupError(code, message) {
  return Object.assign(new Error(message), { code });
}

function randomState() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
}

// Opens Google's popup and resolves with the one-time code. Call it straight from a click handler
// (no await before it), after loadGooglePopup() has finished.
export function requestGoogleCode() {
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) return Promise.reject(popupError('google_error', "Google's sign-in script isn't loaded"));
  return new Promise((resolve, reject) => {
    // Checked when the code comes back, so a code can only come from the popup opened here
    const state = randomState();
    const client = oauth2.initCodeClient({
      client_id: googleClientId,
      // openid makes Google include the ID token when the server swaps the code
      scope: 'openid email profile',
      ux_mode: 'popup',
      state,
      callback: (response) => {
        if (response?.error) {
          // access_denied: the user pressed Cancel on Google's page
          if (response.error === 'access_denied') reject(popupError('popup_closed', 'Google sign-in was cancelled'));
          else reject(popupError('google_error', response.error_description || `Google sign-in failed (${response.error})`));
          return;
        }
        if (response?.state !== state) {
          reject(popupError('google_error', "Google's answer didn't match this sign-in. Try again."));
          return;
        }
        if (!response.code) {
          reject(popupError('google_error', 'Google sent no sign-in code. Try again.'));
          return;
        }
        resolve(response.code);
      },
      error_callback: (err) => {
        const code = err?.type === 'popup_closed' || err?.type === 'popup_failed_to_open' ? err.type : 'google_error';
        reject(popupError(code, err?.message || 'Google sign-in failed'));
      },
    });
    client.requestCode();
  });
}
