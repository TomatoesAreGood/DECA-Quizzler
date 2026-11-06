import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Accounts are only turned on when the Supabase settings are present (see client/.env). Without them
// the site works exactly as before: signed out, with favorites in localStorage.
export const authEnabled = Boolean(url && key);

// Implicit flow: the sign-in link works even when it's opened in a different browser than the one
// that asked for it (e.g. requested on a laptop, opened on a phone).
export const supabase = authEnabled ? createClient(url, key, { auth: { flowType: 'implicit' } }) : null;

// The signed-in user's access token, refreshed first if it has expired. Null when signed out.
export async function getAccessToken() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
