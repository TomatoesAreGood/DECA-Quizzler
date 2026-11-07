import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

// Limits the public username check on the sign-up form: generous for typing, but stops anyone listing
// every username
export function lookupLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (req) => `ip:${ipKeyGenerator(req.ip ?? 'unknown')}`,
    message: { error: 'Too many requests. Try again in a minute.' },
  });
}

// Limits endpoints anyone can post to (reports, feedback). Signed-in users are counted by account,
// everyone else by IP address. Counts are kept in memory, so they reset when the server restarts and
// aren't shared between server instances.
//
// Behind a proxy (Vercel, Render, etc.), set TRUST_PROXY so req.ip is the visitor's address and not
// the proxy's. Otherwise every visitor shares one limit.
export function submissionLimiter() {
  return rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (req) => (req.auth ? `user:${req.auth.sub}` : `ip:${ipKeyGenerator(req.ip ?? 'unknown')}`),
    message: { error: 'Too many submissions. Try again in a few minutes.' },
  });
}
