import { Router, Request, Response } from 'express';
import { S3Client, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';
import { 
  isSetupComplete, 
  getSetupConfig, 
  saveSetupConfig, 
  sanitizeCompanyName, 
  sanitizeBucketName,
  generateSessionSecret,
  SetupConfig 
} from './setupConfig';
import { 
  testDatabaseConnection, 
  createDatabaseIfNotExists, 
  runDatabaseMigrations,
  resetDatabaseConnection,
  initializeDatabase 
} from './dynamicDb';
import bcrypt from 'bcrypt';

const router = Router();

router.get('/api/setup/status', (req: Request, res: Response) => {
  const setupComplete = isSetupComplete();
  const config = getSetupConfig();
  
  res.json({
    setupComplete,
    companyName: config?.companyName || null,
    hasDatabase: !!config?.databaseUrl,
    hasMinio: !!(config?.minioEndpoint && config?.minioAccessKey && config?.minioSecretKey),
  });
});

router.post('/api/setup/test-database', async (req: Request, res: Response) => {
  try {
    const { host, port, user, password, sslRequired } = req.body;

    if (!host || !port || !user || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required database connection fields' 
      });
    }

    const connectionString = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/postgres${sslRequired ? '?sslmode=require' : ''}`;
    
    const result = await testDatabaseConnection(connectionString);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to test database connection' 
    });
  }
});

router.post('/api/setup/test-minio', async (req: Request, res: Response) => {
  try {
    const { endpoint, accessKey, secretKey } = req.body;

    if (!endpoint || !accessKey || !secretKey) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required MinIO connection fields' 
      });
    }

    const client = new S3Client({
      endpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true,
    });

    try {
      await client.send(new HeadBucketCommand({ Bucket: 'test-connection-bucket' }));
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        res.json({ success: true, message: 'MinIO connection successful' });
        return;
      }
      if (error.$metadata?.httpStatusCode === 403) {
        res.json({ success: true, message: 'MinIO connection successful (bucket access restricted)' });
        return;
      }
      throw error;
    }

    res.json({ success: true, message: 'MinIO connection successful' });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to connect to MinIO' 
    });
  }
});

router.post('/api/setup/complete', async (req: Request, res: Response) => {
  try {
    const { 
      companyName,
      dbHost,
      dbPort,
      dbUser,
      dbPassword,
      dbSslRequired,
      minioEndpoint,
      minioAccessKey,
      minioSecretKey,
      adminEmail,
      adminPassword,
      adminFirstName,
      adminLastName
    } = req.body;

    if (!companyName || !dbHost || !dbPort || !dbUser || !dbPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    if (!adminEmail || !adminPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Admin email and password are required' 
      });
    }

    const companySlug = sanitizeCompanyName(companyName);
    const bucketName = sanitizeBucketName(companyName);
    const databaseName = companySlug;

    console.log(`[SETUP] Starting setup for company: ${companyName}`);
    console.log(`[SETUP] Database name: ${databaseName}`);
    console.log(`[SETUP] Bucket name: ${bucketName}`);

    const dbResult = await createDatabaseIfNotExists(
      dbHost,
      parseInt(dbPort),
      dbUser,
      dbPassword,
      databaseName,
      dbSslRequired === true
    );

    if (!dbResult.success) {
      return res.status(500).json({ 
        success: false, 
        message: `Database creation failed: ${dbResult.message}` 
      });
    }

    console.log(`[SETUP] Database created/verified: ${databaseName}`);

    const migrationResult = await runDatabaseMigrations(dbResult.databaseUrl);
    if (!migrationResult.success) {
      return res.status(500).json({ 
        success: false, 
        message: `Database migration failed: ${migrationResult.message}` 
      });
    }

    console.log(`[SETUP] Database migrations completed`);

    let minioBucket = '';
    if (minioEndpoint && minioAccessKey && minioSecretKey) {
      try {
        const s3Client = new S3Client({
          endpoint: minioEndpoint,
          region: 'us-east-1',
          credentials: {
            accessKeyId: minioAccessKey,
            secretAccessKey: minioSecretKey,
          },
          forcePathStyle: true,
        });

        try {
          await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
          console.log(`[SETUP] MinIO bucket already exists: ${bucketName}`);
        } catch (error: any) {
          if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
            await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
            console.log(`[SETUP] Created MinIO bucket: ${bucketName}`);

            try {
              const bucketPolicy = {
                Version: '2012-10-17',
                Statement: [
                  {
                    Sid: 'PublicRead',
                    Effect: 'Allow',
                    Principal: '*',
                    Action: ['s3:GetObject'],
                    Resource: [`arn:aws:s3:::${bucketName}/*`]
                  }
                ]
              };
              await s3Client.send(new PutBucketPolicyCommand({
                Bucket: bucketName,
                Policy: JSON.stringify(bucketPolicy)
              }));
              console.log(`[SETUP] Set bucket policy for: ${bucketName}`);
            } catch (policyError) {
              console.log(`[SETUP] Could not set bucket policy (may not be supported): ${bucketName}`);
            }
          } else {
            throw error;
          }
        }

        minioBucket = bucketName;
      } catch (error: any) {
        console.error(`[SETUP] MinIO bucket creation error:`, error);
        return res.status(500).json({ 
          success: false, 
          message: `MinIO bucket creation failed: ${error.message}` 
        });
      }
    }

    const sessionSecret = generateSessionSecret();

    const config: SetupConfig = {
      companyName,
      companySlug,
      databaseUrl: dbResult.databaseUrl,
      databaseName,
      minioEndpoint: minioEndpoint || '',
      minioAccessKey: minioAccessKey || '',
      minioSecretKey: minioSecretKey || '',
      minioBucket: minioBucket,
      sessionSecret,
      setupCompleted: true,
      setupCompletedAt: new Date().toISOString(),
    };

    saveSetupConfig(config);
    console.log(`[SETUP] Configuration saved`);

    resetDatabaseConnection();
    const dbConnection = initializeDatabase();
    
    if (dbConnection) {
      try {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        await dbConnection.pool.query(`
          INSERT INTO users (id, username, email, password, first_name, last_name, role, is_active)
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'admin', true)
          ON CONFLICT (email) DO NOTHING
        `, [adminEmail, adminEmail, hashedPassword, adminFirstName || 'Admin', adminLastName || 'User']);
        
        console.log(`[SETUP] Admin user created: ${adminEmail}`);

        await dbConnection.pool.query(`
          INSERT INTO system_settings (key, value, description)
          VALUES 
            ('COMPANY_NAME', $1, 'Company display name'),
            ('MINIO_ENDPOINT', $2, 'MinIO S3 API URL'),
            ('MINIO_ACCESS_KEY', $3, 'MinIO Access Key'),
            ('MINIO_SECRET_KEY', $4, 'MinIO Secret Key'),
            ('MINIO_BUCKET', $5, 'MinIO Bucket Name')
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `, [companyName, minioEndpoint || '', minioAccessKey || '', minioSecretKey || '', minioBucket]);

        console.log(`[SETUP] System settings saved to database`);
      } catch (dbError: any) {
        console.error(`[SETUP] Error creating admin user:`, dbError);
      }
    }

    res.json({ 
      success: true, 
      message: 'Setup completed successfully',
      companyName,
      databaseName,
      bucketName: minioBucket || null,
      restartRequired: true
    });

  } catch (error: any) {
    console.error('[SETUP] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Setup failed' 
    });
  }
});

router.get('/api/setup/config', (req: Request, res: Response) => {
  if (!isSetupComplete()) {
    return res.status(404).json({ 
      success: false, 
      message: 'Setup not complete' 
    });
  }

  const config = getSetupConfig();
  if (!config) {
    return res.status(404).json({ 
      success: false, 
      message: 'Configuration not found' 
    });
  }

  res.json({
    success: true,
    companyName: config.companyName,
    companySlug: config.companySlug,
    databaseName: config.databaseName,
    minioBucket: config.minioBucket,
    setupCompletedAt: config.setupCompletedAt,
  });
});

export default router;
