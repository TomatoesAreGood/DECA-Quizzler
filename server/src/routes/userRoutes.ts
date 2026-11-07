import { Router } from 'express';
import { z } from 'zod';
import { createUser, getUserById, isUsernameTaken, updateUser } from '../db/queries.ts';
import { requireAuth } from '../middleware/auth.ts';
import { lookupLimiter } from '../middleware/rateLimit.ts';
import { currentUserId, HttpError, validate } from '../lib/http.ts';
import { isPrismaError } from '../lib/prisma.ts';
import { themeId, username } from '../lib/schemas.ts';

const router = Router();

const PROFILE_MISSING = 'User profile not found. Create it with POST /api/users.';

// The profile picture Supabase copied from the sign-in provider (Google sets avatar_url and picture).
// Users can edit their own metadata, so only a plain https address is accepted.
function providerImageUrl(metadata: Record<string, unknown> | undefined) {
  for (const key of ['avatar_url', 'picture']) {
    const value = metadata?.[key];
    if (typeof value === 'string' && value.length <= 2048 && /^https:\/\/[^\s]+$/.test(value)) return value;
  }
  return null;
}

const usernameQuery = z.object({ username });
const updateUserBody = z
  .strictObject({ username: username.optional(), theme: themeId.optional() })
  .refine((body) => body.username !== undefined || body.theme !== undefined, 'Send username or theme');

// GET api/users/username-available?username=
// For the sign-up form, before there's an account, so no sign-in needed. Returns
// { username, available } with the username as it would be saved (lowercased).
router.get('/username-available', lookupLimiter(), async (req, res) => {
  const query = validate(usernameQuery, req.query);
  res.json({ username: query.username, available: !(await isUsernameTaken(query.username)) });
});

// POST api/users
// Creates the signed-in user's row. The id and email come from their access token, never the body.
// Safe to call after every sign-in: if the row already exists it's returned (200), with the Google
// profile picture updated if it changed. A new row has no username yet: set it with PATCH /me.
router.post('/', requireAuth, async (req, res) => {
  const { sub: id, email, user_metadata: metadata } = req.auth!;
  if (!email) throw new HttpError(400, 'This account has no email address');
  validate(z.strictObject({}), req.body ?? {});
  const imageUrl = providerImageUrl(metadata);

  const existing = await getUserById(id);
  if (existing) {
    const user = imageUrl && imageUrl !== existing.imageUrl ? await updateUser(id, { imageUrl }) : existing;
    res.status(200).json(user);
    return;
  }

  try {
    res.status(201).json(await createUser({ id, email, imageUrl }));
  } catch (err) {
    if (!isPrismaError(err, 'P2002')) throw err;

    // Two sign-in requests raced and the other one created the row first
    const user = await getUserById(id);
    if (user) {
      res.status(200).json(user);
      return;
    }
    // Another user row already has this email, e.g. left over from a deleted Supabase account
    throw new HttpError(409, 'This email already belongs to another account', { code: 'EMAIL_TAKEN' });
  }
});

// GET api/users/me
router.get('/me', requireAuth, async (req, res) => {
  const user = await getUserById(currentUserId(req));
  if (!user) throw new HttpError(404, PROFILE_MISSING);
  res.json(user);
});

// PATCH api/users/me
// Body: { username?, theme? }, at least one. The username is saved lowercased; 409 with code
// USERNAME_TAKEN if someone else has it. theme is a color theme id, e.g. "dracula".
router.patch('/me', requireAuth, async (req, res) => {
  const body = validate(updateUserBody, req.body ?? {});
  let user;
  try {
    user = await updateUser(currentUserId(req), body);
  } catch (err) {
    if (isPrismaError(err, 'P2002')) throw new HttpError(409, 'That username is taken', { code: 'USERNAME_TAKEN' });
    throw err;
  }
  if (!user) throw new HttpError(404, PROFILE_MISSING);
  res.json(user);
});

export default router;
