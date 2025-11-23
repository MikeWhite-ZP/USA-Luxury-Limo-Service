import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './shared/schema.ts', // Lütfen bu yolu kendi schema dosyanızla değiştirin.
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // Ortam değişkenini kullanın
    url: process.env.DATABASE_URL!, 
  },
});