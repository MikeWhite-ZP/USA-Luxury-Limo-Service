import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_FILE_PATH = path.join(__dirname, '../.setup-config.json');

export interface SetupConfig {
  companyName: string;
  companySlug: string;
  databaseUrl: string;
  databaseName: string;
  minioEndpoint: string;
  minioAccessKey: string;
  minioSecretKey: string;
  minioBucket: string;
  sessionSecret: string;
  setupCompleted: boolean;
  setupCompletedAt: string;
}

export function sanitizeCompanyName(companyName: string): string {
  return companyName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .substring(0, 50);
}

export function sanitizeBucketName(companyName: string): string {
  return companyName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 63);
}

export function generateSessionSecret(): string {
  return crypto.randomBytes(32).toString('base64');
}

export function isSetupComplete(): boolean {
  if (process.env.DATABASE_URL) {
    return true;
  }
  
  if (!fs.existsSync(CONFIG_FILE_PATH)) {
    return false;
  }

  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf-8')) as SetupConfig;
    return config.setupCompleted === true;
  } catch {
    return false;
  }
}

export function getSetupConfig(): SetupConfig | null {
  if (process.env.DATABASE_URL) {
    return {
      companyName: process.env.COMPANY_NAME || 'USA Luxury Limo',
      companySlug: sanitizeCompanyName(process.env.COMPANY_NAME || 'usa_luxury_limo'),
      databaseUrl: process.env.DATABASE_URL,
      databaseName: process.env.DATABASE_NAME || 'usa_luxury_limo',
      minioEndpoint: process.env.MINIO_ENDPOINT || '',
      minioAccessKey: process.env.MINIO_ACCESS_KEY || '',
      minioSecretKey: process.env.MINIO_SECRET_KEY || '',
      minioBucket: process.env.MINIO_BUCKET || 'usa-luxury-limo',
      sessionSecret: process.env.SESSION_SECRET || generateSessionSecret(),
      setupCompleted: true,
      setupCompletedAt: new Date().toISOString(),
    };
  }

  if (!fs.existsSync(CONFIG_FILE_PATH)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf-8')) as SetupConfig;
  } catch {
    return null;
  }
}

export function saveSetupConfig(config: SetupConfig): void {
  fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

export function getConfigFilePath(): string {
  return CONFIG_FILE_PATH;
}
