import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HttpError } from '../lib/http.ts';

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({ error: 'Not found' });
};

// Every error ends up here, including ones thrown from async handlers (Express 5 forwards those).
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json(err.details ? { error: err.message, details: err.details } : { error: err.message });
    return;
  }

  // express.json() errors (malformed JSON, body too large) carry a 4xx status
  if (typeof err?.status === 'number' && err.status >= 400 && err.status < 500) {
    const message = err.type === 'entity.parse.failed' ? 'Request body is not valid JSON' : String(err.message);
    res.status(err.status).json({ error: message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};
