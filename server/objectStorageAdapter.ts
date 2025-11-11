import { Client as ObjectStorageClient } from "@replit/object-storage";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadBucketCommand, CreateBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Object Storage Adapter
 * Provides a unified interface for both Replit Object Storage and MinIO/S3
 * Automatically detects which storage backend to use based on environment variables
 */

// Global cache for bucket existence checks to avoid repeated API calls
const bucketExistsCache = new Map<string, boolean>();

export interface StorageObject {
  key: string;
  size: number;
  lastModified: Date;
  url?: string;
}

export interface StorageAdapter {
  uploadFromBytes(path: string, data: Buffer, metadata?: { contentType?: string }): Promise<{ ok: boolean; error?: string }>;
  downloadAsBytes(path: string): Promise<{ ok: boolean; value?: any; error?: string }>;
  getDownloadUrl(path: string): Promise<{ ok: boolean; url?: string; error?: string }>;
  delete(path: string): Promise<{ ok: boolean; error?: string }>;
  list(prefix?: string): Promise<{ ok: boolean; keys?: string[]; error?: string }>;
  listWithMetadata(prefix?: string): Promise<{ ok: boolean; objects?: StorageObject[]; error?: string }>;
}

class ReplitStorageAdapter implements StorageAdapter {
  private client: ObjectStorageClient;

  constructor(bucketId: string) {
    this.client = new ObjectStorageClient({ bucketId });
  }

  async uploadFromBytes(path: string, data: Buffer, metadata?: { contentType?: string }): Promise<{ ok: boolean; error?: string }> {
    try {
      const result = await this.client.uploadFromBytes(path, data);
      if (result.ok) {
        return { ok: true };
      } else {
        return { ok: false, error: result.error?.message || 'Upload failed' };
      }
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  async downloadAsBytes(path: string): Promise<{ ok: boolean; value?: any; error?: string }> {
    try {
      const result = await this.client.downloadAsBytes(path);
      if (result.ok) {
        return { ok: true, value: result.value };
      } else {
        return { ok: false, error: result.error?.message || 'Download failed' };
      }
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  async getDownloadUrl(path: string): Promise<{ ok: boolean; url?: string; error?: string }> {
    try {
      // For Replit storage, we serve files through our API
      // Return a server-side path instead of a direct URL
      return { ok: true, url: path };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  async delete(path: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const result = await this.client.delete(path);
      if (result.ok) {
        return { ok: true };
      } else {
        return { ok: false, error: result.error?.message || 'Delete failed' };
      }
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  async list(prefix?: string): Promise<{ ok: boolean; keys?: string[]; error?: string }> {
    try {
      const result = await this.client.list({ prefix: prefix || '' });
      if (result.ok && result.value) {
        const keys = result.value.map((obj: any) => obj.key);
        return { ok: true, keys };
      } else {
        return { ok: false, error: result.error?.message || 'List failed' };
      }
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  async listWithMetadata(prefix?: string): Promise<{ ok: boolean; objects?: StorageObject[]; error?: string }> {
    try {
      const result = await this.client.list({ prefix: prefix || '' });
      if (result.ok && result.value) {
        const objects: StorageObject[] = result.value.map((obj: any) => ({
          key: obj.key,
          size: obj.size || 0,
          lastModified: obj.lastModified ? new Date(obj.lastModified) : new Date(),
          url: obj.key, // For Replit storage, we'll construct URL server-side
        }));
        return { ok: true, objects };
      } else {
        return { ok: false, error: result.error?.message || 'List failed' };
      }
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }
}

class S3StorageAdapter implements StorageAdapter {
  private client: S3Client;
  private bucket: string;
  private endpoint: string;
  private initPromise: Promise<void>;

  constructor(config: {
    endpoint: string;
    region?: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    forcePathStyle?: boolean;
  }) {
    this.bucket = config.bucket;
    this.endpoint = config.endpoint;
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region || 'us-east-1',
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle !== false, // Default to true for MinIO
    });
    
    // Start bucket initialization immediately
    this.initPromise = this.ensureBucket();
  }

  /**
   * Ensures the bucket exists, creating it if necessary
   * Uses a global cache to avoid repeated API calls
   */
  private async ensureBucket(): Promise<void> {
    const cacheKey = `${this.endpoint}:${this.bucket}`;
    
    // Check cache first
    if (bucketExistsCache.get(cacheKey)) {
      return;
    }

    try {
      // Try to check if bucket exists
      const headCommand = new HeadBucketCommand({ Bucket: this.bucket });
      await this.client.send(headCommand);
      
      // Bucket exists, cache it
      bucketExistsCache.set(cacheKey, true);
      console.log(`[STORAGE] Bucket '${this.bucket}' exists`);
    } catch (error: any) {
      // Bucket doesn't exist or we don't have permission to check
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        console.log(`[STORAGE] Bucket '${this.bucket}' not found, creating...`);
        
        try {
          // Create the bucket (MinIO doesn't require LocationConstraint)
          const createCommand = new CreateBucketCommand({ Bucket: this.bucket });
          await this.client.send(createCommand);
          
          bucketExistsCache.set(cacheKey, true);
          console.log(`[STORAGE] Successfully created bucket '${this.bucket}'`);
        } catch (createError: any) {
          // Handle creation errors
          if (createError.name === 'BucketAlreadyOwnedByYou' || createError.$metadata?.httpStatusCode === 409) {
            // Bucket was created by another process, this is fine
            bucketExistsCache.set(cacheKey, true);
            console.log(`[STORAGE] Bucket '${this.bucket}' already exists (created by another process)`);
          } else if (createError.$metadata?.httpStatusCode === 403) {
            console.error(`[STORAGE] Permission denied creating bucket '${this.bucket}'. Please create it manually or grant CreateBucket permission.`);
            throw createError;
          } else {
            console.error(`[STORAGE] Failed to create bucket '${this.bucket}':`, createError.message);
            throw createError;
          }
        }
      } else if (error.$metadata?.httpStatusCode === 403) {
        // We have permission issues - bucket might exist but we can't check
        console.warn(`[STORAGE] Permission denied checking bucket '${this.bucket}'. Assuming it exists.`);
        bucketExistsCache.set(cacheKey, true);
      } else {
        console.error(`[STORAGE] Error checking bucket '${this.bucket}':`, error.message);
        throw error;
      }
    }
  }

  async uploadFromBytes(path: string, data: Buffer, metadata?: { contentType?: string }): Promise<{ ok: boolean; error?: string }> {
    try {
      // Wait for bucket initialization to complete
      await this.initPromise;
      
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: path,
        Body: data,
        ContentType: metadata?.contentType,
      });
      await this.client.send(command);
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  async downloadAsBytes(path: string): Promise<{ ok: boolean; value?: any; error?: string }> {
    try {
      // Wait for bucket initialization to complete
      await this.initPromise;
      
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });
      const response = await this.client.send(command);
      if (response.Body) {
        const chunks: Uint8Array[] = [];
        for await (const chunk of response.Body as any) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        return { ok: true, value: buffer };
      }
      return { ok: false, error: 'No data in response' };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  async getDownloadUrl(path: string): Promise<{ ok: boolean; url?: string; error?: string }> {
    try {
      // Wait for bucket initialization to complete
      await this.initPromise;
      
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });
      const url = await getSignedUrl(this.client, command, { expiresIn: 3600 }); // 1 hour
      return { ok: true, url };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  async delete(path: string): Promise<{ ok: boolean; error?: string }> {
    try {
      // Wait for bucket initialization to complete
      await this.initPromise;
      
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });
      await this.client.send(command);
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  async list(prefix?: string): Promise<{ ok: boolean; keys?: string[]; error?: string }> {
    try {
      // Wait for bucket initialization to complete
      await this.initPromise;
      
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix || '',
      });
      const response = await this.client.send(command);
      const keys = response.Contents?.map(obj => obj.Key || '') || [];
      return { ok: true, keys };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  async listWithMetadata(prefix?: string): Promise<{ ok: boolean; objects?: StorageObject[]; error?: string }> {
    try {
      // Wait for bucket initialization to complete
      await this.initPromise;
      
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix || '',
      });
      const response = await this.client.send(command);
      
      if (!response.Contents) {
        return { ok: true, objects: [] };
      }

      const objects: StorageObject[] = await Promise.all(
        response.Contents.map(async (obj) => {
          const key = obj.Key || '';
          const urlResult = await this.getDownloadUrl(key);
          return {
            key,
            size: obj.Size || 0,
            lastModified: obj.LastModified || new Date(),
            url: urlResult.ok ? urlResult.url : undefined,
          };
        })
      );

      return { ok: true, objects };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }
}

export interface StorageCredentials {
  minioEndpoint?: string;
  minioAccessKey?: string;
  minioSecretKey?: string;
  minioBucket?: string;
}

/**
 * Get the appropriate storage adapter based on configuration
 * Priority:
 * 1. Provided credentials (from database or direct params)
 * 2. Environment variables
 * 3. Replit Object Storage (fallback)
 */
export function getStorageAdapter(credentials?: StorageCredentials): StorageAdapter {
  // Check for MinIO configuration from provided credentials or environment
  const minioEndpoint = credentials?.minioEndpoint || process.env.MINIO_ENDPOINT;
  const minioAccessKey = credentials?.minioAccessKey || process.env.MINIO_ACCESS_KEY;
  const minioSecretKey = credentials?.minioSecretKey || process.env.MINIO_SECRET_KEY;
  const minioBucket = credentials?.minioBucket || process.env.MINIO_BUCKET || 'usa-luxury-limo';

  if (minioEndpoint && minioAccessKey && minioSecretKey) {
    // Validate bucket name
    if (!minioBucket || typeof minioBucket !== 'string' || minioBucket.trim() === '') {
      throw new Error('Invalid MinIO bucket name. Bucket name must be a non-empty string.');
    }
    
    console.log('[STORAGE] Using MinIO/S3 storage adapter');
    return new S3StorageAdapter({
      endpoint: minioEndpoint,
      accessKeyId: minioAccessKey,
      secretAccessKey: minioSecretKey,
      bucket: minioBucket.trim(),
      forcePathStyle: true, // Required for MinIO
    });
  }

  // Check for AWS S3 configuration
  const s3Bucket = process.env.S3_BUCKET;
  const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
  const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const awsRegion = process.env.AWS_REGION || 'us-east-1';

  if (s3Bucket && awsAccessKey && awsSecretKey) {
    console.log('[STORAGE] Using AWS S3 storage adapter');
    return new S3StorageAdapter({
      endpoint: `https://s3.${awsRegion}.amazonaws.com`,
      region: awsRegion,
      accessKeyId: awsAccessKey,
      secretAccessKey: awsSecretKey,
      bucket: s3Bucket,
      forcePathStyle: false, // AWS S3 uses virtual-hosted-style
    });
  }

  // Fall back to Replit Object Storage
  const replitBucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (replitBucketId) {
    console.log('[STORAGE] Using Replit Object Storage adapter');
    return new ReplitStorageAdapter(replitBucketId);
  }

  throw new Error('No object storage configured. Set either MINIO_* or S3_* or DEFAULT_OBJECT_STORAGE_BUCKET_ID environment variables.');
}
