import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.ts';
import favoriteRoutes from './routes/favoriteRoutes.ts';
import examAttemptRoutes from './routes/examAttemptRoutes.ts';
import questionAttemptRoutes from './routes/questionAttemptRoutes.ts';
import reportRoutes from './routes/reportRoutes.ts';
import feedbackRoutes from './routes/feedbackRoutes.ts';
import { errorHandler, notFound } from './middleware/errorHandler.ts';

// The Express app without app.listen(), so index.ts can run it as a server and a serverless
// function can import it directly
export const app = express();

app.disable('x-powered-by');

// Number of proxies in front of the server (e.g. 1 on Vercel or Render), so req.ip is the visitor's
// real address. Leave unset when nothing sits in front of it, or visitors could fake their IP.
const trustProxy = Number(process.env.TRUST_PROXY ?? 0);
if (!Number.isInteger(trustProxy) || trustProxy < 0) throw new Error('TRUST_PROXY must be a whole number');
if (trustProxy > 0) app.set('trust proxy', trustProxy);

// Requests are authorized by a Bearer token, not cookies, so allowing any origin is safe
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/users', userRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/exam-attempts', examAttemptRoutes);
app.use('/api/question-attempts', questionAttemptRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/feedback', feedbackRoutes);

app.use(notFound);
app.use(errorHandler);
