import { Router } from 'express';
import { z } from 'zod';
import { createUser, getUserById, updateUser } from '../db/queries.ts';
import { requireAuth } from '../middleware/auth.ts';
import { currentUserId, HttpError, validate } from '../lib/http.ts';
import { isPrismaError } from '../lib/prisma.ts';
import { userName } from '../lib/schemas.ts';

const router = Router();
router.use(requireAuth);

// Reads a string from the token's user_metadata, where Supabase keeps profile info from
// the sign-in provider (Google sets full_name/name and avatar_url/picture)
function metadataString(metadata: Record<string, unknown> | undefined, ...keys: string[]) {
  for (const key of keys) {
    const value = metadata?.[key];
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
  }
  return null;
}

const createUserBody = z.strictObject({ userName: userName.optional() });
const updateUserBody = z.strictObject({ userName });

// POST api/users
// Creates the signed-in user's row. The id and email come from their access token, never the body.
// Safe to call after every sign-in: if the row already exists, it's returned unchanged (200).
// Body (optional): { userName?: string }, which defaults to the name from the sign-in provider.
router.post('/', async (req, res) => {
  const { sub: id, email, user_metadata: metadata } = req.auth!;
  if (!email) throw new HttpError(400, 'This account has no email address');
  const body = validate(createUserBody, req.body ?? {});

  const existing = await getUserById(id);
  if (existing) {
    res.status(200).json(existing);
    return;
  }

  try {
    const user = await createUser({
      id,
      email,
      userName: body.userName ?? metadataString(metadata, 'full_name', 'name'),
      imageUrl: metadataString(metadata, 'avatar_url', 'picture'),
    });
    res.status(201).json(user);
  } catch (err) {
    if (!isPrismaError(err, 'P2002')) throw err;

    // Two sign-in requests raced and the other one created the row first
    const user = await getUserById(id);
    if (user) {
      res.status(200).json(user);
      return;
    }
    // Another user row already has this email, e.g. left over from a deleted Supabase account
    throw new HttpError(409, 'This email already belongs to another account');
  }
});

// GET api/users/me
router.get('/me', async (req, res) => {
  const user = await getUserById(currentUserId(req));
  if (!user) throw new HttpError(404, 'User profile not found. Create it with POST /api/users.');
  res.json(user);
});

// PATCH api/users/me
// Body: { userName: string }
router.patch('/me', async (req, res) => {
  const body = validate(updateUserBody, req.body ?? {});
  const user = await updateUser(currentUserId(req), body);
  if (!user) throw new HttpError(404, 'User profile not found. Create it with POST /api/users.');
  res.json(user);
});

export default router;
