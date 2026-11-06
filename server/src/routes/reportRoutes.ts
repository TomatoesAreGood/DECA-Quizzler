import { Router } from 'express';
import { z } from 'zod';
import { createReport, userExists } from '../db/queries.ts';
import { ReportType } from '../generated/prisma/enums.ts';
import { optionalAuth } from '../middleware/auth.ts';
import { submissionLimiter } from '../middleware/rateLimit.ts';
import { validate } from '../lib/http.ts';
import { examCode, messageContent, questionNum } from '../lib/schemas.ts';

const router = Router();

// Report types that are always about a specific question
const QUESTION_REPORT_TYPES: ReportType[] = [ReportType.WRONG_ANSWER, ReportType.TYPO, ReportType.BAD_EXPLANATION];

const reportBody = z
  .strictObject({
    type: z.enum(ReportType),
    content: messageContent,
    examCode: examCode.optional(),
    questionNum: questionNum.optional(),
  })
  .superRefine((body, ctx) => {
    const hasQuestion = body.examCode !== undefined && body.questionNum !== undefined;
    if ((body.examCode === undefined) !== (body.questionNum === undefined)) {
      ctx.addIssue({ code: 'custom', path: ['questionNum'], message: 'Send examCode and questionNum together' });
    } else if (!hasQuestion && QUESTION_REPORT_TYPES.includes(body.type)) {
      ctx.addIssue({ code: 'custom', path: ['examCode'], message: `${body.type} reports need examCode and questionNum` });
    }
  });

// POST api/reports
// Reports a problem. Works signed in or out. Body: { type, content, examCode?, questionNum? }
// WRONG_ANSWER, TYPO and BAD_EXPLANATION reports need the question (examCode and questionNum).
router.post('/', optionalAuth, submissionLimiter(), async (req, res) => {
  const body = validate(reportBody, req.body ?? {});
  // Signed-in users without a profile row yet still get their report saved, just without an owner
  const userId = req.auth && (await userExists(req.auth.sub)) ? req.auth.sub : null;
  res.status(201).json(await createReport({ ...body, userId }));
});

export default router;
