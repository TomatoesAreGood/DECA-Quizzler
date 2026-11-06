import { Router } from 'express';
import { z } from 'zod';
import { listQuestionAttempts } from '../db/queries.ts';
import { requireAuth } from '../middleware/auth.ts';
import { currentUserId, validate } from '../lib/http.ts';
import { booleanQuery, examCode, pagination } from '../lib/schemas.ts';

const router = Router();
router.use(requireAuth);

const listQuery = z.object({
  isCorrect: booleanQuery.optional(),
  examCode: examCode.optional(),
  ...pagination(200, 1000),
});

// GET api/question-attempts?isCorrect=true|false&examCode=&limit=&offset=
// Every question the user has answered across all attempts, newest attempt first. Each item has the
// answer plus the attempt it came from (attemptExamCode, attemptStartedAt, attemptState).
// examCode filters by the question's own exam. Returns { questionAttempts, hasMore }.
router.get('/', async (req, res) => {
  const query = validate(listQuery, req.query);
  res.json(await listQuestionAttempts(currentUserId(req), query));
});

export default router;
