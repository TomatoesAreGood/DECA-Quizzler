import type { Prisma } from '../generated/prisma/client.ts';

// Row types come straight from the generated client, so they always match schema.prisma.
export type { User, ExamAttempt, QuestionAttempt, FavoriteQuestion, Report, Feedback } from '../generated/prisma/client.ts';

// Insert shapes: the fields you pass to create().
export type NewUser = Prisma.UserUncheckedCreateInput;
export type NewExamAttempt = Prisma.ExamAttemptUncheckedCreateInput;
export type NewReport = Prisma.ReportUncheckedCreateInput;
export type NewFeedback = Prisma.FeedbackUncheckedCreateInput;
