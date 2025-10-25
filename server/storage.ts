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
  type DriverDocument,
  type InsertDriverDocument,
  driverDocuments,
  type DriverRating,
  type InsertDriverRating,
  driverRatings,
  type CmsSetting,
  type InsertCmsSetting,
  cmsSettings,
  type CmsContent,
  type InsertCmsContent,
  cmsContent,
  type CmsMedia,
  type InsertCmsMedia,
  cmsMedia,
  type CmsSettingCategory,
  type ContentBlockType,
  type MediaFolder,
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
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Driver operations
  createDriver(driver: InsertDriver): Promise<Driver>;
  getDriver(id: string): Promise<Driver | undefined>;
  getDriverByUserId(userId: string): Promise<Driver | undefined>;
  updateDriver(id: string, updates: Partial<Driver>): Promise<Driver | undefined>;
  updateDriverVerificationStatus(id: string, status: string): Promise<void>;
  updateDriverAvailability(id: string, isAvailable: boolean): Promise<Driver | undefined>;
  updateDriverLocation(id: string, location: string): Promise<Driver | undefined>;
  getAvailableDrivers(): Promise<Driver[]>;
  getAllDrivers(): Promise<Driver[]>;
  
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
  updateBookingDriverPayment(id: string, driverPayment: string): Promise<Booking | undefined>;
  updateBooking(id: string, updates: Partial<InsertBooking>): Promise<Booking | undefined>;
  deleteBooking(id: string): Promise<void>;
  
  // Saved addresses
  createSavedAddress(address: InsertSavedAddress): Promise<SavedAddress>;
  getSavedAddressesByUser(userId: string): Promise<SavedAddress[]>;
  deleteSavedAddress(id: string, userId: string): Promise<void>;
  
  // System settings
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  getAllSystemSettings(): Promise<SystemSetting[]>;
  updateSystemSetting(key: string, value: string, userId: string): Promise<void>;
  deleteSystemSetting(key: string): Promise<void>;
  getSetting(key: string): Promise<SystemSetting | undefined>;
  setSetting(key: string, value: string, userId: string): Promise<void>;
  
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
    totalCommission: string;
    activeBookings: number;
    totalDrivers: number;
    activeDrivers: number;
    averageRating: string;
    pendingBookings: number;
    pendingDrivers: number;
    revenueGrowth: string;
    ratingImprovement: string;
  }>;
  
  // Dispatcher dashboard data
  getDispatcherDashboardStats(): Promise<{
    activeDrivers: number;
    activeRides: number;
    pendingRequests: number;
    fleetUtilization: string;
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
  
  // Driver Documents
  createDriverDocument(doc: InsertDriverDocument): Promise<DriverDocument>;
  getDriverDocuments(driverId: string): Promise<DriverDocument[]>;
  getDriverDocument(id: string): Promise<DriverDocument | undefined>;
  updateDriverDocumentStatus(id: string, status: string, rejectionReason?: string, reviewedBy?: string): Promise<DriverDocument | undefined>;
  deleteDriverDocument(id: string): Promise<boolean>;
  
  // Driver Ratings
  createDriverRating(rating: InsertDriverRating): Promise<DriverRating>;
  getDriverRatings(driverId: string): Promise<DriverRating[]>;
  getBookingRating(bookingId: string): Promise<DriverRating | undefined>;
  getDriverAverageRating(driverId: string): Promise<number>;
  
  // Admin Bookings Management
  getAllBookingsWithDetails(): Promise<any[]>;
  getActiveDrivers(): Promise<any[]>;
  assignDriverToBooking(bookingId: string, driverId: string, driverPayment?: string): Promise<Booking>;
  
  // CMS Settings
  getCmsSettings(): Promise<CmsSetting[]>;
  getCmsSetting(key: string): Promise<CmsSetting | undefined>;
  getCmsSettingsByCategory(category: CmsSettingCategory): Promise<CmsSetting[]>;
  upsertCmsSetting(setting: InsertCmsSetting): Promise<CmsSetting>;
  deleteCmsSetting(key: string): Promise<void>;
  
  // CMS Content
  getCmsContent(activeOnly?: boolean): Promise<CmsContent[]>;
  getCmsContentById(id: string): Promise<CmsContent | undefined>;
  getCmsContentByType(blockType: ContentBlockType, activeOnly?: boolean): Promise<CmsContent[]>;
  getCmsContentByIdentifier(identifier: string): Promise<CmsContent | undefined>;
  createCmsContent(content: InsertCmsContent): Promise<CmsContent>;
  updateCmsContent(id: string, updates: Partial<InsertCmsContent>): Promise<CmsContent | undefined>;
  deleteCmsContent(id: string): Promise<void>;
  
  // CMS Media
  getCmsMedia(): Promise<CmsMedia[]>;
  getCmsMediaById(id: string): Promise<CmsMedia | undefined>;
  getCmsMediaByFolder(folder: MediaFolder): Promise<CmsMedia[]>;
  createCmsMedia(media: InsertCmsMedia): Promise<CmsMedia>;
  updateCmsMedia(id: string, updates: Partial<InsertCmsMedia>): Promise<CmsMedia | undefined>;
  deleteCmsMedia(id: string): Promise<void>;
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

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    return result.length > 0;
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

  async updateDriverAvailability(id: string, isAvailable: boolean): Promise<Driver | undefined> {
    const [updated] = await db
      .update(drivers)
      .set({ isAvailable, updatedAt: new Date() })
      .where(eq(drivers.id, id))
      .returning();
    return updated;
  }

  async updateDriverLocation(id: string, location: string): Promise<Driver | undefined> {
    const [updated] = await db
      .update(drivers)
      .set({ currentLocation: location, updatedAt: new Date() })
      .where(eq(drivers.id, id))
      .returning();
    return updated;
  }

  async updateDriver(id: string, updates: Partial<Driver>): Promise<Driver | undefined> {
    const [updated] = await db
      .update(drivers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(drivers.id, id))
      .returning();
    return updated;
  }

  async getAvailableDrivers(): Promise<Driver[]> {
    return await db
      .select()
      .from(drivers)
      .where(and(eq(drivers.isAvailable, true), eq(drivers.verificationStatus, 'verified')));
  }

  async getAllDrivers(): Promise<Driver[]> {
    return await db.select().from(drivers);
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

  async updateBookingDriverPayment(id: string, driverPayment: string): Promise<Booking | undefined> {
    const [updated] = await db
      .update(bookings)
      .set({ 
        driverPayment, 
        updatedAt: new Date() 
      })
      .where(eq(bookings.id, id))
      .returning();
    return updated;
  }

  async updateBooking(id: string, updates: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async deleteBooking(id: string): Promise<void> {
    await db.delete(bookings).where(eq(bookings.id, id));
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

  async getSetting(key: string): Promise<SystemSetting | undefined> {
    return this.getSystemSetting(key);
  }

  async setSetting(key: string, value: string, userId: string): Promise<void> {
    // userId is required - caller must provide the authenticated user ID
    if (!userId) {
      throw new Error('userId is required for setting system settings');
    }
    return this.updateSystemSetting(key, value, userId);
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
    totalCommission: string;
    activeBookings: number;
    totalDrivers: number;
    activeDrivers: number;
    averageRating: string;
    pendingBookings: number;
    pendingDrivers: number;
    revenueGrowth: string;
    ratingImprovement: string;
  }> {
    // Get system commission percentage
    const commissionSetting = await this.getSystemSetting('SYSTEM_COMMISSION_PERCENTAGE');
    const commissionPercentage = parseFloat(commissionSetting?.value || '0');

    // Total revenue from all completed bookings
    const [revenueResult] = await db
      .select({ 
        total: sql<string>`COALESCE(SUM(${bookings.totalAmount}), 0)` 
      })
      .from(bookings)
      .where(eq(bookings.status, 'completed'));

    // Calculate total commission based on system commission percentage
    const totalRevenue = parseFloat(revenueResult?.total || '0');
    const totalCommission = (totalRevenue * (commissionPercentage / 100)).toFixed(2);

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

    // Total drivers count
    const [totalDriversResult] = await db
      .select({ 
        count: sql<number>`COUNT(*)` 
      })
      .from(drivers);

    // Active drivers count (user active + all documents approved and not expired)
    const [activeDriversResult] = await db
      .select({ 
        count: sql<number>`COUNT(DISTINCT ${drivers.id})` 
      })
      .from(drivers)
      .innerJoin(users, eq(users.id, drivers.userId))
      .leftJoin(driverDocuments, eq(driverDocuments.driverId, drivers.id))
      .where(
        and(
          eq(users.isActive, true),
          // Check that driver has all 4 required approved documents
          sql`EXISTS (
            SELECT 1 FROM ${driverDocuments} dd1 
            WHERE dd1.driver_id = ${drivers.id} 
            AND dd1.document_type = 'driver_license' 
            AND dd1.status = 'approved'
            AND (dd1.expiration_date IS NULL OR dd1.expiration_date >= NOW())
          )`,
          sql`EXISTS (
            SELECT 1 FROM ${driverDocuments} dd2 
            WHERE dd2.driver_id = ${drivers.id} 
            AND dd2.document_type = 'limo_license' 
            AND dd2.status = 'approved'
            AND (dd2.expiration_date IS NULL OR dd2.expiration_date >= NOW())
          )`,
          sql`EXISTS (
            SELECT 1 FROM ${driverDocuments} dd3 
            WHERE dd3.driver_id = ${drivers.id} 
            AND dd3.document_type = 'insurance_certificate' 
            AND dd3.status = 'approved'
            AND (dd3.expiration_date IS NULL OR dd3.expiration_date >= NOW())
          )`,
          sql`EXISTS (
            SELECT 1 FROM ${driverDocuments} dd4 
            WHERE dd4.driver_id = ${drivers.id} 
            AND dd4.document_type = 'vehicle_image' 
            AND dd4.status = 'approved'
          )`
        )
      );

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
      totalCommission,
      activeBookings: activeBookingsResult?.count || 0,
      totalDrivers: totalDriversResult?.count || 0,
      activeDrivers: activeDriversResult?.count || 0,
      averageRating: ratingResult?.avg || '0',
      pendingBookings: pendingBookingsResult?.count || 0,
      pendingDrivers: pendingDriversResult?.count || 0,
      revenueGrowth,
      ratingImprovement,
    };
  }

  async getDispatcherDashboardStats(): Promise<{
    activeDrivers: number;
    activeRides: number;
    pendingRequests: number;
    fleetUtilization: string;
  }> {
    // Active drivers count (drivers who are available and fully verified)
    const [activeDriversResult] = await db
      .select({ 
        count: sql<number>`COUNT(*)` 
      })
      .from(drivers)
      .innerJoin(users, eq(users.id, drivers.userId))
      .where(
        and(
          eq(users.isActive, true),
          eq(drivers.isAvailable, true),
          eq(drivers.verificationStatus, 'verified')
        )
      );

    // Active rides count (bookings currently in progress)
    const [activeRidesResult] = await db
      .select({ 
        count: sql<number>`COUNT(*)` 
      })
      .from(bookings)
      .where(eq(bookings.status, 'in_progress'));

    // Pending requests count (bookings waiting to be assigned)
    const [pendingRequestsResult] = await db
      .select({ 
        count: sql<number>`COUNT(*)` 
      })
      .from(bookings)
      .where(eq(bookings.status, 'pending'));

    // Fleet utilization calculation
    // Total active vehicles
    const [totalActiveVehiclesResult] = await db
      .select({ 
        count: sql<number>`COUNT(*)` 
      })
      .from(vehicles)
      .where(eq(vehicles.isActive, true));

    // Vehicles currently in use (assigned to in-progress bookings)
    const [vehiclesInUseResult] = await db
      .select({ 
        count: sql<number>`COUNT(DISTINCT ${vehicles.id})` 
      })
      .from(vehicles)
      .innerJoin(bookings, eq(bookings.vehicleId, vehicles.id))
      .where(
        and(
          eq(vehicles.isActive, true),
          eq(bookings.status, 'in_progress')
        )
      );

    const totalVehicles = totalActiveVehiclesResult?.count || 0;
    const vehiclesInUse = vehiclesInUseResult?.count || 0;
    const utilization = totalVehicles > 0 
      ? ((vehiclesInUse / totalVehicles) * 100).toFixed(0) 
      : '0';

    return {
      activeDrivers: activeDriversResult?.count || 0,
      activeRides: activeRidesResult?.count || 0,
      pendingRequests: pendingRequestsResult?.count || 0,
      fleetUtilization: `${utilization}%`,
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

  async createDriverDocument(doc: InsertDriverDocument): Promise<DriverDocument> {
    const [newDoc] = await db.insert(driverDocuments).values(doc).returning();
    return newDoc;
  }

  async getDriverDocuments(driverId: string): Promise<DriverDocument[]> {
    return await db
      .select()
      .from(driverDocuments)
      .where(eq(driverDocuments.driverId, driverId))
      .orderBy(desc(driverDocuments.uploadedAt));
  }

  async getDriverDocument(id: string): Promise<DriverDocument | undefined> {
    const [doc] = await db.select().from(driverDocuments).where(eq(driverDocuments.id, id));
    return doc;
  }

  async updateDriverDocumentStatus(
    id: string, 
    status: string, 
    rejectionReason?: string,
    reviewedBy?: string
  ): Promise<DriverDocument | undefined> {
    const [updatedDoc] = await db
      .update(driverDocuments)
      .set({ 
        status: status as any,
        rejectionReason,
        reviewedBy,
        reviewedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(driverDocuments.id, id))
      .returning();
    return updatedDoc;
  }

  async deleteDriverDocument(id: string): Promise<boolean> {
    const result = await db
      .delete(driverDocuments)
      .where(eq(driverDocuments.id, id))
      .returning();
    return result.length > 0;
  }

  // Driver Ratings methods
  async createDriverRating(rating: InsertDriverRating): Promise<DriverRating> {
    const [newRating] = await db.insert(driverRatings).values(rating).returning();
    
    // Update driver's average rating
    const avgResult = await db
      .select({ avg: sql<string>`AVG(${driverRatings.rating})` })
      .from(driverRatings)
      .where(eq(driverRatings.driverId, rating.driverId));
    
    if (avgResult[0]?.avg) {
      await db
        .update(drivers)
        .set({ rating: avgResult[0].avg })
        .where(eq(drivers.id, rating.driverId));
    }
    
    return newRating;
  }

  async getDriverRatings(driverId: string): Promise<DriverRating[]> {
    return await db
      .select()
      .from(driverRatings)
      .where(eq(driverRatings.driverId, driverId))
      .orderBy(desc(driverRatings.createdAt));
  }

  async getBookingRating(bookingId: string): Promise<DriverRating | undefined> {
    const [rating] = await db
      .select()
      .from(driverRatings)
      .where(eq(driverRatings.bookingId, bookingId));
    return rating;
  }

  async getDriverAverageRating(driverId: string): Promise<number> {
    const [result] = await db
      .select({ avg: sql<string>`COALESCE(AVG(${driverRatings.rating}), 0)` })
      .from(driverRatings)
      .where(eq(driverRatings.driverId, driverId));
    return parseFloat(result?.avg || '0');
  }

  async getAllBookingsWithDetails(): Promise<any[]> {
    const allBookings = await db
      .select({
        id: bookings.id,
        passengerId: bookings.passengerId,
        driverId: bookings.driverId,
        vehicleTypeId: bookings.vehicleTypeId,
        bookingType: bookings.bookingType,
        status: bookings.status,
        pickupAddress: bookings.pickupAddress,
        destinationAddress: bookings.destinationAddress,
        scheduledDateTime: bookings.scheduledDateTime,
        totalAmount: bookings.totalAmount,
        driverPayment: bookings.driverPayment,
        paymentStatus: bookings.paymentStatus,
        specialInstructions: bookings.specialInstructions,
        createdAt: bookings.createdAt,
        passengerFirstName: users.firstName,
        passengerLastName: users.lastName,
        requestedHours: bookings.requestedHours,
        bookingFor: bookings.bookingFor,
        passengerName: bookings.passengerName,
        passengerPhone: bookings.passengerPhone,
        passengerEmail: bookings.passengerEmail,
        passengerCount: bookings.passengerCount,
        luggageCount: bookings.luggageCount,
        babySeat: bookings.babySeat,
        flightNumber: bookings.flightNumber,
        flightAirline: bookings.flightAirline,
        flightDepartureAirport: bookings.flightDepartureAirport,
        flightArrivalAirport: bookings.flightArrivalAirport,
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.passengerId, users.id))
      .orderBy(desc(bookings.createdAt));

    // Fetch driver details for bookings with assigned drivers
    const bookingsWithDriverDetails = await Promise.all(
      allBookings.map(async (booking) => {
        let driverFirstName = null;
        let driverLastName = null;
        let driverPhone = null;
        let driverProfileImageUrl = null;
        let driverVehiclePlate = null;
        
        if (booking.driverId) {
          const driver = await this.getDriver(booking.driverId);
          if (driver) {
            const driverUser = await this.getUser(driver.userId);
            if (driverUser) {
              driverFirstName = driverUser.firstName;
              driverLastName = driverUser.lastName;
              driverPhone = driverUser.phone;
              driverProfileImageUrl = driverUser.profileImageUrl;
            }
            
            // Get driver's vehicle plate from drivers table
            driverVehiclePlate = driver.vehiclePlate;
          }
        }
        
        return {
          ...booking,
          passengerName: `${booking.passengerFirstName || ''} ${booking.passengerLastName || ''}`.trim(),
          driverFirstName,
          driverLastName,
          driverPhone,
          driverProfileImageUrl,
          driverVehiclePlate,
        };
      })
    );

    return bookingsWithDriverDetails;
  }

  async getActiveDrivers(): Promise<any[]> {
    const activeDriversData = await db
      .select({
        id: drivers.id,
        userId: drivers.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(drivers)
      .innerJoin(users, eq(drivers.userId, users.id))
      .where(eq(users.isActive, true));

    return activeDriversData;
  }

  async assignDriverToBooking(bookingId: string, driverId: string, driverPayment?: string): Promise<Booking> {
    // Get the booking first
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    let finalDriverPayment: string;
    
    if (driverPayment) {
      // Use manually provided driver payment
      finalDriverPayment = driverPayment;
    } else {
      // Auto-calculate driver payment using system commission settings
      const commissionSetting = await this.getSystemSetting('SYSTEM_COMMISSION_PERCENTAGE');
      const commissionPercentage = parseFloat(commissionSetting?.value || '30');
      const totalAmount = parseFloat(booking.totalAmount || '0');
      const calculatedPayment = totalAmount * (1 - commissionPercentage / 100);
      finalDriverPayment = calculatedPayment.toFixed(2);
    }
    
    const [updatedBooking] = await db
      .update(bookings)
      .set({ 
        driverId,
        driverPayment: finalDriverPayment,
        assignedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId))
      .returning();
    
    if (!updatedBooking) {
      throw new Error('Booking not found');
    }
    
    return updatedBooking;
  }

  // CMS Settings Methods
  async getCmsSettings(): Promise<CmsSetting[]> {
    return await db.select().from(cmsSettings).orderBy(cmsSettings.key);
  }

  async getCmsSetting(key: string): Promise<CmsSetting | undefined> {
    const [setting] = await db.select().from(cmsSettings).where(eq(cmsSettings.key, key));
    return setting;
  }

  async getCmsSettingsByCategory(category: CmsSettingCategory): Promise<CmsSetting[]> {
    return await db.select().from(cmsSettings).where(eq(cmsSettings.category, category));
  }

  async upsertCmsSetting(setting: InsertCmsSetting): Promise<CmsSetting> {
    const [result] = await db
      .insert(cmsSettings)
      .values({
        ...setting,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: cmsSettings.key,
        set: {
          value: setting.value,
          category: setting.category,
          description: setting.description,
          updatedBy: setting.updatedBy,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async deleteCmsSetting(key: string): Promise<void> {
    await db.delete(cmsSettings).where(eq(cmsSettings.key, key));
  }

  // CMS Content Methods
  async getCmsContent(activeOnly: boolean = false): Promise<CmsContent[]> {
    const query = db.select().from(cmsContent);
    if (activeOnly) {
      return await query.where(eq(cmsContent.isActive, true)).orderBy(cmsContent.sortOrder);
    }
    return await query.orderBy(cmsContent.sortOrder);
  }

  async getCmsContentById(id: string): Promise<CmsContent | undefined> {
    const [content] = await db.select().from(cmsContent).where(eq(cmsContent.id, id));
    return content;
  }

  async getCmsContentByType(blockType: ContentBlockType, activeOnly: boolean = false): Promise<CmsContent[]> {
    if (activeOnly) {
      return await db.select().from(cmsContent).where(and(eq(cmsContent.blockType, blockType), eq(cmsContent.isActive, true))).orderBy(cmsContent.sortOrder);
    }
    return await db.select().from(cmsContent).where(eq(cmsContent.blockType, blockType)).orderBy(cmsContent.sortOrder);
  }

  async getCmsContentByIdentifier(identifier: string): Promise<CmsContent | undefined> {
    const [content] = await db.select().from(cmsContent).where(eq(cmsContent.identifier, identifier));
    return content;
  }

  async createCmsContent(content: InsertCmsContent): Promise<CmsContent> {
    const [result] = await db.insert(cmsContent).values({
      ...content,
      updatedAt: new Date(),
    }).returning();
    return result;
  }

  async updateCmsContent(id: string, updates: Partial<InsertCmsContent>): Promise<CmsContent | undefined> {
    const [result] = await db
      .update(cmsContent)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(cmsContent.id, id))
      .returning();
    return result;
  }

  async deleteCmsContent(id: string): Promise<void> {
    await db.delete(cmsContent).where(eq(cmsContent.id, id));
  }

  // CMS Media Methods
  async getCmsMedia(): Promise<CmsMedia[]> {
    return await db.select().from(cmsMedia).orderBy(desc(cmsMedia.uploadedAt));
  }

  async getCmsMediaById(id: string): Promise<CmsMedia | undefined> {
    const [media] = await db.select().from(cmsMedia).where(eq(cmsMedia.id, id));
    return media;
  }

  async getCmsMediaByFolder(folder: MediaFolder): Promise<CmsMedia[]> {
    return await db.select().from(cmsMedia).where(eq(cmsMedia.folder, folder)).orderBy(desc(cmsMedia.uploadedAt));
  }

  async createCmsMedia(media: InsertCmsMedia): Promise<CmsMedia> {
    const [result] = await db.insert(cmsMedia).values({
      ...media,
      uploadedAt: new Date(),
    }).returning();
    return result;
  }

  async updateCmsMedia(id: string, updates: Partial<InsertCmsMedia>): Promise<CmsMedia | undefined> {
    const [result] = await db
      .update(cmsMedia)
      .set(updates)
      .where(eq(cmsMedia.id, id))
      .returning();
    return result;
  }

  async deleteCmsMedia(id: string): Promise<void> {
    await db.delete(cmsMedia).where(eq(cmsMedia.id, id));
  }
}

export const storage = new DatabaseStorage();
