import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hashPassword, comparePasswords } from "./auth";
import { insertBookingSchema, insertContactSchema, insertSavedAddressSchema, insertPricingRuleSchema, insertDriverDocumentSchema, insertCmsSettingSchema, insertCmsContentSchema, insertCmsMediaSchema, type User, vehicles } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";
import multer from "multer";
import { Client as ObjectStorageClient } from "@replit/object-storage";
import { sendEmail, testSMTPConnection, clearEmailCache, getContactFormEmailHTML, getTestEmailHTML, getBookingConfirmationEmailHTML, getBookingStatusUpdateEmailHTML, getDriverAssignmentEmailHTML, getPasswordResetEmailHTML } from "./email";
import { getTwilioConnectionStatus, sendTestSMS, sendBookingConfirmationSMS, sendBookingStatusUpdateSMS, sendDriverAssignmentSMS, sendSMS } from "./sms";
import { sendNewBookingReport, sendCancelledBookingReport, sendDriverActivityReport } from "./emailReports";
import { db } from "./db";
import { eq } from "drizzle-orm";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Object Storage client lazily (on first use) to avoid startup errors
let objectStorage: ObjectStorageClient | null = null;

function getObjectStorage(): ObjectStorageClient {
  if (!objectStorage) {
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) {
      throw new Error('Object Storage bucket ID not found. Please set up Object Storage.');
    }
    objectStorage = new ObjectStorageClient({ bucketId });
  }
  return objectStorage;
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

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Forgot password - send reset email
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });
      }

      // Generate reset token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

      // Save token to database
      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt,
        used: false,
      });

      // Send reset email
      const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
      const protocol = domain.includes('localhost') ? 'http' : 'https';
      const resetLink = `${protocol}://${domain}/reset-password?token=${token}`;

      await sendEmail({
        to: email,
        subject: 'Password Reset Request - USA Luxury Limo',
        html: getPasswordResetEmailHTML({
          name: user.firstName || user.username || 'User',
          resetLink,
          expiresIn: '1 hour',
        }),
      });

      res.json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Failed to process password reset request' });
    }
  });

  // Verify reset token
  app.get('/api/auth/verify-reset-token/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ valid: false, message: 'Invalid or expired reset token' });
      }

      if (resetToken.used) {
        return res.status(400).json({ valid: false, message: 'This reset link has already been used' });
      }

      if (new Date() > new Date(resetToken.expiresAt)) {
        return res.status(400).json({ valid: false, message: 'This reset link has expired' });
      }

      res.json({ valid: true });
    } catch (error) {
      console.error('Verify reset token error:', error);
      res.status(500).json({ valid: false, message: 'Failed to verify reset token' });
    }
  });

  // Reset password with token
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: 'Token and password are required' });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
      }

      // Verify token
      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      if (resetToken.used) {
        return res.status(400).json({ message: 'This reset link has already been used' });
      }

      if (new Date() > new Date(resetToken.expiresAt)) {
        return res.status(400).json({ message: 'This reset link has expired' });
      }

      // Hash new password
      const hashedPassword = await hashPassword(password);
      
      // Update user password
      await storage.updateUser(resetToken.userId, { password: hashedPassword });
      
      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(token);

      res.json({ success: true, message: 'Password has been reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
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
      });

      const validatedData = updateSchema.parse(req.body);
      
      // Check if email is already in use by another user
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "Email is already in use" });
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

  // Vehicle types (public)
  app.get('/api/vehicle-types', async (req, res) => {
    try {
      const vehicleTypes = await storage.getVehicleTypes();
      res.json(vehicleTypes);
    } catch (error) {
      console.error("Error fetching vehicle types:", error);
      res.status(500).json({ message: "Failed to fetch vehicle types" });
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
        const distanceFare = parseFloat(vehicleType.perMileRate || '0') * parseFloat(distance || '0');
        
        breakdown = {
          baseFare,
          distanceFare,
          distance: parseFloat(distance || '0'),
          perMileRate: parseFloat(vehicleType.perMileRate || '0')
        };
        
        totalAmount = baseFare + distanceFare;
      } else if (bookingType === 'hourly') {
        // Hourly pricing: hourly rate * hours
        const hourlyRate = parseFloat(vehicleType.hourlyRate);
        const requestedHours = parseInt(hours || '2');
        
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
      
      // Send system admin report (fire-and-forget)
      (async () => {
        try {
          const passenger = await storage.getUser(userId);
          const vehicleType = await storage.getVehicleType(booking.vehicleTypeId);
          if (passenger && vehicleType) {
            await sendNewBookingReport(booking, passenger, vehicleType.name || 'Unknown Vehicle');
          }
        } catch (error) {
          console.error('[EMAIL REPORT] Failed to send new booking report:', error);
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
          if (passenger) {
            const message = `Your driver ${user.firstName} ${user.lastName} is on the way! Pickup at ${booking.pickupAddress} at ${scheduledTime.toLocaleString()}.`;
            
            if (booking.passengerPhone || passenger.phone) {
              await sendSMS(booking.passengerPhone || passenger.phone!, message);
            }

            if (passenger.email) {
              await sendEmail({
                to: passenger.email,
                subject: 'Driver On the Way',
                html: `<h2>Driver On the Way</h2><p>${message}</p><p>Vehicle: ${driver.vehiclePlate || 'N/A'}</p>`,
              });
            }
            
            // Send system admin activity report
            const vehicleType = await storage.getVehicleType(booking.vehicleTypeId);
            if (vehicleType) {
              await sendDriverActivityReport({
                type: 'on_the_way',
                booking: updatedBooking,
                driver: user,
                passenger,
                vehicleTypeName: vehicleType.name || 'Unknown Vehicle',
                timestamp: now,
              });
            }
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
          if (passenger) {
            const message = `Your driver ${user.firstName} ${user.lastName} has arrived at ${booking.pickupAddress}!`;
            
            if (booking.passengerPhone || passenger.phone) {
              await sendSMS(booking.passengerPhone || passenger.phone!, message);
            }

            if (passenger.email) {
              await sendEmail({
                to: passenger.email,
                subject: 'Driver Has Arrived',
                html: `<h2>Driver Has Arrived</h2><p>${message}</p><p>Vehicle: ${driver.vehiclePlate || 'N/A'}</p>`,
              });
            }
            
            // Send system admin activity report
            const vehicleType = await storage.getVehicleType(booking.vehicleTypeId);
            if (vehicleType) {
              await sendDriverActivityReport({
                type: 'arrived',
                booking: updatedBooking,
                driver: user,
                passenger,
                vehicleTypeName: vehicleType.name || 'Unknown Vehicle',
                timestamp: now,
              });
            }
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
      
      // Get the booking first
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      const user = await storage.getUser(userId);
      
      // Check permissions: must be admin or booking owner
      if (booking.passengerId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to delete this booking' });
      }

      // Only allow deleting pending bookings (unless admin)
      if (booking.status !== 'pending' && user?.role !== 'admin') {
        return res.status(400).json({ message: 'Only pending bookings can be deleted' });
      }

      await storage.deleteBooking(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete booking error:', error);
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
      
      // Send system admin report (fire-and-forget)
      (async () => {
        try {
          const passenger = await storage.getUser(booking.passengerId);
          const vehicleType = await storage.getVehicleType(booking.vehicleTypeId);
          if (passenger && vehicleType) {
            await sendCancelledBookingReport(
              updatedBooking,
              passenger,
              vehicleType.name || 'Unknown Vehicle',
              'passenger',
              req.body.reason || 'No reason provided'
            );
          }
        } catch (error) {
          console.error('[EMAIL REPORT] Failed to send cancellation report:', error);
        }
      })();
      
      res.json(updatedBooking);
    } catch (error) {
      console.error('Cancel booking error:', error);
      res.status(500).json({ message: 'Failed to cancel booking' });
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

      const booking = await storage.addAdditionalCharge(id, {
        description,
        amount: parseFloat(amount),
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
          
          if (driver?.userId) {
            const driverUser = await storage.getUser(driver.userId);
            
            if (driverUser?.email) {
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

              // Send SMS notification if phone number is available
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
                  console.error('Failed to send driver assignment SMS:', smsError);
                  // Continue even if SMS fails
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
      const envKeys = ['STRIPE_SECRET_KEY', 'STRIPE_PUBLIC_KEY', 'TOMTOM_API_KEY', 'RAPIDAPI_KEY'];
      
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
      
      for (const [key, value] of Object.entries(settings)) {
        // Only update if value is provided and not the masked placeholder
        if (value && typeof value === 'string' && value !== '••••••••') {
          await storage.updateSystemSetting(key, value as string, userId);
        }
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
      const { role, isActive, payLaterEnabled, discountType, discountValue, firstName, lastName, email, phone, vehiclePlate } = req.body;
      
      const updates: Partial<User> = {};
      if (role !== undefined) updates.role = role;
      if (isActive !== undefined) updates.isActive = isActive;
      if (payLaterEnabled !== undefined) updates.payLaterEnabled = payLaterEnabled;
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

      const { firstName, lastName, email, phone, role, isActive, payLaterEnabled, vehiclePlate } = req.body;
      
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
      
      const newUser = await storage.createUser({
        email,
        password: tempPassword,
        firstName,
        lastName: lastName || '',
        phone: phone || '',
        role: role || 'passenger',
        isActive: isActive !== undefined ? isActive : true,
        payLaterEnabled: payLaterEnabled || false,
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
      const allBookings = await storage.getDriverBookings(driver.id);
      const completedBookings = allBookings.filter(b => b.status === 'completed' && b.driverPayment);

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
        .filter(b => new Date(b.completedAt || b.updatedAt) >= startOfToday)
        .reduce((sum, b) => sum + parseFloat(b.driverPayment || '0'), 0);

      const weekEarnings = completedBookings
        .filter(b => new Date(b.completedAt || b.updatedAt) >= startOfWeek)
        .reduce((sum, b) => sum + parseFloat(b.driverPayment || '0'), 0);

      const monthEarnings = completedBookings
        .filter(b => new Date(b.completedAt || b.updatedAt) >= startOfMonth)
        .reduce((sum, b) => sum + parseFloat(b.driverPayment || '0'), 0);

      const yearEarnings = completedBookings
        .filter(b => new Date(b.completedAt || b.updatedAt) >= startOfYear)
        .reduce((sum, b) => sum + parseFloat(b.driverPayment || '0'), 0);

      const allTimeEarnings = completedBookings
        .reduce((sum, b) => sum + parseFloat(b.driverPayment || '0'), 0);

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
      const { ok, error } = await getObjectStorage().uploadFromBytes(
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
      res.json(documents);

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
      const { ok, value, error } = await getObjectStorage().downloadAsBytes(document.documentUrl);

      if (!ok) {
        return res.status(404).json({ message: `File not found: ${error}` });
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
      res.send(value);

    } catch (error) {
      console.error('Document download error:', error);
      res.status(500).json({ message: 'Failed to download document' });
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

      // Delete from object storage
      const { ok, error} = await getObjectStorage().delete(document.documentUrl);
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
      const { ok, error } = await getObjectStorage().uploadFromBytes(
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

      // Apply gratuity
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

      // Check for surge pricing if date and time provided
      if (date && time && rule.surgePricing && rule.surgePricing.length > 0) {
        const requestDate = new Date(`${date}T${time}`);
        const dayOfWeek = requestDate.getDay();
        const timeStr = time; // HH:MM format

        for (const surge of rule.surgePricing) {
          if (surge.dayOfWeek === dayOfWeek && 
              timeStr >= surge.startTime && 
              timeStr <= surge.endTime) {
            breakdown.surgeMultiplier = parseFloat(String(surge.multiplier));
            break;
          }
        }
      }

      // Calculate final total before discount
      breakdown.total = (breakdown.subtotal + breakdown.gratuity + breakdown.airportFee + breakdown.meetAndGreetFee) * breakdown.surgeMultiplier;

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

  // CMS Media Routes
  app.get('/api/admin/cms/media', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const media = await storage.getCmsMedia();
      res.json(media);
    } catch (error) {
      console.error('Get CMS media error:', error);
      res.status(500).json({ message: 'Failed to fetch CMS media' });
    }
  });

  app.get('/api/admin/cms/media/folder/:folder', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { folder } = req.params;
      const media = await storage.getCmsMediaByFolder(folder as any);
      res.json(media);
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
      const objStorage = getObjectStorage();
      const { ok, error } = await objStorage.uploadFromBytes(filePath, req.file.buffer);
      
      if (!ok) {
        console.error('Upload to Object Storage failed:', error);
        return res.status(500).json({ message: `Upload failed: ${error}` });
      }

      // Get public URL
      const domain = process.env.REPLIT_DOMAINS?.split(',')[0];
      const fileUrl = domain ? `https://${domain}${filePath}` : `http://localhost:5000${filePath}`;

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
      
      if (media) {
        // Delete from Object Storage
        try {
          const objStorage = getObjectStorage();
          const urlPath = new URL(media.fileUrl).pathname;
          await objStorage.delete(urlPath);
        } catch (storageError) {
          console.error('Object storage deletion error:', storageError);
          // Continue with database deletion even if storage deletion fails
        }
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
      const { ok, value, error } = await getObjectStorage().downloadAsBytes(filePath);

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
      res.send(Buffer.from(value.buffer || value));
    } catch (error) {
      console.error('Error serving CMS media:', error);
      res.status(500).json({ message: 'Failed to serve media' });
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
