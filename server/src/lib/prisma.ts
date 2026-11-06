import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../generated/prisma/client.ts';

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) throw new Error('DATABASE_URL must be set in server/.env');

// One shared client for the whole server. Uses the pooled runtime connection (DATABASE_URL).
const adapter = new PrismaPg({ connectionString: DATABASE_URL });

export const prisma = new PrismaClient({ adapter });

// Prisma error codes this server handles:
//   P2002: a unique constraint was violated (duplicate row)
//   P2003: a foreign key was violated (the referenced row doesn't exist)
export function isPrismaError(err: unknown, code: 'P2002' | 'P2003'): err is Prisma.PrismaClientKnownRequestError {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === code;
}
