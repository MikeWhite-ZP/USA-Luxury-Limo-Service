import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hashPassword, comparePasswords, generateResetToken, hashToken, isTokenExpired, PASSWORD_RESET_EXPIRY_MS } from "./auth";
import { insertBookingSchema, insertContactSchema, insertSavedAddressSchema, insertPricingRuleSchema, insertVehicleTypeSchema, insertDriverDocumentSchema, insertCmsSettingSchema, insertCmsContentSchema, insertCmsMediaSchema, insertServiceSchema, type User, type Booking, vehicles } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";
import multer from "multer";
import crypto from "crypto";
import { hasEncryptionKey } from "./crypto";
import { getStorageAdapter, type StorageAdapter, type StorageCredentials } from "./objectStorageAdapter";
import { sendEmail, testSMTPConnection, clearEmailCache, getContactFormEmailHTML, getTestEmailHTML, getBookingConfirmationEmailHTML, getBookingStatusUpdateEmailHTML, getDriverAssignmentEmailHTML, getPasswordResetEmailHTML, getPaymentConfirmationEmailHTML, getDriverOnTheWayEmailHTML, getDriverArrivedEmailHTML, getBookingCancelledEmailHTML, sendPasswordResetEmail, sendTemporaryPasswordEmail, sendUsernameReminderEmail } from "./email";
import { getTwilioConnectionStatus, sendTestSMS, sendBookingConfirmationSMS, sendBookingStatusUpdateSMS, sendDriverAssignmentSMS, sendSMS, sendDriverOnTheWaySMS, sendDriverArrivedSMS, sendBookingCancelledSMS, sendAdminNewBookingAlertSMS, sendPasswordResetSMS, sendTemporaryPasswordSMS, sendUsernameReminderSMS } from "./sms";
import { sendNewBookingReport, sendCancelledBookingReport, sendDriverActivityReport } from "./emailReports";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { S3Client, HeadBucketCommand, ListBucketsCommand } from "@aws-sdk/client-s3";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Object Storage adapter lazily (on first use) to avoid startup errors
let objectStorage: StorageAdapter | null = null;
let lastCredentialCheck = 0;
const CREDENTIAL_CACHE_MS = 60000; // Cache credentials for 1 minute

/**
 * Get object storage adapter with credentials from database (if configured)
 * Falls back to environment variables if database doesn't have MinIO credentials
 * Caches the adapter instance for performance
 */
async function getObjectStorage(): Promise<StorageAdapter> {
  const now = Date.now();
  
  // Return cached adapter if it exists and credentials were recently checked
  if (objectStorage && (now - lastCredentialCheck) < CREDENTIAL_CACHE_MS) {
    return objectStorage;
  }

  try {
    // Try to fetch MinIO credentials from database
    let credentials: StorageCredentials = {};
    
    try {
      // Extract .value from SystemSetting objects
      const endpointSetting = await storage.getSetting('MINIO_ENDPOINT');
      const accessKeySetting = await storage.getSetting('MINIO_ACCESS_KEY');
      const secretKeySetting = await storage.getSetting('MINIO_SECRET_KEY');
      const bucketSetting = await storage.getSetting('MINIO_BUCKET');

      const endpoint = endpointSetting?.value?.trim();
      const accessKey = accessKeySetting?.value?.trim();
      const secretKey = secretKeySetting?.value?.trim();
      const bucket = bucketSetting?.value?.trim();

      // Only use database credentials if all required fields are present
      if (endpoint && accessKey && secretKey) {
        const effectiveBucket = bucket && bucket !== '' ? bucket : 'usa-luxury-limo';
        credentials = {
          minioEndpoint: endpoint,
          minioAccessKey: accessKey,
          minioSecretKey: secretKey,
          minioBucket: effectiveBucket,
        };
        console.log(`[STORAGE] Using MinIO credentials from database, bucket: ${effectiveBucket}`);
      }
    } catch (dbError: any) {
      // Database might not be available or settings not configured
      // This is okay - we'll fall back to environment variables
      console.log('[STORAGE] Could not fetch credentials from database, using environment variables');
    }

    // Initialize storage adapter (will fall back to env vars if credentials are empty)
    objectStorage = getStorageAdapter(credentials);
    lastCredentialCheck = now;
    
    return objectStorage;
  } catch (error: any) {
    console.error('[STORAGE] Failed to initialize storage adapter:', error.message);
    throw new Error('Object Storage not configured. Please set up storage in admin settings or environment variables.');
  }
}

/**
 * Force refresh of object storage adapter (e.g., when credentials are updated)
 */
function refreshObjectStorage(): void {
  objectStorage = null;
  lastCredentialCheck = 0;
}

/**
 * Convert a stored file path/URL to a presigned URL
 * Handles backwards compatibility with old full URLs
 * 
 * @param pathOrUrl - Either a full URL (legacy) or an object storage key (new format)
 * @returns Presigned URL, original URL/path, or empty string if null
 */
async function getPresignedUrl(pathOrUrl: string | null | undefined): Promise<string> {
  if (!pathOrUrl) return '';
  
  // Extract storage key from full URL or use path directly
  let storageKey: string;
  
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    // Extract the storage key from the full URL (backwards compatibility)
    storageKey = extractStorageKey(pathOrUrl);
  } else {
    // Remove leading slash if present
    storageKey = pathOrUrl.startsWith('/') ? pathOrUrl.slice(1) : pathOrUrl;
  }
  
  // Generate presigned URL for the storage key
  try {
    const objStorage = await getObjectStorage();
    const result = await objStorage.getDownloadUrl(storageKey);
    
    if (result.ok && result.url) {
      return result.url;
    }
    
    // If presigned URL generation fails, return the original path for debugging
    console.warn(`Failed to generate presigned URL for ${storageKey}:`, result.error);
    return pathOrUrl;
  } catch (error) {
    console.error(`Error generating presigned URL for ${storageKey}:`, error);
    return pathOrUrl;
  }
}

/**
 * Extract object storage key from URL or path
 * Used for deletion operations
 * 
 * @param urlOrPath - Either a full URL or an object storage key
 * @returns Object storage key
 */
function extractStorageKey(urlOrPath: string): string {
  try {
    // If it's a full URL, extract the pathname
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
      const url = new URL(urlOrPath);
      let pathname = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
      
      // Remove bucket name from path if present (e.g., "replit/cms/..." -> "cms/...")
      // MinIO URLs have format: https://minio.example.com/bucket-name/object-key
      const bucketName = process.env.MINIO_BUCKET || 'replit';
      if (pathname.startsWith(bucketName + '/')) {
        pathname = pathname.slice(bucketName.length + 1);
      }
      
      return pathname;
    }
    
    // Otherwise, it's already a key - just remove leading slash if present
    return urlOrPath.startsWith('/') ? urlOrPath.slice(1) : urlOrPath;
  } catch (error) {
    // If URL parsing fails, treat as a path
    return urlOrPath.startsWith('/') ? urlOrPath.slice(1) : urlOrPath;
  }
}

// Configure Multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF and common image formats
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and image files (JPEG, PNG, WEBP, HEIC) are allowed.'));
    }
  }
});

// Admin hostname validation middleware
// Restricts admin panel access to specific subdomains for security
const requireAdminHostname = (req: any, res: any, next: any) => {
  // Get allowed admin hosts from environment variable
  // Format: comma-separated list, e.g., "adminaccess.usaluxurylimo.net,admin.mydomain.com"
  const allowedHosts = process.env.ADMIN_PANEL_HOSTS?.split(',').map(h => h.trim().toLowerCase()) || [];
  
  // In development or if not configured, allow all hosts
  if (allowedHosts.length === 0 || process.env.NODE_ENV === 'development') {
    return next();
  }

  // Get the current hostname from the request
  const currentHost = req.hostname?.toLowerCase() || req.get('host')?.split(':')[0]?.toLowerCase();
  
  // Check if accessing via admin subdomain
  const isAdminSubdomain = currentHost?.startsWith('adminaccess.') || allowedHosts.some(host => currentHost === host);
  
  if (!isAdminSubdomain) {
    return res.status(403).json({ 
      message: 'Access denied. Admin panel is only accessible via the designated subdomain.' 
    });
  }
  
  next();
};

// Admin-only middleware to avoid repeated user lookups
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await storage.getUser(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Attach user to request for downstream use
    req.adminUser = user;
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Authorization check failed' });
  }
};

// TomTom API integration functions with standardized key retrieval
// Priority: Database settings first, then environment variables as fallback
async function getTomTomApiKey(storage: any): Promise<string | null> {
  try {
    // Check database first (admin-configured settings)
    const dbSetting = await storage.getSystemSetting('TOMTOM_API_KEY');
    if (dbSetting?.value) {
      return dbSetting.value;
    }
    
    // Fall back to environment variable
    if (process.env.TOMTOM_API_KEY) {
      return process.env.TOMTOM_API_KEY;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to retrieve TomTom API key:', error);
    return null;
  }
}

// RapidAPI integration functions with standardized key retrieval
// Priority: Database settings first, then environment variables as fallback
async function getRapidApiKey(storage: any): Promise<string | null> {
  try {
    // Check database first (admin-configured settings)
    const dbSetting = await storage.getSystemSetting('RAPIDAPI_KEY');
    if (dbSetting?.value) {
      return dbSetting.value;
    }
    
    // Fall back to environment variable
    if (process.env.RAPIDAPI_KEY) {
      return process.env.RAPIDAPI_KEY;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to retrieve RapidAPI key:', error);
    return null;
  }
}

async function geocodeAddress(address: string, storage: any): Promise<{lat: number, lon: number} | null> {
  try {
    const apiKey = await getTomTomApiKey(storage);
    if (!apiKey) {
      console.warn('TomTom API key not configured');
      return null;
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.tomtom.com/search/2/geocode/${encodedAddress}.json?key=${apiKey}&limit=1&countrySet=US`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TomTom geocoding failed: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.position.lat,
        lon: result.position.lon
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

async function calculateRoute(fromCoords: {lat: number, lon: number}, toCoords: {lat: number, lon: number}, storage: any): Promise<any> {
  try {
    const apiKey = await getTomTomApiKey(storage);
    if (!apiKey) {
      console.warn('TomTom API key not configured');
      return null;
    }

    const url = `https://api.tomtom.com/routing/1/calculateRoute/${fromCoords.lat},${fromCoords.lon}:${toCoords.lat},${toCoords.lon}/json?key=${apiKey}&routeType=fastest&traffic=true`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TomTom routing failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Route calculation error:', error);
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Admin hostname validation - restrict admin panel to specific subdomains
  // This applies to ALL /api/admin/* routes for security
  app.use('/api/admin', requireAdminHostname);

  // Health check endpoint for Coolify/Docker
  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate presigned URL for profile image if present
      const profileImageUrl = await getPresignedUrl(user.profileImageUrl);
      
      res.json({
        ...user,
        profileImageUrl
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get user by ID (admin only - for fetching passenger email for invoices)
  app.get('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Verify admin access
      const currentUserId = req.user.id;
      const currentUser = await storage.getUser(currentUserId);
      
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user data (safe fields only)
      res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      });
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public: Request password reset
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { emailOrPhone } = req.body;
      
      if (!emailOrPhone) {
        return res.status(400).json({ message: 'Email or phone number required' });
      }
      
      // Always return same response to prevent enumeration
      const uniformResponse = { message: 'If an account exists, a password reset link has been sent' };
      
      const user = await storage.getUserByEmailOrPhone(emailOrPhone);
      
      if (user) {
        // Generate reset token
        const resetToken = generateResetToken();
        const hashedToken = hashToken(resetToken);
        const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);
        
        // Store hashed token
        await storage.setPasswordResetToken(user.id, hashedToken, expiresAt);
        
        // Send notification (fire and forget)
        if (user.email) {
          sendPasswordResetEmail(user.email, resetToken, user.username).catch(err => 
            console.error('Failed to send password reset email:', err)
          );
        } else if (user.phone) {
          sendPasswordResetSMS(user.phone, resetToken).catch(err => 
            console.error('Failed to send password reset SMS:', err)
          );
        }
      }
      
      // Always return 202 regardless of whether user exists
      res.status(202).json(uniformResponse);
    } catch (error) {
      console.error('Error in forgot password:', error);
      res.status(202).json({ message: 'If an account exists, a password reset link has been sent' });
    }
  });

  // Public: Request username reminder
  app.post('/api/auth/forgot-username', async (req, res) => {
    try {
      const { emailOrPhone } = req.body;
      
      if (!emailOrPhone) {
        return res.status(400).json({ message: 'Email or phone number required' });
      }
      
      // Always return same response to prevent enumeration
      const uniformResponse = { message: 'If an account exists, your username has been sent' };
      
      const user = await storage.getUserByEmailOrPhone(emailOrPhone);
      
      if (user) {
        // Send notification (fire and forget)
        if (user.email) {
          sendUsernameReminderEmail(user.email, user.username).catch(err => 
            console.error('Failed to send username reminder email:', err)
          );
        } else if (user.phone) {
          sendUsernameReminderSMS(user.phone, user.username).catch(err => 
            console.error('Failed to send username reminder SMS:', err)
          );
        }
      }
      
      // Always return 202 regardless of whether user exists
      res.status(202).json(uniformResponse);
    } catch (error) {
      console.error('Error in forgot username:', error);
      res.status(202).json({ message: 'If an account exists, your username has been sent' });
    }
  });

  // Public: Verify reset token validity
  app.get('/api/auth/verify-reset-token/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ valid: false, message: 'Token required' });
      }
      
      const hashedToken = hashToken(token);
      const user = await storage.getUserByPasswordResetToken(hashedToken);
      
      if (!user || !user.passwordResetExpires) {
        return res.json({ valid: false, message: 'Invalid or expired reset token' });
      }
      
      if (isTokenExpired(user.passwordResetExpires)) {
        return res.json({ valid: false, message: 'Reset token has expired' });
      }
      
      res.json({ valid: true, message: 'Token is valid' });
    } catch (error) {
      console.error('Error verifying reset token:', error);
      res.status(500).json({ valid: false, message: 'Failed to verify token' });
    }
  });

  // Public: Reset password using token
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password required' });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      
      const hashedToken = hashToken(token);
      const user = await storage.getUserByPasswordResetToken(hashedToken);
      
      if (!user || !user.passwordResetExpires) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }
      
      if (isTokenExpired(user.passwordResetExpires)) {
        return res.status(400).json({ message: 'Reset token has expired' });
      }
      
      // Hash new password and update
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(user.id, { password: hashedPassword });
      
      // Clear reset token
      await storage.clearPasswordResetToken(user.id);
      
      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  // Update user profile
  app.patch('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updateSchema = z.object({
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        email: z.string().email("Invalid email address"),
        phone: z.string().optional(),
        username: z.string()
          .min(3, "Username must be at least 3 characters")
          .max(30, "Username cannot exceed 30 characters")
          .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
          .optional(),
      });

      const validatedData = updateSchema.parse(req.body);
      
      // Check if email is already in use by another user
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "Email is already in use" });
      }

      // Check if username is already in use by another user
      if (validatedData.username) {
        const existingUsername = await storage.getUserByUsername(validatedData.username);
        if (existingUsername && existingUsername.id !== userId) {
          return res.status(400).json({ message: "Username is already taken" });
        }
      }

      const updatedUser = await storage.updateUser(userId, validatedData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Update user password
  app.patch('/api/user/password', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const passwordSchema = z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string()
          .min(8, "Password must be at least 8 characters")
          .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
          .regex(/[a-z]/, "Password must contain at least one lowercase letter")
          .regex(/[0-9]/, "Password must contain at least one number"),
      });

      const { currentPassword, newPassword } = passwordSchema.parse(req.body);
      
      // Get user with password
      const user = await storage.getUser(userId);
      if (!user || !user.password) {
        return res.status(404).json({ message: "User not found or not using local authentication" });
      }

      // Verify current password
      const isValidPassword = await comparePasswords(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update password
      const updatedUser = await storage.updateUser(userId, { password: hashedPassword });
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  // Check username availability
  app.get('/api/user/check-username/:username', isAuthenticated, async (req: any, res) => {
    try {
      const { username } = req.params;
      const userId = req.user.id;

      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_-]+$/;
      if (!usernameRegex.test(username) || username.length < 3 || username.length > 30) {
        return res.status(400).json({ 
          available: false, 
          message: "Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens" 
        });
      }

      const existingUser = await storage.getUserByUsername(username);
      
      // Username is available if no one has it or the current user has it
      const available = !existingUser || existingUser.id === userId;
      
      res.json({ 
        available, 
        message: available ? "Username is available" : "Username is already taken" 
      });
    } catch (error) {
      console.error("Error checking username:", error);
      res.status(500).json({ available: false, message: "Failed to check username" });
    }
  });

  // Upload profile picture
  app.post('/api/user/profile-picture', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const file = req.file;
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `profile-pictures/${userId}/profile-${Date.now()}.${fileExtension}`;

      // Upload to Object Storage
      const objStorage = await getObjectStorage();
      const { ok, error } = await objStorage.uploadFromBytes(
        fileName,
        file.buffer
      );

      if (!ok) {
        console.error('Upload to Object Storage failed:', error);
        return res.status(500).json({ message: 'Failed to upload image' });
      }

      // Store just the file path (object storage key), not the full URL
      // Presigned URLs will be generated on-the-fly when fetching
      const imageUrl = fileName;

      // Update user's profileImageUrl in database
      const updatedUser = await storage.updateUser(userId, { 
        profileImageUrl: imageUrl 
      });

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error('Profile picture upload error:', error);
      res.status(500).json({ message: 'Failed to upload profile picture' });
    }
  });

  // Vehicle types (public)
  app.get('/api/vehicle-types', async (req, res) => {
    try {
      const vehicleTypes = await storage.getVehicleTypes();
      
      // Generate presigned URLs for all vehicle type images
      const vehicleTypesWithUrls = await Promise.all(
        vehicleTypes.map(async (vt) => ({
          ...vt,
          imageUrl: await getPresignedUrl(vt.imageUrl)
        }))
      );
      
      res.json(vehicleTypesWithUrls);
    } catch (error) {
      console.error("Error fetching vehicle types:", error);
      res.status(500).json({ message: "Failed to fetch vehicle types" });
    }
  });

  // Admin: Get all vehicle types (including inactive)
  app.get('/api/admin/vehicle-types', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const vehicleTypes = await storage.getAllVehicleTypes();
      
      // Generate presigned URLs for all vehicle type images
      const vehicleTypesWithUrls = await Promise.all(
        vehicleTypes.map(async (vt) => ({
          ...vt,
          imageUrl: await getPresignedUrl(vt.imageUrl)
        }))
      );
      
      res.json(vehicleTypesWithUrls);
    } catch (error) {
      console.error("Error fetching all vehicle types:", error);
      res.status(500).json({ message: "Failed to fetch vehicle types" });
    }
  });

  // Admin: Create vehicle type
  app.post('/api/admin/vehicle-types', requireAdmin, async (req, res) => {
    try {
      const vehicleTypeData = insertVehicleTypeSchema.parse(req.body);
      const vehicleType = await storage.createVehicleType(vehicleTypeData);
      res.status(201).json(vehicleType);
    } catch (error: any) {
      console.error("Error creating vehicle type:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid vehicle type data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create vehicle type" });
    }
  });

  // Admin: Update vehicle type
  app.put('/api/admin/vehicle-types/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertVehicleTypeSchema.partial().parse(req.body);
      const vehicleType = await storage.updateVehicleType(id, updates);
      
      if (!vehicleType) {
        return res.status(404).json({ message: "Vehicle type not found" });
      }
      
      res.json(vehicleType);
    } catch (error: any) {
      console.error("Error updating vehicle type:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid vehicle type data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update vehicle type" });
    }
  });

  // Admin: Delete vehicle type
  app.delete('/api/admin/vehicle-types/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if vehicle type exists
      const vehicleType = await storage.getVehicleType(id);
      if (!vehicleType) {
        return res.status(404).json({ message: "Vehicle type not found" });
      }
      
      await storage.deleteVehicleType(id);
      res.json({ message: "Vehicle type deleted successfully" });
    } catch (error) {
      console.error("Error deleting vehicle type:", error);
      res.status(500).json({ message: "Failed to delete vehicle type" });
    }
  });

  // Services CMS (public endpoint for frontend)
  app.get('/api/services', async (req, res) => {
    try {
      const services = await storage.getActiveServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Admin: Get all services (including inactive)
  app.get('/api/admin/services', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching all services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Admin: Create service
  app.post('/api/admin/services', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error: any) {
      console.error("Error creating service:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  // Admin: Update service
  app.patch('/api/admin/services/:id', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(id, updates);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.json(service);
    } catch (error: any) {
      console.error("Error updating service:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  // Admin: Delete service
  app.delete('/api/admin/services/:id', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      await storage.deleteService(id);
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Admin: Upload service image
  app.post('/api/admin/services/:id/upload-image', isAuthenticated, requireAdmin, upload.single('image'), async (req: any, res) => {
    try {
      const { id } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      const objectStorage = await getObjectStorage();
      const fileName = `cms/services/${id}-${Date.now()}.${req.file.mimetype.split('/')[1]}`;
      
      const uploadResult = await objectStorage.uploadFromBytes(fileName, req.file.buffer, { contentType: req.file.mimetype });
      if (!uploadResult.ok) {
        return res.status(500).json({ message: `Failed to upload image: ${uploadResult.error}` });
      }
      
      const urlResult = await objectStorage.getDownloadUrl(fileName);
      if (!urlResult.ok || !urlResult.url) {
        return res.status(500).json({ message: `Failed to get download URL: ${urlResult.error}` });
      }
      
      const updatedService = await storage.updateService(id, { imageUrl: urlResult.url });
      res.json(updatedService);
    } catch (error) {
      console.error("Error uploading service image:", error);
      res.status(500).json({ message: "Failed to upload service image" });
    }
  });

  // Flight search using AeroDataBox RapidAPI with detailed information
  app.get('/api/flights/search', async (req, res) => {
    const { flightNumber, date } = req.query;
    
    if (!flightNumber || typeof flightNumber !== 'string') {
      return res.status(400).json({ error: 'Flight number is required' });
    }

    let timeoutId: NodeJS.Timeout | undefined;
    try {
      const apiKey = await getRapidApiKey(storage);
      if (!apiKey) {
        return res.status(500).json({ error: 'RapidAPI key not configured' });
      }

      // If date is provided, try to get detailed flight info for that specific date
      if (date && typeof date === 'string') {
        const detailedUrl = `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(flightNumber)}/${date}`;
        
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 20000);
        
        const detailedOptions = {
          method: 'GET',
          headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': 'aerodatabox.p.rapidapi.com'
          },
          signal: controller.signal
        };

        try {
          const detailedResponse = await fetch(detailedUrl, detailedOptions);
          
          if (detailedResponse.ok) {
            const detailedData = await detailedResponse.json();
            // Successfully got detailed data, return it
            return res.json(detailedData);
          }
        } catch (error) {
          // Detailed search failed (timeout or error), fall back to simple search
          console.log('Detailed flight search failed, falling back to simple search');
        }
      }

      // Fallback: Use simple search endpoint
      const url = `https://aerodatabox.p.rapidapi.com/flights/search/term?q=${encodeURIComponent(flightNumber)}`;
      
      const controller = new AbortController();
      if (!timeoutId) {
        timeoutId = setTimeout(() => controller.abort(), 20000);
      }
      
      const options = {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'aerodatabox.p.rapidapi.com'
        },
        signal: controller.signal
      };

      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('AeroDataBox API error:', response.status, errorText);
        
        // Return more specific error messages
        if (response.status === 504 || response.status === 503) {
          return res.status(response.status).json({ 
            error: 'Flight search service is currently unavailable. Please try again in a moment.' 
          });
        } else if (response.status === 401 || response.status === 403) {
          return res.status(500).json({ 
            error: 'Flight search API authentication failed. Please contact support.' 
          });
        } else if (response.status === 429) {
          return res.status(429).json({ 
            error: 'Too many flight search requests. Please wait a moment and try again.' 
          });
        }
        
        return res.status(response.status).json({ error: 'Flight search failed' });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Flight search error:', error);
      
      // Handle timeout error specifically
      if (error.name === 'AbortError') {
        return res.status(504).json({ 
          error: 'Flight search timed out. The service may be slow or unavailable. Please try again.' 
        });
      }
      
      res.status(500).json({ error: 'Flight search service temporarily unavailable' });
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  });

  // TomTom geocoding proxy
  app.get('/api/geocode', async (req, res) => {
    const { q, limit = 5 } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
      const apiKey = await getTomTomApiKey(storage);
      if (!apiKey) {
        return res.status(500).json({ error: 'TomTom API key not configured' });
      }

      const url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(q)}.json?key=${apiKey}&limit=${limit}&countrySet=US&typeahead=true`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`TomTom API error: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Geocoding error:', error);
      res.status(500).json({ error: 'Geocoding service temporarily unavailable' });
    }
  });

  // Distance calculation with proper coordinate validation
  app.post('/api/calculate-distance', async (req, res) => {
    const { origins, destinations } = req.body;
    
    if (!origins || !destinations) {
      return res.status(400).json({ error: 'Origins and destinations are required' });
    }

    // Validate coordinate format (lat,lon)
    const validateCoordinates = (coords: string): boolean => {
      const parts = coords.split(',');
      if (parts.length !== 2) return false;
      
      const lat = parseFloat(parts[0]);
      const lon = parseFloat(parts[1]);
      
      return !isNaN(lat) && !isNaN(lon) && 
             lat >= -90 && lat <= 90 && 
             lon >= -180 && lon <= 180;
    };

    if (!validateCoordinates(origins) || !validateCoordinates(destinations)) {
      return res.status(400).json({ error: 'Invalid coordinate format. Expected: "lat,lon"' });
    }

    try {
      const apiKey = await getTomTomApiKey(storage);
      if (!apiKey) {
        return res.status(500).json({ error: 'TomTom API key not configured' });
      }
      
      // Calculate route using TomTom Routing API with consistent parameters
      const routeUrl = `https://api.tomtom.com/routing/1/calculateRoute/${origins}:${destinations}/json?key=${apiKey}&routeType=fastest&traffic=true`;
      
      const response = await fetch(routeUrl);
      if (!response.ok) {
        throw new Error(`TomTom Routing API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceInMeters = route.summary.lengthInMeters;
        const timeInSeconds = route.summary.travelTimeInSeconds;
        
        res.json({
          distance: (distanceInMeters * 0.000621371).toFixed(2), // Convert to miles
          duration: Math.ceil(timeInSeconds / 60), // Convert to minutes
          route: route
        });
      } else {
        res.status(404).json({ error: 'No route found' });
      }
    } catch (error) {
      console.error('Distance calculation error:', error);
      res.status(500).json({ error: 'Distance calculation service temporarily unavailable' });
    }
  });

  // Quote calculation
  app.post('/api/calculate-quote', isAuthenticated, async (req, res) => {
    try {
      const { vehicleTypeId, bookingType, distance, duration, hours } = req.body;
      
      const vehicleType = await storage.getVehicleType(vehicleTypeId);
      if (!vehicleType) {
        return res.status(404).json({ error: 'Vehicle type not found' });
      }

      let totalAmount = 0;
      let breakdown: any = {};

      if (bookingType === 'transfer') {
        // Transfer pricing: base rate + distance
        const baseFare = parseFloat(vehicleType.minimumFare || '0');
        const parsedDistance = parseFloat(distance || '0');
        const perMileRate = parseFloat(vehicleType.perMileRate || '0');
        
        // Validate parsed numbers
        if (isNaN(baseFare) || isNaN(parsedDistance) || isNaN(perMileRate)) {
          return res.status(400).json({ error: 'Invalid pricing data' });
        }
        
        const distanceFare = perMileRate * parsedDistance;
        
        breakdown = {
          baseFare,
          distanceFare,
          distance: parsedDistance,
          perMileRate
        };
        
        totalAmount = baseFare + distanceFare;
      } else if (bookingType === 'hourly') {
        // Hourly pricing: hourly rate * hours
        const hourlyRate = parseFloat(vehicleType.hourlyRate);
        const requestedHours = parseInt(hours || '2', 10);
        
        // Validate parsed numbers
        if (isNaN(hourlyRate) || isNaN(requestedHours) || requestedHours < 1) {
          return res.status(400).json({ error: 'Invalid pricing data' });
        }
        
        breakdown = {
          hourlyRate,
          hours: requestedHours
        };
        
        totalAmount = hourlyRate * requestedHours;
      }

      res.json({
        vehicleType,
        totalAmount: totalAmount.toFixed(2),
        breakdown
      });
    } catch (error) {
      console.error('Quote calculation error:', error);
      res.status(500).json({ message: 'Failed to calculate quote' });
    }
  });

  // Create booking
  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        passengerId: userId,
        bookedBy: 'passenger',
        bookedAt: new Date(),
      });

      const booking = await storage.createBooking(bookingData);
      
      // Send notifications (fire-and-forget)
      (async () => {
        try {
          const passenger = await storage.getUser(userId);
          const vehicleType = await storage.getVehicleType(booking.vehicleTypeId);
          
          if (passenger && vehicleType) {
            // 1. Send admin email report
            await sendNewBookingReport(booking, passenger, vehicleType.name || 'Unknown Vehicle');
            
            // 2. Send passenger confirmation email
            const scheduledDateTime = new Date(booking.scheduledDateTime).toLocaleString('en-US', {
              dateStyle: 'full',
              timeStyle: 'short'
            });
            
            await sendEmail({
              to: passenger.email,
              subject: `Booking Confirmation - USA Luxury Limo #${booking.id.slice(0, 8)}`,
              html: getBookingConfirmationEmailHTML({
                passengerName: `${passenger.firstName || ''} ${passenger.lastName || ''}`.trim() || passenger.username || 'Valued Customer',
                bookingId: booking.id.slice(0, 8),
                pickupAddress: booking.pickupAddress,
                destinationAddress: booking.destinationAddress || 'N/A',
                scheduledDateTime,
                vehicleType: vehicleType.name || 'Luxury Vehicle',
                totalAmount: booking.totalAmount || '0.00',
                status: booking.status || 'pending'
              })
            });
            
            // 3. Send passenger confirmation SMS
            if (passenger.phone) {
              await sendBookingConfirmationSMS(
                passenger.phone,
                booking.id,
                booking.pickupAddress,
                new Date(booking.scheduledDateTime)
              );
            }
            
            // 4. Send admin SMS alert  
            const adminEmailSetting = await storage.getSystemSetting('SYSTEM_ADMIN_EMAIL');
            if (adminEmailSetting?.value) {
              // Try to get admin phone for SMS
              const adminUsers = await storage.getAllUsers();
              const adminUser = adminUsers.find(u => u.role === 'admin' && u.email === adminEmailSetting.value);
              if (adminUser?.phone) {
                await sendAdminNewBookingAlertSMS(
                  adminUser.phone,
                  booking.id,
                  `${passenger.firstName || ''} ${passenger.lastName || ''}`.trim(),
                  booking.pickupAddress,
                  new Date(booking.scheduledDateTime),
                  booking.totalAmount || '0.00'
                );
              }
            }
            
            // 5. Send dispatcher email notifications
            const allUsers = await storage.getAllUsers();
            const dispatchers = allUsers.filter(u => u.role === 'dispatcher');
            for (const dispatcher of dispatchers) {
              await sendEmail({
                to: dispatcher.email,
                subject: `New Booking Alert - USA Luxury Limo #${booking.id.slice(0, 8)}`,
                html: getBookingConfirmationEmailHTML({
                  passengerName: `${passenger.firstName || ''} ${passenger.lastName || ''}`.trim() || passenger.username || 'Valued Customer',
                  bookingId: booking.id.slice(0, 8),
                  pickupAddress: booking.pickupAddress,
                  destinationAddress: booking.destinationAddress || 'N/A',
                  scheduledDateTime,
                  vehicleType: vehicleType.name || 'Luxury Vehicle',
                  totalAmount: booking.totalAmount || '0.00',
                  status: booking.status || 'pending'
                })
              });
            }
          }
        } catch (error) {
          console.error('[NOTIFICATIONS] Failed to send booking notifications:', error);
        }
      })();
      
      res.status(201).json(booking);
    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({ message: 'Failed to create booking' });
    }
  });

  // Get user bookings
  app.get('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let bookings: any[];
      if (user.role === 'driver') {
        const driver = await storage.getDriverByUserId(userId);
        if (driver) {
          bookings = await storage.getBookingsByDriver(driver.id);
          // Strip totalAmount from driver bookings - drivers should only see driverPayment
          bookings = bookings.map(booking => {
            const { totalAmount, ...driverBooking } = booking;
            return driverBooking;
          });
        } else {
          bookings = [];
        }
        res.json(bookings);
      } else {
        bookings = await storage.getBookingsByUser(userId);
        
        // Enrich bookings with driver information for passengers
        if (user.role === 'passenger') {
          const enrichedBookings = await Promise.all(
            bookings.map(async (booking) => {
              if (booking.driverId) {
                const driver = await storage.getDriver(booking.driverId);
                if (driver) {
                  const driverUser = await storage.getUser(driver.userId);
                  if (driverUser) {
                    return {
                      ...booking,
                      driverFirstName: driverUser.firstName || null,
                      driverLastName: driverUser.lastName || null,
                      driverPhone: driverUser.phone || null,
                      driverCredentials: driver.driverCredentials || null,
                    };
                  }
                }
              }
              return booking;
            })
          );
          res.json(enrichedBookings);
        } else {
          res.json(bookings);
        }
      }
    } catch (error) {
      console.error('Get bookings error:', error);
      res.status(500).json({ message: 'Failed to fetch bookings' });
    }
  });

  // Get single booking by ID for checkout page
  app.get('/api/bookings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const bookingId = req.params.id;
      const userId = req.user.id;
      
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check if user owns this booking or is admin/driver
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Allow access if:
      // 1. User is the passenger who made the booking
      // 2. User is an admin
      // 3. User is the assigned driver
      if (booking.passengerId !== userId && user.role !== 'admin') {
        if (user.role === 'driver') {
          const driver = await storage.getDriverByUserId(userId);
          if (!driver || booking.driverId !== driver.id) {
            return res.status(403).json({ message: "Access denied" });
          }
        } else {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      // Enrich booking with passenger details for drivers
      let enrichedBooking = { ...booking };
      if (booking.passengerId) {
        const passenger = await storage.getUser(booking.passengerId);
        if (passenger) {
          enrichedBooking = {
            ...enrichedBooking,
            passengerName: `${passenger.firstName || ''} ${passenger.lastName || ''}`.trim() || passenger.username || 'N/A',
            passengerPhone: passenger.phone || null,
            passengerEmail: passenger.email || null,
          } as any;
        }
      }

      // Enrich booking with driver details for dispatchers/admins
      if (booking.driverId) {
        const driver = await storage.getDriver(booking.driverId);
        if (driver) {
          const driverUser = await storage.getUser(driver.userId);
          if (driverUser) {
            enrichedBooking = {
              ...enrichedBooking,
              driverFirstName: driverUser.firstName || null,
              driverLastName: driverUser.lastName || null,
              driverPhone: driverUser.phone || null,
              driverProfileImageUrl: driverUser.profileImageUrl || null,
            } as any;
          }
          
          // Get driver's vehicle plate
          const vehicleData = await db
            .select()
            .from(vehicles)
            .where(eq(vehicles.driverId, driver.id))
            .limit(1);
          
          if (vehicleData[0]) {
            enrichedBooking = {
              ...enrichedBooking,
              driverVehiclePlate: vehicleData[0].licensePlate || null,
            } as any;
          }
        }
      }

      res.json(enrichedBooking);
    } catch (error) {
      console.error('Get booking error:', error);
      res.status(500).json({ message: 'Failed to fetch booking' });
    }
  });

  // Update booking status (drivers and admins)
  app.patch('/api/bookings/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;
      
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'driver' && user.role !== 'admin')) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      await storage.updateBookingStatus(id, status);
      res.json({ success: true });
    } catch (error) {
      console.error('Update booking status error:', error);
      res.status(500).json({ message: 'Failed to update booking status' });
    }
  });

  // Driver accepts assigned booking
  app.post('/api/bookings/:id/accept', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Get user and verify they're a driver
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'driver') {
        return res.status(403).json({ message: 'Only drivers can accept bookings' });
      }

      // Get driver profile
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: 'Driver profile not found' });
      }

      // Get the booking
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Verify this booking is assigned to this driver
      if (booking.driverId !== driver.id) {
        return res.status(403).json({ message: 'This booking is not assigned to you' });
      }

      // Verify booking is in pending_driver_acceptance status
      if (booking.status !== 'pending_driver_acceptance') {
        return res.status(400).json({ message: 'This booking is not awaiting your acceptance' });
      }

      // Update booking to confirmed status and set acceptedAt timestamp
      const updatedBooking = await storage.updateBooking(id, {
        status: 'confirmed',
        acceptedAt: new Date(),
      });

      // Send notification to passenger and system admin report (fire-and-forget)
      (async () => {
        try {
          const passenger = await storage.getUser(booking.passengerId);
          if (passenger) {
            const message = `Good news! Driver ${user.firstName} ${user.lastName} has accepted your booking for ${new Date(booking.scheduledDateTime).toLocaleString()}.`;
            
            // Send SMS if phone number available
            if (booking.passengerPhone || passenger.phone) {
              await sendSMS(booking.passengerPhone || passenger.phone!, message);
            }

            // Send email
            if (passenger.email) {
              await sendEmail({
                to: passenger.email,
                subject: 'Driver Accepted Your Booking',
                html: `<p>${message}</p><p>Pickup: ${booking.pickupAddress}</p><p>Time: ${new Date(booking.scheduledDateTime).toLocaleString()}</p>`,
              });
            }
            
            // Send system admin activity report
            const vehicleType = await storage.getVehicleType(booking.vehicleTypeId);
            if (vehicleType) {
              await sendDriverActivityReport({
                type: 'acceptance',
                booking: updatedBooking,
                driver: user,
                passenger,
                vehicleTypeName: vehicleType.name || 'Unknown Vehicle',
                timestamp: new Date(),
              });
            }
          }
        } catch (error) {
          console.error('Error sending driver acceptance notification:', error);
        }
      })();

      res.json({ success: true, message: 'Booking accepted successfully' });
    } catch (error) {
      console.error('Accept booking error:', error);
      res.status(500).json({ message: 'Failed to accept booking' });
    }
  });

  // Driver declines assigned booking
  app.post('/api/bookings/:id/decline', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body; // Optional decline reason
      const userId = req.user.id;

      // Get user and verify they're a driver
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'driver') {
        return res.status(403).json({ message: 'Only drivers can decline bookings' });
      }

      // Get driver profile
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: 'Driver profile not found' });
      }

      // Get the booking
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Verify this booking is assigned to this driver
      if (booking.driverId !== driver.id) {
        return res.status(403).json({ message: 'This booking is not assigned to you' });
      }

      // Verify booking is in pending_driver_acceptance status
      if (booking.status !== 'pending_driver_acceptance') {
        return res.status(400).json({ message: 'This booking is not awaiting your acceptance' });
      }

      // Update booking: remove driver assignment and revert to pending status
      const updatedBooking = await storage.updateBooking(id, {
        status: 'pending',
        driverId: null,
        driverPayment: null,
        assignedAt: null,
      });

      // Send notification to admins/dispatchers (fire-and-forget)
      (async () => {
        try {
          const allUsers = await storage.getAllUsers();
          const admins = allUsers.filter(u => u.role === 'admin' || u.role === 'dispatcher');
          const notificationMessage = `Driver ${user.firstName} ${user.lastName} has declined booking #${id.substring(0, 8)} for ${new Date(booking.scheduledDateTime).toLocaleString()}.${reason ? ` Reason: ${reason}` : ''}`;
          
          for (const admin of admins) {
            if (admin.email) {
              await sendEmail({
                to: admin.email,
                subject: 'Driver Declined Booking Assignment',
                html: `<p>${notificationMessage}</p><p>Pickup: ${booking.pickupAddress}</p><p>Passenger: ${booking.passengerName || 'N/A'}</p><p>Please reassign this booking to another driver.</p>`,
              });
            }
          }
          
          // Send system admin cancellation report
          const passenger = await storage.getUser(booking.passengerId);
          const vehicleType = await storage.getVehicleType(booking.vehicleTypeId);
          if (passenger && vehicleType) {
            await sendCancelledBookingReport(
              updatedBooking,
              passenger,
              vehicleType.name || 'Unknown Vehicle',
              'driver',
              reason || 'Driver declined the booking'
            );
          }
        } catch (error) {
          console.error('Error sending driver declination notification:', error);
        }
      })();

      res.json({ success: true, message: 'Booking declined successfully' });
    } catch (error) {
      console.error('Decline booking error:', error);
      res.status(500).json({ message: 'Failed to decline booking' });
    }
  });

  // Driver marks themselves as "On the Way"
  app.post('/api/bookings/:id/on-the-way', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const now = new Date();

      // Get user and verify they're a driver
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'driver') {
        return res.status(403).json({ message: 'Only drivers can update trip status' });
      }

      // Get driver profile
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: 'Driver profile not found' });
      }

      // Get the booking
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Verify this booking is assigned to this driver
      if (booking.driverId !== driver.id) {
        return res.status(403).json({ message: 'This booking is not assigned to you' });
      }

      // Verify booking is in confirmed status or later (not completed/cancelled)
      if (!['confirmed', 'on_the_way', 'arrived', 'on_board'].includes(booking.status)) {
        return res.status(400).json({ message: 'Booking must be confirmed before starting trip' });
      }

      // If already on the way or further, no need to update
      if (['on_the_way', 'arrived', 'on_board'].includes(booking.status)) {
        return res.json({ success: true, message: 'Already on the way or further along', alreadyProgressed: true });
      }

      // Timing validation for on-the-way
      const scheduledTime = new Date(booking.scheduledDateTime);
      const minutesUntilPickup = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);
      
      // Can only mark "on the way" within 2 hours of pickup or after
      if (minutesUntilPickup > 120) {
        return res.status(400).json({ 
          message: 'You can only start your trip within 2 hours of the scheduled pickup time',
          minutesUntil: Math.round(minutesUntilPickup)
        });
      }

      // Set reminderSentAt if not already set (for cases where job hasn't run or admin-assigned late)
      const updates: any = {
        status: 'on_the_way',
        onTheWayAt: now,
      };
      
      if (!booking.reminderSentAt) {
        updates.reminderSentAt = now;
        console.log(`[ON-THE-WAY] Setting reminderSentAt for booking ${id} (was not set by scheduled job)`);
      }

      // Update booking to on_the_way status
      const updatedBooking = await storage.updateBooking(id, updates);

      // Send notification to passenger and system admin report (fire-and-forget)
      (async () => {
        try {
          const passenger = await storage.getUser(booking.passengerId);
          const vehicleType = await storage.getVehicleType(booking.vehicleTypeId);
          
          if (passenger && vehicleType) {
            const scheduledDateTime = scheduledTime.toLocaleString('en-US', {
              dateStyle: 'full',
              timeStyle: 'short'
            });
            
            // Send email notification to passenger
            if (passenger.email) {
              await sendEmail({
                to: passenger.email,
                subject: `Driver On The Way - USA Luxury Limo #${booking.id.slice(0, 8)}`,
                html: getDriverOnTheWayEmailHTML({
                  passengerName: `${passenger.firstName || ''} ${passenger.lastName || ''}`.trim() || passenger.username || 'Valued Customer',
                  bookingId: booking.id.slice(0, 8),
                  driverName: `${user.firstName} ${user.lastName}`,
                  driverPhone: user.phone || 'N/A',
                  vehicleType: vehicleType.name || 'Luxury Vehicle',
                  pickupAddress: booking.pickupAddress,
                  scheduledDateTime,
                  estimatedArrival: undefined
                }),
              });
            }
            
            // Send SMS notification to passenger
            if (booking.passengerPhone || passenger.phone) {
              await sendDriverOnTheWaySMS(
                booking.passengerPhone || passenger.phone!,
                `${user.firstName} ${user.lastName}`,
                vehicleType.name || 'Luxury Vehicle'
              );
            }
            
            // Send system admin activity report
            await sendDriverActivityReport({
              type: 'on_the_way',
              booking: updatedBooking,
              driver: user,
              passenger,
              vehicleTypeName: vehicleType.name || 'Unknown Vehicle',
              timestamp: now,
            });
          }
        } catch (error) {
          console.error('Error sending on-the-way notification:', error);
        }
      })();

      res.json({ success: true, message: 'Status updated to on the way' });
    } catch (error) {
      console.error('On the way error:', error);
      res.status(500).json({ message: 'Failed to update status' });
    }
  });

  // Driver marks themselves as "Arrived"
  app.post('/api/bookings/:id/arrived', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const now = new Date();

      // Get user and verify they're a driver
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'driver') {
        return res.status(403).json({ message: 'Only drivers can update trip status' });
      }

      // Get driver profile
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: 'Driver profile not found' });
      }

      // Get the booking
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Verify this booking is assigned to this driver
      if (booking.driverId !== driver.id) {
        return res.status(403).json({ message: 'This booking is not assigned to you' });
      }

      // Verify booking has progressed to on_the_way or is already arrived/on_board
      if (!['on_the_way', 'arrived', 'on_board'].includes(booking.status)) {
        return res.status(400).json({ message: 'You must be on the way before marking as arrived' });
      }

      // If already arrived or further, no need to update
      if (['arrived', 'on_board'].includes(booking.status)) {
        return res.json({ success: true, message: 'Already arrived or further along', alreadyProgressed: true });
      }

      // Verify arrival timing: 15 minutes before scheduled time onward
      const scheduledTime = new Date(booking.scheduledDateTime);
      const minutesDiff = (now.getTime() - scheduledTime.getTime()) / (1000 * 60);
      
      if (minutesDiff < -15) {
        return res.status(400).json({ 
          message: 'You can only mark as arrived within 15 minutes before the scheduled pickup time',
          minutesUntil: Math.round(Math.abs(minutesDiff))
        });
      }

      // Update booking to arrived status
      const updatedBooking = await storage.updateBooking(id, {
        status: 'arrived',
        arrivedAt: now,
      });

      // Send notification to passenger and system admin report (fire-and-forget)
      (async () => {
        try {
          const passenger = await storage.getUser(booking.passengerId);
          const vehicleType = await storage.getVehicleType(booking.vehicleTypeId);
          
          if (passenger && vehicleType) {
            // Send email notification to passenger
            if (passenger.email) {
              await sendEmail({
                to: passenger.email,
                subject: `Driver Has Arrived - USA Luxury Limo #${booking.id.slice(0, 8)}`,
                html: getDriverArrivedEmailHTML({
                  passengerName: `${passenger.firstName || ''} ${passenger.lastName || ''}`.trim() || passenger.username || 'Valued Customer',
                  bookingId: booking.id.slice(0, 8),
                  driverName: `${user.firstName} ${user.lastName}`,
                  driverPhone: user.phone || 'N/A',
                  vehicleType: vehicleType.name || 'Luxury Vehicle',
                  pickupAddress: booking.pickupAddress
                }),
              });
            }
            
            // Send SMS notification to passenger
            if (booking.passengerPhone || passenger.phone) {
              await sendDriverArrivedSMS(
                booking.passengerPhone || passenger.phone!,
                `${user.firstName} ${user.lastName}`,
                vehicleType.name || 'Luxury Vehicle',
                booking.pickupAddress
              );
            }
            
            // Send system admin activity report
            await sendDriverActivityReport({
              type: 'arrived',
              booking: updatedBooking,
              driver: user,
              passenger,
              vehicleTypeName: vehicleType.name || 'Unknown Vehicle',
              timestamp: now,
            });
          }
        } catch (error) {
          console.error('Error sending arrived notification:', error);
        }
      })();

      res.json({ success: true, message: 'Status updated to arrived' });
    } catch (error) {
      console.error('Arrived error:', error);
      res.status(500).json({ message: 'Failed to update status' });
    }
  });

  // Driver marks passenger as "On Board"
  app.post('/api/bookings/:id/on-board', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const now = new Date();

      // Get user and verify they're a driver
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'driver') {
        return res.status(403).json({ message: 'Only drivers can update trip status' });
      }

      // Get driver profile
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: 'Driver profile not found' });
      }

      // Get the booking
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Verify this booking is assigned to this driver
      if (booking.driverId !== driver.id) {
        return res.status(403).json({ message: 'This booking is not assigned to you' });
      }

      // Verify booking is arrived or already on_board
      if (!['arrived', 'on_board'].includes(booking.status)) {
        return res.status(400).json({ message: 'You must mark as arrived before passenger boards' });
      }

      // If already on_board, no need to update
      if (booking.status === 'on_board') {
        return res.json({ success: true, message: 'Passenger already on board', alreadyProgressed: true });
      }

      // Update booking to on_board status
      const updatedBooking = await storage.updateBooking(id, {
        status: 'on_board',
        onBoardAt: now,
      });

      // Send notification to passenger and system admin report (fire-and-forget)
      (async () => {
        try {
          const passenger = await storage.getUser(booking.passengerId);
          if (passenger) {
            const message = `Trip started! You're on your way to ${booking.destinationAddress || 'your destination'}.`;
            
            if (booking.passengerPhone || passenger.phone) {
              await sendSMS(booking.passengerPhone || passenger.phone!, message);
            }

            if (passenger.email) {
              await sendEmail({
                to: passenger.email,
                subject: 'Trip Started',
                html: `<h2>Trip Started</h2><p>${message}</p><p>Driver: ${user.firstName} ${user.lastName}</p>`,
              });
            }
            
            // Send system admin activity report
            const vehicleType = await storage.getVehicleType(booking.vehicleTypeId);
            if (vehicleType) {
              await sendDriverActivityReport({
                type: 'on_board',
                booking: updatedBooking,
                driver: user,
                passenger,
                vehicleTypeName: vehicleType.name || 'Unknown Vehicle',
                timestamp: now,
              });
            }
          }
        } catch (error) {
          console.error('Error sending on-board notification:', error);
        }
      })();

      res.json({ success: true, message: 'Passenger is on board' });
    } catch (error) {
      console.error('On board error:', error);
      res.status(500).json({ message: 'Failed to update status' });
    }
  });

  // Update booking (passengers can edit their own pending bookings)
  app.patch('/api/bookings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Get the booking first
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Check if user owns this booking or is admin
      const user = await storage.getUser(userId);
      if (booking.passengerId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to edit this booking' });
      }

      // Only allow editing pending bookings
      if (booking.status !== 'pending' && user?.role !== 'admin') {
        return res.status(400).json({ message: 'Only pending bookings can be edited' });
      }

      // Validate updates
      const updateSchema = insertBookingSchema.partial();
      const validatedUpdates = updateSchema.parse(req.body);

      // Don't allow changing status or payment fields
      if (user?.role !== 'admin') {
        delete (validatedUpdates as any).status;
        delete (validatedUpdates as any).paymentStatus;
        delete (validatedUpdates as any).paymentIntentId;
      }

      const updatedBooking = await storage.updateBooking(id, validatedUpdates);
      res.json(updatedBooking);
    } catch (error) {
      console.error('Update booking error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid booking data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update booking' });
    }
  });

  // Delete booking (passengers can delete their own pending bookings, admins can delete any)
  app.delete('/api/bookings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      console.log(`🗑️ DELETE BOOKING REQUEST - Booking ID: ${id}, User ID: ${userId}`);
      
      // Get the booking first
      const booking = await storage.getBooking(id);
      if (!booking) {
        console.log(`❌ Booking not found: ${id}`);
        return res.status(404).json({ message: 'Booking not found' });
      }
      console.log(`✅ Booking found: ${id}, Status: ${booking.status}, Passenger: ${booking.passengerId}`);

      const user = await storage.getUser(userId);
      console.log(`✅ User found: ${user?.username || user?.email}, Role: ${user?.role}`);
      
      // Check permissions: must be admin or booking owner
      if (booking.passengerId !== userId && user?.role !== 'admin') {
        console.log(`❌ Permission denied - User is not admin and not booking owner`);
        return res.status(403).json({ message: 'Not authorized to delete this booking' });
      }

      // Only allow deleting pending bookings (unless admin)
      if (booking.status !== 'pending' && user?.role !== 'admin') {
        console.log(`❌ Cannot delete - Booking status is ${booking.status} and user is not admin`);
        return res.status(400).json({ message: 'Only pending bookings can be deleted' });
      }

      console.log(`🗑️ Proceeding to delete booking ${id}...`);
      await storage.deleteBooking(id);
      console.log(`✅ Booking ${id} deleted successfully`);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Delete booking error:', error);
      res.status(500).json({ message: 'Failed to delete booking' });
    }
  });

  // Cancel booking (passengers can cancel confirmed bookings, admins can cancel any)
  app.patch('/api/bookings/:id/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Get the booking first
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      const user = await storage.getUser(userId);
      
      // Check permissions: must be admin or booking owner
      if (booking.passengerId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to cancel this booking' });
      }

      // Don't allow cancelling completed or already cancelled bookings
      if (booking.status === 'completed' || booking.status === 'cancelled') {
        return res.status(400).json({ 
          message: `Cannot cancel ${booking.status} booking` 
        });
      }

      // Update booking status to cancelled
      const updatedBooking = await storage.updateBooking(id, { status: 'cancelled', cancelledAt: new Date(), cancelReason: req.body.reason || 'Cancelled by user' });
      
      // Send cancellation notifications (fire-and-forget)
      (async () => {
        try {
          const passenger = await storage.getUser(booking.passengerId);
          const vehicleType = await storage.getVehicleType(booking.vehicleTypeId);
          if (passenger && vehicleType) {
            // 1. Send system admin report
            await sendCancelledBookingReport(
              updatedBooking,
              passenger,
              vehicleType.name || 'Unknown Vehicle',
              'passenger',
              req.body.reason || 'No reason provided'
            );
            
            // 2. Send passenger cancellation email
            const scheduledDateTime = new Date(updatedBooking.scheduledDateTime).toLocaleString('en-US', {
              dateStyle: 'full',
              timeStyle: 'short'
            });
            
            await sendEmail({
              to: passenger.email,
              subject: `Booking Cancelled - USA Luxury Limo #${updatedBooking.id.slice(0, 8)}`,
              html: getBookingCancelledEmailHTML({
                passengerName: `${passenger.firstName || ''} ${passenger.lastName || ''}`.trim() || passenger.username || 'Valued Customer',
                bookingId: updatedBooking.id.slice(0, 8),
                pickupAddress: updatedBooking.pickupAddress,
                destinationAddress: updatedBooking.destinationAddress || undefined,
                scheduledDateTime,
                cancelReason: updatedBooking.cancelReason || undefined
              })
            });
            
            // 3. Send passenger cancellation SMS
            if (passenger.phone) {
              await sendBookingCancelledSMS(passenger.phone, updatedBooking.id);
            }
          }
        } catch (error) {
          console.error('[NOTIFICATIONS] Failed to send cancellation notifications:', error);
        }
      })();
      
      res.json(updatedBooking);
    } catch (error) {
      console.error('Cancel booking error:', error);
      res.status(500).json({ message: 'Failed to cancel booking' });
    }
  });

  // Auto-cancel past-due bookings (removes from driver's job list)
  app.post('/api/bookings/auto-cancel-expired', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // Only drivers can call this endpoint (runs when driver dashboard loads)
      if (!user || user.role !== 'driver') {
        return res.status(403).json({ message: 'Driver access required' });
      }

      const now = new Date();
      const allBookings = await storage.getAllBookingsWithDetails();
      
      // Find bookings that are past their scheduled time and still in active statuses
      const expiredBookings = allBookings.filter((booking: any) => {
        const scheduledTime = new Date(booking.scheduledDateTime);
        const isPast = scheduledTime < now;
        const isActive = ['pending', 'pending_driver_acceptance', 'confirmed', 'on_the_way', 'arrived', 'on_board', 'in_progress'].includes(booking.status);
        
        return isPast && isActive;
      });

      // Auto-cancel each expired booking
      const cancelledBookingIds = [];
      for (const booking of expiredBookings) {
        try {
          await storage.updateBooking(booking.id, {
            status: 'cancelled',
            driverId: null,
            driverPayment: null,
            cancelledAt: now,
            cancelReason: 'Automatically cancelled - scheduled time passed'
          });
          cancelledBookingIds.push(booking.id);
          
          console.log(`[AUTO-CANCEL] Booking ${booking.id} auto-cancelled (scheduled: ${booking.scheduledDateTime}, now: ${now.toISOString()})`);
        } catch (error) {
          console.error(`[AUTO-CANCEL] Failed to cancel booking ${booking.id}:`, error);
        }
      }

      res.json({ 
        success: true, 
        cancelledCount: cancelledBookingIds.length,
        cancelledBookings: cancelledBookingIds
      });
    } catch (error) {
      console.error('Auto-cancel expired bookings error:', error);
      res.status(500).json({ message: 'Failed to auto-cancel expired bookings' });
    }
  });

  // Admin: Create booking for a passenger
  app.post('/api/admin/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Validate and parse the booking data, allowing passengerId to be specified
      const bookingData = insertBookingSchema.parse(req.body);

      // Set journey tracking fields for admin-created bookings
      const bookingWithTracking = {
        ...bookingData,
        bookedBy: 'admin' as const,
        bookedAt: new Date(),
      };

      const booking = await storage.createBooking(bookingWithTracking);
      
      // Send booking confirmation email to passenger
      if (booking.passengerId) {
        try {
          const passenger = await storage.getUser(booking.passengerId);
          const vehicleType = await storage.getVehicleType(booking.vehicleTypeId);
          
          if (passenger?.email) {
            const scheduledDateTime = new Date(booking.scheduledDateTime).toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'America/Chicago'
            });

            await sendEmail({
              to: passenger.email,
              subject: `Booking Confirmation - ${booking.id}`,
              html: getBookingConfirmationEmailHTML({
                passengerName: `${passenger.firstName} ${passenger.lastName}`,
                bookingId: booking.id,
                pickupAddress: booking.pickupAddress,
                destinationAddress: booking.destinationAddress || 'N/A',
                scheduledDateTime,
                vehicleType: vehicleType?.name || 'Standard',
                totalAmount: (booking.totalAmount || 0).toString(),
                status: booking.status || 'pending',
              }),
            });

            // Send SMS notification if phone number is available
            if (passenger.phone) {
              try {
                await sendBookingConfirmationSMS(
                  passenger.phone,
                  booking.id,
                  booking.pickupAddress,
                  new Date(booking.scheduledDateTime)
                );
              } catch (smsError) {
                console.error('Failed to send booking confirmation SMS:', smsError);
                // Continue even if SMS fails
              }
            }
          }
        } catch (emailError) {
          console.error('Failed to send booking confirmation email:', emailError);
          // Don't fail the booking creation if email fails
        }
      }
      
      res.status(201).json(booking);
    } catch (error) {
      console.error('Admin create booking error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid booking data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create booking' });
    }
  });

  // Admin: Update booking details
  app.patch('/api/admin/bookings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Use partial schema for updates - only validate provided fields
      const updateSchema = insertBookingSchema.partial();
      const validatedUpdates = updateSchema.parse(req.body);

      const booking = await storage.updateBooking(id, validatedUpdates);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      res.json(booking);
    } catch (error) {
      console.error('Admin update booking error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid booking data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update booking' });
    }
  });

  // Add additional charge to booking (Admin/Dispatcher only)
  app.post('/api/bookings/:id/additional-charge', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { description, amount } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'dispatcher')) {
        return res.status(403).json({ message: 'Admin or dispatcher access required' });
      }

      if (!description || !amount || amount <= 0) {
        return res.status(400).json({ message: 'Valid description and amount are required' });
      }

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ message: 'Invalid amount value' });
      }

      const booking = await storage.addAdditionalCharge(id, {
        description,
        amount: parsedAmount,
        addedBy: userId
      });

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      res.json(booking);
    } catch (error) {
      console.error('Add additional charge error:', error);
      res.status(500).json({ message: 'Failed to add additional charge' });
    }
  });

  // Authorize & Capture payment (Admin/Dispatcher only)
  app.post('/api/bookings/:id/authorize-payment', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'dispatcher')) {
        return res.status(403).json({ message: 'Admin or dispatcher access required' });
      }

      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Get passenger details
      const passenger = await storage.getUser(booking.passengerId);
      if (!passenger?.stripeCustomerId) {
        return res.status(400).json({ message: 'Passenger does not have a payment method on file' });
      }

      // Get passenger's default payment method
      const customer = await stripe.customers.retrieve(passenger.stripeCustomerId);
      
      if (!customer || customer.deleted) {
        return res.status(400).json({ message: 'Customer not found in payment system' });
      }

      const defaultPaymentMethod = (customer as any).invoice_settings?.default_payment_method;
      
      if (!defaultPaymentMethod) {
        return res.status(400).json({ message: 'No default payment method found for passenger' });
      }

      // Create payment intent with automatic payment method
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(booking.totalAmount || '0') * 100), // Convert to cents
        currency: 'usd',
        customer: passenger.stripeCustomerId,
        payment_method: defaultPaymentMethod,
        off_session: true,
        confirm: true,
        metadata: {
          bookingId: booking.id,
          passengerId: booking.passengerId,
          authorizedBy: userId
        },
      });

      // Update booking payment status
      await storage.updateBookingPayment(id, paymentIntent.id, 'paid');

      res.json({ 
        success: true, 
        paymentIntent: paymentIntent.id,
        amount: booking.totalAmount 
      });
    } catch (error: any) {
      console.error('Authorize payment error:', error);
      
      // Handle Stripe-specific errors
      if (error.type === 'StripeCardError') {
        return res.status(400).json({ 
          message: 'Card payment failed: ' + error.message 
        });
      }
      
      res.status(500).json({ 
        message: error.message || 'Failed to authorize payment' 
      });
    }
  });

  // Saved addresses
  app.get('/api/saved-addresses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const addresses = await storage.getSavedAddressesByUser(userId);
      res.json(addresses);
    } catch (error) {
      console.error('Get saved addresses error:', error);
      res.status(500).json({ message: 'Failed to fetch saved addresses' });
    }
  });

  // Admin: Get saved addresses for any user
  app.get('/api/saved-addresses/user/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.id;
      const admin = await storage.getUser(adminId);
      
      if (!admin || admin.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { userId } = req.params;
      const addresses = await storage.getSavedAddressesByUser(userId);
      res.json(addresses);
    } catch (error) {
      console.error('Admin get user saved addresses error:', error);
      res.status(500).json({ message: 'Failed to fetch saved addresses' });
    }
  });

  app.post('/api/saved-addresses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const addressData = insertSavedAddressSchema.parse({
        ...req.body,
        userId,
      });

      const address = await storage.createSavedAddress(addressData);
      res.status(201).json(address);
    } catch (error) {
      console.error('Create saved address error:', error);
      res.status(500).json({ message: 'Failed to create saved address' });
    }
  });

  app.delete('/api/saved-addresses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      await storage.deleteSavedAddress(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete saved address error:', error);
      res.status(500).json({ message: 'Failed to delete saved address' });
    }
  });

  // Contact form
  app.post('/api/contact', async (req, res) => {
    try {
      const contactData = insertContactSchema.parse(req.body);
      const contact = await storage.createContactSubmission(contactData);
      
      // Send email notification to admin
      const adminEmailSetting = await storage.getSystemSetting('ADMIN_EMAIL');
      if (adminEmailSetting?.value) {
        try {
          const submittedAt = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Chicago'
          });

          await sendEmail({
            to: adminEmailSetting.value,
            subject: `New Contact Form Submission from ${contactData.firstName} ${contactData.lastName}`,
            html: getContactFormEmailHTML({
              firstName: contactData.firstName,
              lastName: contactData.lastName,
              email: contactData.email,
              phone: contactData.phone,
              serviceType: contactData.serviceType,
              message: contactData.message,
              submittedAt,
            }),
          });
        } catch (emailError) {
          console.error('Failed to send contact form email notification:', emailError);
          // Don't fail the request if email fails - contact is already saved
        }
      }
      
      res.status(201).json(contact);
    } catch (error) {
      console.error('Contact submission error:', error);
      res.status(500).json({ message: 'Failed to submit contact form' });
    }
  });

  // System Settings (Admin only)
  app.get('/api/system-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const settings = await storage.getAllSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error('Get system settings error:', error);
      res.status(500).json({ message: 'Failed to fetch system settings' });
    }
  });

  app.get('/api/system-settings/:key', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { key } = req.params;
      const setting = await storage.getSystemSetting(key);
      
      if (!setting) {
        return res.status(404).json({ message: 'Setting not found' });
      }
      
      res.json(setting);
    } catch (error) {
      console.error('Get system setting error:', error);
      res.status(500).json({ message: 'Failed to fetch system setting' });
    }
  });

  app.put('/api/system-settings/:key', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { key } = req.params;
      const { value } = req.body;

      if (typeof value !== 'string') {
        return res.status(400).json({ message: 'Value must be a string' });
      }

      await storage.updateSystemSetting(key, value, userId);
      const updatedSetting = await storage.getSystemSetting(key);
      
      res.json(updatedSetting);
    } catch (error) {
      console.error('Update system setting error:', error);
      res.status(500).json({ message: 'Failed to update system setting' });
    }
  });

  // Admin routes
  app.get('/api/admin/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const stats = await storage.getAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error('Admin dashboard error:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard data' });
    }
  });

  // Dispatcher routes
  app.get('/api/dispatcher/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'dispatcher')) {
        return res.status(403).json({ message: 'Dispatcher or admin access required' });
      }

      const stats = await storage.getDispatcherDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error('Dispatcher stats error:', error);
      res.status(500).json({ message: 'Failed to fetch dispatcher stats' });
    }
  });

  app.get('/api/admin/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const contacts = await storage.getContactSubmissions();
      res.json(contacts);
    } catch (error) {
      console.error('Get contacts error:', error);
      res.status(500).json({ message: 'Failed to fetch contacts' });
    }
  });

  // Passenger invoice endpoints
  app.get('/api/passenger/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Get all bookings for this passenger
      const userBookings = await storage.getBookingsByUser(userId);
      
      // Get all invoices
      const allInvoices = await storage.getAllInvoices();
      
      // Filter invoices that belong to this passenger's bookings
      const passengerBookingIds = new Set(userBookings.map(b => b.id));
      const passengerInvoices = allInvoices.filter(inv => passengerBookingIds.has(inv.bookingId));
      
      // Enrich with booking data
      const enrichedInvoices = await Promise.all(
        passengerInvoices.map(async (invoice) => {
          const booking = await storage.getBooking(invoice.bookingId);
          return {
            ...invoice,
            booking
          };
        })
      );
      
      res.json(enrichedInvoices);
    } catch (error) {
      console.error('Get passenger invoices error:', error);
      res.status(500).json({ message: 'Failed to fetch invoices' });
    }
  });

  app.post('/api/passenger/invoices/:id/email', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      const booking = await storage.getBooking(invoice.bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Associated booking not found' });
      }

      // Verify this invoice belongs to the requesting passenger
      if (booking.passengerId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const passenger = await storage.getUser(booking.passengerId);

      // Use passenger's email as default recipient
      const recipientEmail = user.email;

      // Generate payment token for invoice payment link (24 hour expiration)
      let paymentToken = '';
      if (!invoice.paidAt) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        
        await storage.createPaymentToken({
          invoiceId: invoice.id,
          token: token,
          expiresAt: expiresAt,
        });
        
        paymentToken = token;
      }

      // Get dynamic logo from object storage and convert to base64 for email embedding
      let logoDataUri = '';
      try {
        const logoSetting = await storage.getCmsSetting('BRAND_LOGO_URL');
        if (logoSetting?.value) {
          const logoPath = logoSetting.value;
          const fileKey = logoPath.includes('/file/') 
            ? logoPath.split('/file/')[1] 
            : logoPath.replace('/api/object-storage/', '');
          
          const ObjectStorage = await import('@replit/object-storage');
          const storage_client = new ObjectStorage.Client();
          const logoBuffer = await storage_client.downloadAsBytes(fileKey);
          
          if (logoBuffer) {
            let buffer: Buffer;
            if (Buffer.isBuffer(logoBuffer)) {
              buffer = logoBuffer;
            } else if (Array.isArray(logoBuffer) && logoBuffer.length > 0) {
              buffer = Buffer.from(Object.values(logoBuffer[0]));
            } else if (typeof logoBuffer === 'object' && logoBuffer !== null) {
              // Handle non-array-wrapped object with numeric keys
              buffer = Buffer.from(Object.values(logoBuffer));
            } else {
              throw new Error('Unexpected logo buffer format from object storage');
            }
            const base64Logo = buffer.toString('base64');
            const ext = fileKey.split('.').pop()?.toLowerCase();
            const mimeType = ext === 'png' ? 'image/png' : 
                            ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 
                            ext === 'svg' ? 'image/svg+xml' : 'image/png';
            logoDataUri = `data:${mimeType};base64,${base64Logo}`;
          }
        }
      } catch (error) {
        console.error('Error fetching logo for email:', error);
      }

      // Build detailed pricing rows
      let pricingRows = '';
      
      if (booking.baseFare) {
        pricingRows += `
          <div class="pricing-row">
            <span class="pricing-label">Base Fare</span>
            <span class="pricing-value">$${parseFloat(booking.baseFare).toFixed(2)}</span>
          </div>
        `;
      }
      
      if (booking.surgePricingAmount && parseFloat(booking.surgePricingAmount) > 0) {
        const multiplier = booking.surgePricingMultiplier ? ` (${booking.surgePricingMultiplier}x)` : '';
        pricingRows += `
          <div class="pricing-row">
            <span class="pricing-label">Surge Pricing${multiplier}</span>
            <span class="pricing-value pricing-surge">+$${parseFloat(booking.surgePricingAmount).toFixed(2)}</span>
          </div>
        `;
      }
      
      if (booking.gratuityAmount && parseFloat(booking.gratuityAmount) > 0) {
        pricingRows += `
          <div class="pricing-row">
            <span class="pricing-label">Gratuity (Tip)</span>
            <span class="pricing-value">+$${parseFloat(booking.gratuityAmount).toFixed(2)}</span>
          </div>
        `;
      }
      
      if (booking.airportFeeAmount && parseFloat(booking.airportFeeAmount) > 0) {
        pricingRows += `
          <div class="pricing-row">
            <span class="pricing-label">Airport Fee</span>
            <span class="pricing-value">+$${parseFloat(booking.airportFeeAmount).toFixed(2)}</span>
          </div>
        `;
      }
      
      if (booking.discountAmount && parseFloat(booking.discountAmount) > 0) {
        const percentage = booking.discountPercentage ? ` (${booking.discountPercentage}%)` : '';
        pricingRows += `
          <div class="pricing-row">
            <span class="pricing-label">Discount${percentage}</span>
            <span class="pricing-value pricing-discount">-$${parseFloat(booking.discountAmount).toFixed(2)}</span>
          </div>
        `;
      }

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #0f172a;
              background-color: #f8fafc;
            }
            .email-wrapper { background-color: #f8fafc; padding: 24px; }
            .container { 
              max-width: 650px; 
              margin: 0 auto; 
              background-color: #ffffff; 
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            .header { 
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              padding: 32px 24px;
              border-bottom: 3px solid #4f46e5;
              text-align: center;
            }
            .logo { 
              font-size: 28px; 
              font-weight: 800; 
              color: #1e293b; 
              margin-bottom: 8px;
              letter-spacing: -0.5px;
            }
            .logo-img { 
              max-height: 70px; 
              max-width: 280px; 
              margin: 0 auto 12px; 
              display: block;
            }
            .tagline { 
              font-size: 14px; 
              color: #64748b; 
              font-weight: 500;
            }
            .success-banner { 
              background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
              padding: 20px;
              text-align: center;
              border-bottom: 3px solid #10b981;
            }
            .success-banner h2 { 
              color: #065f46; 
              font-size: 20px;
              margin: 0;
              font-weight: 800;
              letter-spacing: 1px;
            }
            .content { padding: 32px 24px; }
            .greeting { 
              margin-bottom: 24px;
              color: #334155;
            }
            .greeting p { margin-bottom: 8px; }
            .section { 
              margin-bottom: 28px;
              background: #f8fafc;
              border: 2px solid #e2e8f0;
              border-radius: 10px;
              padding: 20px;
            }
            .section-title { 
              font-weight: 700;
              font-size: 16px;
              margin-bottom: 16px;
              color: #334155;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding-bottom: 8px;
              border-bottom: 2px solid #cbd5e1;
            }
            .info-row { 
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #f1f5f9;
            }
            .info-row:last-child { border-bottom: none; }
            .info-label { 
              font-weight: 600;
              color: #64748b;
              flex: 0 0 40%;
              font-size: 14px;
            }
            .info-value { 
              color: #0f172a;
              flex: 1;
              text-align: right;
              font-weight: 500;
              font-size: 14px;
            }
            .pricing-section {
              background: white;
              border: 2px solid #e2e8f0;
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 28px;
            }
            .pricing-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 0;
              border-bottom: 1px solid #f1f5f9;
            }
            .pricing-row:last-child { border-bottom: none; }
            .pricing-label {
              font-size: 15px;
              color: #0f172a;
              font-weight: 500;
            }
            .pricing-value {
              font-size: 15px;
              color: #0f172a;
              font-weight: 600;
            }
            .pricing-surge {
              color: #ea580c;
            }
            .pricing-discount {
              color: #16a34a;
            }
            .total-section {
              background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
              border: 3px solid #3b82f6;
              border-radius: 10px;
              padding: 20px;
              margin-top: 20px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .total-label {
              font-size: 18px;
              color: #0f172a;
              font-weight: 700;
            }
            .total-value {
              font-size: 24px;
              color: #1d4ed8;
              font-weight: 800;
            }
            .payment-link { 
              text-align: center;
              margin: 24px 0;
              padding: 24px;
              background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
              border-radius: 10px;
              border: 2px solid #3b82f6;
            }
            .payment-link p {
              color: #1e40af;
              font-weight: 600;
              margin-bottom: 16px;
              font-size: 16px;
            }
            .payment-button { 
              display: inline-block;
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: #ffffff;
              padding: 14px 36px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 700;
              font-size: 16px;
              box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.4);
              transition: all 0.2s;
            }
            .payment-button:hover {
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            }
            .paid-badge { 
              background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
              color: #065f46;
              padding: 20px;
              text-align: center;
              font-weight: 800;
              font-size: 20px;
              border-radius: 10px;
              margin: 24px 0;
              border: 3px solid #10b981;
              letter-spacing: 2px;
            }
            .footer-note { 
              font-size: 13px;
              color: #64748b;
              text-align: center;
              padding: 24px;
              border-top: 2px solid #e2e8f0;
              margin-top: 28px;
              background: #f8fafc;
              border-radius: 8px;
            }
            .footer-note strong {
              color: #334155;
              font-weight: 600;
            }
            @media only screen and (max-width: 600px) {
              .email-wrapper { padding: 12px; }
              .content { padding: 20px 16px; }
              .section { padding: 16px; }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              <div class="header">
                ${logoDataUri ? `
                  <img src="${logoDataUri}" alt="USA Luxury Limo" class="logo-img" />
                ` : `
                  <div class="logo">USA Luxury Limo</div>
                `}
                <div class="tagline">Ride in Style, Always on Time</div>
              </div>

              <div class="success-banner">
                <h2>✓ INVOICE READY</h2>
              </div>

              <div class="content">
                <div class="greeting">
                  <p><strong>Dear ${passenger?.firstName || 'Customer'},</strong></p>
                  <p>Thank you for booking with USA Luxury Limo Service! Below is your detailed invoice.</p>
                </div>

                <div class="section">
                  <div class="section-title">📋 Invoice Information</div>
                  <div class="info-row">
                    <span class="info-label">Invoice Number</span>
                    <span class="info-value">${invoice.invoiceNumber}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Date & time</span>
                    <span class="info-value">${new Date(booking.scheduledDateTime).toLocaleString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Booking REF#</span>
                    <span class="info-value">#${booking.id.toUpperCase().substring(0, 8)}</span>
                  </div>
                </div>

                <div class="section">
                  <div class="section-title">🚗 Journey Information</div>
                  <div class="info-row">
                    <span class="info-label">Pickup Location:</span>
                    <span class="info-value">${booking.pickupAddress}</span>
                  </div>
                  ${booking.bookingType === 'hourly' && booking.requestedHours ? `
                  <div class="info-row">
                    <span class="info-label">Duration:</span>
                    <span class="info-value">${booking.requestedHours} ${booking.requestedHours === 1 ? 'Hour' : 'Hours'}</span>
                  </div>
                  ` : booking.destinationAddress ? `
                  <div class="info-row">
                    <span class="info-label">Destination:</span>
                    <span class="info-value">${booking.destinationAddress}</span>
                  </div>
                  ` : ''}
                </div>

                <div class="pricing-section">
                  <div class="section-title">💰 Detailed Pricing Breakdown</div>
                  ${pricingRows || `
                    <div class="pricing-row">
                      <span class="pricing-label">Journey Fare</span>
                      <span class="pricing-value">$${parseFloat(invoice.subtotal).toFixed(2)}</span>
                    </div>
                  `}
                  
                  <div class="total-section">
                    <div class="total-row">
                      <span class="total-label">Total Amount</span>
                      <span class="total-value">$${parseFloat(invoice.totalAmount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                ${invoice.paidAt ? `
                <div class="paid-badge">
                  ✓ PAYMENT RECEIVED
                </div>
                ` : `
                <div class="payment-link">
                  <p>Click the button below to complete your payment securely</p>
                  <a href="${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'https://your-domain.com'}/pay/${paymentToken}" class="payment-button">Make Payment Now</a>
                </div>
                `}

                <div class="footer-note">
                  <p>💡 <em>All prices include statutory taxes and transportation expenses</em></p>
                  <br>
                  <p>Best regards,<br><strong>USA Luxury Limo Service</strong></p>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const emailSent = await sendEmail({
        to: recipientEmail,
        subject: `Invoice #${invoice.invoiceNumber} - USA Luxury Limo`,
        html: emailHtml,
      });

      if (!emailSent) {
        return res.status(500).json({ 
          message: 'Failed to send email. Please check SMTP settings.' 
        });
      }

      res.json({ message: 'Invoice sent successfully to your email' });
    } catch (error) {
      console.error('Email invoice error:', error);
      res.status(500).json({ message: 'Failed to send invoice email' });
    }
  });

  // Invoice management endpoints
  app.get('/api/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const invoices = await storage.getAllInvoices();
      res.json(invoices);
    } catch (error) {
      console.error('Get invoices error:', error);
      res.status(500).json({ message: 'Failed to fetch invoices' });
    }
  });

  app.get('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      res.json(invoice);
    } catch (error) {
      console.error('Get invoice error:', error);
      res.status(500).json({ message: 'Failed to fetch invoice' });
    }
  });

  app.put('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { subtotal, taxAmount, totalAmount, paidAt } = req.body;
      
      const updated = await storage.updateInvoice(req.params.id, {
        subtotal,
        taxAmount,
        totalAmount,
        paidAt: paidAt ? new Date(paidAt) : undefined,
      });

      if (!updated) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      res.json(updated);
    } catch (error) {
      console.error('Update invoice error:', error);
      res.status(500).json({ message: 'Failed to update invoice' });
    }
  });

  app.delete('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      await storage.deleteInvoice(req.params.id);
      res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
      console.error('Delete invoice error:', error);
      res.status(500).json({ message: 'Failed to delete invoice' });
    }
  });

  app.post('/api/invoices/:id/email', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { recipientEmail } = req.body;
      if (!recipientEmail) {
        return res.status(400).json({ message: 'Recipient email is required' });
      }

      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      const booking = await storage.getBooking(invoice.bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Associated booking not found' });
      }

      const passenger = await storage.getUser(booking.passengerId);

      // Generate payment token for invoice payment link (24 hour expiration)
      let paymentToken = '';
      if (!invoice.paidAt) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        
        await storage.createPaymentToken({
          invoiceId: invoice.id,
          token: token,
          expiresAt: expiresAt,
        });
        
        paymentToken = token;
      }

      // Get dynamic logo from object storage and convert to base64 for email embedding
      let logoDataUri = '';
      try {
        const logoSetting = await storage.getCmsSetting('BRAND_LOGO_URL');
        if (logoSetting?.value) {
          // Extract the file key from the URL (e.g., /api/object-storage/file/logo.png -> logo.png)
          const logoPath = logoSetting.value;
          const fileKey = logoPath.includes('/file/') 
            ? logoPath.split('/file/')[1] 
            : logoPath.replace('/api/object-storage/', '');
          
          // Fetch logo from object storage
          const ObjectStorage = await import('@replit/object-storage');
          const storage_client = new ObjectStorage.Client();
          const logoBuffer = await storage_client.downloadAsBytes(fileKey);
          
          if (logoBuffer) {
            // Convert to base64 and create data URI
            let buffer: Buffer;
            if (Buffer.isBuffer(logoBuffer)) {
              buffer = logoBuffer;
            } else if (Array.isArray(logoBuffer) && logoBuffer.length > 0) {
              buffer = Buffer.from(Object.values(logoBuffer[0]));
            } else if (typeof logoBuffer === 'object' && logoBuffer !== null) {
              // Handle non-array-wrapped object with numeric keys
              buffer = Buffer.from(Object.values(logoBuffer));
            } else {
              throw new Error('Unexpected logo buffer format from object storage');
            }
            const base64Logo = buffer.toString('base64');
            // Determine MIME type from file extension
            const ext = fileKey.split('.').pop()?.toLowerCase();
            const mimeType = ext === 'png' ? 'image/png' : 
                            ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 
                            ext === 'svg' ? 'image/svg+xml' : 'image/png';
            logoDataUri = `data:${mimeType};base64,${base64Logo}`;
          }
        }
      } catch (error) {
        console.error('Error fetching logo for email:', error);
        // Continue without logo
      }

      // Build detailed pricing rows
      let pricingRows = '';
      
      if (booking.baseFare) {
        pricingRows += `
          <div class="pricing-row">
            <span class="pricing-label">Base Fare</span>
            <span class="pricing-value">$${parseFloat(booking.baseFare).toFixed(2)}</span>
          </div>
        `;
      }
      
      if (booking.surgePricingAmount && parseFloat(booking.surgePricingAmount) > 0) {
        const multiplier = booking.surgePricingMultiplier ? ` (${booking.surgePricingMultiplier}x)` : '';
        pricingRows += `
          <div class="pricing-row">
            <span class="pricing-label">Surge Pricing${multiplier}</span>
            <span class="pricing-value pricing-surge">+$${parseFloat(booking.surgePricingAmount).toFixed(2)}</span>
          </div>
        `;
      }
      
      if (booking.gratuityAmount && parseFloat(booking.gratuityAmount) > 0) {
        pricingRows += `
          <div class="pricing-row">
            <span class="pricing-label">Gratuity (Tip)</span>
            <span class="pricing-value">+$${parseFloat(booking.gratuityAmount).toFixed(2)}</span>
          </div>
        `;
      }
      
      if (booking.airportFeeAmount && parseFloat(booking.airportFeeAmount) > 0) {
        pricingRows += `
          <div class="pricing-row">
            <span class="pricing-label">Airport Fee</span>
            <span class="pricing-value">+$${parseFloat(booking.airportFeeAmount).toFixed(2)}</span>
          </div>
        `;
      }
      
      if (booking.discountAmount && parseFloat(booking.discountAmount) > 0) {
        const percentage = booking.discountPercentage ? ` (${booking.discountPercentage}%)` : '';
        pricingRows += `
          <div class="pricing-row">
            <span class="pricing-label">Discount${percentage}</span>
            <span class="pricing-value pricing-discount">-$${parseFloat(booking.discountAmount).toFixed(2)}</span>
          </div>
        `;
      }

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1f2937;
              background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
              padding: 0;
              margin: 0;
            }
            .email-wrapper { 
              background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); 
              padding: 40px 20px; 
            }
            .container { 
              max-width: 680px; 
              margin: 0 auto; 
              background-color: #ffffff; 
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            }
            
            /* Header with Logo */
            .header { 
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              padding: 48px 32px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="rgba(255,255,255,0.03)" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>');
              background-size: cover;
              background-position: bottom;
              opacity: 0.1;
            }
            .logo-container {
              background: white;
              padding: 16px 24px;
              border-radius: 12px;
              display: inline-block;
              margin-bottom: 16px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .logo-img { 
              max-height: 80px; 
              max-width: 320px; 
              height: auto;
              width: auto;
              display: block;
            }
            .company-name { 
              font-size: 32px; 
              font-weight: 800; 
              color: #ffffff;
              text-transform: uppercase;
              letter-spacing: 2px;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
            .tagline { 
              font-size: 15px; 
              color: #cbd5e1; 
              font-weight: 500;
              margin-top: 8px;
              letter-spacing: 0.5px;
            }
            
            /* Success Banner */
            .success-banner { 
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              padding: 24px;
              text-align: center;
              border-bottom: 4px solid #f59e0b;
            }
            .success-banner h2 { 
              color: #92400e; 
              font-size: 22px;
              margin: 0;
              font-weight: 800;
              letter-spacing: 2px;
              text-transform: uppercase;
            }
            
            /* Content */
            .content { 
              padding: 40px 32px; 
              background: #ffffff;
            }
            .greeting { 
              margin-bottom: 32px;
              padding: 24px;
              background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
              border-left: 4px solid #3b82f6;
              border-radius: 8px;
            }
            .greeting p { 
              margin-bottom: 10px;
              color: #1e40af;
              font-size: 15px;
            }
            .greeting strong {
              color: #1e3a8a;
              font-size: 16px;
            }
            
            /* Sections */
            .section { 
              margin-bottom: 32px;
              background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              padding: 24px;
              box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            }
            .section-title { 
              font-weight: 800;
              font-size: 17px;
              margin-bottom: 20px;
              color: #1f2937;
              text-transform: uppercase;
              letter-spacing: 1px;
              padding-bottom: 12px;
              border-bottom: 3px solid #e5e7eb;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .info-row { 
              display: flex;
              justify-content: space-between;
              padding: 14px 0;
              border-bottom: 1px solid #f3f4f6;
              align-items: flex-start;
            }
            .info-row:last-child { border-bottom: none; }
            .info-label { 
              font-weight: 700;
              color: #6b7280;
              flex: 0 0 45%;
              font-size: 14px;
            }
            .info-value { 
              color: #111827;
              flex: 1;
              text-align: right;
              font-weight: 600;
              font-size: 14px;
              word-break: break-word;
            }
            
            /* Pricing Section */
            .pricing-section {
              background: #ffffff;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 32px;
              box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            }
            .pricing-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 16px 0;
              border-bottom: 1px solid #f3f4f6;
            }
            .pricing-row:last-child { border-bottom: none; }
            .pricing-label {
              font-size: 15px;
              color: #374151;
              font-weight: 600;
            }
            .pricing-value {
              font-size: 16px;
              color: #111827;
              font-weight: 700;
            }
            .pricing-surge {
              color: #dc2626;
              font-weight: 800;
            }
            .pricing-discount {
              color: #059669;
              font-weight: 800;
            }
            
            /* Total Section */
            .total-section {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border: 4px solid #f59e0b;
              border-radius: 12px;
              padding: 24px;
              margin-top: 24px;
              box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.3);
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .total-label {
              font-size: 20px;
              color: #78350f;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .total-value {
              font-size: 32px;
              color: #b45309;
              font-weight: 900;
            }
            
            /* Payment */
            .payment-link { 
              text-align: center;
              margin: 32px 0;
              padding: 32px;
              background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
              border-radius: 12px;
              border: 3px solid #3b82f6;
              box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
            }
            .payment-link p {
              color: #1e40af;
              font-weight: 700;
              margin-bottom: 20px;
              font-size: 17px;
            }
            .payment-button { 
              display: inline-block;
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: #ffffff;
              padding: 16px 48px;
              text-decoration: none;
              border-radius: 10px;
              font-weight: 800;
              font-size: 17px;
              box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.5);
              transition: all 0.2s;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .payment-button:hover {
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              transform: translateY(-2px);
              box-shadow: 0 15px 20px -3px rgba(59, 130, 246, 0.6);
            }
            
            /* Paid Badge */
            .paid-badge { 
              background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
              color: #065f46;
              padding: 28px;
              text-align: center;
              font-weight: 900;
              font-size: 24px;
              border-radius: 12px;
              margin: 32px 0;
              border: 4px solid #10b981;
              letter-spacing: 3px;
              text-transform: uppercase;
              box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
            }
            
            /* Footer */
            .footer-note { 
              font-size: 14px;
              color: #6b7280;
              text-align: center;
              padding: 32px;
              border-top: 3px solid #e5e7eb;
              margin-top: 40px;
              background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
              border-radius: 0 0 12px 12px;
            }
            .footer-note strong {
              color: #374151;
              font-weight: 700;
            }
            .footer-note p {
              margin: 8px 0;
            }
            
            @media only screen and (max-width: 600px) {
              .email-wrapper { padding: 12px; }
              .content { padding: 20px 16px; }
              .section { padding: 16px; }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              <!-- Header with Logo -->
              <div class="header">
                ${logoDataUri ? `
                  <div class="logo-container">
                    <img src="${logoDataUri}" alt="USA Luxury Limo" class="logo-img" />
                  </div>
                ` : `
                  <div class="company-name">USA LUXURY LIMO</div>
                `}
                <div class="tagline">Premium Luxury Transportation Service</div>
              </div>

              <!-- Invoice Ready Banner -->
              <div class="success-banner">
                <h2>📄 YOUR INVOICE IS READY</h2>
              </div>

              <!-- Content -->
              <div class="content">
                <div class="greeting">
                  <p><strong>Dear ${passenger?.firstName || 'Customer'},</strong></p>
                  <p>Thank you for booking with USA Luxury Limo Service! Below is your detailed invoice.</p>
                </div>

                <!-- Invoice Information -->
                <div class="section">
                  <div class="section-title">📋 Invoice Information</div>
                  <div class="info-row">
                    <span class="info-label">Invoice Number</span>
                    <span class="info-value">${invoice.invoiceNumber}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Date & time</span>
                    <span class="info-value">${new Date(booking.scheduledDateTime).toLocaleString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Booking REF#</span>
                    <span class="info-value">#${booking.id.toUpperCase().substring(0, 8)}</span>
                  </div>
                </div>

                <!-- Journey Information -->
                <div class="section">
                  <div class="section-title">🚗 Journey Information</div>
                  <div class="info-row">
                    <span class="info-label">Pickup Location:</span>
                    <span class="info-value">${booking.pickupAddress}</span>
                  </div>
                  ${booking.bookingType === 'hourly' && booking.requestedHours ? `
                  <div class="info-row">
                    <span class="info-label">Duration:</span>
                    <span class="info-value">${booking.requestedHours} ${booking.requestedHours === 1 ? 'Hour' : 'Hours'}</span>
                  </div>
                  ` : booking.destinationAddress ? `
                  <div class="info-row">
                    <span class="info-label">Destination:</span>
                    <span class="info-value">${booking.destinationAddress}</span>
                  </div>
                  ` : ''}
                </div>

                <!-- Account -->
                <div class="section">
                  <div class="section-title">👤 Account Details</div>
                  <div class="info-row">
                    <span class="info-label">Name</span>
                    <span class="info-value">${passenger?.firstName} ${passenger?.lastName}</span>
                  </div>
                  ${passenger?.phone ? `
                  <div class="info-row">
                    <span class="info-label">Phone</span>
                    <span class="info-value">${passenger.phone}</span>
                  </div>
                  ` : ''}
                  ${passenger?.email ? `
                  <div class="info-row">
                    <span class="info-label">E-mail</span>
                    <span class="info-value">${passenger.email}</span>
                  </div>
                  ` : ''}
                </div>

                <!-- Detailed Pricing Breakdown -->
                <div class="pricing-section">
                  <div class="section-title">💰 Detailed Pricing Breakdown</div>
                  ${pricingRows || `
                    <div class="pricing-row">
                      <span class="pricing-label">Journey Fare</span>
                      <span class="pricing-value">$${parseFloat(invoice.subtotal).toFixed(2)}</span>
                    </div>
                  `}
                  
                  <div class="total-section">
                    <div class="total-row">
                      <span class="total-label">Total Amount</span>
                      <span class="total-value">$${parseFloat(invoice.totalAmount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                ${invoice.paidAt ? `
                <!-- Payment Status -->
                <div class="paid-badge">
                  ✓ PAYMENT RECEIVED
                </div>
                ` : `
                <!-- Payment Link -->
                <div class="payment-link">
                  <p>Click the button below to complete your payment securely</p>
                  <a href="${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'https://your-domain.com'}/pay/${paymentToken}" class="payment-button">Make Payment Now</a>
                </div>
                `}

                <!-- Footer Note -->
                <div class="footer-note">
                  <p>💡 <em>All prices include statutory taxes and transportation expenses</em></p>
                  <br>
                  <p>Best regards,<br><strong>USA Luxury Limo Service</strong></p>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const emailSent = await sendEmail({
        to: recipientEmail,
        subject: `Invoice #${invoice.invoiceNumber} - USA Luxury Limo`,
        html: emailHtml,
      });

      if (!emailSent) {
        return res.status(500).json({ 
          message: 'Failed to send email. Please check SMTP settings.' 
        });
      }

      res.json({ message: 'Invoice sent successfully' });
    } catch (error) {
      console.error('Email invoice error:', error);
      res.status(500).json({ message: 'Failed to send invoice email' });
    }
  });

  // Backfill invoices for all bookings that don't have one
  app.post('/api/admin/invoices/backfill', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const result = await storage.backfillInvoices();
      
      res.json({
        message: 'Backfill completed successfully',
        ...result,
      });
    } catch (error) {
      console.error('Invoice backfill error:', error);
      res.status(500).json({ message: 'Failed to backfill invoices' });
    }
  });

  // Payment token validation endpoint (public - no auth required)
  app.get('/api/payment-tokens/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      const paymentToken = await storage.getPaymentToken(token);
      
      if (!paymentToken) {
        return res.status(404).json({ 
          valid: false,
          message: 'Payment link not found or has expired' 
        });
      }

      // Check if token is expired
      if (new Date() > new Date(paymentToken.expiresAt)) {
        return res.status(400).json({ 
          valid: false,
          message: 'Payment link has expired' 
        });
      }

      // Check if token has been used
      if (paymentToken.used) {
        return res.status(400).json({ 
          valid: false,
          message: 'This payment link has already been used' 
        });
      }

      // Get invoice and booking details
      const invoice = await storage.getInvoice(paymentToken.invoiceId);
      if (!invoice) {
        return res.status(404).json({ 
          valid: false,
          message: 'Invoice not found' 
        });
      }

      // Check if invoice is already paid
      if (invoice.paidAt) {
        return res.status(400).json({ 
          valid: false,
          message: 'This invoice has already been paid',
          invoice 
        });
      }

      const booking = await storage.getBooking(invoice.bookingId);
      if (!booking) {
        return res.status(404).json({ 
          valid: false,
          message: 'Booking not found' 
        });
      }

      const passenger = await storage.getUser(booking.passengerId);

      res.json({
        valid: true,
        invoice,
        booking,
        passenger,
      });
    } catch (error) {
      console.error('Payment token validation error:', error);
      res.status(500).json({ 
        valid: false,
        message: 'Failed to validate payment link' 
      });
    }
  });

  // Create payment intent for invoice payment (public - token-based auth)
  app.post('/api/payment-intents/invoice', async (req: any, res) => {
    try {
      const { token, invoiceId } = req.body;

      if (!token || !invoiceId) {
        return res.status(400).json({ message: 'Token and invoice ID are required' });
      }

      // Validate payment token
      const paymentToken = await storage.getPaymentToken(token);
      
      if (!paymentToken) {
        return res.status(404).json({ message: 'Invalid payment token' });
      }

      if (new Date() > new Date(paymentToken.expiresAt)) {
        return res.status(400).json({ message: 'Payment link has expired' });
      }

      if (paymentToken.used) {
        return res.status(400).json({ message: 'Payment link has already been used' });
      }

      if (paymentToken.invoiceId !== invoiceId) {
        return res.status(400).json({ message: 'Token does not match invoice' });
      }

      // Get invoice details
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      if (invoice.paidAt) {
        return res.status(400).json({ message: 'Invoice already paid' });
      }

      // Get booking to find passenger
      const booking = await storage.getBooking(invoice.bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      const passenger = await storage.getUser(booking.passengerId);
      
      // Create Stripe payment intent
      const amount = Math.round(parseFloat(invoice.totalAmount) * 100); // Convert to cents

      const paymentIntentData: any = {
        amount,
        currency: 'usd',
        metadata: {
          invoiceId: invoice.id,
          bookingId: invoice.bookingId,
          paymentToken: token,
          passengerId: booking.passengerId,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      };

      // If user is authenticated and has a Stripe customer ID, attach it to enable saved cards
      if (req.user?.id && passenger?.stripeCustomerId) {
        // Verify the authenticated user matches the passenger
        if (req.user.id === booking.passengerId) {
          paymentIntentData.customer = passenger.stripeCustomerId;
          paymentIntentData.setup_future_usage = 'off_session'; // Allow saving card for future use
        }
      } else if (passenger?.email && !passenger.stripeCustomerId) {
        // Create a Stripe customer for guest payments (for receipt emails)
        try {
          const customer = await stripe.customers.create({
            email: passenger.email,
            name: `${passenger.firstName} ${passenger.lastName}`,
            metadata: {
              userId: passenger.id,
            },
          });

          // Save customer ID to user profile
          await storage.updateStripeCustomerId(passenger.id, customer.id);
          
          paymentIntentData.customer = customer.id;
        } catch (customerError) {
          console.error('Failed to create Stripe customer:', customerError);
          // Continue without customer ID - payment will still work
        }
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error('Create invoice payment intent error:', error);
      res.status(500).json({ message: 'Failed to create payment intent' });
    }
  });

  // Stripe webhook for invoice payments
  app.post('/api/webhooks/stripe/invoice-payment', async (req, res) => {
    try {
      const event = req.body;

      // Handle payment intent succeeded
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const { invoiceId, paymentToken } = paymentIntent.metadata;

        if (invoiceId && paymentToken) {
          // Check if already processed (idempotency)
          const invoice = await storage.getInvoice(invoiceId);
          if (invoice && invoice.paidAt) {
            console.log(`Webhook already processed for invoice ${invoiceId}`);
            return res.json({ received: true, alreadyProcessed: true });
          }

          // Update invoice as paid
          await storage.updateInvoice(invoiceId, {
            paidAt: new Date().toISOString(),
          });

          // Mark payment token as used
          await storage.markPaymentTokenAsUsed(paymentToken);

          // Update booking payment status
          if (invoice) {
            await storage.updateBookingPayment(
              invoice.bookingId,
              paymentIntent.id,
              'paid'
            );

            // Send payment confirmation email
            const booking = await storage.getBooking(invoice.bookingId);
            const passenger = booking ? await storage.getUser(booking.passengerId) : null;

            if (passenger && booking) {
              // Get dynamic logo for email
              let logoDataUri = '';
              try {
                const logoSetting = await storage.getCmsSetting('BRAND_LOGO_URL');
                if (logoSetting?.value) {
                  const logoPath = logoSetting.value;
                  const fileKey = logoPath.includes('/file/') 
                    ? logoPath.split('/file/')[1] 
                    : logoPath.replace('/api/object-storage/', '');
                  
                  const ObjectStorage = await import('@replit/object-storage');
                  const storage_client = new ObjectStorage.Client();
                  const logoBuffer = await storage_client.downloadAsBytes(fileKey);
                  
                  if (logoBuffer) {
                    let buffer: Buffer;
                    if (Buffer.isBuffer(logoBuffer)) {
                      buffer = logoBuffer;
                    } else if (Array.isArray(logoBuffer) && logoBuffer.length > 0) {
                      buffer = Buffer.from(Object.values(logoBuffer[0]));
                    } else if (typeof logoBuffer === 'object' && logoBuffer !== null) {
                      // Handle non-array-wrapped object with numeric keys
                      buffer = Buffer.from(Object.values(logoBuffer));
                    } else {
                      throw new Error('Unexpected logo buffer format from object storage');
                    }
                    const base64Logo = buffer.toString('base64');
                    const ext = fileKey.split('.').pop()?.toLowerCase();
                    const mimeType = ext === 'png' ? 'image/png' : 
                                    ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 
                                    ext === 'svg' ? 'image/svg+xml' : 'image/png';
                    logoDataUri = `data:${mimeType};base64,${base64Logo}`;
                  }
                }
              } catch (logoError) {
                console.error('Error fetching logo for payment confirmation email:', logoError);
              }

              const scheduledDateTimeStr = booking.scheduledDateTime 
                ? new Date(booking.scheduledDateTime).toLocaleString()
                : 'Not specified';

              const emailHtml = getPaymentConfirmationEmailHTML({
                passengerName: `${passenger.firstName} ${passenger.lastName}`,
                invoiceNumber: invoice.invoiceNumber,
                bookingId: booking.id,
                amount: invoice.totalAmount,
                paymentDate: new Date().toLocaleString(),
                pickupAddress: booking.pickupAddress,
                destinationAddress: booking.destinationAddress || '',
                scheduledDateTime: scheduledDateTimeStr,
                paymentIntentId: paymentIntent.id,
                logoDataUri,
              });

              if (passenger.email) {
                await sendEmail({
                  to: passenger.email,
                  subject: `Payment Confirmed - Invoice #${invoice.invoiceNumber}`,
                  html: emailHtml,
                });
                console.log(`Payment confirmation email sent to ${passenger.email}`);
              }
            }
          }

          console.log(`Invoice ${invoiceId} marked as paid via payment intent ${paymentIntent.id}`);
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Stripe webhook error:', error);
      res.status(500).json({ message: 'Webhook processing failed' });
    }
  });

  // Admin bookings management endpoints
  app.get('/api/admin/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'dispatcher')) {
        return res.status(403).json({ message: 'Admin or dispatcher access required' });
      }

      const bookings = await storage.getAllBookingsWithDetails();
      res.json(bookings);
    } catch (error) {
      console.error('Get all bookings error:', error);
      res.status(500).json({ message: 'Failed to fetch bookings' });
    }
  });

  app.get('/api/admin/active-drivers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'dispatcher')) {
        return res.status(403).json({ message: 'Admin or dispatcher access required' });
      }

      const drivers = await storage.getActiveDrivers();
      res.json(drivers);
    } catch (error) {
      console.error('Get active drivers error:', error);
      res.status(500).json({ message: 'Failed to fetch active drivers' });
    }
  });

  app.get('/api/admin/drivers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'dispatcher')) {
        return res.status(403).json({ message: 'Admin or dispatcher access required' });
      }

      const allDrivers = await storage.getAllDrivers();
      
      // Enrich each driver with user information
      const enrichedDrivers = await Promise.all(
        allDrivers.map(async (driver: any) => {
          const driverUser = await storage.getUser(driver.userId);
          return {
            ...driver,
            firstName: driverUser?.firstName,
            lastName: driverUser?.lastName,
            email: driverUser?.email,
            phone: driverUser?.phone,
            isActive: driverUser?.isActive,
          };
        })
      );
      
      res.json(enrichedDrivers);
    } catch (error) {
      console.error('Get all drivers error:', error);
      res.status(500).json({ message: 'Failed to fetch drivers' });
    }
  });

  // Enhanced endpoint for smart driver matching
  app.get('/api/admin/drivers/for-assignment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'dispatcher')) {
        return res.status(403).json({ message: 'Admin or dispatcher access required' });
      }

      const { bookingTime } = req.query;
      const allDrivers = await storage.getAllDrivers();
      const allBookings = await storage.getAllBookingsWithDetails();
      
      // Enrich each driver with user information and upcoming bookings
      const enrichedDrivers = await Promise.all(
        allDrivers.map(async (driver: any) => {
          const driverUser = await storage.getUser(driver.userId);
          
          // Get driver's upcoming bookings
          const upcomingBookings = allBookings.filter((booking: any) => 
            booking.driverId === driver.id && 
            (booking.status === 'pending' || booking.status === 'in_progress' || booking.status === 'confirmed') &&
            new Date(booking.scheduledDateTime) >= new Date()
          );
          
          // Check for schedule conflicts if bookingTime provided
          let hasConflict = false;
          let conflictingBooking = null;
          if (bookingTime) {
            const requestedTime = new Date(bookingTime as string);
            const conflictWindow = 2 * 60 * 60 * 1000; // 2 hours window
            
            conflictingBooking = upcomingBookings.find((b: any) => {
              const bookingTime = new Date(b.scheduledDateTime).getTime();
              const diff = Math.abs(bookingTime - requestedTime.getTime());
              return diff < conflictWindow;
            });
            
            hasConflict = !!conflictingBooking;
          }
          
          return {
            ...driver,
            firstName: driverUser?.firstName,
            lastName: driverUser?.lastName,
            email: driverUser?.email,
            phone: driverUser?.phone,
            isActive: driverUser?.isActive,
            upcomingBookingsCount: upcomingBookings.length,
            hasConflict,
            conflictingBooking: conflictingBooking ? {
              id: conflictingBooking.id,
              scheduledDateTime: conflictingBooking.scheduledDateTime,
              pickupAddress: conflictingBooking.pickupAddress,
              passengerName: `${conflictingBooking.passengerFirstName} ${conflictingBooking.passengerLastName}`,
            } : null,
          };
        })
      );
      
      res.json(enrichedDrivers);
    } catch (error) {
      console.error('Get drivers for assignment error:', error);
      res.status(500).json({ message: 'Failed to fetch drivers for assignment' });
    }
  });

  app.patch('/api/admin/bookings/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }

      // Get old booking to compare status change
      const oldBooking = await storage.getBooking(id);
      const oldStatus = oldBooking?.status;
      
      await storage.updateBookingStatus(id, status);
      
      // Get updated booking
      const updatedBooking = await storage.getBooking(id);
      if (!updatedBooking) {
        return res.status(404).json({ error: 'Booking not found after update' });
      }
      
      // Send status update email to passenger if status changed
      if (oldStatus && oldStatus !== status && updatedBooking.passengerId) {
        try {
          const passenger = await storage.getUser(updatedBooking.passengerId);
          
          if (passenger?.email) {
            const scheduledDateTime = new Date(updatedBooking.scheduledDateTime).toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'America/Chicago'
            });

            await sendEmail({
              to: passenger.email,
              subject: `Booking Status Update - ${updatedBooking.id}`,
              html: getBookingStatusUpdateEmailHTML({
                passengerName: `${passenger.firstName} ${passenger.lastName}`,
                bookingId: updatedBooking.id,
                oldStatus,
                newStatus: status,
                pickupAddress: updatedBooking.pickupAddress,
                scheduledDateTime,
              }),
            });

            // Send SMS notification if phone number is available
            if (passenger.phone) {
              try {
                await sendBookingStatusUpdateSMS(
                  passenger.phone,
                  updatedBooking.id,
                  status
                );
              } catch (smsError) {
                console.error('Failed to send booking status update SMS:', smsError);
                // Continue even if SMS fails
              }
            }
          }
        } catch (emailError) {
          console.error('Failed to send booking status update email:', emailError);
          // Don't fail the status update if email fails
        }
      }
      
      return res.json(updatedBooking);
    } catch (error) {
      console.error('Update booking status error:', error);
      return res.status(500).json({ error: 'Failed to update booking status' });
    }
  });

  app.patch('/api/admin/bookings/:id/assign-driver', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'dispatcher')) {
        return res.status(403).json({ message: 'Admin or dispatcher access required' });
      }

      const { id } = req.params;
      const { driverId, driverPayment } = req.body;

      if (!driverId) {
        return res.status(400).json({ error: 'Driver ID is required' });
      }

      const updatedBooking = await storage.assignDriverToBooking(id, driverId, driverPayment);
      
      // Return response immediately for fast UI feedback
      res.json(updatedBooking);
      
      // Send driver assignment notifications asynchronously (fire and forget)
      (async () => {
        try {
          const driver = await storage.getDriver(driverId);
          const passenger = updatedBooking.passengerId ? await storage.getUser(updatedBooking.passengerId) : null;
          const vehicleType = await storage.getVehicleType(updatedBooking.vehicleTypeId);
          
          const scheduledDateTime = new Date(updatedBooking.scheduledDateTime).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Chicago'
          });
          
          // Send notifications to driver
          if (driver?.userId) {
            const driverUser = await storage.getUser(driver.userId);
            
            if (driverUser?.email) {
              await sendEmail({
                to: driverUser.email,
                subject: `New Ride Assignment - ${updatedBooking.id}`,
                html: getDriverAssignmentEmailHTML({
                  driverName: `${driverUser.firstName} ${driverUser.lastName}`,
                  bookingId: updatedBooking.id,
                  passengerName: passenger ? `${passenger.firstName} ${passenger.lastName}` : 'N/A',
                  passengerPhone: passenger?.phone || 'N/A',
                  pickupAddress: updatedBooking.pickupAddress,
                  destinationAddress: updatedBooking.destinationAddress || 'N/A',
                  scheduledDateTime,
                  vehicleType: vehicleType?.name || 'Standard',
                  driverPayment: updatedBooking.driverPayment || undefined,
                }),
              });

              // Send SMS notification to driver if phone number is available
              if (driverUser.phone && passenger) {
                try {
                  await sendDriverAssignmentSMS(
                    driverUser.phone,
                    `${passenger.firstName} ${passenger.lastName}`,
                    updatedBooking.pickupAddress,
                    new Date(updatedBooking.scheduledDateTime),
                    updatedBooking.driverPayment || undefined
                  );
                } catch (smsError) {
                  console.error('Failed to send driver assignment SMS to driver:', smsError);
                }
              }
            }
          }
          
          // Send notifications to passenger about driver assignment
          if (passenger && driver?.userId) {
            const driverUser = await storage.getUser(driver.userId);
            
            if (driverUser) {
              // Send passenger email about driver assignment
              await sendEmail({
                to: passenger.email,
                subject: `Driver Assigned - USA Luxury Limo #${updatedBooking.id.slice(0, 8)}`,
                html: getBookingStatusUpdateEmailHTML({
                  passengerName: `${passenger.firstName || ''} ${passenger.lastName || ''}`.trim() || passenger.username || 'Valued Customer',
                  bookingId: updatedBooking.id.slice(0, 8),
                  oldStatus: 'pending',
                  newStatus: 'confirmed',
                  pickupAddress: updatedBooking.pickupAddress,
                  scheduledDateTime
                })
              });
              
              // Send passenger SMS about driver assignment
              if (passenger.phone) {
                try {
                  await sendBookingStatusUpdateSMS(
                    passenger.phone,
                    updatedBooking.id,
                    'confirmed'
                  );
                } catch (smsError) {
                  console.error('Failed to send driver assignment SMS to passenger:', smsError);
                }
              }
            }
          }
        } catch (emailError) {
          console.error('Failed to send driver assignment notifications:', emailError);
        }
      })();
    } catch (error) {
      console.error('Assign driver error:', error);
      res.status(500).json({ error: 'Failed to assign driver to booking' });
    }
  });

  app.patch('/api/admin/bookings/:id/driver-payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'dispatcher')) {
        return res.status(403).json({ message: 'Admin or dispatcher access required' });
      }

      const { id } = req.params;
      const { driverPayment } = req.body;

      if (!driverPayment) {
        return res.status(400).json({ error: 'Driver payment amount is required' });
      }

      // Validate that driverPayment is a valid number
      const paymentAmount = parseFloat(driverPayment);
      if (isNaN(paymentAmount) || paymentAmount < 0) {
        return res.status(400).json({ error: 'Invalid driver payment amount' });
      }

      const updatedBooking = await storage.updateBookingDriverPayment(id, driverPayment);
      
      if (!updatedBooking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      
      res.json(updatedBooking);
    } catch (error) {
      console.error('Update driver payment error:', error);
      res.status(500).json({ error: 'Failed to update driver payment' });
    }
  });

  // Admin journey tracking endpoints
  app.patch('/api/admin/bookings/:id/no-show', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { id } = req.params;
      const { noShow } = req.body;

      const updatedBooking = await storage.updateBooking(id, {
        noShow: noShow === true,
      });

      res.json(updatedBooking);
    } catch (error) {
      console.error('Update no-show error:', error);
      res.status(500).json({ message: 'Failed to update no-show status' });
    }
  });

  app.patch('/api/admin/bookings/:id/refund-invoice', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { id } = req.params;

      const updatedBooking = await storage.updateBooking(id, {
        refundInvoiceSent: true,
      });

      res.json(updatedBooking);
    } catch (error) {
      console.error('Send refund invoice error:', error);
      res.status(500).json({ message: 'Failed to send refund invoice' });
    }
  });

  app.patch('/api/admin/bookings/:id/mark-completed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { id } = req.params;

      const updatedBooking = await storage.updateBooking(id, {
        markedCompletedAt: new Date(),
      });

      res.json(updatedBooking);
    } catch (error) {
      console.error('Mark completed error:', error);
      res.status(500).json({ message: 'Failed to mark booking as completed' });
    }
  });

  app.get('/api/admin/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Fetch all system settings from database
      const allSettings = await storage.getAllSystemSettings();

      // Build a map of database credentials
      const dbCredentials: Record<string, { value: string | null; updatedAt: Date | null }> = {};
      allSettings.forEach(setting => {
        dbCredentials[setting.key] = { value: setting.value, updatedAt: setting.updatedAt };
      });

      // Known environment variables to check
      const envKeys = ['STRIPE_SECRET_KEY', 'STRIPE_PUBLIC_KEY', 'TOMTOM_API_KEY', 'RAPIDAPI_KEY', 'DATABASE_URL'];
      
      // Build credentials list with metadata
      const credentials: Array<{
        key: string;
        hasValue: boolean;
        usesEnv: boolean;
        canDelete: boolean;
        updatedAt?: string;
      }> = [];

      // Twilio settings to exclude (managed in SMS Settings section)
      const twilioKeys = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER', 'TWILIO_ENABLED'];
      
      // Add all database credentials (excluding Twilio settings)
      allSettings.forEach(setting => {
        // Skip Twilio settings - they're managed in the SMS Settings section
        if (twilioKeys.includes(setting.key)) {
          return;
        }
        
        const hasEnv = !!process.env[setting.key];
        credentials.push({
          key: setting.key,
          hasValue: true,
          usesEnv: false,
          canDelete: true,
          updatedAt: setting.updatedAt?.toISOString(),
        });
      });

      // Add env-only credentials
      envKeys.forEach(key => {
        if (process.env[key] && !dbCredentials[key]) {
          credentials.push({
            key,
            hasValue: true,
            usesEnv: true,
            canDelete: false,
          });
        }
      });

      // Add MinIO credential placeholders if they don't exist
      const minioKeys = [
        'MINIO_SERVICE_NAME',
        'MINIO_CONSOLE_URL',
        'MINIO_ENDPOINT',
        'MINIO_ACCESS_KEY',
        'MINIO_SECRET_KEY',
        'MINIO_BUCKET'
      ];
      
      minioKeys.forEach(key => {
        // Only add if not already in credentials (from DB or env)
        if (!credentials.find(c => c.key === key)) {
          credentials.push({
            key,
            hasValue: false,
            usesEnv: false,
            canDelete: true,
          });
        }
      });

      res.json({ credentials });
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ message: 'Failed to fetch settings' });
    }
  });

  app.post('/api/admin/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { settings } = req.body;
      
      let minioCredentialsUpdated = false;
      for (const [key, value] of Object.entries(settings)) {
        // Only update if value is provided and not the masked placeholder
        if (value && typeof value === 'string' && value !== '••••••••') {
          await storage.updateSystemSetting(key, value as string, userId);
          
          // Track if MinIO credentials were updated
          if (key.startsWith('MINIO_')) {
            minioCredentialsUpdated = true;
          }
        }
      }

      // Refresh object storage adapter if MinIO credentials were updated
      if (minioCredentialsUpdated) {
        refreshObjectStorage();
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ message: 'Failed to update settings' });
    }
  });

  app.get('/api/admin/settings/:key/value', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { key } = req.params;
      const setting = await storage.getSystemSetting(key);

      if (!setting) {
        return res.status(404).json({ message: 'Credential not found' });
      }

      res.json({ value: setting.value });
    } catch (error) {
      console.error('Get setting value error:', error);
      res.status(500).json({ message: 'Failed to fetch credential value' });
    }
  });

  app.delete('/api/admin/settings/:key', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { key } = req.params;
      await storage.deleteSystemSetting(key);

      res.json({ success: true });
    } catch (error) {
      console.error('Delete setting error:', error);
      res.status(500).json({ message: 'Failed to delete setting' });
    }
  });

  // DATABASE_URL Management (Encrypted)
  app.get('/api/admin/database-url', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const setting = await storage.getSystemSetting('DATABASE_URL');
      const currentUrl = process.env.DATABASE_URL || '';
      const encryptionKeyConfigured = hasEncryptionKey();
      
      res.json({
        hasValue: !!(setting?.value || currentUrl),
        fromDatabase: !!setting?.value,
        fromEnv: !setting?.value && !!currentUrl,
        hasEncryptionKey: encryptionKeyConfigured,
        updatedAt: setting?.updatedAt,
        updatedBy: setting?.updatedBy,
      });
    } catch (error) {
      console.error('Get DATABASE_URL error:', error);
      res.status(500).json({ message: 'Failed to fetch DATABASE_URL setting' });
    }
  });

  app.post('/api/admin/database-url', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      // Check if encryption key is configured
      if (!hasEncryptionKey()) {
        return res.status(400).json({ 
          message: 'SETTINGS_ENCRYPTION_KEY environment variable is not configured. Please add it to your Replit Secrets or environment variables before using this feature.' 
        });
      }

      const userId = req.user.id;
      const { databaseUrl } = req.body;
      
      if (!databaseUrl || typeof databaseUrl !== 'string') {
        return res.status(400).json({ message: 'Database URL is required' });
      }

      // Basic validation for PostgreSQL URL format
      if (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://')) {
        return res.status(400).json({ message: 'Invalid PostgreSQL connection string format' });
      }

      // Store encrypted
      await storage.updateEncryptedSetting(
        'DATABASE_URL', 
        databaseUrl, 
        userId,
        'PostgreSQL database connection URL (requires app restart to take effect)'
      );

      res.json({ 
        success: true,
        message: 'DATABASE_URL updated successfully. Restart the application for changes to take effect.' 
      });
    } catch (error) {
      console.error('Update DATABASE_URL error:', error);
      res.status(500).json({ message: 'Failed to update DATABASE_URL' });
    }
  });

  app.delete('/api/admin/database-url', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      // Check if encryption key is configured
      if (!hasEncryptionKey()) {
        return res.status(400).json({ 
          message: 'SETTINGS_ENCRYPTION_KEY environment variable is not configured. Please add it to your Replit Secrets or environment variables before using this feature.' 
        });
      }

      await storage.deleteSystemSetting('DATABASE_URL');
      res.json({ 
        success: true,
        message: 'DATABASE_URL setting removed. Application will use environment variable on next restart.' 
      });
    } catch (error) {
      console.error('Delete DATABASE_URL error:', error);
      res.status(500).json({ message: 'Failed to delete DATABASE_URL setting' });
    }
  });

  // System Commission Settings
  app.get('/api/admin/system-commission', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const setting = await storage.getSystemSetting('SYSTEM_COMMISSION_PERCENTAGE');
      
      res.json({ 
        percentage: setting?.value ? parseFloat(setting.value) : 0,
        description: 'System commission percentage applied to ride total costs for driver payments'
      });
    } catch (error) {
      console.error('Get system commission error:', error);
      res.status(500).json({ message: 'Failed to fetch system commission' });
    }
  });

  app.put('/api/admin/system-commission', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { percentage } = req.body;
      
      // Validate percentage
      if (percentage === undefined || percentage === null) {
        return res.status(400).json({ message: 'Percentage is required' });
      }

      const numPercentage = parseFloat(percentage);
      if (isNaN(numPercentage) || numPercentage < 0 || numPercentage > 100) {
        return res.status(400).json({ message: 'Percentage must be between 0 and 100' });
      }

      await storage.updateSystemSetting(
        'SYSTEM_COMMISSION_PERCENTAGE', 
        numPercentage.toString(), 
        userId
      );

      res.json({ 
        success: true,
        percentage: numPercentage 
      });
    } catch (error) {
      console.error('Update system commission error:', error);
      res.status(500).json({ message: 'Failed to update system commission' });
    }
  });

  // User Management (admin only)
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const users = await storage.getAllUsers();
      
      // Fetch driver info for drivers
      const usersWithDriverInfo = await Promise.all(
        users.map(async (u) => {
          if (u.role === 'driver') {
            const driverInfo = await storage.getDriverByUserId(u.id);
            return {
              ...u,
              password: undefined,
              driverInfo: driverInfo || null,
            };
          }
          return {
            ...u,
            password: undefined,
          };
        })
      );
      
      res.json(usersWithDriverInfo);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.put('/api/admin/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { id } = req.params;
      const { role, isActive, payLaterEnabled, cashPaymentEnabled, discountType, discountValue, firstName, lastName, email, phone, vehiclePlate, username } = req.body;
      
      const updates: Partial<User> = {};
      if (role !== undefined) updates.role = role;
      if (isActive !== undefined) updates.isActive = isActive;
      if (payLaterEnabled !== undefined) updates.payLaterEnabled = payLaterEnabled;
      if (cashPaymentEnabled !== undefined) updates.cashPaymentEnabled = cashPaymentEnabled;
      if (discountType !== undefined) updates.discountType = discountType;
      if (discountValue !== undefined) {
        // Validate discount value
        const value = parseFloat(discountValue);
        if (isNaN(value) || value < 0) {
          return res.status(400).json({ message: 'Invalid discount value' });
        }
        // For percentage, ensure it's between 0 and 100
        if (discountType === 'percentage' && value > 100) {
          return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
        }
        updates.discountValue = discountValue.toString();
      }
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (email !== undefined) updates.email = email;
      if (phone !== undefined) updates.phone = phone;
      
      // Validate and check username if provided
      if (username !== undefined) {
        if (username.trim()) {
          // Validate username format
          const usernameRegex = /^[a-zA-Z0-9_-]+$/;
          if (!usernameRegex.test(username) || username.length < 3 || username.length > 30) {
            return res.status(400).json({ 
              message: "Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens" 
            });
          }
          
          // Check if username is already taken by another user
          const existingUser = await storage.getUserByUsername(username);
          if (existingUser && existingUser.id !== id) {
            return res.status(400).json({ message: "Username is already taken" });
          }
          
          updates.username = username;
        } else {
          updates.username = null;
        }
      }
      
      const updatedUser = await storage.updateUser(id, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // If role is changed to 'driver', create driver record if it doesn't exist
      if (role === 'driver') {
        const existingDriver = await storage.getDriverByUserId(id);
        if (!existingDriver) {
          await storage.createDriver({
            userId: id,
            vehiclePlate: vehiclePlate || null,
          });
        } else if (vehiclePlate !== undefined) {
          // Update vehicle plate for existing driver
          await storage.updateDriver(existingDriver.id, { vehiclePlate });
        }
      }
      
      res.json({ ...updatedUser, password: undefined });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  app.post('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { firstName, lastName, email, phone, role, isActive, payLaterEnabled, cashPaymentEnabled, vehiclePlate } = req.body;
      
      if (!firstName || !email) {
        return res.status(400).json({ message: 'First name and email are required' });
      }

      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Create temporary password (user should reset)
      const tempPassword = Math.random().toString(36).slice(-10);
      
      // Determine default isActive based on role
      // Admin accounts start as inactive and must be activated by existing admins
      let defaultIsActive = true;
      if (role === 'admin') {
        defaultIsActive = false;
      }
      
      const newUser = await storage.createUser({
        email,
        password: tempPassword,
        firstName,
        lastName: lastName || '',
        phone: phone || '',
        role: role || 'passenger',
        isActive: isActive !== undefined ? isActive : defaultIsActive,
        payLaterEnabled: payLaterEnabled || false,
        cashPaymentEnabled: cashPaymentEnabled || false,
      });

      // If creating a user with 'driver' role, create driver record
      if (role === 'driver') {
        await storage.createDriver({
          userId: newUser.id,
          vehiclePlate: vehiclePlate || null,
        });
      }
      
      res.json({ ...newUser, password: undefined });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  app.delete('/api/admin/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { id } = req.params;
      
      // Prevent admin from deleting themselves
      if (id === userId) {
        return res.status(400).json({ message: 'You cannot delete your own account' });
      }
      
      const deleted = await storage.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // Admin: Set temporary password for user
  app.post('/api/admin/users/:id/set-temp-password', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { id } = req.params;
      const { temporaryPassword } = req.body;
      
      if (!temporaryPassword || temporaryPassword.length < 6) {
        return res.status(400).json({ message: 'Temporary password must be at least 6 characters' });
      }
      
      // Prevent admin from setting temp password for themselves
      if (id === userId) {
        return res.status(400).json({ message: 'Cannot set temporary password for yourself' });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Hash the temporary password
      const hashedPassword = await hashPassword(temporaryPassword);
      
      // Update user password and clear any reset tokens
      await storage.updateUser(id, { password: hashedPassword });
      await storage.clearPasswordResetToken(id);
      
      // Send notification (fire and forget - don't wait for result)
      if (user.email) {
        sendTemporaryPasswordEmail(user.email, temporaryPassword, user.username).catch(err => 
          console.error('Failed to send temp password email:', err)
        );
      }
      if (user.phone) {
        sendTemporaryPasswordSMS(user.phone, temporaryPassword).catch(err => 
          console.error('Failed to send temp password SMS:', err)
        );
      }
      
      res.json({ message: 'Temporary password set successfully' });
    } catch (error) {
      console.error('Error setting temporary password:', error);
      res.status(500).json({ message: 'Failed to set temporary password' });
    }
  });

  // Driver Profile Management
  app.get('/api/driver/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'driver') {
        return res.status(403).json({ message: 'Driver access required' });
      }

      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: 'Driver profile not found' });
      }

      // Get all driver bookings for computing metrics
      const allBookings = await storage.getBookingsByDriver(driver.id);
      
      // Calculate completed rides count
      const completedRides = allBookings.filter(b => b.status === 'completed').length;
      
      // Calculate average rating
      const avgRating = await storage.getDriverAverageRating(driver.id);

      // Return enriched driver profile
      res.json({
        ...driver,
        completedRides,
        rating: avgRating || 0,
      });
    } catch (error) {
      console.error('Get driver profile error:', error);
      res.status(500).json({ message: 'Failed to fetch driver profile' });
    }
  });

  app.patch('/api/driver/availability', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'driver') {
        return res.status(403).json({ message: 'Driver access required' });
      }

      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: 'Driver profile not found' });
      }

      const { isAvailable } = req.body;
      if (typeof isAvailable !== 'boolean') {
        return res.status(400).json({ message: 'isAvailable must be a boolean' });
      }

      const updatedDriver = await storage.updateDriverAvailability(driver.id, isAvailable);
      res.json(updatedDriver);
    } catch (error) {
      console.error('Update driver availability error:', error);
      res.status(500).json({ message: 'Failed to update availability' });
    }
  });

  app.patch('/api/driver/location', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'driver') {
        return res.status(403).json({ message: 'Driver access required' });
      }

      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: 'Driver profile not found' });
      }

      const { lat, lng } = req.body;
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return res.status(400).json({ message: 'Valid latitude and longitude required' });
      }

      // Store location as JSON string
      const location = JSON.stringify({ lat, lng, timestamp: new Date().toISOString() });
      const updatedDriver = await storage.updateDriverLocation(driver.id, location);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Update driver location error:', error);
      res.status(500).json({ message: 'Failed to update location' });
    }
  });

  app.patch('/api/driver/credentials', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'driver') {
        return res.status(403).json({ message: 'Driver access required' });
      }

      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: 'Driver profile not found' });
      }

      const { driverCredentials } = req.body;
      if (typeof driverCredentials !== 'string') {
        return res.status(400).json({ message: 'driverCredentials must be a string' });
      }

      const updatedDriver = await storage.updateDriver(driver.id, { driverCredentials });
      res.json(updatedDriver);
    } catch (error) {
      console.error('Update driver credentials error:', error);
      res.status(500).json({ message: 'Failed to update credentials' });
    }
  });

  app.patch('/api/driver/vehicle-plate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'driver') {
        return res.status(403).json({ message: 'Driver access required' });
      }

      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: 'Driver profile not found' });
      }

      const { vehiclePlate } = req.body;
      if (typeof vehiclePlate !== 'string') {
        return res.status(400).json({ message: 'vehiclePlate must be a string' });
      }

      const updatedDriver = await storage.updateDriver(driver.id, { vehiclePlate });
      res.json(updatedDriver);
    } catch (error) {
      console.error('Update driver vehicle plate error:', error);
      res.status(500).json({ message: 'Failed to update vehicle plate' });
    }
  });

  // Get driver earnings breakdown by time period
  app.get('/api/driver/earnings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'driver') {
        return res.status(403).json({ message: 'Driver access required' });
      }

      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: 'Driver profile not found' });
      }

      // Get all completed bookings for this driver
      const allBookings = await storage.getBookingsByDriver(driver.id);
      const completedBookings = allBookings.filter((b: Booking) => b.status === 'completed' && b.driverPayment);

      // Calculate date ranges
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      // Calculate earnings for each period
      const todayEarnings = completedBookings
        .filter((b: Booking) => {
          const completedDate = b.markedCompletedAt || b.updatedAt;
          return completedDate ? new Date(completedDate) >= startOfToday : false;
        })
        .reduce((sum: number, b: Booking) => sum + parseFloat(b.driverPayment || '0'), 0);

      const weekEarnings = completedBookings
        .filter((b: Booking) => {
          const completedDate = b.markedCompletedAt || b.updatedAt;
          return completedDate ? new Date(completedDate) >= startOfWeek : false;
        })
        .reduce((sum: number, b: Booking) => sum + parseFloat(b.driverPayment || '0'), 0);

      const monthEarnings = completedBookings
        .filter((b: Booking) => {
          const completedDate = b.markedCompletedAt || b.updatedAt;
          return completedDate ? new Date(completedDate) >= startOfMonth : false;
        })
        .reduce((sum: number, b: Booking) => sum + parseFloat(b.driverPayment || '0'), 0);

      const yearEarnings = completedBookings
        .filter((b: Booking) => {
          const completedDate = b.markedCompletedAt || b.updatedAt;
          return completedDate ? new Date(completedDate) >= startOfYear : false;
        })
        .reduce((sum: number, b: Booking) => sum + parseFloat(b.driverPayment || '0'), 0);

      const allTimeEarnings = completedBookings
        .reduce((sum: number, b: Booking) => sum + parseFloat(b.driverPayment || '0'), 0);

      res.json({
        today: todayEarnings,
        week: weekEarnings,
        month: monthEarnings,
        year: yearEarnings,
        allTime: allTimeEarnings,
        currentDate: now.toISOString(),
        completedRidesCount: completedBookings.length,
      });
    } catch (error) {
      console.error('Get driver earnings error:', error);
      res.status(500).json({ message: 'Failed to fetch earnings' });
    }
  });

  // Journey Tracking - Driver status updates with GPS
  app.post('/api/driver/job/accept', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'driver') {
        return res.status(403).json({ message: 'Driver access required' });
      }

      const { bookingId, lat, lng } = req.body;
      if (!bookingId || typeof lat !== 'number' || typeof lng !== 'number') {
        return res.status(400).json({ message: 'Booking ID and GPS coordinates required' });
      }

      const location = { lat, lng, timestamp: new Date().toISOString() };
      const updatedBooking = await storage.updateBooking(bookingId, {
        acceptedAt: new Date(),
        acceptedLocation: location,
      });

      res.json(updatedBooking);
    } catch (error) {
      console.error('Accept job error:', error);
      res.status(500).json({ message: 'Failed to accept job' });
    }
  });

  app.post('/api/driver/job/start', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'driver') {
        return res.status(403).json({ message: 'Driver access required' });
      }

      const { bookingId, lat, lng } = req.body;
      if (!bookingId || typeof lat !== 'number' || typeof lng !== 'number') {
        return res.status(400).json({ message: 'Booking ID and GPS coordinates required' });
      }

      const location = { lat, lng, timestamp: new Date().toISOString() };
      const updatedBooking = await storage.updateBooking(bookingId, {
        startedAt: new Date(),
        startedLocation: location,
        status: 'in_progress',
      });

      res.json(updatedBooking);
    } catch (error) {
      console.error('Start job error:', error);
      res.status(500).json({ message: 'Failed to start job' });
    }
  });

  app.post('/api/driver/job/dod', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'driver') {
        return res.status(403).json({ message: 'Driver access required' });
      }

      const { bookingId, lat, lng } = req.body;
      if (!bookingId || typeof lat !== 'number' || typeof lng !== 'number') {
        return res.status(400).json({ message: 'Booking ID and GPS coordinates required' });
      }

      const location = { lat, lng, timestamp: new Date().toISOString() };
      const updatedBooking = await storage.updateBooking(bookingId, {
        dodAt: new Date(),
        dodLocation: location,
      });

      res.json(updatedBooking);
    } catch (error) {
      console.error('DOD error:', error);
      res.status(500).json({ message: 'Failed to update DOD' });
    }
  });

  app.post('/api/driver/job/pob', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'driver') {
        return res.status(403).json({ message: 'Driver access required' });
      }

      const { bookingId, lat, lng } = req.body;
      if (!bookingId || typeof lat !== 'number' || typeof lng !== 'number') {
        return res.status(400).json({ message: 'Booking ID and GPS coordinates required' });
      }

      const location = { lat, lng, timestamp: new Date().toISOString() };
      const updatedBooking = await storage.updateBooking(bookingId, {
        pobAt: new Date(),
        pobLocation: location,
      });

      res.json(updatedBooking);
    } catch (error) {
      console.error('POB error:', error);
      res.status(500).json({ message: 'Failed to update POB' });
    }
  });

  app.post('/api/driver/job/end', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'driver') {
        return res.status(403).json({ message: 'Driver access required' });
      }

      const { bookingId, lat, lng } = req.body;
      if (!bookingId || typeof lat !== 'number' || typeof lng !== 'number') {
        return res.status(400).json({ message: 'Booking ID and GPS coordinates required' });
      }

      const location = { lat, lng, timestamp: new Date().toISOString() };
      const updatedBooking = await storage.updateBooking(bookingId, {
        endedAt: new Date(),
        endedLocation: location,
        status: 'completed',
      });

      res.json(updatedBooking);
    } catch (error) {
      console.error('End job error:', error);
      res.status(500).json({ message: 'Failed to end job' });
    }
  });

  // Driver Documents Management
  // Upload document (driver only)
  app.post('/api/driver/documents/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'driver') {
        return res.status(403).json({ message: 'Driver access required' });
      }

      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: 'Driver profile not found' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { documentType, expirationDate, vehiclePlate, whatsappNumber } = req.body;
      
      // Validate with Zod schema
      const docDataToValidate: any = {
        driverId: driver.id,
        documentType,
        documentUrl: 'temp', // Will be replaced after upload
        status: 'pending', // Explicitly set to pending, cannot be overridden
      };

      // Handle expiration date for documents that have one
      if (expirationDate && documentType !== 'vehicle_image') {
        // Convert date string to Date object for timestamp validation
        docDataToValidate.expirationDate = new Date(expirationDate);
      }

      // Handle vehicle plate for vehicle images
      if (vehiclePlate && documentType === 'vehicle_image') {
        docDataToValidate.vehiclePlate = vehiclePlate;
      }

      if (whatsappNumber) {
        docDataToValidate.whatsappNumber = whatsappNumber;
      }

      // Validate document data with schema
      const validationResult = insertDriverDocumentSchema.safeParse(docDataToValidate);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid document data', 
          errors: validationResult.error.errors 
        });
      }

      const file = req.file;
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `driver-docs/${driver.id}/${documentType}-${Date.now()}.${fileExtension}`;

      // Upload to Object Storage
      const objStorage = await getObjectStorage();
      const { ok, error } = await objStorage.uploadFromBytes(
        fileName,
        file.buffer
      );

      if (!ok) {
        console.error('Upload to Object Storage failed:', error);
        return res.status(500).json({ message: `Upload failed: ${error}` });
      }

      // Create validated document with actual URL
      const validatedData = validationResult.data;
      validatedData.documentUrl = fileName;

      const document = await storage.createDriverDocument(validatedData);

      // If this is a profile photo or vehicle image, also update the user's profileImageUrl
      if (documentType === 'profile_photo' || documentType === 'vehicle_image') {
        // Store just the file path (object storage key), not the full URL
        const imageUrl = fileName;
        
        await storage.updateUser(userId, { 
          profileImageUrl: imageUrl 
        });
      }

      res.json({
        success: true,
        document,
        message: 'Document uploaded successfully'
      });

    } catch (error: any) {
      console.error('Document upload error:', error);
      
      // Handle multer errors
      if (error.message && error.message.includes('File too large')) {
        return res.status(400).json({ message: 'File size exceeds 2MB limit' });
      }
      
      if (error.message && error.message.includes('Invalid file type')) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Failed to upload document' });
    }
  });

  // Get driver's documents
  app.get('/api/driver/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      let driverId: string;

      if (user.role === 'driver') {
        const driver = await storage.getDriverByUserId(userId);
        if (!driver) {
          return res.status(404).json({ message: 'Driver profile not found' });
        }
        driverId = driver.id;
      } else if (user.role === 'admin') {
        // Admin can view any driver's documents
        driverId = req.query.driverId as string;
        if (!driverId) {
          return res.status(400).json({ message: 'Driver ID required for admin' });
        }
      } else {
        return res.status(403).json({ message: 'Access denied' });
      }

      const documents = await storage.getDriverDocuments(driverId);
      
      // Generate presigned URLs for all documents
      const documentsWithUrls = await Promise.all(
        documents.map(async (doc) => ({
          ...doc,
          documentUrl: await getPresignedUrl(doc.documentUrl)
        }))
      );
      
      res.json(documentsWithUrls);

    } catch (error) {
      console.error('Get driver documents error:', error);
      res.status(500).json({ message: 'Failed to fetch documents' });
    }
  });

  // Download/view document (generate temporary URL or stream)
  app.get('/api/driver/documents/:id/download', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { id } = req.params;
      const document = await storage.getDriverDocument(id);

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Check authorization
      if (user.role === 'driver') {
        const driver = await storage.getDriverByUserId(userId);
        if (!driver || driver.id !== document.driverId) {
          return res.status(403).json({ message: 'Access denied' });
        }
      } else if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Download from object storage
      const objStorage = await getObjectStorage();
      const { ok, value, error } = await objStorage.downloadAsBytes(document.documentUrl);

      if (!ok) {
        return res.status(404).json({ message: `File not found: ${error}` });
      }

      // Convert from object storage format to Buffer
      let buffer: Buffer;
      if (Buffer.isBuffer(value)) {
        buffer = value;
      } else if (Array.isArray(value) && value.length > 0) {
        const byteArray = Object.values(value[0]);
        buffer = Buffer.from(byteArray);
      } else {
        throw new Error('Unexpected value format from object storage');
      }

      // Determine content type from file extension
      const extension = document.documentUrl.split('.').pop()?.toLowerCase();
      const contentTypeMap: Record<string, string> = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'heic': 'image/heic',
        'heif': 'image/heif'
      };

      const contentType = contentTypeMap[extension || ''] || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${document.documentType}.${extension}"`);
      res.send(buffer);

    } catch (error) {
      console.error('Document download error:', error);
      res.status(500).json({ message: 'Failed to download document' });
    }
  });

  // Public route to serve driver document files from object storage
  app.get('/driver-docs/:driverId/:filename', async (req, res) => {
    try {
      const { driverId, filename } = req.params;
      const filePath = `driver-docs/${driverId}/${filename}`;

      // Download from object storage
      const objStorage = await getObjectStorage();
      const { ok, value, error } = await objStorage.downloadAsBytes(filePath);

      if (!ok) {
        return res.status(404).json({ message: `File not found: ${error}` });
      }

      // Convert from object storage format to Buffer
      // Object storage returns an array with one element that is an array-like object with numeric keys
      let buffer: Buffer;
      
      if (Buffer.isBuffer(value)) {
        buffer = value;
      } else if (Array.isArray(value) && value.length > 0) {
        // value[0] is an object with numeric keys representing bytes
        // Convert it to an array then to a Buffer
        const byteArray = Object.values(value[0]);
        buffer = Buffer.from(byteArray);
      } else {
        throw new Error('Unexpected value format from object storage');
      }

      // Determine content type from file extension
      const extension = filename.split('.').pop()?.toLowerCase();
      const contentTypeMap: Record<string, string> = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'heic': 'image/heic',
        'heif': 'image/heif'
      };

      const contentType = contentTypeMap[extension || ''] || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.send(buffer);

    } catch (error) {
      console.error('Driver document file serving error:', error);
      res.status(500).json({ message: 'Failed to load file' });
    }
  });

  // Delete document
  app.delete('/api/driver/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { id } = req.params;
      const document = await storage.getDriverDocument(id);

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Check authorization
      if (user.role === 'driver') {
        const driver = await storage.getDriverByUserId(userId);
        if (!driver || driver.id !== document.driverId) {
          return res.status(403).json({ message: 'Access denied' });
        }
      } else if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Delete from object storage (extract key for backwards compatibility)
      const objStorage = await getObjectStorage();
      const storageKey = extractStorageKey(document.documentUrl);
      const { ok, error} = await objStorage.delete(storageKey);
      if (!ok) {
        console.error('Failed to delete from object storage:', error);
      }

      // Delete from database
      await storage.deleteDriverDocument(id);

      res.json({ success: true, message: 'Document deleted successfully' });

    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({ message: 'Failed to delete document' });
    }
  });

  // Admin: Backfill missing driver records for users with 'driver' role
  app.post('/api/admin/backfill-drivers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Get all users with 'driver' role
      const allUsers = await storage.getAllUsers();
      const driverUsers = allUsers.filter(u => u.role === 'driver');
      
      let created = 0;
      let existing = 0;

      for (const driverUser of driverUsers) {
        const existingDriver = await storage.getDriverByUserId(driverUser.id);
        if (!existingDriver) {
          await storage.createDriver({
            userId: driverUser.id,
          });
          created++;
        } else {
          existing++;
        }
      }

      res.json({ 
        success: true, 
        message: `Backfill complete: ${created} driver records created, ${existing} already existed`,
        created,
        existing,
        total: driverUsers.length
      });
    } catch (error) {
      console.error('Backfill drivers error:', error);
      res.status(500).json({ message: 'Failed to backfill driver records' });
    }
  });

  // Admin: Get all driver documents (with driver info)
  app.get('/api/admin/driver-documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Get all drivers
      const drivers = await storage.getAllUsers();
      const driverUsers = drivers.filter(u => u.role === 'driver');

      // Get documents for all drivers
      const allDocuments = [];
      for (const driverUser of driverUsers) {
        const driver = await storage.getDriverByUserId(driverUser.id);
        if (driver) {
          const docs = await storage.getDriverDocuments(driver.id);
          // Attach driver info to each document
          const docsWithDriver = docs.map(doc => ({
            ...doc,
            driverInfo: {
              userId: driverUser.id,
              firstName: driverUser.firstName,
              lastName: driverUser.lastName,
              email: driverUser.email,
            }
          }));
          allDocuments.push(...docsWithDriver);
        }
      }

      // Sort by upload date (newest first)
      allDocuments.sort((a, b) => {
        const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        return dateB - dateA;
      });

      res.json(allDocuments);
    } catch (error) {
      console.error('Get all driver documents error:', error);
      res.status(500).json({ message: 'Failed to fetch driver documents' });
    }
  });

  // Admin: Upload document on behalf of driver
  app.post('/api/admin/driver-documents/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { userId: driverUserId, documentType, expirationDate, vehiclePlate, whatsappNumber } = req.body;
      
      if (!driverUserId) {
        return res.status(400).json({ message: 'Driver user ID is required' });
      }

      // Get driver from user ID
      const driver = await storage.getDriverByUserId(driverUserId);
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      // Validate with Zod schema
      const docDataToValidate: any = {
        driverId: driver.id,
        documentType,
        documentUrl: 'temp', // Will be replaced after upload
        status: 'pending', // Explicitly set to pending
      };

      // Handle expiration date for documents that have one
      if (expirationDate && documentType !== 'vehicle_image') {
        // Convert date string to Date object for timestamp validation
        docDataToValidate.expirationDate = new Date(expirationDate);
      }

      // Handle vehicle plate for vehicle images
      if (vehiclePlate && documentType === 'vehicle_image') {
        docDataToValidate.vehiclePlate = vehiclePlate;
      }

      if (whatsappNumber) {
        docDataToValidate.whatsappNumber = whatsappNumber;
      }

      // Validate document data with schema
      const validationResult = insertDriverDocumentSchema.safeParse(docDataToValidate);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid document data', 
          errors: validationResult.error.errors 
        });
      }

      const file = req.file;
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `driver-docs/${driver.id}/${documentType}-${Date.now()}.${fileExtension}`;

      // Upload to Object Storage
      const objStorage = await getObjectStorage();
      const { ok, error } = await objStorage.uploadFromBytes(
        fileName,
        file.buffer
      );

      if (!ok) {
        console.error('Upload to Object Storage failed:', error);
        return res.status(500).json({ message: `Upload failed: ${error}` });
      }

      // Create validated document with actual URL
      const validatedData = validationResult.data;
      validatedData.documentUrl = fileName;

      const document = await storage.createDriverDocument(validatedData);

      res.json({
        success: true,
        document,
      });
    } catch (error) {
      console.error('Admin document upload error:', error);
      res.status(500).json({ message: 'Failed to upload document' });
    }
  });

  // Admin: Update document status (approve/reject)
  app.put('/api/admin/driver-documents/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { id } = req.params;
      const { status, rejectionReason } = req.body;

      // Validate status update with Zod schema
      const statusUpdateSchema = z.object({
        status: z.enum(['pending', 'approved', 'rejected']),
        rejectionReason: z.string().optional(),
      }).refine(
        (data) => data.status !== 'rejected' || (data.rejectionReason && data.rejectionReason.length > 0),
        {
          message: 'Rejection reason is required when rejecting a document',
          path: ['rejectionReason'],
        }
      );

      const validationResult = statusUpdateSchema.safeParse({ status, rejectionReason });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid status update data', 
          errors: validationResult.error.errors 
        });
      }

      const { status: validatedStatus, rejectionReason: validatedReason } = validationResult.data;

      const updatedDoc = await storage.updateDriverDocumentStatus(
        id,
        validatedStatus,
        validatedReason,
        userId
      );

      if (!updatedDoc) {
        return res.status(404).json({ message: 'Document not found' });
      }

      res.json(updatedDoc);

    } catch (error) {
      console.error('Update document status error:', error);
      res.status(500).json({ message: 'Failed to update document status' });
    }
  });

  // Payment Systems management (admin only)
  app.get('/api/payment-systems', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const systems = await storage.getPaymentSystems();
      
      // Sanitize sensitive fields - mask keys but indicate if they exist
      const sanitizedSystems = systems.map(system => ({
        ...system,
        publicKey: system.publicKey ? '••••••••' : null,
        secretKey: system.secretKey ? '••••••••' : null,
        webhookSecret: system.webhookSecret ? '••••••••' : null,
      }));
      
      res.json(sanitizedSystems);
    } catch (error) {
      console.error('Get payment systems error:', error);
      res.status(500).json({ message: 'Failed to fetch payment systems' });
    }
  });

  app.get('/api/payment-systems/active', async (req, res) => {
    try {
      const activeSystem = await storage.getActivePaymentSystem();
      if (!activeSystem) {
        return res.json(null);
      }
      
      // Return only non-sensitive data for public endpoint
      res.json({
        provider: activeSystem.provider,
        isActive: activeSystem.isActive,
      });
    } catch (error) {
      console.error('Get active payment system error:', error);
      res.status(500).json({ message: 'Failed to fetch active payment system' });
    }
  });

  app.post('/api/payment-systems', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const newSystem = await storage.createPaymentSystem(req.body);
      
      // Sanitize response - never return raw credentials
      const sanitizedSystem = {
        ...newSystem,
        publicKey: newSystem.publicKey ? '••••••••' : null,
        secretKey: newSystem.secretKey ? '••••••••' : null,
        webhookSecret: newSystem.webhookSecret ? '••••••••' : null,
      };
      
      res.json(sanitizedSystem);
    } catch (error: any) {
      console.error('Create payment system error:', error);
      if (error.code === '23505') {
        return res.status(409).json({ message: 'Payment system already exists' });
      }
      res.status(500).json({ message: 'Failed to create payment system' });
    }
  });

  app.put('/api/payment-systems/:provider', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const updatedSystem = await storage.updatePaymentSystem(req.params.provider, req.body);
      if (!updatedSystem) {
        return res.status(404).json({ message: 'Payment system not found' });
      }
      
      // Sanitize response - never return raw credentials
      const sanitizedSystem = {
        ...updatedSystem,
        publicKey: updatedSystem.publicKey ? '••••••••' : null,
        secretKey: updatedSystem.secretKey ? '••••••••' : null,
        webhookSecret: updatedSystem.webhookSecret ? '••••••••' : null,
      };
      
      res.json(sanitizedSystem);
    } catch (error) {
      console.error('Update payment system error:', error);
      res.status(500).json({ message: 'Failed to update payment system' });
    }
  });

  app.put('/api/payment-systems/:provider/activate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      await storage.setActivePaymentSystem(req.params.provider);
      res.json({ success: true });
    } catch (error) {
      console.error('Set active payment system error:', error);
      res.status(500).json({ message: 'Failed to set active payment system' });
    }
  });

  app.delete('/api/payment-systems/:provider', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      await storage.deletePaymentSystem(req.params.provider);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete payment system error:', error);
      res.status(500).json({ message: 'Failed to delete payment system' });
    }
  });

  // Pricing rules management (admin only)
  app.get('/api/admin/pricing-rules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const rules = await storage.getPricingRules();
      res.json(rules);
    } catch (error) {
      console.error('Get pricing rules error:', error);
      res.status(500).json({ message: 'Failed to fetch pricing rules' });
    }
  });

  app.get('/api/admin/pricing-rules/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const rule = await storage.getPricingRule(req.params.id);
      if (!rule) {
        return res.status(404).json({ message: 'Pricing rule not found' });
      }
      res.json(rule);
    } catch (error) {
      console.error('Get pricing rule error:', error);
      res.status(500).json({ message: 'Failed to fetch pricing rule' });
    }
  });

  app.post('/api/admin/pricing-rules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const validatedData = insertPricingRuleSchema.parse(req.body);
      const newRule = await storage.createPricingRule(validatedData);
      res.json(newRule);
    } catch (error: any) {
      console.error('Create pricing rule error:', error);
      
      // Handle unique constraint violation (duplicate vehicle type + service type combination)
      if (error.code === '23505' || error.message?.includes('unique')) {
        return res.status(409).json({ 
          message: `A pricing rule already exists for ${req.body.vehicleType} with ${req.body.serviceType} service type` 
        });
      }
      
      res.status(400).json({ message: error.message || 'Failed to create pricing rule' });
    }
  });

  app.put('/api/admin/pricing-rules/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // For updates, validate the complete rule if serviceType is being changed
      // Otherwise just pass the partial update
      if (req.body.serviceType || req.body.baseRate || req.body.perMileRate || req.body.hourlyRate || req.body.minimumHours) {
        // Get existing rule to merge with updates
        const existingRule = await storage.getPricingRule(req.params.id);
        if (!existingRule) {
          return res.status(404).json({ message: 'Pricing rule not found' });
        }
        
        // Merge existing with updates and validate
        const mergedData = { ...existingRule, ...req.body };
        const validatedData = insertPricingRuleSchema.parse(mergedData);
        const updatedRule = await storage.updatePricingRule(req.params.id, req.body);
        res.json(updatedRule);
      } else {
        // Simple update (e.g., just isActive flag)
        const updatedRule = await storage.updatePricingRule(req.params.id, req.body);
        if (!updatedRule) {
          return res.status(404).json({ message: 'Pricing rule not found' });
        }
        res.json(updatedRule);
      }
    } catch (error: any) {
      console.error('Update pricing rule error:', error);
      res.status(400).json({ message: error.message || 'Failed to update pricing rule' });
    }
  });

  app.delete('/api/admin/pricing-rules/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      await storage.deletePricingRule(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete pricing rule error:', error);
      res.status(500).json({ message: 'Failed to delete pricing rule' });
    }
  });

  // Public endpoint to get available pricing rules (for booking form)
  app.get('/api/pricing-rules/available', async (req, res) => {
    try {
      const { serviceType } = req.query;
      
      if (!serviceType || (serviceType !== 'transfer' && serviceType !== 'hourly')) {
        return res.status(400).json({ message: 'Valid serviceType (transfer or hourly) is required' });
      }

      const allRules = await storage.getPricingRules();
      
      // Filter for active rules matching the service type
      const availableRules = allRules.filter(rule => 
        rule.isActive && 
        rule.serviceType === serviceType &&
        (!rule.effectiveStart || new Date(rule.effectiveStart) <= new Date()) &&
        (!rule.effectiveEnd || new Date(rule.effectiveEnd) >= new Date())
      );

      // Map rules to vehicle types with pricing info
      const pricingByVehicle = availableRules.reduce((acc, rule) => {
        acc[rule.vehicleType] = {
          vehicleType: rule.vehicleType,
          serviceType: rule.serviceType,
          baseRate: rule.baseRate,
          perMileRate: rule.perMileRate,
          hourlyRate: rule.hourlyRate,
          minimumHours: rule.minimumHours,
          minimumFare: rule.minimumFare,
          gratuityPercent: rule.gratuityPercent,
          distanceTiers: rule.distanceTiers,
          hasDistanceTiers: rule.distanceTiers && rule.distanceTiers.length > 0
        };
        return acc;
      }, {} as Record<string, any>);

      res.json(pricingByVehicle);
    } catch (error) {
      console.error('Get available pricing rules error:', error);
      res.status(500).json({ message: 'Failed to fetch pricing rules' });
    }
  });

  // Calculate price based on admin pricing rules
  app.post('/api/calculate-price', async (req, res) => {
    try {
      const { vehicleType, serviceType, distance, hours, date, time, airportCode, userId } = req.body;

      if (!vehicleType || !serviceType) {
        return res.status(400).json({ message: 'vehicleType and serviceType are required' });
      }

      // Get pricing rule for this vehicle type and service type
      const allRules = await storage.getPricingRules();
      const rule = allRules.find(r => 
        r.vehicleType === vehicleType && 
        r.serviceType === serviceType &&
        r.isActive &&
        (!r.effectiveStart || new Date(r.effectiveStart) <= new Date()) &&
        (!r.effectiveEnd || new Date(r.effectiveEnd) >= new Date())
      );

      if (!rule) {
        return res.status(404).json({ message: 'No active pricing rule found for this vehicle and service type' });
      }

      let basePrice = 0;
      let breakdown: any = {
        baseFare: 0,
        distanceFare: 0,
        timeFare: 0,
        gratuity: 0,
        airportFee: 0,
        meetAndGreetFee: 0,
        surgeMultiplier: 1,
        subtotal: 0,
        total: 0
      };

      if (serviceType === 'transfer') {
        // Transfer pricing calculation
        if (!distance) {
          return res.status(400).json({ message: 'distance is required for transfer service' });
        }

        const distanceInMiles = parseFloat(distance);
        
        // Base rate
        basePrice = parseFloat(rule.baseRate || '0');
        breakdown.baseFare = basePrice;

        // Calculate distance fare
        if (rule.distanceTiers && rule.distanceTiers.length > 0) {
          // Progressive distance pricing
          let remainingDistance = distanceInMiles;
          let distanceCost = 0;

          for (const tier of rule.distanceTiers) {
            if (tier.isRemaining) {
              // All remaining miles
              distanceCost += remainingDistance * parseFloat(String(tier.ratePerMile));
              break;
            } else {
              const tierMiles = parseFloat(String(tier.miles));
              const tilesUsed = Math.min(remainingDistance, tierMiles);
              distanceCost += tilesUsed * parseFloat(String(tier.ratePerMile));
              remainingDistance -= tilesUsed;
              
              if (remainingDistance <= 0) break;
            }
          }

          breakdown.distanceFare = distanceCost;
        } else if (rule.perMileRate) {
          // Simple per-mile calculation
          breakdown.distanceFare = distanceInMiles * parseFloat(rule.perMileRate);
        }

        // Calculate subtotal before fees
        breakdown.subtotal = breakdown.baseFare + breakdown.distanceFare;

        // Apply minimum fare if set
        if (rule.minimumFare) {
          const minFare = parseFloat(rule.minimumFare);
          if (breakdown.subtotal < minFare) {
            breakdown.subtotal = minFare;
          }
        }

      } else if (serviceType === 'hourly') {
        // Hourly pricing calculation
        if (!hours) {
          return res.status(400).json({ message: 'hours is required for hourly service' });
        }

        const requestedHours = parseInt(hours);
        const hourlyRate = parseFloat(rule.hourlyRate || '0');
        const minimumHours = parseInt(String(rule.minimumHours || '0'));

        const billedHours = Math.max(requestedHours, minimumHours);
        breakdown.timeFare = billedHours * hourlyRate;
        breakdown.subtotal = breakdown.timeFare;
      }

      // Check for surge pricing if date and time provided
      // IMPORTANT: Apply surge pricing to base fare ONLY, before adding gratuity/airport fees
      breakdown.surgeAmount = 0;
      if (date && time && rule.surgePricing && rule.surgePricing.length > 0) {
        const requestDate = new Date(`${date}T${time}`);
        const dayOfWeek = requestDate.getDay();
        const timeStr = time; // HH:MM format

        for (const surge of rule.surgePricing) {
          // Check if surge applies: either specific day matches OR surge is for "All Days" (-1)
          const dayMatches = surge.dayOfWeek === dayOfWeek || surge.dayOfWeek === -1;
          const timeMatches = timeStr >= surge.startTime && timeStr <= surge.endTime;
          
          if (dayMatches && timeMatches) {
            breakdown.surgeMultiplier = parseFloat(String(surge.multiplier));
            // Calculate surge amount: (multiplier - 1) * base fare
            // Example: 1.5x multiplier on $100 base = 0.5 * $100 = $50 surge fee
            breakdown.surgeAmount = (breakdown.surgeMultiplier - 1) * breakdown.subtotal;
            break;
          }
        }
      }

      // Apply gratuity as percentage of base fare (before surge)
      if (rule.gratuityPercent) {
        const gratuityPercent = parseFloat(rule.gratuityPercent);
        breakdown.gratuity = breakdown.subtotal * (gratuityPercent / 100);
      }

      // Apply airport fee if applicable
      if (airportCode && rule.airportFees) {
        const airportFeeEntry = rule.airportFees.find((fee: any) => 
          fee.airportCode.toUpperCase() === airportCode.toUpperCase()
        );
        if (airportFeeEntry) {
          breakdown.airportFee = parseFloat(String(airportFeeEntry.fee));
        }
      }

      // Apply meet & greet fee if enabled
      if (rule.meetAndGreet && rule.meetAndGreet.enabled) {
        breakdown.meetAndGreetFee = parseFloat(String(rule.meetAndGreet.charge || 0));
      }

      // Calculate final total before discount
      // Order: Base Fare + Surge Amount + Gratuity + Airport Fee + Meet & Greet
      breakdown.total = breakdown.subtotal + breakdown.surgeAmount + breakdown.gratuity + breakdown.airportFee + breakdown.meetAndGreetFee;

      // Apply passenger discount if userId provided
      let discountAmount = 0;
      let discountType = null;
      let discountValue = null;
      
      if (userId) {
        const user = await storage.getUser(userId);
        if (user && user.discountValue && parseFloat(user.discountValue) > 0) {
          discountType = user.discountType;
          discountValue = parseFloat(user.discountValue);
          
          if (discountType === 'percentage') {
            discountAmount = breakdown.total * (discountValue / 100);
          } else if (discountType === 'fixed') {
            discountAmount = discountValue;
          }
          
          // Ensure total doesn't go below zero
          discountAmount = Math.min(discountAmount, breakdown.total);
        }
      }
      
      breakdown.discount = discountAmount;
      breakdown.finalTotal = breakdown.total - discountAmount;

      res.json({
        vehicleType,
        serviceType,
        price: breakdown.finalTotal.toFixed(2),
        regularPrice: breakdown.total.toFixed(2), // Price before discount
        discountPercentage: discountType === 'percentage' ? discountValue : 0,
        discountAmount: discountAmount.toFixed(2),
        finalPrice: breakdown.finalTotal.toFixed(2), // Price after discount
        // Detailed breakdown fields for database storage
        baseFare: breakdown.subtotal.toFixed(2),
        gratuityAmount: breakdown.gratuity.toFixed(2),
        airportFeeAmount: breakdown.airportFee.toFixed(2),
        surgePricingMultiplier: breakdown.surgeMultiplier,
        surgePricingAmount: breakdown.surgeAmount.toFixed(2),
        breakdown,
        ruleId: rule.id,
        discount: discountAmount > 0 ? {
          type: discountType,
          value: discountValue,
          amount: discountAmount
        } : null
      });

    } catch (error) {
      console.error('Calculate price error:', error);
      res.status(500).json({ message: 'Failed to calculate price' });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", isAuthenticated, async (req: any, res) => {
    try {
      const { amount, bookingId } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          bookingId: bookingId || '',
          userId: req.user.id,
        },
      });

      // Update booking with payment intent if bookingId provided
      if (bookingId) {
        await storage.updateBookingPayment(bookingId, paymentIntent.id, 'pending');
      }

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Payment intent error:', error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Payment methods management
  app.get('/api/payment-methods', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // If user doesn't have a Stripe customer ID, return empty array
      if (!user.stripeCustomerId) {
        return res.json({ paymentMethods: [], defaultPaymentMethodId: null });
      }

      // Retrieve payment methods and customer details from Stripe
      const [paymentMethods, customer] = await Promise.all([
        stripe.paymentMethods.list({
          customer: user.stripeCustomerId,
          type: 'card',
        }),
        stripe.customers.retrieve(user.stripeCustomerId),
      ]);

      const defaultPaymentMethodId = (customer as any).invoice_settings?.default_payment_method || null;

      res.json({
        paymentMethods: paymentMethods.data,
        defaultPaymentMethodId,
      });
    } catch (error: any) {
      console.error('Get payment methods error:', error);
      res.status(500).json({ message: 'Failed to fetch payment methods' });
    }
  });

  app.post('/api/payment-methods', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { paymentMethodId } = req.body;
      
      if (!paymentMethodId) {
        return res.status(400).json({ message: 'Payment method ID is required' });
      }

      let user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Create Stripe customer if doesn't exist
      if (!user.stripeCustomerId) {
        const customerParams: Stripe.CustomerCreateParams = {
          email: user.email || undefined,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || undefined,
          metadata: {
            userId: userId,
          },
        };
        const customer = await stripe.customers.create(customerParams);

        // Update user with Stripe customer ID
        await storage.updateStripeCustomerId(userId, customer.id);
        user = await storage.getUser(userId);
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: user!.stripeCustomerId!,
      });

      // Set as default payment method
      await stripe.customers.update(user!.stripeCustomerId!, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      res.json(paymentMethod);
    } catch (error: any) {
      console.error('Add payment method error:', error);
      res.status(500).json({ message: error.message || 'Failed to add payment method' });
    }
  });

  app.delete('/api/payment-methods/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Detach payment method from customer
      await stripe.paymentMethods.detach(id);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Remove payment method error:', error);
      res.status(500).json({ message: error.message || 'Failed to remove payment method' });
    }
  });

  app.patch('/api/payment-methods/:id/default', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({ message: 'User not found or no Stripe customer ID' });
      }

      // Set as default payment method
      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: id,
        },
      });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Set default payment method error:', error);
      res.status(500).json({ message: error.message || 'Failed to set default payment method' });
    }
  });


  // n8n-style pricing calculation endpoint (uses admin-configured pricing rules)
  app.post('/api/booking/pricing', async (req, res) => {
    try {
      const bookingData = req.body;
      
      if (!bookingData.service_type) {
        return res.status(400).json({ error: 'Missing service_type' });
      }

      // Get vehicle types for metadata (passengers, luggage, names)
      const vehicleTypes = await storage.getVehicleTypes();
      
      // Get all active pricing rules
      const pricingRules = await storage.getPricingRules();
      const activePricingRules = pricingRules.filter(rule => rule.isActive);
      
      if (bookingData.service_type === 'hourly') {
        // Hourly pricing calculation using pricing_rules
        const requestedDuration = parseInt(bookingData.duration) || 2;
        
        const vehicles = vehicleTypes.map(vehicle => {
          // Map vehicle name to enum type
          const vehicleTypeEnum = vehicle.name.toLowerCase().replace(/[\s-]/g, '_');
          
          // Find matching pricing rule
          const pricingRule = activePricingRules.find(
            rule => rule.vehicleType === vehicleTypeEnum && rule.serviceType === 'hourly'
          );
          
          if (!pricingRule || !pricingRule.hourlyRate || !pricingRule.minimumHours) {
            console.warn(`No pricing rule found for ${vehicleTypeEnum} hourly service`);
            return null;
          }
          
          const actualDuration = Math.max(requestedDuration, pricingRule.minimumHours);
          const hourlyRate = parseFloat(pricingRule.hourlyRate);
          let totalPrice = actualDuration * hourlyRate;
          
          // Apply minimum fare if set
          if (pricingRule.minimumFare) {
            totalPrice = Math.max(totalPrice, parseFloat(pricingRule.minimumFare));
          }
          
          return {
            type: vehicleTypeEnum,
            name: vehicle.name,
            price: '$' + totalPrice.toFixed(2),
            hourly_rate: hourlyRate,
            passengers: vehicle.passengerCapacity,
            luggage: vehicle.luggageCapacity,
            category: 'Hourly service',
            duration: actualDuration,
            minimum_hours: pricingRule.minimumHours
          };
        }).filter(v => v !== null);

        if (vehicles.length === 0) {
          return res.status(500).json({ error: 'No pricing rules configured for hourly service' });
        }

        return res.json({
          success: true,
          data: {
            service_type: 'hourly',
            pickup_address: bookingData.pickup_address || 'Not specified',
            requested_duration: requestedDuration,
            datetime: bookingData.datetime || new Date().toISOString(),
            vehicles: vehicles,
            minimum_price: Math.min(...vehicles.map(v => parseFloat(v.price.replace('$', '')))),
            booking_id: 'HOU_H' + Math.random().toString(36).substr(2, 9).toUpperCase()
          }
        });
      } else if (bookingData.service_type === 'transfer') {
        // Transfer pricing with distance calculation using pricing_rules
        if (!bookingData.from || !bookingData.to) {
          return res.status(400).json({ error: 'Missing from and/or to addresses for transfer' });
        }

        // Calculate real distance using TomTom API
        let estimatedDistance = 15; // Default fallback distance in miles
        let routeCalculationError = false;
        
        try {
          // Geocode addresses to coordinates
          const fromCoords = await geocodeAddress(bookingData.from, storage);
          const toCoords = await geocodeAddress(bookingData.to, storage);
          
          if (fromCoords && toCoords) {
            // Calculate driving distance using TomTom routing API
            const routeData = await calculateRoute(fromCoords, toCoords, storage);
            if (routeData && routeData.routes && routeData.routes.length > 0) {
              // Convert meters to miles
              estimatedDistance = (routeData.routes[0].summary.lengthInMeters * 0.000621371);
            }
          }
        } catch (error) {
          console.error('TomTom distance calculation error:', error);
          routeCalculationError = true;
        }
        
        const vehicles = vehicleTypes.map(vehicle => {
          // Map vehicle name to enum type
          const vehicleTypeEnum = vehicle.name.toLowerCase().replace(/[\s-]/g, '_');
          
          // Find matching pricing rule
          const pricingRule = activePricingRules.find(
            rule => rule.vehicleType === vehicleTypeEnum && rule.serviceType === 'transfer'
          );
          
          if (!pricingRule || !pricingRule.baseRate || !pricingRule.perMileRate) {
            console.warn(`No pricing rule found for ${vehicleTypeEnum} transfer service`);
            return null;
          }
          
          const baseRate = parseFloat(pricingRule.baseRate);
          const perMileRate = parseFloat(pricingRule.perMileRate);
          const distanceCharge = estimatedDistance * perMileRate;
          let totalPrice = baseRate + distanceCharge;
          
          // Apply minimum fare if set
          if (pricingRule.minimumFare) {
            totalPrice = Math.max(totalPrice, parseFloat(pricingRule.minimumFare));
          }
          
          return {
            type: vehicleTypeEnum,
            name: vehicle.name,
            price: '$' + totalPrice.toFixed(2),
            base_rate: baseRate,
            per_mile_rate: perMileRate,
            passengers: vehicle.passengerCapacity,
            luggage: vehicle.luggageCapacity,
            category: 'Transfer',
            distance: estimatedDistance,
            minimum_fare: pricingRule.minimumFare ? parseFloat(pricingRule.minimumFare) : 0
          };
        }).filter(v => v !== null);

        if (vehicles.length === 0) {
          return res.status(500).json({ error: 'No pricing rules configured for transfer service' });
        }

        return res.json({
          success: true,
          data: {
            service_type: 'transfer',
            from_address: bookingData.from,
            to_address: bookingData.to,
            distance_miles: estimatedDistance,
            datetime: bookingData.datetime || new Date().toISOString(),
            vehicles: vehicles,
            minimum_price: Math.min(...vehicles.map(v => parseFloat(v.price.replace('$', '')))),
            booking_id: 'HOU_T' + Math.random().toString(36).substr(2, 9).toUpperCase()
          }
        });
      }

      return res.status(400).json({ error: 'Invalid service_type. Must be "hourly" or "transfer"' });
    } catch (error) {
      console.error('Pricing calculation error:', error);
      res.status(500).json({ error: 'Pricing calculation failed' });
    }
  });

  // Driver rating endpoints
  app.post('/api/ratings', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Validate request body
      const { bookingId, rating, comment } = req.body;
      
      if (!bookingId || typeof bookingId !== 'string') {
        return res.status(400).json({ error: 'Valid bookingId is required' });
      }
      
      if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
      }
      
      if (comment && typeof comment !== 'string') {
        return res.status(400).json({ error: 'Comment must be a string' });
      }
      
      // Validate that the user is the passenger of the booking
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      
      if (booking.passengerId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to rate this booking' });
      }
      
      if (booking.status !== 'completed') {
        return res.status(400).json({ error: 'Can only rate completed bookings' });
      }
      
      if (!booking.driverId) {
        return res.status(400).json({ error: 'Booking has no assigned driver' });
      }
      
      // Check if already rated
      const existingRating = await storage.getBookingRating(bookingId);
      if (existingRating) {
        return res.status(400).json({ error: 'Booking already rated' });
      }

      // Use driverId from booking, not from client
      const newRating = await storage.createDriverRating({
        bookingId,
        driverId: booking.driverId, // Derive from booking, not client
        passengerId: req.user.id,
        rating,
        comment: comment || undefined,
      });

      res.json(newRating);
    } catch (error) {
      console.error('Create rating error:', error);
      res.status(500).json({ error: 'Failed to create rating' });
    }
  });

  app.get('/api/drivers/:driverId/ratings', async (req, res) => {
    try {
      const { driverId } = req.params;
      const ratings = await storage.getDriverRatings(driverId);
      res.json(ratings);
    } catch (error) {
      console.error('Get ratings error:', error);
      res.status(500).json({ error: 'Failed to get ratings' });
    }
  });

  app.get('/api/drivers/:driverId/average-rating', async (req, res) => {
    try {
      const { driverId } = req.params;
      const avgRating = await storage.getDriverAverageRating(driverId);
      res.json({ averageRating: avgRating });
    } catch (error) {
      console.error('Get average rating error:', error);
      res.status(500).json({ error: 'Failed to get average rating' });
    }
  });

  app.get('/api/bookings/:bookingId/rating', async (req, res) => {
    try {
      const { bookingId } = req.params;
      const rating = await storage.getBookingRating(bookingId);
      if (!rating) {
        return res.status(404).json({ error: 'Rating not found' });
      }
      res.json(rating);
    } catch (error) {
      console.error('Get booking rating error:', error);
      res.status(500).json({ error: 'Failed to get booking rating' });
    }
  });

  // GPS Tracking Endpoints
  app.post('/api/drivers/:id/location', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { latitude, longitude } = req.body;

      // Validate that user is either the driver or an admin
      if (req.user.id !== id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to update this driver location' });
      }

      // Validate coordinates
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: 'Invalid coordinates' });
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ error: 'Coordinates out of range' });
      }

      // Update location
      await storage.updateUserLocation(id, latitude, longitude);

      res.json({ success: true, message: 'Location updated successfully' });
    } catch (error) {
      console.error('Update driver location error:', error);
      res.status(500).json({ error: 'Failed to update location' });
    }
  });

  app.get('/api/drivers/locations', isAuthenticated, async (req: any, res) => {
    try {
      // Only allow admin, dispatcher, or driver roles
      if (!['admin', 'dispatcher', 'driver'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Not authorized to view driver locations' });
      }

      const locations = await storage.getDriverLocations();
      res.json(locations);
    } catch (error) {
      console.error('Get driver locations error:', error);
      res.status(500).json({ error: 'Failed to get driver locations' });
    }
  });

  // SMTP Settings Management
  app.get('/api/admin/smtp-settings', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const [host, port, secure, user, fromEmail, fromName] = await Promise.all([
        storage.getSystemSetting('SMTP_HOST'),
        storage.getSystemSetting('SMTP_PORT'),
        storage.getSystemSetting('SMTP_SECURE'),
        storage.getSystemSetting('SMTP_USER'),
        storage.getSystemSetting('SMTP_FROM_EMAIL'),
        storage.getSystemSetting('SMTP_FROM_NAME'),
      ]);

      res.json({
        host: host?.value || '',
        port: port?.value || '587',
        secure: secure?.value === 'true',
        user: user?.value || '',
        hasPassword: !!(await storage.getSystemSetting('SMTP_PASSWORD'))?.value,
        fromEmail: fromEmail?.value || '',
        fromName: fromName?.value || 'USA Luxury Limo',
      });
    } catch (error) {
      console.error('Get SMTP settings error:', error);
      res.status(500).json({ error: 'Failed to get SMTP settings' });
    }
  });

  app.post('/api/admin/smtp-settings', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { host, port, secure, user, password, fromEmail, fromName } = req.body;

      const settingsToUpdate = [
        { key: 'SMTP_HOST', value: host },
        { key: 'SMTP_PORT', value: port?.toString() || '587' },
        { key: 'SMTP_SECURE', value: secure ? 'true' : 'false' },
        { key: 'SMTP_USER', value: user },
        { key: 'SMTP_FROM_EMAIL', value: fromEmail },
        { key: 'SMTP_FROM_NAME', value: fromName || 'USA Luxury Limo' },
      ];

      // Only update password if provided
      if (password) {
        settingsToUpdate.push({ key: 'SMTP_PASSWORD', value: password });
      }

      await Promise.all(
        settingsToUpdate.map(setting => storage.updateSystemSetting(setting.key, setting.value, req.user.id))
      );

      // Clear email cache to force recreation with new settings
      clearEmailCache();

      res.json({ success: true, message: 'SMTP settings updated successfully' });
    } catch (error) {
      console.error('Update SMTP settings error:', error);
      res.status(500).json({ error: 'Failed to update SMTP settings' });
    }
  });

  app.post('/api/admin/smtp-test', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { testEmail } = req.body;

      if (!testEmail) {
        return res.status(400).json({ error: 'Test email address is required' });
      }

      // Test connection first
      const connectionTest = await testSMTPConnection();
      
      if (!connectionTest.success) {
        return res.status(400).json({ 
          success: false, 
          message: connectionTest.message 
        });
      }

      // Send test email
      const emailSent = await sendEmail({
        to: testEmail,
        subject: 'USA Luxury Limo - SMTP Test Email',
        html: getTestEmailHTML(),
      });

      if (emailSent) {
        res.json({ 
          success: true, 
          message: `Test email sent successfully to ${testEmail}. Please check your inbox.` 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Failed to send test email. Please check your SMTP settings and try again.' 
        });
      }
    } catch (error) {
      console.error('SMTP test error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'SMTP test failed. Please check your settings.' 
      });
    }
  });

  // Test MinIO connection
  app.post('/api/admin/minio/test', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { endpoint, accessKey, secretKey, bucket } = req.body;

      // Validate required fields
      if (!endpoint || !accessKey || !secretKey) {
        return res.status(400).json({ 
          success: false, 
          message: 'MinIO endpoint, access key, and secret key are required' 
        });
      }

      const bucketName = bucket || 'usa-luxury-limo';

      try {
        // Create S3 client with provided credentials
        const testClient = new S3Client({
          endpoint: endpoint,
          region: 'us-east-1',
          credentials: {
            accessKeyId: accessKey,
            secretAccessKey: secretKey,
          },
          forcePathStyle: true, // Required for MinIO
        });

        // Test 1: Try to list buckets (validates endpoint and credentials)
        try {
          await testClient.send(new ListBucketsCommand({}));
        } catch (listError: any) {
          console.error('MinIO list buckets error:', listError);
          return res.status(400).json({
            success: false,
            message: `Failed to connect to MinIO endpoint. Error: ${listError.message || 'Invalid credentials or endpoint'}`,
            details: listError.message
          });
        }

        // Test 2: Try to head the bucket (validates bucket exists and is accessible)
        try {
          await testClient.send(new HeadBucketCommand({ Bucket: bucketName }));
          
          return res.json({
            success: true,
            message: `Successfully connected to MinIO! Endpoint is reachable, credentials are valid, and bucket "${bucketName}" is accessible.`,
            bucketExists: true
          });
        } catch (bucketError: any) {
          // Bucket doesn't exist or we don't have access
          if (bucketError.name === 'NotFound' || bucketError.$metadata?.httpStatusCode === 404) {
            return res.json({
              success: true,
              message: `Connection successful! Credentials are valid, but bucket "${bucketName}" does not exist. It will be created automatically when needed.`,
              bucketExists: false,
              warning: `Bucket "${bucketName}" not found`
            });
          } else {
            return res.status(400).json({
              success: false,
              message: `Credentials are valid, but cannot access bucket "${bucketName}". Error: ${bucketError.message}`,
              details: bucketError.message
            });
          }
        }
      } catch (error: any) {
        console.error('MinIO connection test error:', error);
        return res.status(500).json({
          success: false,
          message: `MinIO connection test failed: ${error.message || 'Unknown error'}`,
          details: error.message
        });
      }
    } catch (error: any) {
      console.error('MinIO test endpoint error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test MinIO connection. Please try again.',
        details: error.message
      });
    }
  });

  // Browse MinIO objects
  app.get('/api/admin/minio/browse', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const prefix = req.query.prefix as string | undefined;
      const folder = req.query.folder as string | undefined;

      // Determine the actual prefix to use
      let searchPrefix = prefix || '';
      if (folder) {
        searchPrefix = folder;
      }

      try {
        const adapter = await getObjectStorage();
        const result = await adapter.listWithMetadata(searchPrefix);

        if (!result.ok) {
          return res.status(500).json({
            success: false,
            message: 'Failed to list objects from storage',
            error: result.error
          });
        }

        // Organize objects by folder
        const folders = new Set<string>();
        const files = result.objects?.map(obj => {
          // Skip objects with invalid/missing keys
          if (!obj.key) {
            return null;
          }

          // Extract folder from key
          const parts = obj.key.split('/');
          if (parts.length > 1) {
            folders.add(parts[0]);
          }

          return {
            key: obj.key,
            name: parts[parts.length - 1],
            folder: parts.length > 1 ? parts.slice(0, -1).join('/') : '',
            size: obj.size,
            lastModified: obj.lastModified,
            url: obj.url,
            isImage: /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(obj.key)
          };
        }).filter(Boolean) || [];

        res.json({
          success: true,
          files,
          folders: Array.from(folders),
          totalFiles: files.length
        });
      } catch (error: any) {
        console.error('MinIO browse error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to browse MinIO storage',
          error: error.message
        });
      }
    } catch (error: any) {
      console.error('MinIO browse endpoint error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to browse MinIO storage',
        error: error.message
      });
    }
  });

  // Upload file to MinIO
  app.post('/api/admin/minio/upload', isAuthenticated, requireAdmin, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { folder = 'cms/general' } = req.body;
      
      // Sanitize folder input to prevent path traversal
      const sanitizedFolder = folder
        .replace(/\.\./g, '') // Remove ..
        .replace(/^\/+/, '') // Remove leading slashes
        .replace(/\/+$/, ''); // Remove trailing slashes
      
      // Ensure folder ends with slash for proper path construction
      const folderPath = sanitizedFolder ? `${sanitizedFolder}/` : '';
      
      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = req.file.originalname.split('.').pop();
      const fileName = `upload-${timestamp}.${fileExtension}`;
      const filePath = `${folderPath}${fileName}`;

      // Determine content type from file extension
      const extension = fileExtension?.toLowerCase();
      const contentTypeMap: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'heic': 'image/heic',
      };
      const contentType = contentTypeMap[extension || ''] || 'application/octet-stream';

      // Upload to Object Storage using configured adapter (MinIO or Replit)
      const objStorage = await getObjectStorage();
      const { ok, error } = await objStorage.uploadFromBytes(filePath, req.file.buffer, { contentType });
      
      if (!ok) {
        console.error('Upload to Object Storage failed:', error);
        return res.status(500).json({ message: `Upload failed: ${error}` });
      }

      // Get download URL
      const { ok: urlOk, url, error: urlError } = await objStorage.getDownloadUrl(filePath);
      
      if (!urlOk) {
        console.error('Failed to get download URL:', urlError);
      }

      // Return file metadata in same format as browse endpoint
      const parts = filePath.split('/');
      const folderName = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
      
      res.json({
        success: true,
        file: {
          key: filePath,
          name: fileName,
          folder: folderName,
          size: req.file.size,
          lastModified: new Date(),
          url: url || filePath,
          isImage: /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(filePath)
        }
      });
    } catch (error: any) {
      console.error('MinIO upload error:', error);
      res.status(500).json({ message: 'Failed to upload file', error: error.message });
    }
  });

  // Delete file from MinIO
  app.delete('/api/admin/minio/file', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { key } = req.body;
      
      if (!key) {
        return res.status(400).json({ message: 'File key is required' });
      }

      // Sanitize key to prevent path traversal
      const sanitizedKey = key
        .replace(/\.\./g, '') // Remove ..
        .replace(/^\/+/, ''); // Remove leading slashes

      if (!sanitizedKey) {
        return res.status(400).json({ message: 'Invalid file key' });
      }

      // Delete from Object Storage
      const objStorage = await getObjectStorage();
      const { ok, error } = await objStorage.delete(sanitizedKey);
      
      if (!ok) {
        console.error('Delete from Object Storage failed:', error);
        return res.status(500).json({ message: `Delete failed: ${error}` });
      }

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error: any) {
      console.error('MinIO delete error:', error);
      res.status(500).json({ message: 'Failed to delete file', error: error.message });
    }
  });

  // Get Twilio SMS connection status
  app.get('/api/admin/sms/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const status = await getTwilioConnectionStatus();
      
      // Get enabled status from system settings
      const enabledSetting = await storage.getSetting('TWILIO_ENABLED');
      const enabled = enabledSetting?.value === 'true';
      
      // Check if auth token exists in database (don't return the actual value for security)
      const authTokenSetting = await storage.getSetting('TWILIO_AUTH_TOKEN');
      const hasAuthToken = !!authTokenSetting?.value;
      
      res.json({ ...status, enabled, hasAuthToken });
    } catch (error) {
      console.error('SMS status check error:', error);
      res.status(500).json({ 
        connected: false,
        enabled: false,
        hasAuthToken: false,
        error: 'Failed to check SMS connection status' 
      });
    }
  });

  // Save Twilio credentials
  app.post('/api/admin/sms/credentials', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { accountSid, authToken, phoneNumber, enabled } = req.body;

      // Account SID and Phone Number are always required
      if (!accountSid || !phoneNumber) {
        return res.status(400).json({ message: 'Account SID and Phone Number are required' });
      }

      // Save credentials to system settings
      await storage.setSetting('TWILIO_ACCOUNT_SID', accountSid, userId);
      await storage.setSetting('TWILIO_PHONE_NUMBER', phoneNumber, userId);
      
      // Only update authToken if provided (allows updating other fields without re-entering token)
      if (authToken) {
        await storage.setSetting('TWILIO_AUTH_TOKEN', authToken, userId);
      }
      
      await storage.setSetting('TWILIO_ENABLED', enabled ? 'true' : 'false', userId);

      res.json({ success: true, message: 'Twilio credentials saved successfully' });
    } catch (error) {
      console.error('Save credentials error:', error);
      res.status(500).json({ message: 'Failed to save Twilio credentials' });
    }
  });

  // Toggle Twilio enabled/disabled
  app.post('/api/admin/sms/toggle', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { enabled } = req.body;

      await storage.setSetting('TWILIO_ENABLED', enabled ? 'true' : 'false', userId);

      res.json({ success: true, enabled });
    } catch (error) {
      console.error('Toggle SMS error:', error);
      res.status(500).json({ message: 'Failed to toggle SMS status' });
    }
  });

  // Send test SMS
  app.post('/api/admin/sms/test', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required' });
      }

      const result = await sendTestSMS(phoneNumber);

      if (result.success) {
        res.json({ 
          success: true, 
          message: `Test SMS sent successfully to ${phoneNumber}`,
          messageId: result.messageId
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: result.error || 'Failed to send test SMS' 
        });
      }
    } catch (error) {
      console.error('SMS test error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'SMS test failed. Please check your Twilio configuration.' 
      });
    }
  });

  // ========================================
  // Frontend Pages API Routes
  // ========================================

  // Get a specific frontend page by slug (public)
  app.get('/api/frontend-pages/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const page = await storage.getFrontendPageBySlug(slug);
      
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }
      
      res.json(page);
    } catch (error) {
      console.error('Get frontend page error:', error);
      res.status(500).json({ message: 'Failed to fetch page' });
    }
  });

  // Get all frontend pages (admin only)
  app.get('/api/admin/frontend-pages', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const pages = await storage.getAllFrontendPages();
      res.json(pages);
    } catch (error) {
      console.error('Get all frontend pages error:', error);
      res.status(500).json({ message: 'Failed to fetch pages' });
    }
  });

  // Update a frontend page (admin only)
  app.put('/api/admin/frontend-pages/:slug', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { slug } = req.params;
      const userId = req.adminUser.id;
      const { title, content, isActive } = req.body;
      
      // Validate required fields
      if (!content) {
        return res.status(400).json({ message: 'Content is required' });
      }
      
      const updates: Partial<any> = {};
      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;
      if (isActive !== undefined) updates.isActive = isActive;
      
      const updatedPage = await storage.updateFrontendPage(slug, updates, userId);
      
      if (!updatedPage) {
        return res.status(404).json({ message: 'Page not found' });
      }
      
      res.json(updatedPage);
    } catch (error) {
      console.error('Update frontend page error:', error);
      res.status(500).json({ message: 'Failed to update page' });
    }
  });

  // ========================================
  // Email Templates API Routes
  // ========================================

  // Get all email templates (admin only)
  app.get('/api/admin/email-templates', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const templates = await storage.getAllEmailTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Get all email templates error:', error);
      res.status(500).json({ message: 'Failed to fetch email templates' });
    }
  });

  // Get single email template by slug (admin only)
  app.get('/api/admin/email-templates/:slug', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { slug } = req.params;
      const template = await storage.getEmailTemplateBySlug(slug);
      
      if (!template) {
        return res.status(404).json({ message: 'Email template not found' });
      }
      
      res.json(template);
    } catch (error) {
      console.error('Get email template error:', error);
      res.status(500).json({ message: 'Failed to fetch email template' });
    }
  });

  // Update an email template (admin only)
  app.put('/api/admin/email-templates/:slug', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { slug } = req.params;
      const userId = req.adminUser.id;
      const { name, subject, body, variables, category, description, isActive } = req.body;
      
      // Validate required fields
      if (!subject || !body) {
        return res.status(400).json({ message: 'Subject and body are required' });
      }
      
      const updates: Partial<any> = {};
      if (name !== undefined) updates.name = name;
      if (subject !== undefined) updates.subject = subject;
      if (body !== undefined) updates.body = body;
      if (variables !== undefined) updates.variables = variables;
      if (category !== undefined) updates.category = category;
      if (description !== undefined) updates.description = description;
      if (isActive !== undefined) updates.isActive = isActive;
      
      const updatedTemplate = await storage.updateEmailTemplate(slug, updates, userId);
      
      if (!updatedTemplate) {
        return res.status(404).json({ message: 'Email template not found' });
      }
      
      res.json(updatedTemplate);
    } catch (error) {
      console.error('Update email template error:', error);
      res.status(500).json({ message: 'Failed to update email template' });
    }
  });

  // Reset email template to default (admin only)
  app.post('/api/admin/email-templates/:slug/reset', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { slug } = req.params;
      const userId = req.adminUser.id;
      
      const resetTemplate = await storage.resetEmailTemplateToDefault(slug, userId);
      
      if (!resetTemplate) {
        return res.status(404).json({ message: 'Email template not found or no default available' });
      }
      
      res.json(resetTemplate);
    } catch (error) {
      console.error('Reset email template error:', error);
      res.status(500).json({ message: 'Failed to reset email template' });
    }
  });

  // Send test email (admin only)
  app.post('/api/admin/email-templates/:slug/test', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { slug } = req.params;
      const { toEmail } = req.body;
      
      if (!toEmail) {
        return res.status(400).json({ message: 'Recipient email is required' });
      }
      
      const template = await storage.getEmailTemplateBySlug(slug);
      
      if (!template) {
        return res.status(404).json({ message: 'Email template not found' });
      }
      
      // Import the test email helper
      const { sendTestEmail } = await import('./emailTemplateDefaults');
      const success = await sendTestEmail(slug, toEmail);
      
      if (!success) {
        return res.status(500).json({ 
          message: 'Failed to send test email. Please configure SMTP settings in Admin Settings > Email Configuration first.' 
        });
      }
      
      res.json({ message: 'Test email sent successfully', toEmail });
    } catch (error: any) {
      console.error('Send test email error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to send test email.';
      
      if (error.code === 'EAUTH') {
        errorMessage = 'SMTP authentication failed. Please check your SMTP username and password in Admin Settings > Email Configuration.';
      } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
        errorMessage = 'Cannot connect to SMTP server. Please check your SMTP host and port settings in Admin Settings > Email Configuration.';
      } else if (error.message) {
        errorMessage = `Failed to send test email: ${error.message}`;
      }
      
      res.status(500).json({ message: errorMessage });
    }
  });

  // ========================================
  // CMS API Routes
  // ========================================

  // CMS Settings Routes
  app.get('/api/admin/cms/settings', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const settings = await storage.getCmsSettings();
      res.json(settings);
    } catch (error) {
      console.error('Get CMS settings error:', error);
      res.status(500).json({ message: 'Failed to fetch CMS settings' });
    }
  });

  app.get('/api/admin/cms/settings/category/:category', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { category } = req.params;
      const settings = await storage.getCmsSettingsByCategory(category as any);
      res.json(settings);
    } catch (error) {
      console.error('Get CMS settings by category error:', error);
      res.status(500).json({ message: 'Failed to fetch CMS settings' });
    }
  });

  app.put('/api/admin/cms/settings', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const userId = req.adminUser.id;
      
      // Validate request body
      const validationResult = insertCmsSettingSchema.safeParse({
        ...req.body,
        updatedBy: userId,
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid setting data', 
          errors: validationResult.error.errors 
        });
      }

      const setting = await storage.upsertCmsSetting(validationResult.data);
      res.json(setting);
    } catch (error) {
      console.error('Upsert CMS setting error:', error);
      res.status(500).json({ message: 'Failed to save CMS setting' });
    }
  });

  app.delete('/api/admin/cms/settings/:key', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { key } = req.params;
      await storage.deleteCmsSetting(key);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete CMS setting error:', error);
      res.status(500).json({ message: 'Failed to delete CMS setting' });
    }
  });

  // CMS Content Routes
  app.get('/api/admin/cms/content', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      // Return all content (including inactive) for admin management
      const content = await storage.getCmsContent(false);
      res.json(content);
    } catch (error) {
      console.error('Get CMS content error:', error);
      res.status(500).json({ message: 'Failed to fetch CMS content' });
    }
  });

  app.get('/api/admin/cms/content/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const content = await storage.getCmsContentById(id);
      
      if (!content) {
        return res.status(404).json({ message: 'Content not found' });
      }

      res.json(content);
    } catch (error) {
      console.error('Get CMS content by ID error:', error);
      res.status(500).json({ message: 'Failed to fetch CMS content' });
    }
  });

  app.get('/api/admin/cms/content/type/:blockType', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { blockType } = req.params;
      // Return all content (including inactive) for admin management
      const content = await storage.getCmsContentByType(blockType as any, false);
      res.json(content);
    } catch (error) {
      console.error('Get CMS content by type error:', error);
      res.status(500).json({ message: 'Failed to fetch CMS content' });
    }
  });

  app.post('/api/admin/cms/content', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const userId = req.adminUser.id;
      
      // Validate request body
      const validationResult = insertCmsContentSchema.safeParse({
        ...req.body,
        updatedBy: userId,
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid content data', 
          errors: validationResult.error.errors 
        });
      }

      const content = await storage.createCmsContent(validationResult.data);
      res.json(content);
    } catch (error) {
      console.error('Create CMS content error:', error);
      res.status(500).json({ message: 'Failed to create CMS content' });
    }
  });

  app.put('/api/admin/cms/content/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const userId = req.adminUser.id;
      const { id } = req.params;
      
      // Validate request body (allow partial updates)
      const validationResult = insertCmsContentSchema.partial().safeParse({
        ...req.body,
        updatedBy: userId,
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid content data', 
          errors: validationResult.error.errors 
        });
      }

      const content = await storage.updateCmsContent(id, validationResult.data);
      
      if (!content) {
        return res.status(404).json({ message: 'Content not found' });
      }

      res.json(content);
    } catch (error) {
      console.error('Update CMS content error:', error);
      res.status(500).json({ message: 'Failed to update CMS content' });
    }
  });

  app.delete('/api/admin/cms/content/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCmsContent(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete CMS content error:', error);
      res.status(500).json({ message: 'Failed to delete CMS content' });
    }
  });

  // Public endpoint to get site logo
  app.get('/api/site-logo', async (req, res) => {
    try {
      const logoSetting = await storage.getCmsSetting('site_logo');
      
      if (!logoSetting || !logoSetting.value) {
        return res.json({ logo: null });
      }
      
      // Get the media item
      const media = await storage.getCmsMediaById(logoSetting.value);
      
      if (!media) {
        return res.json({ logo: null });
      }
      
      res.json({ 
        logo: {
          id: media.id,
          url: media.fileUrl,
          altText: media.altText,
          fileName: media.fileName
        }
      });
    } catch (error) {
      console.error('Get site logo error:', error);
      res.status(500).json({ message: 'Failed to fetch site logo' });
    }
  });

  // Set site logo (admin only)
  app.post('/api/admin/site-logo', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { mediaId } = req.body;
      const userId = req.adminUser.id;
      
      if (!mediaId) {
        return res.status(400).json({ message: 'Media ID is required' });
      }
      
      // Verify the media exists
      const media = await storage.getCmsMediaById(mediaId);
      if (!media) {
        return res.status(404).json({ message: 'Media not found' });
      }
      
      // Save to CMS settings
      await storage.upsertCmsSetting({
        key: 'site_logo',
        value: mediaId,
        category: 'branding',
        description: 'Site-wide logo',
        updatedBy: userId
      });
      
      res.json({ success: true, media });
    } catch (error) {
      console.error('Set site logo error:', error);
      res.status(500).json({ message: 'Failed to set site logo' });
    }
  });

  // Public endpoint to get site hero image
  app.get('/api/site-hero', async (req, res) => {
    try {
      const heroSetting = await storage.getCmsSetting('site_hero');
      
      if (!heroSetting || !heroSetting.value) {
        return res.json({ hero: null });
      }
      
      // Get the media item
      const media = await storage.getCmsMediaById(heroSetting.value);
      
      if (!media) {
        return res.json({ hero: null });
      }
      
      res.json({ 
        hero: {
          id: media.id,
          url: media.fileUrl,
          altText: media.altText,
          fileName: media.fileName
        }
      });
    } catch (error) {
      console.error('Get site hero error:', error);
      res.status(500).json({ message: 'Failed to fetch site hero image' });
    }
  });

  // Set site hero image (admin only)
  app.post('/api/admin/site-hero', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { mediaId } = req.body;
      const userId = req.adminUser.id;
      
      if (!mediaId) {
        return res.status(400).json({ message: 'Media ID is required' });
      }
      
      // Verify the media exists
      const media = await storage.getCmsMediaById(mediaId);
      if (!media) {
        return res.status(404).json({ message: 'Media not found' });
      }
      
      // Save to CMS settings
      await storage.upsertCmsSetting({
        key: 'site_hero',
        value: mediaId,
        category: 'branding',
        description: 'Site-wide hero background image',
        updatedBy: userId
      });
      
      res.json({ success: true, media });
    } catch (error) {
      console.error('Set site hero error:', error);
      res.status(500).json({ message: 'Failed to set site hero image' });
    }
  });

  // Public endpoint to get site favicon
  app.get('/api/site-favicon', async (req, res) => {
    try {
      const faviconSetting = await storage.getCmsSetting('site_favicon');
      
      if (!faviconSetting || !faviconSetting.value) {
        return res.json({ favicon: null });
      }
      
      // Get the media item
      const media = await storage.getCmsMediaById(faviconSetting.value);
      
      if (!media) {
        return res.json({ favicon: null });
      }
      
      res.json({ 
        favicon: {
          id: media.id,
          url: media.fileUrl,
          altText: media.altText,
          fileName: media.fileName
        }
      });
    } catch (error) {
      console.error('Get site favicon error:', error);
      res.status(500).json({ message: 'Failed to fetch site favicon' });
    }
  });

  // Set site favicon (admin only)
  app.post('/api/admin/site-favicon', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { mediaId } = req.body;
      const userId = req.adminUser.id;
      
      if (!mediaId) {
        return res.status(400).json({ message: 'Media ID is required' });
      }
      
      // Verify the media exists
      const media = await storage.getCmsMediaById(mediaId);
      if (!media) {
        return res.status(404).json({ message: 'Media not found' });
      }
      
      // Save to CMS settings
      await storage.upsertCmsSetting({
        key: 'site_favicon',
        value: mediaId,
        category: 'branding',
        description: 'Site-wide favicon',
        updatedBy: userId
      });
      
      res.json({ success: true, media });
    } catch (error) {
      console.error('Set site favicon error:', error);
      res.status(500).json({ message: 'Failed to set site favicon' });
    }
  });

  // Public endpoint to get company name from CMS settings
  app.get('/api/site-company-name', async (req, res) => {
    try {
      const companyNameSetting = await storage.getCmsSetting('BRAND_COMPANY_NAME');
      
      res.json({ 
        companyName: companyNameSetting?.value || 'USA Luxury Limo'
      });
    } catch (error) {
      console.error('Get company name error:', error);
      res.status(500).json({ message: 'Failed to fetch company name' });
    }
  });

  // Public endpoint to get all branding settings
  app.get('/api/branding', async (req, res) => {
    try {
      // Fetch all branding settings in parallel for performance
      const [
        companyName,
        tagline,
        description,
        logoUrl,
        faviconUrl,
        primaryColor,
        secondaryColor,
        accentColor
      ] = await Promise.all([
        storage.getCmsSetting('BRAND_COMPANY_NAME'),
        storage.getCmsSetting('BRAND_TAGLINE'),
        storage.getCmsSetting('BRAND_DESCRIPTION'),
        storage.getCmsSetting('BRAND_LOGO_URL'),
        storage.getCmsSetting('BRAND_FAVICON_URL'),
        storage.getCmsSetting('BRAND_PRIMARY_COLOR'),
        storage.getCmsSetting('BRAND_SECONDARY_COLOR'),
        storage.getCmsSetting('BRAND_ACCENT_COLOR')
      ]);

      res.json({
        companyName: companyName?.value || 'USA Luxury Limo',
        tagline: tagline?.value || 'Premium Transportation Excellence',
        description: description?.value || 'Premium luxury transportation services across the United States. Experience comfort, reliability, and professionalism with every ride.',
        logoUrl: logoUrl?.value || '/images/logo_1759125364025.png',
        faviconUrl: faviconUrl?.value || '/images/favicon_1759253989963.png',
        colors: {
          primary: primaryColor?.value || '#1a1a1a',
          secondary: secondaryColor?.value || '#666666',
          accent: accentColor?.value || '#d4af37'
        }
      });
    } catch (error) {
      console.error('Get branding error:', error);
      res.status(500).json({ message: 'Failed to fetch branding settings' });
    }
  });

  // Dynamic PWA manifest.json endpoint
  app.get('/manifest.json', async (req, res) => {
    try {
      // Fetch active favicon from CMS
      const faviconSetting = await storage.getCmsSetting('site_favicon');
      let faviconUrl: string | null = null;
      let faviconMimeType: string | null = null;
      let etag = '"static"'; // Quoted ETag
      
      if (faviconSetting?.value) {
        const media = await storage.getCmsMediaById(faviconSetting.value);
        if (media) {
          faviconUrl = media.fileUrl;
          faviconMimeType = media.fileType; // Get actual MIME type (image/png, image/jpeg, image/webp, etc.)
          etag = `"${media.id}"`; // Use media ID as ETag for cache invalidation (quoted)
        }
      }
      
      // Generate manifest with dynamic or fallback icons
      const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
      const icons = iconSizes.map(size => ({
        src: faviconUrl || `/icon-${size}x${size}.png`,
        sizes: `${size}x${size}`,
        type: faviconUrl && faviconMimeType ? faviconMimeType : "image/png", // Use actual MIME type from CMS or PNG for static fallback
        purpose: "any maskable"
      }));
      
      const manifest = {
        name: "USA Luxury Limo",
        short_name: "USA Limo",
        description: "Professional luxury transportation booking platform for passengers, drivers, and dispatchers",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        orientation: "portrait-primary",
        icons,
        categories: ["travel", "transportation", "business"]
      };
      
      // Set cache headers with ETag for invalidation
      res.setHeader('Content-Type', 'application/manifest+json');
      res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
      res.setHeader('ETag', etag);
      
      // Check if client has cached version (compare with quotes)
      const clientETag = req.headers['if-none-match'];
      if (clientETag === etag) {
        return res.status(304).end();
      }
      
      res.json(manifest);
    } catch (error) {
      console.error('Generate manifest error:', error);
      // Fall back to static manifest on error
      res.status(500).json({ error: 'Failed to generate manifest' });
    }
  });

  // CMS Media Routes
  app.get('/api/admin/cms/media', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const media = await storage.getCmsMedia();
      
      // Generate presigned URLs for all media items
      const mediaWithUrls = await Promise.all(
        media.map(async (item) => ({
          ...item,
          fileUrl: await getPresignedUrl(item.fileUrl)
        }))
      );
      
      res.json(mediaWithUrls);
    } catch (error) {
      console.error('Get CMS media error:', error);
      res.status(500).json({ message: 'Failed to fetch CMS media' });
    }
  });

  app.get('/api/admin/cms/media/folder/:folder', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { folder } = req.params;
      const media = await storage.getCmsMediaByFolder(folder as any);
      
      // Generate presigned URLs for all media items
      const mediaWithUrls = await Promise.all(
        media.map(async (item) => ({
          ...item,
          fileUrl: await getPresignedUrl(item.fileUrl)
        }))
      );
      
      res.json(mediaWithUrls);
    } catch (error) {
      console.error('Get CMS media by folder error:', error);
      res.status(500).json({ message: 'Failed to fetch CMS media' });
    }
  });

  app.post('/api/admin/cms/media/upload', isAuthenticated, requireAdmin, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.adminUser.id;

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { folder = 'general', altText, description } = req.body;
      
      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = req.file.originalname.split('.').pop();
      const fileName = `cms-${folder}-${timestamp}.${fileExtension}`;
      const filePath = `/cms/${folder}/${fileName}`;

      // Upload to Object Storage
      const objStorage = await getObjectStorage();
      const { ok, error } = await objStorage.uploadFromBytes(filePath, req.file.buffer);
      
      if (!ok) {
        console.error('Upload to Object Storage failed:', error);
        return res.status(500).json({ message: `Upload failed: ${error}` });
      }

      // Store just the file path (object storage key), not the full URL
      // Presigned URLs will be generated on-the-fly when fetching
      const fileUrl = filePath;

      // Validate media metadata with Zod
      const validationResult = insertCmsMediaSchema.safeParse({
        fileName: req.file.originalname,
        fileUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        folder: folder as any,
        altText: altText || '',
        description: description || '',
        uploadedBy: userId,
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid media data', 
          errors: validationResult.error.errors 
        });
      }

      const media = await storage.createCmsMedia(validationResult.data);
      res.json(media);
    } catch (error) {
      console.error('Upload CMS media error:', error);
      res.status(500).json({ message: 'Failed to upload media' });
    }
  });

  app.put('/api/admin/cms/media/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Validate request body (allow partial updates)
      const validationResult = insertCmsMediaSchema.partial().safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid media data', 
          errors: validationResult.error.errors 
        });
      }

      const media = await storage.updateCmsMedia(id, validationResult.data);
      
      if (!media) {
        return res.status(404).json({ message: 'Media not found' });
      }

      res.json(media);
    } catch (error) {
      console.error('Update CMS media error:', error);
      res.status(500).json({ message: 'Failed to update media' });
    }
  });

  app.delete('/api/admin/cms/media/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Get media to get file path for deletion
      const media = await storage.getCmsMediaById(id);
      
      if (!media) {
        return res.status(404).json({ message: 'Media not found' });
      }
      
      // Check if this media is the active site logo
      const logoSetting = await storage.getCmsSetting('site_logo');
      if (logoSetting && logoSetting.value === id) {
        // Clear the site logo setting before deleting the media
        await storage.deleteCmsSetting('site_logo');
      }
      
      // Check if this media is the active site hero image
      const heroSetting = await storage.getCmsSetting('site_hero');
      if (heroSetting && heroSetting.value === id) {
        // Clear the site hero setting before deleting the media
        await storage.deleteCmsSetting('site_hero');
      }
      
      // Check if this media is the active site favicon
      const faviconSetting = await storage.getCmsSetting('site_favicon');
      if (faviconSetting && faviconSetting.value === id) {
        // Clear the site favicon setting before deleting the media
        await storage.deleteCmsSetting('site_favicon');
      }
      
      // Delete from Object Storage (extract key for backwards compatibility)
      try {
        const objStorage = await getObjectStorage();
        const storageKey = extractStorageKey(media.fileUrl);
        await objStorage.delete(storageKey);
      } catch (storageError) {
        console.error('Object storage deletion error:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
      
      // Delete from database
      await storage.deleteCmsMedia(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete CMS media error:', error);
      res.status(500).json({ message: 'Failed to delete media' });
    }
  });

  // Public route to serve CMS media files from Object Storage
  app.get('/cms/:folder/:filename', async (req, res) => {
    try {
      const { folder, filename } = req.params;
      const filePath = `/cms/${folder}/${filename}`;

      // Download from object storage
      const objStorage = await getObjectStorage();
      const { ok, value, error } = await objStorage.downloadAsBytes(filePath);

      if (!ok) {
        return res.status(404).json({ message: `File not found: ${error}` });
      }

      // Determine content type from file extension
      const extension = filename.split('.').pop()?.toLowerCase();
      const contentTypeMap: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'pdf': 'application/pdf',
        'ico': 'image/x-icon',
      };
      const contentType = contentTypeMap[extension || ''] || 'application/octet-stream';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      
      // Convert from object storage format to Buffer
      let buffer: Buffer;
      if (Buffer.isBuffer(value)) {
        buffer = value;
      } else if (Array.isArray(value) && value.length > 0) {
        buffer = Buffer.from(Object.values(value[0]));
      } else if (typeof value === 'object' && value !== null) {
        // Handle non-array-wrapped object with numeric keys
        buffer = Buffer.from(Object.values(value));
      } else {
        throw new Error('Unexpected value format from object storage');
      }
      
      res.send(buffer);
    } catch (error) {
      console.error('Error serving CMS media:', error);
      res.status(500).json({ message: 'Failed to serve media' });
    }
  });

  // Driver Messages API Routes
  // Send message to driver(s)
  app.post('/api/driver-messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Verify user has dispatcher or admin role
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'dispatcher' && user.role !== 'admin')) {
        return res.status(403).json({ message: 'Dispatcher or Admin access required' });
      }

      const { driverId, messageType, subject, message, priority, deliveryMethod } = req.body;

      if (!message || !deliveryMethod) {
        return res.status(400).json({ message: 'Message and delivery method are required' });
      }

      // Validate driver ID for individual messages
      if (messageType === 'individual' && driverId) {
        const driver = await storage.getUser(driverId);
        console.log('🔍 Driver validation - ID:', driverId, 'Found:', !!driver, 'Role:', driver?.role);
        if (!driver) {
          return res.status(400).json({ message: 'Driver not found' });
        }
        if (driver.role !== 'driver') {
          return res.status(400).json({ message: `Invalid role: ${driver.role}. Must be a driver.` });
        }
      }

      // Create message record
      const driverMessage = await storage.createDriverMessage({
        senderId: userId,
        driverId: messageType === 'broadcast' ? null : (driverId || null),
        messageType: messageType || 'individual',
        subject,
        message,
        priority: priority || 'normal',
        deliveryMethod,
      });

      // Send the message based on delivery method
      let smsSent = false;
      let emailSent = false;
      let errors: string[] = [];

      // Get driver details for sending
      const targetDrivers = driverId
        ? [await storage.getUser(driverId)]
        : await storage.getAllUsers().then(users => 
            users.filter(u => u.role === 'driver' && u.isActive)
          );

      for (const driver of targetDrivers) {
        if (!driver) continue;

        try {
          // Send SMS if requested
          if (deliveryMethod === 'sms' || deliveryMethod === 'both') {
            if (driver.phone) {
              const smsResult = await sendSMS(driver.phone, message);
              if (smsResult.success) {
                smsSent = true;
              } else {
                errors.push(`SMS failed for ${driver.firstName}: ${smsResult.error}`);
              }
            }
          }

          // Send email if requested
          if (deliveryMethod === 'email' || deliveryMethod === 'both') {
            if (driver.email) {
              const emailHTML = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #1a202c;">${subject || 'Message from Dispatch'}</h2>
                  <p style="color: #4a5568; line-height: 1.6;">${message}</p>
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                  <p style="color: #718096; font-size: 14px;">This message was sent via the USA Luxury Limo dispatch system.</p>
                </div>
              `;
              const emailResult = await sendEmail({
                to: driver.email,
                subject: subject || 'Message from Dispatch',
                html: emailHTML,
              });
              if (emailResult) {
                emailSent = true;
              } else {
                errors.push(`Email failed for ${driver.firstName}`);
              }
            }
          }
        } catch (error) {
          console.error(`Error sending message to driver ${driver.id}:`, error);
          errors.push(`Failed to send to ${driver.firstName}`);
        }
      }

      // Update message status
      const status = errors.length === 0 ? 'sent' : errors.length < targetDrivers.length ? 'sent' : 'failed';
      await storage.updateDriverMessageStatus(
        driverMessage.id,
        status,
        new Date(),
        smsSent || emailSent ? new Date() : undefined,
        errors.length > 0 ? errors.join('; ') : undefined
      );

      res.json({
        success: true,
        message: driverMessage,
        smsSent,
        emailSent,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error('Error sending driver message:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  // Get all driver messages
  app.get('/api/driver-messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Verify user has dispatcher or admin role
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'dispatcher' && user.role !== 'admin')) {
        return res.status(403).json({ message: 'Dispatcher or Admin access required' });
      }

      const { driverId } = req.query;
      const messages = await storage.getDriverMessages(driverId as string | undefined);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching driver messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  // Emergency Incidents API Routes
  // Create emergency incident
  app.post('/api/emergency-incidents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Verify user has dispatcher or admin role
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'dispatcher' && user.role !== 'admin')) {
        return res.status(403).json({ message: 'Dispatcher or Admin access required' });
      }

      const incident = await storage.createEmergencyIncident({
        ...req.body,
        reporterId: userId,
      });

      res.json({ success: true, incident });
    } catch (error) {
      console.error('Error creating emergency incident:', error);
      res.status(500).json({ message: 'Failed to create incident' });
    }
  });

  // Get all emergency incidents
  app.get('/api/emergency-incidents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Verify user has dispatcher or admin role
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'dispatcher' && user.role !== 'admin')) {
        return res.status(403).json({ message: 'Dispatcher or Admin access required' });
      }

      const { status } = req.query;
      const incidents = await storage.getEmergencyIncidents(status as string | undefined);
      
      // Enrich with reporter and driver info
      const enrichedIncidents = await Promise.all(
        incidents.map(async (incident) => {
          const reporter = await storage.getUser(incident.reporterId);
          const driver = incident.driverId ? await storage.getUser(incident.driverId) : null;
          const assignee = incident.assignedTo ? await storage.getUser(incident.assignedTo) : null;
          
          return {
            ...incident,
            reporterName: reporter ? `${reporter.firstName} ${reporter.lastName}` : 'Unknown',
            driverName: driver ? `${driver.firstName} ${driver.lastName}` : null,
            assigneeName: assignee ? `${assignee.firstName} ${assignee.lastName}` : null,
          };
        })
      );

      res.json(enrichedIncidents);
    } catch (error) {
      console.error('Error fetching emergency incidents:', error);
      res.status(500).json({ message: 'Failed to fetch incidents' });
    }
  });

  // Update emergency incident
  app.patch('/api/emergency-incidents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Verify user has dispatcher or admin role
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'dispatcher' && user.role !== 'admin')) {
        return res.status(403).json({ message: 'Dispatcher or Admin access required' });
      }

      const { id } = req.params;
      const incident = await storage.updateEmergencyIncident(id, req.body);

      if (!incident) {
        return res.status(404).json({ message: 'Incident not found' });
      }

      res.json({ success: true, incident });
    } catch (error) {
      console.error('Error updating emergency incident:', error);
      res.status(500).json({ message: 'Failed to update incident' });
    }
  });

  // Stripe webhook for payment status updates
  app.post('/api/stripe-webhook', async (req, res) => {
    try {
      const event = req.body;

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.bookingId;
        
        if (bookingId) {
          await storage.updateBookingPayment(bookingId, paymentIntent.id, 'paid');
          await storage.updateBookingStatus(bookingId, 'confirmed');
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
