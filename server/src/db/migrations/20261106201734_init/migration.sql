-- CreateEnum
CREATE TYPE "AttemptState" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('WRONG_ANSWER', 'TYPO', 'BAD_EXPLANATION', 'BROKEN_PAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "userName" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAttempt" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "examCode" VARCHAR(32) NOT NULL,
    "state" "AttemptState" NOT NULL DEFAULT 'IN_PROGRESS',
    "startQuestion" SMALLINT NOT NULL DEFAULT 1,
    "isShuffled" BOOLEAN NOT NULL DEFAULT false,
    "slowMode" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionAttempt" (
    "examAttemptId" UUID NOT NULL,
    "examCode" VARCHAR(32) NOT NULL,
    "questionNum" SMALLINT NOT NULL,
    "selectedAnswer" CHAR(1) NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,

    CONSTRAINT "QuestionAttempt_pkey" PRIMARY KEY ("examAttemptId","examCode","questionNum")
);

-- CreateTable
CREATE TABLE "FavoriteQuestion" (
    "userId" UUID NOT NULL,
    "examCode" VARCHAR(32) NOT NULL,
    "questionNum" SMALLINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteQuestion_pkey" PRIMARY KEY ("userId","examCode","questionNum")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "type" "ReportType" NOT NULL,
    "content" TEXT NOT NULL,
    "examCode" VARCHAR(32),
    "questionNum" SMALLINT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "content" TEXT NOT NULL,
    "rating" SMALLINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "ExamAttempt_userId_startedAt_idx" ON "ExamAttempt"("userId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAttempt_one_in_progress_key" ON "ExamAttempt"("userId", "examCode") WHERE ("state" = 'IN_PROGRESS');

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAttempt" ADD CONSTRAINT "QuestionAttempt_examAttemptId_fkey" FOREIGN KEY ("examAttemptId") REFERENCES "ExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteQuestion" ADD CONSTRAINT "FavoriteQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Row Level Security (added by hand; Prisma doesn't manage it)
-- Supabase exposes the public schema through its REST API using the public API key. With RLS on
-- and no policies, that key can't read or write these tables. The server connects as postgres,
-- which bypasses RLS, so the API is unaffected. Tables added later need the same statement.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExamAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuestionAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FavoriteQuestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Feedback" ENABLE ROW LEVEL SECURITY;

-- Prisma's own migration history table lives in public too. It doesn't exist in the temporary
-- shadow database Prisma uses while creating migrations, hence the check.
DO $$
BEGIN
  IF to_regclass('public."_prisma_migrations"') IS NOT NULL THEN
    ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
