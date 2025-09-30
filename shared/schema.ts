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
  // Transfer pricing
  baseRate: decimal("base_rate", { precision: 10, scale: 2 }),
  perMileRate: decimal("per_mile_rate", { precision: 10, scale: 2 }),
  // Hourly pricing  
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  minimumHours: integer("minimum_hours"),
  // Common
  minimumFare: decimal("minimum_fare", { precision: 10, scale: 2 }),
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

export const insertPricingRuleSchema = createInsertSchema(pricingRules)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .refine(
    (data) => {
      if (data.serviceType === "transfer") {
        return data.baseRate !== undefined && data.baseRate !== null && 
               data.perMileRate !== undefined && data.perMileRate !== null;
      }
      return true;
    },
    {
      message: "Transfer service type requires baseRate and perMileRate",
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
  );

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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type InsertSavedAddress = z.infer<typeof insertSavedAddressSchema>;
export type InsertPricingRule = z.infer<typeof insertPricingRuleSchema>;
