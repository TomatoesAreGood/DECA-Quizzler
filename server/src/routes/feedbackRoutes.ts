import { Router } from 'express';
import { z } from 'zod';
import { createFeedback, userExists } from '../db/queries.ts';
import { optionalAuth } from '../middleware/auth.ts';
import { submissionLimiter } from '../middleware/rateLimit.ts';
import { validate } from '../lib/http.ts';
import { messageContent } from '../lib/schemas.ts';

const router = Router();

const feedbackBody = z.strictObject({
  content: messageContent,
  rating: z.int('rating must be a whole number').min(1).max(5).optional(),
});

// POST api/feedback
// Sends feedback. Works signed in or out. Body: { content, rating?: 1-5 }
router.post('/', optionalAuth, submissionLimiter(), async (req, res) => {
  const body = validate(feedbackBody, req.body ?? {});
  const userId = req.auth && (await userExists(req.auth.sub)) ? req.auth.sub : null;
  res.status(201).json(await createFeedback({ ...body, userId }));
});

export default router;
