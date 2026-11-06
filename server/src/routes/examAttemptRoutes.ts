import { Router, type Response } from 'express';
import { z } from 'zod';
import {
  completeExamAttempt,
  deleteExamAttempt,
  getExamAttempt,
  listExamAttempts,
  mixesExams,
  recordAnswer,
  startExamAttempt,
  updateExamAttempt,
  type AttemptUpdateResult,
} from '../db/queries.ts';
import { requireAuth } from '../middleware/auth.ts';
import { currentUserId, HttpError, validate } from '../lib/http.ts';
import { isPrismaError } from '../lib/prisma.ts';
import { answerLetter, examCode, idParam, pagination, questionNum } from '../lib/schemas.ts';

const router = Router();
router.use(requireAuth);

const NOT_FOUND = 'Exam attempt not found';
const NOT_IN_PROGRESS = 'This exam attempt is already completed';

const idParams = z.object({ id: idParam });

const listQuery = z.object({
  state: z.enum(['IN_PROGRESS', 'COMPLETED']).optional(),
  examCode: examCode.optional(),
  ...pagination(50, 100),
});

// The question on screen is sent as a pair: its own exam code and its number
const currentQuestionFields = {
  currentExamCode: examCode.optional(),
  currentQuestionNum: questionNum.optional(),
};
function checkCurrentQuestionPair(body: { currentExamCode?: string; currentQuestionNum?: number }, ctx: z.RefinementCtx) {
  if ((body.currentExamCode === undefined) !== (body.currentQuestionNum === undefined)) {
    ctx.addIssue({ code: 'custom', path: ['currentQuestionNum'], message: 'Send currentExamCode and currentQuestionNum together' });
    return false;
  }
  return true;
}

const startBody = z
  .strictObject({
    examCode,
    isShuffled: z.boolean().default(false),
    slowMode: z.boolean().default(false),
    ...currentQuestionFields,
  })
  .superRefine((body, ctx) => {
    if (!checkCurrentQuestionPair(body, ctx)) return;
    if (body.currentExamCode !== undefined && !mixesExams(body.examCode) && body.currentExamCode !== body.examCode) {
      ctx.addIssue({ code: 'custom', path: ['currentExamCode'], message: "This question isn't part of the attempt's exam" });
    }
  });

const updateBody = z
  .strictObject({
    isShuffled: z.boolean().optional(),
    slowMode: z.boolean().optional(),
    ...currentQuestionFields,
  })
  .superRefine((body, ctx) => {
    if (!checkCurrentQuestionPair(body, ctx)) return;
    if (Object.values(body).every((value) => value === undefined)) {
      ctx.addIssue({ code: 'custom', path: [], message: 'Send isShuffled, slowMode, or currentExamCode with currentQuestionNum' });
    }
  });

const answerBody = z.strictObject({
  examCode,
  questionNum,
  selectedAnswer: answerLetter,
  isCorrect: z.boolean(),
});

function sendAttempt(res: Response, result: AttemptUpdateResult) {
  if (result.status === 'not_found') throw new HttpError(404, NOT_FOUND);
  if (result.status === 'not_in_progress') throw new HttpError(409, NOT_IN_PROGRESS);
  res.json(result.attempt);
}

// GET api/exam-attempts?state=IN_PROGRESS|COMPLETED&examCode=&limit=&offset=
// The user's attempts, newest first, each with answeredCount and correctCount.
// Returns { attempts, hasMore }.
router.get('/', async (req, res) => {
  const query = validate(listQuery, req.query);
  res.json(await listExamAttempts(currentUserId(req), query));
});

// POST api/exam-attempts
// Starts an exam. Body: { examCode, isShuffled?, slowMode?, currentExamCode?, currentQuestionNum? }
// If the exam is already in progress, that attempt is completed first (starting over).
router.post('/', async (req, res) => {
  const body = validate(startBody, req.body ?? {});
  try {
    res.status(201).json(await startExamAttempt(currentUserId(req), body));
  } catch (err) {
    if (isPrismaError(err, 'P2003')) throw new HttpError(409, 'User profile not found. Create it with POST /api/users first.');
    if (isPrismaError(err, 'P2002')) throw new HttpError(409, 'This exam was just started in another request. Try again.');
    throw err;
  }
});

// GET api/exam-attempts/:id
// One attempt with every answered question (completedQuestions), for resuming or reviewing it
router.get('/:id', async (req, res) => {
  const { id } = validate(idParams, req.params);
  const attempt = await getExamAttempt(currentUserId(req), id);
  if (!attempt) throw new HttpError(404, NOT_FOUND);
  res.json(attempt);
});

// PATCH api/exam-attempts/:id
// Changes an in-progress attempt's settings and/or the question the user is on.
// Body: { isShuffled?, slowMode?, currentExamCode?, currentQuestionNum? }. The current question's
// exam code and number are sent together; the code is the question's own exam, as for answers.
router.patch('/:id', async (req, res) => {
  const { id } = validate(idParams, req.params);
  const body = validate(updateBody, req.body ?? {});
  const result = await updateExamAttempt(currentUserId(req), id, body);
  if (result.status === 'wrong_exam') throw new HttpError(400, "This question isn't part of the attempt's exam");
  sendAttempt(res, result);
});

// POST api/exam-attempts/:id/answers
// Saves one answer. Body: { examCode, questionNum, selectedAnswer: "A"-"D", isCorrect }
// examCode is the question's own exam, which differs from the attempt's for unit and favorites quizzes.
// Sending the same answer again (a retry) returns 200 with the saved answer instead of failing.
router.post('/:id/answers', async (req, res) => {
  const { id } = validate(idParams, req.params);
  const answer = validate(answerBody, req.body ?? {});
  const result = await recordAnswer(currentUserId(req), id, answer);

  switch (result.status) {
    case 'created':
      res.status(201).json(result.answer);
      return;
    case 'duplicate':
      if (result.answer.selectedAnswer !== answer.selectedAnswer || result.answer.isCorrect !== answer.isCorrect) {
        throw new HttpError(409, 'This question was already answered differently in this attempt');
      }
      res.status(200).json(result.answer);
      return;
    case 'not_found':
      throw new HttpError(404, NOT_FOUND);
    case 'not_in_progress':
      throw new HttpError(409, NOT_IN_PROGRESS);
    case 'wrong_exam':
      throw new HttpError(400, "This question isn't part of the attempt's exam");
  }
});

// POST api/exam-attempts/:id/complete
// Finishes an attempt (including exiting early). Completing it again changes nothing.
router.post('/:id/complete', async (req, res) => {
  const { id } = validate(idParams, req.params);
  sendAttempt(res, await completeExamAttempt(currentUserId(req), id));
});

// DELETE api/exam-attempts/:id
// Deletes an attempt and its answers
router.delete('/:id', async (req, res) => {
  const { id } = validate(idParams, req.params);
  if (!(await deleteExamAttempt(currentUserId(req), id))) throw new HttpError(404, NOT_FOUND);
  res.status(204).end();
});

export default router;
