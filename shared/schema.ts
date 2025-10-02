import { sql } from 'drizzle-orm';
import {
  index,
  uniqueIndex,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoles = ["passenger", "driver", "dispatcher", "admin"] as const;
export type UserRole = typeof userRoles[number];

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Local auth fields
  username: varchar("username").unique(),
  password: varchar("password"), // hashed password for local auth
  // OAuth fields
  oauthProvider: varchar("oauth_provider", { enum: ["local", "google", "apple"] }).default("local"),
  oauthId: varchar("oauth_id"), // ID from OAuth provider
  // User info
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone"),
  role: varchar("role", { enum: userRoles }).default("passenger"),
  isActive: boolean("is_active").default(true),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Driver-specific information
export const drivers = pgTable("drivers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  licenseNumber: varchar("license_number"),
  licenseExpiry: timestamp("license_expiry"),
  licenseDocumentUrl: varchar("license_document_url"),
  insuranceDocumentUrl: varchar("insurance_document_url"),
  backgroundCheckStatus: varchar("background_check_status", { 
    enum: ["pending", "approved", "rejected"] 
  }).default("pending"),
  verificationStatus: varchar("verification_status", { 
    enum: ["pending", "verified", "rejected"] 
  }).default("pending"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalRides: integer("total_rides").default(0),
  isAvailable: boolean("is_available").default(false),
  currentLocation: text("current_location"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vehicle types and pricing
export const vehicleTypes = pgTable("vehicle_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  passengerCapacity: integer("passenger_capacity").notNull(),
  luggageCapacity: varchar("luggage_capacity"),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  perMileRate: decimal("per_mile_rate", { precision: 10, scale: 2 }),
  minimumFare: decimal("minimum_fare", { precision: 10, scale: 2 }),
  imageUrl: varchar("image_url"),
  features: jsonb("features"), // Array of features
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pricing rules (admin-configurable)
export const vehicleTypeEnum = ["business_sedan", "business_suv", "first_class_sedan", "first_class_suv", "business_van"] as const;
export const serviceTypeEnum = ["transfer", "hourly"] as const;

export const pricingRules = pgTable("pricing_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  vehicleType: varchar("vehicle_type", { enum: vehicleTypeEnum }).notNull(),
  serviceType: varchar("service_type", { enum: serviceTypeEnum }).notNull(),
  // Transfer pricing (basic)
  baseRate: decimal("base_rate", { precision: 10, scale: 2 }),
  perMileRate: decimal("per_mile_rate", { precision: 10, scale: 2 }),
  // Hourly pricing (basic)
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  minimumHours: integer("minimum_hours"),
  // Common
  minimumFare: decimal("minimum_fare", { precision: 10, scale: 2 }),
  
  // Advanced pricing features (n8n workflow)
  gratuityPercent: decimal("gratuity_percent", { precision: 5, scale: 2 }).default("20.00"), // Default 20%
  
  // Airport fees: [{airportCode: string, fee: number, waiverMinutes?: number}]
  airportFees: jsonb("airport_fees").$type<Array<{
    airportCode: string;
    fee: number;
    waiverMinutes?: number;
  }>>().default(sql`'[]'::jsonb`),
  
  // Meet & greet: {enabled: boolean, charge: number}
  meetAndGreet: jsonb("meet_and_greet").$type<{
    enabled: boolean;
    charge: number;
  }>().default(sql`'{"enabled": false, "charge": 0}'::jsonb`),
  
  // Surge pricing: [{dayOfWeek: number, startTime: string, endTime: string, multiplier: number}]
  surgePricing: jsonb("surge_pricing").$type<Array<{
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
    multiplier: number; // e.g., 1.5 for 50% surge
  }>>().default(sql`'[]'::jsonb`),
  
  // Distance tiers for progressive pricing: [{miles: number, ratePerMile: number, isRemaining?: boolean}]
  // Example: First 20 miles @ $0, Next 24.45 miles @ $4.45, Remaining @ $3.75
  distanceTiers: jsonb("distance_tiers").$type<Array<{
    miles: number;
    ratePerMile: number;
    isRemaining?: boolean;
  }>>().default(sql`'[]'::jsonb`),
  
  // Overtime rate for hourly bookings (rate applied after minimum hours)
  overtimeRate: decimal("overtime_rate", { precision: 10, scale: 2 }),
  
  // Effective date range for phased pricing changes
  effectiveStart: timestamp("effective_start"),
  effectiveEnd: timestamp("effective_end"),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueVehicleService: uniqueIndex("unique_vehicle_service").on(table.vehicleType, table.serviceType),
}));

// Individual vehicles
export const vehicles = pgTable("vehicles", {
  id: uuid("id").defaultRandom().primaryKey(),
  vehicleTypeId: uuid("vehicle_type_id").references(() => vehicleTypes.id).notNull(),
  driverId: uuid("driver_id").references(() => drivers.id),
  make: varchar("make").notNull(),
  model: varchar("model").notNull(),
  year: integer("year").notNull(),
  color: varchar("color"),
  licensePlate: varchar("license_plate"),
  vin: varchar("vin"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookings
export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  passengerId: varchar("passenger_id").references(() => users.id).notNull(),
  driverId: uuid("driver_id").references(() => drivers.id),
  vehicleTypeId: uuid("vehicle_type_id").references(() => vehicleTypes.id).notNull(),
  vehicleId: uuid("vehicle_id").references(() => vehicles.id),
  bookingType: varchar("booking_type", { enum: ["transfer", "hourly"] }).notNull(),
  status: varchar("status", { 
    enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"] 
  }).default("pending"),
  
  // Trip details
  pickupAddress: text("pickup_address").notNull(),
  pickupLat: decimal("pickup_lat", { precision: 10, scale: 8 }),
  pickupLon: decimal("pickup_lon", { precision: 11, scale: 8 }),
  destinationAddress: text("destination_address"),
  destinationLat: decimal("destination_lat", { precision: 10, scale: 8 }),
  destinationLon: decimal("destination_lon", { precision: 11, scale: 8 }),
  viaPoints: jsonb("via_points"), // Array of intermediate stops
  
  // Scheduling
  scheduledDateTime: timestamp("scheduled_date_time").notNull(),
  estimatedDuration: integer("estimated_duration"), // in minutes
  estimatedDistance: decimal("estimated_distance", { precision: 8, scale: 2 }), // in miles
  
  // Hourly booking specifics
  requestedHours: integer("requested_hours"),
  
  // Pricing
  baseFare: decimal("base_fare", { precision: 10, scale: 2 }),
  distanceFare: decimal("distance_fare", { precision: 10, scale: 2 }),
  timeFare: decimal("time_fare", { precision: 10, scale: 2 }),
  surcharges: jsonb("surcharges"), // Additional fees
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  
  // Payment
  paymentStatus: varchar("payment_status", { 
    enum: ["pending", "paid", "failed", "refunded"] 
  }).default("pending"),
  paymentIntentId: varchar("payment_intent_id"),
  
  // Metadata
  specialInstructions: text("special_instructions"),
  passengerCount: integer("passenger_count").default(1),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Saved addresses for passengers
export const savedAddresses = pgTable("saved_addresses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  label: varchar("label").notNull(), // "Home", "Work", etc.
  address: text("address").notNull(),
  lat: decimal("lat", { precision: 10, scale: 8 }),
  lon: decimal("lon", { precision: 11, scale: 8 }),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// System settings
export const systemSettings = pgTable("system_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key").unique().notNull(),
  value: text("value"),
  description: text("description"),
  isEncrypted: boolean("is_encrypted").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

// Payment Systems Configuration
export const paymentProviderEnum = ["stripe", "paypal", "square"] as const;
export const paymentSystems = pgTable("payment_systems", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: varchar("provider", { enum: paymentProviderEnum }).unique().notNull(),
  isActive: boolean("is_active").default(false),
  publicKey: text("public_key"),
  secretKey: text("secret_key"),
  webhookSecret: text("webhook_secret"),
  config: jsonb("config"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoice/Receipt records
export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id").references(() => bookings.id).notNull(),
  invoiceNumber: varchar("invoice_number").unique().notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0.00"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contact form submissions
export const contactSubmissions = pgTable("contact_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  serviceType: varchar("service_type"),
  message: text("message").notNull(),
  status: varchar("status", { enum: ["new", "contacted", "resolved"] }).default("new"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
});

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertSavedAddressSchema = createInsertSchema(savedAddresses).omit({
  id: true,
  createdAt: true,
});

// Zod schemas for advanced pricing features
const airportFeeSchema = z.object({
  airportCode: z.string().min(3).max(10),
  fee: z.number().min(0),
  waiverMinutes: z.number().min(0).optional(),
});

const meetAndGreetSchema = z.object({
  enabled: z.boolean(),
  charge: z.number().min(0),
});

const surgePricingSchema = z.object({
  dayOfWeek: z.number().min(0).max(6), // 0-6 (Sunday-Saturday)
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
  multiplier: z.number().min(1).max(5), // 1x to 5x surge
});

const distanceTierSchema = z.object({
  miles: z.number().min(0), // Number of miles in this tier (e.g., "First 20 miles" or "Next 24.45 miles")
  ratePerMile: z.number().min(0), // Rate per mile for this tier
  isRemaining: z.boolean().optional(), // If true, this applies to all remaining miles
});

export const insertPricingRuleSchema = createInsertSchema(pricingRules)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    airportFees: z.array(airportFeeSchema).optional(),
    meetAndGreet: meetAndGreetSchema.optional(),
    surgePricing: z.array(surgePricingSchema).optional(),
    distanceTiers: z.array(distanceTierSchema).optional(),
  })
  .refine(
    (data) => {
      if (data.serviceType === "transfer") {
        const hasBaseRate = data.baseRate !== undefined && data.baseRate !== null;
        const hasPerMileRate = data.perMileRate !== undefined && data.perMileRate !== null;
        const hasDistanceTiers = data.distanceTiers && data.distanceTiers.length > 0;
        
        // Transfer requires baseRate AND (perMileRate OR distanceTiers)
        return hasBaseRate && (hasPerMileRate || hasDistanceTiers);
      }
      return true;
    },
    {
      message: "Transfer service requires baseRate and either perMileRate or distance tiers",
      path: ["serviceType"],
    }
  )
  .refine(
    (data) => {
      if (data.serviceType === "hourly") {
        return data.hourlyRate !== undefined && data.hourlyRate !== null && 
               data.minimumHours !== undefined && data.minimumHours !== null;
      }
      return true;
    },
    {
      message: "Hourly service type requires hourlyRate and minimumHours",
      path: ["serviceType"],
    }
  )
  .refine(
    (data) => {
      // Validate only one "remaining" tier exists and it's the last one
      if (data.distanceTiers && data.distanceTiers.length > 0) {
        const remainingIndex = data.distanceTiers.findIndex(t => t.isRemaining);
        if (remainingIndex !== -1 && remainingIndex !== data.distanceTiers.length - 1) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Remaining tier must be the last tier",
      path: ["distanceTiers"],
    }
  )
  .refine(
    (data) => {
      // Validate effectiveEnd is after effectiveStart when both are provided
      if (data.effectiveStart && data.effectiveEnd) {
        return new Date(data.effectiveEnd) > new Date(data.effectiveStart);
      }
      return true;
    },
    {
      message: "Effective end date must be after effective start date",
      path: ["effectiveEnd"],
    }
  );

export const insertPaymentSystemSchema = createInsertSchema(paymentSystems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type VehicleType = typeof vehicleTypes.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type SavedAddress = typeof savedAddresses.$inferSelect;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type PricingRule = typeof pricingRules.$inferSelect;
export type PaymentSystem = typeof paymentSystems.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type InsertSavedAddress = z.infer<typeof insertSavedAddressSchema>;
export type InsertPricingRule = z.infer<typeof insertPricingRuleSchema>;
export type InsertPaymentSystem = z.infer<typeof insertPaymentSystemSchema>;
