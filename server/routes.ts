import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertBookingSchema, insertContactSchema, insertSavedAddressSchema } from "@shared/schema";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const tomtomKey = process.env.TOMTOM_API_KEY || await storage.getSystemSetting('TOMTOM_API_KEY');
      if (!tomtomKey) {
        return res.status(500).json({ error: 'TomTom API key not configured' });
      }

      const apiKey = typeof tomtomKey === 'string' ? tomtomKey : tomtomKey.value;
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

  // Distance calculation
  app.post('/api/calculate-distance', async (req, res) => {
    const { origins, destinations } = req.body;
    
    if (!origins || !destinations) {
      return res.status(400).json({ error: 'Origins and destinations are required' });
    }

    try {
      const tomtomKey = process.env.TOMTOM_API_KEY || await storage.getSystemSetting('TOMTOM_API_KEY');
      if (!tomtomKey) {
        return res.status(500).json({ error: 'TomTom API key not configured' });
      }

      const apiKey = typeof tomtomKey === 'string' ? tomtomKey : tomtomKey.value;
      
      // Calculate route using TomTom Routing API
      const routeUrl = `https://api.tomtom.com/routing/1/calculateRoute/${origins}:${destinations}/json?key=${apiKey}`;
      
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let bookings;
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

  // Update booking status (drivers and admins)
  app.patch('/api/bookings/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.claims.sub;
      
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
      const userId = req.user.claims.sub;
      const addresses = await storage.getSavedAddressesByUser(userId);
      res.json(addresses);
    } catch (error) {
      console.error('Get saved addresses error:', error);
      res.status(500).json({ message: 'Failed to fetch saved addresses' });
    }
  });

  app.post('/api/saved-addresses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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

  app.post('/api/admin/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { settings } = req.body;
      
      for (const [key, value] of Object.entries(settings)) {
        await storage.updateSystemSetting(key, value as string, userId);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ message: 'Failed to update settings' });
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
          userId: req.user.claims.sub,
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
