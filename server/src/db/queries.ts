import { prisma, isPrismaError } from '../lib/prisma.ts';
import type { AttemptState, ExamAttempt, QuestionAttempt } from '../generated/prisma/client.ts';
import type { NewFeedback, NewReport, NewUser } from './types.ts';

// ---------------------------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------------------------

export function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function createUser(data: NewUser) {
  return prisma.user.create({ data });
}

// The updated user, or null if they don't have a row yet
export async function updateUser(id: string, data: { userName?: string }) {
  const { count } = await prisma.user.updateMany({ where: { id }, data });
  return count === 0 ? null : getUserById(id);
}

export async function userExists(id: string) {
  return (await prisma.user.count({ where: { id } })) > 0;
}

// ---------------------------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------------------------

export interface QuestionRef {
  examCode: string;
  questionNum: number;
}

export function listFavorites(userId: string) {
  return prisma.favoriteQuestion.findMany({
    where: { userId },
    select: { examCode: true, questionNum: true, createdAt: true },
    orderBy: [{ examCode: 'asc' }, { questionNum: 'asc' }],
  });
}

// Adds the favorites that aren't saved yet and returns how many were new
export async function addFavorites(userId: string, questions: QuestionRef[]) {
  const { count } = await prisma.favoriteQuestion.createMany({
    data: questions.map((question) => ({ userId, ...question })),
    skipDuplicates: true,
  });
  return count;
}

// Returns whether the favorite existed
export async function removeFavorite(userId: string, question: QuestionRef) {
  const { count } = await prisma.favoriteQuestion.deleteMany({ where: { userId, ...question } });
  return count > 0;
}

// ---------------------------------------------------------------------------------------------
// Exam attempts
// ---------------------------------------------------------------------------------------------

// The favorites quiz, and unit exams (codes ending in -UNIT), mix questions from other exams.
// Every other attempt only contains questions from its own exam.
export const FAVORITES_EXAM_CODE = 'FAV-EXAM';

export function mixesExams(examCode: string) {
  return examCode === FAVORITES_EXAM_CODE || examCode.endsWith('-UNIT');
}

export interface AnswerCounts {
  answeredCount: number;
  correctCount: number;
}

export type ExamAttemptWithCounts = ExamAttempt & AnswerCounts;

// How many questions each attempt has answered, and how many of those were right
async function addAnswerCounts(attempts: ExamAttempt[]): Promise<ExamAttemptWithCounts[]> {
  if (attempts.length === 0) return [];
  const groups = await prisma.questionAttempt.groupBy({
    by: ['examAttemptId', 'isCorrect'],
    where: { examAttemptId: { in: attempts.map((attempt) => attempt.id) } },
    _count: { _all: true },
  });

  const counts = new Map<string, AnswerCounts>();
  for (const group of groups) {
    const entry = counts.get(group.examAttemptId) ?? { answeredCount: 0, correctCount: 0 };
    entry.answeredCount += group._count._all;
    if (group.isCorrect) entry.correctCount += group._count._all;
    counts.set(group.examAttemptId, entry);
  }
  return attempts.map((attempt) => ({ ...attempt, ...(counts.get(attempt.id) ?? { answeredCount: 0, correctCount: 0 }) }));
}

export interface ExamAttemptFilters {
  state?: AttemptState;
  examCode?: string;
  limit: number;
  offset: number;
}

// Newest first. hasMore says whether another page follows.
export async function listExamAttempts(userId: string, { state, examCode, limit, offset }: ExamAttemptFilters) {
  const rows = await prisma.examAttempt.findMany({
    where: { userId, state, examCode },
    orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
    skip: offset,
    take: limit + 1,
  });
  return { attempts: await addAnswerCounts(rows.slice(0, limit)), hasMore: rows.length > limit };
}

export async function getExamAttempt(userId: string, id: string) {
  const attempt = await prisma.examAttempt.findFirst({
    where: { id, userId },
    include: { completedQuestions: { orderBy: [{ examCode: 'asc' }, { questionNum: 'asc' }] } },
  });
  if (!attempt) return null;

  const completedQuestions = attempt.completedQuestions.map(({ examAttemptId, ...answer }) => answer);
  return {
    ...attempt,
    completedQuestions,
    answeredCount: completedQuestions.length,
    correctCount: completedQuestions.filter((answer) => answer.isCorrect).length,
  };
}

async function getExamAttemptWithCounts(userId: string, id: string) {
  const attempt = await prisma.examAttempt.findFirst({ where: { id, userId } });
  return attempt ? (await addAnswerCounts([attempt]))[0]! : null;
}

export interface NewAttemptOptions {
  examCode: string;
  isShuffled: boolean;
  slowMode: boolean;
  // The question on screen, if known (see ExamAttempt.currentExamCode)
  currentExamCode?: string;
  currentQuestionNum?: number;
}

// Starts a new attempt. An in-progress attempt at the same exam is completed first, which is how
// "start over" works. Throws P2002 if another request starts the same exam at the same moment.
export async function startExamAttempt(userId: string, options: NewAttemptOptions) {
  const now = new Date();
  const attempt = await prisma.$transaction(async (tx) => {
    await tx.examAttempt.updateMany({
      where: { userId, examCode: options.examCode, state: 'IN_PROGRESS' },
      data: { state: 'COMPLETED', completedAt: now },
    });
    return tx.examAttempt.create({ data: { userId, ...options } });
  });
  return { ...attempt, answeredCount: 0, correctCount: 0 };
}

export type AttemptUpdateResult =
  | { status: 'updated'; attempt: ExamAttemptWithCounts }
  | { status: 'not_found' }
  | { status: 'not_in_progress' };

// Decides why an update matching { id, userId, state: IN_PROGRESS } changed nothing
async function whyNotUpdated(userId: string, id: string): Promise<AttemptUpdateResult> {
  return (await prisma.examAttempt.count({ where: { id, userId } })) > 0 ? { status: 'not_in_progress' } : { status: 'not_found' };
}

export interface ExamAttemptChanges {
  isShuffled?: boolean;
  slowMode?: boolean;
  // The question on screen, sent as a pair
  currentExamCode?: string;
  currentQuestionNum?: number;
}

// Changes an in-progress attempt's settings and/or the question the user is on. The current
// question must come from the attempt's exam, unless it's a unit or favorites quiz.
export async function updateExamAttempt(
  userId: string,
  id: string,
  changes: ExamAttemptChanges,
): Promise<AttemptUpdateResult | { status: 'wrong_exam' }> {
  if (changes.currentExamCode !== undefined) {
    const attempt = await prisma.examAttempt.findFirst({ where: { id, userId }, select: { examCode: true } });
    if (!attempt) return { status: 'not_found' };
    if (!mixesExams(attempt.examCode) && changes.currentExamCode !== attempt.examCode) return { status: 'wrong_exam' };
  }

  const { count } = await prisma.examAttempt.updateMany({ where: { id, userId, state: 'IN_PROGRESS' }, data: changes });
  if (count === 0) return whyNotUpdated(userId, id);
  const attempt = await getExamAttemptWithCounts(userId, id);
  return attempt ? { status: 'updated', attempt } : { status: 'not_found' };
}

// Marks an attempt completed. Completing one that's already completed changes nothing.
export async function completeExamAttempt(userId: string, id: string): Promise<AttemptUpdateResult> {
  await prisma.examAttempt.updateMany({
    where: { id, userId, state: 'IN_PROGRESS' },
    data: { state: 'COMPLETED', completedAt: new Date() },
  });
  const attempt = await getExamAttemptWithCounts(userId, id);
  return attempt ? { status: 'updated', attempt } : { status: 'not_found' };
}

// Returns whether the attempt existed. Its answers are deleted with it.
export async function deleteExamAttempt(userId: string, id: string) {
  const { count } = await prisma.examAttempt.deleteMany({ where: { id, userId } });
  return count > 0;
}

// ---------------------------------------------------------------------------------------------
// Answers (question attempts)
// ---------------------------------------------------------------------------------------------

export interface AnswerInput extends QuestionRef {
  selectedAnswer: string;
  isCorrect: boolean;
}

type Answer = Omit<QuestionAttempt, 'examAttemptId'>;

export type RecordAnswerResult =
  | { status: 'created'; answer: Answer }
  | { status: 'duplicate'; answer: Answer } // This question was already answered in this attempt
  | { status: 'not_found' }
  | { status: 'not_in_progress' }
  | { status: 'wrong_exam' };

const answerFields = { examCode: true, questionNum: true, selectedAnswer: true, isCorrect: true } as const;

export async function recordAnswer(userId: string, examAttemptId: string, answer: AnswerInput): Promise<RecordAnswerResult> {
  const attempt = await prisma.examAttempt.findFirst({ where: { id: examAttemptId, userId }, select: { examCode: true } });
  if (!attempt) return { status: 'not_found' };
  if (!mixesExams(attempt.examCode) && answer.examCode !== attempt.examCode) return { status: 'wrong_exam' };

  try {
    const created = await prisma.$transaction(async (tx) => {
      // Locks the attempt while the answer is saved, so it can't be completed halfway through
      const { count } = await tx.examAttempt.updateMany({
        where: { id: examAttemptId, userId, state: 'IN_PROGRESS' },
        data: { updatedAt: new Date() },
      });
      if (count === 0) return null;
      return tx.questionAttempt.create({ data: { examAttemptId, ...answer }, select: answerFields });
    });
    if (created) return { status: 'created', answer: created };
    const reason = await whyNotUpdated(userId, examAttemptId);
    return reason.status === 'not_found' ? reason : { status: 'not_in_progress' };
  } catch (err) {
    if (!isPrismaError(err, 'P2002')) throw err;
    const existing = await prisma.questionAttempt.findUnique({
      where: { examAttemptId_examCode_questionNum: { examAttemptId, examCode: answer.examCode, questionNum: answer.questionNum } },
      select: answerFields,
    });
    if (!existing) throw err;
    return { status: 'duplicate', answer: existing };
  }
}

export interface QuestionAttemptFilters {
  isCorrect?: boolean;
  examCode?: string;
  limit: number;
  offset: number;
}

// Every question the user has answered, across all their attempts, newest attempt first
export async function listQuestionAttempts(userId: string, { isCorrect, examCode, limit, offset }: QuestionAttemptFilters) {
  const rows = await prisma.questionAttempt.findMany({
    where: { examAttempt: { userId }, isCorrect, examCode },
    include: { examAttempt: { select: { examCode: true, startedAt: true, state: true } } },
    orderBy: [{ examAttempt: { startedAt: 'desc' } }, { examAttemptId: 'asc' }, { examCode: 'asc' }, { questionNum: 'asc' }],
    skip: offset,
    take: limit + 1,
  });

  const questionAttempts = rows.slice(0, limit).map(({ examAttempt, ...answer }) => ({
    ...answer,
    attemptExamCode: examAttempt.examCode,
    attemptStartedAt: examAttempt.startedAt,
    attemptState: examAttempt.state,
  }));
  return { questionAttempts, hasMore: rows.length > limit };
}

// ---------------------------------------------------------------------------------------------
// Reports and feedback
// ---------------------------------------------------------------------------------------------

export function createReport(data: NewReport) {
  return prisma.report.create({ data, select: { id: true, createdAt: true } });
}

export function createFeedback(data: NewFeedback) {
  return prisma.feedback.create({ data, select: { id: true, createdAt: true } });
}
