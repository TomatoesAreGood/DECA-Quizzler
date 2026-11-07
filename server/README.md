# DECA Quizzler API

Express 5 + Prisma 7 on Supabase Postgres, with Supabase Auth. Questions aren't in the database: they
stay in `client/public/data`, and the database refers to a question by `examCode` + `questionNum`.

## Setup

```sh
npm install            # from the repo root
npm run db:generate    # generates the Prisma client into src/generated (gitignored)
npm run dev -w server  # http://localhost:3000
```

`server/.env`:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase **transaction pooler**, port 6543. Used by the API. |
| `DIRECT_URL` | Supabase **session pooler**, port 5432 (same host and user as `DATABASE_URL`). Used by migrations. The direct `db.<ref>.supabase.co` host only works over IPv6. |
| `SUPABASE_URL` | `https://<ref>.supabase.co` |
| `SUPABASE_JWKS_URL` | `https://<ref>.supabase.co/auth/v1/.well-known/jwks.json` |
| `PORT` | Optional, default 3000 |
| `TRUST_PROXY` | Number of proxies in front of the server (1 on Vercel or Render). Leave unset locally. |

## Migrations

Migrations live in `src/db/migrations`.

- Change the schema: `npm run db:migrate -w server -- --name <change>` against a **local or dev** database.
- Apply to Supabase: `npm run db:deploy -w server`. Don't run `migrate dev` against Supabase: it can
  offer to reset the database.
- New tables: add `ALTER TABLE "<Table>" ENABLE ROW LEVEL SECURITY;` to the migration by hand (see the
  end of the init migration for why).

## Endpoints

Signed-in requests send `Authorization: Bearer <Supabase access token>`. Errors are
`{ error, details? }`, where `details` lists the invalid fields on a 400.

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/health` | none | |
| POST | `/api/users` | required | Creates the user's row from the token (no body). Call after every sign-in: 201 new, 200 existing. Saves the Google profile picture. A new row has no username yet |
| GET | `/api/users/me` | required | 404 until `POST /api/users` has run |
| PATCH | `/api/users/me` | required | Body: `{ username }`: 3 to 20 letters, numbers or underscores, saved lowercase. 409 with `code: "USERNAME_TAKEN"` if someone else has it |
| GET | `/api/users/username-available?username=` | none | For the sign-up form: `{ username, available }`. 60 checks a minute per IP |
| GET | `/api/favorites` | required | `[{ examCode, questionNum, createdAt }]` |
| PUT | `/api/favorites/:examCode/:questionNum` | required | 201 added, 200 already a favorite |
| DELETE | `/api/favorites/:examCode/:questionNum` | required | 204 |
| POST | `/api/favorites/import` | required | Body: `{ favorites: { [examCode]: number[] } }` (the localStorage `favExams` shape). Returns `{ imported, favorites }` |
| GET | `/api/exam-attempts` | required | `?state=IN_PROGRESS\|COMPLETED&examCode=&limit=&offset=`. Returns `{ attempts, hasMore }`, each with `answeredCount` and `correctCount` |
| POST | `/api/exam-attempts` | required | Body: `{ examCode, isShuffled?, slowMode?, currentExamCode?, currentQuestionNum? }`. Completes any in-progress attempt at that exam first |
| GET | `/api/exam-attempts/:id` | required | Includes `completedQuestions` |
| PATCH | `/api/exam-attempts/:id` | required | Body: `{ isShuffled?, slowMode?, currentExamCode?, currentQuestionNum? }`. The current question (sent as a pair) is where resuming picks up. 409 once completed |
| POST | `/api/exam-attempts/:id/answers` | required | Body: `{ examCode, questionNum, selectedAnswer: "A"-"D", isCorrect }`. `examCode` is the question's own exam. An identical retry returns 200 |
| POST | `/api/exam-attempts/:id/complete` | required | Completing again changes nothing |
| DELETE | `/api/exam-attempts/:id` | required | Also deletes its answers |
| GET | `/api/question-attempts` | required | Every answered question: `?isCorrect=true\|false&examCode=&limit=&offset=`. Returns `{ questionAttempts, hasMore }` |
| POST | `/api/reports` | optional | Body: `{ type, content, examCode?, questionNum? }`. `WRONG_ANSWER`, `TYPO` and `BAD_EXPLANATION` need the question |
| POST | `/api/feedback` | optional | Body: `{ content, rating?: 1-5 }` |

Reports and feedback allow 20 submissions per 10 minutes, per account when signed in and per IP
otherwise.
