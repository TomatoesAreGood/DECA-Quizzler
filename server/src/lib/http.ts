import type { Request } from 'express';
import { z } from 'zod';

export interface ErrorDetail {
  path: string;
  message: string;
}

// Thrown from route handlers to send an error response; middleware/errorHandler.ts turns it into JSON:
// { error, code?, details? }. code is a stable name the client can check (e.g. "USERNAME_TAKEN").
export class HttpError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly details: ErrorDetail[] | undefined;

  constructor(status: number, message: string, extra: { code?: string; details?: ErrorDetail[] } = {}) {
    super(message);
    this.status = status;
    this.code = extra.code;
    this.details = extra.details;
  }
}

// Parses request input with a zod schema, or responds 400 listing what was wrong
export function validate<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new HttpError(400, 'Invalid request', {
      details: result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    });
  }
  return result.data;
}

// The signed-in user's id. Only call this in handlers behind requireAuth.
export function currentUserId(req: Request): string {
  if (!req.auth) throw new Error('currentUserId() needs requireAuth to run first');
  return req.auth.sub;
}
