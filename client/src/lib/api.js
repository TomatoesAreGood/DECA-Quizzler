import { authEnabled, getAccessToken } from './supabase';

// The Supabase settings in client/.env turn on everything that uses the server: accounts, saved
// progress, synced favorites, reports and feedback. Without them the site runs exactly as it did
// before the backend existed, which keeps a deploy without a backend working.
export const apiEnabled = authEnabled;

// Empty means the API is on the same site under /api. In dev, Vite forwards /api to the server
// (see vite.config.js).
const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(status, message, { code, details } = {}) {
    super(message);
    this.status = status; // 0 when the server couldn't be reached
    this.code = code; // e.g. 'USERNAME_TAKEN'
    this.details = details;
  }
}

// auth: 'required' sends the user's token and fails without one; 'optional' sends it when signed in;
// 'none' never sends it. keepalive lets a save finish even if the page is closed right after.
async function request(method, path, { body, auth = 'required', keepalive = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (auth !== 'none') {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    else if (auth === 'required') throw new ApiError(401, 'Not signed in');
  }

  let response;
  try {
    response = await fetch(API_BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      keepalive,
    });
  } catch {
    throw new ApiError(0, "Couldn't reach the server");
  }

  if (response.status === 204) return null;
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // Not JSON, e.g. an HTML error page from a proxy
  }
  if (!response.ok) {
    throw new ApiError(response.status, data?.error ?? `Request failed (${response.status})`, { code: data?.code, details: data?.details });
  }
  return data;
}

const questionPath = (examCode, questionNum) =>
  `${encodeURIComponent(examCode)}/${encodeURIComponent(String(questionNum))}`;

// ---- Sign-in ----

// Swaps the one-time code from Google's popup for the user's Google tokens: { idToken, accessToken }. Throws
// ApiError with code 'GOOGLE_NOT_CONFIGURED' when the server has no Google client secret.
export const exchangeGoogleCode = (code) => request('POST', '/api/auth/google', { body: { code }, auth: 'none' });

// ---- Users ----

// Creates the signed-in user's row, or returns it if it already exists
export const ensureUser = () => request('POST', '/api/users');
// Throws ApiError with code 'USERNAME_TAKEN' if someone else has it
export const setUsername = (username) => request('PATCH', '/api/users/me', { body: { username } });
// themeId: an id from config/themes.js. Returns the updated profile.
export const setAccountTheme = (theme) => request('PATCH', '/api/users/me', { body: { theme }, keepalive: true });
// For the sign-up form: { username, available }, with the username as it would be saved
export const checkUsername = (username) =>
  request('GET', `/api/users/username-available?${new URLSearchParams({ username })}`, { auth: 'none' });

// Same rule as the server (server/src/lib/schemas.ts)
export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
export const USERNAME_RULE = 'Usernames are 3 to 20 letters, numbers or underscores';

// ---- Favorites ----

export const getFavorites = () => request('GET', '/api/favorites');
export const addFavorite = (examCode, questionNum) => request('PUT', `/api/favorites/${questionPath(examCode, questionNum)}`);
export const removeFavorite = (examCode, questionNum) => request('DELETE', `/api/favorites/${questionPath(examCode, questionNum)}`);
// favorites: { [examCode]: number[] }, the shape kept in localStorage. Returns { imported, favorites }.
export const importFavorites = (favorites) => request('POST', '/api/favorites/import', { body: { favorites } });

// ---- Exam attempts ----

export async function findInProgressAttempt(examCode) {
  const query = new URLSearchParams({ state: 'IN_PROGRESS', examCode, limit: '1' });
  const { attempts } = await request('GET', `/api/exam-attempts?${query}`);
  return attempts[0] ?? null;
}

export const getAttempt = (id) => request('GET', `/api/exam-attempts/${encodeURIComponent(id)}`);
// body: { examCode, isShuffled, slowMode, currentExamCode?, currentQuestionNum? }
export const startAttempt = (body) => request('POST', '/api/exam-attempts', { body, keepalive: true });
// body: { isShuffled?, slowMode? }
export const updateAttempt = (id, body) => request('PATCH', `/api/exam-attempts/${encodeURIComponent(id)}`, { body, keepalive: true });
// body: { examCode, questionNum, selectedAnswer, isCorrect }
export const saveAnswer = (id, body) =>
  request('POST', `/api/exam-attempts/${encodeURIComponent(id)}/answers`, { body, keepalive: true });
export const completeAttempt = (id) => request('POST', `/api/exam-attempts/${encodeURIComponent(id)}/complete`, { keepalive: true });

// ---- Reports and feedback (work signed out too) ----

// body: { type, content, examCode?, questionNum? }
export const sendReport = (body) => request('POST', '/api/reports', { body, auth: 'optional' });
// body: { content, rating? }
export const sendFeedback = (body) => request('POST', '/api/feedback', { body, auth: 'optional' });
