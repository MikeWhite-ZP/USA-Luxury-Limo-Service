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
  companyName: varchar("company_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone"),
  role: varchar("role", { enum: userRoles }).default("passenger"),
  isActive: boolean("is_active").default(true),
  payLaterEnabled: boolean("pay_later_enabled").default(false),
  cashPaymentEnabled: boolean("cash_payment_enabled").default(false),
  discountType: varchar("discount_type", { enum: ["percentage", "fixed"] }),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).default("0"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  // GPS tracking fields for drivers
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  lastLocationUpdate: timestamp("last_location_update"),
  // Password reset fields
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  // Partner fields (job sources like Uber, Sixt, Blacklane, other drivers)
  isPartner: boolean("is_partner").default(false),
  partnerCompanyName: varchar("partner_company_name"),
  partnerCommissionRate: decimal("partner_commission_rate", { precision: 5, scale: 2 }).default("0"),
  partnerNotes: text("partner_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Driver-specific information
export const drivers = pgTable("drivers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  licenseNumber: varchar("license_number"),
  licenseExpiry: timestamp("license_expiry"),
  limoLicenseNumber: varchar("limo_license_number"),
  limoLicenseExpiry: timestamp("limo_license_expiry"),
  licenseDocumentUrl: varchar("license_document_url"),
  insuranceDocumentUrl: varchar("insurance_document_url"),
  vehiclePlate: varchar("vehicle_plate"), // Vehicle license plate number
  driverCredentials: varchar("driver_credentials"), // Additional credentials to share with passengers
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
  // 1099 Tax Information (encrypted SSN stored separately)
  taxLegalFirstName: varchar("tax_legal_first_name"),
  taxLegalLastName: varchar("tax_legal_last_name"),
  taxSsnEncrypted: text("tax_ssn_encrypted"), // Encrypted SSN for 1099
  taxSsnLast4: varchar("tax_ssn_last4", { length: 4 }), // Last 4 digits for display
  taxDateOfBirth: timestamp("tax_date_of_birth"),
  taxAddressStreet: varchar("tax_address_street"),
  taxAddressCity: varchar("tax_address_city"),
  taxAddressState: varchar("tax_address_state", { length: 2 }),
  taxAddressZip: varchar("tax_address_zip", { length: 10 }),
  taxClassification: varchar("tax_classification", {
    enum: ["individual", "sole_proprietor", "llc", "corporation", "partnership"]
  }).default("individual"),
  taxInfoCompletedAt: timestamp("tax_info_completed_at"), // When all required tax info was provided
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Driver documents for verification
export const documentTypeEnum = ["driver_license", "limo_license", "insurance_certificate", "vehicle_image", "profile_photo"] as const;

export const driverDocuments = pgTable("driver_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  driverId: uuid("driver_id").references(() => drivers.id).notNull(),
  documentType: varchar("document_type", { enum: documentTypeEnum }).notNull(),
  documentUrl: text("document_url").notNull(), // Object storage URL
  expirationDate: timestamp("expiration_date"), // For licenses
  vehiclePlate: varchar("vehicle_plate"), // For vehicle images
  status: varchar("status", { 
    enum: ["pending", "approved", "rejected"] 
  }).default("pending"),
  rejectionReason: text("rejection_reason"),
  whatsappNumber: varchar("whatsapp_number"), // Only for driver profile
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
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
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }), // Made nullable - pricing moved to pricingRules
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
    dayOfWeek: number; // -1 (All Days), 0-6 (Sunday-Saturday)
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
    enum: ["pending", "pending_driver_acceptance", "confirmed", "on_the_way", "arrived", "on_board", "in_progress", "completed", "cancelled"] 
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
  gratuityAmount: decimal("gratuity_amount", { precision: 10, scale: 2 }), // Gratuity from pricing rules
  airportFeeAmount: decimal("airport_fee_amount", { precision: 10, scale: 2 }), // Airport fee applied
  surgePricingMultiplier: decimal("surge_pricing_multiplier", { precision: 5, scale: 2 }), // Surge multiplier (e.g., 1.5 for 50% increase)
  surgePricingAmount: decimal("surge_pricing_amount", { precision: 10, scale: 2 }), // Additional amount from surge pricing
  surcharges: jsonb("surcharges").$type<Array<{
    description: string;
    amount: number;
    addedBy?: string;
    addedAt?: string;
  }>>().default(sql`'[]'::jsonb`), // Additional charges array
  adminDiscount: decimal("admin_discount", { precision: 10, scale: 2 }), // Admin-applied discount amount (subtracts from total)
  customPriceItems: jsonb("custom_price_items").$type<Array<{
    description: string;
    amount: number;
    addedBy?: string;
    addedAt?: string;
  }>>().default(sql`'[]'::jsonb`), // Custom price items (adds to total)
  regularPrice: decimal("regular_price", { precision: 10, scale: 2 }), // Price before discount
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }), // User's discount %
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }), // Calculated discount
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }), // Final price after discount
  driverPayment: decimal("driver_payment", { precision: 10, scale: 2 }), // Amount driver gets paid (editable by admin/dispatcher)
  driverPaymentPaid: boolean("driver_payment_paid").default(false), // Whether driver has been paid
  driverPaymentPaidAt: timestamp("driver_payment_paid_at"), // When driver was paid
  driverPaymentPaidBy: varchar("driver_payment_paid_by"), // Admin who marked as paid
  
  // Payment
  paymentStatus: varchar("payment_status", { 
    enum: ["pending", "paid", "failed", "refunded"] 
  }).default("pending"),
  paymentIntentId: varchar("payment_intent_id"),
  paymentMethod: varchar("payment_method", { 
    enum: ["pay_now", "pay_later", "cash", "ride_credit"] 
  }).default("pay_now"),
  creditAmountApplied: decimal("credit_amount_applied", { precision: 10, scale: 2 }), // Amount paid with ride credits
  
  // Metadata
  specialInstructions: text("special_instructions"),
  passengerCount: integer("passenger_count").default(1),
  luggageCount: integer("luggage_count").default(0),
  babySeat: boolean("baby_seat").default(false),
  
  // Additional passenger information
  bookingFor: varchar("booking_for", { enum: ["self", "someone_else"] }).default("self"),
  passengerName: varchar("passenger_name"),
  passengerPhone: varchar("passenger_phone"),
  passengerEmail: varchar("passenger_email"),
  
  // Flight details
  flightNumber: varchar("flight_number"),
  flightName: varchar("flight_name"),
  flightAirline: varchar("flight_airline"),
  flightDepartureAirport: varchar("flight_departure_airport"),
  flightArrivalAirport: varchar("flight_arrival_airport"),
  flightDepartureTerminal: varchar("flight_departure_terminal"),
  flightArrivalTerminal: varchar("flight_arrival_terminal"),
  flightBaggageClaim: varchar("flight_baggage_claim"),
  flightDeparture: varchar("flight_departure"),
  flightArrival: varchar("flight_arrival"),
  noFlightInfo: boolean("no_flight_info").default(false),
  
  // Partner attribution (when booking is sourced by a Partner account)
  sourcePartnerId: varchar("source_partner_id").references(() => users.id),
  
  // Journey tracking fields
  bookedBy: varchar("booked_by", { enum: ["admin", "passenger"] }),
  bookedAt: timestamp("booked_at"),
  confirmedAt: timestamp("confirmed_at"),
  assignedAt: timestamp("assigned_at"),
  acceptedAt: timestamp("accepted_at"),
  driverAcceptanceStatus: varchar("driver_acceptance_status", {
    enum: ["pending", "accepted", "declined"]
  }).default("pending"),
  declinedAt: timestamp("declined_at"),
  declineReason: varchar("decline_reason", {
    enum: ["timing_conflict", "pricing_issue", "too_far_away", "vehicle_unavailable", "personal_emergency", "other"]
  }),
  declineNotes: text("decline_notes"), // Optional additional notes for decline
  reminderSentAt: timestamp("reminder_sent_at"), // When 2-hour reminder was sent (first warning)
  secondReminderSentAt: timestamp("second_reminder_sent_at"), // When 1-hour reminder was sent (second warning)
  onTheWayAt: timestamp("on_the_way_at"), // When driver started journey
  arrivedAt: timestamp("arrived_at"), // When driver arrived at pickup
  onBoardAt: timestamp("on_board_at"), // When passenger boarded
  autoCancelledAt: timestamp("auto_cancelled_at"), // When system auto-cancelled
  acceptedLocation: jsonb("accepted_location").$type<{lat: number; lng: number; timestamp: string}>(),
  startedAt: timestamp("started_at"),
  startedLocation: jsonb("started_location").$type<{lat: number; lng: number; timestamp: string}>(),
  dodAt: timestamp("dod_at"), // Driver On Destination
  dodLocation: jsonb("dod_location").$type<{lat: number; lng: number; timestamp: string}>(),
  pobAt: timestamp("pob_at"), // Passenger On Board
  pobLocation: jsonb("pob_location").$type<{lat: number; lng: number; timestamp: string}>(),
  endedAt: timestamp("ended_at"),
  endedLocation: jsonb("ended_location").$type<{lat: number; lng: number; timestamp: string}>(),
  paymentAt: timestamp("payment_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancelReason: text("cancel_reason"),
  noShow: boolean("no_show").default(false),
  refundInvoiceSent: boolean("refund_invoice_sent").default(false),
  markedCompletedAt: timestamp("marked_completed_at"),
  
  // Invoice and billing fields
  billReference: varchar("bill_reference", { length: 100 }), // Customer/admin reference for invoicing
  actualPickupTime: timestamp("actual_pickup_time"), // Actual time driver started with passenger (for hourly billing)
  actualDropoffTime: timestamp("actual_dropoff_time"), // Actual time driver completed the job (for hourly billing)
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Driver ratings (passengers rate drivers after completed rides)
export const driverRatings = pgTable("driver_ratings", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id").references(() => bookings.id).notNull(),
  driverId: uuid("driver_id").references(() => drivers.id).notNull(),
  passengerId: varchar("passenger_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
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

// Payment Options - System-wide payment method availability (controlled by admin)
export const paymentOptions = pgTable("payment_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  optionType: varchar("option_type", { enum: ["credit_card", "pay_later", "cash", "ride_credit"] }).unique().notNull(),
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  isEnabled: boolean("is_enabled").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoice/Receipt records
export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id").references(() => bookings.id).notNull(),
  invoiceNumber: varchar("invoice_number").unique().notNull(),
  baseFare: decimal("base_fare", { precision: 10, scale: 2 }), // Base fare before surge/gratuity
  gratuityAmount: decimal("gratuity_amount", { precision: 10, scale: 2 }), // Gratuity from pricing rules
  airportFeeAmount: decimal("airport_fee_amount", { precision: 10, scale: 2 }), // Airport fee applied
  surgePricingMultiplier: decimal("surge_pricing_multiplier", { precision: 5, scale: 2 }), // Surge multiplier
  surgePricingAmount: decimal("surge_pricing_amount", { precision: 10, scale: 2 }), // Additional amount from surge
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(), // Regular price before discount
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }), // Discount %
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }), // Discount amount
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0.00"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(), // Final amount after discount
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment tokens for secure invoice payment links
export const paymentTokens = pgTable("payment_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id").references(() => invoices.id).notNull(),
  token: varchar("token", { length: 64 }).unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  usedAt: timestamp("used_at"),
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

// Ride Credits - User balance for refunded cancellations
export const rideCredits = pgTable("ride_credits", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ride Credit Transactions - Audit trail for credit changes
export const rideCreditTransactionTypes = ["earned", "spent", "adjustment", "expired"] as const;
export const rideCreditTransactions = pgTable("ride_credit_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  bookingId: uuid("booking_id").references(() => bookings.id),
  transactionType: varchar("transaction_type", { enum: rideCreditTransactionTypes }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // positive for earned, negative for spent
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Booking cancellations - Track cancellation details
export const bookingCancellations = pgTable("booking_cancellations", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id").references(() => bookings.id).notNull().unique(),
  cancelledBy: varchar("cancelled_by", { enum: ["passenger", "driver", "admin", "system"] }).notNull(),
  cancellationReason: text("cancellation_reason"),
  hoursBeforePickup: decimal("hours_before_pickup", { precision: 8, scale: 2 }), // How many hours before pickup
  wasDriverOnTheWay: boolean("was_driver_on_the_way").default(false),
  chargeApplied: boolean("charge_applied").default(false), // True if customer was charged
  chargeAmount: decimal("charge_amount", { precision: 10, scale: 2 }), // Amount charged
  creditIssued: boolean("credit_issued").default(false), // True if ride credit was issued
  creditAmount: decimal("credit_amount", { precision: 10, scale: 2 }), // Amount credited
  refundStatus: varchar("refund_status", { enum: ["none", "credit_issued", "charged", "full_refund"] }).default("none"),
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
}).extend({
  scheduledDateTime: z.union([z.date(), z.string()]).transform((val) => {
    return typeof val === 'string' ? new Date(val) : val;
  }),
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
  dayOfWeek: z.number().min(-1).max(6), // -1 (All Days), 0-6 (Sunday-Saturday)
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

export const insertPaymentOptionSchema = createInsertSchema(paymentOptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentTokenSchema = createInsertSchema(paymentTokens).omit({
  id: true,
  createdAt: true,
  used: true,
  usedAt: true,
});

export const insertVehicleTypeSchema = createInsertSchema(vehicleTypes).omit({
  id: true,
  createdAt: true,
}).extend({
  passengerCapacity: z.number().int().min(1).max(20),
  hourlyRate: z.string().optional().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
    message: "Hourly rate must be a valid positive number",
  }),
  perMileRate: z.string().optional().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
    message: "Per mile rate must be a valid positive number",
  }),
  minimumFare: z.string().optional().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
    message: "Minimum fare must be a valid positive number",
  }),
});

export const insertDriverDocumentSchema = createInsertSchema(driverDocuments).omit({
  id: true,
  uploadedAt: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDriverRatingSchema = createInsertSchema(driverRatings).omit({
  id: true,
  createdAt: true,
}).extend({
  rating: z.number().min(1).max(5).int(), // 1-5 stars validation
});

// CMS Settings - Brand settings (logos, colors, social media, etc.)
export const cmsSettingCategoryEnum = ["branding", "colors", "social", "contact", "seo", "tax"] as const;
export type CmsSettingCategory = typeof cmsSettingCategoryEnum[number];

export const cmsSettings = pgTable("cms_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key").notNull().unique(), // e.g., 'logo_main', 'color_primary', 'social_facebook'
  value: text("value"), // Value or URL
  category: varchar("category", {
    enum: cmsSettingCategoryEnum
  }).notNull(),
  description: text("description"), // Human-readable description of what this setting controls
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// CMS Content Blocks - Editable content sections
export const contentBlockEnum = ["hero", "about", "services", "contact", "footer", "testimonial"] as const;
export type ContentBlockType = typeof contentBlockEnum[number];

export const cmsContent = pgTable("cms_content", {
  id: uuid("id").defaultRandom().primaryKey(),
  blockType: varchar("block_type", { enum: contentBlockEnum }).notNull(),
  identifier: varchar("identifier").notNull(), // e.g., 'hero_main', 'about_company', allows multiple of same type
  title: varchar("title"), // Block title
  content: text("content"), // Rich text content
  metadata: jsonb("metadata"), // Additional structured data (CTA button text, links, etc.)
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0), // For ordering multiple blocks of same type
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// CMS Media Library - Uploaded images and files
export const mediaFolderEnum = ["logos", "hero-images", "favicon", "vehicles", "testimonials", "general"] as const;
export type MediaFolder = typeof mediaFolderEnum[number];

export const cmsMedia = pgTable("cms_media", {
  id: uuid("id").defaultRandom().primaryKey(),
  fileName: varchar("file_name").notNull(),
  fileUrl: text("file_url").notNull(), // Object storage URL
  fileType: varchar("file_type").notNull(), // MIME type
  fileSize: integer("file_size"), // Size in bytes
  folder: varchar("folder", { enum: mediaFolderEnum }).default("general"),
  altText: text("alt_text"), // For accessibility
  description: text("description"),
  width: integer("width"), // Image dimensions
  height: integer("height"),
  uploadedBy: varchar("uploaded_by").references(() => users.id).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for CMS
export const insertCmsSettingSchema = createInsertSchema(cmsSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCmsContentSchema = createInsertSchema(cmsContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCmsMediaSchema = createInsertSchema(cmsMedia).omit({
  id: true,
  createdAt: true,
  uploadedAt: true,
});

// Services - CMS-managed service cards displayed on homepage
export const serviceIconEnum = ["Plane", "Briefcase", "Heart", "Clock", "Car", "Users", "Star", "Shield", "Calendar", "MapPin"] as const;
export type ServiceIcon = typeof serviceIconEnum[number];

export const services = pgTable("services", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug").notNull().unique(), // SEO-friendly URL like 'airport-transfer'
  title: varchar("title").notNull(),
  subtitle: varchar("subtitle"), // Optional short blurb for cards
  description: text("description").notNull(),
  icon: varchar("icon", { enum: serviceIconEnum }).notNull(), // lucide-react icon name
  features: text("features").array().default(sql`'{}'::text[]`).notNull(), // array of feature strings
  imageUrl: varchar("image_url"), // background image URL
  imageAlt: varchar("image_alt"), // accessibility alt text for image
  ctaLabel: varchar("cta_label"), // optional call-to-action button text
  ctaUrl: varchar("cta_url"), // optional call-to-action button URL
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("services_slug_idx").on(table.slug),
]);

export const insertServiceSchema = createInsertSchema(services, {
  features: z.array(z.string()).default([]),
  icon: z.enum(serviceIconEnum),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

// Driver communications/messages
export const driverMessages = pgTable("driver_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  driverId: varchar("driver_id").references(() => users.id),
  messageType: varchar("message_type", { enum: ["individual", "broadcast", "alert"] }).default("individual").notNull(),
  subject: varchar("subject"),
  message: text("message").notNull(),
  priority: varchar("priority", { enum: ["normal", "high", "urgent"] }).default("normal"),
  deliveryMethod: varchar("delivery_method", { enum: ["sms", "email", "both"] }).default("both").notNull(),
  status: varchar("status", { enum: ["pending", "sent", "delivered", "failed"] }).default("pending"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDriverMessageSchema = createInsertSchema(driverMessages).omit({
  id: true,
  createdAt: true,
  status: true,
  sentAt: true,
  deliveredAt: true,
  errorMessage: true,
});

// Emergency incidents
export const emergencyIncidents = pgTable("emergency_incidents", {
  id: uuid("id").defaultRandom().primaryKey(),
  reporterId: varchar("reporter_id").references(() => users.id).notNull(),
  incidentType: varchar("incident_type", { enum: ["accident", "breakdown", "medical", "safety", "other"] }).notNull(),
  severity: varchar("severity", { enum: ["low", "medium", "high", "critical"] }).default("medium").notNull(),
  bookingId: uuid("booking_id").references(() => bookings.id),
  driverId: varchar("driver_id").references(() => users.id),
  location: varchar("location"),
  locationCoordinates: varchar("location_coordinates"),
  description: text("description").notNull(),
  status: varchar("status", { enum: ["open", "in_progress", "resolved", "closed"] }).default("open").notNull(),
  assignedTo: varchar("assigned_to").references(() => users.id),
  resolutionNotes: text("resolution_notes"),
  emergencyServicesContacted: boolean("emergency_services_contacted").default(false),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmergencyIncidentSchema = createInsertSchema(emergencyIncidents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Decline reasons - tracks why drivers decline bookings
export const declineReasonEnum = [
  "timing_conflict",
  "pricing_too_low", 
  "too_far_away",
  "vehicle_not_suitable",
  "already_booked",
  "personal_reasons"
] as const;

export const declineReasons = pgTable("decline_reasons", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: 'cascade' }).notNull(),
  driverId: uuid("driver_id").references(() => drivers.id, { onDelete: 'cascade' }).notNull(),
  reason: varchar("reason", { enum: declineReasonEnum }).notNull(),
  reasonDisplay: varchar("reason_display").notNull(),
  additionalNotes: text("additional_notes"),
  declinedAt: timestamp("declined_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDeclineReasonSchema = createInsertSchema(declineReasons).omit({
  id: true,
  createdAt: true,
});

// Old Invoices - Legacy/historical PDF invoice files for passengers
export const oldInvoices = pgTable("old_invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  fileName: varchar("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  description: text("description"),
  invoiceDate: timestamp("invoice_date"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOldInvoiceSchema = createInsertSchema(oldInvoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Device Push Tokens - for mobile push notifications
export const devicePushTokens = pgTable("device_push_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  deviceId: varchar("device_id").notNull(), // Unique device identifier
  platform: varchar("platform", { enum: ["ios", "android", "web"] }).notNull(),
  token: text("token").notNull(), // FCM/APNs token
  isActive: boolean("is_active").default(true),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDevicePushTokenSchema = createInsertSchema(devicePushTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Insert schemas for ride credits
export const insertRideCreditTransactionSchema = createInsertSchema(rideCreditTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertBookingCancellationSchema = createInsertSchema(bookingCancellations).omit({
  id: true,
  createdAt: true,
});

// SMS Provider Types
export const smsProviderEnum = ["TWILIO", "ANDROID_SMS"] as const;
export type SmsProvider = typeof smsProviderEnum[number];

export const smsQueueStatusEnum = ["PENDING", "SENT", "FAILED", "EXPIRED"] as const;
export type SmsQueueStatus = typeof smsQueueStatusEnum[number];

// Android SMS Device Registry - Devices that can send SMS for the system
export const androidSmsDevices = pgTable("android_sms_devices", {
  id: uuid("id").defaultRandom().primaryKey(),
  deviceUuid: varchar("device_uuid", { length: 100 }).notNull().unique(),
  deviceName: varchar("device_name", { length: 100 }),
  apiToken: varchar("api_token", { length: 255 }).notNull(),
  lastHeartbeat: timestamp("last_heartbeat"),
  isActive: boolean("is_active").default(true),
  phoneNumber: varchar("phone_number", { length: 30 }), // Device's phone number for sending
  metadata: jsonb("metadata"), // Additional device info
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("android_devices_active_idx").on(table.isActive),
]);

// Android SMS Queue - Messages waiting to be sent by Android devices
export const androidSmsQueue = pgTable("android_sms_queue", {
  id: uuid("id").defaultRandom().primaryKey(),
  phoneNumber: varchar("phone_number", { length: 30 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { enum: smsQueueStatusEnum }).default("PENDING"),
  deviceUuid: varchar("device_uuid", { length: 100 }), // Device that claimed/sent this message
  errorMessage: text("error_message"),
  priority: integer("priority").default(0), // Higher = more urgent
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  scheduledAt: timestamp("scheduled_at"), // For delayed sending
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("sms_queue_status_idx").on(table.status),
  index("sms_queue_priority_idx").on(table.priority),
]);

// Insert schemas for Android SMS
export const insertAndroidSmsDeviceSchema = createInsertSchema(androidSmsDevices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAndroidSmsQueueSchema = createInsertSchema(androidSmsQueue).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Notification Templates - Dynamic email and SMS notification management
export const notificationTypeEnum = ["email", "sms"] as const;
export type NotificationType = typeof notificationTypeEnum[number];

export const notificationRecipientEnum = ["passenger", "driver", "admin", "user"] as const;
export type NotificationRecipient = typeof notificationRecipientEnum[number];

export const notificationStatusEnum = ["active", "inactive"] as const;
export type NotificationStatus = typeof notificationStatusEnum[number];

export const notificationTemplates = pgTable("notification_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: varchar("type", { enum: notificationTypeEnum }).notNull(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  recipientType: varchar("recipient_type", { enum: notificationRecipientEnum }).notNull(),
  purpose: text("purpose").notNull(),
  subject: varchar("subject", { length: 255 }), // For email templates only
  content: text("content"), // HTML content for email templates
  smsContent: text("sms_content"), // Plain text for SMS templates
  status: varchar("status", { enum: notificationStatusEnum }).default("active"),
  availableShortcodes: text("available_shortcodes"), // Comma-separated list of shortcodes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("notification_templates_type_idx").on(table.type),
  index("notification_templates_code_idx").on(table.code),
  index("notification_templates_status_idx").on(table.status),
]);

export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplates).omit({
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
export type PaymentOption = typeof paymentOptions.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type RideCredit = typeof rideCredits.$inferSelect;
export type RideCreditTransaction = typeof rideCreditTransactions.$inferSelect;
export type InsertRideCreditTransaction = z.infer<typeof insertRideCreditTransactionSchema>;
export type BookingCancellation = typeof bookingCancellations.$inferSelect;
export type InsertBookingCancellation = z.infer<typeof insertBookingCancellationSchema>;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type InsertVehicleType = z.infer<typeof insertVehicleTypeSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type InsertSavedAddress = z.infer<typeof insertSavedAddressSchema>;
export type InsertPricingRule = z.infer<typeof insertPricingRuleSchema>;
export type InsertPaymentSystem = z.infer<typeof insertPaymentSystemSchema>;
export type InsertPaymentOption = z.infer<typeof insertPaymentOptionSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type PaymentToken = typeof paymentTokens.$inferSelect;
export type InsertPaymentToken = z.infer<typeof insertPaymentTokenSchema>;
export type DriverDocument = typeof driverDocuments.$inferSelect;
export type InsertDriverDocument = z.infer<typeof insertDriverDocumentSchema>;
export type DriverRating = typeof driverRatings.$inferSelect;
export type InsertDriverRating = z.infer<typeof insertDriverRatingSchema>;
export type CmsSetting = typeof cmsSettings.$inferSelect;
export type InsertCmsSetting = z.infer<typeof insertCmsSettingSchema>;
export type CmsContent = typeof cmsContent.$inferSelect;
export type InsertCmsContent = z.infer<typeof insertCmsContentSchema>;
export type CmsMedia = typeof cmsMedia.$inferSelect;
export type InsertCmsMedia = z.infer<typeof insertCmsMediaSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type DriverMessage = typeof driverMessages.$inferSelect;
export type InsertDriverMessage = z.infer<typeof insertDriverMessageSchema>;
export type EmergencyIncident = typeof emergencyIncidents.$inferSelect;
export type InsertEmergencyIncident = z.infer<typeof insertEmergencyIncidentSchema>;
export type DeclineReason = typeof declineReasons.$inferSelect;
export type InsertDeclineReason = z.infer<typeof insertDeclineReasonSchema>;
export type OldInvoice = typeof oldInvoices.$inferSelect;
export type InsertOldInvoice = z.infer<typeof insertOldInvoiceSchema>;
export type DevicePushToken = typeof devicePushTokens.$inferSelect;
export type InsertDevicePushToken = z.infer<typeof insertDevicePushTokenSchema>;
export type AndroidSmsDevice = typeof androidSmsDevices.$inferSelect;
export type InsertAndroidSmsDevice = z.infer<typeof insertAndroidSmsDeviceSchema>;
export type AndroidSmsQueue = typeof androidSmsQueue.$inferSelect;
export type InsertAndroidSmsQueue = z.infer<typeof insertAndroidSmsQueueSchema>;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type InsertNotificationTemplate = z.infer<typeof insertNotificationTemplateSchema>;
