import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hashPassword, comparePasswords } from "./auth";
import { insertBookingSchema, insertContactSchema, insertSavedAddressSchema, insertPricingRuleSchema, insertDriverDocumentSchema, type User } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";
import multer from "multer";
import { Client as ObjectStorageClient } from "@replit/object-storage";

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
      });

      const booking = await storage.createBooking(bookingData);
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
        } else {
          bookings = [];
        }
      } else {
        bookings = await storage.getBookingsByUser(userId);
      }

      res.json(bookings);
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

      res.json(booking);
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
      const updatedBooking = await storage.updateBooking(id, { status: 'cancelled' });
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

      const booking = await storage.createBooking(bookingData);
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
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
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
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const drivers = await storage.getActiveDrivers();
      res.json(drivers);
    } catch (error) {
      console.error('Get active drivers error:', error);
      res.status(500).json({ message: 'Failed to fetch active drivers' });
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

      const updatedBooking = await storage.updateBookingStatus(id, status);
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
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { id } = req.params;
      const { driverId } = req.body;

      if (!driverId) {
        return res.status(400).json({ error: 'Driver ID is required' });
      }

      const updatedBooking = await storage.assignDriverToBooking(id, driverId);
      res.json(updatedBooking);
    } catch (error) {
      console.error('Assign driver error:', error);
      res.status(500).json({ error: 'Failed to assign driver to booking' });
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

      // Add all database credentials
      allSettings.forEach(setting => {
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
      const { role, isActive, payLaterEnabled, discountType, discountValue, firstName, lastName, email, phone } = req.body;
      
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
          });
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

      const { firstName, lastName, email, phone, role, isActive, payLaterEnabled } = req.body;
      
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
        return res.json([]);
      }

      // Retrieve payment methods from Stripe
      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });

      res.json(paymentMethods.data);
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
