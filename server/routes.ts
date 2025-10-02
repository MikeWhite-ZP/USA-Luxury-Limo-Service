import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertBookingSchema, insertContactSchema, insertSavedAddressSchema, insertPricingRuleSchema } from "@shared/schema";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
      const envKeys = ['STRIPE_SECRET_KEY', 'STRIPE_PUBLIC_KEY', 'TOMTOM_API_KEY'];
      
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

  // Payment Systems management (admin only)
  app.get('/api/payment-systems', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const systems = await storage.getPaymentSystems();
      res.json(systems);
    } catch (error) {
      console.error('Get payment systems error:', error);
      res.status(500).json({ message: 'Failed to fetch payment systems' });
    }
  });

  app.get('/api/payment-systems/active', async (req, res) => {
    try {
      const activeSystem = await storage.getActivePaymentSystem();
      res.json(activeSystem || null);
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
      res.json(newSystem);
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
      res.json(updatedSystem);
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
      const { vehicleType, serviceType, distance, hours, date, time, airportCode } = req.body;

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

      // Calculate final total
      breakdown.total = (breakdown.subtotal + breakdown.gratuity + breakdown.airportFee + breakdown.meetAndGreetFee) * breakdown.surgeMultiplier;

      res.json({
        vehicleType,
        serviceType,
        price: breakdown.total.toFixed(2),
        breakdown,
        ruleId: rule.id
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
