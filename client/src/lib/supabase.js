import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Accounts are only turned on when the Supabase settings are present (see client/.env). Without them
// the site works exactly as before: signed out, with favorites in localStorage.
export const authEnabled = Boolean(url && key);

// Links in Supabase's emails (and the Google sign-in) come back to the site with the result in the URL
// hash. supabase-js reads and removes it as it starts, so what the site needs is read first:
// whether this is a password reset link, and any error (e.g. an expired link).
const inBrowser = typeof window !== 'undefined';
const hash = new URLSearchParams(inBrowser ? window.location.hash.slice(1) : '');
const query = new URLSearchParams(inBrowser ? window.location.search : '');
export const openedFromPasswordResetLink = hash.get('type') === 'recovery' && hash.has('access_token');

// A failed sign-in puts its error in the hash, and a failed Google sign-in also in the query string.
// Errors are read here and then removed from the address before supabase-js starts, so that:
//  - reloading doesn't show the error again
//  - the error isn't copied into the next sign-in's return address (the current page). supabase-js
//    treats an error anywhere in the URL as a failed sign-in, even next to a valid session.
// An error next to a session (in the hash) is stale and ignored.
const ERROR_PARAMS = ['error', 'error_code', 'error_description'];
const hasError = (params) => ERROR_PARAMS.some((name) => params.has(name));
const signedInByLink = hash.has('access_token');
const errorParams = signedInByLink ? null : [hash, query].find(hasError);
// Null when there's no message, e.g. when the user cancelled on Google's page
export const authLinkError = errorParams?.get('error_description') || null;

if (inBrowser && (hasError(query) || (!signedInByLink && hasError(hash)))) {
  ERROR_PARAMS.forEach((name) => query.delete(name));
  const search = query.toString();
  // A hash with a session is left for supabase-js; one with only an error is dropped
  const keptHash = signedInByLink ? window.location.hash : '';
  window.history.replaceState(window.history.state, '', window.location.pathname + (search ? `?${search}` : '') + keptHash);
}

// Implicit flow: links work even when opened in a different browser than the one that asked for them
// (e.g. signed up on a laptop, confirmed on a phone).
export const supabase = authEnabled ? createClient(url, key, { auth: { flowType: 'implicit' } }) : null;

// The signed-in user's access token, refreshed first if it has expired. Null when signed out.
export async function getAccessToken() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// Which sign-in methods are turned on in the Supabase project (e.g. { google: true, email: true }).
// Null if it couldn't be checked.
let providersPromise = null;
export function getEnabledProviders() {
  if (!authEnabled) return Promise.resolve(null);
  providersPromise ??= fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
    .then((response) => (response.ok ? response.json() : null))
    .then((settings) => settings?.external ?? null)
    .catch(() => null);
  return providersPromise;
}
