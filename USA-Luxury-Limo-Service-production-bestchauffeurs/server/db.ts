import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { getSetupConfig, isSetupComplete } from './setupConfig';

function getDatabaseUrl(): string | null {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const config = getSetupConfig();
  if (config?.databaseUrl) {
    return config.databaseUrl;
  }

  return null;
}

const databaseUrl = getDatabaseUrl();

if (!databaseUrl) {
  console.log('[DATABASE] No database URL configured - running in setup mode');
}

export const pool = databaseUrl ? new Pool({ 
  connectionString: databaseUrl,
  ssl: databaseUrl?.includes('sslmode=require') 
    ? { rejectUnauthorized: false } 
    : false
}) : null as unknown as pg.Pool;

if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
  });
}

export const db = pool ? drizzle({ client: pool, schema }) : null as unknown as ReturnType<typeof drizzle<typeof schema>>;
