import { Router } from 'express';
import { z } from 'zod';
import { addFavorites, listFavorites, removeFavorite, type QuestionRef } from '../db/queries.ts';
import { requireAuth } from '../middleware/auth.ts';
import { currentUserId, HttpError, validate } from '../lib/http.ts';
import { isPrismaError } from '../lib/prisma.ts';
import { examCode, questionNum, questionNumParam } from '../lib/schemas.ts';

const router = Router();
router.use(requireAuth);

const PROFILE_MISSING = 'User profile not found. Create it with POST /api/users first.';
const MAX_IMPORT = 20_000;

const questionParams = z.object({ examCode, questionNum: questionNumParam });

// Same shape the site keeps in localStorage under "favExams": { "1027-CORE": [3, 14], ... }
const importBody = z.strictObject({
  favorites: z.record(examCode, z.array(questionNum).max(1000)),
});

// Saves favorites, turning a missing user row into a clear error
async function saveFavorites(userId: string, questions: QuestionRef[]) {
  try {
    return await addFavorites(userId, questions);
  } catch (err) {
    if (isPrismaError(err, 'P2003')) throw new HttpError(409, PROFILE_MISSING);
    throw err;
  }
}

// GET api/favorites
// Every favorited question: [{ examCode, questionNum, createdAt }]
router.get('/', async (req, res) => {
  res.json(await listFavorites(currentUserId(req)));
});

// PUT api/favorites/:examCode/:questionNum
// Favorites a question. 201 if it's new, 200 if it was already a favorite.
router.put('/:examCode/:questionNum', async (req, res) => {
  const question = validate(questionParams, req.params);
  const added = await saveFavorites(currentUserId(req), [question]);
  res.status(added > 0 ? 201 : 200).json(question);
});

// DELETE api/favorites/:examCode/:questionNum
// Unfavorites a question. 204 whether or not it was a favorite.
router.delete('/:examCode/:questionNum', async (req, res) => {
  const question = validate(questionParams, req.params);
  await removeFavorite(currentUserId(req), question);
  res.status(204).end();
});

// POST api/favorites/import
// Merges favorites saved in the browser while signed out. Body: { favorites: { [examCode]: number[] } }
// Returns how many were new, plus the full list afterwards.
router.post('/import', async (req, res) => {
  const { favorites } = validate(importBody, req.body ?? {});

  const unique = new Map<string, QuestionRef>();
  for (const [code, numbers] of Object.entries(favorites)) {
    for (const num of numbers) unique.set(`${code}#${num}`, { examCode: code, questionNum: num });
  }
  if (unique.size > MAX_IMPORT) throw new HttpError(400, `Can't import more than ${MAX_IMPORT} favorites at once`);

  const userId = currentUserId(req);
  const imported = unique.size > 0 ? await saveFavorites(userId, [...unique.values()]) : 0;
  res.json({ imported, favorites: await listFavorites(userId) });
});

export default router;
