import type { NextFunction, Request, Response } from 'express';
import { createRemoteJWKSet, errors, jwtVerify, type JWTPayload } from 'jose';

const { SUPABASE_URL, SUPABASE_JWKS_URL } = process.env;
if (!SUPABASE_URL || !SUPABASE_JWKS_URL) {
  throw new Error('SUPABASE_URL and SUPABASE_JWKS_URL must be set in server/.env');
}

// Supabase signs access tokens with keys published at the JWKS URL. jose fetches and caches them.
const jwks = createRemoteJWKSet(new URL(SUPABASE_JWKS_URL));
const issuer = `${SUPABASE_URL.replace(/\/+$/, '')}/auth/v1`;

export interface AuthClaims extends JWTPayload {
  sub: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthClaims;
    }
  }
}

// The token from an "Authorization: Bearer <token>" header, if there is one
function bearerToken(req: Request) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return undefined;
  return header.slice('Bearer '.length).trim() || undefined;
}

// The token's claims, or null if the token is invalid or expired. Throws if Supabase's keys can't be
// fetched, which is a server problem rather than a bad token, so it becomes a 500.
async function verifyToken(token: string): Promise<AuthClaims | null> {
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer, audience: 'authenticated' });
    return typeof payload.sub === 'string' && payload.sub !== '' ? (payload as AuthClaims) : null;
  } catch (err) {
    if (err instanceof errors.JOSEError && !(err instanceof errors.JWKSTimeout) && !(err instanceof errors.JWKSInvalid)) {
      return null;
    }
    throw err;
  }
}

// Rejects the request unless it has a valid Supabase access token.
// On success, the token's claims are on req.auth; req.auth.sub is the user's id.
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = bearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Missing access token' });
    return;
  }
  const claims = await verifyToken(token);
  if (!claims) {
    res.status(401).json({ error: 'Invalid or expired access token' });
    return;
  }
  req.auth = claims;
  next();
}

// For endpoints that also work signed out: sets req.auth when a token is sent. A token that's sent
// but invalid is still rejected, so the client knows to refresh it instead of posting anonymously.
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  if (req.headers.authorization === undefined) {
    next();
    return;
  }
  await requireAuth(req, res, next);
}
