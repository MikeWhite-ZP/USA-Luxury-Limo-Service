import {
  users,
  drivers,
  vehicleTypes,
  vehicles,
  bookings,
  savedAddresses,
  systemSettings,
  invoices,
  contactSubmissions,
  pricingRules,
  paymentSystems,
  type User,
  type UpsertUser,
  type Driver,
  type VehicleType,
  type Vehicle,
  type Booking,
  type SavedAddress,
  type SystemSetting,
  type Invoice,
  type ContactSubmission,
  type PricingRule,
  type PaymentSystem,
  type InsertDriver,
  type InsertBooking,
  type InsertContact,
  type InsertSavedAddress,
  type InsertPricingRule,
  type InsertPaymentSystem,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, like, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByOAuth(provider: string, oauthId: string): Promise<User | undefined>;
  createUser(userData: Partial<User>): Promise<User>;
  
  // Driver operations
  createDriver(driver: InsertDriver): Promise<Driver>;
  getDriver(id: string): Promise<Driver | undefined>;
  getDriverByUserId(userId: string): Promise<Driver | undefined>;
  updateDriverVerificationStatus(id: string, status: string): Promise<void>;
  getAvailableDrivers(): Promise<Driver[]>;
  
  // Vehicle operations
  getVehicleTypes(): Promise<VehicleType[]>;
  getVehicleType(id: string): Promise<VehicleType | undefined>;
  createVehicle(vehicle: Omit<Vehicle, 'id' | 'createdAt'>): Promise<Vehicle>;
  getVehiclesByDriver(driverId: string): Promise<Vehicle[]>;
  
  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByUser(userId: string): Promise<Booking[]>;
  getBookingsByDriver(driverId: string): Promise<Booking[]>;
  updateBookingStatus(id: string, status: string): Promise<void>;
  updateBookingPayment(id: string, paymentIntentId: string, status: string): Promise<void>;
  
  // Saved addresses
  createSavedAddress(address: InsertSavedAddress): Promise<SavedAddress>;
  getSavedAddressesByUser(userId: string): Promise<SavedAddress[]>;
  deleteSavedAddress(id: string, userId: string): Promise<void>;
  
  // System settings
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  getAllSystemSettings(): Promise<SystemSetting[]>;
  updateSystemSetting(key: string, value: string, userId: string): Promise<void>;
  deleteSystemSetting(key: string): Promise<void>;
  
  // Contact submissions
  createContactSubmission(contact: InsertContact): Promise<ContactSubmission>;
  getContactSubmissions(): Promise<ContactSubmission[]>;
  updateContactStatus(id: string, status: string): Promise<void>;
  
  // Invoices
  createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt'>): Promise<Invoice>;
  getInvoiceByBooking(bookingId: string): Promise<Invoice | undefined>;
  
  // Admin dashboard data
  getAdminDashboardStats(): Promise<{
    totalRevenue: string;
    activeBookings: number;
    activeDrivers: number;
    averageRating: string;
    pendingBookings: number;
    pendingDrivers: number;
    revenueGrowth: string;
    ratingImprovement: string;
  }>;
  
  // Stripe customer management
  updateStripeCustomerId(userId: string, customerId: string): Promise<User>;
  updateUserStripeInfo(userId: string, stripeInfo: { customerId: string; subscriptionId: string }): Promise<User>;
  
  // Pricing rules (admin-configurable)
  getPricingRules(): Promise<PricingRule[]>;
  getPricingRule(id: string): Promise<PricingRule | undefined>;
  getPricingRuleByType(vehicleType: string, serviceType: string): Promise<PricingRule | undefined>;
  createPricingRule(rule: InsertPricingRule): Promise<PricingRule>;
  updatePricingRule(id: string, rule: Partial<InsertPricingRule>): Promise<PricingRule | undefined>;
  deletePricingRule(id: string): Promise<void>;
  
  // Payment Systems
  getPaymentSystems(): Promise<PaymentSystem[]>;
  getPaymentSystem(provider: string): Promise<PaymentSystem | undefined>;
  getActivePaymentSystem(): Promise<PaymentSystem | undefined>;
  createPaymentSystem(system: InsertPaymentSystem): Promise<PaymentSystem>;
  updatePaymentSystem(provider: string, updates: Partial<InsertPaymentSystem>): Promise<PaymentSystem | undefined>;
  setActivePaymentSystem(provider: string): Promise<void>;
  deletePaymentSystem(provider: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByOAuth(provider: string, oauthId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.oauthProvider, provider as "local" | "google" | "apple"), 
        eq(users.oauthId, oauthId)
      ));
    return user;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData as any)
      .returning();
    return user;
  }

  async createDriver(driverData: InsertDriver): Promise<Driver> {
    const [driver] = await db
      .insert(drivers)
      .values(driverData)
      .returning();
    return driver;
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver;
  }

  async getDriverByUserId(userId: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.userId, userId));
    return driver;
  }

  async updateDriverVerificationStatus(id: string, status: string): Promise<void> {
    await db
      .update(drivers)
      .set({ verificationStatus: status as any, updatedAt: new Date() })
      .where(eq(drivers.id, id));
  }

  async getAvailableDrivers(): Promise<Driver[]> {
    return await db
      .select()
      .from(drivers)
      .where(and(eq(drivers.isAvailable, true), eq(drivers.verificationStatus, 'verified')));
  }

  async getVehicleTypes(): Promise<VehicleType[]> {
    return await db
      .select()
      .from(vehicleTypes)
      .where(eq(vehicleTypes.isActive, true))
      .orderBy(vehicleTypes.hourlyRate);
  }

  async getVehicleType(id: string): Promise<VehicleType | undefined> {
    const [vehicleType] = await db.select().from(vehicleTypes).where(eq(vehicleTypes.id, id));
    return vehicleType;
  }

  async createVehicle(vehicleData: Omit<Vehicle, 'id' | 'createdAt'>): Promise<Vehicle> {
    const [vehicle] = await db
      .insert(vehicles)
      .values(vehicleData as any)
      .returning();
    return vehicle;
  }

  async getVehiclesByDriver(driverId: string): Promise<Vehicle[]> {
    return await db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.driverId, driverId), eq(vehicles.isActive, true)));
  }

  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const [booking] = await db
      .insert(bookings)
      .values(bookingData)
      .returning();
    return booking;
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getBookingsByUser(userId: string): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.passengerId, userId))
      .orderBy(desc(bookings.createdAt));
  }

  async getBookingsByDriver(driverId: string): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.driverId, driverId))
      .orderBy(desc(bookings.scheduledDateTime));
  }

  async updateBookingStatus(id: string, status: string): Promise<void> {
    await db
      .update(bookings)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(bookings.id, id));
  }

  async updateBookingPayment(id: string, paymentIntentId: string, status: string): Promise<void> {
    await db
      .update(bookings)
      .set({ 
        paymentIntentId, 
        paymentStatus: status as any, 
        updatedAt: new Date() 
      })
      .where(eq(bookings.id, id));
  }

  async createSavedAddress(addressData: InsertSavedAddress): Promise<SavedAddress> {
    const [address] = await db
      .insert(savedAddresses)
      .values(addressData)
      .returning();
    return address;
  }

  async getSavedAddressesByUser(userId: string): Promise<SavedAddress[]> {
    return await db
      .select()
      .from(savedAddresses)
      .where(eq(savedAddresses.userId, userId))
      .orderBy(savedAddresses.label);
  }

  async deleteSavedAddress(id: string, userId: string): Promise<void> {
    await db
      .delete(savedAddresses)
      .where(and(eq(savedAddresses.id, id), eq(savedAddresses.userId, userId)));
  }

  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting;
  }

  async getAllSystemSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings);
  }

  async updateSystemSetting(key: string, value: string, userId: string): Promise<void> {
    await db
      .insert(systemSettings)
      .values({ key, value, updatedBy: userId })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value, updatedBy: userId, updatedAt: new Date() },
      });
  }

  async deleteSystemSetting(key: string): Promise<void> {
    await db.delete(systemSettings).where(eq(systemSettings.key, key));
  }

  async createContactSubmission(contactData: InsertContact): Promise<ContactSubmission> {
    const [contact] = await db
      .insert(contactSubmissions)
      .values(contactData)
      .returning();
    return contact;
  }

  async getContactSubmissions(): Promise<ContactSubmission[]> {
    return await db
      .select()
      .from(contactSubmissions)
      .orderBy(desc(contactSubmissions.createdAt));
  }

  async updateContactStatus(id: string, status: string): Promise<void> {
    await db
      .update(contactSubmissions)
      .set({ status: status as any })
      .where(eq(contactSubmissions.id, id));
  }

  async createInvoice(invoiceData: Omit<Invoice, 'id' | 'createdAt'>): Promise<Invoice> {
    const [invoice] = await db
      .insert(invoices)
      .values(invoiceData as any)
      .returning();
    return invoice;
  }

  async getInvoiceByBooking(bookingId: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.bookingId, bookingId));
    return invoice;
  }

  async getAdminDashboardStats(): Promise<{
    totalRevenue: string;
    activeBookings: number;
    activeDrivers: number;
    averageRating: string;
    pendingBookings: number;
    pendingDrivers: number;
    revenueGrowth: string;
    ratingImprovement: string;
  }> {
    // Total revenue from all completed bookings
    const [revenueResult] = await db
      .select({ 
        total: sql<string>`COALESCE(SUM(${bookings.totalAmount}), 0)` 
      })
      .from(bookings)
      .where(eq(bookings.status, 'completed'));

    // Calculate date boundaries for current and previous month
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    // Revenue from current month
    const [currentMonthRevenueResult] = await db
      .select({ 
        total: sql<string>`COALESCE(SUM(${bookings.totalAmount}), 0)` 
      })
      .from(bookings)
      .where(and(
        eq(bookings.status, 'completed'),
        sql`${bookings.createdAt} >= ${currentMonthStart.toISOString()}`
      ));

    // Revenue from previous month
    const [lastMonthRevenueResult] = await db
      .select({ 
        total: sql<string>`COALESCE(SUM(${bookings.totalAmount}), 0)` 
      })
      .from(bookings)
      .where(and(
        eq(bookings.status, 'completed'),
        sql`${bookings.createdAt} >= ${lastMonthStart.toISOString()}`,
        sql`${bookings.createdAt} < ${currentMonthStart.toISOString()}`
      ));

    // Calculate revenue growth percentage
    const currentMonthRevenue = parseFloat(currentMonthRevenueResult?.total || '0');
    const lastMonthRevenue = parseFloat(lastMonthRevenueResult?.total || '0');
    let revenueGrowth = '0';
    if (lastMonthRevenue > 0) {
      const growth = ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
      revenueGrowth = growth.toFixed(1);
    }

    // Active bookings count
    const [activeBookingsResult] = await db
      .select({ 
        count: sql<number>`COUNT(*)` 
      })
      .from(bookings)
      .where(sql`${bookings.status} IN ('pending', 'confirmed', 'in_progress')`);

    // Pending bookings count (status = 'pending')
    const [pendingBookingsResult] = await db
      .select({ 
        count: sql<number>`COUNT(*)` 
      })
      .from(bookings)
      .where(eq(bookings.status, 'pending'));

    // Active drivers count
    const [activeDriversResult] = await db
      .select({ 
        count: sql<number>`COUNT(*)` 
      })
      .from(drivers)
      .where(and(eq(drivers.isAvailable, true), eq(drivers.verificationStatus, 'verified')));

    // Pending driver verifications
    const [pendingDriversResult] = await db
      .select({ 
        count: sql<number>`COUNT(*)` 
      })
      .from(drivers)
      .where(eq(drivers.verificationStatus, 'pending'));

    // Current average rating (all verified drivers)
    const [ratingResult] = await db
      .select({ 
        avg: sql<string>`COALESCE(AVG(${drivers.rating}), 0)` 
      })
      .from(drivers)
      .where(eq(drivers.verificationStatus, 'verified'));

    // Average rating from last 30 days (using bookings as proxy for recent performance)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Get average rating from bookings in the last 30 days
    const [recentRatingResult] = await db
      .select({ 
        avg: sql<string>`COALESCE(AVG(${drivers.rating}), 0)` 
      })
      .from(drivers)
      .innerJoin(bookings, eq(bookings.driverId, drivers.id))
      .where(and(
        eq(drivers.verificationStatus, 'verified'),
        eq(bookings.status, 'completed'),
        sql`${bookings.createdAt} >= ${thirtyDaysAgo.toISOString()}`
      ));

    // Get average rating from bookings 30-60 days ago
    const [previousRatingResult] = await db
      .select({ 
        avg: sql<string>`COALESCE(AVG(${drivers.rating}), 0)` 
      })
      .from(drivers)
      .innerJoin(bookings, eq(bookings.driverId, drivers.id))
      .where(and(
        eq(drivers.verificationStatus, 'verified'),
        eq(bookings.status, 'completed'),
        sql`${bookings.createdAt} >= ${sixtyDaysAgo.toISOString()}`,
        sql`${bookings.createdAt} < ${thirtyDaysAgo.toISOString()}`
      ));

    // Calculate rating improvement (comparing recent 30 days vs previous 30 days)
    const recentRating = parseFloat(recentRatingResult?.avg || '0');
    const previousRating = parseFloat(previousRatingResult?.avg || '0');
    let ratingImprovement = '0';
    // Only show improvement if we have data from both periods
    if (recentRating > 0 && previousRating > 0) {
      ratingImprovement = (recentRating - previousRating).toFixed(1);
    }

    return {
      totalRevenue: revenueResult?.total || '0',
      activeBookings: activeBookingsResult?.count || 0,
      activeDrivers: activeDriversResult?.count || 0,
      averageRating: ratingResult?.avg || '0',
      pendingBookings: pendingBookingsResult?.count || 0,
      pendingDrivers: pendingDriversResult?.count || 0,
      revenueGrowth,
      ratingImprovement,
    };
  }

  async updateStripeCustomerId(userId: string, customerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeInfo: { customerId: string; subscriptionId: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId: stripeInfo.customerId,
        stripeSubscriptionId: stripeInfo.subscriptionId,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Pricing rules methods
  async getPricingRules(): Promise<PricingRule[]> {
    return await db.select().from(pricingRules).orderBy(pricingRules.vehicleType, pricingRules.serviceType);
  }

  async getPricingRule(id: string): Promise<PricingRule | undefined> {
    const [rule] = await db.select().from(pricingRules).where(eq(pricingRules.id, id));
    return rule;
  }

  async getPricingRuleByType(vehicleType: string, serviceType: string): Promise<PricingRule | undefined> {
    const [rule] = await db
      .select()
      .from(pricingRules)
      .where(
        and(
          sql`${pricingRules.vehicleType} = ${vehicleType}`,
          sql`${pricingRules.serviceType} = ${serviceType}`,
          eq(pricingRules.isActive, true)
        )
      );
    return rule;
  }

  async createPricingRule(rule: InsertPricingRule): Promise<PricingRule> {
    const [newRule] = await db.insert(pricingRules).values(rule).returning();
    return newRule;
  }

  async updatePricingRule(id: string, rule: Partial<InsertPricingRule>): Promise<PricingRule | undefined> {
    const [updatedRule] = await db
      .update(pricingRules)
      .set({ ...rule, updatedAt: new Date() })
      .where(eq(pricingRules.id, id))
      .returning();
    return updatedRule;
  }

  async deletePricingRule(id: string): Promise<void> {
    await db.delete(pricingRules).where(eq(pricingRules.id, id));
  }

  // Payment Systems methods
  async getPaymentSystems(): Promise<PaymentSystem[]> {
    return await db.select().from(paymentSystems).orderBy(sql`${paymentSystems.provider}`);
  }

  async getPaymentSystem(provider: string): Promise<PaymentSystem | undefined> {
    const [system] = await db.select().from(paymentSystems).where(sql`${paymentSystems.provider} = ${provider}`);
    return system;
  }

  async getActivePaymentSystem(): Promise<PaymentSystem | undefined> {
    const [system] = await db.select().from(paymentSystems).where(eq(paymentSystems.isActive, true));
    return system;
  }

  async createPaymentSystem(system: InsertPaymentSystem): Promise<PaymentSystem> {
    const [newSystem] = await db.insert(paymentSystems).values(system).returning();
    return newSystem;
  }

  async updatePaymentSystem(provider: string, updates: Partial<InsertPaymentSystem>): Promise<PaymentSystem | undefined> {
    const [updatedSystem] = await db
      .update(paymentSystems)
      .set({ ...updates, updatedAt: new Date() })
      .where(sql`${paymentSystems.provider} = ${provider}`)
      .returning();
    return updatedSystem;
  }

  async setActivePaymentSystem(provider: string): Promise<void> {
    await db.update(paymentSystems).set({ isActive: false });
    await db.update(paymentSystems).set({ isActive: true }).where(sql`${paymentSystems.provider} = ${provider}`);
  }

  async deletePaymentSystem(provider: string): Promise<void> {
    await db.delete(paymentSystems).where(sql`${paymentSystems.provider} = ${provider}`);
  }
}

export const storage = new DatabaseStorage();
