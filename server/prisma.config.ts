import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma CLI settings (generate, migrate, studio). Migrations connect through DIRECT_URL,
// since Supabase's transaction pooler (DATABASE_URL) doesn't support them.
export default defineConfig({
  schema: 'src/db/schema.prisma',
  migrations: {
    path: 'src/db/migrations',
  },
  datasource: {
    url: process.env.DIRECT_URL ?? '',
  },
});
