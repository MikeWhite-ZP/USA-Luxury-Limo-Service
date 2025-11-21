import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './shared/schema.ts', // veya './db/schema.ts' - sizin schema path'inize göre
  out: './migrations',
  dialect: 'postgresql',  // ← BU ÇOK ÖNEMLİ!
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});