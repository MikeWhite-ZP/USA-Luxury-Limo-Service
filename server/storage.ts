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
  passwordResetTokens,
  services,
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
  type InsertVehicleType,
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
  type Service,
  type InsertService,
  type CmsSettingCategory,
  type ContentBlockType,
  type MediaFolder,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  paymentTokens,
  type PaymentToken,
  type InsertPaymentToken,
  driverMessages,
  type DriverMessage,
  type InsertDriverMessage,
  emergencyIncidents,
  type EmergencyIncident,
  type InsertEmergencyIncident,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, like, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import { encrypt, decrypt } from './crypto';

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
  createVehicleType(vehicleType: InsertVehicleType): Promise<VehicleType>;
  updateVehicleType(id: string, updates: Partial<InsertVehicleType>): Promise<VehicleType | undefined>;
  deleteVehicleType(id: string): Promise<void>;
  createVehicle(vehicle: Omit<Vehicle, 'id' | 'createdAt'>): Promise<Vehicle>;
  getVehiclesByDriver(driverId: string): Promise<Vehicle[]>;
  
  // Service operations (CMS)
  getActiveServices(): Promise<Service[]>;
  getAllServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, updates: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string): Promise<void>;
  
  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByUser(userId: string): Promise<Booking[]>;
  getBookingsByDriver(driverId: string): Promise<Booking[]>;
  getAllBookings(): Promise<Booking[]>;
  updateBookingStatus(id: string, status: string): Promise<void>;
  updateBookingPayment(id: string, paymentIntentId: string, status: string): Promise<void>;
  updateBookingDriverPayment(id: string, driverPayment: string): Promise<Booking | undefined>;
  updateBooking(id: string, updates: Partial<InsertBooking>): Promise<Booking | undefined>;
  deleteBooking(id: string): Promise<void>;
  addAdditionalCharge(bookingId: string, charge: { description: string; amount: number; addedBy: string }): Promise<Booking | undefined>;
  
  // Saved addresses
  createSavedAddress(address: InsertSavedAddress): Promise<SavedAddress>;
  getSavedAddressesByUser(userId: string): Promise<SavedAddress[]>;
  deleteSavedAddress(id: string, userId: string): Promise<void>;
  
  // System settings
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  getSystemSettingValue(key: string): Promise<string | null>;
  getAllSystemSettings(): Promise<SystemSetting[]>;
  updateSystemSetting(key: string, value: string, userId: string): Promise<void>;
  updateEncryptedSetting(key: string, value: string, userId: string, description?: string): Promise<void>;
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
  getAllInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  updateInvoice(id: string, updates: Partial<Omit<Invoice, 'id' | 'createdAt'>>): Promise<Invoice | undefined>;
  deleteInvoice(id: string): Promise<void>;
  backfillInvoices(): Promise<{ total: number; created: number; skipped: number; errors: number; errorDetails?: string[] }>;
  
  // Admin dashboard data
  getAdminDashboardStats(): Promise<{
    totalRevenue: string;
    monthlyRevenue: string;
    totalCommission: string;
    monthlyCommission: string;
    activeBookings: number;
    totalDrivers: number;
    activeDrivers: number;
    averageRating: string;
    pendingBookings: number;
    pendingDrivers: number;
    awaitingDriverApproval: number;
    revenueGrowth: string;
    ratingImprovement: string;
  }>;
  
  // Dispatcher dashboard data
  getDispatcherDashboardStats(): Promise<{
    activeDrivers: number;
    activeRides: number;
    pendingRequests: number;
    pendingApprovals: number;
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
  
  // Password Reset Tokens
  createPasswordResetToken(data: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenAsUsed(token: string): Promise<void>;
  
  // Payment Tokens
  createPaymentToken(data: InsertPaymentToken): Promise<PaymentToken>;
  getPaymentToken(token: string): Promise<PaymentToken | undefined>;
  markPaymentTokenAsUsed(token: string): Promise<void>;
  cleanupExpiredPaymentTokens(): Promise<void>;
  
  // Driver Messages
  createDriverMessage(message: InsertDriverMessage): Promise<DriverMessage>;
  getDriverMessages(driverId?: string): Promise<DriverMessage[]>;
  getDriverMessage(id: string): Promise<DriverMessage | undefined>;
  updateDriverMessageStatus(id: string, status: string, sentAt?: Date, deliveredAt?: Date, errorMessage?: string): Promise<DriverMessage | undefined>;
  
  // Emergency Incidents
  createEmergencyIncident(incident: InsertEmergencyIncident): Promise<EmergencyIncident>;
  getEmergencyIncidents(status?: string): Promise<EmergencyIncident[]>;
  getEmergencyIncident(id: string): Promise<EmergencyIncident | undefined>;
  updateEmergencyIncident(id: string, updates: Partial<EmergencyIncident>): Promise<EmergencyIncident | undefined>;
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
    try {
      // Get all user bookings to delete related data
      const userBookings = await db
        .select({ id: bookings.id })
        .from(bookings)
        .where(eq(bookings.passengerId, id));
      
      const bookingIds = userBookings.map(b => b.id);
      
      // Get driver info if user is a driver
      const driver = await this.getDriverByUserId(id);
      let driverBookingIds: string[] = [];
      
      if (driver) {
        const driverBookings = await db
          .select({ id: bookings.id })
          .from(bookings)
          .where(eq(bookings.driverId, driver.id));
        driverBookingIds = driverBookings.map(b => b.id);
      }
      
      // Combine all booking IDs to delete
      const allBookingIds = Array.from(new Set([...bookingIds, ...driverBookingIds]));
      
      // Delete in correct order to respect foreign key constraints
      
      // 1. Delete payment tokens for all invoices related to bookings
      for (const bookingId of allBookingIds) {
        const bookingInvoices = await db
          .select({ id: invoices.id })
          .from(invoices)
          .where(eq(invoices.bookingId, bookingId));
        
        for (const invoice of bookingInvoices) {
          await db.delete(paymentTokens).where(eq(paymentTokens.invoiceId, invoice.id));
        }
      }
      
      // 2. Delete invoices for all bookings
      for (const bookingId of allBookingIds) {
        await db.delete(invoices).where(eq(invoices.bookingId, bookingId));
      }
      
      // 3. Delete driver ratings for all bookings
      for (const bookingId of allBookingIds) {
        await db.delete(driverRatings).where(eq(driverRatings.bookingId, bookingId));
      }
      
      // 4. Nullify emergency incident references
      for (const bookingId of allBookingIds) {
        await db
          .update(emergencyIncidents)
          .set({ bookingId: null })
          .where(eq(emergencyIncidents.bookingId, bookingId));
      }
      
      // Nullify emergency incident driverId references for this user
      await db
        .update(emergencyIncidents)
        .set({ driverId: null })
        .where(eq(emergencyIncidents.driverId, id));
      
      // Delete emergency incidents reported by this user (reporterId is required, can't be null)
      await db.delete(emergencyIncidents).where(eq(emergencyIncidents.reporterId, id));
      
      // Nullify emergency incident assignedTo references for this user
      await db
        .update(emergencyIncidents)
        .set({ assignedTo: null })
        .where(eq(emergencyIncidents.assignedTo, id));
      
      // 5. Delete driver messages sent by or to this user
      await db.delete(driverMessages).where(eq(driverMessages.senderId, id));
      await db.delete(driverMessages).where(eq(driverMessages.driverId, id));
      
      // 6. Delete saved addresses
      await db.delete(savedAddresses).where(eq(savedAddresses.userId, id));
      
      // 7. Delete password reset tokens
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, id));
      
      // 8. Nullify references in driver documents (reviewedBy)
      await db
        .update(driverDocuments)
        .set({ reviewedBy: null })
        .where(eq(driverDocuments.reviewedBy, id));
      
      // 9. Nullify references in system settings (updatedBy)
      await db
        .update(systemSettings)
        .set({ updatedBy: null })
        .where(eq(systemSettings.updatedBy, id));
      
      // 10. Nullify references in CMS settings (updatedBy)
      await db
        .update(cmsSettings)
        .set({ updatedBy: null })
        .where(eq(cmsSettings.updatedBy, id));
      
      // 11. Nullify references in CMS content (updatedBy)
      await db
        .update(cmsContent)
        .set({ updatedBy: null })
        .where(eq(cmsContent.updatedBy, id));
      
      // 12. Delete CMS media uploaded by this user
      await db.delete(cmsMedia).where(eq(cmsMedia.uploadedBy, id));
      
      // 13. Delete all bookings
      for (const bookingId of allBookingIds) {
        await db.delete(bookings).where(eq(bookings.id, bookingId));
      }
      
      // 14. If user is a driver, delete driver-specific data
      if (driver) {
        // Delete driver documents
        await db.delete(driverDocuments).where(eq(driverDocuments.driverId, driver.id));
        
        // Delete driver record
        await db.delete(drivers).where(eq(drivers.id, driver.id));
      }
      
      // 15. Finally, delete the user
      const result = await db
        .delete(users)
        .where(eq(users.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
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

  async getAllVehicleTypes(): Promise<VehicleType[]> {
    return await db
      .select()
      .from(vehicleTypes)
      .orderBy(vehicleTypes.hourlyRate);
  }

  async getVehicleType(id: string): Promise<VehicleType | undefined> {
    const [vehicleType] = await db.select().from(vehicleTypes).where(eq(vehicleTypes.id, id));
    return vehicleType;
  }

  async createVehicleType(vehicleTypeData: InsertVehicleType): Promise<VehicleType> {
    const [vehicleType] = await db
      .insert(vehicleTypes)
      .values(vehicleTypeData)
      .returning();
    return vehicleType;
  }

  async updateVehicleType(id: string, updates: Partial<InsertVehicleType>): Promise<VehicleType | undefined> {
    const [updated] = await db
      .update(vehicleTypes)
      .set(updates)
      .where(eq(vehicleTypes.id, id))
      .returning();
    return updated;
  }

  async deleteVehicleType(id: string): Promise<void> {
    await db.delete(vehicleTypes).where(eq(vehicleTypes.id, id));
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

  // Service operations (CMS)
  async getActiveServices(): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(eq(services.isActive, true))
      .orderBy(services.displayOrder);
  }

  async getAllServices(): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .orderBy(services.displayOrder);
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(serviceData: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values(serviceData)
      .returning();
    return service;
  }

  async updateService(id: string, updates: Partial<InsertService>): Promise<Service | undefined> {
    const [updated] = await db
      .update(services)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return updated;
  }

  async deleteService(id: string): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const [booking] = await db
      .insert(bookings)
      .values(bookingData)
      .returning();
    
    // Auto-create invoice for this booking
    // If invoice creation fails, rollback the booking to maintain consistency
    try {
      const invoice = await this.createInvoiceForBooking(booking);
      if (!invoice) {
        throw new Error('Invoice creation returned undefined');
      }
    } catch (error) {
      // Delete the booking if invoice creation failed
      await db.delete(bookings).where(eq(bookings.id, booking.id));
      throw new Error(`Failed to create invoice for booking: ${error instanceof Error ? error.message : String(error)}`);
    }
    
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

  async getAllBookings(): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
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
    
    // If pricing fields were updated, sync the invoice
    // If sync fails, we need to ensure data integrity
    if (booking && (updates.totalAmount !== undefined || updates.baseFare !== undefined || 
        updates.distanceFare !== undefined || updates.timeFare !== undefined || 
        updates.surcharges !== undefined || updates.paymentStatus !== undefined)) {
      await this.syncInvoiceWithBooking(booking);
    }
    
    return booking;
  }

  async deleteBooking(id: string): Promise<void> {
    // Delete related records first to avoid foreign key constraint violations
    // Delete invoices
    await db.delete(invoices).where(eq(invoices.bookingId, id));
    
    // Delete driver ratings
    await db.delete(driverRatings).where(eq(driverRatings.bookingId, id));
    
    // Delete emergency incidents
    await db.delete(emergencyIncidents).where(eq(emergencyIncidents.bookingId, id));
    
    // Finally, delete the booking
    await db.delete(bookings).where(eq(bookings.id, id));
  }

  async addAdditionalCharge(
    bookingId: string, 
    charge: { description: string; amount: number; addedBy: string }
  ): Promise<Booking | undefined> {
    const booking = await this.getBooking(bookingId);
    if (!booking) return undefined;

    const existingSurcharges = (booking.surcharges as any) || [];
    const newSurcharges = [
      ...existingSurcharges,
      {
        ...charge,
        addedAt: new Date().toISOString()
      }
    ];

    // Calculate base fare by subtracting existing surcharges from current total
    // Safely parse surcharge amounts with type coercion
    const existingSurchargesTotal = existingSurcharges.reduce((sum: number, s: any) => {
      const amount = typeof s.amount === 'number' ? s.amount : parseFloat(s.amount || '0');
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    const currentTotal = parseFloat(booking.totalAmount || '0');
    if (isNaN(currentTotal)) {
      throw new Error('Invalid booking total amount');
    }
    
    const baseFare = Math.max(0, currentTotal - existingSurchargesTotal);
    
    // Calculate new total as base fare + all surcharges (including the new one)
    const totalChargesAmount = newSurcharges.reduce((sum: number, s: any) => {
      const amount = typeof s.amount === 'number' ? s.amount : parseFloat(s.amount || '0');
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    const newTotal = baseFare + totalChargesAmount;

    const [updated] = await db
      .update(bookings)
      .set({ 
        surcharges: newSurcharges as any,
        totalAmount: newTotal.toFixed(2),
        updatedAt: new Date() 
      })
      .where(eq(bookings.id, bookingId))
      .returning();
    
    return updated;
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
    
    // Decrypt if encrypted
    if (setting && setting.isEncrypted && setting.value) {
      try {
        const decryptedValue = decrypt(setting.value);
        return { ...setting, value: decryptedValue };
      } catch (error) {
        console.error(`Failed to decrypt setting ${key}:`, error);
        throw error;
      }
    }
    
    return setting;
  }

  async getSystemSettingValue(key: string): Promise<string | null> {
    const setting = await this.getSystemSetting(key);
    return setting?.value || null;
  }

  async getAllSystemSettings(): Promise<SystemSetting[]> {
    const settings = await db.select().from(systemSettings);
    
    // Decrypt encrypted settings
    return settings.map(setting => {
      if (setting.isEncrypted && setting.value) {
        try {
          const decryptedValue = decrypt(setting.value);
          return { ...setting, value: decryptedValue };
        } catch (error) {
          console.error(`Failed to decrypt setting ${setting.key}:`, error);
          return setting; // Return as-is if decryption fails
        }
      }
      return setting;
    });
  }

  async updateSystemSetting(key: string, value: string, userId: string): Promise<void> {
    await db
      .insert(systemSettings)
      .values({ key, value, updatedBy: userId, isEncrypted: false })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value, updatedBy: userId, updatedAt: new Date(), isEncrypted: false },
      });
  }

  async updateEncryptedSetting(key: string, value: string, userId: string, description?: string): Promise<void> {
    try {
      const encryptedValue = encrypt(value);
      await db
        .insert(systemSettings)
        .values({ 
          key, 
          value: encryptedValue, 
          updatedBy: userId, 
          isEncrypted: true,
          description: description || null
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: { 
            value: encryptedValue, 
            updatedBy: userId, 
            updatedAt: new Date(), 
            isEncrypted: true,
            ...(description && { description })
          },
        });
    } catch (error) {
      console.error(`Failed to encrypt and save setting ${key}:`, error);
      throw error;
    }
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

  async getAllInvoices(): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    return invoice;
  }

  async updateInvoice(id: string, updates: Partial<Omit<Invoice, 'id' | 'createdAt'>>): Promise<Invoice | undefined> {
    const [updated] = await db
      .update(invoices)
      .set(updates)
      .where(eq(invoices.id, id))
      .returning();
    return updated;
  }

  async deleteInvoice(id: string): Promise<void> {
    await db
      .delete(invoices)
      .where(eq(invoices.id, id));
  }

  // Helper function to generate unique invoice numbers
  // Note: The database has a unique constraint on invoice_number which prevents duplicates
  // In case of concurrent creation, the database will reject duplicates and throw an error
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    
    // Retry logic for handling concurrent invoice creation
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Get the latest invoice number for this year
      const [latestInvoice] = await db
        .select()
        .from(invoices)
        .where(like(invoices.invoiceNumber, `INV-${year}%`))
        .orderBy(desc(invoices.invoiceNumber))
        .limit(1);
      
      let sequenceNumber = 1;
      
      if (latestInvoice) {
        // Extract the sequence number from the last invoice
        const lastNumber = latestInvoice.invoiceNumber.split('-')[1];
        const lastSequence = parseInt(lastNumber.substring(4)); // Skip the year
        sequenceNumber = lastSequence + 1;
      }
      
      // Format: INV-YYYYNNNNN (e.g., INV-20250001)
      const paddedSequence = sequenceNumber.toString().padStart(5, '0');
      const invoiceNumber = `INV-${year}${paddedSequence}`;
      
      // Check if this number already exists (race condition check)
      const [existing] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.invoiceNumber, invoiceNumber))
        .limit(1);
      
      if (!existing) {
        return invoiceNumber; // Safe to use
      }
      
      // If exists, retry (likely concurrent creation)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1))); // Exponential backoff
      }
    }
    
    // Fallback: use timestamp for uniqueness if retries exhausted
    const timestamp = Date.now().toString().slice(-5);
    return `INV-${year}${timestamp}`;
  }

  // Helper function to create an invoice for a booking
  private async createInvoiceForBooking(booking: Booking): Promise<Invoice | undefined> {
    // Check if invoice already exists
    const existing = await this.getInvoiceByBooking(booking.id);
    if (existing) {
      return existing; // Don't create duplicate
    }

    // Get pricing breakdown from booking
    const baseFare = booking.baseFare ? parseFloat(booking.baseFare) : 0;
    const gratuityAmount = booking.gratuityAmount ? parseFloat(booking.gratuityAmount) : 0;
    const airportFeeAmount = booking.airportFeeAmount ? parseFloat(booking.airportFeeAmount) : 0;
    const surgePricingMultiplier = booking.surgePricingMultiplier ? parseFloat(booking.surgePricingMultiplier) : null;
    const surgePricingAmount = booking.surgePricingAmount ? parseFloat(booking.surgePricingAmount) : 0;
    
    // Get discount information from booking
    const regularPrice = parseFloat(booking.regularPrice || booking.totalAmount || '0');
    const discountPercentage = booking.discountPercentage ? parseFloat(booking.discountPercentage) : 0;
    const discountAmount = booking.discountAmount ? parseFloat(booking.discountAmount) : 0;
    const totalAmount = parseFloat(booking.totalAmount || '0');
    const taxAmount = 0; // For now, tax is 0 (no tax rate configured in the system)
    const subtotal = regularPrice; // Subtotal is regular price before discount
    
    // Retry with different invoice numbers if we hit a duplicate constraint
    // Use generous retry limit to handle high-concurrency scenarios
    const maxRetries = 10;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const invoiceNumber = await this.generateInvoiceNumber();
        
        const invoiceData = {
          bookingId: booking.id,
          invoiceNumber,
          baseFare: baseFare > 0 ? baseFare.toFixed(2) : null,
          gratuityAmount: gratuityAmount > 0 ? gratuityAmount.toFixed(2) : null,
          airportFeeAmount: airportFeeAmount > 0 ? airportFeeAmount.toFixed(2) : null,
          surgePricingMultiplier: surgePricingMultiplier,
          surgePricingAmount: surgePricingAmount > 0 ? surgePricingAmount.toFixed(2) : null,
          subtotal: subtotal.toFixed(2),
          discountPercentage: discountPercentage > 0 ? discountPercentage.toFixed(2) : null,
          discountAmount: discountAmount > 0 ? discountAmount.toFixed(2) : null,
          taxAmount: taxAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          paidAt: booking.paymentStatus === 'paid' ? new Date() : null,
        };
        
        // Try to create the invoice
        return await this.createInvoice(invoiceData);
      } catch (error: any) {
        // Check if this is a unique constraint violation on invoice_number
        const isDuplicateError = error?.code === '23505' && error?.constraint === 'invoices_invoice_number_unique';
        
        if (isDuplicateError && attempt < maxRetries - 1) {
          // Jittered exponential backoff to de-sync concurrent requests
          const baseDelay = 50 * Math.pow(2, attempt); // Exponential: 50, 100, 200, 400...
          const jitter = Math.random() * baseDelay * 0.5; // Add up to 50% jitter
          const delay = baseDelay + jitter;
          
          console.log(`Invoice number collision detected (attempt ${attempt + 1}/${maxRetries}), retrying in ${Math.round(delay)}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // If it's not a duplicate error or we've exhausted retries, throw
        throw error;
      }
    }
    
    // This line should never be reached, but TypeScript needs it
    throw new Error('Failed to create invoice after maximum retries');
  }

  // Helper function to sync invoice with booking changes
  private async syncInvoiceWithBooking(booking: Booking): Promise<void> {
    const invoice = await this.getInvoiceByBooking(booking.id);
    if (!invoice) {
      // If no invoice exists, create one
      await this.createInvoiceForBooking(booking);
      return;
    }

    // Get pricing breakdown from booking
    const baseFare = booking.baseFare ? parseFloat(booking.baseFare) : 0;
    const gratuityAmount = booking.gratuityAmount ? parseFloat(booking.gratuityAmount) : 0;
    const airportFeeAmount = booking.airportFeeAmount ? parseFloat(booking.airportFeeAmount) : 0;
    const surgePricingMultiplier = booking.surgePricingMultiplier ? parseFloat(booking.surgePricingMultiplier) : null;
    const surgePricingAmount = booking.surgePricingAmount ? parseFloat(booking.surgePricingAmount) : 0;
    
    // Get discount information from booking
    const regularPrice = parseFloat(booking.regularPrice || booking.totalAmount || '0');
    const discountPercentage = booking.discountPercentage ? parseFloat(booking.discountPercentage) : 0;
    const discountAmount = booking.discountAmount ? parseFloat(booking.discountAmount) : 0;
    const totalAmount = parseFloat(booking.totalAmount || '0');
    const taxAmount = 0; // No tax configured
    const subtotal = regularPrice; // Subtotal is regular price before discount

    const updates: Partial<Omit<Invoice, 'id' | 'createdAt'>> = {
      baseFare: baseFare > 0 ? baseFare.toFixed(2) : null,
      gratuityAmount: gratuityAmount > 0 ? gratuityAmount.toFixed(2) : null,
      airportFeeAmount: airportFeeAmount > 0 ? airportFeeAmount.toFixed(2) : null,
      surgePricingMultiplier: surgePricingMultiplier,
      surgePricingAmount: surgePricingAmount > 0 ? surgePricingAmount.toFixed(2) : null,
      subtotal: subtotal.toFixed(2),
      discountPercentage: discountPercentage > 0 ? discountPercentage.toFixed(2) : null,
      discountAmount: discountAmount > 0 ? discountAmount.toFixed(2) : null,
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
    };

    // Update paidAt if payment status changed to paid
    if (booking.paymentStatus === 'paid' && !invoice.paidAt) {
      updates.paidAt = new Date();
    } else if (booking.paymentStatus !== 'paid' && invoice.paidAt) {
      updates.paidAt = null;
    }

    // Let errors propagate for visibility
    await this.updateInvoice(invoice.id, updates);
  }

  // Public method to backfill invoices for all bookings
  async backfillInvoices(): Promise<{ 
    total: number; 
    created: number; 
    skipped: number; 
    errors: number; 
    errorDetails?: string[] 
  }> {
    const allBookings = await this.getAllBookings();
    
    let created = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    for (const booking of allBookings) {
      try {
        // Check if invoice already exists
        const existingInvoice = await this.getInvoiceByBooking(booking.id);
        
        if (existingInvoice) {
          skipped++;
          continue;
        }

        // Create invoice using the helper method
        await this.createInvoiceForBooking(booking);
        created++;
      } catch (error) {
        errors++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errorDetails.push(`Booking ${booking.id}: ${errorMessage}`);
        console.error(`Error creating invoice for booking ${booking.id}:`, error);
      }
    }

    return {
      total: allBookings.length,
      created,
      skipped,
      errors,
      errorDetails: errors > 0 ? errorDetails : undefined,
    };
  }

  async getAdminDashboardStats(): Promise<{
    totalRevenue: string;
    monthlyRevenue: string;
    totalCommission: string;
    monthlyCommission: string;
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

    // Calculate monthly commission based on current month revenue
    const monthlyCommission = (currentMonthRevenue * (commissionPercentage / 100)).toFixed(2);

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

    // Awaiting driver approval count (status = 'pending_driver_acceptance')
    const [awaitingDriverApprovalResult] = await db
      .select({ 
        count: sql<number>`COUNT(*)` 
      })
      .from(bookings)
      .where(eq(bookings.status, 'pending_driver_acceptance'));

    return {
      totalRevenue: revenueResult?.total || '0',
      monthlyRevenue: currentMonthRevenueResult?.total || '0',
      totalCommission,
      monthlyCommission,
      activeBookings: activeBookingsResult?.count || 0,
      totalDrivers: totalDriversResult?.count || 0,
      activeDrivers: activeDriversResult?.count || 0,
      averageRating: ratingResult?.avg || '0',
      pendingBookings: pendingBookingsResult?.count || 0,
      pendingDrivers: pendingDriversResult?.count || 0,
      awaitingDriverApproval: awaitingDriverApprovalResult?.count || 0,
      revenueGrowth,
      ratingImprovement,
    };
  }

  async getDispatcherDashboardStats(): Promise<{
    activeDrivers: number;
    activeRides: number;
    pendingRequests: number;
    pendingApprovals: number;
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

    // Pending approvals count (drivers waiting for verification)
    const [pendingApprovalsResult] = await db
      .select({ 
        count: sql<number>`COUNT(*)` 
      })
      .from(drivers)
      .where(eq(drivers.verificationStatus, 'pending'));

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
      pendingApprovals: pendingApprovalsResult?.count || 0,
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
        // Journey tracking fields
        bookedBy: bookings.bookedBy,
        bookedAt: bookings.bookedAt,
        confirmedAt: bookings.confirmedAt,
        assignedAt: bookings.assignedAt,
        acceptedAt: bookings.acceptedAt,
        acceptedLocation: bookings.acceptedLocation,
        startedAt: bookings.startedAt,
        startedLocation: bookings.startedLocation,
        dodAt: bookings.dodAt,
        dodLocation: bookings.dodLocation,
        pobAt: bookings.pobAt,
        pobLocation: bookings.pobLocation,
        endedAt: bookings.endedAt,
        endedLocation: bookings.endedLocation,
        paymentAt: bookings.paymentAt,
        cancelledAt: bookings.cancelledAt,
        cancelReason: bookings.cancelReason,
        noShow: bookings.noShow,
        refundInvoiceSent: bookings.refundInvoiceSent,
        markedCompletedAt: bookings.markedCompletedAt,
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
        status: 'pending_driver_acceptance',
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

  // Password Reset Token Methods
  async createPasswordResetToken(data: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db.insert(passwordResetTokens).values(data).returning();
    return token;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return resetToken;
  }

  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.token, token));
  }
  
  // Payment Token Methods
  async createPaymentToken(data: InsertPaymentToken): Promise<PaymentToken> {
    const [token] = await db.insert(paymentTokens).values(data).returning();
    return token;
  }

  async getPaymentToken(token: string): Promise<PaymentToken | undefined> {
    const [paymentToken] = await db.select().from(paymentTokens).where(eq(paymentTokens.token, token));
    return paymentToken;
  }

  async markPaymentTokenAsUsed(token: string): Promise<void> {
    await db.update(paymentTokens).set({ 
      used: true,
      usedAt: new Date() 
    }).where(eq(paymentTokens.token, token));
  }
  
  async cleanupExpiredPaymentTokens(): Promise<void> {
    await db.delete(paymentTokens).where(sql`${paymentTokens.expiresAt} < NOW()`);
  }
  
  // Driver Messages Methods
  async createDriverMessage(message: InsertDriverMessage): Promise<DriverMessage> {
    const [result] = await db.insert(driverMessages).values({
      ...message,
      createdAt: new Date(),
    }).returning();
    return result;
  }

  async getDriverMessages(driverId?: string): Promise<DriverMessage[]> {
    if (driverId) {
      return await db.select().from(driverMessages)
        .where(eq(driverMessages.driverId, driverId))
        .orderBy(desc(driverMessages.createdAt));
    }
    return await db.select().from(driverMessages).orderBy(desc(driverMessages.createdAt));
  }

  async getDriverMessage(id: string): Promise<DriverMessage | undefined> {
    const [message] = await db.select().from(driverMessages).where(eq(driverMessages.id, id));
    return message;
  }

  async updateDriverMessageStatus(
    id: string, 
    status: string, 
    sentAt?: Date, 
    deliveredAt?: Date, 
    errorMessage?: string
  ): Promise<DriverMessage | undefined> {
    const updates: any = { status };
    if (sentAt) updates.sentAt = sentAt;
    if (deliveredAt) updates.deliveredAt = deliveredAt;
    if (errorMessage) updates.errorMessage = errorMessage;
    
    const [result] = await db
      .update(driverMessages)
      .set(updates)
      .where(eq(driverMessages.id, id))
      .returning();
    return result;
  }
  
  // Emergency Incidents Methods
  async createEmergencyIncident(incident: InsertEmergencyIncident): Promise<EmergencyIncident> {
    const [result] = await db.insert(emergencyIncidents).values({
      ...incident,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result;
  }

  async getEmergencyIncidents(status?: string): Promise<EmergencyIncident[]> {
    if (status) {
      return await db.select().from(emergencyIncidents)
        .where(eq(emergencyIncidents.status, status))
        .orderBy(desc(emergencyIncidents.createdAt));
    }
    return await db.select().from(emergencyIncidents).orderBy(desc(emergencyIncidents.createdAt));
  }

  async getEmergencyIncident(id: string): Promise<EmergencyIncident | undefined> {
    const [incident] = await db.select().from(emergencyIncidents).where(eq(emergencyIncidents.id, id));
    return incident;
  }

  async updateEmergencyIncident(id: string, updates: Partial<EmergencyIncident>): Promise<EmergencyIncident | undefined> {
    const [result] = await db
      .update(emergencyIncidents)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(emergencyIncidents.id, id))
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
