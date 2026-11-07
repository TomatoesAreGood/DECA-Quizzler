import { z } from 'zod';

// Exam codes look like "1027-CORE", "2015-CORE-SAMPLE-ICDC" or "9999-CORE-UNIT". Dots are allowed
// because some unit exam questions name their exam that way (e.g. "1062.MKT" in MKT-UNIT.json).
export const examCode = z
  .string()
  .max(32, 'Exam code is too long')
  .regex(/^[A-Za-z0-9][A-Za-z0-9.-]*$/, 'Invalid exam code');

// Questions are numbered from 1 within their exam. The upper bound is the SmallInt column's limit.
export const questionNum = z.int('Question number must be a whole number').min(1).max(32767);

// The same number when it arrives as text in a URL
export const questionNumParam = z
  .string()
  .regex(/^[1-9]\d{0,4}$/, 'Invalid question number')
  .transform(Number)
  .pipe(questionNum);

export const answerLetter = z.enum(['A', 'B', 'C', 'D']);

// Usernames: 3 to 20 letters, numbers or underscores. Input is lowercased first, so "Bob" is saved as
// "bob" and can't exist alongside it. No "@", so a username can never look like an email address.
export const USERNAME_RULE = 'Usernames are 3 to 20 letters, numbers or underscores';
export const username = z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,20}$/, USERNAME_RULE);

// Free text from reports and feedback
export const messageContent = z.string().trim().min(1, 'content is empty').max(2000, 'content is longer than 2000 characters');

export const idParam = z.uuid('Invalid id');

// ?limit= and ?offset= for list endpoints
export function pagination(defaultLimit: number, maxLimit: number) {
  const count = (min: number, max: number) =>
    z.string().regex(/^\d{1,7}$/, 'Must be a whole number').transform(Number).pipe(z.int().min(min).max(max));
  return {
    limit: count(1, maxLimit).default(defaultLimit),
    offset: count(0, 1_000_000).default(0),
  };
}

// ?isCorrect=true / ?isCorrect=false
export const booleanQuery = z.enum(['true', 'false']).transform((value) => value === 'true');
