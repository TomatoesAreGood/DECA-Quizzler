import { Router } from 'express';
import { z } from 'zod';
import { signInLimiter } from '../middleware/rateLimit.ts';
import { HttpError, validate } from '../lib/http.ts';

const router = Router();

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

// GOOGLE_TOKEN_URL is only for tests (a stand-in for Google); leave it unset
const GOOGLE_TOKEN_URL = process.env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token';
const GOOGLE_TIMEOUT_MS = 10000;

const googleBody = z.strictObject({ code: z.string().min(1).max(2048) });

// POST api/auth/google
// Google sign-in with the site's own button. The site opens Google's popup (the code flow), Google
// gives the page a one-time code, and this swaps the code for the user's Google ID token and access
// token. That needs the client secret, which is why it happens here. The site then signs in to
// Supabase with them (supabase.auth.signInWithIdToken), so nothing about the user is stored here.
//
// Needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET: the OAuth client entered in Supabase's Google
// provider. Without them this answers 503 GOOGLE_NOT_CONFIGURED and the site uses the redirect
// sign-in instead.
router.post('/google', signInLimiter(), async (req, res) => {
  const { code } = validate(googleBody, req.body);
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new HttpError(503, 'Google sign-in is not set up on the server', { code: 'GOOGLE_NOT_CONFIGURED' });
  }

  let response: Response;
  try {
    response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        // What Google's popup code flow uses in place of a redirect address
        redirect_uri: 'postmessage',
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS),
    });
  } catch (err) {
    console.error('Google token request failed:', err);
    throw new HttpError(502, "Couldn't reach Google. Try again.", { code: 'GOOGLE_UNREACHABLE' });
  }

  const data = (await response.json().catch(() => null)) as { id_token?: unknown; access_token?: unknown; error?: unknown } | null;
  if (!response.ok) {
    const error = typeof data?.error === 'string' ? data.error : `status ${response.status}`;
    // The code was already used, expired, or wasn't issued to this client
    if (error === 'invalid_grant') {
      throw new HttpError(400, "Google sign-in didn't go through. Try again.", { code: 'GOOGLE_CODE_INVALID' });
    }
    // Wrong client ID or secret, or the client isn't allowed this flow: a setup problem
    console.error('Google rejected the code exchange:', error);
    if (error === 'invalid_client' || error === 'unauthorized_client') {
      throw new HttpError(503, 'Google sign-in is not set up correctly on the server', { code: 'GOOGLE_NOT_CONFIGURED' });
    }
    throw new HttpError(502, "Google sign-in didn't go through. Try again.", { code: 'GOOGLE_EXCHANGE_FAILED' });
  }
  if (typeof data?.id_token !== 'string' || typeof data.access_token !== 'string') {
    console.error('Google returned no ID token or access token (is "openid" in the requested scope?)');
    throw new HttpError(502, "Google sign-in didn't go through. Try again.", { code: 'GOOGLE_EXCHANGE_FAILED' });
  }

  // Supabase checks the ID token's at_hash claim against the access token it was issued with, so both
  // go back. The access token only allows reading the user's basic profile (the openid, email and
  // profile scopes) and expires within the hour; there's no refresh token.
  res.json({ idToken: data.id_token, accessToken: data.access_token });
});

export default router;
