var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";
import { createServer as createServer2 } from "http";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  bookings: () => bookings,
  cmsContent: () => cmsContent,
  cmsMedia: () => cmsMedia,
  cmsSettingCategoryEnum: () => cmsSettingCategoryEnum,
  cmsSettings: () => cmsSettings,
  contactSubmissions: () => contactSubmissions,
  contentBlockEnum: () => contentBlockEnum,
  documentTypeEnum: () => documentTypeEnum,
  driverDocuments: () => driverDocuments,
  driverMessages: () => driverMessages,
  driverRatings: () => driverRatings,
  drivers: () => drivers,
  emergencyIncidents: () => emergencyIncidents,
  insertBookingSchema: () => insertBookingSchema,
  insertCmsContentSchema: () => insertCmsContentSchema,
  insertCmsMediaSchema: () => insertCmsMediaSchema,
  insertCmsSettingSchema: () => insertCmsSettingSchema,
  insertContactSchema: () => insertContactSchema,
  insertDriverDocumentSchema: () => insertDriverDocumentSchema,
  insertDriverMessageSchema: () => insertDriverMessageSchema,
  insertDriverRatingSchema: () => insertDriverRatingSchema,
  insertDriverSchema: () => insertDriverSchema,
  insertEmergencyIncidentSchema: () => insertEmergencyIncidentSchema,
  insertInvoiceSchema: () => insertInvoiceSchema,
  insertPasswordResetTokenSchema: () => insertPasswordResetTokenSchema,
  insertPaymentSystemSchema: () => insertPaymentSystemSchema,
  insertPaymentTokenSchema: () => insertPaymentTokenSchema,
  insertPricingRuleSchema: () => insertPricingRuleSchema,
  insertSavedAddressSchema: () => insertSavedAddressSchema,
  insertServiceSchema: () => insertServiceSchema,
  insertUserSchema: () => insertUserSchema,
  insertVehicleTypeSchema: () => insertVehicleTypeSchema,
  invoices: () => invoices,
  mediaFolderEnum: () => mediaFolderEnum,
  passwordResetTokens: () => passwordResetTokens,
  paymentProviderEnum: () => paymentProviderEnum,
  paymentSystems: () => paymentSystems,
  paymentTokens: () => paymentTokens,
  pricingRules: () => pricingRules,
  savedAddresses: () => savedAddresses,
  serviceIconEnum: () => serviceIconEnum,
  serviceTypeEnum: () => serviceTypeEnum,
  services: () => services,
  sessions: () => sessions,
  systemSettings: () => systemSettings,
  userRoles: () => userRoles,
  users: () => users,
  vehicleTypeEnum: () => vehicleTypeEnum,
  vehicleTypes: () => vehicleTypes,
  vehicles: () => vehicles
});
import { sql } from "drizzle-orm";
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
  uuid
} from "drizzle-orm/pg-core";

// node_modules/drizzle-zod/index.mjs
import { isTable, getTableColumns, getViewSelectedFields, is, Column, SQL, isView } from "drizzle-orm";
import { z } from "zod";
var CONSTANTS = {
  INT8_MIN: -128,
  INT8_MAX: 127,
  INT8_UNSIGNED_MAX: 255,
  INT16_MIN: -32768,
  INT16_MAX: 32767,
  INT16_UNSIGNED_MAX: 65535,
  INT24_MIN: -8388608,
  INT24_MAX: 8388607,
  INT24_UNSIGNED_MAX: 16777215,
  INT32_MIN: -2147483648,
  INT32_MAX: 2147483647,
  INT32_UNSIGNED_MAX: 4294967295,
  INT48_MIN: -140737488355328,
  INT48_MAX: 140737488355327,
  INT48_UNSIGNED_MAX: 281474976710655,
  INT64_MIN: -9223372036854775808n,
  INT64_MAX: 9223372036854775807n,
  INT64_UNSIGNED_MAX: 18446744073709551615n
};
function isColumnType(column, columnTypes) {
  return columnTypes.includes(column.columnType);
}
function isWithEnum(column) {
  return "enumValues" in column && Array.isArray(column.enumValues) && column.enumValues.length > 0;
}
var literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
var jsonSchema = z.union([literalSchema, z.record(z.any()), z.array(z.any())]);
var bufferSchema = z.custom((v) => v instanceof Buffer);
function columnToSchema(column, factory) {
  const z$1 = factory?.zodInstance ?? z;
  const coerce = factory?.coerce ?? {};
  let schema;
  if (isWithEnum(column)) {
    schema = column.enumValues.length ? z$1.enum(column.enumValues) : z$1.string();
  }
  if (!schema) {
    if (isColumnType(column, ["PgGeometry", "PgPointTuple"])) {
      schema = z$1.tuple([z$1.number(), z$1.number()]);
    } else if (isColumnType(column, ["PgGeometryObject", "PgPointObject"])) {
      schema = z$1.object({ x: z$1.number(), y: z$1.number() });
    } else if (isColumnType(column, ["PgHalfVector", "PgVector"])) {
      schema = z$1.array(z$1.number());
      schema = column.dimensions ? schema.length(column.dimensions) : schema;
    } else if (isColumnType(column, ["PgLine"])) {
      schema = z$1.tuple([z$1.number(), z$1.number(), z$1.number()]);
    } else if (isColumnType(column, ["PgLineABC"])) {
      schema = z$1.object({
        a: z$1.number(),
        b: z$1.number(),
        c: z$1.number()
      });
    } else if (isColumnType(column, ["PgArray"])) {
      schema = z$1.array(columnToSchema(column.baseColumn, z$1));
      schema = column.size ? schema.length(column.size) : schema;
    } else if (column.dataType === "array") {
      schema = z$1.array(z$1.any());
    } else if (column.dataType === "number") {
      schema = numberColumnToSchema(column, z$1, coerce);
    } else if (column.dataType === "bigint") {
      schema = bigintColumnToSchema(column, z$1, coerce);
    } else if (column.dataType === "boolean") {
      schema = coerce === true || coerce.boolean ? z$1.coerce.boolean() : z$1.boolean();
    } else if (column.dataType === "date") {
      schema = coerce === true || coerce.date ? z$1.coerce.date() : z$1.date();
    } else if (column.dataType === "string") {
      schema = stringColumnToSchema(column, z$1, coerce);
    } else if (column.dataType === "json") {
      schema = jsonSchema;
    } else if (column.dataType === "custom") {
      schema = z$1.any();
    } else if (column.dataType === "buffer") {
      schema = bufferSchema;
    }
  }
  if (!schema) {
    schema = z$1.any();
  }
  return schema;
}
function numberColumnToSchema(column, z4, coerce) {
  let unsigned = column.getSQLType().includes("unsigned");
  let min;
  let max;
  let integer2 = false;
  if (isColumnType(column, ["MySqlTinyInt", "SingleStoreTinyInt"])) {
    min = unsigned ? 0 : CONSTANTS.INT8_MIN;
    max = unsigned ? CONSTANTS.INT8_UNSIGNED_MAX : CONSTANTS.INT8_MAX;
    integer2 = true;
  } else if (isColumnType(column, [
    "PgSmallInt",
    "PgSmallSerial",
    "MySqlSmallInt",
    "SingleStoreSmallInt"
  ])) {
    min = unsigned ? 0 : CONSTANTS.INT16_MIN;
    max = unsigned ? CONSTANTS.INT16_UNSIGNED_MAX : CONSTANTS.INT16_MAX;
    integer2 = true;
  } else if (isColumnType(column, [
    "PgReal",
    "MySqlFloat",
    "MySqlMediumInt",
    "SingleStoreMediumInt",
    "SingleStoreFloat"
  ])) {
    min = unsigned ? 0 : CONSTANTS.INT24_MIN;
    max = unsigned ? CONSTANTS.INT24_UNSIGNED_MAX : CONSTANTS.INT24_MAX;
    integer2 = isColumnType(column, ["MySqlMediumInt", "SingleStoreMediumInt"]);
  } else if (isColumnType(column, [
    "PgInteger",
    "PgSerial",
    "MySqlInt",
    "SingleStoreInt"
  ])) {
    min = unsigned ? 0 : CONSTANTS.INT32_MIN;
    max = unsigned ? CONSTANTS.INT32_UNSIGNED_MAX : CONSTANTS.INT32_MAX;
    integer2 = true;
  } else if (isColumnType(column, [
    "PgDoublePrecision",
    "MySqlReal",
    "MySqlDouble",
    "SingleStoreReal",
    "SingleStoreDouble",
    "SQLiteReal"
  ])) {
    min = unsigned ? 0 : CONSTANTS.INT48_MIN;
    max = unsigned ? CONSTANTS.INT48_UNSIGNED_MAX : CONSTANTS.INT48_MAX;
  } else if (isColumnType(column, [
    "PgBigInt53",
    "PgBigSerial53",
    "MySqlBigInt53",
    "MySqlSerial",
    "SingleStoreBigInt53",
    "SingleStoreSerial",
    "SQLiteInteger"
  ])) {
    unsigned = unsigned || isColumnType(column, ["MySqlSerial", "SingleStoreSerial"]);
    min = unsigned ? 0 : Number.MIN_SAFE_INTEGER;
    max = Number.MAX_SAFE_INTEGER;
    integer2 = true;
  } else if (isColumnType(column, ["MySqlYear", "SingleStoreYear"])) {
    min = 1901;
    max = 2155;
    integer2 = true;
  } else {
    min = Number.MIN_SAFE_INTEGER;
    max = Number.MAX_SAFE_INTEGER;
  }
  let schema = coerce === true || coerce?.number ? z4.coerce.number() : z4.number();
  schema = schema.min(min).max(max);
  return integer2 ? schema.int() : schema;
}
function bigintColumnToSchema(column, z4, coerce) {
  const unsigned = column.getSQLType().includes("unsigned");
  const min = unsigned ? 0n : CONSTANTS.INT64_MIN;
  const max = unsigned ? CONSTANTS.INT64_UNSIGNED_MAX : CONSTANTS.INT64_MAX;
  const schema = coerce === true || coerce?.bigint ? z4.coerce.bigint() : z4.bigint();
  return schema.min(min).max(max);
}
function stringColumnToSchema(column, z4, coerce) {
  if (isColumnType(column, ["PgUUID"])) {
    return z4.string().uuid();
  }
  let max;
  let regex;
  let fixed = false;
  if (isColumnType(column, ["PgVarchar", "SQLiteText"])) {
    max = column.length;
  } else if (isColumnType(column, ["MySqlVarChar", "SingleStoreVarChar"])) {
    max = column.length ?? CONSTANTS.INT16_UNSIGNED_MAX;
  } else if (isColumnType(column, ["MySqlText", "SingleStoreText"])) {
    if (column.textType === "longtext") {
      max = CONSTANTS.INT32_UNSIGNED_MAX;
    } else if (column.textType === "mediumtext") {
      max = CONSTANTS.INT24_UNSIGNED_MAX;
    } else if (column.textType === "text") {
      max = CONSTANTS.INT16_UNSIGNED_MAX;
    } else {
      max = CONSTANTS.INT8_UNSIGNED_MAX;
    }
  }
  if (isColumnType(column, [
    "PgChar",
    "MySqlChar",
    "SingleStoreChar"
  ])) {
    max = column.length;
    fixed = true;
  }
  if (isColumnType(column, ["PgBinaryVector"])) {
    regex = /^[01]+$/;
    max = column.dimensions;
  }
  let schema = coerce === true || coerce?.string ? z4.coerce.string() : z4.string();
  schema = regex ? schema.regex(regex) : schema;
  return max && fixed ? schema.length(max) : max ? schema.max(max) : schema;
}
function getColumns(tableLike) {
  return isTable(tableLike) ? getTableColumns(tableLike) : getViewSelectedFields(tableLike);
}
function handleColumns(columns, refinements, conditions, factory) {
  const columnSchemas = {};
  for (const [key, selected] of Object.entries(columns)) {
    if (!is(selected, Column) && !is(selected, SQL) && !is(selected, SQL.Aliased) && typeof selected === "object") {
      const columns2 = isTable(selected) || isView(selected) ? getColumns(selected) : selected;
      columnSchemas[key] = handleColumns(columns2, refinements[key] ?? {}, conditions, factory);
      continue;
    }
    const refinement = refinements[key];
    if (refinement !== void 0 && typeof refinement !== "function") {
      columnSchemas[key] = refinement;
      continue;
    }
    const column = is(selected, Column) ? selected : void 0;
    const schema = column ? columnToSchema(column, factory) : z.any();
    const refined = typeof refinement === "function" ? refinement(schema) : schema;
    if (conditions.never(column)) {
      continue;
    } else {
      columnSchemas[key] = refined;
    }
    if (column) {
      if (conditions.nullable(column)) {
        columnSchemas[key] = columnSchemas[key].nullable();
      }
      if (conditions.optional(column)) {
        columnSchemas[key] = columnSchemas[key].optional();
      }
    }
  }
  return z.object(columnSchemas);
}
var insertConditions = {
  never: (column) => column?.generated?.type === "always" || column?.generatedIdentity?.type === "always",
  optional: (column) => !column.notNull || column.notNull && column.hasDefault,
  nullable: (column) => !column.notNull
};
var createInsertSchema = (entity, refine) => {
  const columns = getColumns(entity);
  return handleColumns(columns, refine ?? {}, insertConditions);
};

// shared/schema.ts
import { z as z2 } from "zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var userRoles = ["passenger", "driver", "dispatcher", "admin"];
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Local auth fields
  username: varchar("username").unique(),
  password: varchar("password"),
  // hashed password for local auth
  // OAuth fields
  oauthProvider: varchar("oauth_provider", { enum: ["local", "google", "apple"] }).default("local"),
  oauthId: varchar("oauth_id"),
  // ID from OAuth provider
  // User info
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var drivers = pgTable("drivers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  licenseNumber: varchar("license_number"),
  licenseExpiry: timestamp("license_expiry"),
  licenseDocumentUrl: varchar("license_document_url"),
  insuranceDocumentUrl: varchar("insurance_document_url"),
  vehiclePlate: varchar("vehicle_plate"),
  // Vehicle license plate number
  driverCredentials: varchar("driver_credentials"),
  // Additional credentials to share with passengers
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
  updatedAt: timestamp("updated_at").defaultNow()
});
var documentTypeEnum = ["driver_license", "limo_license", "insurance_certificate", "vehicle_image", "profile_photo"];
var driverDocuments = pgTable("driver_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  driverId: uuid("driver_id").references(() => drivers.id).notNull(),
  documentType: varchar("document_type", { enum: documentTypeEnum }).notNull(),
  documentUrl: text("document_url").notNull(),
  // Object storage URL
  expirationDate: timestamp("expiration_date"),
  // For licenses
  vehiclePlate: varchar("vehicle_plate"),
  // For vehicle images
  status: varchar("status", {
    enum: ["pending", "approved", "rejected"]
  }).default("pending"),
  rejectionReason: text("rejection_reason"),
  whatsappNumber: varchar("whatsapp_number"),
  // Only for driver profile
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var vehicleTypes = pgTable("vehicle_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  passengerCapacity: integer("passenger_capacity").notNull(),
  luggageCapacity: varchar("luggage_capacity"),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  // Made nullable - pricing moved to pricingRules
  perMileRate: decimal("per_mile_rate", { precision: 10, scale: 2 }),
  minimumFare: decimal("minimum_fare", { precision: 10, scale: 2 }),
  imageUrl: varchar("image_url"),
  features: jsonb("features"),
  // Array of features
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});
var vehicleTypeEnum = ["business_sedan", "business_suv", "first_class_sedan", "first_class_suv", "business_van"];
var serviceTypeEnum = ["transfer", "hourly"];
var pricingRules = pgTable("pricing_rules", {
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
  gratuityPercent: decimal("gratuity_percent", { precision: 5, scale: 2 }).default("20.00"),
  // Default 20%
  // Airport fees: [{airportCode: string, fee: number, waiverMinutes?: number}]
  airportFees: jsonb("airport_fees").$type().default(sql`'[]'::jsonb`),
  // Meet & greet: {enabled: boolean, charge: number}
  meetAndGreet: jsonb("meet_and_greet").$type().default(sql`'{"enabled": false, "charge": 0}'::jsonb`),
  // Surge pricing: [{dayOfWeek: number, startTime: string, endTime: string, multiplier: number}]
  surgePricing: jsonb("surge_pricing").$type().default(sql`'[]'::jsonb`),
  // Distance tiers for progressive pricing: [{miles: number, ratePerMile: number, isRemaining?: boolean}]
  // Example: First 20 miles @ $0, Next 24.45 miles @ $4.45, Remaining @ $3.75
  distanceTiers: jsonb("distance_tiers").$type().default(sql`'[]'::jsonb`),
  // Overtime rate for hourly bookings (rate applied after minimum hours)
  overtimeRate: decimal("overtime_rate", { precision: 10, scale: 2 }),
  // Effective date range for phased pricing changes
  effectiveStart: timestamp("effective_start"),
  effectiveEnd: timestamp("effective_end"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  uniqueVehicleService: uniqueIndex("unique_vehicle_service").on(table.vehicleType, table.serviceType)
}));
var vehicles = pgTable("vehicles", {
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
  createdAt: timestamp("created_at").defaultNow()
});
var bookings = pgTable("bookings", {
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
  viaPoints: jsonb("via_points"),
  // Array of intermediate stops
  // Scheduling
  scheduledDateTime: timestamp("scheduled_date_time").notNull(),
  estimatedDuration: integer("estimated_duration"),
  // in minutes
  estimatedDistance: decimal("estimated_distance", { precision: 8, scale: 2 }),
  // in miles
  // Hourly booking specifics
  requestedHours: integer("requested_hours"),
  // Pricing
  baseFare: decimal("base_fare", { precision: 10, scale: 2 }),
  distanceFare: decimal("distance_fare", { precision: 10, scale: 2 }),
  timeFare: decimal("time_fare", { precision: 10, scale: 2 }),
  gratuityAmount: decimal("gratuity_amount", { precision: 10, scale: 2 }),
  // Gratuity from pricing rules
  airportFeeAmount: decimal("airport_fee_amount", { precision: 10, scale: 2 }),
  // Airport fee applied
  surgePricingMultiplier: decimal("surge_pricing_multiplier", { precision: 5, scale: 2 }),
  // Surge multiplier (e.g., 1.5 for 50% increase)
  surgePricingAmount: decimal("surge_pricing_amount", { precision: 10, scale: 2 }),
  // Additional amount from surge pricing
  surcharges: jsonb("surcharges").$type().default(sql`'[]'::jsonb`),
  // Additional charges array
  regularPrice: decimal("regular_price", { precision: 10, scale: 2 }),
  // Price before discount
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }),
  // User's discount %
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
  // Calculated discount
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  // Final price after discount
  driverPayment: decimal("driver_payment", { precision: 10, scale: 2 }),
  // Amount driver gets paid (editable by admin/dispatcher)
  // Payment
  paymentStatus: varchar("payment_status", {
    enum: ["pending", "paid", "failed", "refunded"]
  }).default("pending"),
  paymentIntentId: varchar("payment_intent_id"),
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
  flightDeparture: varchar("flight_departure"),
  flightArrival: varchar("flight_arrival"),
  noFlightInfo: boolean("no_flight_info").default(false),
  // Journey tracking fields
  bookedBy: varchar("booked_by", { enum: ["admin", "passenger"] }),
  bookedAt: timestamp("booked_at"),
  confirmedAt: timestamp("confirmed_at"),
  assignedAt: timestamp("assigned_at"),
  acceptedAt: timestamp("accepted_at"),
  reminderSentAt: timestamp("reminder_sent_at"),
  // When 2-hour reminder was sent
  onTheWayAt: timestamp("on_the_way_at"),
  // When driver started journey
  arrivedAt: timestamp("arrived_at"),
  // When driver arrived at pickup
  onBoardAt: timestamp("on_board_at"),
  // When passenger boarded
  autoCancelledAt: timestamp("auto_cancelled_at"),
  // When system auto-cancelled
  acceptedLocation: jsonb("accepted_location").$type(),
  startedAt: timestamp("started_at"),
  startedLocation: jsonb("started_location").$type(),
  dodAt: timestamp("dod_at"),
  // Driver On Destination
  dodLocation: jsonb("dod_location").$type(),
  pobAt: timestamp("pob_at"),
  // Passenger On Board
  pobLocation: jsonb("pob_location").$type(),
  endedAt: timestamp("ended_at"),
  endedLocation: jsonb("ended_location").$type(),
  paymentAt: timestamp("payment_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancelReason: text("cancel_reason"),
  noShow: boolean("no_show").default(false),
  refundInvoiceSent: boolean("refund_invoice_sent").default(false),
  markedCompletedAt: timestamp("marked_completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var driverRatings = pgTable("driver_ratings", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id").references(() => bookings.id).notNull(),
  driverId: uuid("driver_id").references(() => drivers.id).notNull(),
  passengerId: varchar("passenger_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(),
  // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow()
});
var savedAddresses = pgTable("saved_addresses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  label: varchar("label").notNull(),
  // "Home", "Work", etc.
  address: text("address").notNull(),
  lat: decimal("lat", { precision: 10, scale: 8 }),
  lon: decimal("lon", { precision: 11, scale: 8 }),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var systemSettings = pgTable("system_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key").unique().notNull(),
  value: text("value"),
  description: text("description"),
  isEncrypted: boolean("is_encrypted").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id)
});
var paymentProviderEnum = ["stripe", "paypal", "square"];
var paymentSystems = pgTable("payment_systems", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: varchar("provider", { enum: paymentProviderEnum }).unique().notNull(),
  isActive: boolean("is_active").default(false),
  publicKey: text("public_key"),
  secretKey: text("secret_key"),
  webhookSecret: text("webhook_secret"),
  config: jsonb("config"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id").references(() => bookings.id).notNull(),
  invoiceNumber: varchar("invoice_number").unique().notNull(),
  baseFare: decimal("base_fare", { precision: 10, scale: 2 }),
  // Base fare before surge/gratuity
  gratuityAmount: decimal("gratuity_amount", { precision: 10, scale: 2 }),
  // Gratuity from pricing rules
  airportFeeAmount: decimal("airport_fee_amount", { precision: 10, scale: 2 }),
  // Airport fee applied
  surgePricingMultiplier: decimal("surge_pricing_multiplier", { precision: 5, scale: 2 }),
  // Surge multiplier
  surgePricingAmount: decimal("surge_pricing_amount", { precision: 10, scale: 2 }),
  // Additional amount from surge
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  // Regular price before discount
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }),
  // Discount %
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
  // Discount amount
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0.00"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  // Final amount after discount
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var paymentTokens = pgTable("payment_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id").references(() => invoices.id).notNull(),
  token: varchar("token", { length: 64 }).unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var contactSubmissions = pgTable("contact_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  serviceType: varchar("service_type"),
  message: text("message").notNull(),
  status: varchar("status", { enum: ["new", "contacted", "resolved"] }).default("new"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true
});
var insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  scheduledDateTime: z2.union([z2.date(), z2.string()]).transform((val) => {
    return typeof val === "string" ? new Date(val) : val;
  })
});
var insertContactSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  createdAt: true,
  status: true
});
var insertSavedAddressSchema = createInsertSchema(savedAddresses).omit({
  id: true,
  createdAt: true
});
var airportFeeSchema = z2.object({
  airportCode: z2.string().min(3).max(10),
  fee: z2.number().min(0),
  waiverMinutes: z2.number().min(0).optional()
});
var meetAndGreetSchema = z2.object({
  enabled: z2.boolean(),
  charge: z2.number().min(0)
});
var surgePricingSchema = z2.object({
  dayOfWeek: z2.number().min(-1).max(6),
  // -1 (All Days), 0-6 (Sunday-Saturday)
  startTime: z2.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  // HH:MM format
  endTime: z2.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  // HH:MM format
  multiplier: z2.number().min(1).max(5)
  // 1x to 5x surge
});
var distanceTierSchema = z2.object({
  miles: z2.number().min(0),
  // Number of miles in this tier (e.g., "First 20 miles" or "Next 24.45 miles")
  ratePerMile: z2.number().min(0),
  // Rate per mile for this tier
  isRemaining: z2.boolean().optional()
  // If true, this applies to all remaining miles
});
var insertPricingRuleSchema = createInsertSchema(pricingRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  airportFees: z2.array(airportFeeSchema).optional(),
  meetAndGreet: meetAndGreetSchema.optional(),
  surgePricing: z2.array(surgePricingSchema).optional(),
  distanceTiers: z2.array(distanceTierSchema).optional()
}).refine(
  (data) => {
    if (data.serviceType === "transfer") {
      const hasBaseRate = data.baseRate !== void 0 && data.baseRate !== null;
      const hasPerMileRate = data.perMileRate !== void 0 && data.perMileRate !== null;
      const hasDistanceTiers = data.distanceTiers && data.distanceTiers.length > 0;
      return hasBaseRate && (hasPerMileRate || hasDistanceTiers);
    }
    return true;
  },
  {
    message: "Transfer service requires baseRate and either perMileRate or distance tiers",
    path: ["serviceType"]
  }
).refine(
  (data) => {
    if (data.serviceType === "hourly") {
      return data.hourlyRate !== void 0 && data.hourlyRate !== null && data.minimumHours !== void 0 && data.minimumHours !== null;
    }
    return true;
  },
  {
    message: "Hourly service type requires hourlyRate and minimumHours",
    path: ["serviceType"]
  }
).refine(
  (data) => {
    if (data.distanceTiers && data.distanceTiers.length > 0) {
      const remainingIndex = data.distanceTiers.findIndex((t) => t.isRemaining);
      if (remainingIndex !== -1 && remainingIndex !== data.distanceTiers.length - 1) {
        return false;
      }
    }
    return true;
  },
  {
    message: "Remaining tier must be the last tier",
    path: ["distanceTiers"]
  }
).refine(
  (data) => {
    if (data.effectiveStart && data.effectiveEnd) {
      return new Date(data.effectiveEnd) > new Date(data.effectiveStart);
    }
    return true;
  },
  {
    message: "Effective end date must be after effective start date",
    path: ["effectiveEnd"]
  }
);
var insertPaymentSystemSchema = createInsertSchema(paymentSystems).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true
});
var insertPaymentTokenSchema = createInsertSchema(paymentTokens).omit({
  id: true,
  createdAt: true,
  used: true,
  usedAt: true
});
var insertVehicleTypeSchema = createInsertSchema(vehicleTypes).omit({
  id: true,
  createdAt: true
}).extend({
  passengerCapacity: z2.number().int().min(1).max(20),
  hourlyRate: z2.string().optional().refine((val) => !val || !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Hourly rate must be a valid positive number"
  }),
  perMileRate: z2.string().optional().refine((val) => !val || !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Per mile rate must be a valid positive number"
  }),
  minimumFare: z2.string().optional().refine((val) => !val || !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Minimum fare must be a valid positive number"
  })
});
var insertDriverDocumentSchema = createInsertSchema(driverDocuments).omit({
  id: true,
  uploadedAt: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true
});
var insertDriverRatingSchema = createInsertSchema(driverRatings).omit({
  id: true,
  createdAt: true
}).extend({
  rating: z2.number().min(1).max(5).int()
  // 1-5 stars validation
});
var cmsSettingCategoryEnum = ["branding", "colors", "social", "contact", "seo"];
var cmsSettings = pgTable("cms_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key").notNull().unique(),
  // e.g., 'logo_main', 'color_primary', 'social_facebook'
  value: text("value"),
  // Value or URL
  category: varchar("category", {
    enum: cmsSettingCategoryEnum
  }).notNull(),
  description: text("description"),
  // Human-readable description of what this setting controls
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});
var contentBlockEnum = ["hero", "about", "services", "contact", "footer", "testimonial"];
var cmsContent = pgTable("cms_content", {
  id: uuid("id").defaultRandom().primaryKey(),
  blockType: varchar("block_type", { enum: contentBlockEnum }).notNull(),
  identifier: varchar("identifier").notNull(),
  // e.g., 'hero_main', 'about_company', allows multiple of same type
  title: varchar("title"),
  // Block title
  content: text("content"),
  // Rich text content
  metadata: jsonb("metadata"),
  // Additional structured data (CTA button text, links, etc.)
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  // For ordering multiple blocks of same type
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});
var mediaFolderEnum = ["logos", "hero-images", "favicon", "vehicles", "testimonials", "general"];
var cmsMedia = pgTable("cms_media", {
  id: uuid("id").defaultRandom().primaryKey(),
  fileName: varchar("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  // Object storage URL
  fileType: varchar("file_type").notNull(),
  // MIME type
  fileSize: integer("file_size"),
  // Size in bytes
  folder: varchar("folder", { enum: mediaFolderEnum }).default("general"),
  altText: text("alt_text"),
  // For accessibility
  description: text("description"),
  width: integer("width"),
  // Image dimensions
  height: integer("height"),
  uploadedBy: varchar("uploaded_by").references(() => users.id).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});
var insertCmsSettingSchema = createInsertSchema(cmsSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertCmsContentSchema = createInsertSchema(cmsContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertCmsMediaSchema = createInsertSchema(cmsMedia).omit({
  id: true,
  createdAt: true,
  uploadedAt: true
});
var serviceIconEnum = ["Plane", "Briefcase", "Heart", "Clock", "Car", "Users", "Star", "Shield", "Calendar", "MapPin"];
var services = pgTable("services", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug").notNull().unique(),
  // SEO-friendly URL like 'airport-transfer'
  title: varchar("title").notNull(),
  subtitle: varchar("subtitle"),
  // Optional short blurb for cards
  description: text("description").notNull(),
  icon: varchar("icon", { enum: serviceIconEnum }).notNull(),
  // lucide-react icon name
  features: text("features").array().default(sql`'{}'::text[]`).notNull(),
  // array of feature strings
  imageUrl: varchar("image_url"),
  // background image URL
  imageAlt: varchar("image_alt"),
  // accessibility alt text for image
  ctaLabel: varchar("cta_label"),
  // optional call-to-action button text
  ctaUrl: varchar("cta_url"),
  // optional call-to-action button URL
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => [
  uniqueIndex("services_slug_idx").on(table.slug)
]);
var insertServiceSchema = createInsertSchema(services, {
  features: z2.array(z2.string()).default([]),
  icon: z2.enum(serviceIconEnum)
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true
});
var driverMessages = pgTable("driver_messages", {
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
  createdAt: timestamp("created_at").defaultNow()
});
var insertDriverMessageSchema = createInsertSchema(driverMessages).omit({
  id: true,
  createdAt: true,
  status: true,
  sentAt: true,
  deliveredAt: true,
  errorMessage: true
});
var emergencyIncidents = pgTable("emergency_incidents", {
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
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertEmergencyIncidentSchema = createInsertSchema(emergencyIncidents).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// server/db.ts
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
var { Pool } = pg;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});
pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err);
});
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and, desc, like, sql as sql2 } from "drizzle-orm";

// server/crypto.ts
import crypto from "crypto";
var ALGORITHM = "aes-256-gcm";
var IV_LENGTH = 16;
var KEY_LENGTH = 32;
function getEncryptionKey() {
  const keyEnv = process.env.SETTINGS_ENCRYPTION_KEY;
  if (!keyEnv) {
    throw new Error(
      "SETTINGS_ENCRYPTION_KEY environment variable is required for encrypting sensitive settings. Generate one with: openssl rand -hex 32"
    );
  }
  const keyBuffer = Buffer.from(keyEnv, "hex");
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(
      `SETTINGS_ENCRYPTION_KEY must be ${KEY_LENGTH * 2} hex characters (${KEY_LENGTH} bytes). Current length: ${keyBuffer.length} bytes. Generate with: openssl rand -hex 32`
    );
  }
  return keyBuffer;
}
function encrypt(plaintext) {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let ciphertext = cipher.update(plaintext, "utf8", "hex");
    ciphertext += cipher.final("hex");
    const authTag = cipher.getAuthTag();
    return JSON.stringify({
      ciphertext,
      iv: iv.toString("hex"),
      authTag: authTag.toString("hex")
    });
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt value");
  }
}
function decrypt(encryptedData) {
  try {
    const key = getEncryptionKey();
    const { ciphertext, iv, authTag } = JSON.parse(encryptedData);
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, "hex")
    );
    decipher.setAuthTag(Buffer.from(authTag, "hex"));
    let plaintext = decipher.update(ciphertext, "hex", "utf8");
    plaintext += decipher.final("utf8");
    return plaintext;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt value - data may be corrupted or encryption key changed");
  }
}
function hasEncryptionKey() {
  try {
    const keyEnv = process.env.SETTINGS_ENCRYPTION_KEY;
    if (!keyEnv) return false;
    const keyBuffer = Buffer.from(keyEnv, "hex");
    return keyBuffer.length === KEY_LENGTH;
  } catch {
    return false;
  }
}

// server/storage.ts
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async getUserByOAuth(provider, oauthId) {
    const [user] = await db.select().from(users).where(and(
      eq(users.oauthProvider, provider),
      eq(users.oauthId, oauthId)
    ));
    return user;
  }
  async createUser(userData) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  async getAllUsers() {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }
  async updateUser(id, updates) {
    const [user] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return user;
  }
  async deleteUser(id) {
    try {
      const userBookings = await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.passengerId, id));
      const bookingIds = userBookings.map((b) => b.id);
      const driver = await this.getDriverByUserId(id);
      let driverBookingIds = [];
      if (driver) {
        const driverBookings = await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.driverId, driver.id));
        driverBookingIds = driverBookings.map((b) => b.id);
      }
      const allBookingIds = Array.from(/* @__PURE__ */ new Set([...bookingIds, ...driverBookingIds]));
      for (const bookingId of allBookingIds) {
        const bookingInvoices = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.bookingId, bookingId));
        for (const invoice of bookingInvoices) {
          await db.delete(paymentTokens).where(eq(paymentTokens.invoiceId, invoice.id));
        }
      }
      for (const bookingId of allBookingIds) {
        await db.delete(invoices).where(eq(invoices.bookingId, bookingId));
      }
      for (const bookingId of allBookingIds) {
        await db.delete(driverRatings).where(eq(driverRatings.bookingId, bookingId));
      }
      for (const bookingId of allBookingIds) {
        await db.update(emergencyIncidents).set({ bookingId: null }).where(eq(emergencyIncidents.bookingId, bookingId));
      }
      await db.update(emergencyIncidents).set({ driverId: null }).where(eq(emergencyIncidents.driverId, id));
      await db.delete(emergencyIncidents).where(eq(emergencyIncidents.reporterId, id));
      await db.update(emergencyIncidents).set({ assignedTo: null }).where(eq(emergencyIncidents.assignedTo, id));
      await db.delete(driverMessages).where(eq(driverMessages.senderId, id));
      await db.delete(driverMessages).where(eq(driverMessages.driverId, id));
      await db.delete(savedAddresses).where(eq(savedAddresses.userId, id));
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, id));
      await db.update(driverDocuments).set({ reviewedBy: null }).where(eq(driverDocuments.reviewedBy, id));
      await db.update(systemSettings).set({ updatedBy: null }).where(eq(systemSettings.updatedBy, id));
      await db.update(cmsSettings).set({ updatedBy: null }).where(eq(cmsSettings.updatedBy, id));
      await db.update(cmsContent).set({ updatedBy: null }).where(eq(cmsContent.updatedBy, id));
      await db.delete(cmsMedia).where(eq(cmsMedia.uploadedBy, id));
      for (const bookingId of allBookingIds) {
        await db.delete(bookings).where(eq(bookings.id, bookingId));
      }
      if (driver) {
        await db.delete(driverDocuments).where(eq(driverDocuments.driverId, driver.id));
        await db.delete(drivers).where(eq(drivers.id, driver.id));
      }
      const result2 = await db.delete(users).where(eq(users.id, id)).returning();
      return result2.length > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
  // Password Reset Methods (User Table-based)
  async setPasswordResetToken(userId, hashedToken, expiresAt) {
    await db.update(users).set({
      passwordResetToken: hashedToken,
      passwordResetExpires: expiresAt,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userId));
  }
  async clearPasswordResetToken(userId) {
    await db.update(users).set({
      passwordResetToken: null,
      passwordResetExpires: null,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userId));
  }
  async getUserByPasswordResetToken(hashedToken) {
    const [user] = await db.select().from(users).where(eq(users.passwordResetToken, hashedToken));
    return user;
  }
  async getUserByEmailOrPhone(emailOrPhone) {
    const normalized = emailOrPhone.trim().toLowerCase();
    const [userByEmail] = await db.select().from(users).where(sql2`LOWER(${users.email}) = ${normalized}`);
    if (userByEmail) return userByEmail;
    const [userByPhone] = await db.select().from(users).where(eq(users.phone, emailOrPhone.trim()));
    return userByPhone;
  }
  async createDriver(driverData) {
    const [driver] = await db.insert(drivers).values(driverData).returning();
    return driver;
  }
  async getDriver(id) {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver;
  }
  async getDriverByUserId(userId) {
    const [driver] = await db.select().from(drivers).where(eq(drivers.userId, userId));
    return driver;
  }
  async updateDriverVerificationStatus(id, status) {
    await db.update(drivers).set({ verificationStatus: status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(drivers.id, id));
  }
  async updateDriverAvailability(id, isAvailable) {
    const [updated] = await db.update(drivers).set({ isAvailable, updatedAt: /* @__PURE__ */ new Date() }).where(eq(drivers.id, id)).returning();
    return updated;
  }
  async updateDriverLocation(id, location) {
    const [updated] = await db.update(drivers).set({ currentLocation: location, updatedAt: /* @__PURE__ */ new Date() }).where(eq(drivers.id, id)).returning();
    return updated;
  }
  async updateDriver(id, updates) {
    const [updated] = await db.update(drivers).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(drivers.id, id)).returning();
    return updated;
  }
  async getAvailableDrivers() {
    return await db.select().from(drivers).where(and(eq(drivers.isAvailable, true), eq(drivers.verificationStatus, "verified")));
  }
  async getAllDrivers() {
    return await db.select().from(drivers);
  }
  // GPS Tracking
  async updateUserLocation(userId, latitude, longitude) {
    await db.update(users).set({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      lastLocationUpdate: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userId));
  }
  async getDriverLocations() {
    const driverUsers = await db.select({
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      profileImageUrl: users.profileImageUrl,
      isActive: users.isActive,
      latitude: users.latitude,
      longitude: users.longitude,
      lastLocationUpdate: users.lastLocationUpdate,
      driverId: drivers.id,
      rating: drivers.rating,
      totalRides: drivers.totalRides,
      isAvailable: drivers.isAvailable
    }).from(users).leftJoin(drivers, eq(users.id, drivers.userId)).where(eq(users.role, "driver"));
    const driversWithBookings = await Promise.all(
      driverUsers.map(async (driver) => {
        if (!driver.driverId) {
          return {
            ...driver,
            status: "offline",
            statusColor: "grey",
            currentBooking: null
          };
        }
        const [activeBooking] = await db.select().from(bookings).where(
          and(
            eq(bookings.driverId, driver.driverId),
            sql2`${bookings.status} IN ('pending_driver_acceptance', 'confirmed', 'on_the_way', 'arrived', 'on_board', 'in_progress')`
          )
        ).orderBy(desc(bookings.scheduledDateTime)).limit(1);
        let status = "offline";
        let statusColor = "grey";
        if (driver.isActive && driver.isAvailable) {
          if (!activeBooking) {
            status = "online";
            statusColor = "green";
          } else {
            if (activeBooking.status === "confirmed" || activeBooking.status === "on_the_way" || activeBooking.status === "arrived") {
              status = "on_the_way";
              statusColor = "black";
            } else if (activeBooking.status === "on_board" || activeBooking.status === "in_progress") {
              status = "customer_in_car";
              statusColor = "red";
            } else {
              status = "online";
              statusColor = "green";
            }
          }
        }
        return {
          ...driver,
          status,
          statusColor,
          currentBooking: activeBooking || null
        };
      })
    );
    return driversWithBookings;
  }
  async getVehicleTypes() {
    return await db.select().from(vehicleTypes).where(eq(vehicleTypes.isActive, true)).orderBy(vehicleTypes.hourlyRate);
  }
  async getAllVehicleTypes() {
    return await db.select().from(vehicleTypes).orderBy(vehicleTypes.hourlyRate);
  }
  async getVehicleType(id) {
    const [vehicleType] = await db.select().from(vehicleTypes).where(eq(vehicleTypes.id, id));
    return vehicleType;
  }
  async createVehicleType(vehicleTypeData) {
    const [vehicleType] = await db.insert(vehicleTypes).values(vehicleTypeData).returning();
    return vehicleType;
  }
  async updateVehicleType(id, updates) {
    const [updated] = await db.update(vehicleTypes).set(updates).where(eq(vehicleTypes.id, id)).returning();
    return updated;
  }
  async deleteVehicleType(id) {
    await db.delete(vehicleTypes).where(eq(vehicleTypes.id, id));
  }
  async createVehicle(vehicleData) {
    const [vehicle] = await db.insert(vehicles).values(vehicleData).returning();
    return vehicle;
  }
  async getVehiclesByDriver(driverId) {
    return await db.select().from(vehicles).where(and(eq(vehicles.driverId, driverId), eq(vehicles.isActive, true)));
  }
  // Service operations (CMS)
  async getActiveServices() {
    return await db.select().from(services).where(eq(services.isActive, true)).orderBy(services.displayOrder);
  }
  async getAllServices() {
    return await db.select().from(services).orderBy(services.displayOrder);
  }
  async getService(id) {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }
  async createService(serviceData) {
    const [service] = await db.insert(services).values(serviceData).returning();
    return service;
  }
  async updateService(id, updates) {
    const [updated] = await db.update(services).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(services.id, id)).returning();
    return updated;
  }
  async deleteService(id) {
    await db.delete(services).where(eq(services.id, id));
  }
  async createBooking(bookingData) {
    const [booking] = await db.insert(bookings).values(bookingData).returning();
    try {
      const invoice = await this.createInvoiceForBooking(booking);
      if (!invoice) {
        throw new Error("Invoice creation returned undefined");
      }
    } catch (error) {
      await db.delete(bookings).where(eq(bookings.id, booking.id));
      throw new Error(`Failed to create invoice for booking: ${error instanceof Error ? error.message : String(error)}`);
    }
    return booking;
  }
  async getBooking(id) {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }
  async getBookingsByUser(userId) {
    return await db.select().from(bookings).where(eq(bookings.passengerId, userId)).orderBy(desc(bookings.createdAt));
  }
  async getBookingsByDriver(driverId) {
    return await db.select().from(bookings).where(eq(bookings.driverId, driverId)).orderBy(desc(bookings.scheduledDateTime));
  }
  async getAllBookings() {
    return await db.select().from(bookings).orderBy(desc(bookings.scheduledDateTime));
  }
  async updateBookingStatus(id, status) {
    await db.update(bookings).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(bookings.id, id));
  }
  async updateBookingPayment(id, paymentIntentId, status) {
    await db.update(bookings).set({
      paymentIntentId,
      paymentStatus: status,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(bookings.id, id));
  }
  async updateBookingDriverPayment(id, driverPayment) {
    const [updated] = await db.update(bookings).set({
      driverPayment,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(bookings.id, id)).returning();
    return updated;
  }
  async updateBooking(id, updates) {
    const [booking] = await db.update(bookings).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(bookings.id, id)).returning();
    if (booking && (updates.totalAmount !== void 0 || updates.baseFare !== void 0 || updates.distanceFare !== void 0 || updates.timeFare !== void 0 || updates.surcharges !== void 0 || updates.paymentStatus !== void 0)) {
      await this.syncInvoiceWithBooking(booking);
    }
    return booking;
  }
  async deleteBooking(id) {
    await db.delete(invoices).where(eq(invoices.bookingId, id));
    await db.delete(driverRatings).where(eq(driverRatings.bookingId, id));
    await db.delete(emergencyIncidents).where(eq(emergencyIncidents.bookingId, id));
    await db.delete(bookings).where(eq(bookings.id, id));
  }
  async addAdditionalCharge(bookingId, charge) {
    const booking = await this.getBooking(bookingId);
    if (!booking) return void 0;
    const existingSurcharges = booking.surcharges || [];
    const newSurcharges = [
      ...existingSurcharges,
      {
        ...charge,
        addedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    ];
    const existingSurchargesTotal = existingSurcharges.reduce((sum, s) => {
      const amount = typeof s.amount === "number" ? s.amount : parseFloat(s.amount || "0");
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    const currentTotal = parseFloat(booking.totalAmount || "0");
    if (isNaN(currentTotal)) {
      throw new Error("Invalid booking total amount");
    }
    const baseFare = Math.max(0, currentTotal - existingSurchargesTotal);
    const totalChargesAmount = newSurcharges.reduce((sum, s) => {
      const amount = typeof s.amount === "number" ? s.amount : parseFloat(s.amount || "0");
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    const newTotal = baseFare + totalChargesAmount;
    const [updated] = await db.update(bookings).set({
      surcharges: newSurcharges,
      totalAmount: newTotal.toFixed(2),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(bookings.id, bookingId)).returning();
    return updated;
  }
  async createSavedAddress(addressData) {
    const [address] = await db.insert(savedAddresses).values(addressData).returning();
    return address;
  }
  async getSavedAddressesByUser(userId) {
    return await db.select().from(savedAddresses).where(eq(savedAddresses.userId, userId)).orderBy(savedAddresses.label);
  }
  async deleteSavedAddress(id, userId) {
    await db.delete(savedAddresses).where(and(eq(savedAddresses.id, id), eq(savedAddresses.userId, userId)));
  }
  async getSystemSetting(key) {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
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
  async getSystemSettingValue(key) {
    const setting = await this.getSystemSetting(key);
    return setting?.value || null;
  }
  async getAllSystemSettings() {
    const settings = await db.select().from(systemSettings);
    return settings.map((setting) => {
      if (setting.isEncrypted && setting.value) {
        try {
          const decryptedValue = decrypt(setting.value);
          return { ...setting, value: decryptedValue };
        } catch (error) {
          console.error(`Failed to decrypt setting ${setting.key}:`, error);
          return setting;
        }
      }
      return setting;
    });
  }
  async updateSystemSetting(key, value, userId) {
    await db.insert(systemSettings).values({ key, value, updatedBy: userId, isEncrypted: false }).onConflictDoUpdate({
      target: systemSettings.key,
      set: { value, updatedBy: userId, updatedAt: /* @__PURE__ */ new Date(), isEncrypted: false }
    });
  }
  async updateEncryptedSetting(key, value, userId, description) {
    try {
      const encryptedValue = encrypt(value);
      await db.insert(systemSettings).values({
        key,
        value: encryptedValue,
        updatedBy: userId,
        isEncrypted: true,
        description: description || null
      }).onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: encryptedValue,
          updatedBy: userId,
          updatedAt: /* @__PURE__ */ new Date(),
          isEncrypted: true,
          ...description && { description }
        }
      });
    } catch (error) {
      console.error(`Failed to encrypt and save setting ${key}:`, error);
      throw error;
    }
  }
  async deleteSystemSetting(key) {
    await db.delete(systemSettings).where(eq(systemSettings.key, key));
  }
  async getSetting(key) {
    return this.getSystemSetting(key);
  }
  async setSetting(key, value, userId) {
    if (!userId) {
      throw new Error("userId is required for setting system settings");
    }
    return this.updateSystemSetting(key, value, userId);
  }
  async createContactSubmission(contactData) {
    const [contact] = await db.insert(contactSubmissions).values(contactData).returning();
    return contact;
  }
  async getContactSubmissions() {
    return await db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt));
  }
  async updateContactStatus(id, status) {
    await db.update(contactSubmissions).set({ status }).where(eq(contactSubmissions.id, id));
  }
  async createInvoice(invoiceData) {
    const [invoice] = await db.insert(invoices).values(invoiceData).returning();
    return invoice;
  }
  async getInvoiceByBooking(bookingId) {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.bookingId, bookingId));
    return invoice;
  }
  async getAllInvoices() {
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }
  async getInvoice(id) {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }
  async updateInvoice(id, updates) {
    const [updated] = await db.update(invoices).set(updates).where(eq(invoices.id, id)).returning();
    return updated;
  }
  async deleteInvoice(id) {
    await db.delete(invoices).where(eq(invoices.id, id));
  }
  // Helper function to generate unique invoice numbers
  // Note: The database has a unique constraint on invoice_number which prevents duplicates
  // In case of concurrent creation, the database will reject duplicates and throw an error
  async generateInvoiceNumber() {
    const year = (/* @__PURE__ */ new Date()).getFullYear();
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const [latestInvoice] = await db.select().from(invoices).where(like(invoices.invoiceNumber, `INV-${year}%`)).orderBy(desc(invoices.invoiceNumber)).limit(1);
      let sequenceNumber = 1;
      if (latestInvoice) {
        const lastNumber = latestInvoice.invoiceNumber.split("-")[1];
        const lastSequence = parseInt(lastNumber.substring(4));
        sequenceNumber = lastSequence + 1;
      }
      const paddedSequence = sequenceNumber.toString().padStart(5, "0");
      const invoiceNumber = `INV-${year}${paddedSequence}`;
      const [existing] = await db.select().from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber)).limit(1);
      if (!existing) {
        return invoiceNumber;
      }
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
      }
    }
    const timestamp2 = Date.now().toString().slice(-5);
    return `INV-${year}${timestamp2}`;
  }
  // Helper function to create an invoice for a booking
  async createInvoiceForBooking(booking) {
    const existing = await this.getInvoiceByBooking(booking.id);
    if (existing) {
      return existing;
    }
    const baseFare = booking.baseFare ? parseFloat(booking.baseFare) : 0;
    const gratuityAmount = booking.gratuityAmount ? parseFloat(booking.gratuityAmount) : 0;
    const airportFeeAmount = booking.airportFeeAmount ? parseFloat(booking.airportFeeAmount) : 0;
    const surgePricingMultiplier = booking.surgePricingMultiplier ? parseFloat(booking.surgePricingMultiplier) : null;
    const surgePricingAmount = booking.surgePricingAmount ? parseFloat(booking.surgePricingAmount) : 0;
    const regularPrice = parseFloat(booking.regularPrice || booking.totalAmount || "0");
    const discountPercentage = booking.discountPercentage ? parseFloat(booking.discountPercentage) : 0;
    const discountAmount = booking.discountAmount ? parseFloat(booking.discountAmount) : 0;
    const totalAmount = parseFloat(booking.totalAmount || "0");
    const taxAmount = 0;
    const subtotal = regularPrice;
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
          surgePricingMultiplier,
          surgePricingAmount: surgePricingAmount > 0 ? surgePricingAmount.toFixed(2) : null,
          subtotal: subtotal.toFixed(2),
          discountPercentage: discountPercentage > 0 ? discountPercentage.toFixed(2) : null,
          discountAmount: discountAmount > 0 ? discountAmount.toFixed(2) : null,
          taxAmount: taxAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          paidAt: booking.paymentStatus === "paid" ? /* @__PURE__ */ new Date() : null
        };
        return await this.createInvoice(invoiceData);
      } catch (error) {
        const isDuplicateError = error?.code === "23505" && error?.constraint === "invoices_invoice_number_unique";
        if (isDuplicateError && attempt < maxRetries - 1) {
          const baseDelay = 50 * Math.pow(2, attempt);
          const jitter = Math.random() * baseDelay * 0.5;
          const delay = baseDelay + jitter;
          console.log(`Invoice number collision detected (attempt ${attempt + 1}/${maxRetries}), retrying in ${Math.round(delay)}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw new Error("Failed to create invoice after maximum retries");
  }
  // Helper function to sync invoice with booking changes
  async syncInvoiceWithBooking(booking) {
    const invoice = await this.getInvoiceByBooking(booking.id);
    if (!invoice) {
      await this.createInvoiceForBooking(booking);
      return;
    }
    const baseFare = booking.baseFare ? parseFloat(booking.baseFare) : 0;
    const gratuityAmount = booking.gratuityAmount ? parseFloat(booking.gratuityAmount) : 0;
    const airportFeeAmount = booking.airportFeeAmount ? parseFloat(booking.airportFeeAmount) : 0;
    const surgePricingMultiplier = booking.surgePricingMultiplier ? parseFloat(booking.surgePricingMultiplier) : null;
    const surgePricingAmount = booking.surgePricingAmount ? parseFloat(booking.surgePricingAmount) : 0;
    const regularPrice = parseFloat(booking.regularPrice || booking.totalAmount || "0");
    const discountPercentage = booking.discountPercentage ? parseFloat(booking.discountPercentage) : 0;
    const discountAmount = booking.discountAmount ? parseFloat(booking.discountAmount) : 0;
    const totalAmount = parseFloat(booking.totalAmount || "0");
    const taxAmount = 0;
    const subtotal = regularPrice;
    const updates = {
      baseFare: baseFare > 0 ? baseFare.toFixed(2) : null,
      gratuityAmount: gratuityAmount > 0 ? gratuityAmount.toFixed(2) : null,
      airportFeeAmount: airportFeeAmount > 0 ? airportFeeAmount.toFixed(2) : null,
      surgePricingMultiplier,
      surgePricingAmount: surgePricingAmount > 0 ? surgePricingAmount.toFixed(2) : null,
      subtotal: subtotal.toFixed(2),
      discountPercentage: discountPercentage > 0 ? discountPercentage.toFixed(2) : null,
      discountAmount: discountAmount > 0 ? discountAmount.toFixed(2) : null,
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2)
    };
    if (booking.paymentStatus === "paid" && !invoice.paidAt) {
      updates.paidAt = /* @__PURE__ */ new Date();
    } else if (booking.paymentStatus !== "paid" && invoice.paidAt) {
      updates.paidAt = null;
    }
    await this.updateInvoice(invoice.id, updates);
  }
  // Public method to backfill invoices for all bookings
  async backfillInvoices() {
    const allBookings = await this.getAllBookings();
    let created = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails = [];
    for (const booking of allBookings) {
      try {
        const existingInvoice = await this.getInvoiceByBooking(booking.id);
        if (existingInvoice) {
          skipped++;
          continue;
        }
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
      errorDetails: errors > 0 ? errorDetails : void 0
    };
  }
  async getAdminDashboardStats() {
    const commissionSetting = await this.getSystemSetting("SYSTEM_COMMISSION_PERCENTAGE");
    const commissionPercentage = parseFloat(commissionSetting?.value || "0");
    const [revenueResult] = await db.select({
      total: sql2`COALESCE(SUM(${bookings.totalAmount}), 0)`
    }).from(bookings).where(eq(bookings.status, "completed"));
    const totalRevenue = parseFloat(revenueResult?.total || "0");
    const totalCommission = (totalRevenue * (commissionPercentage / 100)).toFixed(2);
    const now = /* @__PURE__ */ new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const [currentMonthRevenueResult] = await db.select({
      total: sql2`COALESCE(SUM(${bookings.totalAmount}), 0)`
    }).from(bookings).where(and(
      eq(bookings.status, "completed"),
      sql2`${bookings.createdAt} >= ${currentMonthStart.toISOString()}`
    ));
    const [lastMonthRevenueResult] = await db.select({
      total: sql2`COALESCE(SUM(${bookings.totalAmount}), 0)`
    }).from(bookings).where(and(
      eq(bookings.status, "completed"),
      sql2`${bookings.createdAt} >= ${lastMonthStart.toISOString()}`,
      sql2`${bookings.createdAt} < ${currentMonthStart.toISOString()}`
    ));
    const currentMonthRevenue = parseFloat(currentMonthRevenueResult?.total || "0");
    const lastMonthRevenue = parseFloat(lastMonthRevenueResult?.total || "0");
    let revenueGrowth = "0";
    if (lastMonthRevenue > 0) {
      const growth = (currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100;
      revenueGrowth = growth.toFixed(1);
    }
    const monthlyCommission = (currentMonthRevenue * (commissionPercentage / 100)).toFixed(2);
    const [activeBookingsResult] = await db.select({
      count: sql2`COUNT(*)`
    }).from(bookings).where(sql2`${bookings.status} IN ('pending', 'confirmed', 'in_progress')`);
    const [pendingBookingsResult] = await db.select({
      count: sql2`COUNT(*)`
    }).from(bookings).where(eq(bookings.status, "pending"));
    const [totalDriversResult] = await db.select({
      count: sql2`COUNT(*)`
    }).from(drivers);
    const [activeDriversResult] = await db.select({
      count: sql2`COUNT(DISTINCT ${drivers.id})`
    }).from(drivers).innerJoin(users, eq(users.id, drivers.userId)).leftJoin(driverDocuments, eq(driverDocuments.driverId, drivers.id)).where(
      and(
        eq(users.isActive, true),
        // Check that driver has all 4 required approved documents
        sql2`EXISTS (
            SELECT 1 FROM ${driverDocuments} dd1 
            WHERE dd1.driver_id = ${drivers.id} 
            AND dd1.document_type = 'driver_license' 
            AND dd1.status = 'approved'
            AND (dd1.expiration_date IS NULL OR dd1.expiration_date >= NOW())
          )`,
        sql2`EXISTS (
            SELECT 1 FROM ${driverDocuments} dd2 
            WHERE dd2.driver_id = ${drivers.id} 
            AND dd2.document_type = 'limo_license' 
            AND dd2.status = 'approved'
            AND (dd2.expiration_date IS NULL OR dd2.expiration_date >= NOW())
          )`,
        sql2`EXISTS (
            SELECT 1 FROM ${driverDocuments} dd3 
            WHERE dd3.driver_id = ${drivers.id} 
            AND dd3.document_type = 'insurance_certificate' 
            AND dd3.status = 'approved'
            AND (dd3.expiration_date IS NULL OR dd3.expiration_date >= NOW())
          )`,
        sql2`EXISTS (
            SELECT 1 FROM ${driverDocuments} dd4 
            WHERE dd4.driver_id = ${drivers.id} 
            AND dd4.document_type = 'vehicle_image' 
            AND dd4.status = 'approved'
          )`
      )
    );
    const [pendingDriversResult] = await db.select({
      count: sql2`COUNT(*)`
    }).from(drivers).where(eq(drivers.verificationStatus, "pending"));
    const [ratingResult] = await db.select({
      avg: sql2`COALESCE(AVG(${drivers.rating}), 0)`
    }).from(drivers).where(eq(drivers.verificationStatus, "verified"));
    const thirtyDaysAgo = /* @__PURE__ */ new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = /* @__PURE__ */ new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const [recentRatingResult] = await db.select({
      avg: sql2`COALESCE(AVG(${drivers.rating}), 0)`
    }).from(drivers).innerJoin(bookings, eq(bookings.driverId, drivers.id)).where(and(
      eq(drivers.verificationStatus, "verified"),
      eq(bookings.status, "completed"),
      sql2`${bookings.createdAt} >= ${thirtyDaysAgo.toISOString()}`
    ));
    const [previousRatingResult] = await db.select({
      avg: sql2`COALESCE(AVG(${drivers.rating}), 0)`
    }).from(drivers).innerJoin(bookings, eq(bookings.driverId, drivers.id)).where(and(
      eq(drivers.verificationStatus, "verified"),
      eq(bookings.status, "completed"),
      sql2`${bookings.createdAt} >= ${sixtyDaysAgo.toISOString()}`,
      sql2`${bookings.createdAt} < ${thirtyDaysAgo.toISOString()}`
    ));
    const recentRating = parseFloat(recentRatingResult?.avg || "0");
    const previousRating = parseFloat(previousRatingResult?.avg || "0");
    let ratingImprovement = "0";
    if (recentRating > 0 && previousRating > 0) {
      ratingImprovement = (recentRating - previousRating).toFixed(1);
    }
    const [awaitingDriverApprovalResult] = await db.select({
      count: sql2`COUNT(*)`
    }).from(bookings).where(eq(bookings.status, "pending_driver_acceptance"));
    return {
      totalRevenue: revenueResult?.total || "0",
      monthlyRevenue: currentMonthRevenueResult?.total || "0",
      totalCommission,
      monthlyCommission,
      activeBookings: activeBookingsResult?.count || 0,
      totalDrivers: totalDriversResult?.count || 0,
      activeDrivers: activeDriversResult?.count || 0,
      averageRating: ratingResult?.avg || "0",
      pendingBookings: pendingBookingsResult?.count || 0,
      pendingDrivers: pendingDriversResult?.count || 0,
      awaitingDriverApproval: awaitingDriverApprovalResult?.count || 0,
      revenueGrowth,
      ratingImprovement
    };
  }
  async getDispatcherDashboardStats() {
    const [activeDriversResult] = await db.select({
      count: sql2`COUNT(*)`
    }).from(drivers).innerJoin(users, eq(users.id, drivers.userId)).where(
      and(
        eq(users.isActive, true),
        eq(drivers.isAvailable, true),
        eq(drivers.verificationStatus, "verified")
      )
    );
    const [activeRidesResult] = await db.select({
      count: sql2`COUNT(*)`
    }).from(bookings).where(eq(bookings.status, "in_progress"));
    const [pendingRequestsResult] = await db.select({
      count: sql2`COUNT(*)`
    }).from(bookings).where(eq(bookings.status, "pending"));
    const [pendingApprovalsResult] = await db.select({
      count: sql2`COUNT(*)`
    }).from(drivers).where(eq(drivers.verificationStatus, "pending"));
    const [totalActiveVehiclesResult] = await db.select({
      count: sql2`COUNT(*)`
    }).from(vehicles).where(eq(vehicles.isActive, true));
    const [vehiclesInUseResult] = await db.select({
      count: sql2`COUNT(DISTINCT ${vehicles.id})`
    }).from(vehicles).innerJoin(bookings, eq(bookings.vehicleId, vehicles.id)).where(
      and(
        eq(vehicles.isActive, true),
        eq(bookings.status, "in_progress")
      )
    );
    const totalVehicles = totalActiveVehiclesResult?.count || 0;
    const vehiclesInUse = vehiclesInUseResult?.count || 0;
    const utilization = totalVehicles > 0 ? (vehiclesInUse / totalVehicles * 100).toFixed(0) : "0";
    return {
      activeDrivers: activeDriversResult?.count || 0,
      activeRides: activeRidesResult?.count || 0,
      pendingRequests: pendingRequestsResult?.count || 0,
      pendingApprovals: pendingApprovalsResult?.count || 0,
      fleetUtilization: `${utilization}%`
    };
  }
  async updateStripeCustomerId(userId, customerId) {
    const [user] = await db.update(users).set({ stripeCustomerId: customerId, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId)).returning();
    return user;
  }
  async updateUserStripeInfo(userId, stripeInfo) {
    const [user] = await db.update(users).set({
      stripeCustomerId: stripeInfo.customerId,
      stripeSubscriptionId: stripeInfo.subscriptionId,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userId)).returning();
    return user;
  }
  // Pricing rules methods
  async getPricingRules() {
    return await db.select().from(pricingRules).orderBy(pricingRules.vehicleType, pricingRules.serviceType);
  }
  async getPricingRule(id) {
    const [rule] = await db.select().from(pricingRules).where(eq(pricingRules.id, id));
    return rule;
  }
  async getPricingRuleByType(vehicleType, serviceType) {
    const [rule] = await db.select().from(pricingRules).where(
      and(
        sql2`${pricingRules.vehicleType} = ${vehicleType}`,
        sql2`${pricingRules.serviceType} = ${serviceType}`,
        eq(pricingRules.isActive, true)
      )
    );
    return rule;
  }
  async createPricingRule(rule) {
    const [newRule] = await db.insert(pricingRules).values(rule).returning();
    return newRule;
  }
  async updatePricingRule(id, rule) {
    const [updatedRule] = await db.update(pricingRules).set({ ...rule, updatedAt: /* @__PURE__ */ new Date() }).where(eq(pricingRules.id, id)).returning();
    return updatedRule;
  }
  async deletePricingRule(id) {
    await db.delete(pricingRules).where(eq(pricingRules.id, id));
  }
  // Payment Systems methods
  async getPaymentSystems() {
    return await db.select().from(paymentSystems).orderBy(sql2`${paymentSystems.provider}`);
  }
  async getPaymentSystem(provider) {
    const [system] = await db.select().from(paymentSystems).where(sql2`${paymentSystems.provider} = ${provider}`);
    return system;
  }
  async getActivePaymentSystem() {
    const [system] = await db.select().from(paymentSystems).where(eq(paymentSystems.isActive, true));
    return system;
  }
  async createPaymentSystem(system) {
    const [newSystem] = await db.insert(paymentSystems).values(system).returning();
    return newSystem;
  }
  async updatePaymentSystem(provider, updates) {
    const [updatedSystem] = await db.update(paymentSystems).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(sql2`${paymentSystems.provider} = ${provider}`).returning();
    return updatedSystem;
  }
  async setActivePaymentSystem(provider) {
    await db.update(paymentSystems).set({ isActive: false });
    await db.update(paymentSystems).set({ isActive: true }).where(sql2`${paymentSystems.provider} = ${provider}`);
  }
  async deletePaymentSystem(provider) {
    await db.delete(paymentSystems).where(sql2`${paymentSystems.provider} = ${provider}`);
  }
  async createDriverDocument(doc) {
    const [newDoc] = await db.insert(driverDocuments).values(doc).returning();
    return newDoc;
  }
  async getDriverDocuments(driverId) {
    return await db.select().from(driverDocuments).where(eq(driverDocuments.driverId, driverId)).orderBy(desc(driverDocuments.uploadedAt));
  }
  async getDriverDocument(id) {
    const [doc] = await db.select().from(driverDocuments).where(eq(driverDocuments.id, id));
    return doc;
  }
  async updateDriverDocumentStatus(id, status, rejectionReason, reviewedBy) {
    const [updatedDoc] = await db.update(driverDocuments).set({
      status,
      rejectionReason,
      reviewedBy,
      reviewedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(driverDocuments.id, id)).returning();
    return updatedDoc;
  }
  async deleteDriverDocument(id) {
    const result2 = await db.delete(driverDocuments).where(eq(driverDocuments.id, id)).returning();
    return result2.length > 0;
  }
  // Driver Ratings methods
  async createDriverRating(rating) {
    const [newRating] = await db.insert(driverRatings).values(rating).returning();
    const avgResult = await db.select({ avg: sql2`AVG(${driverRatings.rating})` }).from(driverRatings).where(eq(driverRatings.driverId, rating.driverId));
    if (avgResult[0]?.avg) {
      await db.update(drivers).set({ rating: avgResult[0].avg }).where(eq(drivers.id, rating.driverId));
    }
    return newRating;
  }
  async getDriverRatings(driverId) {
    return await db.select().from(driverRatings).where(eq(driverRatings.driverId, driverId)).orderBy(desc(driverRatings.createdAt));
  }
  async getBookingRating(bookingId) {
    const [rating] = await db.select().from(driverRatings).where(eq(driverRatings.bookingId, bookingId));
    return rating;
  }
  async getDriverAverageRating(driverId) {
    const [result2] = await db.select({ avg: sql2`COALESCE(AVG(${driverRatings.rating}), 0)` }).from(driverRatings).where(eq(driverRatings.driverId, driverId));
    return parseFloat(result2?.avg || "0");
  }
  async getAllBookingsWithDetails() {
    const allBookings = await db.select({
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
      markedCompletedAt: bookings.markedCompletedAt
    }).from(bookings).leftJoin(users, eq(bookings.passengerId, users.id)).orderBy(desc(bookings.createdAt));
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
            driverVehiclePlate = driver.vehiclePlate;
          }
        }
        return {
          ...booking,
          passengerName: `${booking.passengerFirstName || ""} ${booking.passengerLastName || ""}`.trim(),
          driverFirstName,
          driverLastName,
          driverPhone,
          driverProfileImageUrl,
          driverVehiclePlate
        };
      })
    );
    return bookingsWithDriverDetails;
  }
  async getActiveDrivers() {
    const activeDriversData = await db.select({
      id: drivers.id,
      userId: drivers.userId,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email
    }).from(drivers).innerJoin(users, eq(drivers.userId, users.id)).where(eq(users.isActive, true));
    return activeDriversData;
  }
  async assignDriverToBooking(bookingId, driverId, driverPayment) {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    if (!booking) {
      throw new Error("Booking not found");
    }
    let finalDriverPayment;
    if (driverPayment) {
      finalDriverPayment = driverPayment;
    } else {
      const commissionSetting = await this.getSystemSetting("SYSTEM_COMMISSION_PERCENTAGE");
      const commissionPercentage = parseFloat(commissionSetting?.value || "30");
      const totalAmount = parseFloat(booking.totalAmount || "0");
      const calculatedPayment = totalAmount * (1 - commissionPercentage / 100);
      finalDriverPayment = calculatedPayment.toFixed(2);
    }
    const [updatedBooking] = await db.update(bookings).set({
      driverId,
      driverPayment: finalDriverPayment,
      status: "pending_driver_acceptance",
      assignedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(bookings.id, bookingId)).returning();
    if (!updatedBooking) {
      throw new Error("Booking not found");
    }
    return updatedBooking;
  }
  // CMS Settings Methods
  async getCmsSettings() {
    return await db.select().from(cmsSettings).orderBy(cmsSettings.key);
  }
  async getCmsSetting(key) {
    const [setting] = await db.select().from(cmsSettings).where(eq(cmsSettings.key, key));
    return setting;
  }
  async getCmsSettingsByCategory(category) {
    return await db.select().from(cmsSettings).where(eq(cmsSettings.category, category));
  }
  async upsertCmsSetting(setting) {
    const [result2] = await db.insert(cmsSettings).values({
      ...setting,
      updatedAt: /* @__PURE__ */ new Date()
    }).onConflictDoUpdate({
      target: cmsSettings.key,
      set: {
        value: setting.value,
        category: setting.category,
        description: setting.description,
        updatedBy: setting.updatedBy,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return result2;
  }
  async deleteCmsSetting(key) {
    await db.delete(cmsSettings).where(eq(cmsSettings.key, key));
  }
  // CMS Content Methods
  async getCmsContent(activeOnly = false) {
    const query = db.select().from(cmsContent);
    if (activeOnly) {
      return await query.where(eq(cmsContent.isActive, true)).orderBy(cmsContent.sortOrder);
    }
    return await query.orderBy(cmsContent.sortOrder);
  }
  async getCmsContentById(id) {
    const [content] = await db.select().from(cmsContent).where(eq(cmsContent.id, id));
    return content;
  }
  async getCmsContentByType(blockType, activeOnly = false) {
    if (activeOnly) {
      return await db.select().from(cmsContent).where(and(eq(cmsContent.blockType, blockType), eq(cmsContent.isActive, true))).orderBy(cmsContent.sortOrder);
    }
    return await db.select().from(cmsContent).where(eq(cmsContent.blockType, blockType)).orderBy(cmsContent.sortOrder);
  }
  async getCmsContentByIdentifier(identifier) {
    const [content] = await db.select().from(cmsContent).where(eq(cmsContent.identifier, identifier));
    return content;
  }
  async createCmsContent(content) {
    const [result2] = await db.insert(cmsContent).values({
      ...content,
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return result2;
  }
  async updateCmsContent(id, updates) {
    const [result2] = await db.update(cmsContent).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(cmsContent.id, id)).returning();
    return result2;
  }
  async deleteCmsContent(id) {
    await db.delete(cmsContent).where(eq(cmsContent.id, id));
  }
  // CMS Media Methods
  async getCmsMedia() {
    return await db.select().from(cmsMedia).orderBy(desc(cmsMedia.uploadedAt));
  }
  async getCmsMediaById(id) {
    const [media] = await db.select().from(cmsMedia).where(eq(cmsMedia.id, id));
    return media;
  }
  async getCmsMediaByFolder(folder) {
    return await db.select().from(cmsMedia).where(eq(cmsMedia.folder, folder)).orderBy(desc(cmsMedia.uploadedAt));
  }
  async createCmsMedia(media) {
    const [result2] = await db.insert(cmsMedia).values({
      ...media,
      uploadedAt: /* @__PURE__ */ new Date()
    }).returning();
    return result2;
  }
  async updateCmsMedia(id, updates) {
    const [result2] = await db.update(cmsMedia).set(updates).where(eq(cmsMedia.id, id)).returning();
    return result2;
  }
  async deleteCmsMedia(id) {
    await db.delete(cmsMedia).where(eq(cmsMedia.id, id));
  }
  // Password Reset Token Methods
  async createPasswordResetToken(data) {
    const [token] = await db.insert(passwordResetTokens).values(data).returning();
    return token;
  }
  async getPasswordResetToken(token) {
    const [resetToken] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return resetToken;
  }
  async markPasswordResetTokenAsUsed(token) {
    await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.token, token));
  }
  // Payment Token Methods
  async createPaymentToken(data) {
    const [token] = await db.insert(paymentTokens).values(data).returning();
    return token;
  }
  async getPaymentToken(token) {
    const [paymentToken] = await db.select().from(paymentTokens).where(eq(paymentTokens.token, token));
    return paymentToken;
  }
  async markPaymentTokenAsUsed(token) {
    await db.update(paymentTokens).set({
      used: true,
      usedAt: /* @__PURE__ */ new Date()
    }).where(eq(paymentTokens.token, token));
  }
  async cleanupExpiredPaymentTokens() {
    await db.delete(paymentTokens).where(sql2`${paymentTokens.expiresAt} < NOW()`);
  }
  // Driver Messages Methods
  async createDriverMessage(message) {
    const [result2] = await db.insert(driverMessages).values({
      ...message,
      createdAt: /* @__PURE__ */ new Date()
    }).returning();
    return result2;
  }
  async getDriverMessages(driverId) {
    if (driverId) {
      return await db.select().from(driverMessages).where(eq(driverMessages.driverId, driverId)).orderBy(desc(driverMessages.createdAt));
    }
    return await db.select().from(driverMessages).orderBy(desc(driverMessages.createdAt));
  }
  async getDriverMessage(id) {
    const [message] = await db.select().from(driverMessages).where(eq(driverMessages.id, id));
    return message;
  }
  async updateDriverMessageStatus(id, status, sentAt, deliveredAt, errorMessage) {
    const updates = { status };
    if (sentAt) updates.sentAt = sentAt;
    if (deliveredAt) updates.deliveredAt = deliveredAt;
    if (errorMessage) updates.errorMessage = errorMessage;
    const [result2] = await db.update(driverMessages).set(updates).where(eq(driverMessages.id, id)).returning();
    return result2;
  }
  // Emergency Incidents Methods
  async createEmergencyIncident(incident) {
    const [result2] = await db.insert(emergencyIncidents).values({
      ...incident,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return result2;
  }
  async getEmergencyIncidents(status) {
    if (status) {
      return await db.select().from(emergencyIncidents).where(eq(emergencyIncidents.status, status)).orderBy(desc(emergencyIncidents.createdAt));
    }
    return await db.select().from(emergencyIncidents).orderBy(desc(emergencyIncidents.createdAt));
  }
  async getEmergencyIncident(id) {
    const [incident] = await db.select().from(emergencyIncidents).where(eq(emergencyIncidents.id, id));
    return incident;
  }
  async updateEmergencyIncident(id, updates) {
    const [result2] = await db.update(emergencyIncidents).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(emergencyIncidents.id, id)).returning();
    return result2;
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as AppleStrategy } from "passport-apple";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual, createHash } from "crypto";
import { promisify } from "util";
var PgSession = connectPg(session);
var MemStore = MemoryStore(session);
var scryptAsync = promisify(scrypt);
var PASSWORD_RESET_EXPIRY_MS = parseInt(process.env.PASSWORD_RESET_EXPIRY_MINUTES || "60") * 60 * 1e3;
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  try {
    const parts = stored.split(".");
    if (parts.length !== 2) {
      return false;
    }
    const [hashed, salt] = parts;
    if (!hashed || !salt) {
      return false;
    }
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    return false;
  }
}
function generateResetToken() {
  return randomBytes(32).toString("hex");
}
function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}
function isTokenExpired(expiresAt) {
  return /* @__PURE__ */ new Date() > expiresAt;
}
function setupAuth(app2) {
  app2.set("trust proxy", 1);
  const isProduction = process.env.NODE_ENV === "production";
  const sessionStore = isProduction ? new PgSession({
    pool,
    tableName: "session",
    createTableIfMissing: false,
    // FIXED: Table already exists, don't try to recreate
    errorLog: (...args) => {
      const error = args[0];
      if (!error?.message?.includes("already exists")) {
        console.error("[SESSION STORE ERROR]", ...args);
      }
    }
  }) : new MemStore({
    checkPeriod: 864e5
    // prune expired entries every 24h
  });
  console.log(`[SESSION] Using ${isProduction ? "PostgreSQL" : "Memory"} session store`);
  const sessionSettings = {
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    // Don't save if unmodified (best practice)
    saveUninitialized: false,
    // Don't create session until something stored
    rolling: true,
    // Reset maxAge on every request
    name: "connect.sid",
    proxy: true,
    // Trust the proxy for Replit environment
    cookie: {
      secure: false,
      // Allow both HTTP and HTTPS
      httpOnly: true,
      // Prevent XSS attacks
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1e3
    }
  };
  app2.use(session(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log("[AUTH] Login attempt for username:", username);
        const user = await storage.getUserByUsername(username);
        console.log("[AUTH] User found:", user ? "Yes" : "No");
        if (!user || !user.password) {
          console.log("[AUTH] User not found or no password");
          return done(null, false, { message: "Invalid username or password" });
        }
        console.log("[AUTH] Stored password hash:", user.password);
        console.log("[AUTH] Password length:", password.length);
        const isValid = await comparePasswords(password, user.password);
        console.log("[AUTH] Password valid:", isValid);
        if (!isValid) {
          return done(null, false, { message: "Invalid username or password" });
        }
        if (!user.isActive) {
          console.log("[AUTH] Account is inactive");
          return done(null, false, { message: "Account is inactive. Please contact an administrator." });
        }
        return done(null, user);
      } catch (error) {
        console.error("[AUTH] Error during authentication:", error);
        return done(error);
      }
    })
  );
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
          passReqToCallback: true
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            let user = await storage.getUserByOAuth("google", profile.id);
            if (!user) {
              const email = profile.emails?.[0]?.value;
              const firstName = profile.name?.givenName || "";
              const lastName = profile.name?.familyName || "";
              const profileImageUrl = profile.photos?.[0]?.value;
              const role = req.session?.selectedRole || "passenger";
              user = await storage.createUser({
                email,
                firstName,
                lastName,
                profileImageUrl,
                oauthProvider: "google",
                oauthId: profile.id,
                role,
                isActive: true
              });
            }
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }
  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
    passport.use(
      new AppleStrategy(
        {
          clientID: process.env.APPLE_CLIENT_ID,
          teamID: process.env.APPLE_TEAM_ID,
          keyID: process.env.APPLE_KEY_ID,
          privateKeyString: process.env.APPLE_PRIVATE_KEY,
          callbackURL: "/api/auth/apple/callback",
          passReqToCallback: true
        },
        async (req, accessToken, refreshToken, idToken, profile, done) => {
          try {
            let user = await storage.getUserByOAuth("apple", profile.id);
            if (!user) {
              const email = profile.email;
              const firstName = profile.name?.firstName || "";
              const lastName = profile.name?.lastName || "";
              const role = req.session?.selectedRole || "passenger";
              user = await storage.createUser({
                email,
                firstName,
                lastName,
                oauthProvider: "apple",
                oauthId: profile.id,
                role,
                isActive: true
              });
            }
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }
  passport.serializeUser((user, done) => {
    console.log("\u{1F535} Serializing user:", user.id);
    done(null, String(user.id));
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const userId = String(id);
      console.log("\u{1F535} Deserializing user ID:", userId);
      const user = await storage.getUser(userId);
      if (!user) {
        console.error("\u{1F534} User not found for ID:", userId);
        return done(null, false);
      }
      console.log("\u{1F535} User found:", user.username || user.email);
      done(null, user);
    } catch (error) {
      console.error("\u{1F534} Deserialization error:", error);
      done(error, false);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, email, firstName, lastName, role } = req.body;
      if (!username || !password || !email) {
        return res.status(400).json({ message: "Username, password, and email are required" });
      }
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const hashedPassword = await hashPassword(password);
      const userRole = role || "passenger";
      const defaultIsActive = userRole === "admin" ? false : true;
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        firstName,
        lastName,
        role: userRole,
        oauthProvider: "local",
        isActive: defaultIsActive
      });
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Registration login error:", loginErr);
          return next(loginErr);
        }
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Registration session save error:", saveErr);
            return next(saveErr);
          }
          const { password: _, ...userWithoutPassword } = user;
          res.status(201).json(userWithoutPassword);
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });
  app2.post("/api/login", (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Login session error:", loginErr);
          return next(loginErr);
        }
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return next(saveErr);
          }
          const { password: _, ...userWithoutPassword } = user;
          res.status(200).json(userWithoutPassword);
        });
      });
    })(req, res, next);
  });
  app2.get("/api/auth/google", (req, res, next) => {
    if (req.query.role) {
      req.session.selectedRole = req.query.role;
    }
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
  });
  app2.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      const role = req.user?.role;
      const redirectPath = role === "admin" ? "/admin" : role === "driver" ? "/driver" : role === "dispatcher" ? "/dispatcher" : "/passenger";
      res.redirect(redirectPath);
    }
  );
  app2.post("/api/auth/apple", (req, res, next) => {
    if (req.body.role) {
      req.session.selectedRole = req.body.role;
    }
    passport.authenticate("apple")(req, res, next);
  });
  app2.post(
    "/api/auth/apple/callback",
    passport.authenticate("apple", { failureRedirect: "/login" }),
    (req, res) => {
      const role = req.user?.role;
      const redirectPath = role === "admin" ? "/admin" : role === "driver" ? "/driver" : role === "dispatcher" ? "/dispatcher" : "/passenger";
      res.redirect(redirectPath);
    }
  );
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("Session destroy error:", destroyErr);
        }
        res.clearCookie("connect.sid");
        res.redirect("/");
      });
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });
  app2.get("/api/debug/session", (req, res) => {
    res.json({
      sessionID: req.sessionID,
      sessionExists: !!req.session,
      sessionPassport: req.session?.passport,
      isAuthenticated: req.isAuthenticated(),
      userId: req.user?.id,
      cookies: req.headers.cookie,
      protocol: req.protocol,
      secure: req.secure,
      headers: {
        "x-forwarded-proto": req.get("x-forwarded-proto"),
        "x-forwarded-host": req.get("x-forwarded-host"),
        "x-forwarded-for": req.get("x-forwarded-for")
      }
    });
  });
}
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
}

// server/routes.ts
import { z as z3 } from "zod";
import Stripe from "stripe";
import multer from "multer";
import crypto2 from "crypto";

// server/objectStorageAdapter.ts
import { Client as ObjectStorageClient } from "@replit/object-storage";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadBucketCommand, CreateBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
var bucketExistsCache = /* @__PURE__ */ new Map();
var ReplitStorageAdapter = class {
  client;
  constructor(bucketId) {
    this.client = new ObjectStorageClient({ bucketId });
  }
  async uploadFromBytes(path4, data, metadata) {
    try {
      const result2 = await this.client.uploadFromBytes(path4, data);
      if (result2.ok) {
        return { ok: true };
      } else {
        return { ok: false, error: result2.error?.message || "Upload failed" };
      }
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
  async downloadAsBytes(path4) {
    try {
      const result2 = await this.client.downloadAsBytes(path4);
      if (result2.ok) {
        return { ok: true, value: result2.value };
      } else {
        return { ok: false, error: result2.error?.message || "Download failed" };
      }
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
  async getDownloadUrl(path4) {
    try {
      return { ok: true, url: path4 };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
  async delete(path4) {
    try {
      const result2 = await this.client.delete(path4);
      if (result2.ok) {
        return { ok: true };
      } else {
        return { ok: false, error: result2.error?.message || "Delete failed" };
      }
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
  async list(prefix) {
    try {
      const result2 = await this.client.list({ prefix: prefix || "" });
      if (result2.ok && result2.value) {
        const keys = result2.value.map((obj) => obj.key);
        return { ok: true, keys };
      } else {
        return { ok: false, error: result2.error?.message || "List failed" };
      }
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
  async listWithMetadata(prefix) {
    try {
      const result2 = await this.client.list({ prefix: prefix || "" });
      if (result2.ok && result2.value) {
        const objects = result2.value.map((obj) => ({
          key: obj.key,
          size: obj.size || 0,
          lastModified: obj.lastModified ? new Date(obj.lastModified) : /* @__PURE__ */ new Date(),
          url: obj.key
          // For Replit storage, we'll construct URL server-side
        }));
        return { ok: true, objects };
      } else {
        return { ok: false, error: result2.error?.message || "List failed" };
      }
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
};
var S3StorageAdapter = class {
  client;
  bucket;
  endpoint;
  initPromise;
  constructor(config) {
    this.bucket = config.bucket;
    this.endpoint = config.endpoint;
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region || "us-east-1",
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      },
      forcePathStyle: config.forcePathStyle !== false
      // Default to true for MinIO
    });
    this.initPromise = this.ensureBucket();
  }
  /**
   * Ensures the bucket exists, creating it if necessary
   * Uses a global cache to avoid repeated API calls
   */
  async ensureBucket() {
    const cacheKey = `${this.endpoint}:${this.bucket}`;
    if (bucketExistsCache.get(cacheKey)) {
      return;
    }
    try {
      const headCommand = new HeadBucketCommand({ Bucket: this.bucket });
      await this.client.send(headCommand);
      bucketExistsCache.set(cacheKey, true);
      console.log(`[STORAGE] Bucket '${this.bucket}' exists`);
    } catch (error) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        console.log(`[STORAGE] Bucket '${this.bucket}' not found, creating...`);
        try {
          const createCommand = new CreateBucketCommand({ Bucket: this.bucket });
          await this.client.send(createCommand);
          bucketExistsCache.set(cacheKey, true);
          console.log(`[STORAGE] Successfully created bucket '${this.bucket}'`);
        } catch (createError) {
          if (createError.name === "BucketAlreadyOwnedByYou" || createError.$metadata?.httpStatusCode === 409) {
            bucketExistsCache.set(cacheKey, true);
            console.log(`[STORAGE] Bucket '${this.bucket}' already exists (created by another process)`);
          } else if (createError.$metadata?.httpStatusCode === 403) {
            console.error(`[STORAGE] Permission denied creating bucket '${this.bucket}'. Please create it manually or grant CreateBucket permission.`);
            throw createError;
          } else {
            console.error(`[STORAGE] Failed to create bucket '${this.bucket}':`, createError.message);
            throw createError;
          }
        }
      } else if (error.$metadata?.httpStatusCode === 403) {
        console.warn(`[STORAGE] Permission denied checking bucket '${this.bucket}'. Assuming it exists.`);
        bucketExistsCache.set(cacheKey, true);
      } else {
        console.error(`[STORAGE] Error checking bucket '${this.bucket}':`, error.message);
        throw error;
      }
    }
  }
  async uploadFromBytes(path4, data, metadata) {
    try {
      await this.initPromise;
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: path4,
        Body: data,
        ContentType: metadata?.contentType
      });
      await this.client.send(command);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
  async downloadAsBytes(path4) {
    try {
      await this.initPromise;
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: path4
      });
      const response = await this.client.send(command);
      if (response.Body) {
        const chunks = [];
        for await (const chunk of response.Body) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        return { ok: true, value: buffer };
      }
      return { ok: false, error: "No data in response" };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
  async getDownloadUrl(path4) {
    try {
      await this.initPromise;
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: path4
      });
      const url = await getSignedUrl(this.client, command, { expiresIn: 3600 });
      return { ok: true, url };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
  async delete(path4) {
    try {
      await this.initPromise;
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: path4
      });
      await this.client.send(command);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
  async list(prefix) {
    try {
      await this.initPromise;
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix || ""
      });
      const response = await this.client.send(command);
      const keys = response.Contents?.map((obj) => obj.Key || "") || [];
      return { ok: true, keys };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
  async listWithMetadata(prefix) {
    try {
      await this.initPromise;
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix || ""
      });
      const response = await this.client.send(command);
      if (!response.Contents) {
        return { ok: true, objects: [] };
      }
      const objects = await Promise.all(
        response.Contents.map(async (obj) => {
          const key = obj.Key || "";
          const urlResult = await this.getDownloadUrl(key);
          return {
            key,
            size: obj.Size || 0,
            lastModified: obj.LastModified || /* @__PURE__ */ new Date(),
            url: urlResult.ok ? urlResult.url : void 0
          };
        })
      );
      return { ok: true, objects };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
};
function getStorageAdapter(credentials) {
  const minioEndpoint = credentials?.minioEndpoint || process.env.MINIO_ENDPOINT;
  const minioAccessKey = credentials?.minioAccessKey || process.env.MINIO_ACCESS_KEY;
  const minioSecretKey = credentials?.minioSecretKey || process.env.MINIO_SECRET_KEY;
  const minioBucket = credentials?.minioBucket || process.env.MINIO_BUCKET || "usa-luxury-limo";
  if (minioEndpoint && minioAccessKey && minioSecretKey) {
    if (!minioBucket || typeof minioBucket !== "string" || minioBucket.trim() === "") {
      throw new Error("Invalid MinIO bucket name. Bucket name must be a non-empty string.");
    }
    console.log("[STORAGE] Using MinIO/S3 storage adapter");
    return new S3StorageAdapter({
      endpoint: minioEndpoint,
      accessKeyId: minioAccessKey,
      secretAccessKey: minioSecretKey,
      bucket: minioBucket.trim(),
      forcePathStyle: true
      // Required for MinIO
    });
  }
  const s3Bucket = process.env.S3_BUCKET;
  const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
  const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const awsRegion = process.env.AWS_REGION || "us-east-1";
  if (s3Bucket && awsAccessKey && awsSecretKey) {
    console.log("[STORAGE] Using AWS S3 storage adapter");
    return new S3StorageAdapter({
      endpoint: `https://s3.${awsRegion}.amazonaws.com`,
      region: awsRegion,
      accessKeyId: awsAccessKey,
      secretAccessKey: awsSecretKey,
      bucket: s3Bucket,
      forcePathStyle: false
      // AWS S3 uses virtual-hosted-style
    });
  }
  const replitBucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (replitBucketId) {
    console.log("[STORAGE] Using Replit Object Storage adapter");
    return new ReplitStorageAdapter(replitBucketId);
  }
  throw new Error("No object storage configured. Set either MINIO_* or S3_* or DEFAULT_OBJECT_STORAGE_BUCKET_ID environment variables.");
}

// server/email.ts
import nodemailer from "nodemailer";
var cachedTransporter = null;
var lastSettingsCheck = 0;
var CACHE_DURATION = 5 * 60 * 1e3;
async function getSMTPSettings() {
  try {
    const [host, port, secure, user, password, fromEmail, fromName] = await Promise.all([
      storage.getSystemSetting("SMTP_HOST"),
      storage.getSystemSetting("SMTP_PORT"),
      storage.getSystemSetting("SMTP_SECURE"),
      storage.getSystemSetting("SMTP_USER"),
      storage.getSystemSetting("SMTP_PASSWORD"),
      storage.getSystemSetting("SMTP_FROM_EMAIL"),
      storage.getSystemSetting("SMTP_FROM_NAME")
    ]);
    if (!host?.value || !port?.value || !user?.value || !password?.value || !fromEmail?.value) {
      return null;
    }
    return {
      host: host.value,
      port: parseInt(port.value),
      secure: secure?.value === "true",
      user: user.value,
      password: password.value,
      fromEmail: fromEmail.value,
      fromName: fromName?.value || "USA Luxury Limo"
    };
  } catch (error) {
    console.error("Error fetching SMTP settings:", error);
    return null;
  }
}
async function getTransporter() {
  const now = Date.now();
  if (cachedTransporter && now - lastSettingsCheck < CACHE_DURATION) {
    return cachedTransporter;
  }
  const settings = await getSMTPSettings();
  if (!settings) {
    console.log("SMTP settings not configured");
    return null;
  }
  try {
    const transportConfig = {
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: {
        user: settings.user,
        pass: settings.password
      }
    };
    if (settings.port === 587 && !settings.secure) {
      transportConfig.requireTLS = true;
    }
    cachedTransporter = nodemailer.createTransport(transportConfig);
    lastSettingsCheck = now;
    return cachedTransporter;
  } catch (error) {
    console.error("Error creating SMTP transporter:", error);
    return null;
  }
}
async function sendEmail(options) {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      console.error("Email transporter not available - check SMTP settings");
      return false;
    }
    const settings = await getSMTPSettings();
    if (!settings) {
      return false;
    }
    const mailOptions = {
      from: `"${settings.fromName}" <${settings.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, "")
      // Strip HTML for text version
    };
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}
async function testSMTPConnection() {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      return {
        success: false,
        message: "SMTP settings are not configured. Please configure SMTP settings first."
      };
    }
    await transporter.verify();
    return {
      success: true,
      message: "SMTP connection successful! Email server is ready to send emails."
    };
  } catch (error) {
    console.error("SMTP connection test failed:", error);
    return {
      success: false,
      message: `SMTP connection failed: ${error.message || "Unknown error"}`
    };
  }
}
function getContactFormEmailHTML(data) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .field { margin-bottom: 20px; }
          .field-label { font-weight: bold; color: #555; margin-bottom: 5px; }
          .field-value { background: white; padding: 12px; border-radius: 4px; border: 1px solid #e0e0e0; }
          .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">\u{1F697} New Contact Form Submission</h1>
            <p style="margin: 10px 0 0 0;">USA Luxury Limo</p>
          </div>
          <div class="content">
            <div class="field">
              <div class="field-label">From:</div>
              <div class="field-value">${data.firstName} ${data.lastName}</div>
            </div>
            <div class="field">
              <div class="field-label">Email:</div>
              <div class="field-value"><a href="mailto:${data.email}">${data.email}</a></div>
            </div>
            ${data.phone ? `
            <div class="field">
              <div class="field-label">Phone:</div>
              <div class="field-value"><a href="tel:${data.phone}">${data.phone}</a></div>
            </div>
            ` : ""}
            ${data.serviceType ? `
            <div class="field">
              <div class="field-label">Service Type:</div>
              <div class="field-value">${data.serviceType}</div>
            </div>
            ` : ""}
            <div class="field">
              <div class="field-label">Message:</div>
              <div class="field-value" style="white-space: pre-wrap;">${data.message}</div>
            </div>
            <div class="field">
              <div class="field-label">Submitted At:</div>
              <div class="field-value">${data.submittedAt}</div>
            </div>
          </div>
          <div class="footer">
            <p>This email was sent from the USA Luxury Limo contact form.</p>
            <p>Please respond to the customer at <a href="mailto:${data.email}">${data.email}</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}
function getBookingConfirmationEmailHTML(data) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #555; }
          .detail-value { color: #333; }
          .total-amount { font-size: 24px; font-weight: bold; color: #1a1a2e; text-align: center; margin: 20px 0; padding: 20px; background: #fff3cd; border-radius: 8px; }
          .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">\u2705 Booking Confirmation</h1>
            <p style="margin: 10px 0 0 0;">USA Luxury Limo</p>
          </div>
          <div class="content">
            <p>Dear ${data.passengerName},</p>
            <p>Thank you for choosing USA Luxury Limo! Your booking has been confirmed.</p>
            
            <div class="booking-details">
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">${data.bookingId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Pickup Location:</span>
                <span class="detail-value">${data.pickupAddress}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Destination:</span>
                <span class="detail-value">${data.destinationAddress}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Scheduled Date & Time:</span>
                <span class="detail-value">${data.scheduledDateTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Vehicle Type:</span>
                <span class="detail-value">${data.vehicleType}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">${data.status.toUpperCase()}</span>
              </div>
            </div>

            <div class="total-amount">
              Total Amount: $${data.totalAmount}
            </div>

            <p><strong>Important Information:</strong></p>
            <ul>
              <li>Please be ready 10 minutes before your scheduled pickup time</li>
              <li>Our driver will contact you before arrival</li>
              <li>For any changes or cancellations, please contact us immediately</li>
            </ul>
          </div>
          <div class="footer">
            <p><strong>USA Luxury Limo</strong></p>
            <p>Your journey, our passion.</p>
            <p>For support, please contact us through our website.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
function getBookingStatusUpdateEmailHTML(data) {
  const statusEmoji = {
    pending: "\u23F3",
    confirmed: "\u2705",
    in_progress: "\u{1F697}",
    completed: "\u{1F3C1}",
    cancelled: "\u274C"
  };
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .status-update { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .status-badge { display: inline-block; padding: 10px 20px; border-radius: 20px; font-weight: bold; margin: 10px; }
          .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">\u{1F4CB} Booking Status Update</h1>
            <p style="margin: 10px 0 0 0;">USA Luxury Limo</p>
          </div>
          <div class="content">
            <p>Dear ${data.passengerName},</p>
            <p>Your booking status has been updated.</p>
            
            <div class="status-update">
              <h3>Booking ID: ${data.bookingId}</h3>
              <p>
                <span class="status-badge" style="background: #ffebee; color: #c62828;">${statusEmoji[data.oldStatus] || ""} ${data.oldStatus.toUpperCase()}</span>
                <span style="font-size: 24px;">\u2192</span>
                <span class="status-badge" style="background: #e8f5e9; color: #2e7d32;">${statusEmoji[data.newStatus] || ""} ${data.newStatus.toUpperCase()}</span>
              </p>
              <p style="margin-top: 20px;"><strong>Pickup:</strong> ${data.pickupAddress}</p>
              <p><strong>Scheduled:</strong> ${data.scheduledDateTime}</p>
            </div>
          </div>
          <div class="footer">
            <p><strong>USA Luxury Limo</strong></p>
            <p>For questions or support, please contact us through our website.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
function getDriverAssignmentEmailHTML(data) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .ride-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #555; display: block; margin-bottom: 5px; }
          .detail-value { color: #333; }
          .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">\u{1F697} New Ride Assignment</h1>
            <p style="margin: 10px 0 0 0;">USA Luxury Limo</p>
          </div>
          <div class="content">
            <p>Dear ${data.driverName},</p>
            <p>You have been assigned a new ride. Please review the details below:</p>
            
            <div class="ride-details">
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">${data.bookingId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Passenger Name:</span>
                <span class="detail-value">${data.passengerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Passenger Phone:</span>
                <span class="detail-value"><a href="tel:${data.passengerPhone}">${data.passengerPhone}</a></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Pickup Location:</span>
                <span class="detail-value">${data.pickupAddress}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Destination:</span>
                <span class="detail-value">${data.destinationAddress}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Scheduled Date & Time:</span>
                <span class="detail-value">${data.scheduledDateTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Vehicle Type:</span>
                <span class="detail-value">${data.vehicleType}</span>
              </div>
              ${data.driverPayment ? `
              <div class="detail-row" style="background: #e8f5e9; margin-top: 10px; padding: 15px; border-radius: 4px;">
                <span class="detail-label" style="color: #2e7d32; font-size: 16px;">\u{1F4B0} Your Payment for this Ride:</span>
                <span class="detail-value" style="color: #2e7d32; font-size: 20px; font-weight: bold;">$${data.driverPayment}</span>
              </div>
              ` : ""}
            </div>

            <p><strong>Action Required:</strong></p>
            <ul>
              <li>Please confirm your availability immediately</li>
              <li>Prepare the assigned vehicle</li>
              <li>Contact the passenger 30 minutes before pickup</li>
              <li>Arrive 10 minutes before scheduled time</li>
            </ul>
          </div>
          <div class="footer">
            <p><strong>USA Luxury Limo</strong></p>
            <p>Drive safely and provide excellent service!</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
function getPaymentConfirmationEmailHTML(data) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #1e293b; 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 20px;
          }
          .email-wrapper { max-width: 680px; margin: 0 auto; }
          .email-card { 
            background: #ffffff; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          }
          
          /* Header with Logo */
          .header { 
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
          }
          .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%);
          }
          .logo-container {
            background: white;
            padding: 15px 30px;
            border-radius: 12px;
            display: inline-block;
            margin-bottom: 15px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .logo-img { 
            max-height: 50px; 
            max-width: 220px; 
            display: block;
          }
          .company-name {
            font-size: 28px;
            font-weight: 700;
            color: #1e293b;
            margin: 0;
          }
          .tagline {
            color: rgba(255, 255, 255, 0.95);
            font-size: 15px;
            margin-top: 8px;
            font-weight: 500;
            letter-spacing: 0.5px;
          }
          
          /* Success Banner */
          .success-banner {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            border-left: 5px solid #10b981;
            padding: 25px 30px;
            text-align: center;
          }
          .success-icon {
            width: 60px;
            height: 60px;
            background: #10b981;
            border-radius: 50%;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            color: white;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          }
          .success-title {
            font-size: 26px;
            font-weight: 700;
            color: #065f46;
            margin-bottom: 5px;
          }
          .success-subtitle {
            color: #047857;
            font-size: 15px;
          }
          
          /* Content Area */
          .content { 
            padding: 40px 30px;
            background: #ffffff;
          }
          .greeting {
            font-size: 17px;
            color: #334155;
            margin-bottom: 12px;
            font-weight: 600;
          }
          .intro-text {
            color: #64748b;
            margin-bottom: 30px;
            font-size: 15px;
          }
          
          /* Amount Card */
          .amount-card {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border: 2px solid #93c5fd;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
          }
          .amount-label {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #3b82f6;
            font-weight: 600;
            margin-bottom: 10px;
          }
          .amount-value {
            font-size: 48px;
            font-weight: 800;
            color: #1d4ed8;
            margin: 10px 0;
            letter-spacing: -1px;
          }
          .amount-date {
            font-size: 13px;
            color: #64748b;
            margin-top: 10px;
          }
          
          /* Details Section */
          .details-section {
            margin: 35px 0;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
          }
          .section-header {
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            padding: 15px 20px;
            border-bottom: 2px solid #cbd5e1;
          }
          .section-title {
            font-size: 16px;
            font-weight: 700;
            color: #1e293b;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .section-icon {
            width: 20px;
            height: 20px;
            background: #3b82f6;
            border-radius: 4px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 16px 20px;
            border-bottom: 1px solid #f1f5f9;
            align-items: flex-start;
          }
          .detail-row:last-child { border-bottom: none; }
          .detail-label {
            font-weight: 600;
            color: #64748b;
            font-size: 14px;
            flex: 0 0 40%;
          }
          .detail-value {
            color: #1e293b;
            text-align: right;
            font-size: 14px;
            flex: 1;
            font-weight: 500;
          }
          
          /* Info Box */
          .info-box {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-left: 4px solid #f59e0b;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
          }
          .info-title {
            font-size: 15px;
            font-weight: 700;
            color: #92400e;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .info-text {
            font-size: 13px;
            color: #78350f;
            line-height: 1.5;
          }
          
          /* What's Next Section */
          .next-steps {
            background: #f8fafc;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
          }
          .next-steps-title {
            font-size: 17px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .next-steps ul {
            list-style: none;
            margin: 0;
            padding: 0;
          }
          .next-steps li {
            padding: 10px 0;
            padding-left: 30px;
            position: relative;
            color: #475569;
            font-size: 14px;
            line-height: 1.6;
          }
          .next-steps li:before {
            content: '\u2713';
            position: absolute;
            left: 0;
            top: 10px;
            width: 20px;
            height: 20px;
            background: #10b981;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
          }
          
          /* Footer */
          .footer {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 30px;
            text-align: center;
            border-top: 3px solid #e2e8f0;
          }
          .footer-logo {
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 8px;
          }
          .footer-tagline {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 15px;
            font-style: italic;
          }
          .footer-note {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
          }
          
          /* Responsive */
          @media only screen and (max-width: 600px) {
            body { padding: 10px; }
            .content, .success-banner { padding: 25px 20px; }
            .header { padding: 30px 20px; }
            .amount-value { font-size: 36px; }
            .detail-row { flex-direction: column; gap: 5px; }
            .detail-label, .detail-value { flex: 1; text-align: left; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-card">
            <!-- Header with Logo -->
            <div class="header">
              ${data.logoDataUri ? `
                <div class="logo-container">
                  <img src="${data.logoDataUri}" alt="USA Luxury Limo" class="logo-img" />
                </div>
              ` : `
                <div class="logo-container">
                  <h1 class="company-name">USA LUXURY LIMO</h1>
                </div>
              `}
              <p class="tagline">Ride in Style, Always on Time</p>
            </div>

            <!-- Success Banner -->
            <div class="success-banner">
              <div class="success-icon">\u2713</div>
              <h2 class="success-title">Payment Successful!</h2>
              <p class="success-subtitle">Thank you for choosing USA Luxury Limo</p>
            </div>

            <!-- Content -->
            <div class="content">
              <p class="greeting">Dear ${data.passengerName},</p>
              <p class="intro-text">Your payment has been processed successfully. Below is your payment confirmation and booking details.</p>

              <!-- Amount Paid -->
              <div class="amount-card">
                <div class="amount-label">Total Amount Paid</div>
                <div class="amount-value">$${parseFloat(data.amount).toFixed(2)}</div>
                <div class="amount-date">Payment Date: ${data.paymentDate}</div>
              </div>

              <!-- Payment Information -->
              <div class="details-section">
                <div class="section-header">
                  <div class="section-title">
                    <span class="section-icon">\u{1F4B3}</span>
                    Payment Information
                  </div>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Invoice Number</span>
                  <span class="detail-value">${data.invoiceNumber}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Booking Reference</span>
                  <span class="detail-value">#${data.bookingId.toUpperCase().substring(0, 8)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Transaction ID</span>
                  <span class="detail-value">${data.paymentIntentId.substring(0, 20)}...</span>
                </div>
              </div>

              <!-- Journey Details -->
              <div class="details-section">
                <div class="section-header">
                  <div class="section-title">
                    <span class="section-icon">\u{1F697}</span>
                    Journey Details
                  </div>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Scheduled Date & Time</span>
                  <span class="detail-value">${new Date(data.scheduledDateTime).toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Pickup Location</span>
                  <span class="detail-value">${data.pickupAddress}</span>
                </div>
                ${data.destinationAddress ? `
                <div class="detail-row">
                  <span class="detail-label">Destination</span>
                  <span class="detail-value">${data.destinationAddress}</span>
                </div>
                ` : ""}
              </div>

              <!-- Receipt Notice -->
              <div class="info-box">
                <div class="info-title">
                  <span>\u{1F4E7}</span> Receipt Sent
                </div>
                <p class="info-text">
                  A detailed payment receipt has been sent to your email by Stripe for your records.
                </p>
              </div>

              <!-- What's Next -->
              <div class="next-steps">
                <div class="next-steps-title">
                  <span>\u{1F4CB}</span> What's Next?
                </div>
                <ul>
                  <li>Please be ready 10 minutes before your scheduled pickup time</li>
                  <li>Our professional driver will contact you prior to arrival</li>
                  <li>Save this confirmation email for your records</li>
                  <li>Contact us immediately if you need to make any changes</li>
                </ul>
              </div>

              <p style="color: #64748b; font-size: 14px; margin-top: 25px;">
                If you have any questions or concerns about your booking, please don't hesitate to contact our customer support team.
              </p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p class="footer-logo">USA LUXURY LIMO</p>
              <p class="footer-tagline">Your Journey, Our Passion</p>
              <p class="footer-note">
                This is an automated confirmation email. Please do not reply directly to this message.<br>
                For support, please contact our customer service team.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
function getTestEmailHTML() {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .success-badge { background: #e8f5e9; color: #2e7d32; padding: 15px; border-radius: 8px; text-align: center; font-weight: bold; margin: 20px 0; }
          .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">\u2705 SMTP Test Email</h1>
            <p style="margin: 10px 0 0 0;">USA Luxury Limo</p>
          </div>
          <div class="content">
            <div class="success-badge">
              \u{1F389} Congratulations! Your SMTP configuration is working correctly.
            </div>
            <p>This is a test email to verify that your email sending functionality is properly configured.</p>
            <p><strong>What this means:</strong></p>
            <ul>
              <li>Your SMTP settings are correct</li>
              <li>Email server connection is successful</li>
              <li>You can now send automated emails to your customers</li>
            </ul>
            <p>Your USA Luxury Limo system is now ready to send:</p>
            <ul>
              <li>Contact form notifications</li>
              <li>Booking confirmations</li>
              <li>Status update notifications</li>
              <li>Driver assignment alerts</li>
            </ul>
          </div>
          <div class="footer">
            <p><strong>USA Luxury Limo Email System</strong></p>
            <p>Sent at: ${(/* @__PURE__ */ new Date()).toLocaleString()}</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
function getDriverOnTheWayEmailHTML(data) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .alert-banner { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-left: 5px solid #2563eb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .driver-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #555; display: block; margin-bottom: 5px; }
          .detail-value { color: #333; }
          .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">\u{1F697} Driver On The Way!</h1>
            <p style="margin: 10px 0 0 0;">USA Luxury Limo</p>
          </div>
          <div class="content">
            <p>Dear ${data.passengerName},</p>
            
            <div class="alert-banner">
              <h3 style="margin-top: 0; color: #1e40af;">Your driver is on the way to pick you up!</h3>
              <p style="margin-bottom: 0; font-size: 16px;">${data.estimatedArrival ? `Estimated arrival: <strong>${data.estimatedArrival}</strong>` : "Please be ready for pickup."}</p>
            </div>
            
            <div class="driver-info">
              <h3 style="margin-top: 0;">Driver Information</h3>
              <div class="detail-row">
                <span class="detail-label">Driver Name:</span>
                <span class="detail-value">${data.driverName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Contact Number:</span>
                <span class="detail-value"><a href="tel:${data.driverPhone}">${data.driverPhone}</a></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Vehicle Type:</span>
                <span class="detail-value">${data.vehicleType}</span>
              </div>
            </div>

            <div class="driver-info">
              <h3 style="margin-top: 0;">Booking Details</h3>
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">${data.bookingId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Pickup Location:</span>
                <span class="detail-value">${data.pickupAddress}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Scheduled Time:</span>
                <span class="detail-value">${data.scheduledDateTime}</span>
              </div>
            </div>

            <p><strong>Please Note:</strong></p>
            <ul>
              <li>Be ready and waiting at your pickup location</li>
              <li>Keep your phone nearby in case the driver needs to contact you</li>
              <li>Have your luggage ready for a smooth pickup</li>
            </ul>
          </div>
          <div class="footer">
            <p><strong>USA Luxury Limo</strong></p>
            <p>Your journey, our passion.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
function getDriverArrivedEmailHTML(data) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .alert-banner { background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-left: 5px solid #16a34a; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .driver-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #555; display: block; margin-bottom: 5px; }
          .detail-value { color: #333; }
          .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">\u{1F4CD} Driver Has Arrived!</h1>
            <p style="margin: 10px 0 0 0;">USA Luxury Limo</p>
          </div>
          <div class="content">
            <p>Dear ${data.passengerName},</p>
            
            <div class="alert-banner">
              <h2 style="margin: 0; color: #15803d; font-size: 24px;">\u2713 Your driver has arrived at the pickup location!</h2>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Please proceed to your vehicle.</p>
            </div>
            
            <div class="driver-info">
              <h3 style="margin-top: 0;">Driver Information</h3>
              <div class="detail-row">
                <span class="detail-label">Driver Name:</span>
                <span class="detail-value">${data.driverName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Contact Number:</span>
                <span class="detail-value"><a href="tel:${data.driverPhone}">${data.driverPhone}</a></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Vehicle Type:</span>
                <span class="detail-value">${data.vehicleType}</span>
              </div>
            </div>

            <div class="driver-info">
              <h3 style="margin-top: 0;">Pickup Location</h3>
              <p style="margin: 0; padding: 15px; background: #fef3c7; border-radius: 4px;">
                \u{1F4CD} ${data.pickupAddress}
              </p>
            </div>

            <p><strong>What to do next:</strong></p>
            <ul>
              <li>Proceed to the pickup location immediately</li>
              <li>Look for your ${data.vehicleType}</li>
              <li>Contact the driver if you have trouble locating the vehicle</li>
              <li>Have your belongings ready to load</li>
            </ul>
          </div>
          <div class="footer">
            <p><strong>USA Luxury Limo</strong></p>
            <p>Enjoy your ride!</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
function getBookingCancelledEmailHTML(data) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .alert-box { background: #fee2e2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #555; }
          .detail-value { color: #333; }
          .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">\u274C Booking Cancelled</h1>
            <p style="margin: 10px 0 0 0;">USA Luxury Limo</p>
          </div>
          <div class="content">
            <p>Dear ${data.passengerName},</p>
            
            <div class="alert-box">
              <h3 style="margin-top: 0; color: #dc2626;">Your booking has been cancelled</h3>
              <p>Booking ID: <strong>${data.bookingId}</strong></p>
              ${data.cancelReason ? `
              <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 4px;">
                <strong>Cancellation Reason:</strong><br>
                ${data.cancelReason}
              </div>
              ` : ""}
            </div>
            
            <div class="booking-details">
              <h3 style="margin-top: 0;">Cancelled Booking Details</h3>
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">${data.bookingId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Pickup Location:</span>
                <span class="detail-value">${data.pickupAddress}</span>
              </div>
              ${data.destinationAddress ? `
              <div class="detail-row">
                <span class="detail-label">Destination:</span>
                <span class="detail-value">${data.destinationAddress}</span>
              </div>
              ` : ""}
              <div class="detail-row">
                <span class="detail-label">Scheduled Date & Time:</span>
                <span class="detail-value">${data.scheduledDateTime}</span>
              </div>
            </div>

            <p>If you need to make a new booking, please visit our website or contact us directly.</p>
            <p>If you believe this cancellation was made in error, please contact our support team immediately.</p>
          </div>
          <div class="footer">
            <p><strong>USA Luxury Limo</strong></p>
            <p>We hope to serve you again in the future.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
async function sendPasswordResetEmail(email, resetToken, username) {
  const resetUrl = `${process.env.REPLIT_DEV_DOMAIN || "http://localhost:5000"}/reset-password?token=${resetToken}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .button { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello ${username},</p>
            <p>We received a request to reset your password for your USA Luxury Limo account.</p>
            <p>Click the button below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} USA Luxury Limo. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  return await sendEmail({
    to: email,
    subject: "Password Reset Request - USA Luxury Limo",
    html
  });
}
async function sendTemporaryPasswordEmail(email, tempPassword, username) {
  const loginUrl = `${process.env.REPLIT_DEV_DOMAIN || "http://localhost:5000"}/login`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .password-box { background: #fff; border: 2px solid #dc2626; padding: 15px; margin: 20px 0; text-align: center; font-size: 18px; font-family: monospace; }
          .button { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Temporary Password</h1>
          </div>
          <div class="content">
            <p>Hello ${username},</p>
            <p>An administrator has set a temporary password for your USA Luxury Limo account.</p>
            <p>Your temporary password is:</p>
            <div class="password-box">${tempPassword}</div>
            <p><strong>Please change this password immediately after logging in.</strong></p>
            <p style="text-align: center;">
              <a href="${loginUrl}" class="button">Log In Now</a>
            </p>
            <p>For security reasons, we recommend changing your password as soon as possible.</p>
          </div>
          <div class="footer">
            <p>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} USA Luxury Limo. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  return await sendEmail({
    to: email,
    subject: "Temporary Password Set - USA Luxury Limo",
    html
  });
}
async function sendUsernameReminderEmail(email, username) {
  const loginUrl = `${process.env.REPLIT_DEV_DOMAIN || "http://localhost:5000"}/login`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .username-box { background: #fff; border: 2px solid #dc2626; padding: 15px; margin: 20px 0; text-align: center; font-size: 18px; font-weight: bold; }
          .button { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Username Reminder</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>We received a request for your username at USA Luxury Limo.</p>
            <p>Your username is:</p>
            <div class="username-box">${username}</div>
            <p style="text-align: center;">
              <a href="${loginUrl}" class="button">Log In Now</a>
            </p>
            <p>If you did not request this information, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} USA Luxury Limo. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  return await sendEmail({
    to: email,
    subject: "Username Reminder - USA Luxury Limo",
    html
  });
}
function clearEmailCache() {
  cachedTransporter = null;
  lastSettingsCheck = 0;
}

// server/twilio.ts
import twilio from "twilio";
async function getCredentials() {
  const dbAccountSid = await storage.getSetting("TWILIO_ACCOUNT_SID");
  const dbAuthToken = await storage.getSetting("TWILIO_AUTH_TOKEN");
  const dbPhoneNumber = await storage.getSetting("TWILIO_PHONE_NUMBER");
  if (dbAccountSid?.value && dbAuthToken?.value && dbPhoneNumber?.value) {
    return {
      accountSid: dbAccountSid.value,
      authToken: dbAuthToken.value,
      phoneNumber: dbPhoneNumber.value,
      source: "database"
    };
  }
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !phoneNumber) {
    throw new Error("Twilio credentials not configured. Please set credentials in admin settings or set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in Secrets.");
  }
  return {
    accountSid,
    authToken,
    phoneNumber,
    source: "environment"
  };
}
async function getTwilioClient() {
  const { accountSid, authToken } = await getCredentials();
  console.log("[TWILIO] Initializing client with Account SID:", accountSid?.substring(0, 10) + "...");
  console.log("[TWILIO] Auth Token length:", authToken?.length, "chars");
  return twilio(accountSid, authToken);
}
async function getTwilioFromPhoneNumber() {
  const { phoneNumber } = await getCredentials();
  return phoneNumber;
}
async function getTwilioConnectionStatus() {
  try {
    const { accountSid, phoneNumber } = await getCredentials();
    return {
      connected: true,
      accountSid,
      phoneNumber
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
async function isTwilioEnabled() {
  try {
    const enabledSetting = await storage.getSetting("TWILIO_ENABLED");
    return enabledSetting?.value !== "false";
  } catch (error) {
    console.error("Error checking Twilio enabled status:", error);
    return true;
  }
}

// node_modules/libphonenumber-js/metadata.min.json.js
var metadata_min_json_default = { "version": 4, "country_calling_codes": { "1": ["US", "AG", "AI", "AS", "BB", "BM", "BS", "CA", "DM", "DO", "GD", "GU", "JM", "KN", "KY", "LC", "MP", "MS", "PR", "SX", "TC", "TT", "VC", "VG", "VI"], "7": ["RU", "KZ"], "20": ["EG"], "27": ["ZA"], "30": ["GR"], "31": ["NL"], "32": ["BE"], "33": ["FR"], "34": ["ES"], "36": ["HU"], "39": ["IT", "VA"], "40": ["RO"], "41": ["CH"], "43": ["AT"], "44": ["GB", "GG", "IM", "JE"], "45": ["DK"], "46": ["SE"], "47": ["NO", "SJ"], "48": ["PL"], "49": ["DE"], "51": ["PE"], "52": ["MX"], "53": ["CU"], "54": ["AR"], "55": ["BR"], "56": ["CL"], "57": ["CO"], "58": ["VE"], "60": ["MY"], "61": ["AU", "CC", "CX"], "62": ["ID"], "63": ["PH"], "64": ["NZ"], "65": ["SG"], "66": ["TH"], "81": ["JP"], "82": ["KR"], "84": ["VN"], "86": ["CN"], "90": ["TR"], "91": ["IN"], "92": ["PK"], "93": ["AF"], "94": ["LK"], "95": ["MM"], "98": ["IR"], "211": ["SS"], "212": ["MA", "EH"], "213": ["DZ"], "216": ["TN"], "218": ["LY"], "220": ["GM"], "221": ["SN"], "222": ["MR"], "223": ["ML"], "224": ["GN"], "225": ["CI"], "226": ["BF"], "227": ["NE"], "228": ["TG"], "229": ["BJ"], "230": ["MU"], "231": ["LR"], "232": ["SL"], "233": ["GH"], "234": ["NG"], "235": ["TD"], "236": ["CF"], "237": ["CM"], "238": ["CV"], "239": ["ST"], "240": ["GQ"], "241": ["GA"], "242": ["CG"], "243": ["CD"], "244": ["AO"], "245": ["GW"], "246": ["IO"], "247": ["AC"], "248": ["SC"], "249": ["SD"], "250": ["RW"], "251": ["ET"], "252": ["SO"], "253": ["DJ"], "254": ["KE"], "255": ["TZ"], "256": ["UG"], "257": ["BI"], "258": ["MZ"], "260": ["ZM"], "261": ["MG"], "262": ["RE", "YT"], "263": ["ZW"], "264": ["NA"], "265": ["MW"], "266": ["LS"], "267": ["BW"], "268": ["SZ"], "269": ["KM"], "290": ["SH", "TA"], "291": ["ER"], "297": ["AW"], "298": ["FO"], "299": ["GL"], "350": ["GI"], "351": ["PT"], "352": ["LU"], "353": ["IE"], "354": ["IS"], "355": ["AL"], "356": ["MT"], "357": ["CY"], "358": ["FI", "AX"], "359": ["BG"], "370": ["LT"], "371": ["LV"], "372": ["EE"], "373": ["MD"], "374": ["AM"], "375": ["BY"], "376": ["AD"], "377": ["MC"], "378": ["SM"], "380": ["UA"], "381": ["RS"], "382": ["ME"], "383": ["XK"], "385": ["HR"], "386": ["SI"], "387": ["BA"], "389": ["MK"], "420": ["CZ"], "421": ["SK"], "423": ["LI"], "500": ["FK"], "501": ["BZ"], "502": ["GT"], "503": ["SV"], "504": ["HN"], "505": ["NI"], "506": ["CR"], "507": ["PA"], "508": ["PM"], "509": ["HT"], "590": ["GP", "BL", "MF"], "591": ["BO"], "592": ["GY"], "593": ["EC"], "594": ["GF"], "595": ["PY"], "596": ["MQ"], "597": ["SR"], "598": ["UY"], "599": ["CW", "BQ"], "670": ["TL"], "672": ["NF"], "673": ["BN"], "674": ["NR"], "675": ["PG"], "676": ["TO"], "677": ["SB"], "678": ["VU"], "679": ["FJ"], "680": ["PW"], "681": ["WF"], "682": ["CK"], "683": ["NU"], "685": ["WS"], "686": ["KI"], "687": ["NC"], "688": ["TV"], "689": ["PF"], "690": ["TK"], "691": ["FM"], "692": ["MH"], "850": ["KP"], "852": ["HK"], "853": ["MO"], "855": ["KH"], "856": ["LA"], "880": ["BD"], "886": ["TW"], "960": ["MV"], "961": ["LB"], "962": ["JO"], "963": ["SY"], "964": ["IQ"], "965": ["KW"], "966": ["SA"], "967": ["YE"], "968": ["OM"], "970": ["PS"], "971": ["AE"], "972": ["IL"], "973": ["BH"], "974": ["QA"], "975": ["BT"], "976": ["MN"], "977": ["NP"], "992": ["TJ"], "993": ["TM"], "994": ["AZ"], "995": ["GE"], "996": ["KG"], "998": ["UZ"] }, "countries": { "AC": ["247", "00", "(?:[01589]\\d|[46])\\d{4}", [5, 6]], "AD": ["376", "00", "(?:1|6\\d)\\d{7}|[135-9]\\d{5}", [6, 8, 9], [["(\\d{3})(\\d{3})", "$1 $2", ["[135-9]"]], ["(\\d{4})(\\d{4})", "$1 $2", ["1"]], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["6"]]]], "AE": ["971", "00", "(?:[4-7]\\d|9[0-689])\\d{7}|800\\d{2,9}|[2-4679]\\d{7}", [5, 6, 7, 8, 9, 10, 11, 12], [["(\\d{3})(\\d{2,9})", "$1 $2", ["60|8"]], ["(\\d)(\\d{3})(\\d{4})", "$1 $2 $3", ["[236]|[479][2-8]"], "0$1"], ["(\\d{3})(\\d)(\\d{5})", "$1 $2 $3", ["[479]"]], ["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["5"], "0$1"]], "0"], "AF": ["93", "00", "[2-7]\\d{8}", [9], [["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["[2-7]"], "0$1"]], "0"], "AG": ["1", "011", "(?:268|[58]\\d\\d|900)\\d{7}", [10], 0, "1", 0, "([457]\\d{6})$|1", "268$1", 0, "268"], "AI": ["1", "011", "(?:264|[58]\\d\\d|900)\\d{7}", [10], 0, "1", 0, "([2457]\\d{6})$|1", "264$1", 0, "264"], "AL": ["355", "00", "(?:700\\d\\d|900)\\d{3}|8\\d{5,7}|(?:[2-5]|6\\d)\\d{7}", [6, 7, 8, 9], [["(\\d{3})(\\d{3,4})", "$1 $2", ["80|9"], "0$1"], ["(\\d)(\\d{3})(\\d{4})", "$1 $2 $3", ["4[2-6]"], "0$1"], ["(\\d{2})(\\d{3})(\\d{3})", "$1 $2 $3", ["[2358][2-5]|4"], "0$1"], ["(\\d{3})(\\d{5})", "$1 $2", ["[23578]"], "0$1"], ["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["6"], "0$1"]], "0"], "AM": ["374", "00", "(?:[1-489]\\d|55|60|77)\\d{6}", [8], [["(\\d{3})(\\d{2})(\\d{3})", "$1 $2 $3", ["[89]0"], "0 $1"], ["(\\d{3})(\\d{5})", "$1 $2", ["2|3[12]"], "(0$1)"], ["(\\d{2})(\\d{6})", "$1 $2", ["1|47"], "(0$1)"], ["(\\d{2})(\\d{6})", "$1 $2", ["[3-9]"], "0$1"]], "0"], "AO": ["244", "00", "[29]\\d{8}", [9], [["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["[29]"]]]], "AR": ["54", "00", "(?:11|[89]\\d\\d)\\d{8}|[2368]\\d{9}", [10, 11], [["(\\d{4})(\\d{2})(\\d{4})", "$1 $2-$3", ["2(?:2[024-9]|3[0-59]|47|6[245]|9[02-8])|3(?:3[28]|4[03-9]|5[2-46-8]|7[1-578]|8[2-9])", "2(?:[23]02|6(?:[25]|4[6-8])|9(?:[02356]|4[02568]|72|8[23]))|3(?:3[28]|4(?:[04679]|3[5-8]|5[4-68]|8[2379])|5(?:[2467]|3[237]|8[2-5])|7[1-578]|8(?:[2469]|3[2578]|5[4-8]|7[36-8]|8[5-8]))|2(?:2[24-9]|3[1-59]|47)", "2(?:[23]02|6(?:[25]|4(?:64|[78]))|9(?:[02356]|4(?:[0268]|5[2-6])|72|8[23]))|3(?:3[28]|4(?:[04679]|3[78]|5(?:4[46]|8)|8[2379])|5(?:[2467]|3[237]|8[23])|7[1-578]|8(?:[2469]|3[278]|5[56][46]|86[3-6]))|2(?:2[24-9]|3[1-59]|47)|38(?:[58][78]|7[378])|3(?:4[35][56]|58[45]|8(?:[38]5|54|76))[4-6]", "2(?:[23]02|6(?:[25]|4(?:64|[78]))|9(?:[02356]|4(?:[0268]|5[2-6])|72|8[23]))|3(?:3[28]|4(?:[04679]|3(?:5(?:4[0-25689]|[56])|[78])|58|8[2379])|5(?:[2467]|3[237]|8(?:[23]|4(?:[45]|60)|5(?:4[0-39]|5|64)))|7[1-578]|8(?:[2469]|3[278]|54(?:4|5[13-7]|6[89])|86[3-6]))|2(?:2[24-9]|3[1-59]|47)|38(?:[58][78]|7[378])|3(?:454|85[56])[46]|3(?:4(?:36|5[56])|8(?:[38]5|76))[4-6]"], "0$1", 1], ["(\\d{2})(\\d{4})(\\d{4})", "$1 $2-$3", ["1"], "0$1", 1], ["(\\d{3})(\\d{3})(\\d{4})", "$1-$2-$3", ["[68]"], "0$1"], ["(\\d{3})(\\d{3})(\\d{4})", "$1 $2-$3", ["[23]"], "0$1", 1], ["(\\d)(\\d{4})(\\d{2})(\\d{4})", "$2 15-$3-$4", ["9(?:2[2-469]|3[3-578])", "9(?:2(?:2[024-9]|3[0-59]|47|6[245]|9[02-8])|3(?:3[28]|4[03-9]|5[2-46-8]|7[1-578]|8[2-9]))", "9(?:2(?:[23]02|6(?:[25]|4[6-8])|9(?:[02356]|4[02568]|72|8[23]))|3(?:3[28]|4(?:[04679]|3[5-8]|5[4-68]|8[2379])|5(?:[2467]|3[237]|8[2-5])|7[1-578]|8(?:[2469]|3[2578]|5[4-8]|7[36-8]|8[5-8])))|92(?:2[24-9]|3[1-59]|47)", "9(?:2(?:[23]02|6(?:[25]|4(?:64|[78]))|9(?:[02356]|4(?:[0268]|5[2-6])|72|8[23]))|3(?:3[28]|4(?:[04679]|3[78]|5(?:4[46]|8)|8[2379])|5(?:[2467]|3[237]|8[23])|7[1-578]|8(?:[2469]|3[278]|5(?:[56][46]|[78])|7[378]|8(?:6[3-6]|[78]))))|92(?:2[24-9]|3[1-59]|47)|93(?:4[35][56]|58[45]|8(?:[38]5|54|76))[4-6]", "9(?:2(?:[23]02|6(?:[25]|4(?:64|[78]))|9(?:[02356]|4(?:[0268]|5[2-6])|72|8[23]))|3(?:3[28]|4(?:[04679]|3(?:5(?:4[0-25689]|[56])|[78])|5(?:4[46]|8)|8[2379])|5(?:[2467]|3[237]|8(?:[23]|4(?:[45]|60)|5(?:4[0-39]|5|64)))|7[1-578]|8(?:[2469]|3[278]|5(?:4(?:4|5[13-7]|6[89])|[56][46]|[78])|7[378]|8(?:6[3-6]|[78]))))|92(?:2[24-9]|3[1-59]|47)|93(?:4(?:36|5[56])|8(?:[38]5|76))[4-6]"], "0$1", 0, "$1 $2 $3-$4"], ["(\\d)(\\d{2})(\\d{4})(\\d{4})", "$2 15-$3-$4", ["91"], "0$1", 0, "$1 $2 $3-$4"], ["(\\d{3})(\\d{3})(\\d{5})", "$1-$2-$3", ["8"], "0$1"], ["(\\d)(\\d{3})(\\d{3})(\\d{4})", "$2 15-$3-$4", ["9"], "0$1", 0, "$1 $2 $3-$4"]], "0", 0, "0?(?:(11|2(?:2(?:02?|[13]|2[13-79]|4[1-6]|5[2457]|6[124-8]|7[1-4]|8[13-6]|9[1267])|3(?:02?|1[467]|2[03-6]|3[13-8]|[49][2-6]|5[2-8]|[67])|4(?:7[3-578]|9)|6(?:[0136]|2[24-6]|4[6-8]?|5[15-8])|80|9(?:0[1-3]|[19]|2\\d|3[1-6]|4[02568]?|5[2-4]|6[2-46]|72?|8[23]?))|3(?:3(?:2[79]|6|8[2578])|4(?:0[0-24-9]|[12]|3[5-8]?|4[24-7]|5[4-68]?|6[02-9]|7[126]|8[2379]?|9[1-36-8])|5(?:1|2[1245]|3[237]?|4[1-46-9]|6[2-4]|7[1-6]|8[2-5]?)|6[24]|7(?:[069]|1[1568]|2[15]|3[145]|4[13]|5[14-8]|7[2-57]|8[126])|8(?:[01]|2[15-7]|3[2578]?|4[13-6]|5[4-8]?|6[1-357-9]|7[36-8]?|8[5-8]?|9[124])))15)?", "9$1"], "AS": ["1", "011", "(?:[58]\\d\\d|684|900)\\d{7}", [10], 0, "1", 0, "([267]\\d{6})$|1", "684$1", 0, "684"], "AT": ["43", "00", "1\\d{3,12}|2\\d{6,12}|43(?:(?:0\\d|5[02-9])\\d{3,9}|2\\d{4,5}|[3467]\\d{4}|8\\d{4,6}|9\\d{4,7})|5\\d{4,12}|8\\d{7,12}|9\\d{8,12}|(?:[367]\\d|4[0-24-9])\\d{4,11}", [4, 5, 6, 7, 8, 9, 10, 11, 12, 13], [["(\\d)(\\d{3,12})", "$1 $2", ["1(?:11|[2-9])"], "0$1"], ["(\\d{3})(\\d{2})", "$1 $2", ["517"], "0$1"], ["(\\d{2})(\\d{3,5})", "$1 $2", ["5[079]"], "0$1"], ["(\\d{3})(\\d{3,10})", "$1 $2", ["(?:31|4)6|51|6(?:48|5[0-3579]|[6-9])|7(?:20|32|8)|[89]", "(?:31|4)6|51|6(?:485|5[0-3579]|[6-9])|7(?:20|32|8)|[89]"], "0$1"], ["(\\d{4})(\\d{3,9})", "$1 $2", ["[2-467]|5[2-6]"], "0$1"], ["(\\d{2})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["5"], "0$1"], ["(\\d{2})(\\d{4})(\\d{4,7})", "$1 $2 $3", ["5"], "0$1"]], "0"], "AU": ["61", "001[14-689]|14(?:1[14]|34|4[17]|[56]6|7[47]|88)0011", "1(?:[0-79]\\d{7}(?:\\d(?:\\d{2})?)?|8[0-24-9]\\d{7})|[2-478]\\d{8}|1\\d{4,7}", [5, 6, 7, 8, 9, 10, 12], [["(\\d{2})(\\d{3,4})", "$1 $2", ["16"], "0$1"], ["(\\d{2})(\\d{3})(\\d{2,4})", "$1 $2 $3", ["16"], "0$1"], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["14|4"], "0$1"], ["(\\d)(\\d{4})(\\d{4})", "$1 $2 $3", ["[2378]"], "(0$1)"], ["(\\d{4})(\\d{3})(\\d{3})", "$1 $2 $3", ["1(?:30|[89])"]]], "0", 0, "(183[12])|0", 0, 0, 0, [["(?:(?:2(?:(?:[0-26-9]\\d|3[0-8]|5[0135-9])\\d|4(?:[02-9]\\d|10))|3(?:(?:[0-3589]\\d|6[1-9]|7[0-35-9])\\d|4(?:[0-578]\\d|90))|7(?:[013-57-9]\\d|2[0-8])\\d)\\d\\d|8(?:51(?:0(?:0[03-9]|[12479]\\d|3[2-9]|5[0-8]|6[1-9]|8[0-7])|1(?:[0235689]\\d|1[0-69]|4[0-589]|7[0-47-9])|2(?:0[0-79]|[18][13579]|2[14-9]|3[0-46-9]|[4-6]\\d|7[89]|9[0-4])|[34]\\d\\d)|(?:6[0-8]|[78]\\d)\\d{3}|9(?:[02-9]\\d{3}|1(?:(?:[0-58]\\d|6[0135-9])\\d|7(?:0[0-24-9]|[1-9]\\d)|9(?:[0-46-9]\\d|5[0-79])))))\\d{3}", [9]], ["4(?:79[01]|83[0-389]|94[0-478])\\d{5}|4(?:[0-36]\\d|4[047-9]|[58][0-24-9]|7[02-8]|9[0-37-9])\\d{6}", [9]], ["180(?:0\\d{3}|2)\\d{3}", [7, 10]], ["190[0-26]\\d{6}", [10]], 0, 0, 0, ["163\\d{2,6}", [5, 6, 7, 8, 9]], ["14(?:5(?:1[0458]|[23][458])|71\\d)\\d{4}", [9]], ["13(?:00\\d{6}(?:\\d{2})?|45[0-4]\\d{3})|13\\d{4}", [6, 8, 10, 12]]], "0011"], "AW": ["297", "00", "(?:[25-79]\\d\\d|800)\\d{4}", [7], [["(\\d{3})(\\d{4})", "$1 $2", ["[25-9]"]]]], "AX": ["358", "00|99(?:[01469]|5(?:[14]1|3[23]|5[59]|77|88|9[09]))", "2\\d{4,9}|35\\d{4,5}|(?:60\\d\\d|800)\\d{4,6}|7\\d{5,11}|(?:[14]\\d|3[0-46-9]|50)\\d{4,8}", [5, 6, 7, 8, 9, 10, 11, 12], 0, "0", 0, 0, 0, 0, "18", 0, "00"], "AZ": ["994", "00", "365\\d{6}|(?:[124579]\\d|60|88)\\d{7}", [9], [["(\\d{3})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["90"], "0$1"], ["(\\d{2})(\\d{3})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["1[28]|2|365|46", "1[28]|2|365[45]|46", "1[28]|2|365(?:4|5[02])|46"], "(0$1)"], ["(\\d{2})(\\d{3})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[13-9]"], "0$1"]], "0"], "BA": ["387", "00", "6\\d{8}|(?:[35689]\\d|49|70)\\d{6}", [8, 9], [["(\\d{2})(\\d{3})(\\d{3})", "$1 $2 $3", ["6[1-3]|[7-9]"], "0$1"], ["(\\d{2})(\\d{3})(\\d{3})", "$1 $2-$3", ["[3-5]|6[56]"], "0$1"], ["(\\d{2})(\\d{2})(\\d{2})(\\d{3})", "$1 $2 $3 $4", ["6"], "0$1"]], "0"], "BB": ["1", "011", "(?:246|[58]\\d\\d|900)\\d{7}", [10], 0, "1", 0, "([2-9]\\d{6})$|1", "246$1", 0, "246"], "BD": ["880", "00", "[1-469]\\d{9}|8[0-79]\\d{7,8}|[2-79]\\d{8}|[2-9]\\d{7}|[3-9]\\d{6}|[57-9]\\d{5}", [6, 7, 8, 9, 10], [["(\\d{2})(\\d{4,6})", "$1-$2", ["31[5-8]|[459]1"], "0$1"], ["(\\d{3})(\\d{3,7})", "$1-$2", ["3(?:[67]|8[013-9])|4(?:6[168]|7|[89][18])|5(?:6[128]|9)|6(?:[15]|28|4[14])|7[2-589]|8(?:0[014-9]|[12])|9[358]|(?:3[2-5]|4[235]|5[2-578]|6[0389]|76|8[3-7]|9[24])1|(?:44|66)[01346-9]"], "0$1"], ["(\\d{4})(\\d{3,6})", "$1-$2", ["[13-9]|2[23]"], "0$1"], ["(\\d)(\\d{7,8})", "$1-$2", ["2"], "0$1"]], "0"], "BE": ["32", "00", "4\\d{8}|[1-9]\\d{7}", [8, 9], [["(\\d{3})(\\d{2})(\\d{3})", "$1 $2 $3", ["(?:80|9)0"], "0$1"], ["(\\d)(\\d{3})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[239]|4[23]"], "0$1"], ["(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[15-8]"], "0$1"], ["(\\d{3})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["4"], "0$1"]], "0"], "BF": ["226", "00", "(?:[025-7]\\d|44)\\d{6}", [8], [["(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[024-7]"]]]], "BG": ["359", "00", "00800\\d{7}|[2-7]\\d{6,7}|[89]\\d{6,8}|2\\d{5}", [6, 7, 8, 9, 12], [["(\\d)(\\d)(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["2"], "0$1"], ["(\\d{3})(\\d{4})", "$1 $2", ["43[1-6]|70[1-9]"], "0$1"], ["(\\d)(\\d{3})(\\d{3,4})", "$1 $2 $3", ["2"], "0$1"], ["(\\d{2})(\\d{3})(\\d{2,3})", "$1 $2 $3", ["[356]|4[124-7]|7[1-9]|8[1-6]|9[1-7]"], "0$1"], ["(\\d{3})(\\d{2})(\\d{3})", "$1 $2 $3", ["(?:70|8)0"], "0$1"], ["(\\d{3})(\\d{3})(\\d{2})", "$1 $2 $3", ["43[1-7]|7"], "0$1"], ["(\\d{2})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["[48]|9[08]"], "0$1"], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["9"], "0$1"]], "0"], "BH": ["973", "00", "[136-9]\\d{7}", [8], [["(\\d{4})(\\d{4})", "$1 $2", ["[13679]|8[02-4679]"]]]], "BI": ["257", "00", "(?:[267]\\d|31)\\d{6}", [8], [["(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[2367]"]]]], "BJ": ["229", "00", "(?:01\\d|[24-689])\\d{7}", [8, 10], [["(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[24-689]"]], ["(\\d{2})(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4 $5", ["0"]]]], "BL": ["590", "00", "(?:590\\d|7090)\\d{5}|(?:69|80|9\\d)\\d{7}", [9], 0, "0", 0, 0, 0, 0, 0, [["590(?:2[7-9]|3[3-7]|5[12]|87)\\d{4}"], ["(?:69(?:0\\d\\d|1(?:2[2-9]|3[0-5])|4(?:0[89]|1[2-6]|9\\d)|6(?:1[016-9]|5[0-4]|[67]\\d))|7090[0-4])\\d{4}"], ["80[0-5]\\d{6}"], 0, 0, 0, 0, 0, ["9(?:(?:39[5-7]|76[018])\\d|475[0-6])\\d{4}"]]], "BM": ["1", "011", "(?:441|[58]\\d\\d|900)\\d{7}", [10], 0, "1", 0, "([2-9]\\d{6})$|1", "441$1", 0, "441"], "BN": ["673", "00", "[2-578]\\d{6}", [7], [["(\\d{3})(\\d{4})", "$1 $2", ["[2-578]"]]]], "BO": ["591", "00(?:1\\d)?", "8001\\d{5}|(?:[2-467]\\d|50)\\d{6}", [8, 9], [["(\\d)(\\d{7})", "$1 $2", ["[235]|4[46]"]], ["(\\d{8})", "$1", ["[67]"]], ["(\\d{3})(\\d{2})(\\d{4})", "$1 $2 $3", ["8"]]], "0", 0, "0(1\\d)?"], "BQ": ["599", "00", "(?:[34]1|7\\d)\\d{5}", [7], 0, 0, 0, 0, 0, 0, "[347]"], "BR": ["55", "00(?:1[245]|2[1-35]|31|4[13]|[56]5|99)", "[1-467]\\d{9,10}|55[0-46-9]\\d{8}|[34]\\d{7}|55\\d{7,8}|(?:5[0-46-9]|[89]\\d)\\d{7,9}", [8, 9, 10, 11], [["(\\d{4})(\\d{4})", "$1-$2", ["300|4(?:0[02]|37|86)", "300|4(?:0(?:0|20)|370|864)"]], ["(\\d{3})(\\d{2,3})(\\d{4})", "$1 $2 $3", ["(?:[358]|90)0"], "0$1"], ["(\\d{2})(\\d{4})(\\d{4})", "$1 $2-$3", ["(?:[14689][1-9]|2[12478]|3[1-578]|5[13-5]|7[13-579])[2-57]"], "($1)"], ["(\\d{2})(\\d{5})(\\d{4})", "$1 $2-$3", ["[16][1-9]|[2-57-9]"], "($1)"]], "0", 0, "(?:0|90)(?:(1[245]|2[1-35]|31|4[13]|[56]5|99)(\\d{10,11}))?", "$2"], "BS": ["1", "011", "(?:242|[58]\\d\\d|900)\\d{7}", [10], 0, "1", 0, "([3-8]\\d{6})$|1", "242$1", 0, "242"], "BT": ["975", "00", "[178]\\d{7}|[2-8]\\d{6}", [7, 8], [["(\\d)(\\d{3})(\\d{3})", "$1 $2 $3", ["[2-6]|7[246]|8[2-4]"]], ["(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["1[67]|[78]"]]]], "BW": ["267", "00", "(?:0800|(?:[37]|800)\\d)\\d{6}|(?:[2-6]\\d|90)\\d{5}", [7, 8, 10], [["(\\d{2})(\\d{5})", "$1 $2", ["90"]], ["(\\d{3})(\\d{4})", "$1 $2", ["[24-6]|3[15-9]"]], ["(\\d{2})(\\d{3})(\\d{3})", "$1 $2 $3", ["[37]"]], ["(\\d{4})(\\d{3})(\\d{3})", "$1 $2 $3", ["0"]], ["(\\d{3})(\\d{4})(\\d{3})", "$1 $2 $3", ["8"]]]], "BY": ["375", "810", "(?:[12]\\d|33|44|902)\\d{7}|8(?:0[0-79]\\d{5,7}|[1-7]\\d{9})|8(?:1[0-489]|[5-79]\\d)\\d{7}|8[1-79]\\d{6,7}|8[0-79]\\d{5}|8\\d{5}", [6, 7, 8, 9, 10, 11], [["(\\d{3})(\\d{3})", "$1 $2", ["800"], "8 $1"], ["(\\d{3})(\\d{2})(\\d{2,4})", "$1 $2 $3", ["800"], "8 $1"], ["(\\d{4})(\\d{2})(\\d{3})", "$1 $2-$3", ["1(?:5[169]|6[3-5]|7[179])|2(?:1[35]|2[34]|3[3-5])", "1(?:5[169]|6(?:3[1-3]|4|5[125])|7(?:1[3-9]|7[0-24-6]|9[2-7]))|2(?:1[35]|2[34]|3[3-5])"], "8 0$1"], ["(\\d{3})(\\d{2})(\\d{2})(\\d{2})", "$1 $2-$3-$4", ["1(?:[56]|7[467])|2[1-3]"], "8 0$1"], ["(\\d{2})(\\d{3})(\\d{2})(\\d{2})", "$1 $2-$3-$4", ["[1-4]"], "8 0$1"], ["(\\d{3})(\\d{3,4})(\\d{4})", "$1 $2 $3", ["[89]"], "8 $1"]], "8", 0, "0|80?", 0, 0, 0, 0, "8~10"], "BZ": ["501", "00", "(?:0800\\d|[2-8])\\d{6}", [7, 11], [["(\\d{3})(\\d{4})", "$1-$2", ["[2-8]"]], ["(\\d)(\\d{3})(\\d{4})(\\d{3})", "$1-$2-$3-$4", ["0"]]]], "CA": ["1", "011", "[2-9]\\d{9}|3\\d{6}", [7, 10], 0, "1", 0, 0, 0, 0, 0, [["(?:2(?:04|[23]6|[48]9|5[07]|63)|3(?:06|43|54|6[578]|82)|4(?:03|1[68]|[26]8|3[178]|50|74)|5(?:06|1[49]|48|79|8[147])|6(?:04|[18]3|39|47|72)|7(?:0[59]|42|53|78|8[02])|8(?:[06]7|19|25|7[39])|9(?:0[25]|42))[2-9]\\d{6}", [10]], ["", [10]], ["8(?:00|33|44|55|66|77|88)[2-9]\\d{6}", [10]], ["900[2-9]\\d{6}", [10]], ["52(?:3(?:[2-46-9][02-9]\\d|5(?:[02-46-9]\\d|5[0-46-9]))|4(?:[2-478][02-9]\\d|5(?:[034]\\d|2[024-9]|5[0-46-9])|6(?:0[1-9]|[2-9]\\d)|9(?:[05-9]\\d|2[0-5]|49)))\\d{4}|52[34][2-9]1[02-9]\\d{4}|(?:5(?:2[125-9]|33|44|66|77|88)|6(?:22|33))[2-9]\\d{6}", [10]], 0, ["310\\d{4}", [7]], 0, ["600[2-9]\\d{6}", [10]]]], "CC": ["61", "001[14-689]|14(?:1[14]|34|4[17]|[56]6|7[47]|88)0011", "1(?:[0-79]\\d{8}(?:\\d{2})?|8[0-24-9]\\d{7})|[148]\\d{8}|1\\d{5,7}", [6, 7, 8, 9, 10, 12], 0, "0", 0, "([59]\\d{7})$|0", "8$1", 0, 0, [["8(?:51(?:0(?:02|31|60|89)|1(?:18|76)|223)|91(?:0(?:1[0-2]|29)|1(?:[28]2|50|79)|2(?:10|64)|3(?:[06]8|22)|4[29]8|62\\d|70[23]|959))\\d{3}", [9]], ["4(?:79[01]|83[0-389]|94[0-478])\\d{5}|4(?:[0-36]\\d|4[047-9]|[58][0-24-9]|7[02-8]|9[0-37-9])\\d{6}", [9]], ["180(?:0\\d{3}|2)\\d{3}", [7, 10]], ["190[0-26]\\d{6}", [10]], 0, 0, 0, 0, ["14(?:5(?:1[0458]|[23][458])|71\\d)\\d{4}", [9]], ["13(?:00\\d{6}(?:\\d{2})?|45[0-4]\\d{3})|13\\d{4}", [6, 8, 10, 12]]], "0011"], "CD": ["243", "00", "(?:(?:[189]|5\\d)\\d|2)\\d{7}|[1-68]\\d{6}", [7, 8, 9, 10], [["(\\d{2})(\\d{2})(\\d{3})", "$1 $2 $3", ["88"], "0$1"], ["(\\d{2})(\\d{5})", "$1 $2", ["[1-6]"], "0$1"], ["(\\d{2})(\\d{2})(\\d{4})", "$1 $2 $3", ["2"], "0$1"], ["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["1"], "0$1"], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["[89]"], "0$1"], ["(\\d{2})(\\d{2})(\\d{3})(\\d{3})", "$1 $2 $3 $4", ["5"], "0$1"]], "0"], "CF": ["236", "00", "(?:[27]\\d{3}|8776)\\d{4}", [8], [["(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[278]"]]]], "CG": ["242", "00", "222\\d{6}|(?:0\\d|80)\\d{7}", [9], [["(\\d)(\\d{4})(\\d{4})", "$1 $2 $3", ["8"]], ["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["[02]"]]]], "CH": ["41", "00", "8\\d{11}|[2-9]\\d{8}", [9, 12], [["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["8[047]|90"], "0$1"], ["(\\d{2})(\\d{3})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[2-79]|81"], "0$1"], ["(\\d{3})(\\d{2})(\\d{3})(\\d{2})(\\d{2})", "$1 $2 $3 $4 $5", ["8"], "0$1"]], "0"], "CI": ["225", "00", "[02]\\d{9}", [10], [["(\\d{2})(\\d{2})(\\d)(\\d{5})", "$1 $2 $3 $4", ["2"]], ["(\\d{2})(\\d{2})(\\d{2})(\\d{4})", "$1 $2 $3 $4", ["0"]]]], "CK": ["682", "00", "[2-578]\\d{4}", [5], [["(\\d{2})(\\d{3})", "$1 $2", ["[2-578]"]]]], "CL": ["56", "(?:0|1(?:1[0-69]|2[02-5]|5[13-58]|69|7[0167]|8[018]))0", "12300\\d{6}|6\\d{9,10}|[2-9]\\d{8}", [9, 10, 11], [["(\\d{5})(\\d{4})", "$1 $2", ["219", "2196"], "($1)"], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["60|809"]], ["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["44"]], ["(\\d)(\\d{4})(\\d{4})", "$1 $2 $3", ["2[1-36]"], "($1)"], ["(\\d)(\\d{4})(\\d{4})", "$1 $2 $3", ["9(?:10|[2-9])"]], ["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["3[2-5]|[47]|5[1-3578]|6[13-57]|8(?:0[1-8]|[1-9])"], "($1)"], ["(\\d{3})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["60|8"]], ["(\\d{4})(\\d{3})(\\d{4})", "$1 $2 $3", ["1"]], ["(\\d{3})(\\d{3})(\\d{2})(\\d{3})", "$1 $2 $3 $4", ["60"]]]], "CM": ["237", "00", "[26]\\d{8}|88\\d{6,7}", [8, 9], [["(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["88"]], ["(\\d)(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4 $5", ["[26]|88"]]]], "CN": ["86", "00|1(?:[12]\\d|79)\\d\\d00", "(?:(?:1[03-689]|2\\d)\\d\\d|6)\\d{8}|1\\d{10}|[126]\\d{6}(?:\\d(?:\\d{2})?)?|86\\d{5,6}|(?:[3-579]\\d|8[0-57-9])\\d{5,9}", [7, 8, 9, 10, 11, 12], [["(\\d{2})(\\d{5,6})", "$1 $2", ["(?:10|2[0-57-9])[19]|3(?:[157]|35|49|9[1-68])|4(?:1[124-9]|2[179]|6[47-9]|7|8[23])|5(?:[1357]|2[37]|4[36]|6[1-46]|80)|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[1579]|2[248]|3[014-9]|4[3-6]|6[023689])|8(?:07|1[236-8]|2[5-7]|[37]|8[36-8]|9[1-8])|9(?:0[1-3689]|1[1-79]|3|4[13]|5[1-5]|7[0-79]|9[0-35-9])|(?:4[35]|59|85)[1-9]", "(?:10|2[0-57-9])(?:1[02]|9[56])|8078|(?:3(?:[157]\\d|35|49|9[1-68])|4(?:1[124-9]|2[179]|[35][1-9]|6[47-9]|7\\d|8[23])|5(?:[1357]\\d|2[37]|4[36]|6[1-46]|80|9[1-9])|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[1579]\\d|2[248]|3[014-9]|4[3-6]|6[023689])|8(?:1[236-8]|2[5-7]|[37]\\d|5[1-9]|8[36-8]|9[1-8])|9(?:0[1-3689]|1[1-79]|3\\d|4[13]|5[1-5]|7[0-79]|9[0-35-9]))1", "10(?:1(?:0|23)|9[56])|2[0-57-9](?:1(?:00|23)|9[56])|80781|(?:3(?:[157]\\d|35|49|9[1-68])|4(?:1[124-9]|2[179]|[35][1-9]|6[47-9]|7\\d|8[23])|5(?:[1357]\\d|2[37]|4[36]|6[1-46]|80|9[1-9])|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[1579]\\d|2[248]|3[014-9]|4[3-6]|6[023689])|8(?:1[236-8]|2[5-7]|[37]\\d|5[1-9]|8[36-8]|9[1-8])|9(?:0[1-3689]|1[1-79]|3\\d|4[13]|5[1-5]|7[0-79]|9[0-35-9]))12", "10(?:1(?:0|23)|9[56])|2[0-57-9](?:1(?:00|23)|9[56])|807812|(?:3(?:[157]\\d|35|49|9[1-68])|4(?:1[124-9]|2[179]|[35][1-9]|6[47-9]|7\\d|8[23])|5(?:[1357]\\d|2[37]|4[36]|6[1-46]|80|9[1-9])|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[1579]\\d|2[248]|3[014-9]|4[3-6]|6[023689])|8(?:1[236-8]|2[5-7]|[37]\\d|5[1-9]|8[36-8]|9[1-8])|9(?:0[1-3689]|1[1-79]|3\\d|4[13]|5[1-5]|7[0-79]|9[0-35-9]))123", "10(?:1(?:0|23)|9[56])|2[0-57-9](?:1(?:00|23)|9[56])|(?:3(?:[157]\\d|35|49|9[1-68])|4(?:1[124-9]|2[179]|[35][1-9]|6[47-9]|7\\d|8[23])|5(?:[1357]\\d|2[37]|4[36]|6[1-46]|80|9[1-9])|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[1579]\\d|2[248]|3[014-9]|4[3-6]|6[023689])|8(?:078|1[236-8]|2[5-7]|[37]\\d|5[1-9]|8[36-8]|9[1-8])|9(?:0[1-3689]|1[1-79]|3\\d|4[13]|5[1-5]|7[0-79]|9[0-35-9]))123"], "0$1"], ["(\\d{3})(\\d{5,6})", "$1 $2", ["3(?:[157]|35|49|9[1-68])|4(?:[17]|2[179]|6[47-9]|8[23])|5(?:[1357]|2[37]|4[36]|6[1-46]|80)|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[1579]|2[248]|3[014-9]|4[3-6]|6[023689])|8(?:1[236-8]|2[5-7]|[37]|8[36-8]|9[1-8])|9(?:0[1-3689]|1[1-79]|[379]|4[13]|5[1-5])|(?:4[35]|59|85)[1-9]", "(?:3(?:[157]\\d|35|49|9[1-68])|4(?:[17]\\d|2[179]|[35][1-9]|6[47-9]|8[23])|5(?:[1357]\\d|2[37]|4[36]|6[1-46]|80|9[1-9])|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[1579]\\d|2[248]|3[014-9]|4[3-6]|6[023689])|8(?:1[236-8]|2[5-7]|[37]\\d|5[1-9]|8[36-8]|9[1-8])|9(?:0[1-3689]|1[1-79]|[379]\\d|4[13]|5[1-5]))[19]", "85[23](?:10|95)|(?:3(?:[157]\\d|35|49|9[1-68])|4(?:[17]\\d|2[179]|[35][1-9]|6[47-9]|8[23])|5(?:[1357]\\d|2[37]|4[36]|6[1-46]|80|9[1-9])|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[1579]\\d|2[248]|3[014-9]|4[3-6]|6[023689])|8(?:1[236-8]|2[5-7]|[37]\\d|5[14-9]|8[36-8]|9[1-8])|9(?:0[1-3689]|1[1-79]|[379]\\d|4[13]|5[1-5]))(?:10|9[56])", "85[23](?:100|95)|(?:3(?:[157]\\d|35|49|9[1-68])|4(?:[17]\\d|2[179]|[35][1-9]|6[47-9]|8[23])|5(?:[1357]\\d|2[37]|4[36]|6[1-46]|80|9[1-9])|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[1579]\\d|2[248]|3[014-9]|4[3-6]|6[023689])|8(?:1[236-8]|2[5-7]|[37]\\d|5[14-9]|8[36-8]|9[1-8])|9(?:0[1-3689]|1[1-79]|[379]\\d|4[13]|5[1-5]))(?:100|9[56])"], "0$1"], ["(\\d{3})(\\d{3})(\\d{4})", "$1 $2 $3", ["(?:4|80)0"]], ["(\\d{2})(\\d{4})(\\d{4})", "$1 $2 $3", ["10|2(?:[02-57-9]|1[1-9])", "10|2(?:[02-57-9]|1[1-9])", "10[0-79]|2(?:[02-57-9]|1[1-79])|(?:10|21)8(?:0[1-9]|[1-9])"], "0$1", 1], ["(\\d{3})(\\d{3})(\\d{4})", "$1 $2 $3", ["3(?:[3-59]|7[02-68])|4(?:[26-8]|3[3-9]|5[2-9])|5(?:3[03-9]|[468]|7[028]|9[2-46-9])|6|7(?:[0-247]|3[04-9]|5[0-4689]|6[2368])|8(?:[1-358]|9[1-7])|9(?:[013479]|5[1-5])|(?:[34]1|55|79|87)[02-9]"], "0$1", 1], ["(\\d{3})(\\d{7,8})", "$1 $2", ["9"]], ["(\\d{4})(\\d{3})(\\d{4})", "$1 $2 $3", ["80"], "0$1", 1], ["(\\d{3})(\\d{4})(\\d{4})", "$1 $2 $3", ["[3-578]"], "0$1", 1], ["(\\d{3})(\\d{4})(\\d{4})", "$1 $2 $3", ["1[3-9]"]], ["(\\d{2})(\\d{3})(\\d{3})(\\d{4})", "$1 $2 $3 $4", ["[12]"], "0$1", 1]], "0", 0, "(1(?:[12]\\d|79)\\d\\d)|0", 0, 0, 0, 0, "00"], "CO": ["57", "00(?:4(?:[14]4|56)|[579])", "(?:46|60\\d\\d)\\d{6}|(?:1\\d|[39])\\d{9}", [8, 10, 11], [["(\\d{4})(\\d{4})", "$1 $2", ["46"]], ["(\\d{3})(\\d{7})", "$1 $2", ["6|90"], "($1)"], ["(\\d{3})(\\d{7})", "$1 $2", ["3[0-357]|9[14]"]], ["(\\d)(\\d{3})(\\d{7})", "$1-$2-$3", ["1"], "0$1", 0, "$1 $2 $3"]], "0", 0, "0([3579]|4(?:[14]4|56))?"], "CR": ["506", "00", "(?:8\\d|90)\\d{8}|(?:[24-8]\\d{3}|3005)\\d{4}", [8, 10], [["(\\d{4})(\\d{4})", "$1 $2", ["[2-7]|8[3-9]"]], ["(\\d{3})(\\d{3})(\\d{4})", "$1-$2-$3", ["[89]"]]], 0, 0, "(19(?:0[0-2468]|1[09]|20|66|77|99))"], "CU": ["53", "119", "(?:[2-7]|8\\d\\d)\\d{7}|[2-47]\\d{6}|[34]\\d{5}", [6, 7, 8, 10], [["(\\d{2})(\\d{4,6})", "$1 $2", ["2[1-4]|[34]"], "(0$1)"], ["(\\d)(\\d{6,7})", "$1 $2", ["7"], "(0$1)"], ["(\\d)(\\d{7})", "$1 $2", ["[56]"], "0$1"], ["(\\d{3})(\\d{7})", "$1 $2", ["8"], "0$1"]], "0"], "CV": ["238", "0", "(?:[2-59]\\d\\d|800)\\d{4}", [7], [["(\\d{3})(\\d{2})(\\d{2})", "$1 $2 $3", ["[2-589]"]]]], "CW": ["599", "00", "(?:[34]1|60|(?:7|9\\d)\\d)\\d{5}", [7, 8], [["(\\d{3})(\\d{4})", "$1 $2", ["[3467]"]], ["(\\d)(\\d{3})(\\d{4})", "$1 $2 $3", ["9[4-8]"]]], 0, 0, 0, 0, 0, "[69]"], "CX": ["61", "001[14-689]|14(?:1[14]|34|4[17]|[56]6|7[47]|88)0011", "1(?:[0-79]\\d{8}(?:\\d{2})?|8[0-24-9]\\d{7})|[148]\\d{8}|1\\d{5,7}", [6, 7, 8, 9, 10, 12], 0, "0", 0, "([59]\\d{7})$|0", "8$1", 0, 0, [["8(?:51(?:0(?:01|30|59|88)|1(?:17|46|75)|2(?:22|35))|91(?:00[6-9]|1(?:[28]1|49|78)|2(?:09|63)|3(?:12|26|75)|4(?:56|97)|64\\d|7(?:0[01]|1[0-2])|958))\\d{3}", [9]], ["4(?:79[01]|83[0-389]|94[0-478])\\d{5}|4(?:[0-36]\\d|4[047-9]|[58][0-24-9]|7[02-8]|9[0-37-9])\\d{6}", [9]], ["180(?:0\\d{3}|2)\\d{3}", [7, 10]], ["190[0-26]\\d{6}", [10]], 0, 0, 0, 0, ["14(?:5(?:1[0458]|[23][458])|71\\d)\\d{4}", [9]], ["13(?:00\\d{6}(?:\\d{2})?|45[0-4]\\d{3})|13\\d{4}", [6, 8, 10, 12]]], "0011"], "CY": ["357", "00", "(?:[279]\\d|[58]0)\\d{6}", [8], [["(\\d{2})(\\d{6})", "$1 $2", ["[257-9]"]]]], "CZ": ["420", "00", "(?:[2-578]\\d|60)\\d{7}|9\\d{8,11}", [9, 10, 11, 12], [["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["[2-8]|9[015-7]"]], ["(\\d{2})(\\d{3})(\\d{3})(\\d{2})", "$1 $2 $3 $4", ["96"]], ["(\\d{2})(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3 $4", ["9"]], ["(\\d{3})(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3 $4", ["9"]]]], "DE": ["49", "00", "[2579]\\d{5,14}|49(?:[34]0|69|8\\d)\\d\\d?|49(?:37|49|60|7[089]|9\\d)\\d{1,3}|49(?:2[024-9]|3[2-689]|7[1-7])\\d{1,8}|(?:1|[368]\\d|4[0-8])\\d{3,13}|49(?:[015]\\d|2[13]|31|[46][1-8])\\d{1,9}", [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], [["(\\d{2})(\\d{3,13})", "$1 $2", ["3[02]|40|[68]9"], "0$1"], ["(\\d{3})(\\d{3,12})", "$1 $2", ["2(?:0[1-389]|1[124]|2[18]|3[14])|3(?:[35-9][15]|4[015])|906|(?:2[4-9]|4[2-9]|[579][1-9]|[68][1-8])1", "2(?:0[1-389]|12[0-8])|3(?:[35-9][15]|4[015])|906|2(?:[13][14]|2[18])|(?:2[4-9]|4[2-9]|[579][1-9]|[68][1-8])1"], "0$1"], ["(\\d{4})(\\d{2,11})", "$1 $2", ["[24-6]|3(?:[3569][02-46-9]|4[2-4679]|7[2-467]|8[2-46-8])|70[2-8]|8(?:0[2-9]|[1-8])|90[7-9]|[79][1-9]", "[24-6]|3(?:3(?:0[1-467]|2[127-9]|3[124578]|7[1257-9]|8[1256]|9[145])|4(?:2[135]|4[13578]|9[1346])|5(?:0[14]|2[1-3589]|6[1-4]|7[13468]|8[13568])|6(?:2[1-489]|3[124-6]|6[13]|7[12579]|8[1-356]|9[135])|7(?:2[1-7]|4[145]|6[1-5]|7[1-4])|8(?:21|3[1468]|6|7[1467]|8[136])|9(?:0[12479]|2[1358]|4[134679]|6[1-9]|7[136]|8[147]|9[1468]))|70[2-8]|8(?:0[2-9]|[1-8])|90[7-9]|[79][1-9]|3[68]4[1347]|3(?:47|60)[1356]|3(?:3[46]|46|5[49])[1246]|3[4579]3[1357]"], "0$1"], ["(\\d{3})(\\d{4})", "$1 $2", ["138"], "0$1"], ["(\\d{5})(\\d{2,10})", "$1 $2", ["3"], "0$1"], ["(\\d{3})(\\d{5,11})", "$1 $2", ["181"], "0$1"], ["(\\d{3})(\\d)(\\d{4,10})", "$1 $2 $3", ["1(?:3|80)|9"], "0$1"], ["(\\d{3})(\\d{7,8})", "$1 $2", ["1[67]"], "0$1"], ["(\\d{3})(\\d{7,12})", "$1 $2", ["8"], "0$1"], ["(\\d{5})(\\d{6})", "$1 $2", ["185", "1850", "18500"], "0$1"], ["(\\d{3})(\\d{4})(\\d{4})", "$1 $2 $3", ["7"], "0$1"], ["(\\d{4})(\\d{7})", "$1 $2", ["18[68]"], "0$1"], ["(\\d{4})(\\d{7})", "$1 $2", ["15[1279]"], "0$1"], ["(\\d{5})(\\d{6})", "$1 $2", ["15[03568]", "15(?:[0568]|3[13])"], "0$1"], ["(\\d{3})(\\d{8})", "$1 $2", ["18"], "0$1"], ["(\\d{3})(\\d{2})(\\d{7,8})", "$1 $2 $3", ["1(?:6[023]|7)"], "0$1"], ["(\\d{4})(\\d{2})(\\d{7})", "$1 $2 $3", ["15[279]"], "0$1"], ["(\\d{3})(\\d{2})(\\d{8})", "$1 $2 $3", ["15"], "0$1"]], "0"], "DJ": ["253", "00", "(?:2\\d|77)\\d{6}", [8], [["(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[27]"]]]], "DK": ["45", "00", "[2-9]\\d{7}", [8], [["(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[2-9]"]]]], "DM": ["1", "011", "(?:[58]\\d\\d|767|900)\\d{7}", [10], 0, "1", 0, "([2-7]\\d{6})$|1", "767$1", 0, "767"], "DO": ["1", "011", "(?:[58]\\d\\d|900)\\d{7}", [10], 0, "1", 0, 0, 0, 0, "8001|8[024]9"], "DZ": ["213", "00", "(?:[1-4]|[5-79]\\d|80)\\d{7}", [8, 9], [["(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[1-4]"], "0$1"], ["(\\d{2})(\\d{3})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["9"], "0$1"], ["(\\d{3})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[5-8]"], "0$1"]], "0"], "EC": ["593", "00", "1\\d{9,10}|(?:[2-7]|9\\d)\\d{7}", [8, 9, 10, 11], [["(\\d)(\\d{3})(\\d{4})", "$1 $2-$3", ["[2-7]"], "(0$1)", 0, "$1-$2-$3"], ["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["9"], "0$1"], ["(\\d{4})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["1"]]], "0"], "EE": ["372", "00", "8\\d{9}|[4578]\\d{7}|(?:[3-8]\\d|90)\\d{5}", [7, 8, 10], [["(\\d{3})(\\d{4})", "$1 $2", ["[369]|4[3-8]|5(?:[0-2]|5[0-478]|6[45])|7[1-9]|88", "[369]|4[3-8]|5(?:[02]|1(?:[0-8]|95)|5[0-478]|6(?:4[0-4]|5[1-589]))|7[1-9]|88"]], ["(\\d{4})(\\d{3,4})", "$1 $2", ["[45]|8(?:00|[1-49])", "[45]|8(?:00[1-9]|[1-49])"]], ["(\\d{2})(\\d{2})(\\d{4})", "$1 $2 $3", ["7"]], ["(\\d{4})(\\d{3})(\\d{3})", "$1 $2 $3", ["8"]]]], "EG": ["20", "00", "[189]\\d{8,9}|[24-6]\\d{8}|[135]\\d{7}", [8, 9, 10], [["(\\d)(\\d{7,8})", "$1 $2", ["[23]"], "0$1"], ["(\\d{2})(\\d{6,7})", "$1 $2", ["1[35]|[4-6]|8[2468]|9[235-7]"], "0$1"], ["(\\d{3})(\\d{3})(\\d{4})", "$1 $2 $3", ["[89]"], "0$1"], ["(\\d{2})(\\d{8})", "$1 $2", ["1"], "0$1"]], "0"], "EH": ["212", "00", "[5-8]\\d{8}", [9], 0, "0", 0, 0, 0, 0, "528[89]"], "ER": ["291", "00", "[178]\\d{6}", [7], [["(\\d)(\\d{3})(\\d{3})", "$1 $2 $3", ["[178]"], "0$1"]], "0"], "ES": ["34", "00", "[5-9]\\d{8}", [9], [["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["[89]00"]], ["(\\d{3})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[5-9]"]]]], "ET": ["251", "00", "(?:11|[2-579]\\d)\\d{7}", [9], [["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["[1-579]"], "0$1"]], "0"], "FI": ["358", "00|99(?:[01469]|5(?:[14]1|3[23]|5[59]|77|88|9[09]))", "[1-35689]\\d{4}|7\\d{10,11}|(?:[124-7]\\d|3[0-46-9])\\d{8}|[1-9]\\d{5,8}", [5, 6, 7, 8, 9, 10, 11, 12], [["(\\d{5})", "$1", ["20[2-59]"], "0$1"], ["(\\d{3})(\\d{3,7})", "$1 $2", ["(?:[1-3]0|[68])0|70[07-9]"], "0$1"], ["(\\d{2})(\\d{4,8})", "$1 $2", ["[14]|2[09]|50|7[135]"], "0$1"], ["(\\d{2})(\\d{6,10})", "$1 $2", ["7"], "0$1"], ["(\\d)(\\d{4,9})", "$1 $2", ["(?:19|[2568])[1-8]|3(?:0[1-9]|[1-9])|9"], "0$1"]], "0", 0, 0, 0, 0, "1[03-79]|[2-9]", 0, "00"], "FJ": ["679", "0(?:0|52)", "45\\d{5}|(?:0800\\d|[235-9])\\d{6}", [7, 11], [["(\\d{3})(\\d{4})", "$1 $2", ["[235-9]|45"]], ["(\\d{4})(\\d{3})(\\d{4})", "$1 $2 $3", ["0"]]], 0, 0, 0, 0, 0, 0, 0, "00"], "FK": ["500", "00", "[2-7]\\d{4}", [5]], "FM": ["691", "00", "(?:[39]\\d\\d|820)\\d{4}", [7], [["(\\d{3})(\\d{4})", "$1 $2", ["[389]"]]]], "FO": ["298", "00", "[2-9]\\d{5}", [6], [["(\\d{6})", "$1", ["[2-9]"]]], 0, 0, "(10(?:01|[12]0|88))"], "FR": ["33", "00", "[1-9]\\d{8}", [9], [["(\\d{3})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["8"], "0 $1"], ["(\\d)(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4 $5", ["[1-79]"], "0$1"]], "0"], "GA": ["241", "00", "(?:[067]\\d|11)\\d{6}|[2-7]\\d{6}", [7, 8], [["(\\d)(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[2-7]"], "0$1"], ["(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["0"]], ["(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["11|[67]"], "0$1"]], 0, 0, "0(11\\d{6}|60\\d{6}|61\\d{6}|6[256]\\d{6}|7[467]\\d{6})", "$1"], "GB": ["44", "00", "[1-357-9]\\d{9}|[18]\\d{8}|8\\d{6}", [7, 9, 10], [["(\\d{3})(\\d{4})", "$1 $2", ["800", "8001", "80011", "800111", "8001111"], "0$1"], ["(\\d{3})(\\d{2})(\\d{2})", "$1 $2 $3", ["845", "8454", "84546", "845464"], "0$1"], ["(\\d{3})(\\d{6})", "$1 $2", ["800"], "0$1"], ["(\\d{5})(\\d{4,5})", "$1 $2", ["1(?:38|5[23]|69|76|94)", "1(?:(?:38|69)7|5(?:24|39)|768|946)", "1(?:3873|5(?:242|39[4-6])|(?:697|768)[347]|9467)"], "0$1"], ["(\\d{4})(\\d{5,6})", "$1 $2", ["1(?:[2-69][02-9]|[78])"], "0$1"], ["(\\d{2})(\\d{4})(\\d{4})", "$1 $2 $3", ["[25]|7(?:0|6[02-9])", "[25]|7(?:0|6(?:[03-9]|2[356]))"], "0$1"], ["(\\d{4})(\\d{6})", "$1 $2", ["7"], "0$1"], ["(\\d{3})(\\d{3})(\\d{4})", "$1 $2 $3", ["[1389]"], "0$1"]], "0", 0, "0|180020", 0, 0, 0, [["(?:1(?:1(?:3(?:[0-58]\\d\\d|73[0-35])|4(?:(?:[0-5]\\d|70)\\d|69[7-9])|(?:(?:5[0-26-9]|[78][0-49])\\d|6(?:[0-4]\\d|50))\\d)|(?:2(?:(?:0[024-9]|2[3-9]|3[3-79]|4[1-689]|[58][02-9]|6[0-47-9]|7[013-9]|9\\d)\\d|1(?:[0-7]\\d|8[0-3]))|(?:3(?:0\\d|1[0-8]|[25][02-9]|3[02-579]|[468][0-46-9]|7[1-35-79]|9[2-578])|4(?:0[03-9]|[137]\\d|[28][02-57-9]|4[02-69]|5[0-8]|[69][0-79])|5(?:0[1-35-9]|[16]\\d|2[024-9]|3[015689]|4[02-9]|5[03-9]|7[0-35-9]|8[0-468]|9[0-57-9])|6(?:0[034689]|1\\d|2[0-35689]|[38][013-9]|4[1-467]|5[0-69]|6[13-9]|7[0-8]|9[0-24578])|7(?:0[0246-9]|2\\d|3[0236-8]|4[03-9]|5[0-46-9]|6[013-9]|7[0-35-9]|8[024-9]|9[02-9])|8(?:0[35-9]|2[1-57-9]|3[02-578]|4[0-578]|5[124-9]|6[2-69]|7\\d|8[02-9]|9[02569])|9(?:0[02-589]|[18]\\d|2[02-689]|3[1-57-9]|4[2-9]|5[0-579]|6[2-47-9]|7[0-24578]|9[2-57]))\\d)\\d)|2(?:0[013478]|3[0189]|4[017]|8[0-46-9]|9[0-2])\\d{3})\\d{4}|1(?:2(?:0(?:46[1-4]|87[2-9])|545[1-79]|76(?:2\\d|3[1-8]|6[1-6])|9(?:7(?:2[0-4]|3[2-5])|8(?:2[2-8]|7[0-47-9]|8[3-5])))|3(?:6(?:38[2-5]|47[23])|8(?:47[04-9]|64[0157-9]))|4(?:044[1-7]|20(?:2[23]|8\\d)|6(?:0(?:30|5[2-57]|6[1-8]|7[2-8])|140)|8(?:052|87[1-3]))|5(?:2(?:4(?:3[2-79]|6\\d)|76\\d)|6(?:26[06-9]|686))|6(?:06(?:4\\d|7[4-79])|295[5-7]|35[34]\\d|47(?:24|61)|59(?:5[08]|6[67]|74)|9(?:55[0-4]|77[23]))|7(?:26(?:6[13-9]|7[0-7])|(?:442|688)\\d|50(?:2[0-3]|[3-68]2|76))|8(?:27[56]\\d|37(?:5[2-5]|8[239])|843[2-58])|9(?:0(?:0(?:6[1-8]|85)|52\\d)|3583|4(?:66[1-8]|9(?:2[01]|81))|63(?:23|3[1-4])|9561))\\d{3}", [9, 10]], ["7(?:457[0-57-9]|700[01]|911[028])\\d{5}|7(?:[1-3]\\d\\d|4(?:[0-46-9]\\d|5[0-689])|5(?:0[0-8]|[13-9]\\d|2[0-35-9])|7(?:0[1-9]|[1-7]\\d|8[02-9]|9[0-689])|8(?:[014-9]\\d|[23][0-8])|9(?:[024-9]\\d|1[02-9]|3[0-689]))\\d{6}", [10]], ["80[08]\\d{7}|800\\d{6}|8001111"], ["(?:8(?:4[2-5]|7[0-3])|9(?:[01]\\d|8[2-49]))\\d{7}|845464\\d", [7, 10]], ["70\\d{8}", [10]], 0, ["(?:3[0347]|55)\\d{8}", [10]], ["76(?:464|652)\\d{5}|76(?:0[0-28]|2[356]|34|4[01347]|5[49]|6[0-369]|77|8[14]|9[139])\\d{6}", [10]], ["56\\d{8}", [10]]], 0, " x"], "GD": ["1", "011", "(?:473|[58]\\d\\d|900)\\d{7}", [10], 0, "1", 0, "([2-9]\\d{6})$|1", "473$1", 0, "473"], "GE": ["995", "00", "(?:[3-57]\\d\\d|800)\\d{6}", [9], [["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["70"], "0$1"], ["(\\d{2})(\\d{3})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["32"], "0$1"], ["(\\d{3})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[57]"]], ["(\\d{3})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[348]"], "0$1"]], "0"], "GF": ["594", "00", "(?:[56]94\\d|7093)\\d{5}|(?:80|9\\d)\\d{7}", [9], [["(\\d{3})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[5-7]|9[47]"], "0$1"], ["(\\d{3})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[89]"], "0$1"]], "0"], "GG": ["44", "00", "(?:1481|[357-9]\\d{3})\\d{6}|8\\d{6}(?:\\d{2})?", [7, 9, 10], 0, "0", 0, "([25-9]\\d{5})$|0|180020", "1481$1", 0, 0, [["1481[25-9]\\d{5}", [10]], ["7(?:(?:781|839)\\d|911[17])\\d{5}", [10]], ["80[08]\\d{7}|800\\d{6}|8001111"], ["(?:8(?:4[2-5]|7[0-3])|9(?:[01]\\d|8[0-3]))\\d{7}|845464\\d", [7, 10]], ["70\\d{8}", [10]], 0, ["(?:3[0347]|55)\\d{8}", [10]], ["76(?:464|652)\\d{5}|76(?:0[0-28]|2[356]|34|4[01347]|5[49]|6[0-369]|77|8[14]|9[139])\\d{6}", [10]], ["56\\d{8}", [10]]]], "GH": ["233", "00", "(?:[235]\\d{3}|800)\\d{5}", [8, 9], [["(\\d{3})(\\d{5})", "$1 $2", ["8"], "0$1"], ["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["[235]"], "0$1"]], "0"], "GI": ["350", "00", "(?:[25]\\d|60)\\d{6}", [8], [["(\\d{3})(\\d{5})", "$1 $2", ["2"]]]], "GL": ["299", "00", "(?:19|[2-689]\\d|70)\\d{4}", [6], [["(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3", ["19|[2-9]"]]]], "GM": ["220", "00", "[2-9]\\d{6}", [7], [["(\\d{3})(\\d{4})", "$1 $2", ["[2-9]"]]]], "GN": ["224", "00", "722\\d{6}|(?:3|6\\d)\\d{7}", [8, 9], [["(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["3"]], ["(\\d{3})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[67]"]]]], "GP": ["590", "00", "(?:590\\d|7090)\\d{5}|(?:69|80|9\\d)\\d{7}", [9], [["(\\d{3})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[5-79]"], "0$1"], ["(\\d{3})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["8"], "0$1"]], "0", 0, 0, 0, 0, 0, [["590(?:0[1-68]|[14][0-24-9]|2[0-68]|3[1-9]|5[3-579]|[68][0-689]|7[08]|9\\d)\\d{4}"], ["(?:69(?:0\\d\\d|1(?:2[2-9]|3[0-5])|4(?:0[89]|1[2-6]|9\\d)|6(?:1[016-9]|5[0-4]|[67]\\d))|7090[0-4])\\d{4}"], ["80[0-5]\\d{6}"], 0, 0, 0, 0, 0, ["9(?:(?:39[5-7]|76[018])\\d|475[0-6])\\d{4}"]]], "GQ": ["240", "00", "222\\d{6}|(?:3\\d|55|[89]0)\\d{7}", [9], [["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["[235]"]], ["(\\d{3})(\\d{6})", "$1 $2", ["[89]"]]]], "GR": ["30", "00", "5005000\\d{3}|8\\d{9,11}|(?:[269]\\d|70)\\d{8}", [10, 11, 12], [["(\\d{2})(\\d{4})(\\d{4})", "$1 $2 $3", ["21|7"]], ["(\\d{4})(\\d{6})", "$1 $2", ["2(?:2|3[2-57-9]|4[2-469]|5[2-59]|6[2-9]|7[2-69]|8[2-49])|5"]], ["(\\d{3})(\\d{3})(\\d{4})", "$1 $2 $3", ["[2689]"]], ["(\\d{3})(\\d{3,4})(\\d{5})", "$1 $2 $3", ["8"]]]], "GT": ["502", "00", "80\\d{6}|(?:1\\d{3}|[2-7])\\d{7}", [8, 11], [["(\\d{4})(\\d{4})", "$1 $2", ["[2-8]"]], ["(\\d{4})(\\d{3})(\\d{4})", "$1 $2 $3", ["1"]]]], "GU": ["1", "011", "(?:[58]\\d\\d|671|900)\\d{7}", [10], 0, "1", 0, "([2-9]\\d{6})$|1", "671$1", 0, "671"], "GW": ["245", "00", "[49]\\d{8}|4\\d{6}", [7, 9], [["(\\d{3})(\\d{4})", "$1 $2", ["40"]], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["[49]"]]]], "GY": ["592", "001", "(?:[2-8]\\d{3}|9008)\\d{3}", [7], [["(\\d{3})(\\d{4})", "$1 $2", ["[2-9]"]]]], "HK": ["852", "00(?:30|5[09]|[126-9]?)", "8[0-46-9]\\d{6,7}|9\\d{4,7}|(?:[2-7]|9\\d{3})\\d{7}", [5, 6, 7, 8, 9, 11], [["(\\d{3})(\\d{2,5})", "$1 $2", ["900", "9003"]], ["(\\d{4})(\\d{4})", "$1 $2", ["[2-7]|8[1-4]|9(?:0[1-9]|[1-8])"]], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["8"]], ["(\\d{3})(\\d{2})(\\d{3})(\\d{3})", "$1 $2 $3 $4", ["9"]]], 0, 0, 0, 0, 0, 0, 0, "00"], "HN": ["504", "00", "8\\d{10}|[237-9]\\d{7}", [8, 11], [["(\\d{4})(\\d{4})", "$1-$2", ["[237-9]"]]]], "HR": ["385", "00", "[2-69]\\d{8}|80\\d{5,7}|[1-79]\\d{7}|6\\d{6}", [7, 8, 9], [["(\\d{2})(\\d{2})(\\d{3})", "$1 $2 $3", ["6[01]"], "0$1"], ["(\\d{3})(\\d{2})(\\d{2,3})", "$1 $2 $3", ["8"], "0$1"], ["(\\d)(\\d{4})(\\d{3})", "$1 $2 $3", ["1"], "0$1"], ["(\\d{2})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["6|7[245]"], "0$1"], ["(\\d{2})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["9"], "0$1"], ["(\\d{2})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["[2-57]"], "0$1"], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["8"], "0$1"]], "0"], "HT": ["509", "00", "[2-589]\\d{7}", [8], [["(\\d{2})(\\d{2})(\\d{4})", "$1 $2 $3", ["[2-589]"]]]], "HU": ["36", "00", "[235-7]\\d{8}|[1-9]\\d{7}", [8, 9], [["(\\d)(\\d{3})(\\d{4})", "$1 $2 $3", ["1"], "(06 $1)"], ["(\\d{2})(\\d{3})(\\d{3})", "$1 $2 $3", ["[27][2-9]|3[2-7]|4[24-9]|5[2-79]|6|8[2-57-9]|9[2-69]"], "(06 $1)"], ["(\\d{2})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["[2-9]"], "06 $1"]], "06"], "ID": ["62", "00[89]", "00[1-9]\\d{9,14}|(?:[1-36]|8\\d{5})\\d{6}|00\\d{9}|[1-9]\\d{8,10}|[2-9]\\d{7}", [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17], [["(\\d)(\\d{3})(\\d{3})", "$1 $2 $3", ["15"]], ["(\\d{2})(\\d{5,9})", "$1 $2", ["2[124]|[36]1"], "(0$1)"], ["(\\d{3})(\\d{5,7})", "$1 $2", ["800"], "0$1"], ["(\\d{3})(\\d{5,8})", "$1 $2", ["[2-79]"], "(0$1)"], ["(\\d{3})(\\d{3,4})(\\d{3})", "$1-$2-$3", ["8[1-35-9]"], "0$1"], ["(\\d{3})(\\d{6,8})", "$1 $2", ["1"], "0$1"], ["(\\d{3})(\\d{3})(\\d{4})", "$1 $2 $3", ["804"], "0$1"], ["(\\d{3})(\\d)(\\d{3})(\\d{3})", "$1 $2 $3 $4", ["80"], "0$1"], ["(\\d{3})(\\d{4})(\\d{4,5})", "$1-$2-$3", ["8"], "0$1"]], "0"], "IE": ["353", "00", "(?:1\\d|[2569])\\d{6,8}|4\\d{6,9}|7\\d{8}|8\\d{8,9}", [7, 8, 9, 10], [["(\\d{2})(\\d{5})", "$1 $2", ["2[24-9]|47|58|6[237-9]|9[35-9]"], "(0$1)"], ["(\\d{3})(\\d{5})", "$1 $2", ["[45]0"], "(0$1)"], ["(\\d)(\\d{3,4})(\\d{4})", "$1 $2 $3", ["1"], "(0$1)"], ["(\\d{2})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["[2569]|4[1-69]|7[14]"], "(0$1)"], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["70"], "0$1"], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["81"], "(0$1)"], ["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["[78]"], "0$1"], ["(\\d{4})(\\d{3})(\\d{3})", "$1 $2 $3", ["1"]], ["(\\d{2})(\\d{4})(\\d{4})", "$1 $2 $3", ["4"], "(0$1)"], ["(\\d{2})(\\d)(\\d{3})(\\d{4})", "$1 $2 $3 $4", ["8"], "0$1"]], "0"], "IL": ["972", "0(?:0|1[2-9])", "1\\d{6}(?:\\d{3,5})?|[57]\\d{8}|[1-489]\\d{7}", [7, 8, 9, 10, 11, 12], [["(\\d{4})(\\d{3})", "$1-$2", ["125"]], ["(\\d{4})(\\d{2})(\\d{2})", "$1-$2-$3", ["121"]], ["(\\d)(\\d{3})(\\d{4})", "$1-$2-$3", ["[2-489]"], "0$1"], ["(\\d{2})(\\d{3})(\\d{4})", "$1-$2-$3", ["[57]"], "0$1"], ["(\\d{4})(\\d{3})(\\d{3})", "$1-$2-$3", ["12"]], ["(\\d{4})(\\d{6})", "$1-$2", ["159"]], ["(\\d)(\\d{3})(\\d{3})(\\d{3})", "$1-$2-$3-$4", ["1[7-9]"]], ["(\\d{3})(\\d{1,2})(\\d{3})(\\d{4})", "$1-$2 $3-$4", ["15"]]], "0"], "IM": ["44", "00", "1624\\d{6}|(?:[3578]\\d|90)\\d{8}", [10], 0, "0", 0, "([25-8]\\d{5})$|0|180020", "1624$1", 0, "74576|(?:16|7[56])24"], "IN": ["91", "00", "(?:000800|[2-9]\\d\\d)\\d{7}|1\\d{7,12}", [8, 9, 10, 11, 12, 13], [["(\\d{8})", "$1", ["5(?:0|2[23]|3[03]|[67]1|88)", "5(?:0|2(?:21|3)|3(?:0|3[23])|616|717|888)", "5(?:0|2(?:21|3)|3(?:0|3[23])|616|717|8888)"], 0, 1], ["(\\d{4})(\\d{4,5})", "$1 $2", ["180", "1800"], 0, 1], ["(\\d{3})(\\d{3})(\\d{4})", "$1 $2 $3", ["140"], 0, 1], ["(\\d{2})(\\d{4})(\\d{4})", "$1 $2 $3", ["11|2[02]|33|4[04]|79[1-7]|80[2-46]", "11|2[02]|33|4[04]|79(?:[1-6]|7[19])|80(?:[2-4]|6[0-589])", "11|2[02]|33|4[04]|79(?:[124-6]|3(?:[02-9]|1[0-24-9])|7(?:1|9[1-6]))|80(?:[2-4]|6[0-589])"], "0$1", 1], ["(\\d{3})(\\d{3})(\\d{4})", "$1 $2 $3", ["1(?:2[0-249]|3[0-25]|4[145]|[68]|7[1257])|2(?:1[257]|3[013]|4[01]|5[0137]|6[0158]|78|8[1568])|3(?:26|4[1-3]|5[34]|6[01489]|7[02-46]|8[159])|4(?:1[36]|2[1-47]|5[12]|6[0-26-9]|7[0-24-9]|8[013-57]|9[014-7])|5(?:1[025]|22|[36][25]|4[28]|5[12]|[78]1)|6(?:12|[2-4]1|5[17]|6[13]|80)|7(?:12|3[134]|4[47]|61|88)|8(?:16|2[014]|3[126]|6[136]|7[078]|8[34]|91)|(?:43|59|75)[15]|(?:1[59]|29|67|72)[14]", "1(?:2[0-24]|3[0-25]|4[145]|[59][14]|6[1-9]|7[1257]|8[1-57-9])|2(?:1[257]|3[013]|4[01]|5[0137]|6[058]|78|8[1568]|9[14])|3(?:26|4[1-3]|5[34]|6[01489]|7[02-46]|8[159])|4(?:1[36]|2[1-47]|3[15]|5[12]|6[0-26-9]|7[0-24-9]|8[013-57]|9[014-7])|5(?:1[025]|22|[36][25]|4[28]|[578]1|9[15])|674|7(?:(?:2[14]|3[34]|5[15])[2-6]|61[346]|88[0-8])|8(?:70[2-6]|84[235-7]|91[3-7])|(?:1(?:29|60|8[06])|261|552|6(?:12|[2-47]1|5[17]|6[13]|80)|7(?:12|31|4[47])|8(?:16|2[014]|3[126]|6[136]|7[78]|83))[2-7]", "1(?:2[0-24]|3[0-25]|4[145]|[59][14]|6[1-9]|7[1257]|8[1-57-9])|2(?:1[257]|3[013]|4[01]|5[0137]|6[058]|78|8[1568]|9[14])|3(?:26|4[1-3]|5[34]|6[01489]|7[02-46]|8[159])|4(?:1[36]|2[1-47]|3[15]|5[12]|6[0-26-9]|7[0-24-9]|8[013-57]|9[014-7])|5(?:1[025]|22|[36][25]|4[28]|[578]1|9[15])|6(?:12(?:[2-6]|7[0-8])|74[2-7])|7(?:(?:2[14]|5[15])[2-6]|3171|61[346]|88(?:[2-7]|82))|8(?:70[2-6]|84(?:[2356]|7[19])|91(?:[3-6]|7[19]))|73[134][2-6]|(?:74[47]|8(?:16|2[014]|3[126]|6[136]|7[78]|83))(?:[2-6]|7[19])|(?:1(?:29|60|8[06])|261|552|6(?:[2-4]1|5[17]|6[13]|7(?:1|4[0189])|80)|7(?:12|88[01]))[2-7]"], "0$1", 1], ["(\\d{4})(\\d{3})(\\d{3})", "$1 $2 $3", ["1(?:[2-479]|5[0235-9])|[2-5]|6(?:1[1358]|2[2457-9]|3[2-5]|4[235-7]|5[2-689]|6[24578]|7[235689]|8[1-6])|7(?:1[013-9]|28|3[129]|4[1-35689]|5[29]|6[02-5]|70)|807", "1(?:[2-479]|5[0235-9])|[2-5]|6(?:1[1358]|2(?:[2457]|84|95)|3(?:[2-4]|55)|4[235-7]|5[2-689]|6[24578]|7[235689]|8[1-6])|7(?:1(?:[013-8]|9[6-9])|28[6-8]|3(?:17|2[0-49]|9[2-57])|4(?:1[2-4]|[29][0-7]|3[0-8]|[56]|8[0-24-7])|5(?:2[1-3]|9[0-6])|6(?:0[5689]|2[5-9]|3[02-8]|4|5[0-367])|70[13-7])|807[19]", "1(?:[2-479]|5(?:[0236-9]|5[013-9]))|[2-5]|6(?:2(?:84|95)|355|83)|73179|807(?:1|9[1-3])|(?:1552|6(?:1[1358]|2[2457]|3[2-4]|4[235-7]|5[2-689]|6[24578]|7[235689]|8[124-6])\\d|7(?:1(?:[013-8]\\d|9[6-9])|28[6-8]|3(?:2[0-49]|9[2-57])|4(?:1[2-4]|[29][0-7]|3[0-8]|[56]\\d|8[0-24-7])|5(?:2[1-3]|9[0-6])|6(?:0[5689]|2[5-9]|3[02-8]|4\\d|5[0-367])|70[13-7]))[2-7]"], "0$1", 1], ["(\\d{5})(\\d{5})", "$1 $2", ["[6-9]"], "0$1", 1], ["(\\d{4})(\\d{2,4})(\\d{4})", "$1 $2 $3", ["1(?:6|8[06])", "1(?:6|8[06]0)"], 0, 1], ["(\\d{4})(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3 $4", ["18"], 0, 1]], "0"], "IO": ["246", "00", "3\\d{6}", [7], [["(\\d{3})(\\d{4})", "$1 $2", ["3"]]]], "IQ": ["964", "00", "(?:1|7\\d\\d)\\d{7}|[2-6]\\d{7,8}", [8, 9, 10], [["(\\d)(\\d{3})(\\d{4})", "$1 $2 $3", ["1"], "0$1"], ["(\\d{2})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["[2-6]"], "0$1"], ["(\\d{3})(\\d{3})(\\d{4})", "$1 $2 $3", ["7"], "0$1"]], "0"], "IR": ["98", "00", "[1-9]\\d{9}|(?:[1-8]\\d\\d|9)\\d{3,4}", [4, 5, 6, 7, 10], [["(\\d{4,5})", "$1", ["96"], "0$1"], ["(\\d{2})(\\d{4,5})", "$1 $2", ["(?:1[137]|2[13-68]|3[1458]|4[145]|5[1468]|6[16]|7[1467]|8[13467])[12689]"], "0$1"], ["(\\d{3})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["9"], "0$1"], ["(\\d{2})(\\d{4})(\\d{4})", "$1 $2 $3", ["[1-8]"], "0$1"]], "0"], "IS": ["354", "00|1(?:0(?:01|[12]0)|100)", "(?:38\\d|[4-9])\\d{6}", [7, 9], [["(\\d{3})(\\d{4})", "$1 $2", ["[4-9]"]], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["3"]]], 0, 0, 0, 0, 0, 0, 0, "00"], "IT": ["39", "00", "0\\d{5,11}|1\\d{8,10}|3(?:[0-8]\\d{7,10}|9\\d{7,8})|(?:43|55|70)\\d{8}|8\\d{5}(?:\\d{2,4})?", [6, 7, 8, 9, 10, 11, 12], [["(\\d{2})(\\d{4,6})", "$1 $2", ["0[26]"]], ["(\\d{3})(\\d{3,6})", "$1 $2", ["0[13-57-9][0159]|8(?:03|4[17]|9[2-5])", "0[13-57-9][0159]|8(?:03|4[17]|9(?:2|3[04]|[45][0-4]))"]], ["(\\d{4})(\\d{2,6})", "$1 $2", ["0(?:[13-579][2-46-8]|8[236-8])"]], ["(\\d{4})(\\d{4})", "$1 $2", ["894"]], ["(\\d{2})(\\d{3,4})(\\d{4})", "$1 $2 $3", ["0[26]|5"]], ["(\\d{3})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["1(?:44|[679])|[378]|43"]], ["(\\d{3})(\\d{3,4})(\\d{4})", "$1 $2 $3", ["0[13-57-9][0159]|14"]], ["(\\d{2})(\\d{4})(\\d{5})", "$1 $2 $3", ["0[26]"]], ["(\\d{4})(\\d{3})(\\d{4})", "$1 $2 $3", ["0"]], ["(\\d{3})(\\d{4})(\\d{4,5})", "$1 $2 $3", ["[03]"]]], 0, 0, 0, 0, 0, 0, [["0(?:669[0-79]\\d{1,6}|831\\d{2,8})|0(?:1(?:[0159]\\d|[27][1-5]|31|4[1-4]|6[1356]|8[2-57])|2\\d\\d|3(?:[0159]\\d|2[1-4]|3[12]|[48][1-6]|6[2-59]|7[1-7])|4(?:[0159]\\d|[23][1-9]|4[245]|6[1-5]|7[1-4]|81)|5(?:[0159]\\d|2[1-5]|3[2-6]|4[1-79]|6[4-6]|7[1-578]|8[3-8])|6(?:[0-57-9]\\d|6[0-8])|7(?:[0159]\\d|2[12]|3[1-7]|4[2-46]|6[13569]|7[13-6]|8[1-59])|8(?:[0159]\\d|2[3-578]|3[2356]|[6-8][1-5])|9(?:[0159]\\d|[238][1-5]|4[12]|6[1-8]|7[1-6]))\\d{2,7}"], ["3[2-9]\\d{7,8}|(?:31|43)\\d{8}", [9, 10]], ["80(?:0\\d{3}|3)\\d{3}", [6, 9]], ["(?:0878\\d{3}|89(?:2\\d|3[04]|4(?:[0-4]|[5-9]\\d\\d)|5[0-4]))\\d\\d|(?:1(?:44|6[346])|89(?:38|5[5-9]|9))\\d{6}", [6, 8, 9, 10]], ["1(?:78\\d|99)\\d{6}", [9, 10]], ["3[2-8]\\d{9,10}", [11, 12]], 0, 0, ["55\\d{8}", [10]], ["84(?:[08]\\d{3}|[17])\\d{3}", [6, 9]]]], "JE": ["44", "00", "1534\\d{6}|(?:[3578]\\d|90)\\d{8}", [10], 0, "0", 0, "([0-24-8]\\d{5})$|0|180020", "1534$1", 0, 0, [["1534[0-24-8]\\d{5}"], ["7(?:(?:(?:50|82)9|937)\\d|7(?:00[378]|97\\d))\\d{5}"], ["80(?:07(?:35|81)|8901)\\d{4}"], ["(?:8(?:4(?:4(?:4(?:05|42|69)|703)|5(?:041|800))|7(?:0002|1206))|90(?:066[59]|1810|71(?:07|55)))\\d{4}"], ["701511\\d{4}"], 0, ["(?:3(?:0(?:07(?:35|81)|8901)|3\\d{4}|4(?:4(?:4(?:05|42|69)|703)|5(?:041|800))|7(?:0002|1206))|55\\d{4})\\d{4}"], ["76(?:464|652)\\d{5}|76(?:0[0-28]|2[356]|34|4[01347]|5[49]|6[0-369]|77|8[14]|9[139])\\d{6}"], ["56\\d{8}"]]], "JM": ["1", "011", "(?:[58]\\d\\d|658|900)\\d{7}", [10], 0, "1", 0, 0, 0, 0, "658|876"], "JO": ["962", "00", "(?:(?:[2689]|7\\d)\\d|32|427|53)\\d{6}", [8, 9], [["(\\d)(\\d{3})(\\d{4})", "$1 $2 $3", ["[2356]|87"], "(0$1)"], ["(\\d{3})(\\d{5,6})", "$1 $2", ["[89]"], "0$1"], ["(\\d{2})(\\d{7})", "$1 $2", ["70"], "0$1"], ["(\\d)(\\d{4})(\\d{4})", "$1 $2 $3", ["[47]"], "0$1"]], "0"], "JP": ["81", "010", "00[1-9]\\d{6,14}|[25-9]\\d{9}|(?:00|[1-9]\\d\\d)\\d{6}", [8, 9, 10, 11, 12, 13, 14, 15, 16, 17], [["(\\d{3})(\\d{3})(\\d{3})", "$1-$2-$3", ["(?:12|57|99)0"], "0$1"], ["(\\d{4})(\\d)(\\d{4})", "$1-$2-$3", ["1(?:26|3[79]|4[56]|5[4-68]|6[3-5])|499|5(?:76|97)|746|8(?:3[89]|47|51)|9(?:80|9[16])", "1(?:267|3(?:7[247]|9[278])|466|5(?:47|58|64)|6(?:3[245]|48|5[4-68]))|499[2468]|5(?:76|97)9|7468|8(?:3(?:8[7-9]|96)|477|51[2-9])|9(?:802|9(?:1[23]|69))|1(?:45|58)[67]", "1(?:267|3(?:7[247]|9[278])|466|5(?:47|58|64)|6(?:3[245]|48|5[4-68]))|499[2468]|5(?:769|979[2-69])|7468|8(?:3(?:8[7-9]|96[2457-9])|477|51[2-9])|9(?:802|9(?:1[23]|69))|1(?:45|58)[67]"], "0$1"], ["(\\d{2})(\\d{3})(\\d{4})", "$1-$2-$3", ["60"], "0$1"], ["(\\d)(\\d{4})(\\d{4})", "$1-$2-$3", ["3|4(?:2[09]|7[01])|6[1-9]", "3|4(?:2(?:0|9[02-69])|7(?:0[019]|1))|6[1-9]"], "0$1"], ["(\\d{2})(\\d{3})(\\d{4})", "$1-$2-$3", ["1(?:1|5[45]|77|88|9[69])|2(?:2[1-37]|3[0-269]|4[59]|5|6[24]|7[1-358]|8[1369]|9[0-38])|4(?:[28][1-9]|3[0-57]|[45]|6[248]|7[2-579]|9[29])|5(?:2|3[0459]|4[0-369]|5[29]|8[02389]|9[0-389])|7(?:2[02-46-9]|34|[58]|6[0249]|7[57]|9[2-6])|8(?:2[124589]|3[26-9]|49|51|6|7[0-468]|8[68]|9[019])|9(?:[23][1-9]|4[15]|5[138]|6[1-3]|7[156]|8[189]|9[1-489])", "1(?:1|5(?:4[018]|5[017])|77|88|9[69])|2(?:2(?:[127]|3[014-9])|3[0-269]|4[59]|5(?:[1-3]|5[0-69]|9[19])|62|7(?:[1-35]|8[0189])|8(?:[16]|3[0134]|9[0-5])|9(?:[028]|17))|4(?:2(?:[13-79]|8[014-6])|3[0-57]|[45]|6[248]|7[2-47]|8[1-9]|9[29])|5(?:2|3(?:[045]|9[0-8])|4[0-369]|5[29]|8[02389]|9[0-3])|7(?:2[02-46-9]|34|[58]|6[0249]|7[57]|9(?:[23]|4[0-59]|5[01569]|6[0167]))|8(?:2(?:[1258]|4[0-39]|9[0-2469])|3(?:[29]|60)|49|51|6(?:[0-24]|36|5[0-3589]|7[23]|9[01459])|7[0-468]|8[68])|9(?:[23][1-9]|4[15]|5[138]|6[1-3]|7[156]|8[189]|9(?:[1289]|3[34]|4[0178]))|(?:264|837)[016-9]|2(?:57|93)[015-9]|(?:25[0468]|422|838)[01]|(?:47[59]|59[89]|8(?:6[68]|9))[019]", "1(?:1|5(?:4[018]|5[017])|77|88|9[69])|2(?:2[127]|3[0-269]|4[59]|5(?:[1-3]|5[0-69]|9(?:17|99))|6(?:2|4[016-9])|7(?:[1-35]|8[0189])|8(?:[16]|3[0134]|9[0-5])|9(?:[028]|17))|4(?:2(?:[13-79]|8[014-6])|3[0-57]|[45]|6[248]|7[2-47]|9[29])|5(?:2|3(?:[045]|9(?:[0-58]|6[4-9]|7[0-35689]))|4[0-369]|5[29]|8[02389]|9[0-3])|7(?:2[02-46-9]|34|[58]|6[0249]|7[57]|9(?:[23]|4[0-59]|5[01569]|6[0167]))|8(?:2(?:[1258]|4[0-39]|9[0169])|3(?:[29]|60|7(?:[017-9]|6[6-8]))|49|51|6(?:[0-24]|36[2-57-9]|5(?:[0-389]|5[23])|6(?:[01]|9[178])|7(?:2[2-468]|3[78])|9[0145])|7[0-468]|8[68])|9(?:4[15]|5[138]|7[156]|8[189]|9(?:[1289]|3(?:31|4[357])|4[0178]))|(?:8294|96)[1-3]|2(?:57|93)[015-9]|(?:223|8699)[014-9]|(?:25[0468]|422|838)[01]|(?:48|8292|9[23])[1-9]|(?:47[59]|59[89]|8(?:68|9))[019]"], "0$1"], ["(\\d{3})(\\d{2})(\\d{4})", "$1-$2-$3", ["[14]|[289][2-9]|5[3-9]|7[2-4679]"], "0$1"], ["(\\d{3})(\\d{3})(\\d{4})", "$1-$2-$3", ["800"], "0$1"], ["(\\d{2})(\\d{4})(\\d{4})", "$1-$2-$3", ["[25-9]"], "0$1"]], "0", 0, "(000[2569]\\d{4,6})$|(?:(?:003768)0?)|0", "$1"], "KE": ["254", "000", "(?:[17]\\d\\d|900)\\d{6}|(?:2|80)0\\d{6,7}|[4-6]\\d{6,8}", [7, 8, 9, 10], [["(\\d{2})(\\d{5,7})", "$1 $2", ["[24-6]"], "0$1"], ["(\\d{3})(\\d{6})", "$1 $2", ["[17]"], "0$1"], ["(\\d{3})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["[89]"], "0$1"]], "0"], "KG": ["996", "00", "8\\d{9}|[235-9]\\d{8}", [9, 10], [["(\\d{4})(\\d{5})", "$1 $2", ["3(?:1[346]|[24-79])"], "0$1"], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["[235-79]|88"], "0$1"], ["(\\d{3})(\\d{3})(\\d)(\\d{2,3})", "$1 $2 $3 $4", ["8"], "0$1"]], "0"], "KH": ["855", "00[14-9]", "1\\d{9}|[1-9]\\d{7,8}", [8, 9, 10], [["(\\d{2})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["[1-9]"], "0$1"], ["(\\d{4})(\\d{3})(\\d{3})", "$1 $2 $3", ["1"]]], "0"], "KI": ["686", "00", "(?:[37]\\d|6[0-79])\\d{6}|(?:[2-48]\\d|50)\\d{3}", [5, 8], 0, "0"], "KM": ["269", "00", "[3478]\\d{6}", [7], [["(\\d{3})(\\d{2})(\\d{2})", "$1 $2 $3", ["[3478]"]]]], "KN": ["1", "011", "(?:[58]\\d\\d|900)\\d{7}", [10], 0, "1", 0, "([2-7]\\d{6})$|1", "869$1", 0, "869"], "KP": ["850", "00|99", "85\\d{6}|(?:19\\d|[2-7])\\d{7}", [8, 10], [["(\\d{2})(\\d{3})(\\d{3})", "$1 $2 $3", ["8"], "0$1"], ["(\\d)(\\d{3})(\\d{4})", "$1 $2 $3", ["[2-7]"], "0$1"], ["(\\d{3})(\\d{3})(\\d{4})", "$1 $2 $3", ["1"], "0$1"]], "0"], "KR": ["82", "00(?:[125689]|3(?:[46]5|91)|7(?:00|27|3|55|6[126]))", "00[1-9]\\d{8,11}|(?:[12]|5\\d{3})\\d{7}|[13-6]\\d{9}|(?:[1-6]\\d|80)\\d{7}|[3-6]\\d{4,5}|(?:00|7)0\\d{8}", [5, 6, 8, 9, 10, 11, 12, 13, 14], [["(\\d{2})(\\d{3,4})", "$1-$2", ["(?:3[1-3]|[46][1-4]|5[1-5])1"], "0$1"], ["(\\d{4})(\\d{4})", "$1-$2", ["1"]], ["(\\d)(\\d{3,4})(\\d{4})", "$1-$2-$3", ["2"], "0$1"], ["(\\d{2})(\\d{3})(\\d{4})", "$1-$2-$3", ["[36]0|8"], "0$1"], ["(\\d{2})(\\d{3,4})(\\d{4})", "$1-$2-$3", ["[1346]|5[1-5]"], "0$1"], ["(\\d{2})(\\d{4})(\\d{4})", "$1-$2-$3", ["[57]"], "0$1"], ["(\\d{2})(\\d{5})(\\d{4})", "$1-$2-$3", ["5"], "0$1"]], "0", 0, "0(8(?:[1-46-8]|5\\d\\d))?"], "KW": ["965", "00", "18\\d{5}|(?:[2569]\\d|41)\\d{6}", [7, 8], [["(\\d{4})(\\d{3,4})", "$1 $2", ["[169]|2(?:[235]|4[1-35-9])|52"]], ["(\\d{3})(\\d{5})", "$1 $2", ["[245]"]]]], "KY": ["1", "011", "(?:345|[58]\\d\\d|900)\\d{7}", [10], 0, "1", 0, "([2-9]\\d{6})$|1", "345$1", 0, "345"], "KZ": ["7", "810", "(?:33622|8\\d{8})\\d{5}|[78]\\d{9}", [10, 14], 0, "8", 0, 0, 0, 0, "33622|7", 0, "8~10"], "LA": ["856", "00", "[23]\\d{9}|3\\d{8}|(?:[235-8]\\d|41)\\d{6}", [8, 9, 10], [["(\\d{2})(\\d{3})(\\d{3})", "$1 $2 $3", ["2[13]|3[14]|[4-8]"], "0$1"], ["(\\d{2})(\\d{2})(\\d{2})(\\d{3})", "$1 $2 $3 $4", ["3"], "0$1"], ["(\\d{2})(\\d{2})(\\d{3})(\\d{3})", "$1 $2 $3 $4", ["[23]"], "0$1"]], "0"], "LB": ["961", "00", "[27-9]\\d{7}|[13-9]\\d{6}", [7, 8], [["(\\d)(\\d{3})(\\d{3})", "$1 $2 $3", ["[13-69]|7(?:[2-57]|62|8[0-6]|9[04-9])|8[02-9]"], "0$1"], ["(\\d{2})(\\d{3})(\\d{3})", "$1 $2 $3", ["[27-9]"]]], "0"], "LC": ["1", "011", "(?:[58]\\d\\d|758|900)\\d{7}", [10], 0, "1", 0, "([2-8]\\d{6})$|1", "758$1", 0, "758"], "LI": ["423", "00", "[68]\\d{8}|(?:[2378]\\d|90)\\d{5}", [7, 9], [["(\\d{3})(\\d{2})(\\d{2})", "$1 $2 $3", ["[2379]|8(?:0[09]|7)", "[2379]|8(?:0(?:02|9)|7)"]], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["8"]], ["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["69"]], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["6"]]], "0", 0, "(1001)|0"], "LK": ["94", "00", "[1-9]\\d{8}", [9], [["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["7"], "0$1"], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["[1-689]"], "0$1"]], "0"], "LR": ["231", "00", "(?:[2457]\\d|33|88)\\d{7}|(?:2\\d|[4-6])\\d{6}", [7, 8, 9], [["(\\d)(\\d{3})(\\d{3})", "$1 $2 $3", ["4[67]|[56]"], "0$1"], ["(\\d{2})(\\d{3})(\\d{3})", "$1 $2 $3", ["2"], "0$1"], ["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["[2-578]"], "0$1"]], "0"], "LS": ["266", "00", "(?:[256]\\d\\d|800)\\d{5}", [8], [["(\\d{4})(\\d{4})", "$1 $2", ["[2568]"]]]], "LT": ["370", "00", "(?:[3469]\\d|52|[78]0)\\d{6}", [8], [["(\\d)(\\d{3})(\\d{4})", "$1 $2 $3", ["52[0-7]"], "(0-$1)", 1], ["(\\d{3})(\\d{2})(\\d{3})", "$1 $2 $3", ["[7-9]"], "0 $1", 1], ["(\\d{2})(\\d{6})", "$1 $2", ["37|4(?:[15]|6[1-8])"], "(0-$1)", 1], ["(\\d{3})(\\d{5})", "$1 $2", ["[3-6]"], "(0-$1)", 1]], "0", 0, "[08]"], "LU": ["352", "00", "35[013-9]\\d{4,8}|6\\d{8}|35\\d{2,4}|(?:[2457-9]\\d|3[0-46-9])\\d{2,9}", [4, 5, 6, 7, 8, 9, 10, 11], [["(\\d{2})(\\d{3})", "$1 $2", ["2(?:0[2-689]|[2-9])|[3-57]|8(?:0[2-9]|[13-9])|9(?:0[89]|[2-579])"]], ["(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3", ["2(?:0[2-689]|[2-9])|[3-57]|8(?:0[2-9]|[13-9])|9(?:0[89]|[2-579])"]], ["(\\d{2})(\\d{2})(\\d{3})", "$1 $2 $3", ["20[2-689]"]], ["(\\d{2})(\\d{2})(\\d{2})(\\d{1,2})", "$1 $2 $3 $4", ["2(?:[0367]|4[3-8])"]], ["(\\d{3})(\\d{2})(\\d{3})", "$1 $2 $3", ["80[01]|90[015]"]], ["(\\d{2})(\\d{2})(\\d{2})(\\d{3})", "$1 $2 $3 $4", ["20"]], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["6"]], ["(\\d{2})(\\d{2})(\\d{2})(\\d{2})(\\d{1,2})", "$1 $2 $3 $4 $5", ["2(?:[0367]|4[3-8])"]], ["(\\d{2})(\\d{2})(\\d{2})(\\d{1,5})", "$1 $2 $3 $4", ["[3-57]|8[13-9]|9(?:0[89]|[2-579])|(?:2|80)[2-9]"]]], 0, 0, "(15(?:0[06]|1[12]|[35]5|4[04]|6[26]|77|88|99)\\d)"], "LV": ["371", "00", "(?:[268]\\d|78|90)\\d{6}", [8], [["(\\d{2})(\\d{3})(\\d{3})", "$1 $2 $3", ["[2679]|8[01]"]]]], "LY": ["218", "00", "[2-9]\\d{8}", [9], [["(\\d{2})(\\d{7})", "$1-$2", ["[2-9]"], "0$1"]], "0"], "MA": ["212", "00", "[5-8]\\d{8}", [9], [["(\\d{3})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["5[45]"], "0$1"], ["(\\d{4})(\\d{5})", "$1-$2", ["5(?:2[2-46-9]|3[3-9]|9)|8(?:0[89]|92)"], "0$1"], ["(\\d{2})(\\d{7})", "$1-$2", ["8"], "0$1"], ["(\\d{3})(\\d{6})", "$1-$2", ["[5-7]"], "0$1"]], "0", 0, 0, 0, 0, 0, [["5(?:2(?:[0-25-79]\\d|3[1-578]|4[02-46-8]|8[0235-7])|3(?:[0-47]\\d|5[02-9]|6[02-8]|8[014-9]|9[3-9])|(?:4[067]|5[03])\\d)\\d{5}"], ["(?:6(?:[0-79]\\d|8[0-247-9])|7(?:[0167]\\d|2[0-8]|5[0-5]|8[0-7]))\\d{6}"], ["80[0-7]\\d{6}"], ["89\\d{7}"], 0, 0, 0, 0, ["(?:592(?:4[0-2]|93)|80[89]\\d\\d)\\d{4}"]]], "MC": ["377", "00", "(?:[3489]|6\\d)\\d{7}", [8, 9], [["(\\d{2})(\\d{3})(\\d{3})", "$1 $2 $3", ["4"], "0$1"], ["(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[389]"]], ["(\\d)(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4 $5", ["6"], "0$1"]], "0"], "MD": ["373", "00", "(?:[235-7]\\d|[89]0)\\d{6}", [8], [["(\\d{3})(\\d{5})", "$1 $2", ["[89]"], "0$1"], ["(\\d{2})(\\d{3})(\\d{3})", "$1 $2 $3", ["22|3"], "0$1"], ["(\\d{3})(\\d{2})(\\d{3})", "$1 $2 $3", ["[25-7]"], "0$1"]], "0"], "ME": ["382", "00", "(?:20|[3-79]\\d)\\d{6}|80\\d{6,7}", [8, 9], [["(\\d{2})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["[2-9]"], "0$1"]], "0"], "MF": ["590", "00", "(?:590\\d|7090)\\d{5}|(?:69|80|9\\d)\\d{7}", [9], 0, "0", 0, 0, 0, 0, 0, [["590(?:0[079]|[14]3|[27][79]|3[03-7]|5[0-268]|87)\\d{4}"], ["(?:69(?:0\\d\\d|1(?:2[2-9]|3[0-5])|4(?:0[89]|1[2-6]|9\\d)|6(?:1[016-9]|5[0-4]|[67]\\d))|7090[0-4])\\d{4}"], ["80[0-5]\\d{6}"], 0, 0, 0, 0, 0, ["9(?:(?:39[5-7]|76[018])\\d|475[0-6])\\d{4}"]]], "MG": ["261", "00", "[23]\\d{8}", [9], [["(\\d{2})(\\d{2})(\\d{3})(\\d{2})", "$1 $2 $3 $4", ["[23]"], "0$1"]], "0", 0, "([24-9]\\d{6})$|0", "20$1"], "MH": ["692", "011", "329\\d{4}|(?:[256]\\d|45)\\d{5}", [7], [["(\\d{3})(\\d{4})", "$1-$2", ["[2-6]"]]], "1"], "MK": ["389", "00", "[2-578]\\d{7}", [8], [["(\\d)(\\d{3})(\\d{4})", "$1 $2 $3", ["2|34[47]|4(?:[37]7|5[47]|64)"], "0$1"], ["(\\d{2})(\\d{3})(\\d{3})", "$1 $2 $3", ["[347]"], "0$1"], ["(\\d{3})(\\d)(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[58]"], "0$1"]], "0"], "ML": ["223", "00", "[24-9]\\d{7}", [8], [["(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[24-9]"]]]], "MM": ["95", "00", "1\\d{5,7}|95\\d{6}|(?:[4-7]|9[0-46-9])\\d{6,8}|(?:2|8\\d)\\d{5,8}", [6, 7, 8, 9, 10], [["(\\d)(\\d{2})(\\d{3})", "$1 $2 $3", ["16|2"], "0$1"], ["(\\d{2})(\\d{2})(\\d{3})", "$1 $2 $3", ["4(?:[2-46]|5[3-5])|5|6(?:[1-689]|7[235-7])|7(?:[0-4]|5[2-7])|8[1-5]|(?:60|86)[23]"], "0$1"], ["(\\d)(\\d{3})(\\d{3,4})", "$1 $2 $3", ["[12]|452|678|86", "[12]|452|6788|86"], "0$1"], ["(\\d{2})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["[4-7]|8[1-35]"], "0$1"], ["(\\d)(\\d{3})(\\d{4,6})", "$1 $2 $3", ["9(?:2[0-4]|[35-9]|4[137-9])"], "0$1"], ["(\\d)(\\d{4})(\\d{4})", "$1 $2 $3", ["2"], "0$1"], ["(\\d{3})(\\d{3})(\\d{4})", "$1 $2 $3", ["8"], "0$1"], ["(\\d)(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3 $4", ["92"], "0$1"], ["(\\d)(\\d{5})(\\d{4})", "$1 $2 $3", ["9"], "0$1"]], "0"], "MN": ["976", "001", "[12]\\d{7,9}|[5-9]\\d{7}", [8, 9, 10], [["(\\d{2})(\\d{2})(\\d{4})", "$1 $2 $3", ["[12]1"], "0$1"], ["(\\d{4})(\\d{4})", "$1 $2", ["[5-9]"]], ["(\\d{3})(\\d{5,6})", "$1 $2", ["[12]2[1-3]"], "0$1"], ["(\\d{4})(\\d{5,6})", "$1 $2", ["[12](?:27|3[2-8]|4[2-68]|5[1-4689])", "[12](?:27|3[2-8]|4[2-68]|5[1-4689])[0-3]"], "0$1"], ["(\\d{5})(\\d{4,5})", "$1 $2", ["[12]"], "0$1"]], "0"], "MO": ["853", "00", "0800\\d{3}|(?:28|[68]\\d)\\d{6}", [7, 8], [["(\\d{4})(\\d{3})", "$1 $2", ["0"]], ["(\\d{4})(\\d{4})", "$1 $2", ["[268]"]]]], "MP": ["1", "011", "[58]\\d{9}|(?:67|90)0\\d{7}", [10], 0, "1", 0, "([2-9]\\d{6})$|1", "670$1", 0, "670"], "MQ": ["596", "00", "(?:596\\d|7091)\\d{5}|(?:69|[89]\\d)\\d{7}", [9], [["(\\d{3})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[5-79]|8(?:0[6-9]|[36])"], "0$1"], ["(\\d{3})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["8"], "0$1"]], "0"], "MR": ["222", "00", "(?:[2-4]\\d\\d|800)\\d{5}", [8], [["(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[2-48]"]]]], "MS": ["1", "011", "(?:[58]\\d\\d|664|900)\\d{7}", [10], 0, "1", 0, "([34]\\d{6})$|1", "664$1", 0, "664"], "MT": ["356", "00", "3550\\d{4}|(?:[2579]\\d\\d|800)\\d{5}", [8], [["(\\d{4})(\\d{4})", "$1 $2", ["[2357-9]"]]]], "MU": ["230", "0(?:0|[24-7]0|3[03])", "(?:[57]|8\\d\\d)\\d{7}|[2-468]\\d{6}", [7, 8, 10], [["(\\d{3})(\\d{4})", "$1 $2", ["[2-46]|8[013]"]], ["(\\d{4})(\\d{4})", "$1 $2", ["[57]"]], ["(\\d{5})(\\d{5})", "$1 $2", ["8"]]], 0, 0, 0, 0, 0, 0, 0, "020"], "MV": ["960", "0(?:0|19)", "(?:800|9[0-57-9]\\d)\\d{7}|[34679]\\d{6}", [7, 10], [["(\\d{3})(\\d{4})", "$1-$2", ["[34679]"]], ["(\\d{3})(\\d{3})(\\d{4})", "$1 $2 $3", ["[89]"]]], 0, 0, 0, 0, 0, 0, 0, "00"], "MW": ["265", "00", "(?:[1289]\\d|31|77)\\d{7}|1\\d{6}", [7, 9], [["(\\d)(\\d{3})(\\d{3})", "$1 $2 $3", ["1[2-9]"], "0$1"], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["2"], "0$1"], ["(\\d{3})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[137-9]"], "0$1"]], "0"], "MX": ["52", "0[09]", "[2-9]\\d{9}", [10], [["(\\d{2})(\\d{4})(\\d{4})", "$1 $2 $3", ["33|5[56]|81"]], ["(\\d{3})(\\d{3})(\\d{4})", "$1 $2 $3", ["[2-9]"]]], 0, 0, 0, 0, 0, 0, 0, "00"], "MY": ["60", "00", "1\\d{8,9}|(?:3\\d|[4-9])\\d{7}", [8, 9, 10], [["(\\d)(\\d{3})(\\d{4})", "$1-$2 $3", ["[4-79]"], "0$1"], ["(\\d{2})(\\d{3})(\\d{3,4})", "$1-$2 $3", ["1(?:[02469]|[378][1-9]|53)|8", "1(?:[02469]|[37][1-9]|53|8(?:[1-46-9]|5[7-9]))|8"], "0$1"], ["(\\d)(\\d{4})(\\d{4})", "$1-$2 $3", ["3"], "0$1"], ["(\\d)(\\d{3})(\\d{2})(\\d{4})", "$1-$2-$3-$4", ["1(?:[367]|80)"]], ["(\\d{3})(\\d{3})(\\d{4})", "$1-$2 $3", ["15"], "0$1"], ["(\\d{2})(\\d{4})(\\d{4})", "$1-$2 $3", ["1"], "0$1"]], "0"], "MZ": ["258", "00", "(?:2|8\\d)\\d{7}", [8, 9], [["(\\d{2})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["2|8[2-79]"]], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["8"]]]], "NA": ["264", "00", "[68]\\d{7,8}", [8, 9], [["(\\d{2})(\\d{3})(\\d{3})", "$1 $2 $3", ["88"], "0$1"], ["(\\d{2})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["6"], "0$1"], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["87"], "0$1"], ["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["8"], "0$1"]], "0"], "NC": ["687", "00", "(?:050|[2-57-9]\\d\\d)\\d{3}", [6], [["(\\d{2})(\\d{2})(\\d{2})", "$1.$2.$3", ["[02-57-9]"]]]], "NE": ["227", "00", "[027-9]\\d{7}", [8], [["(\\d{2})(\\d{3})(\\d{3})", "$1 $2 $3", ["08"]], ["(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[089]|2[013]|7[0467]"]]]], "NF": ["672", "00", "[13]\\d{5}", [6], [["(\\d{2})(\\d{4})", "$1 $2", ["1[0-3]"]], ["(\\d)(\\d{5})", "$1 $2", ["[13]"]]], 0, 0, "([0-258]\\d{4})$", "3$1"], "NG": ["234", "009", "(?:20|9\\d)\\d{8}|[78]\\d{9,13}", [10, 11, 12, 13, 14], [["(\\d{3})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["[7-9]"], "0$1"], ["(\\d{3})(\\d{3})(\\d{4})", "$1 $2 $3", ["20[129]"], "0$1"], ["(\\d{4})(\\d{2})(\\d{4})", "$1 $2 $3", ["2"], "0$1"], ["(\\d{3})(\\d{4})(\\d{4,5})", "$1 $2 $3", ["[78]"], "0$1"], ["(\\d{3})(\\d{5})(\\d{5,6})", "$1 $2 $3", ["[78]"], "0$1"]], "0"], "NI": ["505", "00", "(?:1800|[25-8]\\d{3})\\d{4}", [8], [["(\\d{4})(\\d{4})", "$1 $2", ["[125-8]"]]]], "NL": ["31", "00", "(?:[124-7]\\d\\d|3(?:[02-9]\\d|1[0-8]))\\d{6}|8\\d{6,9}|9\\d{6,10}|1\\d{4,5}", [5, 6, 7, 8, 9, 10, 11], [["(\\d{3})(\\d{4,7})", "$1 $2", ["[89]0"], "0$1"], ["(\\d{2})(\\d{7})", "$1 $2", ["66"], "0$1"], ["(\\d)(\\d{8})", "$1 $2", ["6"], "0$1"], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["1[16-8]|2[259]|3[124]|4[17-9]|5[124679]"], "0$1"], ["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["[1-578]|91"], "0$1"], ["(\\d{3})(\\d{3})(\\d{5})", "$1 $2 $3", ["9"], "0$1"]], "0"], "NO": ["47", "00", "(?:0|[2-9]\\d{3})\\d{4}", [5, 8], [["(\\d{3})(\\d{2})(\\d{3})", "$1 $2 $3", ["8"]], ["(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[2-79]"]]], 0, 0, 0, 0, 0, "[02-689]|7[0-8]"], "NP": ["977", "00", "(?:1\\d|9)\\d{9}|[1-9]\\d{7}", [8, 10, 11], [["(\\d)(\\d{7})", "$1-$2", ["1[2-6]"], "0$1"], ["(\\d{2})(\\d{6})", "$1-$2", ["1[01]|[2-8]|9(?:[1-59]|[67][2-6])"], "0$1"], ["(\\d{3})(\\d{7})", "$1-$2", ["9"]]], "0"], "NR": ["674", "00", "(?:222|444|(?:55|8\\d)\\d|666|777|999)\\d{4}", [7], [["(\\d{3})(\\d{4})", "$1 $2", ["[24-9]"]]]], "NU": ["683", "00", "(?:[4-7]|888\\d)\\d{3}", [4, 7], [["(\\d{3})(\\d{4})", "$1 $2", ["8"]]]], "NZ": ["64", "0(?:0|161)", "[1289]\\d{9}|50\\d{5}(?:\\d{2,3})?|[27-9]\\d{7,8}|(?:[34]\\d|6[0-35-9])\\d{6}|8\\d{4,6}", [5, 6, 7, 8, 9, 10], [["(\\d{2})(\\d{3,8})", "$1 $2", ["8[1-79]"], "0$1"], ["(\\d{3})(\\d{2})(\\d{2,3})", "$1 $2 $3", ["50[036-8]|8|90", "50(?:[0367]|88)|8|90"], "0$1"], ["(\\d)(\\d{3})(\\d{4})", "$1 $2 $3", ["24|[346]|7[2-57-9]|9[2-9]"], "0$1"], ["(\\d{3})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["2(?:10|74)|[589]"], "0$1"], ["(\\d{2})(\\d{3,4})(\\d{4})", "$1 $2 $3", ["1|2[028]"], "0$1"], ["(\\d{2})(\\d{3})(\\d{3,5})", "$1 $2 $3", ["2(?:[169]|7[0-35-9])|7"], "0$1"]], "0", 0, 0, 0, 0, 0, 0, "00"], "OM": ["968", "00", "(?:1505|[279]\\d{3}|500)\\d{4}|800\\d{5,6}", [7, 8, 9], [["(\\d{3})(\\d{4,6})", "$1 $2", ["[58]"]], ["(\\d{2})(\\d{6})", "$1 $2", ["2"]], ["(\\d{4})(\\d{4})", "$1 $2", ["[179]"]]]], "PA": ["507", "00", "(?:00800|8\\d{3})\\d{6}|[68]\\d{7}|[1-57-9]\\d{6}", [7, 8, 10, 11], [["(\\d{3})(\\d{4})", "$1-$2", ["[1-57-9]"]], ["(\\d{4})(\\d{4})", "$1-$2", ["[68]"]], ["(\\d{3})(\\d{3})(\\d{4})", "$1 $2 $3", ["8"]]]], "PE": ["51", "00|19(?:1[124]|77|90)00", "(?:[14-8]|9\\d)\\d{7}", [8, 9], [["(\\d{3})(\\d{5})", "$1 $2", ["80"], "(0$1)"], ["(\\d)(\\d{7})", "$1 $2", ["1"], "(0$1)"], ["(\\d{2})(\\d{6})", "$1 $2", ["[4-8]"], "(0$1)"], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["9"]]], "0", 0, 0, 0, 0, 0, 0, "00", " Anexo "], "PF": ["689", "00", "4\\d{5}(?:\\d{2})?|8\\d{7,8}", [6, 8, 9], [["(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3", ["44"]], ["(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["4|8[7-9]"]], ["(\\d{3})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["8"]]]], "PG": ["675", "00|140[1-3]", "(?:180|[78]\\d{3})\\d{4}|(?:[2-589]\\d|64)\\d{5}", [7, 8], [["(\\d{3})(\\d{4})", "$1 $2", ["18|[2-69]|85"]], ["(\\d{4})(\\d{4})", "$1 $2", ["[78]"]]], 0, 0, 0, 0, 0, 0, 0, "00"], "PH": ["63", "00", "(?:[2-7]|9\\d)\\d{8}|2\\d{5}|(?:1800|8)\\d{7,9}", [6, 8, 9, 10, 11, 12, 13], [["(\\d)(\\d{5})", "$1 $2", ["2"], "(0$1)"], ["(\\d{4})(\\d{4,6})", "$1 $2", ["3(?:23|39|46)|4(?:2[3-6]|[35]9|4[26]|76)|544|88[245]|(?:52|64|86)2", "3(?:230|397|461)|4(?:2(?:35|[46]4|51)|396|4(?:22|63)|59[347]|76[15])|5(?:221|446)|642[23]|8(?:622|8(?:[24]2|5[13]))"], "(0$1)"], ["(\\d{5})(\\d{4})", "$1 $2", ["346|4(?:27|9[35])|883", "3469|4(?:279|9(?:30|56))|8834"], "(0$1)"], ["(\\d)(\\d{4})(\\d{4})", "$1 $2 $3", ["2"], "(0$1)"], ["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["[3-7]|8[2-8]"], "(0$1)"], ["(\\d{3})(\\d{3})(\\d{4})", "$1 $2 $3", ["[89]"], "0$1"], ["(\\d{4})(\\d{3})(\\d{4})", "$1 $2 $3", ["1"]], ["(\\d{4})(\\d{1,2})(\\d{3})(\\d{4})", "$1 $2 $3 $4", ["1"]]], "0"], "PK": ["92", "00", "122\\d{6}|[24-8]\\d{10,11}|9(?:[013-9]\\d{8,10}|2(?:[01]\\d\\d|2(?:[06-8]\\d|1[01]))\\d{7})|(?:[2-8]\\d{3}|92(?:[0-7]\\d|8[1-9]))\\d{6}|[24-9]\\d{8}|[89]\\d{7}", [8, 9, 10, 11, 12], [["(\\d{3})(\\d{3})(\\d{2,7})", "$1 $2 $3", ["[89]0"], "0$1"], ["(\\d{4})(\\d{5})", "$1 $2", ["1"]], ["(\\d{3})(\\d{6,7})", "$1 $2", ["2(?:3[2358]|4[2-4]|9[2-8])|45[3479]|54[2-467]|60[468]|72[236]|8(?:2[2-689]|3[23578]|4[3478]|5[2356])|9(?:2[2-8]|3[27-9]|4[2-6]|6[3569]|9[25-8])", "9(?:2[3-8]|98)|(?:2(?:3[2358]|4[2-4]|9[2-8])|45[3479]|54[2-467]|60[468]|72[236]|8(?:2[2-689]|3[23578]|4[3478]|5[2356])|9(?:22|3[27-9]|4[2-6]|6[3569]|9[25-7]))[2-9]"], "(0$1)"], ["(\\d{2})(\\d{7,8})", "$1 $2", ["(?:2[125]|4[0-246-9]|5[1-35-7]|6[1-8]|7[14]|8[16]|91)[2-9]"], "(0$1)"], ["(\\d{5})(\\d{5})", "$1 $2", ["58"], "(0$1)"], ["(\\d{3})(\\d{7})", "$1 $2", ["3"], "0$1"], ["(\\d{2})(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3 $4", ["2[125]|4[0-246-9]|5[1-35-7]|6[1-8]|7[14]|8[16]|91"], "(0$1)"], ["(\\d{3})(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3 $4", ["[24-9]"], "(0$1)"]], "0"], "PL": ["48", "00", "(?:6|8\\d\\d)\\d{7}|[1-9]\\d{6}(?:\\d{2})?|[26]\\d{5}", [6, 7, 8, 9, 10], [["(\\d{5})", "$1", ["19"]], ["(\\d{3})(\\d{3})", "$1 $2", ["11|20|64"]], ["(\\d{2})(\\d{2})(\\d{3})", "$1 $2 $3", ["(?:1[2-8]|2[2-69]|3[2-4]|4[1-468]|5[24-689]|6[1-3578]|7[14-7]|8[1-79]|9[145])1", "(?:1[2-8]|2[2-69]|3[2-4]|4[1-468]|5[24-689]|6[1-3578]|7[14-7]|8[1-79]|9[145])19"]], ["(\\d{3})(\\d{2})(\\d{2,3})", "$1 $2 $3", ["64"]], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["21|39|45|5[0137]|6[0469]|7[02389]|8(?:0[14]|8)"]], ["(\\d{2})(\\d{3})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["1[2-8]|[2-7]|8[1-79]|9[145]"]], ["(\\d{3})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["8"]]]], "PM": ["508", "00", "[45]\\d{5}|(?:708|8\\d\\d)\\d{6}", [6, 9], [["(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3", ["[45]"], "0$1"], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["7"]], ["(\\d{3})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["8"], "0$1"]], "0"], "PR": ["1", "011", "(?:[589]\\d\\d|787)\\d{7}", [10], 0, "1", 0, 0, 0, 0, "787|939"], "PS": ["970", "00", "[2489]2\\d{6}|(?:1\\d|5)\\d{8}", [8, 9, 10], [["(\\d)(\\d{3})(\\d{4})", "$1 $2 $3", ["[2489]"], "0$1"], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["5"], "0$1"], ["(\\d{4})(\\d{3})(\\d{3})", "$1 $2 $3", ["1"]]], "0"], "PT": ["351", "00", "1693\\d{5}|(?:[26-9]\\d|30)\\d{7}", [9], [["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["2[12]"]], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["16|[236-9]"]]]], "PW": ["680", "01[12]", "(?:[24-8]\\d\\d|345|900)\\d{4}", [7], [["(\\d{3})(\\d{4})", "$1 $2", ["[2-9]"]]]], "PY": ["595", "00", "59\\d{4,6}|9\\d{5,10}|(?:[2-46-8]\\d|5[0-8])\\d{4,7}", [6, 7, 8, 9, 10, 11], [["(\\d{3})(\\d{3,6})", "$1 $2", ["[2-9]0"], "0$1"], ["(\\d{2})(\\d{5})", "$1 $2", ["[26]1|3[289]|4[1246-8]|7[1-3]|8[1-36]"], "(0$1)"], ["(\\d{3})(\\d{4,5})", "$1 $2", ["2[279]|3[13-5]|4[359]|5|6(?:[34]|7[1-46-8])|7[46-8]|85"], "(0$1)"], ["(\\d{2})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["2[14-68]|3[26-9]|4[1246-8]|6(?:1|75)|7[1-35]|8[1-36]"], "(0$1)"], ["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["87"]], ["(\\d{3})(\\d{6})", "$1 $2", ["9(?:[5-79]|8[1-7])"], "0$1"], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["[2-8]"], "0$1"], ["(\\d{4})(\\d{3})(\\d{4})", "$1 $2 $3", ["9"]]], "0"], "QA": ["974", "00", "800\\d{4}|(?:2|800)\\d{6}|(?:0080|[3-7])\\d{7}", [7, 8, 9, 11], [["(\\d{3})(\\d{4})", "$1 $2", ["2[136]|8"]], ["(\\d{4})(\\d{4})", "$1 $2", ["[3-7]"]]]], "RE": ["262", "00", "709\\d{6}|(?:26|[689]\\d)\\d{7}", [9], [["(\\d{3})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[26-9]"], "0$1"]], "0", 0, 0, 0, 0, 0, [["26(?:2\\d\\d|3(?:0\\d|1[0-6]))\\d{4}"], ["(?:69(?:2\\d\\d|3(?:[06][0-6]|1[0-3]|2[0-2]|3[0-39]|4\\d|5[0-5]|7[0-37]|8[0-8]|9[0-479]))|7092[0-3])\\d{4}"], ["80\\d{7}"], ["89[1-37-9]\\d{6}"], 0, 0, 0, 0, ["9(?:399[0-3]|479[0-6]|76(?:2[278]|3[0-37]))\\d{4}"], ["8(?:1[019]|2[0156]|84|90)\\d{6}"]]], "RO": ["40", "00", "(?:[236-8]\\d|90)\\d{7}|[23]\\d{5}", [6, 9], [["(\\d{3})(\\d{3})", "$1 $2", ["2[3-6]", "2[3-6]\\d9"], "0$1"], ["(\\d{2})(\\d{4})", "$1 $2", ["219|31"], "0$1"], ["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["[23]1"], "0$1"], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["[236-9]"], "0$1"]], "0", 0, 0, 0, 0, 0, 0, 0, " int "], "RS": ["381", "00", "38[02-9]\\d{6,9}|6\\d{7,9}|90\\d{4,8}|38\\d{5,6}|(?:7\\d\\d|800)\\d{3,9}|(?:[12]\\d|3[0-79])\\d{5,10}", [6, 7, 8, 9, 10, 11, 12], [["(\\d{3})(\\d{3,9})", "$1 $2", ["(?:2[389]|39)0|[7-9]"], "0$1"], ["(\\d{2})(\\d{5,10})", "$1 $2", ["[1-36]"], "0$1"]], "0"], "RU": ["7", "810", "8\\d{13}|[347-9]\\d{9}", [10, 14], [["(\\d{4})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["7(?:1[0-8]|2[1-9])", "7(?:1(?:[0-356]2|4[29]|7|8[27])|2(?:1[23]|[2-9]2))", "7(?:1(?:[0-356]2|4[29]|7|8[27])|2(?:13[03-69]|62[013-9]))|72[1-57-9]2"], "8 ($1)", 1], ["(\\d{5})(\\d)(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["7(?:1[0-68]|2[1-9])", "7(?:1(?:[06][3-6]|[18]|2[35]|[3-5][3-5])|2(?:[13][3-5]|[24-689]|7[457]))", "7(?:1(?:0(?:[356]|4[023])|[18]|2(?:3[013-9]|5)|3[45]|43[013-79]|5(?:3[1-8]|4[1-7]|5)|6(?:3[0-35-9]|[4-6]))|2(?:1(?:3[178]|[45])|[24-689]|3[35]|7[457]))|7(?:14|23)4[0-8]|71(?:33|45)[1-79]"], "8 ($1)", 1], ["(\\d{3})(\\d{3})(\\d{4})", "$1 $2 $3", ["7"], "8 ($1)", 1], ["(\\d{3})(\\d{3})(\\d{2})(\\d{2})", "$1 $2-$3-$4", ["[349]|8(?:[02-7]|1[1-8])"], "8 ($1)", 1], ["(\\d{4})(\\d{4})(\\d{3})(\\d{3})", "$1 $2 $3 $4", ["8"], "8 ($1)"]], "8", 0, 0, 0, 0, 0, [["336(?:[013-9]\\d|2[013-9])\\d{5}|(?:3(?:0[12]|4[1-35-79]|5[1-3]|65|8[1-58]|9[0145])|4(?:01|1[1356]|2[13467]|7[1-5]|8[1-7]|9[1-689])|8(?:1[1-8]|2[01]|3[13-6]|4[0-8]|5[15-7]|6[0-35-79]|7[1-37-9]))\\d{7}", [10]], ["9\\d{9}", [10]], ["8(?:0[04]|108\\d{3})\\d{7}"], ["80[39]\\d{7}", [10]], ["808\\d{7}", [10]]], "8~10"], "RW": ["250", "00", "(?:06|[27]\\d\\d|[89]00)\\d{6}", [8, 9], [["(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["0"]], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["2"]], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["[7-9]"], "0$1"]], "0"], "SA": ["966", "00", "(?:[15]\\d|800|92)\\d{7}", [9, 10], [["(\\d{4})(\\d{5})", "$1 $2", ["9"]], ["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["1"], "0$1"], ["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["5"], "0$1"], ["(\\d{3})(\\d{3})(\\d{4})", "$1 $2 $3", ["8"]]], "0"], "SB": ["677", "0[01]", "[6-9]\\d{6}|[1-6]\\d{4}", [5, 7], [["(\\d{2})(\\d{5})", "$1 $2", ["6[89]|7|8[4-9]|9(?:[1-8]|9[0-8])"]]]], "SC": ["248", "010|0[0-2]", "(?:[2489]\\d|64)\\d{5}", [7], [["(\\d)(\\d{3})(\\d{3})", "$1 $2 $3", ["[246]|9[57]"]]], 0, 0, 0, 0, 0, 0, 0, "00"], "SD": ["249", "00", "[19]\\d{8}", [9], [["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["[19]"], "0$1"]], "0"], "SE": ["46", "00", "(?:[26]\\d\\d|9)\\d{9}|[1-9]\\d{8}|[1-689]\\d{7}|[1-4689]\\d{6}|2\\d{5}", [6, 7, 8, 9, 10, 12], [["(\\d{2})(\\d{2,3})(\\d{2})", "$1-$2 $3", ["20"], "0$1", 0, "$1 $2 $3"], ["(\\d{3})(\\d{4})", "$1-$2", ["9(?:00|39|44|9)"], "0$1", 0, "$1 $2"], ["(\\d{2})(\\d{3})(\\d{2})", "$1-$2 $3", ["[12][136]|3[356]|4[0246]|6[03]|90[1-9]"], "0$1", 0, "$1 $2 $3"], ["(\\d)(\\d{2,3})(\\d{2})(\\d{2})", "$1-$2 $3 $4", ["8"], "0$1", 0, "$1 $2 $3 $4"], ["(\\d{3})(\\d{2,3})(\\d{2})", "$1-$2 $3", ["1[2457]|2(?:[247-9]|5[0138])|3[0247-9]|4[1357-9]|5[0-35-9]|6(?:[125689]|4[02-57]|7[0-2])|9(?:[125-8]|3[02-5]|4[0-3])"], "0$1", 0, "$1 $2 $3"], ["(\\d{3})(\\d{2,3})(\\d{3})", "$1-$2 $3", ["9(?:00|39|44)"], "0$1", 0, "$1 $2 $3"], ["(\\d{2})(\\d{2,3})(\\d{2})(\\d{2})", "$1-$2 $3 $4", ["1[13689]|2[0136]|3[1356]|4[0246]|54|6[03]|90[1-9]"], "0$1", 0, "$1 $2 $3 $4"], ["(\\d{2})(\\d{3})(\\d{2})(\\d{2})", "$1-$2 $3 $4", ["10|7"], "0$1", 0, "$1 $2 $3 $4"], ["(\\d)(\\d{3})(\\d{3})(\\d{2})", "$1-$2 $3 $4", ["8"], "0$1", 0, "$1 $2 $3 $4"], ["(\\d{3})(\\d{2})(\\d{2})(\\d{2})", "$1-$2 $3 $4", ["[13-5]|2(?:[247-9]|5[0138])|6(?:[124-689]|7[0-2])|9(?:[125-8]|3[02-5]|4[0-3])"], "0$1", 0, "$1 $2 $3 $4"], ["(\\d{3})(\\d{2})(\\d{2})(\\d{3})", "$1-$2 $3 $4", ["9"], "0$1", 0, "$1 $2 $3 $4"], ["(\\d{3})(\\d{2})(\\d{3})(\\d{2})(\\d{2})", "$1-$2 $3 $4 $5", ["[26]"], "0$1", 0, "$1 $2 $3 $4 $5"]], "0"], "SG": ["65", "0[0-3]\\d", "(?:(?:1\\d|8)\\d\\d|7000)\\d{7}|[3689]\\d{7}", [8, 10, 11], [["(\\d{4})(\\d{4})", "$1 $2", ["[369]|8(?:0[1-9]|[1-9])"]], ["(\\d{3})(\\d{3})(\\d{4})", "$1 $2 $3", ["8"]], ["(\\d{4})(\\d{4})(\\d{3})", "$1 $2 $3", ["7"]], ["(\\d{4})(\\d{3})(\\d{4})", "$1 $2 $3", ["1"]]]], "SH": ["290", "00", "(?:[256]\\d|8)\\d{3}", [4, 5], 0, 0, 0, 0, 0, 0, "[256]"], "SI": ["386", "00|10(?:22|66|88|99)", "[1-7]\\d{7}|8\\d{4,7}|90\\d{4,6}", [5, 6, 7, 8], [["(\\d{2})(\\d{3,6})", "$1 $2", ["8[09]|9"], "0$1"], ["(\\d{3})(\\d{5})", "$1 $2", ["59|8"], "0$1"], ["(\\d{2})(\\d{3})(\\d{3})", "$1 $2 $3", ["[37][01]|4[0139]|51|6"], "0$1"], ["(\\d)(\\d{3})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[1-57]"], "(0$1)"]], "0", 0, 0, 0, 0, 0, 0, "00"], "SJ": ["47", "00", "0\\d{4}|(?:[489]\\d|79)\\d{6}", [5, 8], 0, 0, 0, 0, 0, 0, "79"], "SK": ["421", "00", "[2-689]\\d{8}|[2-59]\\d{6}|[2-5]\\d{5}", [6, 7, 9], [["(\\d)(\\d{2})(\\d{3,4})", "$1 $2 $3", ["21"], "0$1"], ["(\\d{2})(\\d{2})(\\d{2,3})", "$1 $2 $3", ["[3-5][1-8]1", "[3-5][1-8]1[67]"], "0$1"], ["(\\d)(\\d{3})(\\d{3})(\\d{2})", "$1/$2 $3 $4", ["2"], "0$1"], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["[689]"], "0$1"], ["(\\d{2})(\\d{3})(\\d{2})(\\d{2})", "$1/$2 $3 $4", ["[3-5]"], "0$1"]], "0"], "SL": ["232", "00", "(?:[237-9]\\d|66)\\d{6}", [8], [["(\\d{2})(\\d{6})", "$1 $2", ["[236-9]"], "(0$1)"]], "0"], "SM": ["378", "00", "(?:0549|[5-7]\\d)\\d{6}", [8, 10], [["(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[5-7]"]], ["(\\d{4})(\\d{6})", "$1 $2", ["0"]]], 0, 0, "([89]\\d{5})$", "0549$1"], "SN": ["221", "00", "(?:[378]\\d|93)\\d{7}", [9], [["(\\d{3})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["8"]], ["(\\d{2})(\\d{3})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[379]"]]]], "SO": ["252", "00", "[346-9]\\d{8}|[12679]\\d{7}|[1-5]\\d{6}|[1348]\\d{5}", [6, 7, 8, 9], [["(\\d{2})(\\d{4})", "$1 $2", ["8[125]"]], ["(\\d{6})", "$1", ["[134]"]], ["(\\d)(\\d{6})", "$1 $2", ["[15]|2[0-79]|3[0-46-8]|4[0-7]"]], ["(\\d)(\\d{7})", "$1 $2", ["(?:2|90)4|[67]"]], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["[348]|64|79|90"]], ["(\\d{2})(\\d{5,7})", "$1 $2", ["1|28|6[0-35-9]|7[67]|9[2-9]"]]], "0"], "SR": ["597", "00", "(?:[2-5]|[6-8]\\d|90)\\d{5}", [6, 7], [["(\\d{2})(\\d{2})(\\d{2})", "$1-$2-$3", ["56"]], ["(\\d{3})(\\d{3})", "$1-$2", ["[2-5]"]], ["(\\d{3})(\\d{4})", "$1-$2", ["[6-9]"]]]], "SS": ["211", "00", "[19]\\d{8}", [9], [["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["[19]"], "0$1"]], "0"], "ST": ["239", "00", "(?:22|9\\d)\\d{5}", [7], [["(\\d{3})(\\d{4})", "$1 $2", ["[29]"]]]], "SV": ["503", "00", "[267]\\d{7}|(?:80\\d|900)\\d{4}(?:\\d{4})?", [7, 8, 11], [["(\\d{3})(\\d{4})", "$1 $2", ["[89]"]], ["(\\d{4})(\\d{4})", "$1 $2", ["[267]"]], ["(\\d{3})(\\d{4})(\\d{4})", "$1 $2 $3", ["[89]"]]]], "SX": ["1", "011", "7215\\d{6}|(?:[58]\\d\\d|900)\\d{7}", [10], 0, "1", 0, "(5\\d{6})$|1", "721$1", 0, "721"], "SY": ["963", "00", "[1-359]\\d{8}|[1-5]\\d{7}", [8, 9], [["(\\d{2})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["[1-4]|5[1-3]"], "0$1", 1], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["[59]"], "0$1", 1]], "0"], "SZ": ["268", "00", "0800\\d{4}|(?:[237]\\d|900)\\d{6}", [8, 9], [["(\\d{4})(\\d{4})", "$1 $2", ["[0237]"]], ["(\\d{5})(\\d{4})", "$1 $2", ["9"]]]], "TA": ["290", "00", "8\\d{3}", [4], 0, 0, 0, 0, 0, 0, "8"], "TC": ["1", "011", "(?:[58]\\d\\d|649|900)\\d{7}", [10], 0, "1", 0, "([2-479]\\d{6})$|1", "649$1", 0, "649"], "TD": ["235", "00|16", "(?:22|30|[689]\\d|77)\\d{6}", [8], [["(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[236-9]"]]], 0, 0, 0, 0, 0, 0, 0, "00"], "TG": ["228", "00", "[279]\\d{7}", [8], [["(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[279]"]]]], "TH": ["66", "00[1-9]", "(?:001800|[2-57]|[689]\\d)\\d{7}|1\\d{7,9}", [8, 9, 10, 13], [["(\\d)(\\d{3})(\\d{4})", "$1 $2 $3", ["2"], "0$1"], ["(\\d{2})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["[13-9]"], "0$1"], ["(\\d{4})(\\d{3})(\\d{3})", "$1 $2 $3", ["1"]]], "0"], "TJ": ["992", "810", "[0-57-9]\\d{8}", [9], [["(\\d{6})(\\d)(\\d{2})", "$1 $2 $3", ["331", "3317"]], ["(\\d{3})(\\d{2})(\\d{4})", "$1 $2 $3", ["44[02-479]|[34]7"]], ["(\\d{4})(\\d)(\\d{4})", "$1 $2 $3", ["3(?:[1245]|3[12])"]], ["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["[0-57-9]"]]], 0, 0, 0, 0, 0, 0, 0, "8~10"], "TK": ["690", "00", "[2-47]\\d{3,6}", [4, 5, 6, 7]], "TL": ["670", "00", "7\\d{7}|(?:[2-47]\\d|[89]0)\\d{5}", [7, 8], [["(\\d{3})(\\d{4})", "$1 $2", ["[2-489]|70"]], ["(\\d{4})(\\d{4})", "$1 $2", ["7"]]]], "TM": ["993", "810", "(?:[1-6]\\d|71)\\d{6}", [8], [["(\\d{2})(\\d{2})(\\d{2})(\\d{2})", "$1 $2-$3-$4", ["12"], "(8 $1)"], ["(\\d{3})(\\d)(\\d{2})(\\d{2})", "$1 $2-$3-$4", ["[1-5]"], "(8 $1)"], ["(\\d{2})(\\d{6})", "$1 $2", ["[67]"], "8 $1"]], "8", 0, 0, 0, 0, 0, 0, "8~10"], "TN": ["216", "00", "[2-57-9]\\d{7}", [8], [["(\\d{2})(\\d{3})(\\d{3})", "$1 $2 $3", ["[2-57-9]"]]]], "TO": ["676", "00", "(?:0800|(?:[5-8]\\d\\d|999)\\d)\\d{3}|[2-8]\\d{4}", [5, 7], [["(\\d{2})(\\d{3})", "$1-$2", ["[2-4]|50|6[09]|7[0-24-69]|8[05]"]], ["(\\d{4})(\\d{3})", "$1 $2", ["0"]], ["(\\d{3})(\\d{4})", "$1 $2", ["[5-9]"]]]], "TR": ["90", "00", "4\\d{6}|8\\d{11,12}|(?:[2-58]\\d\\d|900)\\d{7}", [7, 10, 12, 13], [["(\\d{3})(\\d{3})(\\d{4})", "$1 $2 $3", ["512|8[01589]|90"], "0$1", 1], ["(\\d{3})(\\d{3})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["5(?:[0-59]|61)", "5(?:[0-59]|61[06])", "5(?:[0-59]|61[06]1)"], "0$1", 1], ["(\\d{3})(\\d{3})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[24][1-8]|3[1-9]"], "(0$1)", 1], ["(\\d{3})(\\d{3})(\\d{6,7})", "$1 $2 $3", ["80"], "0$1", 1]], "0"], "TT": ["1", "011", "(?:[58]\\d\\d|900)\\d{7}", [10], 0, "1", 0, "([2-46-8]\\d{6})$|1", "868$1", 0, "868"], "TV": ["688", "00", "(?:2|7\\d\\d|90)\\d{4}", [5, 6, 7], [["(\\d{2})(\\d{3})", "$1 $2", ["2"]], ["(\\d{2})(\\d{4})", "$1 $2", ["90"]], ["(\\d{2})(\\d{5})", "$1 $2", ["7"]]]], "TW": ["886", "0(?:0[25-79]|19)", "[2-689]\\d{8}|7\\d{9,10}|[2-8]\\d{7}|2\\d{6}", [7, 8, 9, 10, 11], [["(\\d{2})(\\d)(\\d{4})", "$1 $2 $3", ["202"], "0$1"], ["(\\d{2})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["[258]0"], "0$1"], ["(\\d)(\\d{3,4})(\\d{4})", "$1 $2 $3", ["[23568]|4(?:0[02-48]|[1-47-9])|7[1-9]", "[23568]|4(?:0[2-48]|[1-47-9])|(?:400|7)[1-9]"], "0$1"], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["[49]"], "0$1"], ["(\\d{2})(\\d{4})(\\d{4,5})", "$1 $2 $3", ["7"], "0$1"]], "0", 0, 0, 0, 0, 0, 0, 0, "#"], "TZ": ["255", "00[056]", "(?:[25-8]\\d|41|90)\\d{7}", [9], [["(\\d{3})(\\d{2})(\\d{4})", "$1 $2 $3", ["[89]"], "0$1"], ["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["[24]"], "0$1"], ["(\\d{2})(\\d{7})", "$1 $2", ["5"]], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["[67]"], "0$1"]], "0"], "UA": ["380", "00", "[89]\\d{9}|[3-9]\\d{8}", [9, 10], [["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["6[12][29]|(?:3[1-8]|4[136-8]|5[12457]|6[49])2|(?:56|65)[24]", "6[12][29]|(?:35|4[1378]|5[12457]|6[49])2|(?:56|65)[24]|(?:3[1-46-8]|46)2[013-9]"], "0$1"], ["(\\d{4})(\\d{5})", "$1 $2", ["3[1-8]|4(?:[1367]|[45][6-9]|8[4-6])|5(?:[1-5]|6[0135689]|7[4-6])|6(?:[12][3-7]|[459])", "3[1-8]|4(?:[1367]|[45][6-9]|8[4-6])|5(?:[1-5]|6(?:[015689]|3[02389])|7[4-6])|6(?:[12][3-7]|[459])"], "0$1"], ["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["[3-7]|89|9[1-9]"], "0$1"], ["(\\d{3})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["[89]"], "0$1"]], "0", 0, 0, 0, 0, 0, 0, "0~0"], "UG": ["256", "00[057]", "800\\d{6}|(?:[29]0|[347]\\d)\\d{7}", [9], [["(\\d{4})(\\d{5})", "$1 $2", ["202", "2024"], "0$1"], ["(\\d{3})(\\d{6})", "$1 $2", ["[27-9]|4(?:6[45]|[7-9])"], "0$1"], ["(\\d{2})(\\d{7})", "$1 $2", ["[34]"], "0$1"]], "0"], "US": ["1", "011", "[2-9]\\d{9}|3\\d{6}", [10], [["(\\d{3})(\\d{4})", "$1-$2", ["310"], 0, 1], ["(\\d{3})(\\d{3})(\\d{4})", "($1) $2-$3", ["[2-9]"], 0, 1, "$1-$2-$3"]], "1", 0, 0, 0, 0, 0, [["3052(?:0[0-8]|[1-9]\\d)\\d{4}|(?:2742|305[3-9])\\d{6}|(?:472|983)[2-47-9]\\d{6}|(?:2(?:0[1-35-9]|1[02-9]|2[03-57-9]|3[1459]|4[08]|5[1-46]|6[0279]|7[0269]|8[13])|3(?:0[1-47-9]|1[02-9]|2[013-79]|3[0-24679]|4[167]|5[0-2]|6[01349]|8[056])|4(?:0[124-9]|1[02-579]|2[3-5]|3[0245]|4[023578]|58|6[349]|7[0589]|8[04])|5(?:0[1-57-9]|1[0235-8]|20|3[0149]|4[01]|5[179]|6[1-47]|7[0-5]|8[0256])|6(?:0[1-35-9]|1[024-9]|2[03689]|3[016]|4[0156]|5[01679]|6[0-279]|78|8[0-269])|7(?:0[1-46-8]|1[2-9]|2[04-8]|3[0-247]|4[0378]|5[47]|6[02359]|7[0-59]|8[156])|8(?:0[1-68]|1[02-8]|2[0168]|3[0-2589]|4[03578]|5[046-9]|6[02-5]|7[028])|9(?:0[1346-9]|1[02-9]|2[0589]|3[0146-8]|4[01357-9]|5[12469]|7[0-3589]|8[04-69]))[2-9]\\d{6}"], [""], ["8(?:00|33|44|55|66|77|88)[2-9]\\d{6}"], ["900[2-9]\\d{6}"], ["52(?:3(?:[2-46-9][02-9]\\d|5(?:[02-46-9]\\d|5[0-46-9]))|4(?:[2-478][02-9]\\d|5(?:[034]\\d|2[024-9]|5[0-46-9])|6(?:0[1-9]|[2-9]\\d)|9(?:[05-9]\\d|2[0-5]|49)))\\d{4}|52[34][2-9]1[02-9]\\d{4}|5(?:00|2[125-9]|33|44|66|77|88)[2-9]\\d{6}"], 0, 0, 0, ["305209\\d{4}"]]], "UY": ["598", "0(?:0|1[3-9]\\d)", "0004\\d{2,9}|[1249]\\d{7}|2\\d{3,4}|(?:[49]\\d|80)\\d{5}", [4, 5, 6, 7, 8, 9, 10, 11, 12, 13], [["(\\d{4,5})", "$1", ["21"]], ["(\\d{3})(\\d{3,4})", "$1 $2", ["0"]], ["(\\d{3})(\\d{4})", "$1 $2", ["[49]0|8"], "0$1"], ["(\\d{2})(\\d{3})(\\d{3})", "$1 $2 $3", ["9"], "0$1"], ["(\\d{4})(\\d{4})", "$1 $2", ["[124]"]], ["(\\d{3})(\\d{3})(\\d{2,4})", "$1 $2 $3", ["0"]], ["(\\d{3})(\\d{3})(\\d{3})(\\d{2,4})", "$1 $2 $3 $4", ["0"]]], "0", 0, 0, 0, 0, 0, 0, "00", " int. "], "UZ": ["998", "00", "(?:20|33|[5-9]\\d)\\d{7}", [9], [["(\\d{2})(\\d{3})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["[235-9]"]]]], "VA": ["39", "00", "0\\d{5,10}|3[0-8]\\d{7,10}|55\\d{8}|8\\d{5}(?:\\d{2,4})?|(?:1\\d|39)\\d{7,8}", [6, 7, 8, 9, 10, 11, 12], 0, 0, 0, 0, 0, 0, "06698"], "VC": ["1", "011", "(?:[58]\\d\\d|784|900)\\d{7}", [10], 0, "1", 0, "([2-7]\\d{6})$|1", "784$1", 0, "784"], "VE": ["58", "00", "[68]00\\d{7}|(?:[24]\\d|[59]0)\\d{8}", [10], [["(\\d{3})(\\d{7})", "$1-$2", ["[24-689]"], "0$1"]], "0"], "VG": ["1", "011", "(?:284|[58]\\d\\d|900)\\d{7}", [10], 0, "1", 0, "([2-578]\\d{6})$|1", "284$1", 0, "284"], "VI": ["1", "011", "[58]\\d{9}|(?:34|90)0\\d{7}", [10], 0, "1", 0, "([2-9]\\d{6})$|1", "340$1", 0, "340"], "VN": ["84", "00", "[12]\\d{9}|[135-9]\\d{8}|[16]\\d{7}|[16-8]\\d{6}", [7, 8, 9, 10], [["(\\d{2})(\\d{5})", "$1 $2", ["80"], "0$1", 1], ["(\\d{4})(\\d{4,6})", "$1 $2", ["1"], 0, 1], ["(\\d{2})(\\d{3})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["6"], "0$1", 1], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["[357-9]"], "0$1", 1], ["(\\d{2})(\\d{4})(\\d{4})", "$1 $2 $3", ["2[48]"], "0$1", 1], ["(\\d{3})(\\d{4})(\\d{3})", "$1 $2 $3", ["2"], "0$1", 1]], "0"], "VU": ["678", "00", "[57-9]\\d{6}|(?:[238]\\d|48)\\d{3}", [5, 7], [["(\\d{3})(\\d{4})", "$1 $2", ["[57-9]"]]]], "WF": ["681", "00", "(?:40|72|8\\d{4})\\d{4}|[89]\\d{5}", [6, 9], [["(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3", ["[47-9]"]], ["(\\d{3})(\\d{2})(\\d{2})(\\d{2})", "$1 $2 $3 $4", ["8"]]]], "WS": ["685", "0", "(?:[2-6]|8\\d{5})\\d{4}|[78]\\d{6}|[68]\\d{5}", [5, 6, 7, 10], [["(\\d{5})", "$1", ["[2-5]|6[1-9]"]], ["(\\d{3})(\\d{3,7})", "$1 $2", ["[68]"]], ["(\\d{2})(\\d{5})", "$1 $2", ["7"]]]], "XK": ["383", "00", "2\\d{7,8}|3\\d{7,11}|(?:4\\d\\d|[89]00)\\d{5}", [8, 9, 10, 11, 12], [["(\\d{3})(\\d{5})", "$1 $2", ["[89]"], "0$1"], ["(\\d{2})(\\d{3})(\\d{3})", "$1 $2 $3", ["[2-4]"], "0$1"], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["2|39"], "0$1"], ["(\\d{2})(\\d{7,10})", "$1 $2", ["3"], "0$1"]], "0"], "YE": ["967", "00", "(?:1|7\\d)\\d{7}|[1-7]\\d{6}", [7, 8, 9], [["(\\d)(\\d{3})(\\d{3,4})", "$1 $2 $3", ["[1-6]|7(?:[24-6]|8[0-7])"], "0$1"], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["7"], "0$1"]], "0"], "YT": ["262", "00", "7093\\d{5}|(?:80|9\\d)\\d{7}|(?:26|63)9\\d{6}", [9], 0, "0", 0, 0, 0, 0, 0, [["269(?:0[0-467]|15|5[0-4]|6\\d|[78]0)\\d{4}"], ["(?:639(?:0[0-79]|1[019]|[267]\\d|3[09]|40|5[05-9]|9[04-79])|7093[5-7])\\d{4}"], ["80\\d{7}"], 0, 0, 0, 0, 0, ["9(?:(?:39|47)8[01]|769\\d)\\d{4}"]]], "ZA": ["27", "00", "[1-79]\\d{8}|8\\d{4,9}", [5, 6, 7, 8, 9, 10], [["(\\d{2})(\\d{3,4})", "$1 $2", ["8[1-4]"], "0$1"], ["(\\d{2})(\\d{3})(\\d{2,3})", "$1 $2 $3", ["8[1-4]"], "0$1"], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["860"], "0$1"], ["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["[1-9]"], "0$1"], ["(\\d{3})(\\d{3})(\\d{4})", "$1 $2 $3", ["8"], "0$1"]], "0"], "ZM": ["260", "00", "800\\d{6}|(?:21|[579]\\d|63)\\d{7}", [9], [["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["[28]"], "0$1"], ["(\\d{2})(\\d{7})", "$1 $2", ["[579]"], "0$1"]], "0"], "ZW": ["263", "00", "2(?:[0-57-9]\\d{6,8}|6[0-24-9]\\d{6,7})|[38]\\d{9}|[35-8]\\d{8}|[3-6]\\d{7}|[1-689]\\d{6}|[1-3569]\\d{5}|[1356]\\d{4}", [5, 6, 7, 8, 9, 10], [["(\\d{3})(\\d{3,5})", "$1 $2", ["2(?:0[45]|2[278]|[49]8)|3(?:[09]8|17)|6(?:[29]8|37|75)|[23][78]|(?:33|5[15]|6[68])[78]"], "0$1"], ["(\\d)(\\d{3})(\\d{2,4})", "$1 $2 $3", ["[49]"], "0$1"], ["(\\d{3})(\\d{4})", "$1 $2", ["80"], "0$1"], ["(\\d{2})(\\d{7})", "$1 $2", ["24|8[13-59]|(?:2[05-79]|39|5[45]|6[15-8])2", "2(?:02[014]|4|[56]20|[79]2)|392|5(?:42|525)|6(?:[16-8]21|52[013])|8[13-59]"], "(0$1)"], ["(\\d{2})(\\d{3})(\\d{4})", "$1 $2 $3", ["7"], "0$1"], ["(\\d{3})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["2(?:1[39]|2[0157]|[378]|[56][14])|3(?:12|29)", "2(?:1[39]|2[0157]|[378]|[56][14])|3(?:123|29)"], "0$1"], ["(\\d{4})(\\d{6})", "$1 $2", ["8"], "0$1"], ["(\\d{2})(\\d{3,5})", "$1 $2", ["1|2(?:0[0-36-9]|12|29|[56])|3(?:1[0-689]|[24-6])|5(?:[0236-9]|1[2-4])|6(?:[013-59]|7[0-46-9])|(?:33|55|6[68])[0-69]|(?:29|3[09]|62)[0-79]"], "0$1"], ["(\\d{2})(\\d{3})(\\d{3,4})", "$1 $2 $3", ["29[013-9]|39|54"], "0$1"], ["(\\d{4})(\\d{3,5})", "$1 $2", ["(?:25|54)8", "258|5483"], "0$1"]], "0"] }, "nonGeographic": { "800": ["800", 0, "(?:00|[1-9]\\d)\\d{6}", [8], [["(\\d{4})(\\d{4})", "$1 $2", ["\\d"]]], 0, 0, 0, 0, 0, 0, [0, 0, ["(?:00|[1-9]\\d)\\d{6}"]]], "808": ["808", 0, "[1-9]\\d{7}", [8], [["(\\d{4})(\\d{4})", "$1 $2", ["[1-9]"]]], 0, 0, 0, 0, 0, 0, [0, 0, 0, 0, 0, 0, 0, 0, 0, ["[1-9]\\d{7}"]]], "870": ["870", 0, "7\\d{11}|[235-7]\\d{8}", [9, 12], [["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["[235-7]"]]], 0, 0, 0, 0, 0, 0, [0, ["(?:[356]|774[45])\\d{8}|7[6-8]\\d{7}"], 0, 0, 0, 0, 0, 0, ["2\\d{8}", [9]]]], "878": ["878", 0, "10\\d{10}", [12], [["(\\d{2})(\\d{5})(\\d{5})", "$1 $2 $3", ["1"]]], 0, 0, 0, 0, 0, 0, [0, 0, 0, 0, 0, 0, 0, 0, ["10\\d{10}"]]], "881": ["881", 0, "6\\d{9}|[0-36-9]\\d{8}", [9, 10], [["(\\d)(\\d{3})(\\d{5})", "$1 $2 $3", ["[0-37-9]"]], ["(\\d)(\\d{3})(\\d{5,6})", "$1 $2 $3", ["6"]]], 0, 0, 0, 0, 0, 0, [0, ["6\\d{9}|[0-36-9]\\d{8}"]]], "882": ["882", 0, "[13]\\d{6}(?:\\d{2,5})?|[19]\\d{7}|(?:[25]\\d\\d|4)\\d{7}(?:\\d{2})?", [7, 8, 9, 10, 11, 12], [["(\\d{2})(\\d{5})", "$1 $2", ["16|342"]], ["(\\d{2})(\\d{6})", "$1 $2", ["49"]], ["(\\d{2})(\\d{2})(\\d{4})", "$1 $2 $3", ["1[36]|9"]], ["(\\d{2})(\\d{4})(\\d{3})", "$1 $2 $3", ["3[23]"]], ["(\\d{2})(\\d{3,4})(\\d{4})", "$1 $2 $3", ["16"]], ["(\\d{2})(\\d{4})(\\d{4})", "$1 $2 $3", ["10|23|3(?:[15]|4[57])|4|51"]], ["(\\d{3})(\\d{4})(\\d{4})", "$1 $2 $3", ["34"]], ["(\\d{2})(\\d{4,5})(\\d{5})", "$1 $2 $3", ["[1-35]"]]], 0, 0, 0, 0, 0, 0, [0, ["342\\d{4}|(?:337|49)\\d{6}|(?:3(?:2|47|7\\d{3})|50\\d{3})\\d{7}", [7, 8, 9, 10, 12]], 0, 0, 0, ["348[57]\\d{7}", [11]], 0, 0, ["1(?:3(?:0[0347]|[13][0139]|2[035]|4[013568]|6[0459]|7[06]|8[15-8]|9[0689])\\d{4}|6\\d{5,10})|(?:345\\d|9[89])\\d{6}|(?:10|2(?:3|85\\d)|3(?:[15]|[69]\\d\\d)|4[15-8]|51)\\d{8}"]]], "883": ["883", 0, "(?:[1-4]\\d|51)\\d{6,10}", [8, 9, 10, 11, 12], [["(\\d{3})(\\d{3})(\\d{2,8})", "$1 $2 $3", ["[14]|2[24-689]|3[02-689]|51[24-9]"]], ["(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3", ["510"]], ["(\\d{3})(\\d{3})(\\d{4})", "$1 $2 $3", ["21"]], ["(\\d{4})(\\d{4})(\\d{4})", "$1 $2 $3", ["51[13]"]], ["(\\d{3})(\\d{3})(\\d{3})(\\d{3})", "$1 $2 $3 $4", ["[235]"]]], 0, 0, 0, 0, 0, 0, [0, 0, 0, 0, 0, 0, 0, 0, ["(?:2(?:00\\d\\d|10)|(?:370[1-9]|51\\d0)\\d)\\d{7}|51(?:00\\d{5}|[24-9]0\\d{4,7})|(?:1[0-79]|2[24-689]|3[02-689]|4[0-4])0\\d{5,9}"]]], "888": ["888", 0, "\\d{11}", [11], [["(\\d{3})(\\d{3})(\\d{5})", "$1 $2 $3"]], 0, 0, 0, 0, 0, 0, [0, 0, 0, 0, 0, 0, ["\\d{11}"]]], "979": ["979", 0, "[1359]\\d{8}", [9], [["(\\d)(\\d{4})(\\d{4})", "$1 $2 $3", ["[1359]"]]], 0, 0, 0, 0, 0, 0, [0, 0, 0, ["[1359]\\d{8}"]]] } };

// node_modules/libphonenumber-js/min/exports/withMetadataArgument.js
function withMetadataArgument(func, _arguments) {
  var args = Array.prototype.slice.call(_arguments);
  args.push(metadata_min_json_default);
  return func.apply(this, args);
}

// node_modules/libphonenumber-js/es6/tools/semver-compare.js
function semver_compare_default(a, b) {
  a = a.split("-");
  b = b.split("-");
  var pa = a[0].split(".");
  var pb = b[0].split(".");
  for (var i = 0; i < 3; i++) {
    var na = Number(pa[i]);
    var nb = Number(pb[i]);
    if (na > nb) return 1;
    if (nb > na) return -1;
    if (!isNaN(na) && isNaN(nb)) return 1;
    if (isNaN(na) && !isNaN(nb)) return -1;
  }
  if (a[1] && b[1]) {
    return a[1] > b[1] ? 1 : a[1] < b[1] ? -1 : 0;
  }
  return !a[1] && b[1] ? 1 : a[1] && !b[1] ? -1 : 0;
}

// node_modules/libphonenumber-js/es6/helpers/isObject.js
var objectConstructor = {}.constructor;
function isObject(object) {
  return object !== void 0 && object !== null && object.constructor === objectConstructor;
}

// node_modules/libphonenumber-js/es6/metadata.js
function _typeof(o) {
  "@babel/helpers - typeof";
  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof(o);
}
function _classCallCheck(a, n) {
  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
}
function _defineProperties(e, r) {
  for (var t = 0; t < r.length; t++) {
    var o = r[t];
    o.enumerable = o.enumerable || false, o.configurable = true, "value" in o && (o.writable = true), Object.defineProperty(e, _toPropertyKey(o.key), o);
  }
}
function _createClass(e, r, t) {
  return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: false }), e;
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : i + "";
}
function _toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
var V3 = "1.2.0";
var V4 = "1.7.35";
var DEFAULT_EXT_PREFIX = " ext. ";
var CALLING_CODE_REG_EXP = /^\d+$/;
var Metadata = /* @__PURE__ */ (function() {
  function Metadata2(metadata) {
    _classCallCheck(this, Metadata2);
    validateMetadata(metadata);
    this.metadata = metadata;
    setVersion.call(this, metadata);
  }
  return _createClass(Metadata2, [{
    key: "getCountries",
    value: function getCountries() {
      return Object.keys(this.metadata.countries).filter(function(_) {
        return _ !== "001";
      });
    }
  }, {
    key: "getCountryMetadata",
    value: function getCountryMetadata(countryCode) {
      return this.metadata.countries[countryCode];
    }
  }, {
    key: "nonGeographic",
    value: function nonGeographic() {
      if (this.v1 || this.v2 || this.v3) return;
      return this.metadata.nonGeographic || this.metadata.nonGeographical;
    }
  }, {
    key: "hasCountry",
    value: function hasCountry(country) {
      return this.getCountryMetadata(country) !== void 0;
    }
  }, {
    key: "hasCallingCode",
    value: function hasCallingCode(callingCode) {
      if (this.getCountryCodesForCallingCode(callingCode)) {
        return true;
      }
      if (this.nonGeographic()) {
        if (this.nonGeographic()[callingCode]) {
          return true;
        }
      } else {
        var countryCodes = this.countryCallingCodes()[callingCode];
        if (countryCodes && countryCodes.length === 1 && countryCodes[0] === "001") {
          return true;
        }
      }
    }
  }, {
    key: "isNonGeographicCallingCode",
    value: function isNonGeographicCallingCode(callingCode) {
      if (this.nonGeographic()) {
        return this.nonGeographic()[callingCode] ? true : false;
      } else {
        return this.getCountryCodesForCallingCode(callingCode) ? false : true;
      }
    }
    // Deprecated.
  }, {
    key: "country",
    value: function country(countryCode) {
      return this.selectNumberingPlan(countryCode);
    }
  }, {
    key: "selectNumberingPlan",
    value: function selectNumberingPlan(countryCode, callingCode) {
      if (countryCode && CALLING_CODE_REG_EXP.test(countryCode)) {
        callingCode = countryCode;
        countryCode = null;
      }
      if (countryCode && countryCode !== "001") {
        if (!this.hasCountry(countryCode)) {
          throw new Error("Unknown country: ".concat(countryCode));
        }
        this.numberingPlan = new NumberingPlan(this.getCountryMetadata(countryCode), this);
      } else if (callingCode) {
        if (!this.hasCallingCode(callingCode)) {
          throw new Error("Unknown calling code: ".concat(callingCode));
        }
        this.numberingPlan = new NumberingPlan(this.getNumberingPlanMetadata(callingCode), this);
      } else {
        this.numberingPlan = void 0;
      }
      return this;
    }
  }, {
    key: "getCountryCodesForCallingCode",
    value: function getCountryCodesForCallingCode(callingCode) {
      var countryCodes = this.countryCallingCodes()[callingCode];
      if (countryCodes) {
        if (countryCodes.length === 1 && countryCodes[0].length === 3) {
          return;
        }
        return countryCodes;
      }
    }
  }, {
    key: "getCountryCodeForCallingCode",
    value: function getCountryCodeForCallingCode(callingCode) {
      var countryCodes = this.getCountryCodesForCallingCode(callingCode);
      if (countryCodes) {
        return countryCodes[0];
      }
    }
  }, {
    key: "getNumberingPlanMetadata",
    value: function getNumberingPlanMetadata(callingCode) {
      var countryCode = this.getCountryCodeForCallingCode(callingCode);
      if (countryCode) {
        return this.getCountryMetadata(countryCode);
      }
      if (this.nonGeographic()) {
        var metadata = this.nonGeographic()[callingCode];
        if (metadata) {
          return metadata;
        }
      } else {
        var countryCodes = this.countryCallingCodes()[callingCode];
        if (countryCodes && countryCodes.length === 1 && countryCodes[0] === "001") {
          return this.metadata.countries["001"];
        }
      }
    }
    // Deprecated.
  }, {
    key: "countryCallingCode",
    value: function countryCallingCode() {
      return this.numberingPlan.callingCode();
    }
    // Deprecated.
  }, {
    key: "IDDPrefix",
    value: function IDDPrefix() {
      return this.numberingPlan.IDDPrefix();
    }
    // Deprecated.
  }, {
    key: "defaultIDDPrefix",
    value: function defaultIDDPrefix() {
      return this.numberingPlan.defaultIDDPrefix();
    }
    // Deprecated.
  }, {
    key: "nationalNumberPattern",
    value: function nationalNumberPattern() {
      return this.numberingPlan.nationalNumberPattern();
    }
    // Deprecated.
  }, {
    key: "possibleLengths",
    value: function possibleLengths() {
      return this.numberingPlan.possibleLengths();
    }
    // Deprecated.
  }, {
    key: "formats",
    value: function formats() {
      return this.numberingPlan.formats();
    }
    // Deprecated.
  }, {
    key: "nationalPrefixForParsing",
    value: function nationalPrefixForParsing() {
      return this.numberingPlan.nationalPrefixForParsing();
    }
    // Deprecated.
  }, {
    key: "nationalPrefixTransformRule",
    value: function nationalPrefixTransformRule() {
      return this.numberingPlan.nationalPrefixTransformRule();
    }
    // Deprecated.
  }, {
    key: "leadingDigits",
    value: function leadingDigits() {
      return this.numberingPlan.leadingDigits();
    }
    // Deprecated.
  }, {
    key: "hasTypes",
    value: function hasTypes() {
      return this.numberingPlan.hasTypes();
    }
    // Deprecated.
  }, {
    key: "type",
    value: function type(_type) {
      return this.numberingPlan.type(_type);
    }
    // Deprecated.
  }, {
    key: "ext",
    value: function ext() {
      return this.numberingPlan.ext();
    }
  }, {
    key: "countryCallingCodes",
    value: function countryCallingCodes() {
      if (this.v1) return this.metadata.country_phone_code_to_countries;
      return this.metadata.country_calling_codes;
    }
    // Deprecated.
  }, {
    key: "chooseCountryByCountryCallingCode",
    value: function chooseCountryByCountryCallingCode(callingCode) {
      return this.selectNumberingPlan(callingCode);
    }
  }, {
    key: "hasSelectedNumberingPlan",
    value: function hasSelectedNumberingPlan() {
      return this.numberingPlan !== void 0;
    }
  }]);
})();
var NumberingPlan = /* @__PURE__ */ (function() {
  function NumberingPlan2(metadata, globalMetadataObject) {
    _classCallCheck(this, NumberingPlan2);
    this.globalMetadataObject = globalMetadataObject;
    this.metadata = metadata;
    setVersion.call(this, globalMetadataObject.metadata);
  }
  return _createClass(NumberingPlan2, [{
    key: "callingCode",
    value: function callingCode() {
      return this.metadata[0];
    }
    // Formatting information for regions which share
    // a country calling code is contained by only one region
    // for performance reasons. For example, for NANPA region
    // ("North American Numbering Plan Administration",
    //  which includes USA, Canada, Cayman Islands, Bahamas, etc)
    // it will be contained in the metadata for `US`.
  }, {
    key: "getDefaultCountryMetadataForRegion",
    value: function getDefaultCountryMetadataForRegion() {
      return this.globalMetadataObject.getNumberingPlanMetadata(this.callingCode());
    }
    // Is always present.
  }, {
    key: "IDDPrefix",
    value: function IDDPrefix() {
      if (this.v1 || this.v2) return;
      return this.metadata[1];
    }
    // Is only present when a country supports multiple IDD prefixes.
  }, {
    key: "defaultIDDPrefix",
    value: function defaultIDDPrefix() {
      if (this.v1 || this.v2) return;
      return this.metadata[12];
    }
  }, {
    key: "nationalNumberPattern",
    value: function nationalNumberPattern() {
      if (this.v1 || this.v2) return this.metadata[1];
      return this.metadata[2];
    }
    // "possible length" data is always present in Google's metadata.
  }, {
    key: "possibleLengths",
    value: function possibleLengths() {
      if (this.v1) return;
      return this.metadata[this.v2 ? 2 : 3];
    }
  }, {
    key: "_getFormats",
    value: function _getFormats(metadata) {
      return metadata[this.v1 ? 2 : this.v2 ? 3 : 4];
    }
    // For countries of the same region (e.g. NANPA)
    // formats are all stored in the "main" country for that region.
    // E.g. "RU" and "KZ", "US" and "CA".
  }, {
    key: "formats",
    value: function formats() {
      var _this = this;
      var formats2 = this._getFormats(this.metadata) || this._getFormats(this.getDefaultCountryMetadataForRegion()) || [];
      return formats2.map(function(_) {
        return new Format(_, _this);
      });
    }
  }, {
    key: "nationalPrefix",
    value: function nationalPrefix() {
      return this.metadata[this.v1 ? 3 : this.v2 ? 4 : 5];
    }
  }, {
    key: "_getNationalPrefixFormattingRule",
    value: function _getNationalPrefixFormattingRule(metadata) {
      return metadata[this.v1 ? 4 : this.v2 ? 5 : 6];
    }
    // For countries of the same region (e.g. NANPA)
    // national prefix formatting rule is stored in the "main" country for that region.
    // E.g. "RU" and "KZ", "US" and "CA".
  }, {
    key: "nationalPrefixFormattingRule",
    value: function nationalPrefixFormattingRule() {
      return this._getNationalPrefixFormattingRule(this.metadata) || this._getNationalPrefixFormattingRule(this.getDefaultCountryMetadataForRegion());
    }
  }, {
    key: "_nationalPrefixForParsing",
    value: function _nationalPrefixForParsing() {
      return this.metadata[this.v1 ? 5 : this.v2 ? 6 : 7];
    }
  }, {
    key: "nationalPrefixForParsing",
    value: function nationalPrefixForParsing() {
      return this._nationalPrefixForParsing() || this.nationalPrefix();
    }
  }, {
    key: "nationalPrefixTransformRule",
    value: function nationalPrefixTransformRule() {
      return this.metadata[this.v1 ? 6 : this.v2 ? 7 : 8];
    }
  }, {
    key: "_getNationalPrefixIsOptionalWhenFormatting",
    value: function _getNationalPrefixIsOptionalWhenFormatting() {
      return !!this.metadata[this.v1 ? 7 : this.v2 ? 8 : 9];
    }
    // For countries of the same region (e.g. NANPA)
    // "national prefix is optional when formatting" flag is
    // stored in the "main" country for that region.
    // E.g. "RU" and "KZ", "US" and "CA".
  }, {
    key: "nationalPrefixIsOptionalWhenFormattingInNationalFormat",
    value: function nationalPrefixIsOptionalWhenFormattingInNationalFormat() {
      return this._getNationalPrefixIsOptionalWhenFormatting(this.metadata) || this._getNationalPrefixIsOptionalWhenFormatting(this.getDefaultCountryMetadataForRegion());
    }
  }, {
    key: "leadingDigits",
    value: function leadingDigits() {
      return this.metadata[this.v1 ? 8 : this.v2 ? 9 : 10];
    }
  }, {
    key: "types",
    value: function types() {
      return this.metadata[this.v1 ? 9 : this.v2 ? 10 : 11];
    }
  }, {
    key: "hasTypes",
    value: function hasTypes() {
      if (this.types() && this.types().length === 0) {
        return false;
      }
      return !!this.types();
    }
  }, {
    key: "type",
    value: function type(_type2) {
      if (this.hasTypes() && getType(this.types(), _type2)) {
        return new Type(getType(this.types(), _type2), this);
      }
    }
  }, {
    key: "ext",
    value: function ext() {
      if (this.v1 || this.v2) return DEFAULT_EXT_PREFIX;
      return this.metadata[13] || DEFAULT_EXT_PREFIX;
    }
  }]);
})();
var Format = /* @__PURE__ */ (function() {
  function Format2(format, metadata) {
    _classCallCheck(this, Format2);
    this._format = format;
    this.metadata = metadata;
  }
  return _createClass(Format2, [{
    key: "pattern",
    value: function pattern() {
      return this._format[0];
    }
  }, {
    key: "format",
    value: function format() {
      return this._format[1];
    }
  }, {
    key: "leadingDigitsPatterns",
    value: function leadingDigitsPatterns() {
      return this._format[2] || [];
    }
  }, {
    key: "nationalPrefixFormattingRule",
    value: function nationalPrefixFormattingRule() {
      return this._format[3] || this.metadata.nationalPrefixFormattingRule();
    }
  }, {
    key: "nationalPrefixIsOptionalWhenFormattingInNationalFormat",
    value: function nationalPrefixIsOptionalWhenFormattingInNationalFormat() {
      return !!this._format[4] || this.metadata.nationalPrefixIsOptionalWhenFormattingInNationalFormat();
    }
  }, {
    key: "nationalPrefixIsMandatoryWhenFormattingInNationalFormat",
    value: function nationalPrefixIsMandatoryWhenFormattingInNationalFormat() {
      return this.usesNationalPrefix() && !this.nationalPrefixIsOptionalWhenFormattingInNationalFormat();
    }
    // Checks whether national prefix formatting rule contains national prefix.
  }, {
    key: "usesNationalPrefix",
    value: function usesNationalPrefix() {
      return this.nationalPrefixFormattingRule() && // Check that national prefix formatting rule is not a "dummy" one.
      !FIRST_GROUP_ONLY_PREFIX_PATTERN.test(this.nationalPrefixFormattingRule()) ? true : false;
    }
  }, {
    key: "internationalFormat",
    value: function internationalFormat() {
      return this._format[5] || this.format();
    }
  }]);
})();
var FIRST_GROUP_ONLY_PREFIX_PATTERN = /^\(?\$1\)?$/;
var Type = /* @__PURE__ */ (function() {
  function Type2(type, metadata) {
    _classCallCheck(this, Type2);
    this.type = type;
    this.metadata = metadata;
  }
  return _createClass(Type2, [{
    key: "pattern",
    value: function pattern() {
      if (this.metadata.v1) return this.type;
      return this.type[0];
    }
  }, {
    key: "possibleLengths",
    value: function possibleLengths() {
      if (this.metadata.v1) return;
      return this.type[1] || this.metadata.possibleLengths();
    }
  }]);
})();
function getType(types, type) {
  switch (type) {
    case "FIXED_LINE":
      return types[0];
    case "MOBILE":
      return types[1];
    case "TOLL_FREE":
      return types[2];
    case "PREMIUM_RATE":
      return types[3];
    case "PERSONAL_NUMBER":
      return types[4];
    case "VOICEMAIL":
      return types[5];
    case "UAN":
      return types[6];
    case "PAGER":
      return types[7];
    case "VOIP":
      return types[8];
    case "SHARED_COST":
      return types[9];
  }
}
function validateMetadata(metadata) {
  if (!metadata) {
    throw new Error("[libphonenumber-js] `metadata` argument not passed. Check your arguments.");
  }
  if (!isObject(metadata) || !isObject(metadata.countries)) {
    throw new Error("[libphonenumber-js] `metadata` argument was passed but it's not a valid metadata. Must be an object having `.countries` child object property. Got ".concat(isObject(metadata) ? "an object of shape: { " + Object.keys(metadata).join(", ") + " }" : "a " + typeOf(metadata) + ": " + metadata, "."));
  }
}
var typeOf = function typeOf2(_) {
  return _typeof(_);
};
function getCountryCallingCode(country, metadata) {
  metadata = new Metadata(metadata);
  if (metadata.hasCountry(country)) {
    return metadata.selectNumberingPlan(country).countryCallingCode();
  }
  throw new Error("Unknown country: ".concat(country));
}
function isSupportedCountry(country, metadata) {
  return metadata.countries.hasOwnProperty(country);
}
function setVersion(metadata) {
  var version = metadata.version;
  if (typeof version === "number") {
    this.v1 = version === 1;
    this.v2 = version === 2;
    this.v3 = version === 3;
    this.v4 = version === 4;
  } else {
    if (!version) {
      this.v1 = true;
    } else if (semver_compare_default(version, V3) === -1) {
      this.v2 = true;
    } else if (semver_compare_default(version, V4) === -1) {
      this.v3 = true;
    } else {
      this.v4 = true;
    }
  }
}

// node_modules/libphonenumber-js/es6/helpers/mergeArrays.js
function _createForOfIteratorHelperLoose(r, e) {
  var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (t) return (t = t.call(r)).next.bind(t);
  if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {
    t && (r = t);
    var o = 0;
    return function() {
      return o >= r.length ? { done: true } : { done: false, value: r[o++] };
    };
  }
  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}
function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function mergeArrays(a, b) {
  var merged = a.slice();
  for (var _iterator = _createForOfIteratorHelperLoose(b), _step; !(_step = _iterator()).done; ) {
    var element = _step.value;
    if (a.indexOf(element) < 0) {
      merged.push(element);
    }
  }
  return merged.sort(function(a2, b2) {
    return a2 - b2;
  });
}

// node_modules/libphonenumber-js/es6/helpers/checkNumberLength.js
function checkNumberLength(nationalNumber, country, metadata) {
  return checkNumberLengthForType(nationalNumber, country, void 0, metadata);
}
function checkNumberLengthForType(nationalNumber, country, type, metadata) {
  if (country) {
    metadata = new Metadata(metadata.metadata);
    metadata.selectNumberingPlan(country);
  }
  var type_info = metadata.type(type);
  var possible_lengths = type_info && type_info.possibleLengths() || metadata.possibleLengths();
  if (!possible_lengths) {
    return "IS_POSSIBLE";
  }
  if (type === "FIXED_LINE_OR_MOBILE") {
    if (!metadata.type("FIXED_LINE")) {
      return checkNumberLengthForType(nationalNumber, country, "MOBILE", metadata);
    }
    var mobile_type = metadata.type("MOBILE");
    if (mobile_type) {
      possible_lengths = mergeArrays(possible_lengths, mobile_type.possibleLengths());
    }
  } else if (type && !type_info) {
    return "INVALID_LENGTH";
  }
  var actual_length = nationalNumber.length;
  var minimum_length = possible_lengths[0];
  if (minimum_length === actual_length) {
    return "IS_POSSIBLE";
  }
  if (minimum_length > actual_length) {
    return "TOO_SHORT";
  }
  if (possible_lengths[possible_lengths.length - 1] < actual_length) {
    return "TOO_LONG";
  }
  return possible_lengths.indexOf(actual_length, 1) >= 0 ? "IS_POSSIBLE" : "INVALID_LENGTH";
}

// node_modules/libphonenumber-js/es6/isPossible.js
function isPossiblePhoneNumber(input, options, metadata) {
  if (options === void 0) {
    options = {};
  }
  metadata = new Metadata(metadata);
  if (options.v2) {
    if (!input.countryCallingCode) {
      throw new Error("Invalid phone number object passed");
    }
    metadata.selectNumberingPlan(input.countryCallingCode);
  } else {
    if (!input.phone) {
      return false;
    }
    if (input.country) {
      if (!metadata.hasCountry(input.country)) {
        throw new Error("Unknown country: ".concat(input.country));
      }
      metadata.selectNumberingPlan(input.country);
    } else {
      if (!input.countryCallingCode) {
        throw new Error("Invalid phone number object passed");
      }
      metadata.selectNumberingPlan(input.countryCallingCode);
    }
  }
  if (metadata.possibleLengths()) {
    return isPossibleNumber(input.phone || input.nationalNumber, input.country, metadata);
  } else {
    if (input.countryCallingCode && metadata.isNonGeographicCallingCode(input.countryCallingCode)) {
      return true;
    } else {
      throw new Error('Missing "possibleLengths" in metadata. Perhaps the metadata has been generated before v1.0.18.');
    }
  }
}
function isPossibleNumber(nationalNumber, country, metadata) {
  switch (checkNumberLength(nationalNumber, country, metadata)) {
    case "IS_POSSIBLE":
      return true;
    // This library ignores "local-only" phone numbers (for simplicity).
    // See the readme for more info on what are "local-only" phone numbers.
    // case 'IS_POSSIBLE_LOCAL_ONLY':
    // 	return !isInternational
    default:
      return false;
  }
}

// node_modules/libphonenumber-js/es6/helpers/matchesEntirely.js
function matchesEntirely(text2, regularExpressionText) {
  text2 = text2 || "";
  return new RegExp("^(?:" + regularExpressionText + ")$").test(text2);
}

// node_modules/libphonenumber-js/es6/helpers/getNumberType.js
function _createForOfIteratorHelperLoose2(r, e) {
  var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (t) return (t = t.call(r)).next.bind(t);
  if (Array.isArray(r) || (t = _unsupportedIterableToArray2(r)) || e && r && "number" == typeof r.length) {
    t && (r = t);
    var o = 0;
    return function() {
      return o >= r.length ? { done: true } : { done: false, value: r[o++] };
    };
  }
  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray2(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray2(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray2(r, a) : void 0;
  }
}
function _arrayLikeToArray2(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
var NON_FIXED_LINE_PHONE_TYPES = ["MOBILE", "PREMIUM_RATE", "TOLL_FREE", "SHARED_COST", "VOIP", "PERSONAL_NUMBER", "PAGER", "UAN", "VOICEMAIL"];
function getNumberType(input, options, metadata) {
  options = options || {};
  if (!input.country && !input.countryCallingCode) {
    return;
  }
  metadata = new Metadata(metadata);
  metadata.selectNumberingPlan(input.country, input.countryCallingCode);
  var nationalNumber = options.v2 ? input.nationalNumber : input.phone;
  if (!matchesEntirely(nationalNumber, metadata.nationalNumberPattern())) {
    return;
  }
  if (isNumberTypeEqualTo(nationalNumber, "FIXED_LINE", metadata)) {
    if (metadata.type("MOBILE") && metadata.type("MOBILE").pattern() === "") {
      return "FIXED_LINE_OR_MOBILE";
    }
    if (!metadata.type("MOBILE")) {
      return "FIXED_LINE_OR_MOBILE";
    }
    if (isNumberTypeEqualTo(nationalNumber, "MOBILE", metadata)) {
      return "FIXED_LINE_OR_MOBILE";
    }
    return "FIXED_LINE";
  }
  for (var _iterator = _createForOfIteratorHelperLoose2(NON_FIXED_LINE_PHONE_TYPES), _step; !(_step = _iterator()).done; ) {
    var type = _step.value;
    if (isNumberTypeEqualTo(nationalNumber, type, metadata)) {
      return type;
    }
  }
}
function isNumberTypeEqualTo(nationalNumber, type, metadata) {
  type = metadata.type(type);
  if (!type || !type.pattern()) {
    return false;
  }
  if (type.possibleLengths() && type.possibleLengths().indexOf(nationalNumber.length) < 0) {
    return false;
  }
  return matchesEntirely(nationalNumber, type.pattern());
}

// node_modules/libphonenumber-js/es6/isValid.js
function isValidNumber(input, options, metadata) {
  options = options || {};
  metadata = new Metadata(metadata);
  metadata.selectNumberingPlan(input.country, input.countryCallingCode);
  if (metadata.hasTypes()) {
    return getNumberType(input, options, metadata.metadata) !== void 0;
  }
  var nationalNumber = options.v2 ? input.nationalNumber : input.phone;
  return matchesEntirely(nationalNumber, metadata.nationalNumberPattern());
}

// node_modules/libphonenumber-js/es6/helpers/getPossibleCountriesForNumber.js
function getPossibleCountriesForNumber(callingCode, nationalNumber, metadata) {
  var _metadata = new Metadata(metadata);
  var possibleCountries = _metadata.getCountryCodesForCallingCode(callingCode);
  if (!possibleCountries) {
    return [];
  }
  return possibleCountries.filter(function(country) {
    return couldNationalNumberBelongToCountry(nationalNumber, country, metadata);
  });
}
function couldNationalNumberBelongToCountry(nationalNumber, country, metadata) {
  var _metadata = new Metadata(metadata);
  _metadata.selectNumberingPlan(country);
  if (_metadata.numberingPlan.possibleLengths().indexOf(nationalNumber.length) >= 0) {
    return true;
  }
  return false;
}

// node_modules/libphonenumber-js/es6/constants.js
var MIN_LENGTH_FOR_NSN = 2;
var MAX_LENGTH_FOR_NSN = 17;
var MAX_LENGTH_COUNTRY_CODE = 3;
var VALID_DIGITS = "0-9\uFF10-\uFF19\u0660-\u0669\u06F0-\u06F9";
var DASHES = "-\u2010-\u2015\u2212\u30FC\uFF0D";
var SLASHES = "\uFF0F/";
var DOTS = "\uFF0E.";
var WHITESPACE = " \xA0\xAD\u200B\u2060\u3000";
var BRACKETS = "()\uFF08\uFF09\uFF3B\uFF3D\\[\\]";
var TILDES = "~\u2053\u223C\uFF5E";
var VALID_PUNCTUATION = "".concat(DASHES).concat(SLASHES).concat(DOTS).concat(WHITESPACE).concat(BRACKETS).concat(TILDES);
var PLUS_CHARS = "+\uFF0B";

// node_modules/libphonenumber-js/es6/helpers/stripIddPrefix.js
var CAPTURING_DIGIT_PATTERN = new RegExp("([" + VALID_DIGITS + "])");
function stripIddPrefix(number, country, callingCode, metadata) {
  if (!country) {
    return;
  }
  var countryMetadata = new Metadata(metadata);
  countryMetadata.selectNumberingPlan(country, callingCode);
  var IDDPrefixPattern = new RegExp(countryMetadata.IDDPrefix());
  if (number.search(IDDPrefixPattern) !== 0) {
    return;
  }
  number = number.slice(number.match(IDDPrefixPattern)[0].length);
  var matchedGroups = number.match(CAPTURING_DIGIT_PATTERN);
  if (matchedGroups && matchedGroups[1] != null && matchedGroups[1].length > 0) {
    if (matchedGroups[1] === "0") {
      return;
    }
  }
  return number;
}

// node_modules/libphonenumber-js/es6/helpers/extractNationalNumberFromPossiblyIncompleteNumber.js
function extractNationalNumberFromPossiblyIncompleteNumber(number, metadata) {
  if (number && metadata.numberingPlan.nationalPrefixForParsing()) {
    var prefixPattern = new RegExp("^(?:" + metadata.numberingPlan.nationalPrefixForParsing() + ")");
    var prefixMatch = prefixPattern.exec(number);
    if (prefixMatch) {
      var nationalNumber;
      var carrierCode;
      var capturedGroupsCount = prefixMatch.length - 1;
      var hasCapturedGroups = capturedGroupsCount > 0 && prefixMatch[capturedGroupsCount];
      if (metadata.nationalPrefixTransformRule() && hasCapturedGroups) {
        nationalNumber = number.replace(prefixPattern, metadata.nationalPrefixTransformRule());
        if (capturedGroupsCount > 1) {
          carrierCode = prefixMatch[1];
        }
      } else {
        var prefixBeforeNationalNumber = prefixMatch[0];
        nationalNumber = number.slice(prefixBeforeNationalNumber.length);
        if (hasCapturedGroups) {
          carrierCode = prefixMatch[1];
        }
      }
      var nationalPrefix;
      if (hasCapturedGroups) {
        var possiblePositionOfTheFirstCapturedGroup = number.indexOf(prefixMatch[1]);
        var possibleNationalPrefix = number.slice(0, possiblePositionOfTheFirstCapturedGroup);
        if (possibleNationalPrefix === metadata.numberingPlan.nationalPrefix()) {
          nationalPrefix = metadata.numberingPlan.nationalPrefix();
        }
      } else {
        nationalPrefix = prefixMatch[0];
      }
      return {
        nationalNumber,
        nationalPrefix,
        carrierCode
      };
    }
  }
  return {
    nationalNumber: number
  };
}

// node_modules/libphonenumber-js/es6/helpers/getCountryByNationalNumber.js
function _createForOfIteratorHelperLoose3(r, e) {
  var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (t) return (t = t.call(r)).next.bind(t);
  if (Array.isArray(r) || (t = _unsupportedIterableToArray3(r)) || e && r && "number" == typeof r.length) {
    t && (r = t);
    var o = 0;
    return function() {
      return o >= r.length ? { done: true } : { done: false, value: r[o++] };
    };
  }
  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray3(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray3(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray3(r, a) : void 0;
  }
}
function _arrayLikeToArray3(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function getCountryByNationalNumber(nationalPhoneNumber, _ref) {
  var countries = _ref.countries, metadata = _ref.metadata;
  metadata = new Metadata(metadata);
  for (var _iterator = _createForOfIteratorHelperLoose3(countries), _step; !(_step = _iterator()).done; ) {
    var country = _step.value;
    metadata.selectNumberingPlan(country);
    if (metadata.leadingDigits()) {
      if (nationalPhoneNumber && nationalPhoneNumber.search(metadata.leadingDigits()) === 0) {
        return country;
      }
    } else if (getNumberType({
      phone: nationalPhoneNumber,
      country
    }, void 0, metadata.metadata)) {
      return country;
    }
  }
}

// node_modules/libphonenumber-js/es6/helpers/getCountryByCallingCode.js
var USE_NON_GEOGRAPHIC_COUNTRY_CODE = false;
function getCountryByCallingCode(callingCode, _ref) {
  var nationalPhoneNumber = _ref.nationalNumber, metadata = _ref.metadata;
  if (USE_NON_GEOGRAPHIC_COUNTRY_CODE) {
    if (metadata.isNonGeographicCallingCode(callingCode)) {
      return "001";
    }
  }
  var possibleCountries = metadata.getCountryCodesForCallingCode(callingCode);
  if (!possibleCountries) {
    return;
  }
  if (possibleCountries.length === 1) {
    return possibleCountries[0];
  }
  return getCountryByNationalNumber(nationalPhoneNumber, {
    countries: possibleCountries,
    metadata: metadata.metadata
  });
}

// node_modules/libphonenumber-js/es6/helpers/extractNationalNumber.js
function extractNationalNumber(number, country, metadata) {
  var _extractNationalNumbe = extractNationalNumberFromPossiblyIncompleteNumber(number, metadata), carrierCode = _extractNationalNumbe.carrierCode, nationalNumber = _extractNationalNumbe.nationalNumber;
  if (nationalNumber !== number) {
    if (!shouldHaveExtractedNationalPrefix(number, nationalNumber, metadata)) {
      return {
        nationalNumber: number
      };
    }
    if (metadata.numberingPlan.possibleLengths()) {
      if (!country) {
        country = getCountryByCallingCode(metadata.numberingPlan.callingCode(), {
          nationalNumber,
          metadata
        });
      }
      if (!isPossibleIncompleteNationalNumber(nationalNumber, country, metadata)) {
        return {
          nationalNumber: number
        };
      }
    }
  }
  return {
    nationalNumber,
    carrierCode
  };
}
function shouldHaveExtractedNationalPrefix(nationalNumberBefore, nationalNumberAfter, metadata) {
  if (matchesEntirely(nationalNumberBefore, metadata.nationalNumberPattern()) && !matchesEntirely(nationalNumberAfter, metadata.nationalNumberPattern())) {
    return false;
  }
  return true;
}
function isPossibleIncompleteNationalNumber(nationalNumber, country, metadata) {
  switch (checkNumberLength(nationalNumber, country, metadata)) {
    case "TOO_SHORT":
    case "INVALID_LENGTH":
      return false;
    default:
      return true;
  }
}

// node_modules/libphonenumber-js/es6/helpers/extractCountryCallingCodeFromInternationalNumberWithoutPlusSign.js
function extractCountryCallingCodeFromInternationalNumberWithoutPlusSign(number, country, defaultCountry, defaultCallingCode, metadata) {
  var countryCallingCode = country || defaultCountry ? getCountryCallingCode(country || defaultCountry, metadata) : defaultCallingCode;
  if (number.indexOf(countryCallingCode) === 0) {
    metadata = new Metadata(metadata);
    metadata.selectNumberingPlan(country || defaultCountry, countryCallingCode);
    var possibleShorterNumber = number.slice(countryCallingCode.length);
    var _extractNationalNumbe = extractNationalNumber(possibleShorterNumber, country, metadata), possibleShorterNationalNumber = _extractNationalNumbe.nationalNumber;
    var _extractNationalNumbe2 = extractNationalNumber(number, country, metadata), nationalNumber = _extractNationalNumbe2.nationalNumber;
    if (!matchesEntirely(nationalNumber, metadata.nationalNumberPattern()) && matchesEntirely(possibleShorterNationalNumber, metadata.nationalNumberPattern()) || checkNumberLength(nationalNumber, country, metadata) === "TOO_LONG") {
      return {
        countryCallingCode,
        number: possibleShorterNumber
      };
    }
  }
  return {
    number
  };
}

// node_modules/libphonenumber-js/es6/helpers/extractCountryCallingCode.js
function extractCountryCallingCode(number, country, defaultCountry, defaultCallingCode, metadata) {
  if (!number) {
    return {};
  }
  var isNumberWithIddPrefix;
  if (number[0] !== "+") {
    var numberWithoutIDD = stripIddPrefix(number, country || defaultCountry, defaultCallingCode, metadata);
    if (numberWithoutIDD && numberWithoutIDD !== number) {
      isNumberWithIddPrefix = true;
      number = "+" + numberWithoutIDD;
    } else {
      if (country || defaultCountry || defaultCallingCode) {
        var _extractCountryCallin = extractCountryCallingCodeFromInternationalNumberWithoutPlusSign(number, country, defaultCountry, defaultCallingCode, metadata), countryCallingCode = _extractCountryCallin.countryCallingCode, shorterNumber = _extractCountryCallin.number;
        if (countryCallingCode) {
          return {
            countryCallingCodeSource: "FROM_NUMBER_WITHOUT_PLUS_SIGN",
            countryCallingCode,
            number: shorterNumber
          };
        }
      }
      return {
        // No need to set it to `UNSPECIFIED`. It can be just `undefined`.
        // countryCallingCodeSource: 'UNSPECIFIED',
        number
      };
    }
  }
  if (number[1] === "0") {
    return {};
  }
  metadata = new Metadata(metadata);
  var i = 2;
  while (i - 1 <= MAX_LENGTH_COUNTRY_CODE && i <= number.length) {
    var _countryCallingCode = number.slice(1, i);
    if (metadata.hasCallingCode(_countryCallingCode)) {
      metadata.selectNumberingPlan(_countryCallingCode);
      return {
        countryCallingCodeSource: isNumberWithIddPrefix ? "FROM_NUMBER_WITH_IDD" : "FROM_NUMBER_WITH_PLUS_SIGN",
        countryCallingCode: _countryCallingCode,
        number: number.slice(i)
      };
    }
    i++;
  }
  return {};
}

// node_modules/libphonenumber-js/es6/helpers/applyInternationalSeparatorStyle.js
function applyInternationalSeparatorStyle(formattedNumber) {
  return formattedNumber.replace(new RegExp("[".concat(VALID_PUNCTUATION, "]+"), "g"), " ").trim();
}

// node_modules/libphonenumber-js/es6/helpers/formatNationalNumberUsingFormat.js
var FIRST_GROUP_PATTERN = /(\$\d)/;
function formatNationalNumberUsingFormat(number, format, _ref) {
  var useInternationalFormat = _ref.useInternationalFormat, withNationalPrefix = _ref.withNationalPrefix, carrierCode = _ref.carrierCode, metadata = _ref.metadata;
  var formattedNumber = number.replace(new RegExp(format.pattern()), useInternationalFormat ? format.internationalFormat() : (
    // This library doesn't use `domestic_carrier_code_formatting_rule`,
    // because that one is only used when formatting phone numbers
    // for dialing from a mobile phone, and this is not a dialing library.
    // carrierCode && format.domesticCarrierCodeFormattingRule()
    // 	// First, replace the $CC in the formatting rule with the desired carrier code.
    // 	// Then, replace the $FG in the formatting rule with the first group
    // 	// and the carrier code combined in the appropriate way.
    // 	? format.format().replace(FIRST_GROUP_PATTERN, format.domesticCarrierCodeFormattingRule().replace('$CC', carrierCode))
    // 	: (
    // 		withNationalPrefix && format.nationalPrefixFormattingRule()
    // 			? format.format().replace(FIRST_GROUP_PATTERN, format.nationalPrefixFormattingRule())
    // 			: format.format()
    // 	)
    withNationalPrefix && format.nationalPrefixFormattingRule() ? format.format().replace(FIRST_GROUP_PATTERN, format.nationalPrefixFormattingRule()) : format.format()
  ));
  if (useInternationalFormat) {
    return applyInternationalSeparatorStyle(formattedNumber);
  }
  return formattedNumber;
}

// node_modules/libphonenumber-js/es6/helpers/getIddPrefix.js
var SINGLE_IDD_PREFIX_REG_EXP = /^[\d]+(?:[~\u2053\u223C\uFF5E][\d]+)?$/;
function getIddPrefix(country, callingCode, metadata) {
  var countryMetadata = new Metadata(metadata);
  countryMetadata.selectNumberingPlan(country, callingCode);
  if (countryMetadata.defaultIDDPrefix()) {
    return countryMetadata.defaultIDDPrefix();
  }
  if (SINGLE_IDD_PREFIX_REG_EXP.test(countryMetadata.IDDPrefix())) {
    return countryMetadata.IDDPrefix();
  }
}

// node_modules/libphonenumber-js/es6/helpers/extension/createExtensionPattern.js
var RFC3966_EXTN_PREFIX = ";ext=";
var getExtensionDigitsPattern = function getExtensionDigitsPattern2(maxLength) {
  return "([".concat(VALID_DIGITS, "]{1,").concat(maxLength, "})");
};
function createExtensionPattern(purpose) {
  var extLimitAfterExplicitLabel = "20";
  var extLimitAfterLikelyLabel = "15";
  var extLimitAfterAmbiguousChar = "9";
  var extLimitWhenNotSure = "6";
  var possibleSeparatorsBetweenNumberAndExtLabel = "[ \xA0\\t,]*";
  var possibleCharsAfterExtLabel = "[:\\.\uFF0E]?[ \xA0\\t,-]*";
  var optionalExtnSuffix = "#?";
  var explicitExtLabels = "(?:e?xt(?:ensi(?:o\u0301?|\xF3))?n?|\uFF45?\uFF58\uFF54\uFF4E?|\u0434\u043E\u0431|anexo)";
  var ambiguousExtLabels = "(?:[x\uFF58#\uFF03~\uFF5E]|int|\uFF49\uFF4E\uFF54)";
  var ambiguousSeparator = "[- ]+";
  var possibleSeparatorsNumberExtLabelNoComma = "[ \xA0\\t]*";
  var autoDiallingAndExtLabelsFound = "(?:,{2}|;)";
  var rfcExtn = RFC3966_EXTN_PREFIX + getExtensionDigitsPattern(extLimitAfterExplicitLabel);
  var explicitExtn = possibleSeparatorsBetweenNumberAndExtLabel + explicitExtLabels + possibleCharsAfterExtLabel + getExtensionDigitsPattern(extLimitAfterExplicitLabel) + optionalExtnSuffix;
  var ambiguousExtn = possibleSeparatorsBetweenNumberAndExtLabel + ambiguousExtLabels + possibleCharsAfterExtLabel + getExtensionDigitsPattern(extLimitAfterAmbiguousChar) + optionalExtnSuffix;
  var americanStyleExtnWithSuffix = ambiguousSeparator + getExtensionDigitsPattern(extLimitWhenNotSure) + "#";
  var autoDiallingExtn = possibleSeparatorsNumberExtLabelNoComma + autoDiallingAndExtLabelsFound + possibleCharsAfterExtLabel + getExtensionDigitsPattern(extLimitAfterLikelyLabel) + optionalExtnSuffix;
  var onlyCommasExtn = possibleSeparatorsNumberExtLabelNoComma + "(?:,)+" + possibleCharsAfterExtLabel + getExtensionDigitsPattern(extLimitAfterAmbiguousChar) + optionalExtnSuffix;
  return rfcExtn + "|" + explicitExtn + "|" + ambiguousExtn + "|" + americanStyleExtnWithSuffix + "|" + autoDiallingExtn + "|" + onlyCommasExtn;
}

// node_modules/libphonenumber-js/es6/helpers/isViablePhoneNumber.js
var MIN_LENGTH_PHONE_NUMBER_PATTERN = "[" + VALID_DIGITS + "]{" + MIN_LENGTH_FOR_NSN + "}";
var VALID_PHONE_NUMBER = "[" + PLUS_CHARS + "]{0,1}(?:[" + VALID_PUNCTUATION + "]*[" + VALID_DIGITS + "]){3,}[" + VALID_PUNCTUATION + VALID_DIGITS + "]*";
var VALID_PHONE_NUMBER_START_REG_EXP = new RegExp("^[" + PLUS_CHARS + "]{0,1}(?:[" + VALID_PUNCTUATION + "]*[" + VALID_DIGITS + "]){1,2}$", "i");
var VALID_PHONE_NUMBER_WITH_EXTENSION = VALID_PHONE_NUMBER + // Phone number extensions
"(?:" + createExtensionPattern() + ")?";
var VALID_PHONE_NUMBER_PATTERN = new RegExp(
  // Either a short two-digit-only phone number
  "^" + MIN_LENGTH_PHONE_NUMBER_PATTERN + "$|^" + VALID_PHONE_NUMBER_WITH_EXTENSION + "$",
  "i"
);
function isViablePhoneNumber(number) {
  return number.length >= MIN_LENGTH_FOR_NSN && VALID_PHONE_NUMBER_PATTERN.test(number);
}
function isViablePhoneNumberStart(number) {
  return VALID_PHONE_NUMBER_START_REG_EXP.test(number);
}

// node_modules/libphonenumber-js/es6/helpers/RFC3966.js
function formatRFC3966(_ref) {
  var number = _ref.number, ext = _ref.ext;
  if (!number) {
    return "";
  }
  if (number[0] !== "+") {
    throw new Error('"formatRFC3966()" expects "number" to be in E.164 format.');
  }
  return "tel:".concat(number).concat(ext ? ";ext=" + ext : "");
}

// node_modules/libphonenumber-js/es6/format.js
var DEFAULT_OPTIONS = {
  formatExtension: function formatExtension(formattedNumber, extension, metadata) {
    return "".concat(formattedNumber).concat(metadata.ext()).concat(extension);
  }
};
function formatNumber(input, format, options, metadata) {
  if (options) {
    options = merge({}, DEFAULT_OPTIONS, options);
  } else {
    options = DEFAULT_OPTIONS;
  }
  metadata = new Metadata(metadata);
  if (input.country && input.country !== "001") {
    if (!metadata.hasCountry(input.country)) {
      throw new Error("Unknown country: ".concat(input.country));
    }
    metadata.selectNumberingPlan(input.country);
  } else if (input.countryCallingCode) {
    metadata.selectNumberingPlan(input.countryCallingCode);
  } else return input.phone || "";
  var countryCallingCode = metadata.countryCallingCode();
  var nationalNumber = options.v2 ? input.nationalNumber : input.phone;
  var number;
  switch (format) {
    case "NATIONAL":
      if (!nationalNumber) {
        return "";
      }
      number = formatNationalNumber(nationalNumber, input.carrierCode, "NATIONAL", metadata, options);
      return addExtension(number, input.ext, metadata, options.formatExtension);
    case "INTERNATIONAL":
      if (!nationalNumber) {
        return "+".concat(countryCallingCode);
      }
      number = formatNationalNumber(nationalNumber, null, "INTERNATIONAL", metadata, options);
      number = "+".concat(countryCallingCode, " ").concat(number);
      return addExtension(number, input.ext, metadata, options.formatExtension);
    case "E.164":
      return "+".concat(countryCallingCode).concat(nationalNumber);
    case "RFC3966":
      return formatRFC3966({
        number: "+".concat(countryCallingCode).concat(nationalNumber),
        ext: input.ext
      });
    // For reference, here's Google's IDD formatter:
    // https://github.com/google/libphonenumber/blob/32719cf74e68796788d1ca45abc85dcdc63ba5b9/java/libphonenumber/src/com/google/i18n/phonenumbers/PhoneNumberUtil.java#L1546
    // Not saying that this IDD formatter replicates it 1:1, but it seems to work.
    // Who would even need to format phone numbers in IDD format anyway?
    case "IDD":
      if (!options.fromCountry) {
        return;
      }
      var formattedNumber = formatIDD(nationalNumber, input.carrierCode, countryCallingCode, options.fromCountry, metadata);
      return addExtension(formattedNumber, input.ext, metadata, options.formatExtension);
    default:
      throw new Error('Unknown "format" argument passed to "formatNumber()": "'.concat(format, '"'));
  }
}
function formatNationalNumber(number, carrierCode, formatAs, metadata, options) {
  var format = chooseFormatForNumber(metadata.formats(), number);
  if (!format) {
    return number;
  }
  return formatNationalNumberUsingFormat(number, format, {
    useInternationalFormat: formatAs === "INTERNATIONAL",
    withNationalPrefix: format.nationalPrefixIsOptionalWhenFormattingInNationalFormat() && options && options.nationalPrefix === false ? false : true,
    carrierCode,
    metadata
  });
}
function chooseFormatForNumber(availableFormats, nationalNumber) {
  return pickFirstMatchingElement(availableFormats, function(format) {
    if (format.leadingDigitsPatterns().length > 0) {
      var lastLeadingDigitsPattern = format.leadingDigitsPatterns()[format.leadingDigitsPatterns().length - 1];
      if (nationalNumber.search(lastLeadingDigitsPattern) !== 0) {
        return false;
      }
    }
    return matchesEntirely(nationalNumber, format.pattern());
  });
}
function addExtension(formattedNumber, ext, metadata, formatExtension2) {
  return ext ? formatExtension2(formattedNumber, ext, metadata) : formattedNumber;
}
function formatIDD(nationalNumber, carrierCode, countryCallingCode, fromCountry, metadata) {
  var fromCountryCallingCode = getCountryCallingCode(fromCountry, metadata.metadata);
  if (fromCountryCallingCode === countryCallingCode) {
    var formattedNumber = formatNationalNumber(nationalNumber, carrierCode, "NATIONAL", metadata);
    if (countryCallingCode === "1") {
      return countryCallingCode + " " + formattedNumber;
    }
    return formattedNumber;
  }
  var iddPrefix = getIddPrefix(fromCountry, void 0, metadata.metadata);
  if (iddPrefix) {
    return "".concat(iddPrefix, " ").concat(countryCallingCode, " ").concat(formatNationalNumber(nationalNumber, null, "INTERNATIONAL", metadata));
  }
}
function merge() {
  var i = 1;
  for (var _len = arguments.length, objects = new Array(_len), _key = 0; _key < _len; _key++) {
    objects[_key] = arguments[_key];
  }
  while (i < objects.length) {
    if (objects[i]) {
      for (var key in objects[i]) {
        objects[0][key] = objects[i][key];
      }
    }
    i++;
  }
  return objects[0];
}
function pickFirstMatchingElement(elements, testFunction) {
  var i = 0;
  while (i < elements.length) {
    if (testFunction(elements[i])) {
      return elements[i];
    }
    i++;
  }
}

// node_modules/libphonenumber-js/es6/PhoneNumber.js
function _typeof2(o) {
  "@babel/helpers - typeof";
  return _typeof2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof2(o);
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
      _defineProperty(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty(e, r, t) {
  return (r = _toPropertyKey2(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
}
function _classCallCheck2(a, n) {
  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
}
function _defineProperties2(e, r) {
  for (var t = 0; t < r.length; t++) {
    var o = r[t];
    o.enumerable = o.enumerable || false, o.configurable = true, "value" in o && (o.writable = true), Object.defineProperty(e, _toPropertyKey2(o.key), o);
  }
}
function _createClass2(e, r, t) {
  return r && _defineProperties2(e.prototype, r), t && _defineProperties2(e, t), Object.defineProperty(e, "prototype", { writable: false }), e;
}
function _toPropertyKey2(t) {
  var i = _toPrimitive2(t, "string");
  return "symbol" == _typeof2(i) ? i : i + "";
}
function _toPrimitive2(t, r) {
  if ("object" != _typeof2(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof2(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
var USE_NON_GEOGRAPHIC_COUNTRY_CODE2 = false;
var PhoneNumber = /* @__PURE__ */ (function() {
  function PhoneNumber2(countryOrCountryCallingCode, nationalNumber, metadata) {
    _classCallCheck2(this, PhoneNumber2);
    if (!countryOrCountryCallingCode) {
      throw new TypeError("First argument is required");
    }
    if (typeof countryOrCountryCallingCode !== "string") {
      throw new TypeError("First argument must be a string");
    }
    if (countryOrCountryCallingCode[0] === "+" && !nationalNumber) {
      throw new TypeError("`metadata` argument not passed");
    }
    if (isObject(nationalNumber) && isObject(nationalNumber.countries)) {
      metadata = nationalNumber;
      var e164Number = countryOrCountryCallingCode;
      if (!E164_NUMBER_REGEXP.test(e164Number)) {
        throw new Error('Invalid `number` argument passed: must consist of a "+" followed by digits');
      }
      var _extractCountryCallin = extractCountryCallingCode(e164Number, void 0, void 0, void 0, metadata), _countryCallingCode = _extractCountryCallin.countryCallingCode, number = _extractCountryCallin.number;
      nationalNumber = number;
      countryOrCountryCallingCode = _countryCallingCode;
      if (!nationalNumber) {
        throw new Error("Invalid `number` argument passed: too short");
      }
    }
    if (!nationalNumber) {
      throw new TypeError("`nationalNumber` argument is required");
    }
    if (typeof nationalNumber !== "string") {
      throw new TypeError("`nationalNumber` argument must be a string");
    }
    validateMetadata(metadata);
    var _getCountryAndCountry = getCountryAndCountryCallingCode(countryOrCountryCallingCode, metadata), country = _getCountryAndCountry.country, countryCallingCode = _getCountryAndCountry.countryCallingCode;
    this.country = country;
    this.countryCallingCode = countryCallingCode;
    this.nationalNumber = nationalNumber;
    this.number = "+" + this.countryCallingCode + this.nationalNumber;
    this.getMetadata = function() {
      return metadata;
    };
  }
  return _createClass2(PhoneNumber2, [{
    key: "setExt",
    value: function setExt(ext) {
      this.ext = ext;
    }
  }, {
    key: "getPossibleCountries",
    value: function getPossibleCountries() {
      if (this.country) {
        return [this.country];
      }
      return getPossibleCountriesForNumber(this.countryCallingCode, this.nationalNumber, this.getMetadata());
    }
  }, {
    key: "isPossible",
    value: function isPossible() {
      return isPossiblePhoneNumber(this, {
        v2: true
      }, this.getMetadata());
    }
  }, {
    key: "isValid",
    value: function isValid() {
      return isValidNumber(this, {
        v2: true
      }, this.getMetadata());
    }
  }, {
    key: "isNonGeographic",
    value: function isNonGeographic() {
      var metadata = new Metadata(this.getMetadata());
      return metadata.isNonGeographicCallingCode(this.countryCallingCode);
    }
  }, {
    key: "isEqual",
    value: function isEqual(phoneNumber) {
      return this.number === phoneNumber.number && this.ext === phoneNumber.ext;
    }
    // This function was originally meant to be an equivalent for `validatePhoneNumberLength()`,
    // but later it was found out that it doesn't include the possible `TOO_SHORT` result
    // returned from `parsePhoneNumberWithError()` in the original `validatePhoneNumberLength()`,
    // so eventually I simply commented out this method from the `PhoneNumber` class
    // and just left the `validatePhoneNumberLength()` function, even though that one would require
    // and additional step to also validate the actual country / calling code of the phone number.
    // validateLength() {
    // 	const metadata = new Metadata(this.getMetadata())
    // 	metadata.selectNumberingPlan(this.countryCallingCode)
    // 	const result = checkNumberLength(this.nationalNumber, metadata)
    // 	if (result !== 'IS_POSSIBLE') {
    // 		return result
    // 	}
    // }
  }, {
    key: "getType",
    value: function getType2() {
      return getNumberType(this, {
        v2: true
      }, this.getMetadata());
    }
  }, {
    key: "format",
    value: function format(_format, options) {
      return formatNumber(this, _format, options ? _objectSpread(_objectSpread({}, options), {}, {
        v2: true
      }) : {
        v2: true
      }, this.getMetadata());
    }
  }, {
    key: "formatNational",
    value: function formatNational(options) {
      return this.format("NATIONAL", options);
    }
  }, {
    key: "formatInternational",
    value: function formatInternational(options) {
      return this.format("INTERNATIONAL", options);
    }
  }, {
    key: "getURI",
    value: function getURI(options) {
      return this.format("RFC3966", options);
    }
  }]);
})();
var isCountryCode = function isCountryCode2(value) {
  return /^[A-Z]{2}$/.test(value);
};
function getCountryAndCountryCallingCode(countryOrCountryCallingCode, metadataJson) {
  var country;
  var countryCallingCode;
  var metadata = new Metadata(metadataJson);
  if (isCountryCode(countryOrCountryCallingCode)) {
    country = countryOrCountryCallingCode;
    metadata.selectNumberingPlan(country);
    countryCallingCode = metadata.countryCallingCode();
  } else {
    countryCallingCode = countryOrCountryCallingCode;
    if (USE_NON_GEOGRAPHIC_COUNTRY_CODE2) {
      if (metadata.isNonGeographicCallingCode(countryCallingCode)) {
        country = "001";
      }
    }
  }
  return {
    country,
    countryCallingCode
  };
}
var E164_NUMBER_REGEXP = /^\+\d+$/;

// node_modules/libphonenumber-js/es6/ParseError.js
function _typeof3(o) {
  "@babel/helpers - typeof";
  return _typeof3 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof3(o);
}
function _defineProperties3(e, r) {
  for (var t = 0; t < r.length; t++) {
    var o = r[t];
    o.enumerable = o.enumerable || false, o.configurable = true, "value" in o && (o.writable = true), Object.defineProperty(e, _toPropertyKey3(o.key), o);
  }
}
function _createClass3(e, r, t) {
  return r && _defineProperties3(e.prototype, r), t && _defineProperties3(e, t), Object.defineProperty(e, "prototype", { writable: false }), e;
}
function _toPropertyKey3(t) {
  var i = _toPrimitive3(t, "string");
  return "symbol" == _typeof3(i) ? i : i + "";
}
function _toPrimitive3(t, r) {
  if ("object" != _typeof3(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof3(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _classCallCheck3(a, n) {
  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
}
function _callSuper(t, o, e) {
  return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e));
}
function _possibleConstructorReturn(t, e) {
  if (e && ("object" == _typeof3(e) || "function" == typeof e)) return e;
  if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
  return _assertThisInitialized(t);
}
function _assertThisInitialized(e) {
  if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  return e;
}
function _inherits(t, e) {
  if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
  t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: true, configurable: true } }), Object.defineProperty(t, "prototype", { writable: false }), e && _setPrototypeOf(t, e);
}
function _wrapNativeSuper(t) {
  var r = "function" == typeof Map ? /* @__PURE__ */ new Map() : void 0;
  return _wrapNativeSuper = function _wrapNativeSuper2(t2) {
    if (null === t2 || !_isNativeFunction(t2)) return t2;
    if ("function" != typeof t2) throw new TypeError("Super expression must either be null or a function");
    if (void 0 !== r) {
      if (r.has(t2)) return r.get(t2);
      r.set(t2, Wrapper);
    }
    function Wrapper() {
      return _construct(t2, arguments, _getPrototypeOf(this).constructor);
    }
    return Wrapper.prototype = Object.create(t2.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }), _setPrototypeOf(Wrapper, t2);
  }, _wrapNativeSuper(t);
}
function _construct(t, e, r) {
  if (_isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments);
  var o = [null];
  o.push.apply(o, e);
  var p = new (t.bind.apply(t, o))();
  return r && _setPrototypeOf(p, r.prototype), p;
}
function _isNativeReflectConstruct() {
  try {
    var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
    }));
  } catch (t2) {
  }
  return (_isNativeReflectConstruct = function _isNativeReflectConstruct2() {
    return !!t;
  })();
}
function _isNativeFunction(t) {
  try {
    return -1 !== Function.toString.call(t).indexOf("[native code]");
  } catch (n) {
    return "function" == typeof t;
  }
}
function _setPrototypeOf(t, e) {
  return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(t2, e2) {
    return t2.__proto__ = e2, t2;
  }, _setPrototypeOf(t, e);
}
function _getPrototypeOf(t) {
  return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(t2) {
    return t2.__proto__ || Object.getPrototypeOf(t2);
  }, _getPrototypeOf(t);
}
var ParseError = /* @__PURE__ */ (function(_Error) {
  function ParseError2(code) {
    var _this;
    _classCallCheck3(this, ParseError2);
    _this = _callSuper(this, ParseError2, [code]);
    Object.setPrototypeOf(_this, ParseError2.prototype);
    _this.name = _this.constructor.name;
    return _this;
  }
  _inherits(ParseError2, _Error);
  return _createClass3(ParseError2);
})(/* @__PURE__ */ _wrapNativeSuper(Error));

// node_modules/libphonenumber-js/es6/helpers/extension/extractExtension.js
var EXTN_PATTERN = new RegExp("(?:" + createExtensionPattern() + ")$", "i");
function extractExtension(number) {
  var start = number.search(EXTN_PATTERN);
  if (start < 0) {
    return {};
  }
  var numberWithoutExtension = number.slice(0, start);
  var matches = number.match(EXTN_PATTERN);
  var i = 1;
  while (i < matches.length) {
    if (matches[i]) {
      return {
        number: numberWithoutExtension,
        ext: matches[i]
      };
    }
    i++;
  }
}

// node_modules/libphonenumber-js/es6/helpers/parseDigits.js
var DIGITS = {
  "0": "0",
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "\uFF10": "0",
  // Fullwidth digit 0
  "\uFF11": "1",
  // Fullwidth digit 1
  "\uFF12": "2",
  // Fullwidth digit 2
  "\uFF13": "3",
  // Fullwidth digit 3
  "\uFF14": "4",
  // Fullwidth digit 4
  "\uFF15": "5",
  // Fullwidth digit 5
  "\uFF16": "6",
  // Fullwidth digit 6
  "\uFF17": "7",
  // Fullwidth digit 7
  "\uFF18": "8",
  // Fullwidth digit 8
  "\uFF19": "9",
  // Fullwidth digit 9
  "\u0660": "0",
  // Arabic-indic digit 0
  "\u0661": "1",
  // Arabic-indic digit 1
  "\u0662": "2",
  // Arabic-indic digit 2
  "\u0663": "3",
  // Arabic-indic digit 3
  "\u0664": "4",
  // Arabic-indic digit 4
  "\u0665": "5",
  // Arabic-indic digit 5
  "\u0666": "6",
  // Arabic-indic digit 6
  "\u0667": "7",
  // Arabic-indic digit 7
  "\u0668": "8",
  // Arabic-indic digit 8
  "\u0669": "9",
  // Arabic-indic digit 9
  "\u06F0": "0",
  // Eastern-Arabic digit 0
  "\u06F1": "1",
  // Eastern-Arabic digit 1
  "\u06F2": "2",
  // Eastern-Arabic digit 2
  "\u06F3": "3",
  // Eastern-Arabic digit 3
  "\u06F4": "4",
  // Eastern-Arabic digit 4
  "\u06F5": "5",
  // Eastern-Arabic digit 5
  "\u06F6": "6",
  // Eastern-Arabic digit 6
  "\u06F7": "7",
  // Eastern-Arabic digit 7
  "\u06F8": "8",
  // Eastern-Arabic digit 8
  "\u06F9": "9"
  // Eastern-Arabic digit 9
};
function parseDigit(character) {
  return DIGITS[character];
}

// node_modules/libphonenumber-js/es6/parseIncompletePhoneNumber.js
function _createForOfIteratorHelperLoose4(r, e) {
  var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (t) return (t = t.call(r)).next.bind(t);
  if (Array.isArray(r) || (t = _unsupportedIterableToArray4(r)) || e && r && "number" == typeof r.length) {
    t && (r = t);
    var o = 0;
    return function() {
      return o >= r.length ? { done: true } : { done: false, value: r[o++] };
    };
  }
  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray4(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray4(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray4(r, a) : void 0;
  }
}
function _arrayLikeToArray4(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function parseIncompletePhoneNumber(string) {
  var result2 = "";
  for (var _iterator = _createForOfIteratorHelperLoose4(string.split("")), _step; !(_step = _iterator()).done; ) {
    var character = _step.value;
    result2 += parsePhoneNumberCharacter(character, result2) || "";
  }
  return result2;
}
function parsePhoneNumberCharacter(character, prevParsedCharacters, eventListener) {
  if (character === "+") {
    if (prevParsedCharacters) {
      if (typeof eventListener === "function") {
        eventListener("end");
      }
      return;
    }
    return "+";
  }
  return parseDigit(character);
}

// node_modules/libphonenumber-js/es6/helpers/extractPhoneContext.js
var PLUS_SIGN = "+";
var RFC3966_VISUAL_SEPARATOR_ = "[\\-\\.\\(\\)]?";
var RFC3966_PHONE_DIGIT_ = "([" + VALID_DIGITS + "]|" + RFC3966_VISUAL_SEPARATOR_ + ")";
var RFC3966_GLOBAL_NUMBER_DIGITS_ = "^\\" + PLUS_SIGN + RFC3966_PHONE_DIGIT_ + "*[" + VALID_DIGITS + "]" + RFC3966_PHONE_DIGIT_ + "*$";
var RFC3966_GLOBAL_NUMBER_DIGITS_PATTERN_ = new RegExp(RFC3966_GLOBAL_NUMBER_DIGITS_, "g");
var ALPHANUM_ = VALID_DIGITS;
var RFC3966_DOMAINLABEL_ = "[" + ALPHANUM_ + "]+((\\-)*[" + ALPHANUM_ + "])*";
var VALID_ALPHA_ = "a-zA-Z";
var RFC3966_TOPLABEL_ = "[" + VALID_ALPHA_ + "]+((\\-)*[" + ALPHANUM_ + "])*";
var RFC3966_DOMAINNAME_ = "^(" + RFC3966_DOMAINLABEL_ + "\\.)*" + RFC3966_TOPLABEL_ + "\\.?$";
var RFC3966_DOMAINNAME_PATTERN_ = new RegExp(RFC3966_DOMAINNAME_, "g");
var RFC3966_PREFIX_ = "tel:";
var RFC3966_PHONE_CONTEXT_ = ";phone-context=";
var RFC3966_ISDN_SUBADDRESS_ = ";isub=";
function extractPhoneContext(numberToExtractFrom) {
  var indexOfPhoneContext = numberToExtractFrom.indexOf(RFC3966_PHONE_CONTEXT_);
  if (indexOfPhoneContext < 0) {
    return null;
  }
  var phoneContextStart = indexOfPhoneContext + RFC3966_PHONE_CONTEXT_.length;
  if (phoneContextStart >= numberToExtractFrom.length) {
    return "";
  }
  var phoneContextEnd = numberToExtractFrom.indexOf(";", phoneContextStart);
  if (phoneContextEnd >= 0) {
    return numberToExtractFrom.substring(phoneContextStart, phoneContextEnd);
  } else {
    return numberToExtractFrom.substring(phoneContextStart);
  }
}
function isPhoneContextValid(phoneContext) {
  if (phoneContext === null) {
    return true;
  }
  if (phoneContext.length === 0) {
    return false;
  }
  return RFC3966_GLOBAL_NUMBER_DIGITS_PATTERN_.test(phoneContext) || RFC3966_DOMAINNAME_PATTERN_.test(phoneContext);
}

// node_modules/libphonenumber-js/es6/helpers/extractFormattedPhoneNumberFromPossibleRfc3966NumberUri.js
function extractFormattedPhoneNumberFromPossibleRfc3966NumberUri(numberToParse, _ref) {
  var extractFormattedPhoneNumber = _ref.extractFormattedPhoneNumber;
  var phoneContext = extractPhoneContext(numberToParse);
  if (!isPhoneContextValid(phoneContext)) {
    throw new ParseError("NOT_A_NUMBER");
  }
  var phoneNumberString;
  if (phoneContext === null) {
    phoneNumberString = extractFormattedPhoneNumber(numberToParse) || "";
  } else {
    phoneNumberString = "";
    if (phoneContext.charAt(0) === PLUS_SIGN) {
      phoneNumberString += phoneContext;
    }
    var indexOfRfc3966Prefix = numberToParse.indexOf(RFC3966_PREFIX_);
    var indexOfNationalNumber;
    if (indexOfRfc3966Prefix >= 0) {
      indexOfNationalNumber = indexOfRfc3966Prefix + RFC3966_PREFIX_.length;
    } else {
      indexOfNationalNumber = 0;
    }
    var indexOfPhoneContext = numberToParse.indexOf(RFC3966_PHONE_CONTEXT_);
    phoneNumberString += numberToParse.substring(indexOfNationalNumber, indexOfPhoneContext);
  }
  var indexOfIsdn = phoneNumberString.indexOf(RFC3966_ISDN_SUBADDRESS_);
  if (indexOfIsdn > 0) {
    phoneNumberString = phoneNumberString.substring(0, indexOfIsdn);
  }
  if (phoneNumberString !== "") {
    return phoneNumberString;
  }
}

// node_modules/libphonenumber-js/es6/parse.js
var MAX_INPUT_STRING_LENGTH = 250;
var PHONE_NUMBER_START_PATTERN = new RegExp("[" + PLUS_CHARS + VALID_DIGITS + "]");
var AFTER_PHONE_NUMBER_END_PATTERN = new RegExp("[^" + VALID_DIGITS + "#]+$");
var USE_NON_GEOGRAPHIC_COUNTRY_CODE3 = false;
function parse(text2, options, metadata) {
  options = options || {};
  metadata = new Metadata(metadata);
  if (options.defaultCountry && !metadata.hasCountry(options.defaultCountry)) {
    if (options.v2) {
      throw new ParseError("INVALID_COUNTRY");
    }
    throw new Error("Unknown country: ".concat(options.defaultCountry));
  }
  var _parseInput = parseInput(text2, options.v2, options.extract), formattedPhoneNumber = _parseInput.number, ext = _parseInput.ext, error = _parseInput.error;
  if (!formattedPhoneNumber) {
    if (options.v2) {
      if (error === "TOO_SHORT") {
        throw new ParseError("TOO_SHORT");
      }
      throw new ParseError("NOT_A_NUMBER");
    }
    return {};
  }
  var _parsePhoneNumber = parsePhoneNumber(formattedPhoneNumber, options.defaultCountry, options.defaultCallingCode, metadata), country = _parsePhoneNumber.country, nationalNumber = _parsePhoneNumber.nationalNumber, countryCallingCode = _parsePhoneNumber.countryCallingCode, countryCallingCodeSource = _parsePhoneNumber.countryCallingCodeSource, carrierCode = _parsePhoneNumber.carrierCode;
  if (!metadata.hasSelectedNumberingPlan()) {
    if (options.v2) {
      throw new ParseError("INVALID_COUNTRY");
    }
    return {};
  }
  if (!nationalNumber || nationalNumber.length < MIN_LENGTH_FOR_NSN) {
    if (options.v2) {
      throw new ParseError("TOO_SHORT");
    }
    return {};
  }
  if (nationalNumber.length > MAX_LENGTH_FOR_NSN) {
    if (options.v2) {
      throw new ParseError("TOO_LONG");
    }
    return {};
  }
  if (options.v2) {
    var phoneNumber = new PhoneNumber(countryCallingCode, nationalNumber, metadata.metadata);
    if (country) {
      phoneNumber.country = country;
    }
    if (carrierCode) {
      phoneNumber.carrierCode = carrierCode;
    }
    if (ext) {
      phoneNumber.ext = ext;
    }
    phoneNumber.__countryCallingCodeSource = countryCallingCodeSource;
    return phoneNumber;
  }
  var valid = (options.extended ? metadata.hasSelectedNumberingPlan() : country) ? matchesEntirely(nationalNumber, metadata.nationalNumberPattern()) : false;
  if (!options.extended) {
    return valid ? result(country, nationalNumber, ext) : {};
  }
  return {
    country,
    countryCallingCode,
    carrierCode,
    valid,
    possible: valid ? true : options.extended === true && metadata.possibleLengths() && isPossibleNumber(nationalNumber, country, metadata) ? true : false,
    phone: nationalNumber,
    ext
  };
}
function _extractFormattedPhoneNumber(text2, extract, throwOnError) {
  if (!text2) {
    return;
  }
  if (text2.length > MAX_INPUT_STRING_LENGTH) {
    if (throwOnError) {
      throw new ParseError("TOO_LONG");
    }
    return;
  }
  if (extract === false) {
    return text2;
  }
  var startsAt = text2.search(PHONE_NUMBER_START_PATTERN);
  if (startsAt < 0) {
    return;
  }
  return text2.slice(startsAt).replace(AFTER_PHONE_NUMBER_END_PATTERN, "");
}
function parseInput(text2, v2, extract) {
  var number = extractFormattedPhoneNumberFromPossibleRfc3966NumberUri(text2, {
    extractFormattedPhoneNumber: function extractFormattedPhoneNumber(text3) {
      return _extractFormattedPhoneNumber(text3, extract, v2);
    }
  });
  if (!number) {
    return {};
  }
  if (!isViablePhoneNumber(number)) {
    if (isViablePhoneNumberStart(number)) {
      return {
        error: "TOO_SHORT"
      };
    }
    return {};
  }
  var withExtensionStripped = extractExtension(number);
  if (withExtensionStripped.ext) {
    return withExtensionStripped;
  }
  return {
    number
  };
}
function result(country, nationalNumber, ext) {
  var result2 = {
    country,
    phone: nationalNumber
  };
  if (ext) {
    result2.ext = ext;
  }
  return result2;
}
function parsePhoneNumber(formattedPhoneNumber, defaultCountry, defaultCallingCode, metadata) {
  var _extractCountryCallin = extractCountryCallingCode(parseIncompletePhoneNumber(formattedPhoneNumber), void 0, defaultCountry, defaultCallingCode, metadata.metadata), countryCallingCodeSource = _extractCountryCallin.countryCallingCodeSource, countryCallingCode = _extractCountryCallin.countryCallingCode, number = _extractCountryCallin.number;
  var country;
  if (countryCallingCode) {
    metadata.selectNumberingPlan(countryCallingCode);
  } else if (number && (defaultCountry || defaultCallingCode)) {
    metadata.selectNumberingPlan(defaultCountry, defaultCallingCode);
    if (defaultCountry) {
      country = defaultCountry;
    } else {
      if (USE_NON_GEOGRAPHIC_COUNTRY_CODE3) {
        if (metadata.isNonGeographicCallingCode(defaultCallingCode)) {
          country = "001";
        }
      }
    }
    countryCallingCode = defaultCallingCode || getCountryCallingCode(defaultCountry, metadata.metadata);
  } else return {};
  if (!number) {
    return {
      countryCallingCodeSource,
      countryCallingCode
    };
  }
  var _extractNationalNumbe = extractNationalNumber(parseIncompletePhoneNumber(number), country, metadata), nationalNumber = _extractNationalNumbe.nationalNumber, carrierCode = _extractNationalNumbe.carrierCode;
  var exactCountry = getCountryByCallingCode(countryCallingCode, {
    nationalNumber,
    metadata
  });
  if (exactCountry) {
    country = exactCountry;
    if (exactCountry === "001") {
    } else {
      metadata.selectNumberingPlan(country);
    }
  }
  return {
    country,
    countryCallingCode,
    countryCallingCodeSource,
    nationalNumber,
    carrierCode
  };
}

// node_modules/libphonenumber-js/es6/parsePhoneNumberWithError_.js
function _typeof4(o) {
  "@babel/helpers - typeof";
  return _typeof4 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof4(o);
}
function ownKeys2(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread2(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys2(Object(t), true).forEach(function(r2) {
      _defineProperty2(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys2(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty2(e, r, t) {
  return (r = _toPropertyKey4(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
}
function _toPropertyKey4(t) {
  var i = _toPrimitive4(t, "string");
  return "symbol" == _typeof4(i) ? i : i + "";
}
function _toPrimitive4(t, r) {
  if ("object" != _typeof4(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof4(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function parsePhoneNumberWithError(text2, options, metadata) {
  return parse(text2, _objectSpread2(_objectSpread2({}, options), {}, {
    v2: true
  }), metadata);
}

// node_modules/libphonenumber-js/es6/normalizeArguments.js
function _typeof5(o) {
  "@babel/helpers - typeof";
  return _typeof5 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof5(o);
}
function ownKeys3(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread3(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys3(Object(t), true).forEach(function(r2) {
      _defineProperty3(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys3(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty3(e, r, t) {
  return (r = _toPropertyKey5(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
}
function _toPropertyKey5(t) {
  var i = _toPrimitive5(t, "string");
  return "symbol" == _typeof5(i) ? i : i + "";
}
function _toPrimitive5(t, r) {
  if ("object" != _typeof5(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof5(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _slicedToArray(r, e) {
  return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray5(r, e) || _nonIterableRest();
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray5(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray5(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray5(r, a) : void 0;
  }
}
function _arrayLikeToArray5(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _iterableToArrayLimit(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e, n, i, u, a = [], f = true, o = false;
    try {
      if (i = (t = t.call(r)).next, 0 === l) {
        if (Object(t) !== t) return;
        f = false;
      } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = true) ;
    } catch (r2) {
      o = true, n = r2;
    } finally {
      try {
        if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
function _arrayWithHoles(r) {
  if (Array.isArray(r)) return r;
}
function normalizeArguments(args) {
  var _Array$prototype$slic = Array.prototype.slice.call(args), _Array$prototype$slic2 = _slicedToArray(_Array$prototype$slic, 4), arg_1 = _Array$prototype$slic2[0], arg_2 = _Array$prototype$slic2[1], arg_3 = _Array$prototype$slic2[2], arg_4 = _Array$prototype$slic2[3];
  var text2;
  var options;
  var metadata;
  if (typeof arg_1 === "string") {
    text2 = arg_1;
  } else throw new TypeError("A text for parsing must be a string.");
  if (!arg_2 || typeof arg_2 === "string") {
    if (arg_4) {
      options = arg_3;
      metadata = arg_4;
    } else {
      options = void 0;
      metadata = arg_3;
    }
    if (arg_2) {
      options = _objectSpread3({
        defaultCountry: arg_2
      }, options);
    }
  } else if (isObject(arg_2)) {
    if (arg_3) {
      options = arg_2;
      metadata = arg_3;
    } else {
      metadata = arg_2;
    }
  } else throw new Error("Invalid second argument: ".concat(arg_2));
  return {
    text: text2,
    options,
    metadata
  };
}

// node_modules/libphonenumber-js/es6/parsePhoneNumberWithError.js
function parsePhoneNumberWithError2() {
  var _normalizeArguments = normalizeArguments(arguments), text2 = _normalizeArguments.text, options = _normalizeArguments.options, metadata = _normalizeArguments.metadata;
  return parsePhoneNumberWithError(text2, options, metadata);
}

// node_modules/libphonenumber-js/es6/parsePhoneNumber_.js
function _typeof6(o) {
  "@babel/helpers - typeof";
  return _typeof6 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof6(o);
}
function ownKeys4(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread4(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys4(Object(t), true).forEach(function(r2) {
      _defineProperty4(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys4(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty4(e, r, t) {
  return (r = _toPropertyKey6(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
}
function _toPropertyKey6(t) {
  var i = _toPrimitive6(t, "string");
  return "symbol" == _typeof6(i) ? i : i + "";
}
function _toPrimitive6(t, r) {
  if ("object" != _typeof6(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof6(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function parsePhoneNumber2(text2, options, metadata) {
  if (options && options.defaultCountry && !isSupportedCountry(options.defaultCountry, metadata)) {
    options = _objectSpread4(_objectSpread4({}, options), {}, {
      defaultCountry: void 0
    });
  }
  try {
    return parsePhoneNumberWithError(text2, options, metadata);
  } catch (error) {
    if (error instanceof ParseError) {
    } else {
      throw error;
    }
  }
}

// node_modules/libphonenumber-js/es6/isValidPhoneNumber.js
function _typeof7(o) {
  "@babel/helpers - typeof";
  return _typeof7 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof7(o);
}
function ownKeys5(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread5(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys5(Object(t), true).forEach(function(r2) {
      _defineProperty5(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys5(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty5(e, r, t) {
  return (r = _toPropertyKey7(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
}
function _toPropertyKey7(t) {
  var i = _toPrimitive7(t, "string");
  return "symbol" == _typeof7(i) ? i : i + "";
}
function _toPrimitive7(t, r) {
  if ("object" != _typeof7(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof7(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function isValidPhoneNumber() {
  var _normalizeArguments = normalizeArguments(arguments), text2 = _normalizeArguments.text, options = _normalizeArguments.options, metadata = _normalizeArguments.metadata;
  options = _objectSpread5(_objectSpread5({}, options), {}, {
    extract: false
  });
  var phoneNumber = parsePhoneNumber2(text2, options, metadata);
  return phoneNumber && phoneNumber.isValid() || false;
}

// node_modules/libphonenumber-js/min/exports/parsePhoneNumberWithError.js
function parsePhoneNumberWithError3() {
  return withMetadataArgument(parsePhoneNumberWithError2, arguments);
}

// node_modules/libphonenumber-js/min/exports/isValidPhoneNumber.js
function isValidPhoneNumber2() {
  return withMetadataArgument(isValidPhoneNumber, arguments);
}

// server/sms.ts
function normalizePhoneNumber(phoneNumber) {
  try {
    if (phoneNumber.startsWith("+")) {
      if (isValidPhoneNumber2(phoneNumber)) {
        const parsed = parsePhoneNumberWithError3(phoneNumber);
        return parsed.format("E.164");
      }
      return null;
    }
    const cleaned = phoneNumber.replace(/\D/g, "");
    if (cleaned.length === 10) {
      const usNumber = `+1${cleaned}`;
      if (isValidPhoneNumber2(usNumber)) {
        return usNumber;
      }
    }
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      const usNumber = `+${cleaned}`;
      if (isValidPhoneNumber2(usNumber)) {
        return usNumber;
      }
    }
    if (isValidPhoneNumber2(phoneNumber, "US")) {
      const parsed = parsePhoneNumberWithError3(phoneNumber, "US");
      return parsed.format("E.164");
    }
    return null;
  } catch (error) {
    console.error("Phone number normalization error:", error);
    return null;
  }
}
async function sendSMS(to, message) {
  try {
    const enabled = await isTwilioEnabled();
    if (!enabled) {
      console.log("SMS sending skipped: Twilio is disabled in admin settings");
      return {
        success: false,
        error: "SMS notifications are disabled"
      };
    }
    const normalizedPhone = normalizePhoneNumber(to);
    if (!normalizedPhone) {
      console.warn(`Invalid phone number format: ${to}`);
      return {
        success: false,
        error: "Invalid phone number format"
      };
    }
    const client = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();
    if (!fromNumber) {
      throw new Error("Twilio phone number not configured");
    }
    const result2 = await client.messages.create({
      body: message,
      from: fromNumber,
      to: normalizedPhone
    });
    console.log(`SMS sent successfully to ${normalizedPhone}, SID: ${result2.sid}`);
    return {
      success: true,
      messageId: result2.sid
    };
  } catch (error) {
    console.error("Failed to send SMS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
async function sendBookingConfirmationSMS(phoneNumber, bookingId, pickupAddress, scheduledTime) {
  const message = `USA Luxury Limo - Booking Confirmed!

Booking ID: ${bookingId.substring(0, 8)}
Pickup: ${pickupAddress}
Time: ${scheduledTime.toLocaleString()}

Thank you for choosing USA Luxury Limo!`;
  return sendSMS(phoneNumber, message);
}
async function sendBookingStatusUpdateSMS(phoneNumber, bookingId, status) {
  const statusMessages = {
    confirmed: "Your booking has been confirmed and a driver will be assigned soon.",
    in_progress: "Your driver is on the way to pick you up!",
    completed: "Thank you for riding with USA Luxury Limo. We hope you enjoyed your trip!",
    cancelled: "Your booking has been cancelled. If you need assistance, please contact us."
  };
  const message = `USA Luxury Limo - Booking Update

Booking ID: ${bookingId.substring(0, 8)}
Status: ${status.toUpperCase()}

${statusMessages[status] || "Your booking status has been updated."}`;
  return sendSMS(phoneNumber, message);
}
async function sendDriverAssignmentSMS(phoneNumber, passengerName, pickupAddress, scheduledTime, driverPayment) {
  const paymentInfo = driverPayment ? `
Your Payment: $${driverPayment}` : "";
  const message = `USA Luxury Limo - New Ride Assignment

Passenger: ${passengerName}
Pickup: ${pickupAddress}
Time: ${scheduledTime.toLocaleString()}${paymentInfo}

Please check your driver dashboard for details.`;
  return sendSMS(phoneNumber, message);
}
async function sendTestSMS(phoneNumber) {
  const message = `USA Luxury Limo - Test SMS

This is a test message from your SMS notification system. If you received this, your Twilio integration is working correctly!`;
  return sendSMS(phoneNumber, message);
}
async function sendDriverOnTheWaySMS(phoneNumber, driverName, vehicleType, estimatedArrival) {
  const arrivalInfo = estimatedArrival ? `
ETA: ${estimatedArrival}` : "";
  const message = `USA Luxury Limo - Driver On The Way!

Your driver ${driverName} is heading to your pickup location in a ${vehicleType}.${arrivalInfo}

Please be ready!`;
  return sendSMS(phoneNumber, message);
}
async function sendDriverArrivedSMS(phoneNumber, driverName, vehicleType, pickupAddress) {
  const message = `USA Luxury Limo - Driver Arrived!

Your driver ${driverName} has arrived at ${pickupAddress}. Please proceed to your ${vehicleType}.

Thank you!`;
  return sendSMS(phoneNumber, message);
}
async function sendBookingCancelledSMS(phoneNumber, bookingId) {
  const message = `USA Luxury Limo - Booking Cancelled

Booking ID: ${bookingId.substring(0, 8)}

Your booking has been cancelled. For assistance, please contact us.`;
  return sendSMS(phoneNumber, message);
}
async function sendAdminNewBookingAlertSMS(phoneNumber, bookingId, passengerName, pickupAddress, scheduledTime, totalAmount) {
  const message = `USA Limo - NEW BOOKING

ID: ${bookingId.substring(0, 8)}
Passenger: ${passengerName}
Pickup: ${pickupAddress}
Time: ${scheduledTime.toLocaleString()}
Amount: $${totalAmount}

Check admin dashboard for details.`;
  return sendSMS(phoneNumber, message);
}
async function sendPasswordResetSMS(phone, resetToken) {
  const resetUrl = `${process.env.REPLIT_DEV_DOMAIN || "http://localhost:5000"}/reset-password?token=${resetToken}`;
  const message = `USA Luxury Limo: Reset your password using this link: ${resetUrl} (expires in 1 hour). If you didn't request this, ignore this message.`;
  return sendSMS(phone, message);
}
async function sendTemporaryPasswordSMS(phone, tempPassword) {
  const message = `USA Luxury Limo: Your temporary password is: ${tempPassword}. Please change it after logging in.`;
  return sendSMS(phone, message);
}
async function sendUsernameReminderSMS(phone, username) {
  const message = `USA Luxury Limo: Your username is: ${username}`;
  return sendSMS(phone, message);
}

// server/emailReports.ts
async function getSystemAdminEmail() {
  try {
    const setting = await storage.getSystemSetting("SYSTEM_ADMIN_EMAIL");
    return setting?.value || null;
  } catch (error) {
    console.error("Error fetching system admin email:", error);
    return null;
  }
}
async function sendNewBookingReport(booking, passenger, vehicleTypeName) {
  try {
    const adminEmail = await getSystemAdminEmail();
    if (!adminEmail) {
      console.log("[EMAIL REPORT] System admin email not configured - skipping new booking report");
      return;
    }
    const scheduledDate = new Date(booking.scheduledDateTime).toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short"
    });
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
            .report-section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
            .info-item { padding: 12px; background: #f8fafc; border-radius: 4px; }
            .info-label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
            .info-value { color: #1e293b; font-size: 16px; }
            .route-section { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .amount-badge { background: #dcfce7; color: #166534; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">\u{1F4CB} New Booking Created</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">System Admin Report</p>
            </div>
            <div class="content">
              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Booking Details</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Booking ID</div>
                    <div class="info-value">${booking.id}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Status</div>
                    <div class="info-value" style="color: #2563eb;">\u23F3 ${booking.status?.toUpperCase() || "PENDING"}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Scheduled Date & Time</div>
                    <div class="info-value">${scheduledDate}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Service Type</div>
                    <div class="info-value">${booking.bookingType === "transfer" ? "\u{1F697} Transfer" : "\u23F1\uFE0F Hourly"}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Vehicle Type</div>
                    <div class="info-value">${vehicleTypeName}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Passengers</div>
                    <div class="info-value">${booking.passengerCount || 1}</div>
                  </div>
                </div>

                ${booking.requestedHours ? `
                <div class="info-item" style="margin-top: 10px;">
                  <div class="info-label">Duration</div>
                  <div class="info-value">${booking.requestedHours} hours</div>
                </div>
                ` : ""}
              </div>

              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Passenger Information</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Name</div>
                    <div class="info-value">${passenger.firstName} ${passenger.lastName}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value"><a href="mailto:${passenger.email}">${passenger.email}</a></div>
                  </div>
                  ${passenger.phone ? `
                  <div class="info-item">
                    <div class="info-label">Phone</div>
                    <div class="info-value"><a href="tel:${passenger.phone}">${passenger.phone}</a></div>
                  </div>
                  ` : ""}
                </div>
              </div>

              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Route Details</h3>
                <div class="route-section">
                  <div style="margin-bottom: 15px;">
                    <div class="info-label">\u{1F4CD} Pickup Location</div>
                    <div class="info-value">${booking.pickupAddress}</div>
                  </div>
                  ${booking.destinationAddress ? `
                  <div>
                    <div class="info-label">\u{1F3AF} Destination</div>
                    <div class="info-value">${booking.destinationAddress}</div>
                  </div>
                  ` : ""}
                </div>
                ${booking.estimatedDistance ? `
                <div class="info-item">
                  <div class="info-label">Estimated Distance</div>
                  <div class="info-value">${Number(booking.estimatedDistance).toFixed(2)} miles</div>
                </div>
                ` : ""}
              </div>

              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Pricing Information</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Base Fare</div>
                    <div class="info-value">$${booking.baseFare || "0.00"}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Payment Status</div>
                    <div class="info-value">${booking.paymentStatus === "paid" ? "\u2705 Paid" : booking.paymentStatus === "failed" ? "\u274C Failed" : booking.paymentStatus === "refunded" ? "\u{1F4B0} Refunded" : "\u23F3 Pending"}</div>
                  </div>
                </div>
                <div class="amount-badge">
                  \u{1F4B0} Total Amount: $${booking.totalAmount}
                </div>
              </div>

              ${booking.specialInstructions ? `
              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Special Instructions</h3>
                <div style="background: #fef3c7; padding: 15px; border-radius: 4px;">
                  ${booking.specialInstructions}
                </div>
              </div>
              ` : ""}

              ${booking.flightNumber ? `
              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Flight Information</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Flight Number</div>
                    <div class="info-value">\u2708\uFE0F ${booking.flightNumber}</div>
                  </div>
                  ${booking.flightArrival ? `
                  <div class="info-item">
                    <div class="info-label">Arrival Time</div>
                    <div class="info-value">${booking.flightArrival}</div>
                  </div>
                  ` : ""}
                </div>
              </div>
              ` : ""}
            </div>
            <div class="footer">
              <p><strong>USA Luxury Limo - Admin Dashboard</strong></p>
              <p>Report generated at: ${(/* @__PURE__ */ new Date()).toLocaleString()}</p>
              <p style="margin-top: 10px;">This is an automated system report for new booking notifications.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    await sendEmail({
      to: adminEmail,
      subject: `\u{1F195} New Booking #${booking.id.slice(0, 8)} - ${passenger.firstName} ${passenger.lastName}`,
      html
    });
    console.log(`[EMAIL REPORT] New booking report sent to ${adminEmail}`);
  } catch (error) {
    console.error("[EMAIL REPORT] Error sending new booking report:", error);
  }
}
async function sendCancelledBookingReport(booking, passenger, vehicleTypeName, cancelledBy, reason) {
  try {
    const adminEmail = await getSystemAdminEmail();
    if (!adminEmail) {
      console.log("[EMAIL REPORT] System admin email not configured - skipping cancellation report");
      return;
    }
    const scheduledDate = new Date(booking.scheduledDateTime).toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short"
    });
    const cancelReason = reason || "No reason provided";
    const cancelledByText = cancelledBy === "system" ? "Automatic System" : cancelledBy === "driver" ? "Driver" : "Passenger";
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
            .report-section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
            .alert-box { background: #fee2e2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
            .info-item { padding: 12px; background: #f8fafc; border-radius: 4px; }
            .info-label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
            .info-value { color: #1e293b; font-size: 16px; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">\u274C Booking Cancelled</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">System Admin Report</p>
            </div>
            <div class="content">
              <div class="alert-box">
                <h3 style="margin-top: 0; color: #dc2626;">Cancellation Details</h3>
                <div class="info-grid">
                  <div class="info-item" style="background: #fef2f2;">
                    <div class="info-label">Cancelled By</div>
                    <div class="info-value" style="color: #dc2626; font-weight: bold;">${cancelledByText}</div>
                  </div>
                  <div class="info-item" style="background: #fef2f2;">
                    <div class="info-label">Cancelled At</div>
                    <div class="info-value">${(/* @__PURE__ */ new Date()).toLocaleString()}</div>
                  </div>
                </div>
                <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 4px;">
                  <div class="info-label">Reason</div>
                  <div class="info-value">${cancelReason}</div>
                </div>
              </div>

              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Booking Information</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Booking ID</div>
                    <div class="info-value">${booking.id}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Scheduled Date & Time</div>
                    <div class="info-value">${scheduledDate}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Service Type</div>
                    <div class="info-value">${booking.bookingType === "transfer" ? "\u{1F697} Transfer" : "\u23F1\uFE0F Hourly"}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Vehicle Type</div>
                    <div class="info-value">${vehicleTypeName}</div>
                  </div>
                </div>
              </div>

              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Passenger Information</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Name</div>
                    <div class="info-value">${passenger.firstName} ${passenger.lastName}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value"><a href="mailto:${passenger.email}">${passenger.email}</a></div>
                  </div>
                  ${passenger.phone ? `
                  <div class="info-item">
                    <div class="info-label">Phone</div>
                    <div class="info-value"><a href="tel:${passenger.phone}">${passenger.phone}</a></div>
                  </div>
                  ` : ""}
                </div>
              </div>

              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Route Details</h3>
                <div style="background: #fef3c7; padding: 15px; border-radius: 8px;">
                  <div style="margin-bottom: 15px;">
                    <div class="info-label">\u{1F4CD} Pickup Location</div>
                    <div class="info-value">${booking.pickupAddress}</div>
                  </div>
                  ${booking.destinationAddress ? `
                  <div>
                    <div class="info-label">\u{1F3AF} Destination</div>
                    <div class="info-value">${booking.destinationAddress}</div>
                  </div>
                  ` : ""}
                </div>
              </div>

              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Financial Impact</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Total Amount</div>
                    <div class="info-value">$${booking.totalAmount}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Payment Status</div>
                    <div class="info-value">${booking.paymentStatus === "paid" ? "\u2705 Paid" : booking.paymentStatus === "failed" ? "\u274C Failed" : booking.paymentStatus === "refunded" ? "\u{1F4B0} Refunded" : "\u23F3 Pending"}</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="footer">
              <p><strong>USA Luxury Limo - Admin Dashboard</strong></p>
              <p>Report generated at: ${(/* @__PURE__ */ new Date()).toLocaleString()}</p>
              <p style="margin-top: 10px;">This is an automated system report for booking cancellations.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    await sendEmail({
      to: adminEmail,
      subject: `\u274C Booking Cancelled #${booking.id.slice(0, 8)} - ${cancelledByText}`,
      html
    });
    console.log(`[EMAIL REPORT] Cancellation report sent to ${adminEmail}`);
  } catch (error) {
    console.error("[EMAIL REPORT] Error sending cancellation report:", error);
  }
}
async function sendDriverActivityReport(activity) {
  try {
    const adminEmail = await getSystemAdminEmail();
    if (!adminEmail) {
      console.log("[EMAIL REPORT] System admin email not configured - skipping driver activity report");
      return;
    }
    const activityLabels = {
      acceptance: { icon: "\u2705", text: "Job Accepted", color: "#16a34a" },
      decline: { icon: "\u274C", text: "Job Declined", color: "#dc2626" },
      on_the_way: { icon: "\u{1F697}", text: "On The Way", color: "#2563eb" },
      arrived: { icon: "\u{1F4CD}", text: "Arrived at Pickup", color: "#7c3aed" },
      on_board: { icon: "\u{1F465}", text: "Passenger On Board", color: "#ea580c" },
      completed: { icon: "\u{1F3C1}", text: "Trip Completed", color: "#059669" }
    };
    const activityInfo = activityLabels[activity.type];
    const scheduledDate = new Date(activity.booking.scheduledDateTime).toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short"
    });
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, ${activityInfo.color} 0%, ${activityInfo.color}dd 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
            .report-section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${activityInfo.color}; }
            .activity-badge { background: ${activityInfo.color}20; border: 2px solid ${activityInfo.color}; color: ${activityInfo.color}; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; font-size: 20px; font-weight: bold; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
            .info-item { padding: 12px; background: #f8fafc; border-radius: 4px; }
            .info-label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
            .info-value { color: #1e293b; font-size: 16px; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">${activityInfo.icon} Driver Activity</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">System Admin Report</p>
            </div>
            <div class="content">
              <div class="activity-badge">
                ${activityInfo.icon} ${activityInfo.text}
              </div>

              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Activity Details</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Activity Type</div>
                    <div class="info-value" style="color: ${activityInfo.color};">${activityInfo.text}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Timestamp</div>
                    <div class="info-value">${activity.timestamp.toLocaleString()}</div>
                  </div>
                </div>
                ${activity.details ? `
                <div style="margin-top: 15px; padding: 15px; background: #fef3c7; border-radius: 4px;">
                  <div class="info-label">Additional Details</div>
                  <div class="info-value">${activity.details}</div>
                </div>
                ` : ""}
              </div>

              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Driver Information</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Driver Name</div>
                    <div class="info-value">${activity.driver.firstName} ${activity.driver.lastName}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Driver Email</div>
                    <div class="info-value"><a href="mailto:${activity.driver.email}">${activity.driver.email}</a></div>
                  </div>
                  ${activity.driver.phone ? `
                  <div class="info-item">
                    <div class="info-label">Driver Phone</div>
                    <div class="info-value"><a href="tel:${activity.driver.phone}">${activity.driver.phone}</a></div>
                  </div>
                  ` : ""}
                </div>
              </div>

              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Booking Details</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Booking ID</div>
                    <div class="info-value">${activity.booking.id}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Scheduled Date & Time</div>
                    <div class="info-value">${scheduledDate}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Vehicle Type</div>
                    <div class="info-value">${activity.vehicleTypeName}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Service Type</div>
                    <div class="info-value">${activity.booking.bookingType === "transfer" ? "\u{1F697} Transfer" : "\u23F1\uFE0F Hourly"}</div>
                  </div>
                </div>
              </div>

              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Passenger Information</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Name</div>
                    <div class="info-value">${activity.passenger.firstName} ${activity.passenger.lastName}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value"><a href="mailto:${activity.passenger.email}">${activity.passenger.email}</a></div>
                  </div>
                  ${activity.passenger.phone ? `
                  <div class="info-item">
                    <div class="info-label">Phone</div>
                    <div class="info-value"><a href="tel:${activity.passenger.phone}">${activity.passenger.phone}</a></div>
                  </div>
                  ` : ""}
                </div>
              </div>

              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Route Details</h3>
                <div style="background: #fef3c7; padding: 15px; border-radius: 8px;">
                  <div style="margin-bottom: 15px;">
                    <div class="info-label">\u{1F4CD} Pickup Location</div>
                    <div class="info-value">${activity.booking.pickupAddress}</div>
                  </div>
                  ${activity.booking.destinationAddress ? `
                  <div>
                    <div class="info-label">\u{1F3AF} Destination</div>
                    <div class="info-value">${activity.booking.destinationAddress}</div>
                  </div>
                  ` : ""}
                </div>
              </div>
            </div>
            <div class="footer">
              <p><strong>USA Luxury Limo - Admin Dashboard</strong></p>
              <p>Report generated at: ${(/* @__PURE__ */ new Date()).toLocaleString()}</p>
              <p style="margin-top: 10px;">This is an automated system report for driver activity tracking.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    await sendEmail({
      to: adminEmail,
      subject: `${activityInfo.icon} Driver Activity: ${activityInfo.text} - Booking #${activity.booking.id.slice(0, 8)}`,
      html
    });
    console.log(`[EMAIL REPORT] Driver activity report sent to ${adminEmail}`);
  } catch (error) {
    console.error("[EMAIL REPORT] Error sending driver activity report:", error);
  }
}

// server/routes.ts
import { eq as eq2 } from "drizzle-orm";
import { S3Client as S3Client2, HeadBucketCommand as HeadBucketCommand2, ListBucketsCommand } from "@aws-sdk/client-s3";
var stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
if (!stripe) {
  console.warn("[STRIPE] Warning: STRIPE_SECRET_KEY not configured. Payment features will be disabled.");
}
var objectStorage = null;
var lastCredentialCheck = 0;
var CREDENTIAL_CACHE_MS = 6e4;
async function getObjectStorage() {
  const now = Date.now();
  if (objectStorage && now - lastCredentialCheck < CREDENTIAL_CACHE_MS) {
    return objectStorage;
  }
  try {
    let credentials = {};
    try {
      const endpointSetting = await storage.getSetting("MINIO_ENDPOINT");
      const accessKeySetting = await storage.getSetting("MINIO_ACCESS_KEY");
      const secretKeySetting = await storage.getSetting("MINIO_SECRET_KEY");
      const bucketSetting = await storage.getSetting("MINIO_BUCKET");
      const endpoint = endpointSetting?.value?.trim();
      const accessKey = accessKeySetting?.value?.trim();
      const secretKey = secretKeySetting?.value?.trim();
      const bucket = bucketSetting?.value?.trim();
      if (endpoint && accessKey && secretKey) {
        const effectiveBucket = bucket && bucket !== "" ? bucket : "usa-luxury-limo";
        credentials = {
          minioEndpoint: endpoint,
          minioAccessKey: accessKey,
          minioSecretKey: secretKey,
          minioBucket: effectiveBucket
        };
        console.log(`[STORAGE] Using MinIO credentials from database, bucket: ${effectiveBucket}`);
      }
    } catch (dbError) {
      console.log("[STORAGE] Could not fetch credentials from database, using environment variables");
    }
    objectStorage = getStorageAdapter(credentials);
    lastCredentialCheck = now;
    return objectStorage;
  } catch (error) {
    console.error("[STORAGE] Failed to initialize storage adapter:", error.message);
    throw new Error("Object Storage not configured. Please set up storage in admin settings or environment variables.");
  }
}
function refreshObjectStorage() {
  objectStorage = null;
  lastCredentialCheck = 0;
}
async function getPresignedUrl(pathOrUrl) {
  if (!pathOrUrl) return "";
  let storageKey;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    storageKey = extractStorageKey(pathOrUrl);
  } else {
    storageKey = pathOrUrl.startsWith("/") ? pathOrUrl.slice(1) : pathOrUrl;
  }
  try {
    const objStorage = await getObjectStorage();
    const result2 = await objStorage.getDownloadUrl(storageKey);
    if (result2.ok && result2.url) {
      return result2.url;
    }
    console.warn(`Failed to generate presigned URL for ${storageKey}:`, result2.error);
    return pathOrUrl;
  } catch (error) {
    console.error(`Error generating presigned URL for ${storageKey}:`, error);
    return pathOrUrl;
  }
}
function extractStorageKey(urlOrPath) {
  try {
    if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
      const url = new URL(urlOrPath);
      let pathname = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
      const bucketName = process.env.MINIO_BUCKET || "replit";
      if (pathname.startsWith(bucketName + "/")) {
        pathname = pathname.slice(bucketName.length + 1);
      }
      return pathname;
    }
    return urlOrPath.startsWith("/") ? urlOrPath.slice(1) : urlOrPath;
  } catch (error) {
    return urlOrPath.startsWith("/") ? urlOrPath.slice(1) : urlOrPath;
  }
}
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024
    // 2MB file size limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif"
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF and image files (JPEG, PNG, WEBP, HEIC) are allowed."));
    }
  }
});
var requireAdminHostname = (req, res, next) => {
  const allowedHosts = process.env.ADMIN_PANEL_HOSTS?.split(",").map((h) => h.trim().toLowerCase()) || [];
  if (allowedHosts.length === 0 || process.env.NODE_ENV === "development") {
    return next();
  }
  const currentHost = req.hostname?.toLowerCase() || req.get("host")?.split(":")[0]?.toLowerCase();
  const isAdminSubdomain = currentHost?.startsWith("adminaccess.") || allowedHosts.some((host) => currentHost === host);
  if (!isAdminSubdomain) {
    return res.status(403).json({
      message: "Access denied. Admin panel is only accessible via the designated subdomain."
    });
  }
  next();
};
var requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    req.adminUser = user;
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ message: "Authorization check failed" });
  }
};
async function getTomTomApiKey(storage2) {
  try {
    const dbSetting = await storage2.getSystemSetting("TOMTOM_API_KEY");
    if (dbSetting?.value) {
      return dbSetting.value;
    }
    if (process.env.TOMTOM_API_KEY) {
      return process.env.TOMTOM_API_KEY;
    }
    return null;
  } catch (error) {
    console.error("Failed to retrieve TomTom API key:", error);
    return null;
  }
}
async function getRapidApiKey(storage2) {
  try {
    const dbSetting = await storage2.getSystemSetting("RAPIDAPI_KEY");
    if (dbSetting?.value) {
      return dbSetting.value;
    }
    if (process.env.RAPIDAPI_KEY) {
      return process.env.RAPIDAPI_KEY;
    }
    return null;
  } catch (error) {
    console.error("Failed to retrieve RapidAPI key:", error);
    return null;
  }
}
async function geocodeAddress(address, storage2) {
  try {
    const apiKey = await getTomTomApiKey(storage2);
    if (!apiKey) {
      console.warn("TomTom API key not configured");
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
      const result2 = data.results[0];
      return {
        lat: result2.position.lat,
        lon: result2.position.lon
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}
async function calculateRoute(fromCoords, toCoords, storage2) {
  try {
    const apiKey = await getTomTomApiKey(storage2);
    if (!apiKey) {
      console.warn("TomTom API key not configured");
      return null;
    }
    const url = `https://api.tomtom.com/routing/1/calculateRoute/${fromCoords.lat},${fromCoords.lon}:${toCoords.lat},${toCoords.lon}/json?key=${apiKey}&routeType=fastest&traffic=true`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TomTom routing failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Route calculation error:", error);
    return null;
  }
}
async function registerRoutes(app2) {
  await setupAuth(app2);
  app2.use("/api/admin", requireAdminHostname);
  app2.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime()
    });
  });
  app2.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime()
    });
  });
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const profileImageUrl = await getPresignedUrl(user.profileImageUrl);
      res.json({
        ...user,
        profileImageUrl
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user.id;
      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role
      });
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { emailOrPhone } = req.body;
      if (!emailOrPhone) {
        return res.status(400).json({ message: "Email or phone number required" });
      }
      const uniformResponse = { message: "If an account exists, a password reset link has been sent" };
      const user = await storage.getUserByEmailOrPhone(emailOrPhone);
      if (user) {
        const resetToken = generateResetToken();
        const hashedToken = hashToken(resetToken);
        const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);
        await storage.setPasswordResetToken(user.id, hashedToken, expiresAt);
        if (user.email) {
          sendPasswordResetEmail(user.email, resetToken, user.username).catch(
            (err) => console.error("Failed to send password reset email:", err)
          );
        } else if (user.phone) {
          sendPasswordResetSMS(user.phone, resetToken).catch(
            (err) => console.error("Failed to send password reset SMS:", err)
          );
        }
      }
      res.status(202).json(uniformResponse);
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(202).json({ message: "If an account exists, a password reset link has been sent" });
    }
  });
  app2.post("/api/auth/forgot-username", async (req, res) => {
    try {
      const { emailOrPhone } = req.body;
      if (!emailOrPhone) {
        return res.status(400).json({ message: "Email or phone number required" });
      }
      const uniformResponse = { message: "If an account exists, your username has been sent" };
      const user = await storage.getUserByEmailOrPhone(emailOrPhone);
      if (user) {
        if (user.email) {
          sendUsernameReminderEmail(user.email, user.username).catch(
            (err) => console.error("Failed to send username reminder email:", err)
          );
        } else if (user.phone) {
          sendUsernameReminderSMS(user.phone, user.username).catch(
            (err) => console.error("Failed to send username reminder SMS:", err)
          );
        }
      }
      res.status(202).json(uniformResponse);
    } catch (error) {
      console.error("Error in forgot username:", error);
      res.status(202).json({ message: "If an account exists, your username has been sent" });
    }
  });
  app2.get("/api/auth/verify-reset-token/:token", async (req, res) => {
    try {
      const { token } = req.params;
      if (!token) {
        return res.status(400).json({ valid: false, message: "Token required" });
      }
      const hashedToken = hashToken(token);
      const user = await storage.getUserByPasswordResetToken(hashedToken);
      if (!user || !user.passwordResetExpires) {
        return res.json({ valid: false, message: "Invalid or expired reset token" });
      }
      if (isTokenExpired(user.passwordResetExpires)) {
        return res.json({ valid: false, message: "Reset token has expired" });
      }
      res.json({ valid: true, message: "Token is valid" });
    } catch (error) {
      console.error("Error verifying reset token:", error);
      res.status(500).json({ valid: false, message: "Failed to verify token" });
    }
  });
  app2.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const hashedToken = hashToken(token);
      const user = await storage.getUserByPasswordResetToken(hashedToken);
      if (!user || !user.passwordResetExpires) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      if (isTokenExpired(user.passwordResetExpires)) {
        return res.status(400).json({ message: "Reset token has expired" });
      }
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(user.id, { password: hashedPassword });
      await storage.clearPasswordResetToken(user.id);
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  app2.patch("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const updateSchema = z3.object({
        firstName: z3.string().min(1, "First name is required"),
        lastName: z3.string().min(1, "Last name is required"),
        email: z3.string().email("Invalid email address"),
        phone: z3.string().optional(),
        username: z3.string().min(3, "Username must be at least 3 characters").max(30, "Username cannot exceed 30 characters").regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens").optional()
      });
      const validatedData = updateSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "Email is already in use" });
      }
      if (validatedData.username) {
        const existingUsername = await storage.getUserByUsername(validatedData.username);
        if (existingUsername && existingUsername.id !== userId) {
          return res.status(400).json({ message: "Username is already taken" });
        }
      }
      const updatedUser = await storage.updateUser(userId, validatedData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  app2.patch("/api/user/password", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const passwordSchema = z3.object({
        currentPassword: z3.string().min(1, "Current password is required"),
        newPassword: z3.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[a-z]/, "Password must contain at least one lowercase letter").regex(/[0-9]/, "Password must contain at least one number")
      });
      const { currentPassword, newPassword } = passwordSchema.parse(req.body);
      const user = await storage.getUser(userId);
      if (!user || !user.password) {
        return res.status(404).json({ message: "User not found or not using local authentication" });
      }
      const isValidPassword = await comparePasswords(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUser(userId, { password: hashedPassword });
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });
  app2.get("/api/user/check-username/:username", isAuthenticated, async (req, res) => {
    try {
      const { username } = req.params;
      const userId = req.user.id;
      const usernameRegex = /^[a-zA-Z0-9_-]+$/;
      if (!usernameRegex.test(username) || username.length < 3 || username.length > 30) {
        return res.status(400).json({
          available: false,
          message: "Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens"
        });
      }
      const existingUser = await storage.getUserByUsername(username);
      const available = !existingUser || existingUser.id === userId;
      res.json({
        available,
        message: available ? "Username is available" : "Username is already taken"
      });
    } catch (error) {
      console.error("Error checking username:", error);
      res.status(500).json({ available: false, message: "Failed to check username" });
    }
  });
  app2.post("/api/user/profile-picture", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      const userId = req.user.id;
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const file = req.file;
      const fileExtension = file.originalname.split(".").pop();
      const fileName = `profile-pictures/${userId}/profile-${Date.now()}.${fileExtension}`;
      const objStorage = await getObjectStorage();
      const { ok, error } = await objStorage.uploadFromBytes(
        fileName,
        file.buffer
      );
      if (!ok) {
        console.error("Upload to Object Storage failed:", error);
        return res.status(500).json({ message: "Failed to upload image" });
      }
      const imageUrl = fileName;
      const updatedUser = await storage.updateUser(userId, {
        profileImageUrl: imageUrl
      });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Profile picture upload error:", error);
      res.status(500).json({ message: "Failed to upload profile picture" });
    }
  });
  app2.get("/api/vehicle-types", async (req, res) => {
    try {
      const vehicleTypes2 = await storage.getVehicleTypes();
      const vehicleTypesWithUrls = await Promise.all(
        vehicleTypes2.map(async (vt) => ({
          ...vt,
          imageUrl: await getPresignedUrl(vt.imageUrl)
        }))
      );
      res.json(vehicleTypesWithUrls);
    } catch (error) {
      console.error("Error fetching vehicle types:", error);
      res.status(500).json({ message: "Failed to fetch vehicle types" });
    }
  });
  app2.get("/api/admin/vehicle-types", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const vehicleTypes2 = await storage.getAllVehicleTypes();
      const vehicleTypesWithUrls = await Promise.all(
        vehicleTypes2.map(async (vt) => ({
          ...vt,
          imageUrl: await getPresignedUrl(vt.imageUrl)
        }))
      );
      res.json(vehicleTypesWithUrls);
    } catch (error) {
      console.error("Error fetching all vehicle types:", error);
      res.status(500).json({ message: "Failed to fetch vehicle types" });
    }
  });
  app2.post("/api/admin/vehicle-types", requireAdmin, async (req, res) => {
    try {
      const vehicleTypeData = insertVehicleTypeSchema.parse(req.body);
      const vehicleType = await storage.createVehicleType(vehicleTypeData);
      res.status(201).json(vehicleType);
    } catch (error) {
      console.error("Error creating vehicle type:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid vehicle type data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create vehicle type" });
    }
  });
  app2.put("/api/admin/vehicle-types/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertVehicleTypeSchema.partial().parse(req.body);
      const vehicleType = await storage.updateVehicleType(id, updates);
      if (!vehicleType) {
        return res.status(404).json({ message: "Vehicle type not found" });
      }
      res.json(vehicleType);
    } catch (error) {
      console.error("Error updating vehicle type:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid vehicle type data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update vehicle type" });
    }
  });
  app2.delete("/api/admin/vehicle-types/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const vehicleType = await storage.getVehicleType(id);
      if (!vehicleType) {
        return res.status(404).json({ message: "Vehicle type not found" });
      }
      await storage.deleteVehicleType(id);
      res.json({ message: "Vehicle type deleted successfully" });
    } catch (error) {
      console.error("Error deleting vehicle type:", error);
      res.status(500).json({ message: "Failed to delete vehicle type" });
    }
  });
  app2.get("/api/services", async (req, res) => {
    try {
      const services2 = await storage.getActiveServices();
      res.json(services2);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });
  app2.get("/api/admin/services", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const services2 = await storage.getAllServices();
      res.json(services2);
    } catch (error) {
      console.error("Error fetching all services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });
  app2.post("/api/admin/services", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create service" });
    }
  });
  app2.patch("/api/admin/services/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(id, updates);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update service" });
    }
  });
  app2.delete("/api/admin/services/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      await storage.deleteService(id);
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });
  app2.post("/api/admin/services/:id/upload-image", isAuthenticated, requireAdmin, upload.single("image"), async (req, res) => {
    try {
      const { id } = req.params;
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      const objectStorage2 = await getObjectStorage();
      const fileName = `cms/services/${id}-${Date.now()}.${req.file.mimetype.split("/")[1]}`;
      const uploadResult = await objectStorage2.uploadFromBytes(fileName, req.file.buffer, { contentType: req.file.mimetype });
      if (!uploadResult.ok) {
        return res.status(500).json({ message: `Failed to upload image: ${uploadResult.error}` });
      }
      const urlResult = await objectStorage2.getDownloadUrl(fileName);
      if (!urlResult.ok || !urlResult.url) {
        return res.status(500).json({ message: `Failed to get download URL: ${urlResult.error}` });
      }
      const updatedService = await storage.updateService(id, { imageUrl: urlResult.url });
      res.json(updatedService);
    } catch (error) {
      console.error("Error uploading service image:", error);
      res.status(500).json({ message: "Failed to upload service image" });
    }
  });
  app2.get("/api/flights/search", async (req, res) => {
    const { flightNumber, date } = req.query;
    if (!flightNumber || typeof flightNumber !== "string") {
      return res.status(400).json({ error: "Flight number is required" });
    }
    let timeoutId;
    try {
      const apiKey = await getRapidApiKey(storage);
      if (!apiKey) {
        return res.status(500).json({ error: "RapidAPI key not configured" });
      }
      if (date && typeof date === "string") {
        const detailedUrl = `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(flightNumber)}/${date}`;
        const controller2 = new AbortController();
        timeoutId = setTimeout(() => controller2.abort(), 2e4);
        const detailedOptions = {
          method: "GET",
          headers: {
            "x-rapidapi-key": apiKey,
            "x-rapidapi-host": "aerodatabox.p.rapidapi.com"
          },
          signal: controller2.signal
        };
        try {
          const detailedResponse = await fetch(detailedUrl, detailedOptions);
          if (detailedResponse.ok) {
            const detailedData = await detailedResponse.json();
            return res.json(detailedData);
          }
        } catch (error) {
          console.log("Detailed flight search failed, falling back to simple search");
        }
      }
      const url = `https://aerodatabox.p.rapidapi.com/flights/search/term?q=${encodeURIComponent(flightNumber)}`;
      const controller = new AbortController();
      if (!timeoutId) {
        timeoutId = setTimeout(() => controller.abort(), 2e4);
      }
      const options = {
        method: "GET",
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "aerodatabox.p.rapidapi.com"
        },
        signal: controller.signal
      };
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("AeroDataBox API error:", response.status, errorText);
        if (response.status === 504 || response.status === 503) {
          return res.status(response.status).json({
            error: "Flight search service is currently unavailable. Please try again in a moment."
          });
        } else if (response.status === 401 || response.status === 403) {
          return res.status(500).json({
            error: "Flight search API authentication failed. Please contact support."
          });
        } else if (response.status === 429) {
          return res.status(429).json({
            error: "Too many flight search requests. Please wait a moment and try again."
          });
        }
        return res.status(response.status).json({ error: "Flight search failed" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Flight search error:", error);
      if (error.name === "AbortError") {
        return res.status(504).json({
          error: "Flight search timed out. The service may be slow or unavailable. Please try again."
        });
      }
      res.status(500).json({ error: "Flight search service temporarily unavailable" });
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  });
  app2.get("/api/geocode", async (req, res) => {
    const { q, limit = 5 } = req.query;
    if (!q || typeof q !== "string") {
      return res.status(400).json({ error: "Query parameter is required" });
    }
    try {
      const apiKey = await getTomTomApiKey(storage);
      if (!apiKey) {
        return res.status(500).json({ error: "TomTom API key not configured" });
      }
      const url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(q)}.json?key=${apiKey}&limit=${limit}&countrySet=US&typeahead=true`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`TomTom API error: ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Geocoding error:", error);
      res.status(500).json({ error: "Geocoding service temporarily unavailable" });
    }
  });
  app2.post("/api/calculate-distance", async (req, res) => {
    const { origins, destinations } = req.body;
    if (!origins || !destinations) {
      return res.status(400).json({ error: "Origins and destinations are required" });
    }
    const validateCoordinates = (coords) => {
      const parts = coords.split(",");
      if (parts.length !== 2) return false;
      const lat = parseFloat(parts[0]);
      const lon = parseFloat(parts[1]);
      return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
    };
    if (!validateCoordinates(origins) || !validateCoordinates(destinations)) {
      return res.status(400).json({ error: 'Invalid coordinate format. Expected: "lat,lon"' });
    }
    try {
      const apiKey = await getTomTomApiKey(storage);
      if (!apiKey) {
        return res.status(500).json({ error: "TomTom API key not configured" });
      }
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
          distance: (distanceInMeters * 621371e-9).toFixed(2),
          // Convert to miles
          duration: Math.ceil(timeInSeconds / 60),
          // Convert to minutes
          route
        });
      } else {
        res.status(404).json({ error: "No route found" });
      }
    } catch (error) {
      console.error("Distance calculation error:", error);
      res.status(500).json({ error: "Distance calculation service temporarily unavailable" });
    }
  });
  app2.post("/api/calculate-quote", isAuthenticated, async (req, res) => {
    try {
      const { vehicleTypeId, bookingType, distance, duration, hours } = req.body;
      const vehicleType = await storage.getVehicleType(vehicleTypeId);
      if (!vehicleType) {
        return res.status(404).json({ error: "Vehicle type not found" });
      }
      let totalAmount = 0;
      let breakdown = {};
      if (bookingType === "transfer") {
        const baseFare = parseFloat(vehicleType.minimumFare || "0");
        const parsedDistance = parseFloat(distance || "0");
        const perMileRate = parseFloat(vehicleType.perMileRate || "0");
        if (isNaN(baseFare) || isNaN(parsedDistance) || isNaN(perMileRate)) {
          return res.status(400).json({ error: "Invalid pricing data" });
        }
        const distanceFare = perMileRate * parsedDistance;
        breakdown = {
          baseFare,
          distanceFare,
          distance: parsedDistance,
          perMileRate
        };
        totalAmount = baseFare + distanceFare;
      } else if (bookingType === "hourly") {
        const hourlyRate = parseFloat(vehicleType.hourlyRate);
        const requestedHours = parseInt(hours || "2", 10);
        if (isNaN(hourlyRate) || isNaN(requestedHours) || requestedHours < 1) {
          return res.status(400).json({ error: "Invalid pricing data" });
        }
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
      console.error("Quote calculation error:", error);
      res.status(500).json({ message: "Failed to calculate quote" });
    }
  });
  app2.post("/api/bookings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        passengerId: userId,
        bookedBy: "passenger",
        bookedAt: /* @__PURE__ */ new Date()
      });
      const booking = await storage.createBooking(bookingData);
      (async () => {
        try {
          const passenger = await storage.getUser(userId);
          const vehicleType = await storage.getVehicleType(booking.vehicleTypeId);
          if (passenger && vehicleType) {
            await sendNewBookingReport(booking, passenger, vehicleType.name || "Unknown Vehicle");
            const scheduledDateTime = new Date(booking.scheduledDateTime).toLocaleString("en-US", {
              dateStyle: "full",
              timeStyle: "short"
            });
            await sendEmail({
              to: passenger.email,
              subject: `Booking Confirmation - USA Luxury Limo #${booking.id.slice(0, 8)}`,
              html: getBookingConfirmationEmailHTML({
                passengerName: `${passenger.firstName || ""} ${passenger.lastName || ""}`.trim() || passenger.username || "Valued Customer",
                bookingId: booking.id.slice(0, 8),
                pickupAddress: booking.pickupAddress,
                destinationAddress: booking.destinationAddress || "N/A",
                scheduledDateTime,
                vehicleType: vehicleType.name || "Luxury Vehicle",
                totalAmount: booking.totalAmount || "0.00",
                status: booking.status || "pending"
              })
            });
            if (passenger.phone) {
              await sendBookingConfirmationSMS(
                passenger.phone,
                booking.id,
                booking.pickupAddress,
                new Date(booking.scheduledDateTime)
              );
            }
            const adminEmailSetting = await storage.getSystemSetting("SYSTEM_ADMIN_EMAIL");
            if (adminEmailSetting?.value) {
              const adminUsers = await storage.getAllUsers();
              const adminUser = adminUsers.find((u) => u.role === "admin" && u.email === adminEmailSetting.value);
              if (adminUser?.phone) {
                await sendAdminNewBookingAlertSMS(
                  adminUser.phone,
                  booking.id,
                  `${passenger.firstName || ""} ${passenger.lastName || ""}`.trim(),
                  booking.pickupAddress,
                  new Date(booking.scheduledDateTime),
                  booking.totalAmount || "0.00"
                );
              }
            }
            const allUsers = await storage.getAllUsers();
            const dispatchers = allUsers.filter((u) => u.role === "dispatcher");
            for (const dispatcher of dispatchers) {
              await sendEmail({
                to: dispatcher.email,
                subject: `New Booking Alert - USA Luxury Limo #${booking.id.slice(0, 8)}`,
                html: getBookingConfirmationEmailHTML({
                  passengerName: `${passenger.firstName || ""} ${passenger.lastName || ""}`.trim() || passenger.username || "Valued Customer",
                  bookingId: booking.id.slice(0, 8),
                  pickupAddress: booking.pickupAddress,
                  destinationAddress: booking.destinationAddress || "N/A",
                  scheduledDateTime,
                  vehicleType: vehicleType.name || "Luxury Vehicle",
                  totalAmount: booking.totalAmount || "0.00",
                  status: booking.status || "pending"
                })
              });
            }
          }
        } catch (error) {
          console.error("[NOTIFICATIONS] Failed to send booking notifications:", error);
        }
      })();
      res.status(201).json(booking);
    } catch (error) {
      console.error("Create booking error:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });
  app2.get("/api/bookings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      let bookings2;
      if (user.role === "driver") {
        const driver = await storage.getDriverByUserId(userId);
        if (driver) {
          bookings2 = await storage.getBookingsByDriver(driver.id);
          bookings2 = bookings2.map((booking) => {
            const { totalAmount, ...driverBooking } = booking;
            return driverBooking;
          });
        } else {
          bookings2 = [];
        }
        res.json(bookings2);
      } else {
        bookings2 = await storage.getBookingsByUser(userId);
        if (user.role === "passenger") {
          const enrichedBookings = await Promise.all(
            bookings2.map(async (booking) => {
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
                      driverCredentials: driver.driverCredentials || null
                    };
                  }
                }
              }
              return booking;
            })
          );
          res.json(enrichedBookings);
        } else {
          res.json(bookings2);
        }
      }
    } catch (error) {
      console.error("Get bookings error:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });
  app2.get("/api/bookings/:id", isAuthenticated, async (req, res) => {
    try {
      const bookingId = req.params.id;
      const userId = req.user.id;
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (booking.passengerId !== userId && user.role !== "admin") {
        if (user.role === "driver") {
          const driver = await storage.getDriverByUserId(userId);
          if (!driver || booking.driverId !== driver.id) {
            return res.status(403).json({ message: "Access denied" });
          }
        } else {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      let enrichedBooking = { ...booking };
      if (booking.passengerId) {
        const passenger = await storage.getUser(booking.passengerId);
        if (passenger) {
          enrichedBooking = {
            ...enrichedBooking,
            passengerName: `${passenger.firstName || ""} ${passenger.lastName || ""}`.trim() || passenger.username || "N/A",
            passengerPhone: passenger.phone || null,
            passengerEmail: passenger.email || null
          };
        }
      }
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
              driverProfileImageUrl: driverUser.profileImageUrl || null
            };
          }
          const vehicleData = await db.select().from(vehicles).where(eq2(vehicles.driverId, driver.id)).limit(1);
          if (vehicleData[0]) {
            enrichedBooking = {
              ...enrichedBooking,
              driverVehiclePlate: vehicleData[0].licensePlate || null
            };
          }
        }
      }
      res.json(enrichedBooking);
    } catch (error) {
      console.error("Get booking error:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });
  app2.patch("/api/bookings/:id/status", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "driver" && user.role !== "admin") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      await storage.updateBookingStatus(id, status);
      res.json({ success: true });
    } catch (error) {
      console.error("Update booking status error:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });
  app2.post("/api/bookings/:id/accept", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "driver") {
        return res.status(403).json({ message: "Only drivers can accept bookings" });
      }
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: "Driver profile not found" });
      }
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (booking.driverId !== driver.id) {
        return res.status(403).json({ message: "This booking is not assigned to you" });
      }
      if (booking.status !== "pending_driver_acceptance") {
        return res.status(400).json({ message: "This booking is not awaiting your acceptance" });
      }
      const updatedBooking = await storage.updateBooking(id, {
        status: "confirmed",
        acceptedAt: /* @__PURE__ */ new Date()
      });
      (async () => {
        try {
          const passenger = await storage.getUser(booking.passengerId);
          if (passenger) {
            const message = `Good news! Driver ${user.firstName} ${user.lastName} has accepted your booking for ${new Date(booking.scheduledDateTime).toLocaleString()}.`;
            if (booking.passengerPhone || passenger.phone) {
              await sendSMS(booking.passengerPhone || passenger.phone, message);
            }
            if (passenger.email) {
              await sendEmail({
                to: passenger.email,
                subject: "Driver Accepted Your Booking",
                html: `<p>${message}</p><p>Pickup: ${booking.pickupAddress}</p><p>Time: ${new Date(booking.scheduledDateTime).toLocaleString()}</p>`
              });
            }
            const vehicleType = await storage.getVehicleType(booking.vehicleTypeId);
            if (vehicleType) {
              await sendDriverActivityReport({
                type: "acceptance",
                booking: updatedBooking,
                driver: user,
                passenger,
                vehicleTypeName: vehicleType.name || "Unknown Vehicle",
                timestamp: /* @__PURE__ */ new Date()
              });
            }
          }
        } catch (error) {
          console.error("Error sending driver acceptance notification:", error);
        }
      })();
      res.json({ success: true, message: "Booking accepted successfully" });
    } catch (error) {
      console.error("Accept booking error:", error);
      res.status(500).json({ message: "Failed to accept booking" });
    }
  });
  app2.post("/api/bookings/:id/decline", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "driver") {
        return res.status(403).json({ message: "Only drivers can decline bookings" });
      }
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: "Driver profile not found" });
      }
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (booking.driverId !== driver.id) {
        return res.status(403).json({ message: "This booking is not assigned to you" });
      }
      if (booking.status !== "pending_driver_acceptance") {
        return res.status(400).json({ message: "This booking is not awaiting your acceptance" });
      }
      const updatedBooking = await storage.updateBooking(id, {
        status: "pending",
        driverId: null,
        driverPayment: null,
        assignedAt: null
      });
      (async () => {
        try {
          const allUsers = await storage.getAllUsers();
          const admins = allUsers.filter((u) => u.role === "admin" || u.role === "dispatcher");
          const notificationMessage = `Driver ${user.firstName} ${user.lastName} has declined booking #${id.substring(0, 8)} for ${new Date(booking.scheduledDateTime).toLocaleString()}.${reason ? ` Reason: ${reason}` : ""}`;
          for (const admin of admins) {
            if (admin.email) {
              await sendEmail({
                to: admin.email,
                subject: "Driver Declined Booking Assignment",
                html: `<p>${notificationMessage}</p><p>Pickup: ${booking.pickupAddress}</p><p>Passenger: ${booking.passengerName || "N/A"}</p><p>Please reassign this booking to another driver.</p>`
              });
            }
          }
          const passenger = await storage.getUser(booking.passengerId);
          const vehicleType = await storage.getVehicleType(booking.vehicleTypeId);
          if (passenger && vehicleType) {
            await sendCancelledBookingReport(
              updatedBooking,
              passenger,
              vehicleType.name || "Unknown Vehicle",
              "driver",
              reason || "Driver declined the booking"
            );
          }
        } catch (error) {
          console.error("Error sending driver declination notification:", error);
        }
      })();
      res.json({ success: true, message: "Booking declined successfully" });
    } catch (error) {
      console.error("Decline booking error:", error);
      res.status(500).json({ message: "Failed to decline booking" });
    }
  });
  app2.post("/api/bookings/:id/on-the-way", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const now = /* @__PURE__ */ new Date();
      const user = await storage.getUser(userId);
      if (!user || user.role !== "driver") {
        return res.status(403).json({ message: "Only drivers can update trip status" });
      }
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: "Driver profile not found" });
      }
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (booking.driverId !== driver.id) {
        return res.status(403).json({ message: "This booking is not assigned to you" });
      }
      if (!["confirmed", "on_the_way", "arrived", "on_board"].includes(booking.status)) {
        return res.status(400).json({ message: "Booking must be confirmed before starting trip" });
      }
      if (["on_the_way", "arrived", "on_board"].includes(booking.status)) {
        return res.json({ success: true, message: "Already on the way or further along", alreadyProgressed: true });
      }
      const scheduledTime = new Date(booking.scheduledDateTime);
      const minutesUntilPickup = (scheduledTime.getTime() - now.getTime()) / (1e3 * 60);
      if (minutesUntilPickup > 120) {
        return res.status(400).json({
          message: "You can only start your trip within 2 hours of the scheduled pickup time",
          minutesUntil: Math.round(minutesUntilPickup)
        });
      }
      const updates = {
        status: "on_the_way",
        onTheWayAt: now
      };
      if (!booking.reminderSentAt) {
        updates.reminderSentAt = now;
        console.log(`[ON-THE-WAY] Setting reminderSentAt for booking ${id} (was not set by scheduled job)`);
      }
      const updatedBooking = await storage.updateBooking(id, updates);
      (async () => {
        try {
          const passenger = await storage.getUser(booking.passengerId);
          const vehicleType = await storage.getVehicleType(booking.vehicleTypeId);
          if (passenger && vehicleType) {
            const scheduledDateTime = scheduledTime.toLocaleString("en-US", {
              dateStyle: "full",
              timeStyle: "short"
            });
            if (passenger.email) {
              await sendEmail({
                to: passenger.email,
                subject: `Driver On The Way - USA Luxury Limo #${booking.id.slice(0, 8)}`,
                html: getDriverOnTheWayEmailHTML({
                  passengerName: `${passenger.firstName || ""} ${passenger.lastName || ""}`.trim() || passenger.username || "Valued Customer",
                  bookingId: booking.id.slice(0, 8),
                  driverName: `${user.firstName} ${user.lastName}`,
                  driverPhone: user.phone || "N/A",
                  vehicleType: vehicleType.name || "Luxury Vehicle",
                  pickupAddress: booking.pickupAddress,
                  scheduledDateTime,
                  estimatedArrival: void 0
                })
              });
            }
            if (booking.passengerPhone || passenger.phone) {
              await sendDriverOnTheWaySMS(
                booking.passengerPhone || passenger.phone,
                `${user.firstName} ${user.lastName}`,
                vehicleType.name || "Luxury Vehicle"
              );
            }
            await sendDriverActivityReport({
              type: "on_the_way",
              booking: updatedBooking,
              driver: user,
              passenger,
              vehicleTypeName: vehicleType.name || "Unknown Vehicle",
              timestamp: now
            });
          }
        } catch (error) {
          console.error("Error sending on-the-way notification:", error);
        }
      })();
      res.json({ success: true, message: "Status updated to on the way" });
    } catch (error) {
      console.error("On the way error:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });
  app2.post("/api/bookings/:id/arrived", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const now = /* @__PURE__ */ new Date();
      const user = await storage.getUser(userId);
      if (!user || user.role !== "driver") {
        return res.status(403).json({ message: "Only drivers can update trip status" });
      }
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: "Driver profile not found" });
      }
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (booking.driverId !== driver.id) {
        return res.status(403).json({ message: "This booking is not assigned to you" });
      }
      if (!["on_the_way", "arrived", "on_board"].includes(booking.status)) {
        return res.status(400).json({ message: "You must be on the way before marking as arrived" });
      }
      if (["arrived", "on_board"].includes(booking.status)) {
        return res.json({ success: true, message: "Already arrived or further along", alreadyProgressed: true });
      }
      const scheduledTime = new Date(booking.scheduledDateTime);
      const minutesDiff = (now.getTime() - scheduledTime.getTime()) / (1e3 * 60);
      if (minutesDiff < -15) {
        return res.status(400).json({
          message: "You can only mark as arrived within 15 minutes before the scheduled pickup time",
          minutesUntil: Math.round(Math.abs(minutesDiff))
        });
      }
      const updatedBooking = await storage.updateBooking(id, {
        status: "arrived",
        arrivedAt: now
      });
      (async () => {
        try {
          const passenger = await storage.getUser(booking.passengerId);
          const vehicleType = await storage.getVehicleType(booking.vehicleTypeId);
          if (passenger && vehicleType) {
            if (passenger.email) {
              await sendEmail({
                to: passenger.email,
                subject: `Driver Has Arrived - USA Luxury Limo #${booking.id.slice(0, 8)}`,
                html: getDriverArrivedEmailHTML({
                  passengerName: `${passenger.firstName || ""} ${passenger.lastName || ""}`.trim() || passenger.username || "Valued Customer",
                  bookingId: booking.id.slice(0, 8),
                  driverName: `${user.firstName} ${user.lastName}`,
                  driverPhone: user.phone || "N/A",
                  vehicleType: vehicleType.name || "Luxury Vehicle",
                  pickupAddress: booking.pickupAddress
                })
              });
            }
            if (booking.passengerPhone || passenger.phone) {
              await sendDriverArrivedSMS(
                booking.passengerPhone || passenger.phone,
                `${user.firstName} ${user.lastName}`,
                vehicleType.name || "Luxury Vehicle",
                booking.pickupAddress
              );
            }
            await sendDriverActivityReport({
              type: "arrived",
              booking: updatedBooking,
              driver: user,
              passenger,
              vehicleTypeName: vehicleType.name || "Unknown Vehicle",
              timestamp: now
            });
          }
        } catch (error) {
          console.error("Error sending arrived notification:", error);
        }
      })();
      res.json({ success: true, message: "Status updated to arrived" });
    } catch (error) {
      console.error("Arrived error:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });
  app2.post("/api/bookings/:id/on-board", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const now = /* @__PURE__ */ new Date();
      const user = await storage.getUser(userId);
      if (!user || user.role !== "driver") {
        return res.status(403).json({ message: "Only drivers can update trip status" });
      }
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: "Driver profile not found" });
      }
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (booking.driverId !== driver.id) {
        return res.status(403).json({ message: "This booking is not assigned to you" });
      }
      if (!["arrived", "on_board"].includes(booking.status)) {
        return res.status(400).json({ message: "You must mark as arrived before passenger boards" });
      }
      if (booking.status === "on_board") {
        return res.json({ success: true, message: "Passenger already on board", alreadyProgressed: true });
      }
      const updatedBooking = await storage.updateBooking(id, {
        status: "on_board",
        onBoardAt: now
      });
      (async () => {
        try {
          const passenger = await storage.getUser(booking.passengerId);
          if (passenger) {
            const message = `Trip started! You're on your way to ${booking.destinationAddress || "your destination"}.`;
            if (booking.passengerPhone || passenger.phone) {
              await sendSMS(booking.passengerPhone || passenger.phone, message);
            }
            if (passenger.email) {
              await sendEmail({
                to: passenger.email,
                subject: "Trip Started",
                html: `<h2>Trip Started</h2><p>${message}</p><p>Driver: ${user.firstName} ${user.lastName}</p>`
              });
            }
            const vehicleType = await storage.getVehicleType(booking.vehicleTypeId);
            if (vehicleType) {
              await sendDriverActivityReport({
                type: "on_board",
                booking: updatedBooking,
                driver: user,
                passenger,
                vehicleTypeName: vehicleType.name || "Unknown Vehicle",
                timestamp: now
              });
            }
          }
        } catch (error) {
          console.error("Error sending on-board notification:", error);
        }
      })();
      res.json({ success: true, message: "Passenger is on board" });
    } catch (error) {
      console.error("On board error:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });
  app2.patch("/api/bookings/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      const user = await storage.getUser(userId);
      if (booking.passengerId !== userId && user?.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to edit this booking" });
      }
      if (booking.status !== "pending" && user?.role !== "admin") {
        return res.status(400).json({ message: "Only pending bookings can be edited" });
      }
      const updateSchema = insertBookingSchema.partial();
      const validatedUpdates = updateSchema.parse(req.body);
      if (user?.role !== "admin") {
        delete validatedUpdates.status;
        delete validatedUpdates.paymentStatus;
        delete validatedUpdates.paymentIntentId;
      }
      const updatedBooking = await storage.updateBooking(id, validatedUpdates);
      res.json(updatedBooking);
    } catch (error) {
      console.error("Update booking error:", error);
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update booking" });
    }
  });
  app2.delete("/api/bookings/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      const user = await storage.getUser(userId);
      if (booking.passengerId !== userId && user?.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to delete this booking" });
      }
      if (booking.status !== "pending" && user?.role !== "admin") {
        return res.status(400).json({ message: "Only pending bookings can be deleted" });
      }
      await storage.deleteBooking(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete booking error:", error);
      res.status(500).json({ message: "Failed to delete booking" });
    }
  });
  app2.patch("/api/bookings/:id/cancel", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      const user = await storage.getUser(userId);
      if (booking.passengerId !== userId && user?.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to cancel this booking" });
      }
      if (booking.status === "completed" || booking.status === "cancelled") {
        return res.status(400).json({
          message: `Cannot cancel ${booking.status} booking`
        });
      }
      const updatedBooking = await storage.updateBooking(id, { status: "cancelled", cancelledAt: /* @__PURE__ */ new Date(), cancelReason: req.body.reason || "Cancelled by user" });
      (async () => {
        try {
          const passenger = await storage.getUser(booking.passengerId);
          const vehicleType = await storage.getVehicleType(booking.vehicleTypeId);
          if (passenger && vehicleType) {
            await sendCancelledBookingReport(
              updatedBooking,
              passenger,
              vehicleType.name || "Unknown Vehicle",
              "passenger",
              req.body.reason || "No reason provided"
            );
            const scheduledDateTime = new Date(updatedBooking.scheduledDateTime).toLocaleString("en-US", {
              dateStyle: "full",
              timeStyle: "short"
            });
            await sendEmail({
              to: passenger.email,
              subject: `Booking Cancelled - USA Luxury Limo #${updatedBooking.id.slice(0, 8)}`,
              html: getBookingCancelledEmailHTML({
                passengerName: `${passenger.firstName || ""} ${passenger.lastName || ""}`.trim() || passenger.username || "Valued Customer",
                bookingId: updatedBooking.id.slice(0, 8),
                pickupAddress: updatedBooking.pickupAddress,
                destinationAddress: updatedBooking.destinationAddress || void 0,
                scheduledDateTime,
                cancelReason: updatedBooking.cancelReason || void 0
              })
            });
            if (passenger.phone) {
              await sendBookingCancelledSMS(passenger.phone, updatedBooking.id);
            }
          }
        } catch (error) {
          console.error("[NOTIFICATIONS] Failed to send cancellation notifications:", error);
        }
      })();
      res.json(updatedBooking);
    } catch (error) {
      console.error("Cancel booking error:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });
  app2.post("/api/bookings/auto-cancel-expired", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "driver") {
        return res.status(403).json({ message: "Driver access required" });
      }
      const now = /* @__PURE__ */ new Date();
      const allBookings = await storage.getAllBookingsWithDetails();
      const expiredBookings = allBookings.filter((booking) => {
        const scheduledTime = new Date(booking.scheduledDateTime);
        const isPast = scheduledTime < now;
        const isActive = ["pending", "pending_driver_acceptance", "confirmed", "on_the_way", "arrived", "on_board", "in_progress"].includes(booking.status);
        return isPast && isActive;
      });
      const cancelledBookingIds = [];
      for (const booking of expiredBookings) {
        try {
          await storage.updateBooking(booking.id, {
            status: "cancelled",
            driverId: null,
            driverPayment: null,
            cancelledAt: now,
            cancelReason: "Automatically cancelled - scheduled time passed"
          });
          cancelledBookingIds.push(booking.id);
          console.log(`[AUTO-CANCEL] Booking ${booking.id} auto-cancelled (scheduled: ${booking.scheduledDateTime}, now: ${now.toISOString()})`);
        } catch (error) {
          console.error(`[AUTO-CANCEL] Failed to cancel booking ${booking.id}:`, error);
        }
      }
      res.json({
        success: true,
        cancelledCount: cancelledBookingIds.length,
        cancelledBookings: cancelledBookingIds
      });
    } catch (error) {
      console.error("Auto-cancel expired bookings error:", error);
      res.status(500).json({ message: "Failed to auto-cancel expired bookings" });
    }
  });
  app2.post("/api/admin/bookings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const bookingData = insertBookingSchema.parse(req.body);
      const bookingWithTracking = {
        ...bookingData,
        bookedBy: "admin",
        bookedAt: /* @__PURE__ */ new Date()
      };
      const booking = await storage.createBooking(bookingWithTracking);
      if (booking.passengerId) {
        try {
          const passenger = await storage.getUser(booking.passengerId);
          const vehicleType = await storage.getVehicleType(booking.vehicleTypeId);
          if (passenger?.email) {
            const scheduledDateTime = new Date(booking.scheduledDateTime).toLocaleString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "America/Chicago"
            });
            await sendEmail({
              to: passenger.email,
              subject: `Booking Confirmation - ${booking.id}`,
              html: getBookingConfirmationEmailHTML({
                passengerName: `${passenger.firstName} ${passenger.lastName}`,
                bookingId: booking.id,
                pickupAddress: booking.pickupAddress,
                destinationAddress: booking.destinationAddress || "N/A",
                scheduledDateTime,
                vehicleType: vehicleType?.name || "Standard",
                totalAmount: (booking.totalAmount || 0).toString(),
                status: booking.status || "pending"
              })
            });
            if (passenger.phone) {
              try {
                await sendBookingConfirmationSMS(
                  passenger.phone,
                  booking.id,
                  booking.pickupAddress,
                  new Date(booking.scheduledDateTime)
                );
              } catch (smsError) {
                console.error("Failed to send booking confirmation SMS:", smsError);
              }
            }
          }
        } catch (emailError) {
          console.error("Failed to send booking confirmation email:", emailError);
        }
      }
      res.status(201).json(booking);
    } catch (error) {
      console.error("Admin create booking error:", error);
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });
  app2.patch("/api/admin/bookings/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const updateSchema = insertBookingSchema.partial();
      const validatedUpdates = updateSchema.parse(req.body);
      const booking = await storage.updateBooking(id, validatedUpdates);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Admin update booking error:", error);
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update booking" });
    }
  });
  app2.post("/api/bookings/:id/additional-charge", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { description, amount } = req.body;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin" && user.role !== "dispatcher") {
        return res.status(403).json({ message: "Admin or dispatcher access required" });
      }
      if (!description || !amount || amount <= 0) {
        return res.status(400).json({ message: "Valid description and amount are required" });
      }
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ message: "Invalid amount value" });
      }
      const booking = await storage.addAdditionalCharge(id, {
        description,
        amount: parsedAmount,
        addedBy: userId
      });
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Add additional charge error:", error);
      res.status(500).json({ message: "Failed to add additional charge" });
    }
  });
  app2.post("/api/bookings/:id/authorize-payment", isAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Payment service not configured" });
      }
      const { id } = req.params;
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin" && user.role !== "dispatcher") {
        return res.status(403).json({ message: "Admin or dispatcher access required" });
      }
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      const passenger = await storage.getUser(booking.passengerId);
      if (!passenger?.stripeCustomerId) {
        return res.status(400).json({ message: "Passenger does not have a payment method on file" });
      }
      const customer = await stripe.customers.retrieve(passenger.stripeCustomerId);
      if (!customer || customer.deleted) {
        return res.status(400).json({ message: "Customer not found in payment system" });
      }
      const defaultPaymentMethod = customer.invoice_settings?.default_payment_method;
      if (!defaultPaymentMethod) {
        return res.status(400).json({ message: "No default payment method found for passenger" });
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(booking.totalAmount || "0") * 100),
        // Convert to cents
        currency: "usd",
        customer: passenger.stripeCustomerId,
        payment_method: defaultPaymentMethod,
        off_session: true,
        confirm: true,
        metadata: {
          bookingId: booking.id,
          passengerId: booking.passengerId,
          authorizedBy: userId
        }
      });
      await storage.updateBookingPayment(id, paymentIntent.id, "paid");
      res.json({
        success: true,
        paymentIntent: paymentIntent.id,
        amount: booking.totalAmount
      });
    } catch (error) {
      console.error("Authorize payment error:", error);
      if (error.type === "StripeCardError") {
        return res.status(400).json({
          message: "Card payment failed: " + error.message
        });
      }
      res.status(500).json({
        message: error.message || "Failed to authorize payment"
      });
    }
  });
  app2.get("/api/saved-addresses", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const addresses = await storage.getSavedAddressesByUser(userId);
      res.json(addresses);
    } catch (error) {
      console.error("Get saved addresses error:", error);
      res.status(500).json({ message: "Failed to fetch saved addresses" });
    }
  });
  app2.get("/api/saved-addresses/user/:userId", isAuthenticated, async (req, res) => {
    try {
      const adminId = req.user.id;
      const admin = await storage.getUser(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { userId } = req.params;
      const addresses = await storage.getSavedAddressesByUser(userId);
      res.json(addresses);
    } catch (error) {
      console.error("Admin get user saved addresses error:", error);
      res.status(500).json({ message: "Failed to fetch saved addresses" });
    }
  });
  app2.post("/api/saved-addresses", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const addressData = insertSavedAddressSchema.parse({
        ...req.body,
        userId
      });
      const address = await storage.createSavedAddress(addressData);
      res.status(201).json(address);
    } catch (error) {
      console.error("Create saved address error:", error);
      res.status(500).json({ message: "Failed to create saved address" });
    }
  });
  app2.delete("/api/saved-addresses/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      await storage.deleteSavedAddress(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete saved address error:", error);
      res.status(500).json({ message: "Failed to delete saved address" });
    }
  });
  app2.post("/api/contact", async (req, res) => {
    try {
      const contactData = insertContactSchema.parse(req.body);
      const contact = await storage.createContactSubmission(contactData);
      const adminEmailSetting = await storage.getSystemSetting("ADMIN_EMAIL");
      if (adminEmailSetting?.value) {
        try {
          const submittedAt = (/* @__PURE__ */ new Date()).toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Chicago"
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
              submittedAt
            })
          });
        } catch (emailError) {
          console.error("Failed to send contact form email notification:", emailError);
        }
      }
      res.status(201).json(contact);
    } catch (error) {
      console.error("Contact submission error:", error);
      res.status(500).json({ message: "Failed to submit contact form" });
    }
  });
  app2.get("/api/system-settings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const settings = await storage.getAllSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error("Get system settings error:", error);
      res.status(500).json({ message: "Failed to fetch system settings" });
    }
  });
  app2.get("/api/system-settings/:key", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { key } = req.params;
      const setting = await storage.getSystemSetting(key);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Get system setting error:", error);
      res.status(500).json({ message: "Failed to fetch system setting" });
    }
  });
  app2.put("/api/system-settings/:key", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { key } = req.params;
      const { value } = req.body;
      if (typeof value !== "string") {
        return res.status(400).json({ message: "Value must be a string" });
      }
      await storage.updateSystemSetting(key, value, userId);
      const updatedSetting = await storage.getSystemSetting(key);
      res.json(updatedSetting);
    } catch (error) {
      console.error("Update system setting error:", error);
      res.status(500).json({ message: "Failed to update system setting" });
    }
  });
  app2.get("/api/admin/dashboard", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const stats = await storage.getAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Admin dashboard error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });
  app2.get("/api/dispatcher/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin" && user.role !== "dispatcher") {
        return res.status(403).json({ message: "Dispatcher or admin access required" });
      }
      const stats = await storage.getDispatcherDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Dispatcher stats error:", error);
      res.status(500).json({ message: "Failed to fetch dispatcher stats" });
    }
  });
  app2.get("/api/admin/contacts", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const contacts = await storage.getContactSubmissions();
      res.json(contacts);
    } catch (error) {
      console.error("Get contacts error:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });
  app2.get("/api/passenger/invoices", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userBookings = await storage.getBookingsByUser(userId);
      const allInvoices = await storage.getAllInvoices();
      const passengerBookingIds = new Set(userBookings.map((b) => b.id));
      const passengerInvoices = allInvoices.filter((inv) => passengerBookingIds.has(inv.bookingId));
      const enrichedInvoices = await Promise.all(
        passengerInvoices.map(async (invoice) => {
          const booking = await storage.getBooking(invoice.bookingId);
          return {
            ...invoice,
            booking
          };
        })
      );
      res.json(enrichedInvoices);
    } catch (error) {
      console.error("Get passenger invoices error:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });
  app2.post("/api/passenger/invoices/:id/email", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      const booking = await storage.getBooking(invoice.bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Associated booking not found" });
      }
      if (booking.passengerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const passenger = await storage.getUser(booking.passengerId);
      const recipientEmail = user.email;
      let paymentToken = "";
      if (!invoice.paidAt) {
        const token = crypto2.randomBytes(32).toString("hex");
        const expiresAt = /* @__PURE__ */ new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        await storage.createPaymentToken({
          invoiceId: invoice.id,
          token,
          expiresAt
        });
        paymentToken = token;
      }
      let logoDataUri = "";
      try {
        const logoSetting = await storage.getCmsSetting("BRAND_LOGO_URL");
        if (logoSetting?.value) {
          const logoPath = logoSetting.value;
          const fileKey = logoPath.includes("/file/") ? logoPath.split("/file/")[1] : logoPath.replace("/api/object-storage/", "");
          const ObjectStorage = await import("@replit/object-storage");
          const storage_client = new ObjectStorage.Client();
          const logoBuffer = await storage_client.downloadAsBytes(fileKey);
          if (logoBuffer) {
            let buffer;
            if (Buffer.isBuffer(logoBuffer)) {
              buffer = logoBuffer;
            } else if (Array.isArray(logoBuffer) && logoBuffer.length > 0) {
              buffer = Buffer.from(Object.values(logoBuffer[0]));
            } else if (typeof logoBuffer === "object" && logoBuffer !== null) {
              buffer = Buffer.from(Object.values(logoBuffer));
            } else {
              throw new Error("Unexpected logo buffer format from object storage");
            }
            const base64Logo = buffer.toString("base64");
            const ext = fileKey.split(".").pop()?.toLowerCase();
            const mimeType = ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "svg" ? "image/svg+xml" : "image/png";
            logoDataUri = `data:${mimeType};base64,${base64Logo}`;
          }
        }
      } catch (error) {
        console.error("Error fetching logo for email:", error);
      }
      let pricingRows = "";
      if (booking.baseFare) {
        pricingRows += `
          <div class="pricing-row">
            <span class="pricing-label">Base Fare</span>
            <span class="pricing-value">$${parseFloat(booking.baseFare).toFixed(2)}</span>
          </div>
        `;
      }
      if (booking.surgePricingAmount && parseFloat(booking.surgePricingAmount) > 0) {
        const multiplier = booking.surgePricingMultiplier ? ` (${booking.surgePricingMultiplier}x)` : "";
        pricingRows += `
          <div class="pricing-row">
            <span class="pricing-label">Surge Pricing${multiplier}</span>
            <span class="pricing-value pricing-surge">+$${parseFloat(booking.surgePricingAmount).toFixed(2)}</span>
          </div>
        `;
      }
      if (booking.gratuityAmount && parseFloat(booking.gratuityAmount) > 0) {
        pricingRows += `
          <div class="pricing-row">
            <span class="pricing-label">Gratuity (Tip)</span>
            <span class="pricing-value">+$${parseFloat(booking.gratuityAmount).toFixed(2)}</span>
          </div>
        `;
      }
      if (booking.airportFeeAmount && parseFloat(booking.airportFeeAmount) > 0) {
        pricingRows += `
          <div class="pricing-row">
            <span class="pricing-label">Airport Fee</span>
            <span class="pricing-value">+$${parseFloat(booking.airportFeeAmount).toFixed(2)}</span>
          </div>
        `;
      }
      if (booking.discountAmount && parseFloat(booking.discountAmount) > 0) {
        const percentage = booking.discountPercentage ? ` (${booking.discountPercentage}%)` : "";
        pricingRows += `
          <div class="pricing-row">
            <span class="pricing-label">Discount${percentage}</span>
            <span class="pricing-value pricing-discount">-$${parseFloat(booking.discountAmount).toFixed(2)}</span>
          </div>
        `;
      }
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #0f172a;
              background-color: #f8fafc;
            }
            .email-wrapper { background-color: #f8fafc; padding: 24px; }
            .container { 
              max-width: 650px; 
              margin: 0 auto; 
              background-color: #ffffff; 
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            .header { 
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              padding: 32px 24px;
              border-bottom: 3px solid #4f46e5;
              text-align: center;
            }
            .logo { 
              font-size: 28px; 
              font-weight: 800; 
              color: #1e293b; 
              margin-bottom: 8px;
              letter-spacing: -0.5px;
            }
            .logo-img { 
              max-height: 70px; 
              max-width: 280px; 
              margin: 0 auto 12px; 
              display: block;
            }
            .tagline { 
              font-size: 14px; 
              color: #64748b; 
              font-weight: 500;
            }
            .success-banner { 
              background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
              padding: 20px;
              text-align: center;
              border-bottom: 3px solid #10b981;
            }
            .success-banner h2 { 
              color: #065f46; 
              font-size: 20px;
              margin: 0;
              font-weight: 800;
              letter-spacing: 1px;
            }
            .content { padding: 32px 24px; }
            .greeting { 
              margin-bottom: 24px;
              color: #334155;
            }
            .greeting p { margin-bottom: 8px; }
            .section { 
              margin-bottom: 28px;
              background: #f8fafc;
              border: 2px solid #e2e8f0;
              border-radius: 10px;
              padding: 20px;
            }
            .section-title { 
              font-weight: 700;
              font-size: 16px;
              margin-bottom: 16px;
              color: #334155;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding-bottom: 8px;
              border-bottom: 2px solid #cbd5e1;
            }
            .info-row { 
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #f1f5f9;
            }
            .info-row:last-child { border-bottom: none; }
            .info-label { 
              font-weight: 600;
              color: #64748b;
              flex: 0 0 40%;
              font-size: 14px;
            }
            .info-value { 
              color: #0f172a;
              flex: 1;
              text-align: right;
              font-weight: 500;
              font-size: 14px;
            }
            .pricing-section {
              background: white;
              border: 2px solid #e2e8f0;
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 28px;
            }
            .pricing-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 0;
              border-bottom: 1px solid #f1f5f9;
            }
            .pricing-row:last-child { border-bottom: none; }
            .pricing-label {
              font-size: 15px;
              color: #0f172a;
              font-weight: 500;
            }
            .pricing-value {
              font-size: 15px;
              color: #0f172a;
              font-weight: 600;
            }
            .pricing-surge {
              color: #ea580c;
            }
            .pricing-discount {
              color: #16a34a;
            }
            .total-section {
              background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
              border: 3px solid #3b82f6;
              border-radius: 10px;
              padding: 20px;
              margin-top: 20px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .total-label {
              font-size: 18px;
              color: #0f172a;
              font-weight: 700;
            }
            .total-value {
              font-size: 24px;
              color: #1d4ed8;
              font-weight: 800;
            }
            .payment-link { 
              text-align: center;
              margin: 24px 0;
              padding: 24px;
              background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
              border-radius: 10px;
              border: 2px solid #3b82f6;
            }
            .payment-link p {
              color: #1e40af;
              font-weight: 600;
              margin-bottom: 16px;
              font-size: 16px;
            }
            .payment-button { 
              display: inline-block;
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: #ffffff;
              padding: 14px 36px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 700;
              font-size: 16px;
              box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.4);
              transition: all 0.2s;
            }
            .payment-button:hover {
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            }
            .paid-badge { 
              background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
              color: #065f46;
              padding: 20px;
              text-align: center;
              font-weight: 800;
              font-size: 20px;
              border-radius: 10px;
              margin: 24px 0;
              border: 3px solid #10b981;
              letter-spacing: 2px;
            }
            .footer-note { 
              font-size: 13px;
              color: #64748b;
              text-align: center;
              padding: 24px;
              border-top: 2px solid #e2e8f0;
              margin-top: 28px;
              background: #f8fafc;
              border-radius: 8px;
            }
            .footer-note strong {
              color: #334155;
              font-weight: 600;
            }
            @media only screen and (max-width: 600px) {
              .email-wrapper { padding: 12px; }
              .content { padding: 20px 16px; }
              .section { padding: 16px; }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              <div class="header">
                ${logoDataUri ? `
                  <img src="${logoDataUri}" alt="USA Luxury Limo" class="logo-img" />
                ` : `
                  <div class="logo">USA Luxury Limo</div>
                `}
                <div class="tagline">Ride in Style, Always on Time</div>
              </div>

              <div class="success-banner">
                <h2>\u2713 INVOICE READY</h2>
              </div>

              <div class="content">
                <div class="greeting">
                  <p><strong>Dear ${passenger?.firstName || "Customer"},</strong></p>
                  <p>Thank you for booking with USA Luxury Limo Service! Below is your detailed invoice.</p>
                </div>

                <div class="section">
                  <div class="section-title">\u{1F4CB} Invoice Information</div>
                  <div class="info-row">
                    <span class="info-label">Invoice Number</span>
                    <span class="info-value">${invoice.invoiceNumber}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Date & time</span>
                    <span class="info-value">${new Date(booking.scheduledDateTime).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Booking REF#</span>
                    <span class="info-value">#${booking.id.toUpperCase().substring(0, 8)}</span>
                  </div>
                </div>

                <div class="section">
                  <div class="section-title">\u{1F697} Journey Information</div>
                  <div class="info-row">
                    <span class="info-label">Pickup Location:</span>
                    <span class="info-value">${booking.pickupAddress}</span>
                  </div>
                  ${booking.bookingType === "hourly" && booking.requestedHours ? `
                  <div class="info-row">
                    <span class="info-label">Duration:</span>
                    <span class="info-value">${booking.requestedHours} ${booking.requestedHours === 1 ? "Hour" : "Hours"}</span>
                  </div>
                  ` : booking.destinationAddress ? `
                  <div class="info-row">
                    <span class="info-label">Destination:</span>
                    <span class="info-value">${booking.destinationAddress}</span>
                  </div>
                  ` : ""}
                </div>

                <div class="pricing-section">
                  <div class="section-title">\u{1F4B0} Detailed Pricing Breakdown</div>
                  ${pricingRows || `
                    <div class="pricing-row">
                      <span class="pricing-label">Journey Fare</span>
                      <span class="pricing-value">$${parseFloat(invoice.subtotal).toFixed(2)}</span>
                    </div>
                  `}
                  
                  <div class="total-section">
                    <div class="total-row">
                      <span class="total-label">Total Amount</span>
                      <span class="total-value">$${parseFloat(invoice.totalAmount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                ${invoice.paidAt ? `
                <div class="paid-badge">
                  \u2713 PAYMENT RECEIVED
                </div>
                ` : `
                <div class="payment-link">
                  <p>Click the button below to complete your payment securely</p>
                  <a href="${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "https://your-domain.com"}/pay/${paymentToken}" class="payment-button">Make Payment Now</a>
                </div>
                `}

                <div class="footer-note">
                  <p>\u{1F4A1} <em>All prices include statutory taxes and transportation expenses</em></p>
                  <br>
                  <p>Best regards,<br><strong>USA Luxury Limo Service</strong></p>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      const emailSent = await sendEmail({
        to: recipientEmail,
        subject: `Invoice #${invoice.invoiceNumber} - USA Luxury Limo`,
        html: emailHtml
      });
      if (!emailSent) {
        return res.status(500).json({
          message: "Failed to send email. Please check SMTP settings."
        });
      }
      res.json({ message: "Invoice sent successfully to your email" });
    } catch (error) {
      console.error("Email invoice error:", error);
      res.status(500).json({ message: "Failed to send invoice email" });
    }
  });
  app2.get("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const invoices2 = await storage.getAllInvoices();
      res.json(invoices2);
    } catch (error) {
      console.error("Get invoices error:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });
  app2.get("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Get invoice error:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });
  app2.put("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { subtotal, taxAmount, totalAmount, paidAt } = req.body;
      const updated = await storage.updateInvoice(req.params.id, {
        subtotal,
        taxAmount,
        totalAmount,
        paidAt: paidAt ? new Date(paidAt) : void 0
      });
      if (!updated) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Update invoice error:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });
  app2.delete("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      await storage.deleteInvoice(req.params.id);
      res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
      console.error("Delete invoice error:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });
  app2.post("/api/invoices/:id/email", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { recipientEmail } = req.body;
      if (!recipientEmail) {
        return res.status(400).json({ message: "Recipient email is required" });
      }
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      const booking = await storage.getBooking(invoice.bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Associated booking not found" });
      }
      const passenger = await storage.getUser(booking.passengerId);
      let paymentToken = "";
      if (!invoice.paidAt) {
        const token = crypto2.randomBytes(32).toString("hex");
        const expiresAt = /* @__PURE__ */ new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        await storage.createPaymentToken({
          invoiceId: invoice.id,
          token,
          expiresAt
        });
        paymentToken = token;
      }
      let logoDataUri = "";
      try {
        const logoSetting = await storage.getCmsSetting("BRAND_LOGO_URL");
        if (logoSetting?.value) {
          const logoPath = logoSetting.value;
          const fileKey = logoPath.includes("/file/") ? logoPath.split("/file/")[1] : logoPath.replace("/api/object-storage/", "");
          const ObjectStorage = await import("@replit/object-storage");
          const storage_client = new ObjectStorage.Client();
          const logoBuffer = await storage_client.downloadAsBytes(fileKey);
          if (logoBuffer) {
            let buffer;
            if (Buffer.isBuffer(logoBuffer)) {
              buffer = logoBuffer;
            } else if (Array.isArray(logoBuffer) && logoBuffer.length > 0) {
              buffer = Buffer.from(Object.values(logoBuffer[0]));
            } else if (typeof logoBuffer === "object" && logoBuffer !== null) {
              buffer = Buffer.from(Object.values(logoBuffer));
            } else {
              throw new Error("Unexpected logo buffer format from object storage");
            }
            const base64Logo = buffer.toString("base64");
            const ext = fileKey.split(".").pop()?.toLowerCase();
            const mimeType = ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "svg" ? "image/svg+xml" : "image/png";
            logoDataUri = `data:${mimeType};base64,${base64Logo}`;
          }
        }
      } catch (error) {
        console.error("Error fetching logo for email:", error);
      }
      let pricingRows = "";
      if (booking.baseFare) {
        pricingRows += `
          <div class="pricing-row">
            <span class="pricing-label">Base Fare</span>
            <span class="pricing-value">$${parseFloat(booking.baseFare).toFixed(2)}</span>
          </div>
        `;
      }
      if (booking.surgePricingAmount && parseFloat(booking.surgePricingAmount) > 0) {
        const multiplier = booking.surgePricingMultiplier ? ` (${booking.surgePricingMultiplier}x)` : "";
        pricingRows += `
          <div class="pricing-row">
            <span class="pricing-label">Surge Pricing${multiplier}</span>
            <span class="pricing-value pricing-surge">+$${parseFloat(booking.surgePricingAmount).toFixed(2)}</span>
          </div>
        `;
      }
      if (booking.gratuityAmount && parseFloat(booking.gratuityAmount) > 0) {
        pricingRows += `
          <div class="pricing-row">
            <span class="pricing-label">Gratuity (Tip)</span>
            <span class="pricing-value">+$${parseFloat(booking.gratuityAmount).toFixed(2)}</span>
          </div>
        `;
      }
      if (booking.airportFeeAmount && parseFloat(booking.airportFeeAmount) > 0) {
        pricingRows += `
          <div class="pricing-row">
            <span class="pricing-label">Airport Fee</span>
            <span class="pricing-value">+$${parseFloat(booking.airportFeeAmount).toFixed(2)}</span>
          </div>
        `;
      }
      if (booking.discountAmount && parseFloat(booking.discountAmount) > 0) {
        const percentage = booking.discountPercentage ? ` (${booking.discountPercentage}%)` : "";
        pricingRows += `
          <div class="pricing-row">
            <span class="pricing-label">Discount${percentage}</span>
            <span class="pricing-value pricing-discount">-$${parseFloat(booking.discountAmount).toFixed(2)}</span>
          </div>
        `;
      }
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1f2937;
              background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
              padding: 0;
              margin: 0;
            }
            .email-wrapper { 
              background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); 
              padding: 40px 20px; 
            }
            .container { 
              max-width: 680px; 
              margin: 0 auto; 
              background-color: #ffffff; 
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            }
            
            /* Header with Logo */
            .header { 
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              padding: 48px 32px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="rgba(255,255,255,0.03)" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>');
              background-size: cover;
              background-position: bottom;
              opacity: 0.1;
            }
            .logo-container {
              background: white;
              padding: 16px 24px;
              border-radius: 12px;
              display: inline-block;
              margin-bottom: 16px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .logo-img { 
              max-height: 80px; 
              max-width: 320px; 
              height: auto;
              width: auto;
              display: block;
            }
            .company-name { 
              font-size: 32px; 
              font-weight: 800; 
              color: #ffffff;
              text-transform: uppercase;
              letter-spacing: 2px;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
            .tagline { 
              font-size: 15px; 
              color: #cbd5e1; 
              font-weight: 500;
              margin-top: 8px;
              letter-spacing: 0.5px;
            }
            
            /* Success Banner */
            .success-banner { 
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              padding: 24px;
              text-align: center;
              border-bottom: 4px solid #f59e0b;
            }
            .success-banner h2 { 
              color: #92400e; 
              font-size: 22px;
              margin: 0;
              font-weight: 800;
              letter-spacing: 2px;
              text-transform: uppercase;
            }
            
            /* Content */
            .content { 
              padding: 40px 32px; 
              background: #ffffff;
            }
            .greeting { 
              margin-bottom: 32px;
              padding: 24px;
              background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
              border-left: 4px solid #3b82f6;
              border-radius: 8px;
            }
            .greeting p { 
              margin-bottom: 10px;
              color: #1e40af;
              font-size: 15px;
            }
            .greeting strong {
              color: #1e3a8a;
              font-size: 16px;
            }
            
            /* Sections */
            .section { 
              margin-bottom: 32px;
              background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              padding: 24px;
              box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            }
            .section-title { 
              font-weight: 800;
              font-size: 17px;
              margin-bottom: 20px;
              color: #1f2937;
              text-transform: uppercase;
              letter-spacing: 1px;
              padding-bottom: 12px;
              border-bottom: 3px solid #e5e7eb;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .info-row { 
              display: flex;
              justify-content: space-between;
              padding: 14px 0;
              border-bottom: 1px solid #f3f4f6;
              align-items: flex-start;
            }
            .info-row:last-child { border-bottom: none; }
            .info-label { 
              font-weight: 700;
              color: #6b7280;
              flex: 0 0 45%;
              font-size: 14px;
            }
            .info-value { 
              color: #111827;
              flex: 1;
              text-align: right;
              font-weight: 600;
              font-size: 14px;
              word-break: break-word;
            }
            
            /* Pricing Section */
            .pricing-section {
              background: #ffffff;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 32px;
              box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            }
            .pricing-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 16px 0;
              border-bottom: 1px solid #f3f4f6;
            }
            .pricing-row:last-child { border-bottom: none; }
            .pricing-label {
              font-size: 15px;
              color: #374151;
              font-weight: 600;
            }
            .pricing-value {
              font-size: 16px;
              color: #111827;
              font-weight: 700;
            }
            .pricing-surge {
              color: #dc2626;
              font-weight: 800;
            }
            .pricing-discount {
              color: #059669;
              font-weight: 800;
            }
            
            /* Total Section */
            .total-section {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border: 4px solid #f59e0b;
              border-radius: 12px;
              padding: 24px;
              margin-top: 24px;
              box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.3);
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .total-label {
              font-size: 20px;
              color: #78350f;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .total-value {
              font-size: 32px;
              color: #b45309;
              font-weight: 900;
            }
            
            /* Payment */
            .payment-link { 
              text-align: center;
              margin: 32px 0;
              padding: 32px;
              background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
              border-radius: 12px;
              border: 3px solid #3b82f6;
              box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
            }
            .payment-link p {
              color: #1e40af;
              font-weight: 700;
              margin-bottom: 20px;
              font-size: 17px;
            }
            .payment-button { 
              display: inline-block;
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: #ffffff;
              padding: 16px 48px;
              text-decoration: none;
              border-radius: 10px;
              font-weight: 800;
              font-size: 17px;
              box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.5);
              transition: all 0.2s;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .payment-button:hover {
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              transform: translateY(-2px);
              box-shadow: 0 15px 20px -3px rgba(59, 130, 246, 0.6);
            }
            
            /* Paid Badge */
            .paid-badge { 
              background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
              color: #065f46;
              padding: 28px;
              text-align: center;
              font-weight: 900;
              font-size: 24px;
              border-radius: 12px;
              margin: 32px 0;
              border: 4px solid #10b981;
              letter-spacing: 3px;
              text-transform: uppercase;
              box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
            }
            
            /* Footer */
            .footer-note { 
              font-size: 14px;
              color: #6b7280;
              text-align: center;
              padding: 32px;
              border-top: 3px solid #e5e7eb;
              margin-top: 40px;
              background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
              border-radius: 0 0 12px 12px;
            }
            .footer-note strong {
              color: #374151;
              font-weight: 700;
            }
            .footer-note p {
              margin: 8px 0;
            }
            
            @media only screen and (max-width: 600px) {
              .email-wrapper { padding: 12px; }
              .content { padding: 20px 16px; }
              .section { padding: 16px; }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              <!-- Header with Logo -->
              <div class="header">
                ${logoDataUri ? `
                  <div class="logo-container">
                    <img src="${logoDataUri}" alt="USA Luxury Limo" class="logo-img" />
                  </div>
                ` : `
                  <div class="company-name">USA LUXURY LIMO</div>
                `}
                <div class="tagline">Premium Luxury Transportation Service</div>
              </div>

              <!-- Invoice Ready Banner -->
              <div class="success-banner">
                <h2>\u{1F4C4} YOUR INVOICE IS READY</h2>
              </div>

              <!-- Content -->
              <div class="content">
                <div class="greeting">
                  <p><strong>Dear ${passenger?.firstName || "Customer"},</strong></p>
                  <p>Thank you for booking with USA Luxury Limo Service! Below is your detailed invoice.</p>
                </div>

                <!-- Invoice Information -->
                <div class="section">
                  <div class="section-title">\u{1F4CB} Invoice Information</div>
                  <div class="info-row">
                    <span class="info-label">Invoice Number</span>
                    <span class="info-value">${invoice.invoiceNumber}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Date & time</span>
                    <span class="info-value">${new Date(booking.scheduledDateTime).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Booking REF#</span>
                    <span class="info-value">#${booking.id.toUpperCase().substring(0, 8)}</span>
                  </div>
                </div>

                <!-- Journey Information -->
                <div class="section">
                  <div class="section-title">\u{1F697} Journey Information</div>
                  <div class="info-row">
                    <span class="info-label">Pickup Location:</span>
                    <span class="info-value">${booking.pickupAddress}</span>
                  </div>
                  ${booking.bookingType === "hourly" && booking.requestedHours ? `
                  <div class="info-row">
                    <span class="info-label">Duration:</span>
                    <span class="info-value">${booking.requestedHours} ${booking.requestedHours === 1 ? "Hour" : "Hours"}</span>
                  </div>
                  ` : booking.destinationAddress ? `
                  <div class="info-row">
                    <span class="info-label">Destination:</span>
                    <span class="info-value">${booking.destinationAddress}</span>
                  </div>
                  ` : ""}
                </div>

                <!-- Account -->
                <div class="section">
                  <div class="section-title">\u{1F464} Account Details</div>
                  <div class="info-row">
                    <span class="info-label">Name</span>
                    <span class="info-value">${passenger?.firstName} ${passenger?.lastName}</span>
                  </div>
                  ${passenger?.phone ? `
                  <div class="info-row">
                    <span class="info-label">Phone</span>
                    <span class="info-value">${passenger.phone}</span>
                  </div>
                  ` : ""}
                  ${passenger?.email ? `
                  <div class="info-row">
                    <span class="info-label">E-mail</span>
                    <span class="info-value">${passenger.email}</span>
                  </div>
                  ` : ""}
                </div>

                <!-- Detailed Pricing Breakdown -->
                <div class="pricing-section">
                  <div class="section-title">\u{1F4B0} Detailed Pricing Breakdown</div>
                  ${pricingRows || `
                    <div class="pricing-row">
                      <span class="pricing-label">Journey Fare</span>
                      <span class="pricing-value">$${parseFloat(invoice.subtotal).toFixed(2)}</span>
                    </div>
                  `}
                  
                  <div class="total-section">
                    <div class="total-row">
                      <span class="total-label">Total Amount</span>
                      <span class="total-value">$${parseFloat(invoice.totalAmount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                ${invoice.paidAt ? `
                <!-- Payment Status -->
                <div class="paid-badge">
                  \u2713 PAYMENT RECEIVED
                </div>
                ` : `
                <!-- Payment Link -->
                <div class="payment-link">
                  <p>Click the button below to complete your payment securely</p>
                  <a href="${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "https://your-domain.com"}/pay/${paymentToken}" class="payment-button">Make Payment Now</a>
                </div>
                `}

                <!-- Footer Note -->
                <div class="footer-note">
                  <p>\u{1F4A1} <em>All prices include statutory taxes and transportation expenses</em></p>
                  <br>
                  <p>Best regards,<br><strong>USA Luxury Limo Service</strong></p>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      const emailSent = await sendEmail({
        to: recipientEmail,
        subject: `Invoice #${invoice.invoiceNumber} - USA Luxury Limo`,
        html: emailHtml
      });
      if (!emailSent) {
        return res.status(500).json({
          message: "Failed to send email. Please check SMTP settings."
        });
      }
      res.json({ message: "Invoice sent successfully" });
    } catch (error) {
      console.error("Email invoice error:", error);
      res.status(500).json({ message: "Failed to send invoice email" });
    }
  });
  app2.post("/api/admin/invoices/backfill", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const result2 = await storage.backfillInvoices();
      res.json({
        message: "Backfill completed successfully",
        ...result2
      });
    } catch (error) {
      console.error("Invoice backfill error:", error);
      res.status(500).json({ message: "Failed to backfill invoices" });
    }
  });
  app2.get("/api/payment-tokens/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const paymentToken = await storage.getPaymentToken(token);
      if (!paymentToken) {
        return res.status(404).json({
          valid: false,
          message: "Payment link not found or has expired"
        });
      }
      if (/* @__PURE__ */ new Date() > new Date(paymentToken.expiresAt)) {
        return res.status(400).json({
          valid: false,
          message: "Payment link has expired"
        });
      }
      if (paymentToken.used) {
        return res.status(400).json({
          valid: false,
          message: "This payment link has already been used"
        });
      }
      const invoice = await storage.getInvoice(paymentToken.invoiceId);
      if (!invoice) {
        return res.status(404).json({
          valid: false,
          message: "Invoice not found"
        });
      }
      if (invoice.paidAt) {
        return res.status(400).json({
          valid: false,
          message: "This invoice has already been paid",
          invoice
        });
      }
      const booking = await storage.getBooking(invoice.bookingId);
      if (!booking) {
        return res.status(404).json({
          valid: false,
          message: "Booking not found"
        });
      }
      const passenger = await storage.getUser(booking.passengerId);
      res.json({
        valid: true,
        invoice,
        booking,
        passenger
      });
    } catch (error) {
      console.error("Payment token validation error:", error);
      res.status(500).json({
        valid: false,
        message: "Failed to validate payment link"
      });
    }
  });
  app2.post("/api/payment-intents/invoice", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Payment service not configured" });
      }
      const { token, invoiceId } = req.body;
      if (!token || !invoiceId) {
        return res.status(400).json({ message: "Token and invoice ID are required" });
      }
      const paymentToken = await storage.getPaymentToken(token);
      if (!paymentToken) {
        return res.status(404).json({ message: "Invalid payment token" });
      }
      if (/* @__PURE__ */ new Date() > new Date(paymentToken.expiresAt)) {
        return res.status(400).json({ message: "Payment link has expired" });
      }
      if (paymentToken.used) {
        return res.status(400).json({ message: "Payment link has already been used" });
      }
      if (paymentToken.invoiceId !== invoiceId) {
        return res.status(400).json({ message: "Token does not match invoice" });
      }
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      if (invoice.paidAt) {
        return res.status(400).json({ message: "Invoice already paid" });
      }
      const booking = await storage.getBooking(invoice.bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      const passenger = await storage.getUser(booking.passengerId);
      const amount = Math.round(parseFloat(invoice.totalAmount) * 100);
      const paymentIntentData = {
        amount,
        currency: "usd",
        metadata: {
          invoiceId: invoice.id,
          bookingId: invoice.bookingId,
          paymentToken: token,
          passengerId: booking.passengerId
        },
        automatic_payment_methods: {
          enabled: true
        }
      };
      if (req.user?.id && passenger?.stripeCustomerId) {
        if (req.user.id === booking.passengerId) {
          paymentIntentData.customer = passenger.stripeCustomerId;
          paymentIntentData.setup_future_usage = "off_session";
        }
      } else if (passenger?.email && !passenger.stripeCustomerId) {
        try {
          const customer = await stripe.customers.create({
            email: passenger.email,
            name: `${passenger.firstName} ${passenger.lastName}`,
            metadata: {
              userId: passenger.id
            }
          });
          await storage.updateStripeCustomerId(passenger.id, customer.id);
          paymentIntentData.customer = customer.id;
        } catch (customerError) {
          console.error("Failed to create Stripe customer:", customerError);
        }
      }
      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
      res.json({
        clientSecret: paymentIntent.client_secret
      });
    } catch (error) {
      console.error("Create invoice payment intent error:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });
  app2.post("/api/webhooks/stripe/invoice-payment", async (req, res) => {
    try {
      const event = req.body;
      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        const { invoiceId, paymentToken } = paymentIntent.metadata;
        if (invoiceId && paymentToken) {
          const invoice = await storage.getInvoice(invoiceId);
          if (invoice && invoice.paidAt) {
            console.log(`Webhook already processed for invoice ${invoiceId}`);
            return res.json({ received: true, alreadyProcessed: true });
          }
          await storage.updateInvoice(invoiceId, {
            paidAt: (/* @__PURE__ */ new Date()).toISOString()
          });
          await storage.markPaymentTokenAsUsed(paymentToken);
          if (invoice) {
            await storage.updateBookingPayment(
              invoice.bookingId,
              paymentIntent.id,
              "paid"
            );
            const booking = await storage.getBooking(invoice.bookingId);
            const passenger = booking ? await storage.getUser(booking.passengerId) : null;
            if (passenger && booking) {
              let logoDataUri = "";
              try {
                const logoSetting = await storage.getCmsSetting("BRAND_LOGO_URL");
                if (logoSetting?.value) {
                  const logoPath = logoSetting.value;
                  const fileKey = logoPath.includes("/file/") ? logoPath.split("/file/")[1] : logoPath.replace("/api/object-storage/", "");
                  const ObjectStorage = await import("@replit/object-storage");
                  const storage_client = new ObjectStorage.Client();
                  const logoBuffer = await storage_client.downloadAsBytes(fileKey);
                  if (logoBuffer) {
                    let buffer;
                    if (Buffer.isBuffer(logoBuffer)) {
                      buffer = logoBuffer;
                    } else if (Array.isArray(logoBuffer) && logoBuffer.length > 0) {
                      buffer = Buffer.from(Object.values(logoBuffer[0]));
                    } else if (typeof logoBuffer === "object" && logoBuffer !== null) {
                      buffer = Buffer.from(Object.values(logoBuffer));
                    } else {
                      throw new Error("Unexpected logo buffer format from object storage");
                    }
                    const base64Logo = buffer.toString("base64");
                    const ext = fileKey.split(".").pop()?.toLowerCase();
                    const mimeType = ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "svg" ? "image/svg+xml" : "image/png";
                    logoDataUri = `data:${mimeType};base64,${base64Logo}`;
                  }
                }
              } catch (logoError) {
                console.error("Error fetching logo for payment confirmation email:", logoError);
              }
              const scheduledDateTimeStr = booking.scheduledDateTime ? new Date(booking.scheduledDateTime).toLocaleString() : "Not specified";
              const emailHtml = getPaymentConfirmationEmailHTML({
                passengerName: `${passenger.firstName} ${passenger.lastName}`,
                invoiceNumber: invoice.invoiceNumber,
                bookingId: booking.id,
                amount: invoice.totalAmount,
                paymentDate: (/* @__PURE__ */ new Date()).toLocaleString(),
                pickupAddress: booking.pickupAddress,
                destinationAddress: booking.destinationAddress || "",
                scheduledDateTime: scheduledDateTimeStr,
                paymentIntentId: paymentIntent.id,
                logoDataUri
              });
              if (passenger.email) {
                await sendEmail({
                  to: passenger.email,
                  subject: `Payment Confirmed - Invoice #${invoice.invoiceNumber}`,
                  html: emailHtml
                });
                console.log(`Payment confirmation email sent to ${passenger.email}`);
              }
            }
          }
          console.log(`Invoice ${invoiceId} marked as paid via payment intent ${paymentIntent.id}`);
        }
      }
      res.json({ received: true });
    } catch (error) {
      console.error("Stripe webhook error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });
  app2.get("/api/admin/bookings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin" && user.role !== "dispatcher") {
        return res.status(403).json({ message: "Admin or dispatcher access required" });
      }
      const bookings2 = await storage.getAllBookingsWithDetails();
      res.json(bookings2);
    } catch (error) {
      console.error("Get all bookings error:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });
  app2.get("/api/admin/active-drivers", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin" && user.role !== "dispatcher") {
        return res.status(403).json({ message: "Admin or dispatcher access required" });
      }
      const drivers2 = await storage.getActiveDrivers();
      res.json(drivers2);
    } catch (error) {
      console.error("Get active drivers error:", error);
      res.status(500).json({ message: "Failed to fetch active drivers" });
    }
  });
  app2.get("/api/admin/drivers", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin" && user.role !== "dispatcher") {
        return res.status(403).json({ message: "Admin or dispatcher access required" });
      }
      const allDrivers = await storage.getAllDrivers();
      const enrichedDrivers = await Promise.all(
        allDrivers.map(async (driver) => {
          const driverUser = await storage.getUser(driver.userId);
          return {
            ...driver,
            firstName: driverUser?.firstName,
            lastName: driverUser?.lastName,
            email: driverUser?.email,
            phone: driverUser?.phone,
            isActive: driverUser?.isActive
          };
        })
      );
      res.json(enrichedDrivers);
    } catch (error) {
      console.error("Get all drivers error:", error);
      res.status(500).json({ message: "Failed to fetch drivers" });
    }
  });
  app2.get("/api/admin/drivers/for-assignment", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin" && user.role !== "dispatcher") {
        return res.status(403).json({ message: "Admin or dispatcher access required" });
      }
      const { bookingTime } = req.query;
      const allDrivers = await storage.getAllDrivers();
      const allBookings = await storage.getAllBookingsWithDetails();
      const enrichedDrivers = await Promise.all(
        allDrivers.map(async (driver) => {
          const driverUser = await storage.getUser(driver.userId);
          const upcomingBookings = allBookings.filter(
            (booking) => booking.driverId === driver.id && (booking.status === "pending" || booking.status === "in_progress" || booking.status === "confirmed") && new Date(booking.scheduledDateTime) >= /* @__PURE__ */ new Date()
          );
          let hasConflict = false;
          let conflictingBooking = null;
          if (bookingTime) {
            const requestedTime = new Date(bookingTime);
            const conflictWindow = 2 * 60 * 60 * 1e3;
            conflictingBooking = upcomingBookings.find((b) => {
              const bookingTime2 = new Date(b.scheduledDateTime).getTime();
              const diff = Math.abs(bookingTime2 - requestedTime.getTime());
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
              passengerName: `${conflictingBooking.passengerFirstName} ${conflictingBooking.passengerLastName}`
            } : null
          };
        })
      );
      res.json(enrichedDrivers);
    } catch (error) {
      console.error("Get drivers for assignment error:", error);
      res.status(500).json({ message: "Failed to fetch drivers for assignment" });
    }
  });
  app2.patch("/api/admin/bookings/:id/status", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { id } = req.params;
      const { status } = req.body;
      if (!["pending", "confirmed", "in_progress", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
      const oldBooking = await storage.getBooking(id);
      const oldStatus = oldBooking?.status;
      await storage.updateBookingStatus(id, status);
      const updatedBooking = await storage.getBooking(id);
      if (!updatedBooking) {
        return res.status(404).json({ error: "Booking not found after update" });
      }
      if (oldStatus && oldStatus !== status && updatedBooking.passengerId) {
        try {
          const passenger = await storage.getUser(updatedBooking.passengerId);
          if (passenger?.email) {
            const scheduledDateTime = new Date(updatedBooking.scheduledDateTime).toLocaleString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "America/Chicago"
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
                scheduledDateTime
              })
            });
            if (passenger.phone) {
              try {
                await sendBookingStatusUpdateSMS(
                  passenger.phone,
                  updatedBooking.id,
                  status
                );
              } catch (smsError) {
                console.error("Failed to send booking status update SMS:", smsError);
              }
            }
          }
        } catch (emailError) {
          console.error("Failed to send booking status update email:", emailError);
        }
      }
      return res.json(updatedBooking);
    } catch (error) {
      console.error("Update booking status error:", error);
      return res.status(500).json({ error: "Failed to update booking status" });
    }
  });
  app2.patch("/api/admin/bookings/:id/assign-driver", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin" && user.role !== "dispatcher") {
        return res.status(403).json({ message: "Admin or dispatcher access required" });
      }
      const { id } = req.params;
      const { driverId, driverPayment } = req.body;
      if (!driverId) {
        return res.status(400).json({ error: "Driver ID is required" });
      }
      const updatedBooking = await storage.assignDriverToBooking(id, driverId, driverPayment);
      res.json(updatedBooking);
      (async () => {
        try {
          const driver = await storage.getDriver(driverId);
          const passenger = updatedBooking.passengerId ? await storage.getUser(updatedBooking.passengerId) : null;
          const vehicleType = await storage.getVehicleType(updatedBooking.vehicleTypeId);
          const scheduledDateTime = new Date(updatedBooking.scheduledDateTime).toLocaleString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Chicago"
          });
          if (driver?.userId) {
            const driverUser = await storage.getUser(driver.userId);
            if (driverUser?.email) {
              await sendEmail({
                to: driverUser.email,
                subject: `New Ride Assignment - ${updatedBooking.id}`,
                html: getDriverAssignmentEmailHTML({
                  driverName: `${driverUser.firstName} ${driverUser.lastName}`,
                  bookingId: updatedBooking.id,
                  passengerName: passenger ? `${passenger.firstName} ${passenger.lastName}` : "N/A",
                  passengerPhone: passenger?.phone || "N/A",
                  pickupAddress: updatedBooking.pickupAddress,
                  destinationAddress: updatedBooking.destinationAddress || "N/A",
                  scheduledDateTime,
                  vehicleType: vehicleType?.name || "Standard",
                  driverPayment: updatedBooking.driverPayment || void 0
                })
              });
              if (driverUser.phone && passenger) {
                try {
                  await sendDriverAssignmentSMS(
                    driverUser.phone,
                    `${passenger.firstName} ${passenger.lastName}`,
                    updatedBooking.pickupAddress,
                    new Date(updatedBooking.scheduledDateTime),
                    updatedBooking.driverPayment || void 0
                  );
                } catch (smsError) {
                  console.error("Failed to send driver assignment SMS to driver:", smsError);
                }
              }
            }
          }
          if (passenger && driver?.userId) {
            const driverUser = await storage.getUser(driver.userId);
            if (driverUser) {
              await sendEmail({
                to: passenger.email,
                subject: `Driver Assigned - USA Luxury Limo #${updatedBooking.id.slice(0, 8)}`,
                html: getBookingStatusUpdateEmailHTML({
                  passengerName: `${passenger.firstName || ""} ${passenger.lastName || ""}`.trim() || passenger.username || "Valued Customer",
                  bookingId: updatedBooking.id.slice(0, 8),
                  oldStatus: "pending",
                  newStatus: "confirmed",
                  pickupAddress: updatedBooking.pickupAddress,
                  scheduledDateTime
                })
              });
              if (passenger.phone) {
                try {
                  await sendBookingStatusUpdateSMS(
                    passenger.phone,
                    updatedBooking.id,
                    "confirmed"
                  );
                } catch (smsError) {
                  console.error("Failed to send driver assignment SMS to passenger:", smsError);
                }
              }
            }
          }
        } catch (emailError) {
          console.error("Failed to send driver assignment notifications:", emailError);
        }
      })();
    } catch (error) {
      console.error("Assign driver error:", error);
      res.status(500).json({ error: "Failed to assign driver to booking" });
    }
  });
  app2.patch("/api/admin/bookings/:id/driver-payment", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin" && user.role !== "dispatcher") {
        return res.status(403).json({ message: "Admin or dispatcher access required" });
      }
      const { id } = req.params;
      const { driverPayment } = req.body;
      if (!driverPayment) {
        return res.status(400).json({ error: "Driver payment amount is required" });
      }
      const paymentAmount = parseFloat(driverPayment);
      if (isNaN(paymentAmount) || paymentAmount < 0) {
        return res.status(400).json({ error: "Invalid driver payment amount" });
      }
      const updatedBooking = await storage.updateBookingDriverPayment(id, driverPayment);
      if (!updatedBooking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json(updatedBooking);
    } catch (error) {
      console.error("Update driver payment error:", error);
      res.status(500).json({ error: "Failed to update driver payment" });
    }
  });
  app2.patch("/api/admin/bookings/:id/no-show", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { id } = req.params;
      const { noShow } = req.body;
      const updatedBooking = await storage.updateBooking(id, {
        noShow: noShow === true
      });
      res.json(updatedBooking);
    } catch (error) {
      console.error("Update no-show error:", error);
      res.status(500).json({ message: "Failed to update no-show status" });
    }
  });
  app2.patch("/api/admin/bookings/:id/refund-invoice", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { id } = req.params;
      const updatedBooking = await storage.updateBooking(id, {
        refundInvoiceSent: true
      });
      res.json(updatedBooking);
    } catch (error) {
      console.error("Send refund invoice error:", error);
      res.status(500).json({ message: "Failed to send refund invoice" });
    }
  });
  app2.patch("/api/admin/bookings/:id/mark-completed", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { id } = req.params;
      const updatedBooking = await storage.updateBooking(id, {
        markedCompletedAt: /* @__PURE__ */ new Date()
      });
      res.json(updatedBooking);
    } catch (error) {
      console.error("Mark completed error:", error);
      res.status(500).json({ message: "Failed to mark booking as completed" });
    }
  });
  app2.get("/api/admin/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const allSettings = await storage.getAllSystemSettings();
      const dbCredentials = {};
      allSettings.forEach((setting) => {
        dbCredentials[setting.key] = { value: setting.value, updatedAt: setting.updatedAt };
      });
      const envKeys = ["STRIPE_SECRET_KEY", "STRIPE_PUBLIC_KEY", "TOMTOM_API_KEY", "RAPIDAPI_KEY", "DATABASE_URL"];
      const credentials = [];
      const twilioKeys = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER", "TWILIO_ENABLED"];
      allSettings.forEach((setting) => {
        if (twilioKeys.includes(setting.key)) {
          return;
        }
        const hasEnv = !!process.env[setting.key];
        credentials.push({
          key: setting.key,
          hasValue: true,
          usesEnv: false,
          canDelete: true,
          updatedAt: setting.updatedAt?.toISOString()
        });
      });
      envKeys.forEach((key) => {
        if (process.env[key] && !dbCredentials[key]) {
          credentials.push({
            key,
            hasValue: true,
            usesEnv: true,
            canDelete: false
          });
        }
      });
      const minioKeys = [
        "MINIO_SERVICE_NAME",
        "MINIO_CONSOLE_URL",
        "MINIO_ENDPOINT",
        "MINIO_ACCESS_KEY",
        "MINIO_SECRET_KEY",
        "MINIO_BUCKET"
      ];
      minioKeys.forEach((key) => {
        if (!credentials.find((c) => c.key === key)) {
          credentials.push({
            key,
            hasValue: false,
            usesEnv: false,
            canDelete: true
          });
        }
      });
      res.json({ credentials });
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  app2.post("/api/admin/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { settings } = req.body;
      let minioCredentialsUpdated = false;
      for (const [key, value] of Object.entries(settings)) {
        if (value && typeof value === "string" && value !== "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022") {
          await storage.updateSystemSetting(key, value, userId);
          if (key.startsWith("MINIO_")) {
            minioCredentialsUpdated = true;
          }
        }
      }
      if (minioCredentialsUpdated) {
        refreshObjectStorage();
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });
  app2.get("/api/admin/settings/:key/value", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { key } = req.params;
      const setting = await storage.getSystemSetting(key);
      if (!setting) {
        return res.status(404).json({ message: "Credential not found" });
      }
      res.json({ value: setting.value });
    } catch (error) {
      console.error("Get setting value error:", error);
      res.status(500).json({ message: "Failed to fetch credential value" });
    }
  });
  app2.delete("/api/admin/settings/:key", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { key } = req.params;
      await storage.deleteSystemSetting(key);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete setting error:", error);
      res.status(500).json({ message: "Failed to delete setting" });
    }
  });
  app2.get("/api/admin/database-url", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const setting = await storage.getSystemSetting("DATABASE_URL");
      const currentUrl = process.env.DATABASE_URL || "";
      const encryptionKeyConfigured = hasEncryptionKey();
      res.json({
        hasValue: !!(setting?.value || currentUrl),
        fromDatabase: !!setting?.value,
        fromEnv: !setting?.value && !!currentUrl,
        hasEncryptionKey: encryptionKeyConfigured,
        updatedAt: setting?.updatedAt,
        updatedBy: setting?.updatedBy
      });
    } catch (error) {
      console.error("Get DATABASE_URL error:", error);
      res.status(500).json({ message: "Failed to fetch DATABASE_URL setting" });
    }
  });
  app2.post("/api/admin/database-url", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      if (!hasEncryptionKey()) {
        return res.status(400).json({
          message: "SETTINGS_ENCRYPTION_KEY environment variable is not configured. Please add it to your Replit Secrets or environment variables before using this feature."
        });
      }
      const userId = req.user.id;
      const { databaseUrl } = req.body;
      if (!databaseUrl || typeof databaseUrl !== "string") {
        return res.status(400).json({ message: "Database URL is required" });
      }
      if (!databaseUrl.startsWith("postgres://") && !databaseUrl.startsWith("postgresql://")) {
        return res.status(400).json({ message: "Invalid PostgreSQL connection string format" });
      }
      await storage.updateEncryptedSetting(
        "DATABASE_URL",
        databaseUrl,
        userId,
        "PostgreSQL database connection URL (requires app restart to take effect)"
      );
      res.json({
        success: true,
        message: "DATABASE_URL updated successfully. Restart the application for changes to take effect."
      });
    } catch (error) {
      console.error("Update DATABASE_URL error:", error);
      res.status(500).json({ message: "Failed to update DATABASE_URL" });
    }
  });
  app2.delete("/api/admin/database-url", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      if (!hasEncryptionKey()) {
        return res.status(400).json({
          message: "SETTINGS_ENCRYPTION_KEY environment variable is not configured. Please add it to your Replit Secrets or environment variables before using this feature."
        });
      }
      await storage.deleteSystemSetting("DATABASE_URL");
      res.json({
        success: true,
        message: "DATABASE_URL setting removed. Application will use environment variable on next restart."
      });
    } catch (error) {
      console.error("Delete DATABASE_URL error:", error);
      res.status(500).json({ message: "Failed to delete DATABASE_URL setting" });
    }
  });
  app2.get("/api/admin/system-commission", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const setting = await storage.getSystemSetting("SYSTEM_COMMISSION_PERCENTAGE");
      res.json({
        percentage: setting?.value ? parseFloat(setting.value) : 0,
        description: "System commission percentage applied to ride total costs for driver payments"
      });
    } catch (error) {
      console.error("Get system commission error:", error);
      res.status(500).json({ message: "Failed to fetch system commission" });
    }
  });
  app2.put("/api/admin/system-commission", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { percentage } = req.body;
      if (percentage === void 0 || percentage === null) {
        return res.status(400).json({ message: "Percentage is required" });
      }
      const numPercentage = parseFloat(percentage);
      if (isNaN(numPercentage) || numPercentage < 0 || numPercentage > 100) {
        return res.status(400).json({ message: "Percentage must be between 0 and 100" });
      }
      await storage.updateSystemSetting(
        "SYSTEM_COMMISSION_PERCENTAGE",
        numPercentage.toString(),
        userId
      );
      res.json({
        success: true,
        percentage: numPercentage
      });
    } catch (error) {
      console.error("Update system commission error:", error);
      res.status(500).json({ message: "Failed to update system commission" });
    }
  });
  app2.get("/api/admin/users", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const users2 = await storage.getAllUsers();
      const usersWithDriverInfo = await Promise.all(
        users2.map(async (u) => {
          if (u.role === "driver") {
            const driverInfo = await storage.getDriverByUserId(u.id);
            return {
              ...u,
              password: void 0,
              driverInfo: driverInfo || null
            };
          }
          return {
            ...u,
            password: void 0
          };
        })
      );
      res.json(usersWithDriverInfo);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.put("/api/admin/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { id } = req.params;
      const { role, isActive, payLaterEnabled, cashPaymentEnabled, discountType, discountValue, firstName, lastName, email, phone, vehiclePlate, username } = req.body;
      const updates = {};
      if (role !== void 0) updates.role = role;
      if (isActive !== void 0) updates.isActive = isActive;
      if (payLaterEnabled !== void 0) updates.payLaterEnabled = payLaterEnabled;
      if (cashPaymentEnabled !== void 0) updates.cashPaymentEnabled = cashPaymentEnabled;
      if (discountType !== void 0) updates.discountType = discountType;
      if (discountValue !== void 0) {
        const value = parseFloat(discountValue);
        if (isNaN(value) || value < 0) {
          return res.status(400).json({ message: "Invalid discount value" });
        }
        if (discountType === "percentage" && value > 100) {
          return res.status(400).json({ message: "Percentage discount cannot exceed 100%" });
        }
        updates.discountValue = discountValue.toString();
      }
      if (firstName !== void 0) updates.firstName = firstName;
      if (lastName !== void 0) updates.lastName = lastName;
      if (email !== void 0) updates.email = email;
      if (phone !== void 0) updates.phone = phone;
      if (username !== void 0) {
        if (username.trim()) {
          const usernameRegex = /^[a-zA-Z0-9_-]+$/;
          if (!usernameRegex.test(username) || username.length < 3 || username.length > 30) {
            return res.status(400).json({
              message: "Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens"
            });
          }
          const existingUser = await storage.getUserByUsername(username);
          if (existingUser && existingUser.id !== id) {
            return res.status(400).json({ message: "Username is already taken" });
          }
          updates.username = username;
        } else {
          updates.username = null;
        }
      }
      const updatedUser = await storage.updateUser(id, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      if (role === "driver") {
        const existingDriver = await storage.getDriverByUserId(id);
        if (!existingDriver) {
          await storage.createDriver({
            userId: id,
            vehiclePlate: vehiclePlate || null
          });
        } else if (vehiclePlate !== void 0) {
          await storage.updateDriver(existingDriver.id, { vehiclePlate });
        }
      }
      res.json({ ...updatedUser, password: void 0 });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  app2.post("/api/admin/users", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { firstName, lastName, email, phone, role, isActive, payLaterEnabled, cashPaymentEnabled, vehiclePlate } = req.body;
      if (!firstName || !email) {
        return res.status(400).json({ message: "First name and email are required" });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      const tempPassword = Math.random().toString(36).slice(-10);
      let defaultIsActive = true;
      if (role === "admin") {
        defaultIsActive = false;
      }
      const newUser = await storage.createUser({
        email,
        password: tempPassword,
        firstName,
        lastName: lastName || "",
        phone: phone || "",
        role: role || "passenger",
        isActive: isActive !== void 0 ? isActive : defaultIsActive,
        payLaterEnabled: payLaterEnabled || false,
        cashPaymentEnabled: cashPaymentEnabled || false
      });
      if (role === "driver") {
        await storage.createDriver({
          userId: newUser.id,
          vehiclePlate: vehiclePlate || null
        });
      }
      res.json({ ...newUser, password: void 0 });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  app2.delete("/api/admin/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { id } = req.params;
      if (id === userId) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  app2.post("/api/admin/users/:id/set-temp-password", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { id } = req.params;
      const { temporaryPassword } = req.body;
      if (!temporaryPassword || temporaryPassword.length < 6) {
        return res.status(400).json({ message: "Temporary password must be at least 6 characters" });
      }
      if (id === userId) {
        return res.status(400).json({ message: "Cannot set temporary password for yourself" });
      }
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const hashedPassword = await hashPassword(temporaryPassword);
      await storage.updateUser(id, { password: hashedPassword });
      await storage.clearPasswordResetToken(id);
      if (user.email) {
        sendTemporaryPasswordEmail(user.email, temporaryPassword, user.username).catch(
          (err) => console.error("Failed to send temp password email:", err)
        );
      }
      if (user.phone) {
        sendTemporaryPasswordSMS(user.phone, temporaryPassword).catch(
          (err) => console.error("Failed to send temp password SMS:", err)
        );
      }
      res.json({ message: "Temporary password set successfully" });
    } catch (error) {
      console.error("Error setting temporary password:", error);
      res.status(500).json({ message: "Failed to set temporary password" });
    }
  });
  app2.get("/api/driver/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "driver") {
        return res.status(403).json({ message: "Driver access required" });
      }
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: "Driver profile not found" });
      }
      const allBookings = await storage.getBookingsByDriver(driver.id);
      const completedRides = allBookings.filter((b) => b.status === "completed").length;
      const avgRating = await storage.getDriverAverageRating(driver.id);
      res.json({
        ...driver,
        completedRides,
        rating: avgRating || 0
      });
    } catch (error) {
      console.error("Get driver profile error:", error);
      res.status(500).json({ message: "Failed to fetch driver profile" });
    }
  });
  app2.patch("/api/driver/availability", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "driver") {
        return res.status(403).json({ message: "Driver access required" });
      }
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: "Driver profile not found" });
      }
      const { isAvailable } = req.body;
      if (typeof isAvailable !== "boolean") {
        return res.status(400).json({ message: "isAvailable must be a boolean" });
      }
      const updatedDriver = await storage.updateDriverAvailability(driver.id, isAvailable);
      res.json(updatedDriver);
    } catch (error) {
      console.error("Update driver availability error:", error);
      res.status(500).json({ message: "Failed to update availability" });
    }
  });
  app2.patch("/api/driver/location", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "driver") {
        return res.status(403).json({ message: "Driver access required" });
      }
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: "Driver profile not found" });
      }
      const { lat, lng } = req.body;
      if (typeof lat !== "number" || typeof lng !== "number") {
        return res.status(400).json({ message: "Valid latitude and longitude required" });
      }
      const location = JSON.stringify({ lat, lng, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
      const updatedDriver = await storage.updateDriverLocation(driver.id, location);
      res.json({ success: true });
    } catch (error) {
      console.error("Update driver location error:", error);
      res.status(500).json({ message: "Failed to update location" });
    }
  });
  app2.patch("/api/driver/credentials", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "driver") {
        return res.status(403).json({ message: "Driver access required" });
      }
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: "Driver profile not found" });
      }
      const { driverCredentials } = req.body;
      if (typeof driverCredentials !== "string") {
        return res.status(400).json({ message: "driverCredentials must be a string" });
      }
      const updatedDriver = await storage.updateDriver(driver.id, { driverCredentials });
      res.json(updatedDriver);
    } catch (error) {
      console.error("Update driver credentials error:", error);
      res.status(500).json({ message: "Failed to update credentials" });
    }
  });
  app2.patch("/api/driver/vehicle-plate", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "driver") {
        return res.status(403).json({ message: "Driver access required" });
      }
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: "Driver profile not found" });
      }
      const { vehiclePlate } = req.body;
      if (typeof vehiclePlate !== "string") {
        return res.status(400).json({ message: "vehiclePlate must be a string" });
      }
      const updatedDriver = await storage.updateDriver(driver.id, { vehiclePlate });
      res.json(updatedDriver);
    } catch (error) {
      console.error("Update driver vehicle plate error:", error);
      res.status(500).json({ message: "Failed to update vehicle plate" });
    }
  });
  app2.get("/api/driver/earnings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "driver") {
        return res.status(403).json({ message: "Driver access required" });
      }
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: "Driver profile not found" });
      }
      const allBookings = await storage.getBookingsByDriver(driver.id);
      const completedBookings = allBookings.filter((b) => b.status === "completed" && b.driverPayment);
      const now = /* @__PURE__ */ new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const todayEarnings = completedBookings.filter((b) => {
        const completedDate = b.markedCompletedAt || b.updatedAt;
        return completedDate ? new Date(completedDate) >= startOfToday : false;
      }).reduce((sum, b) => sum + parseFloat(b.driverPayment || "0"), 0);
      const weekEarnings = completedBookings.filter((b) => {
        const completedDate = b.markedCompletedAt || b.updatedAt;
        return completedDate ? new Date(completedDate) >= startOfWeek : false;
      }).reduce((sum, b) => sum + parseFloat(b.driverPayment || "0"), 0);
      const monthEarnings = completedBookings.filter((b) => {
        const completedDate = b.markedCompletedAt || b.updatedAt;
        return completedDate ? new Date(completedDate) >= startOfMonth : false;
      }).reduce((sum, b) => sum + parseFloat(b.driverPayment || "0"), 0);
      const yearEarnings = completedBookings.filter((b) => {
        const completedDate = b.markedCompletedAt || b.updatedAt;
        return completedDate ? new Date(completedDate) >= startOfYear : false;
      }).reduce((sum, b) => sum + parseFloat(b.driverPayment || "0"), 0);
      const allTimeEarnings = completedBookings.reduce((sum, b) => sum + parseFloat(b.driverPayment || "0"), 0);
      res.json({
        today: todayEarnings,
        week: weekEarnings,
        month: monthEarnings,
        year: yearEarnings,
        allTime: allTimeEarnings,
        currentDate: now.toISOString(),
        completedRidesCount: completedBookings.length
      });
    } catch (error) {
      console.error("Get driver earnings error:", error);
      res.status(500).json({ message: "Failed to fetch earnings" });
    }
  });
  app2.post("/api/driver/job/accept", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "driver") {
        return res.status(403).json({ message: "Driver access required" });
      }
      const { bookingId, lat, lng } = req.body;
      if (!bookingId || typeof lat !== "number" || typeof lng !== "number") {
        return res.status(400).json({ message: "Booking ID and GPS coordinates required" });
      }
      const location = { lat, lng, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
      const updatedBooking = await storage.updateBooking(bookingId, {
        acceptedAt: /* @__PURE__ */ new Date(),
        acceptedLocation: location
      });
      res.json(updatedBooking);
    } catch (error) {
      console.error("Accept job error:", error);
      res.status(500).json({ message: "Failed to accept job" });
    }
  });
  app2.post("/api/driver/job/start", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "driver") {
        return res.status(403).json({ message: "Driver access required" });
      }
      const { bookingId, lat, lng } = req.body;
      if (!bookingId || typeof lat !== "number" || typeof lng !== "number") {
        return res.status(400).json({ message: "Booking ID and GPS coordinates required" });
      }
      const location = { lat, lng, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
      const updatedBooking = await storage.updateBooking(bookingId, {
        startedAt: /* @__PURE__ */ new Date(),
        startedLocation: location,
        status: "in_progress"
      });
      res.json(updatedBooking);
    } catch (error) {
      console.error("Start job error:", error);
      res.status(500).json({ message: "Failed to start job" });
    }
  });
  app2.post("/api/driver/job/dod", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "driver") {
        return res.status(403).json({ message: "Driver access required" });
      }
      const { bookingId, lat, lng } = req.body;
      if (!bookingId || typeof lat !== "number" || typeof lng !== "number") {
        return res.status(400).json({ message: "Booking ID and GPS coordinates required" });
      }
      const location = { lat, lng, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
      const updatedBooking = await storage.updateBooking(bookingId, {
        dodAt: /* @__PURE__ */ new Date(),
        dodLocation: location
      });
      res.json(updatedBooking);
    } catch (error) {
      console.error("DOD error:", error);
      res.status(500).json({ message: "Failed to update DOD" });
    }
  });
  app2.post("/api/driver/job/pob", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "driver") {
        return res.status(403).json({ message: "Driver access required" });
      }
      const { bookingId, lat, lng } = req.body;
      if (!bookingId || typeof lat !== "number" || typeof lng !== "number") {
        return res.status(400).json({ message: "Booking ID and GPS coordinates required" });
      }
      const location = { lat, lng, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
      const updatedBooking = await storage.updateBooking(bookingId, {
        pobAt: /* @__PURE__ */ new Date(),
        pobLocation: location
      });
      res.json(updatedBooking);
    } catch (error) {
      console.error("POB error:", error);
      res.status(500).json({ message: "Failed to update POB" });
    }
  });
  app2.post("/api/driver/job/end", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "driver") {
        return res.status(403).json({ message: "Driver access required" });
      }
      const { bookingId, lat, lng } = req.body;
      if (!bookingId || typeof lat !== "number" || typeof lng !== "number") {
        return res.status(400).json({ message: "Booking ID and GPS coordinates required" });
      }
      const location = { lat, lng, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
      const updatedBooking = await storage.updateBooking(bookingId, {
        endedAt: /* @__PURE__ */ new Date(),
        endedLocation: location,
        status: "completed"
      });
      res.json(updatedBooking);
    } catch (error) {
      console.error("End job error:", error);
      res.status(500).json({ message: "Failed to end job" });
    }
  });
  app2.post("/api/driver/documents/upload", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "driver") {
        return res.status(403).json({ message: "Driver access required" });
      }
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: "Driver profile not found" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const { documentType, expirationDate, vehiclePlate, whatsappNumber } = req.body;
      const docDataToValidate = {
        driverId: driver.id,
        documentType,
        documentUrl: "temp",
        // Will be replaced after upload
        status: "pending"
        // Explicitly set to pending, cannot be overridden
      };
      if (expirationDate && documentType !== "vehicle_image") {
        docDataToValidate.expirationDate = new Date(expirationDate);
      }
      if (vehiclePlate && documentType === "vehicle_image") {
        docDataToValidate.vehiclePlate = vehiclePlate;
      }
      if (whatsappNumber) {
        docDataToValidate.whatsappNumber = whatsappNumber;
      }
      const validationResult = insertDriverDocumentSchema.safeParse(docDataToValidate);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid document data",
          errors: validationResult.error.errors
        });
      }
      const file = req.file;
      const fileExtension = file.originalname.split(".").pop();
      const fileName = `driver-docs/${driver.id}/${documentType}-${Date.now()}.${fileExtension}`;
      const objStorage = await getObjectStorage();
      const { ok, error } = await objStorage.uploadFromBytes(
        fileName,
        file.buffer
      );
      if (!ok) {
        console.error("Upload to Object Storage failed:", error);
        return res.status(500).json({ message: `Upload failed: ${error}` });
      }
      const validatedData = validationResult.data;
      validatedData.documentUrl = fileName;
      const document = await storage.createDriverDocument(validatedData);
      if (documentType === "profile_photo" || documentType === "vehicle_image") {
        const imageUrl = fileName;
        await storage.updateUser(userId, {
          profileImageUrl: imageUrl
        });
      }
      res.json({
        success: true,
        document,
        message: "Document uploaded successfully"
      });
    } catch (error) {
      console.error("Document upload error:", error);
      if (error.message && error.message.includes("File too large")) {
        return res.status(400).json({ message: "File size exceeds 2MB limit" });
      }
      if (error.message && error.message.includes("Invalid file type")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to upload document" });
    }
  });
  app2.get("/api/driver/documents", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      let driverId;
      if (user.role === "driver") {
        const driver = await storage.getDriverByUserId(userId);
        if (!driver) {
          return res.status(404).json({ message: "Driver profile not found" });
        }
        driverId = driver.id;
      } else if (user.role === "admin") {
        driverId = req.query.driverId;
        if (!driverId) {
          return res.status(400).json({ message: "Driver ID required for admin" });
        }
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
      const documents = await storage.getDriverDocuments(driverId);
      const documentsWithUrls = await Promise.all(
        documents.map(async (doc) => ({
          ...doc,
          documentUrl: await getPresignedUrl(doc.documentUrl)
        }))
      );
      res.json(documentsWithUrls);
    } catch (error) {
      console.error("Get driver documents error:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });
  app2.get("/api/driver/documents/:id/download", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const { id } = req.params;
      const document = await storage.getDriverDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      if (user.role === "driver") {
        const driver = await storage.getDriverByUserId(userId);
        if (!driver || driver.id !== document.driverId) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else if (user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const objStorage = await getObjectStorage();
      const { ok, value, error } = await objStorage.downloadAsBytes(document.documentUrl);
      if (!ok) {
        return res.status(404).json({ message: `File not found: ${error}` });
      }
      let buffer;
      if (Buffer.isBuffer(value)) {
        buffer = value;
      } else if (Array.isArray(value) && value.length > 0) {
        const byteArray = Object.values(value[0]);
        buffer = Buffer.from(byteArray);
      } else {
        throw new Error("Unexpected value format from object storage");
      }
      const extension = document.documentUrl.split(".").pop()?.toLowerCase();
      const contentTypeMap = {
        "pdf": "application/pdf",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
        "heic": "image/heic",
        "heif": "image/heif"
      };
      const contentType = contentTypeMap[extension || ""] || "application/octet-stream";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `inline; filename="${document.documentType}.${extension}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Document download error:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });
  app2.get("/driver-docs/:driverId/:filename", async (req, res) => {
    try {
      const { driverId, filename } = req.params;
      const filePath = `driver-docs/${driverId}/${filename}`;
      const objStorage = await getObjectStorage();
      const { ok, value, error } = await objStorage.downloadAsBytes(filePath);
      if (!ok) {
        return res.status(404).json({ message: `File not found: ${error}` });
      }
      let buffer;
      if (Buffer.isBuffer(value)) {
        buffer = value;
      } else if (Array.isArray(value) && value.length > 0) {
        const byteArray = Object.values(value[0]);
        buffer = Buffer.from(byteArray);
      } else {
        throw new Error("Unexpected value format from object storage");
      }
      const extension = filename.split(".").pop()?.toLowerCase();
      const contentTypeMap = {
        "pdf": "application/pdf",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
        "heic": "image/heic",
        "heif": "image/heif"
      };
      const contentType = contentTypeMap[extension || ""] || "application/octet-stream";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=31536000");
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Driver document file serving error:", error);
      res.status(500).json({ message: "Failed to load file" });
    }
  });
  app2.delete("/api/driver/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const { id } = req.params;
      const document = await storage.getDriverDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      if (user.role === "driver") {
        const driver = await storage.getDriverByUserId(userId);
        if (!driver || driver.id !== document.driverId) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else if (user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const objStorage = await getObjectStorage();
      const storageKey = extractStorageKey(document.documentUrl);
      const { ok, error } = await objStorage.delete(storageKey);
      if (!ok) {
        console.error("Failed to delete from object storage:", error);
      }
      await storage.deleteDriverDocument(id);
      res.json({ success: true, message: "Document deleted successfully" });
    } catch (error) {
      console.error("Delete document error:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });
  app2.post("/api/admin/backfill-drivers", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const allUsers = await storage.getAllUsers();
      const driverUsers = allUsers.filter((u) => u.role === "driver");
      let created = 0;
      let existing = 0;
      for (const driverUser of driverUsers) {
        const existingDriver = await storage.getDriverByUserId(driverUser.id);
        if (!existingDriver) {
          await storage.createDriver({
            userId: driverUser.id
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
      console.error("Backfill drivers error:", error);
      res.status(500).json({ message: "Failed to backfill driver records" });
    }
  });
  app2.get("/api/admin/driver-documents", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const drivers2 = await storage.getAllUsers();
      const driverUsers = drivers2.filter((u) => u.role === "driver");
      const allDocuments = [];
      for (const driverUser of driverUsers) {
        const driver = await storage.getDriverByUserId(driverUser.id);
        if (driver) {
          const docs = await storage.getDriverDocuments(driver.id);
          const docsWithDriver = docs.map((doc) => ({
            ...doc,
            driverInfo: {
              userId: driverUser.id,
              firstName: driverUser.firstName,
              lastName: driverUser.lastName,
              email: driverUser.email
            }
          }));
          allDocuments.push(...docsWithDriver);
        }
      }
      allDocuments.sort((a, b) => {
        const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        return dateB - dateA;
      });
      res.json(allDocuments);
    } catch (error) {
      console.error("Get all driver documents error:", error);
      res.status(500).json({ message: "Failed to fetch driver documents" });
    }
  });
  app2.post("/api/admin/driver-documents/upload", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const { userId: driverUserId, documentType, expirationDate, vehiclePlate, whatsappNumber } = req.body;
      if (!driverUserId) {
        return res.status(400).json({ message: "Driver user ID is required" });
      }
      const driver = await storage.getDriverByUserId(driverUserId);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      const docDataToValidate = {
        driverId: driver.id,
        documentType,
        documentUrl: "temp",
        // Will be replaced after upload
        status: "pending"
        // Explicitly set to pending
      };
      if (expirationDate && documentType !== "vehicle_image") {
        docDataToValidate.expirationDate = new Date(expirationDate);
      }
      if (vehiclePlate && documentType === "vehicle_image") {
        docDataToValidate.vehiclePlate = vehiclePlate;
      }
      if (whatsappNumber) {
        docDataToValidate.whatsappNumber = whatsappNumber;
      }
      const validationResult = insertDriverDocumentSchema.safeParse(docDataToValidate);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid document data",
          errors: validationResult.error.errors
        });
      }
      const file = req.file;
      const fileExtension = file.originalname.split(".").pop();
      const fileName = `driver-docs/${driver.id}/${documentType}-${Date.now()}.${fileExtension}`;
      const objStorage = await getObjectStorage();
      const { ok, error } = await objStorage.uploadFromBytes(
        fileName,
        file.buffer
      );
      if (!ok) {
        console.error("Upload to Object Storage failed:", error);
        return res.status(500).json({ message: `Upload failed: ${error}` });
      }
      const validatedData = validationResult.data;
      validatedData.documentUrl = fileName;
      const document = await storage.createDriverDocument(validatedData);
      res.json({
        success: true,
        document
      });
    } catch (error) {
      console.error("Admin document upload error:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });
  app2.put("/api/admin/driver-documents/:id/status", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { id } = req.params;
      const { status, rejectionReason } = req.body;
      const statusUpdateSchema = z3.object({
        status: z3.enum(["pending", "approved", "rejected"]),
        rejectionReason: z3.string().optional()
      }).refine(
        (data) => data.status !== "rejected" || data.rejectionReason && data.rejectionReason.length > 0,
        {
          message: "Rejection reason is required when rejecting a document",
          path: ["rejectionReason"]
        }
      );
      const validationResult = statusUpdateSchema.safeParse({ status, rejectionReason });
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid status update data",
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
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(updatedDoc);
    } catch (error) {
      console.error("Update document status error:", error);
      res.status(500).json({ message: "Failed to update document status" });
    }
  });
  app2.get("/api/payment-systems", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const systems = await storage.getPaymentSystems();
      const sanitizedSystems = systems.map((system) => ({
        ...system,
        publicKey: system.publicKey ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : null,
        secretKey: system.secretKey ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : null,
        webhookSecret: system.webhookSecret ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : null
      }));
      res.json(sanitizedSystems);
    } catch (error) {
      console.error("Get payment systems error:", error);
      res.status(500).json({ message: "Failed to fetch payment systems" });
    }
  });
  app2.get("/api/payment-systems/active", async (req, res) => {
    try {
      const activeSystem = await storage.getActivePaymentSystem();
      if (!activeSystem) {
        return res.json(null);
      }
      res.json({
        provider: activeSystem.provider,
        isActive: activeSystem.isActive
      });
    } catch (error) {
      console.error("Get active payment system error:", error);
      res.status(500).json({ message: "Failed to fetch active payment system" });
    }
  });
  app2.post("/api/payment-systems", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const newSystem = await storage.createPaymentSystem(req.body);
      const sanitizedSystem = {
        ...newSystem,
        publicKey: newSystem.publicKey ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : null,
        secretKey: newSystem.secretKey ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : null,
        webhookSecret: newSystem.webhookSecret ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : null
      };
      res.json(sanitizedSystem);
    } catch (error) {
      console.error("Create payment system error:", error);
      if (error.code === "23505") {
        return res.status(409).json({ message: "Payment system already exists" });
      }
      res.status(500).json({ message: "Failed to create payment system" });
    }
  });
  app2.put("/api/payment-systems/:provider", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const updatedSystem = await storage.updatePaymentSystem(req.params.provider, req.body);
      if (!updatedSystem) {
        return res.status(404).json({ message: "Payment system not found" });
      }
      const sanitizedSystem = {
        ...updatedSystem,
        publicKey: updatedSystem.publicKey ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : null,
        secretKey: updatedSystem.secretKey ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : null,
        webhookSecret: updatedSystem.webhookSecret ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : null
      };
      res.json(sanitizedSystem);
    } catch (error) {
      console.error("Update payment system error:", error);
      res.status(500).json({ message: "Failed to update payment system" });
    }
  });
  app2.put("/api/payment-systems/:provider/activate", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      await storage.setActivePaymentSystem(req.params.provider);
      res.json({ success: true });
    } catch (error) {
      console.error("Set active payment system error:", error);
      res.status(500).json({ message: "Failed to set active payment system" });
    }
  });
  app2.delete("/api/payment-systems/:provider", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      await storage.deletePaymentSystem(req.params.provider);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete payment system error:", error);
      res.status(500).json({ message: "Failed to delete payment system" });
    }
  });
  app2.get("/api/admin/pricing-rules", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const rules = await storage.getPricingRules();
      res.json(rules);
    } catch (error) {
      console.error("Get pricing rules error:", error);
      res.status(500).json({ message: "Failed to fetch pricing rules" });
    }
  });
  app2.get("/api/admin/pricing-rules/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const rule = await storage.getPricingRule(req.params.id);
      if (!rule) {
        return res.status(404).json({ message: "Pricing rule not found" });
      }
      res.json(rule);
    } catch (error) {
      console.error("Get pricing rule error:", error);
      res.status(500).json({ message: "Failed to fetch pricing rule" });
    }
  });
  app2.post("/api/admin/pricing-rules", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const validatedData = insertPricingRuleSchema.parse(req.body);
      const newRule = await storage.createPricingRule(validatedData);
      res.json(newRule);
    } catch (error) {
      console.error("Create pricing rule error:", error);
      if (error.code === "23505" || error.message?.includes("unique")) {
        return res.status(409).json({
          message: `A pricing rule already exists for ${req.body.vehicleType} with ${req.body.serviceType} service type`
        });
      }
      res.status(400).json({ message: error.message || "Failed to create pricing rule" });
    }
  });
  app2.put("/api/admin/pricing-rules/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      if (req.body.serviceType || req.body.baseRate || req.body.perMileRate || req.body.hourlyRate || req.body.minimumHours) {
        const existingRule = await storage.getPricingRule(req.params.id);
        if (!existingRule) {
          return res.status(404).json({ message: "Pricing rule not found" });
        }
        const mergedData = { ...existingRule, ...req.body };
        const validatedData = insertPricingRuleSchema.parse(mergedData);
        const updatedRule = await storage.updatePricingRule(req.params.id, req.body);
        res.json(updatedRule);
      } else {
        const updatedRule = await storage.updatePricingRule(req.params.id, req.body);
        if (!updatedRule) {
          return res.status(404).json({ message: "Pricing rule not found" });
        }
        res.json(updatedRule);
      }
    } catch (error) {
      console.error("Update pricing rule error:", error);
      res.status(400).json({ message: error.message || "Failed to update pricing rule" });
    }
  });
  app2.delete("/api/admin/pricing-rules/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      await storage.deletePricingRule(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete pricing rule error:", error);
      res.status(500).json({ message: "Failed to delete pricing rule" });
    }
  });
  app2.get("/api/pricing-rules/available", async (req, res) => {
    try {
      const { serviceType } = req.query;
      if (!serviceType || serviceType !== "transfer" && serviceType !== "hourly") {
        return res.status(400).json({ message: "Valid serviceType (transfer or hourly) is required" });
      }
      const allRules = await storage.getPricingRules();
      const availableRules = allRules.filter(
        (rule) => rule.isActive && rule.serviceType === serviceType && (!rule.effectiveStart || new Date(rule.effectiveStart) <= /* @__PURE__ */ new Date()) && (!rule.effectiveEnd || new Date(rule.effectiveEnd) >= /* @__PURE__ */ new Date())
      );
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
      }, {});
      res.json(pricingByVehicle);
    } catch (error) {
      console.error("Get available pricing rules error:", error);
      res.status(500).json({ message: "Failed to fetch pricing rules" });
    }
  });
  app2.post("/api/calculate-price", async (req, res) => {
    try {
      const { vehicleType, serviceType, distance, hours, date, time, airportCode, userId } = req.body;
      if (!vehicleType || !serviceType) {
        return res.status(400).json({ message: "vehicleType and serviceType are required" });
      }
      const allRules = await storage.getPricingRules();
      const rule = allRules.find(
        (r) => r.vehicleType === vehicleType && r.serviceType === serviceType && r.isActive && (!r.effectiveStart || new Date(r.effectiveStart) <= /* @__PURE__ */ new Date()) && (!r.effectiveEnd || new Date(r.effectiveEnd) >= /* @__PURE__ */ new Date())
      );
      if (!rule) {
        return res.status(404).json({ message: "No active pricing rule found for this vehicle and service type" });
      }
      let basePrice = 0;
      let breakdown = {
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
      if (serviceType === "transfer") {
        if (!distance) {
          return res.status(400).json({ message: "distance is required for transfer service" });
        }
        const distanceInMiles = parseFloat(distance);
        basePrice = parseFloat(rule.baseRate || "0");
        breakdown.baseFare = basePrice;
        if (rule.distanceTiers && rule.distanceTiers.length > 0) {
          let remainingDistance = distanceInMiles;
          let distanceCost = 0;
          for (const tier of rule.distanceTiers) {
            if (tier.isRemaining) {
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
          breakdown.distanceFare = distanceInMiles * parseFloat(rule.perMileRate);
        }
        breakdown.subtotal = breakdown.baseFare + breakdown.distanceFare;
        if (rule.minimumFare) {
          const minFare = parseFloat(rule.minimumFare);
          if (breakdown.subtotal < minFare) {
            breakdown.subtotal = minFare;
          }
        }
      } else if (serviceType === "hourly") {
        if (!hours) {
          return res.status(400).json({ message: "hours is required for hourly service" });
        }
        const requestedHours = parseInt(hours);
        const hourlyRate = parseFloat(rule.hourlyRate || "0");
        const minimumHours = parseInt(String(rule.minimumHours || "0"));
        const billedHours = Math.max(requestedHours, minimumHours);
        breakdown.timeFare = billedHours * hourlyRate;
        breakdown.subtotal = breakdown.timeFare;
      }
      breakdown.surgeAmount = 0;
      if (date && time && rule.surgePricing && rule.surgePricing.length > 0) {
        const requestDate = /* @__PURE__ */ new Date(`${date}T${time}`);
        const dayOfWeek = requestDate.getDay();
        const timeStr = time;
        for (const surge of rule.surgePricing) {
          const dayMatches = surge.dayOfWeek === dayOfWeek || surge.dayOfWeek === -1;
          const timeMatches = timeStr >= surge.startTime && timeStr <= surge.endTime;
          if (dayMatches && timeMatches) {
            breakdown.surgeMultiplier = parseFloat(String(surge.multiplier));
            breakdown.surgeAmount = (breakdown.surgeMultiplier - 1) * breakdown.subtotal;
            break;
          }
        }
      }
      if (rule.gratuityPercent) {
        const gratuityPercent = parseFloat(rule.gratuityPercent);
        breakdown.gratuity = breakdown.subtotal * (gratuityPercent / 100);
      }
      if (airportCode && rule.airportFees) {
        const airportFeeEntry = rule.airportFees.find(
          (fee) => fee.airportCode.toUpperCase() === airportCode.toUpperCase()
        );
        if (airportFeeEntry) {
          breakdown.airportFee = parseFloat(String(airportFeeEntry.fee));
        }
      }
      if (rule.meetAndGreet && rule.meetAndGreet.enabled) {
        breakdown.meetAndGreetFee = parseFloat(String(rule.meetAndGreet.charge || 0));
      }
      breakdown.total = breakdown.subtotal + breakdown.surgeAmount + breakdown.gratuity + breakdown.airportFee + breakdown.meetAndGreetFee;
      let discountAmount = 0;
      let discountType = null;
      let discountValue = null;
      if (userId) {
        const user = await storage.getUser(userId);
        if (user && user.discountValue && parseFloat(user.discountValue) > 0) {
          discountType = user.discountType;
          discountValue = parseFloat(user.discountValue);
          if (discountType === "percentage") {
            discountAmount = breakdown.total * (discountValue / 100);
          } else if (discountType === "fixed") {
            discountAmount = discountValue;
          }
          discountAmount = Math.min(discountAmount, breakdown.total);
        }
      }
      breakdown.discount = discountAmount;
      breakdown.finalTotal = breakdown.total - discountAmount;
      res.json({
        vehicleType,
        serviceType,
        price: breakdown.finalTotal.toFixed(2),
        regularPrice: breakdown.total.toFixed(2),
        // Price before discount
        discountPercentage: discountType === "percentage" ? discountValue : 0,
        discountAmount: discountAmount.toFixed(2),
        finalPrice: breakdown.finalTotal.toFixed(2),
        // Price after discount
        // Detailed breakdown fields for database storage
        baseFare: breakdown.subtotal.toFixed(2),
        gratuityAmount: breakdown.gratuity.toFixed(2),
        airportFeeAmount: breakdown.airportFee.toFixed(2),
        surgePricingMultiplier: breakdown.surgeMultiplier,
        surgePricingAmount: breakdown.surgeAmount.toFixed(2),
        breakdown,
        ruleId: rule.id,
        discount: discountAmount > 0 ? {
          type: discountType,
          value: discountValue,
          amount: discountAmount
        } : null
      });
    } catch (error) {
      console.error("Calculate price error:", error);
      res.status(500).json({ message: "Failed to calculate price" });
    }
  });
  app2.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Payment service not configured" });
      }
      const { amount, bookingId } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Valid amount is required" });
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        // Convert to cents
        currency: "usd",
        metadata: {
          bookingId: bookingId || "",
          userId: req.user.id
        }
      });
      if (bookingId) {
        await storage.updateBookingPayment(bookingId, paymentIntent.id, "pending");
      }
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("Payment intent error:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });
  app2.get("/api/payment-methods", isAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Payment service not configured" });
      }
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!user.stripeCustomerId) {
        return res.json({ paymentMethods: [], defaultPaymentMethodId: null });
      }
      const [paymentMethods, customer] = await Promise.all([
        stripe.paymentMethods.list({
          customer: user.stripeCustomerId,
          type: "card"
        }),
        stripe.customers.retrieve(user.stripeCustomerId)
      ]);
      const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method || null;
      res.json({
        paymentMethods: paymentMethods.data,
        defaultPaymentMethodId
      });
    } catch (error) {
      console.error("Get payment methods error:", error);
      res.status(500).json({ message: "Failed to fetch payment methods" });
    }
  });
  app2.post("/api/payment-methods", isAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Payment service not configured" });
      }
      const userId = req.user.id;
      const { paymentMethodId } = req.body;
      if (!paymentMethodId) {
        return res.status(400).json({ message: "Payment method ID is required" });
      }
      let user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!user.stripeCustomerId) {
        const customerParams = {
          email: user.email || void 0,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || void 0,
          metadata: {
            userId
          }
        };
        const customer = await stripe.customers.create(customerParams);
        await storage.updateStripeCustomerId(userId, customer.id);
        user = await storage.getUser(userId);
      }
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: user.stripeCustomerId
      });
      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      res.json(paymentMethod);
    } catch (error) {
      console.error("Add payment method error:", error);
      res.status(500).json({ message: error.message || "Failed to add payment method" });
    }
  });
  app2.delete("/api/payment-methods/:id", isAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Payment service not configured" });
      }
      const { id } = req.params;
      await stripe.paymentMethods.detach(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Remove payment method error:", error);
      res.status(500).json({ message: error.message || "Failed to remove payment method" });
    }
  });
  app2.patch("/api/payment-methods/:id/default", isAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Payment service not configured" });
      }
      const userId = req.user.id;
      const { id } = req.params;
      const user = await storage.getUser(userId);
      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({ message: "User not found or no Stripe customer ID" });
      }
      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: id
        }
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Set default payment method error:", error);
      res.status(500).json({ message: error.message || "Failed to set default payment method" });
    }
  });
  app2.post("/api/booking/pricing", async (req, res) => {
    try {
      const bookingData = req.body;
      if (!bookingData.service_type) {
        return res.status(400).json({ error: "Missing service_type" });
      }
      const vehicleTypes2 = await storage.getVehicleTypes();
      const pricingRules2 = await storage.getPricingRules();
      const activePricingRules = pricingRules2.filter((rule) => rule.isActive);
      if (bookingData.service_type === "hourly") {
        const requestedDuration = parseInt(bookingData.duration) || 2;
        const vehicles2 = vehicleTypes2.map((vehicle) => {
          const vehicleTypeEnum2 = vehicle.name.toLowerCase().replace(/[\s-]/g, "_");
          const pricingRule = activePricingRules.find(
            (rule) => rule.vehicleType === vehicleTypeEnum2 && rule.serviceType === "hourly"
          );
          if (!pricingRule || !pricingRule.hourlyRate || !pricingRule.minimumHours) {
            console.warn(`No pricing rule found for ${vehicleTypeEnum2} hourly service`);
            return null;
          }
          const actualDuration = Math.max(requestedDuration, pricingRule.minimumHours);
          const hourlyRate = parseFloat(pricingRule.hourlyRate);
          let totalPrice = actualDuration * hourlyRate;
          if (pricingRule.minimumFare) {
            totalPrice = Math.max(totalPrice, parseFloat(pricingRule.minimumFare));
          }
          return {
            type: vehicleTypeEnum2,
            name: vehicle.name,
            price: "$" + totalPrice.toFixed(2),
            hourly_rate: hourlyRate,
            passengers: vehicle.passengerCapacity,
            luggage: vehicle.luggageCapacity,
            category: "Hourly service",
            duration: actualDuration,
            minimum_hours: pricingRule.minimumHours
          };
        }).filter((v) => v !== null);
        if (vehicles2.length === 0) {
          return res.status(500).json({ error: "No pricing rules configured for hourly service" });
        }
        return res.json({
          success: true,
          data: {
            service_type: "hourly",
            pickup_address: bookingData.pickup_address || "Not specified",
            requested_duration: requestedDuration,
            datetime: bookingData.datetime || (/* @__PURE__ */ new Date()).toISOString(),
            vehicles: vehicles2,
            minimum_price: Math.min(...vehicles2.map((v) => parseFloat(v.price.replace("$", "")))),
            booking_id: "HOU_H" + Math.random().toString(36).substr(2, 9).toUpperCase()
          }
        });
      } else if (bookingData.service_type === "transfer") {
        if (!bookingData.from || !bookingData.to) {
          return res.status(400).json({ error: "Missing from and/or to addresses for transfer" });
        }
        let estimatedDistance = 15;
        let routeCalculationError = false;
        try {
          const fromCoords = await geocodeAddress(bookingData.from, storage);
          const toCoords = await geocodeAddress(bookingData.to, storage);
          if (fromCoords && toCoords) {
            const routeData = await calculateRoute(fromCoords, toCoords, storage);
            if (routeData && routeData.routes && routeData.routes.length > 0) {
              estimatedDistance = routeData.routes[0].summary.lengthInMeters * 621371e-9;
            }
          }
        } catch (error) {
          console.error("TomTom distance calculation error:", error);
          routeCalculationError = true;
        }
        const vehicles2 = vehicleTypes2.map((vehicle) => {
          const vehicleTypeEnum2 = vehicle.name.toLowerCase().replace(/[\s-]/g, "_");
          const pricingRule = activePricingRules.find(
            (rule) => rule.vehicleType === vehicleTypeEnum2 && rule.serviceType === "transfer"
          );
          if (!pricingRule || !pricingRule.baseRate || !pricingRule.perMileRate) {
            console.warn(`No pricing rule found for ${vehicleTypeEnum2} transfer service`);
            return null;
          }
          const baseRate = parseFloat(pricingRule.baseRate);
          const perMileRate = parseFloat(pricingRule.perMileRate);
          const distanceCharge = estimatedDistance * perMileRate;
          let totalPrice = baseRate + distanceCharge;
          if (pricingRule.minimumFare) {
            totalPrice = Math.max(totalPrice, parseFloat(pricingRule.minimumFare));
          }
          return {
            type: vehicleTypeEnum2,
            name: vehicle.name,
            price: "$" + totalPrice.toFixed(2),
            base_rate: baseRate,
            per_mile_rate: perMileRate,
            passengers: vehicle.passengerCapacity,
            luggage: vehicle.luggageCapacity,
            category: "Transfer",
            distance: estimatedDistance,
            minimum_fare: pricingRule.minimumFare ? parseFloat(pricingRule.minimumFare) : 0
          };
        }).filter((v) => v !== null);
        if (vehicles2.length === 0) {
          return res.status(500).json({ error: "No pricing rules configured for transfer service" });
        }
        return res.json({
          success: true,
          data: {
            service_type: "transfer",
            from_address: bookingData.from,
            to_address: bookingData.to,
            distance_miles: estimatedDistance,
            datetime: bookingData.datetime || (/* @__PURE__ */ new Date()).toISOString(),
            vehicles: vehicles2,
            minimum_price: Math.min(...vehicles2.map((v) => parseFloat(v.price.replace("$", "")))),
            booking_id: "HOU_T" + Math.random().toString(36).substr(2, 9).toUpperCase()
          }
        });
      }
      return res.status(400).json({ error: 'Invalid service_type. Must be "hourly" or "transfer"' });
    } catch (error) {
      console.error("Pricing calculation error:", error);
      res.status(500).json({ error: "Pricing calculation failed" });
    }
  });
  app2.post("/api/ratings", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { bookingId, rating, comment } = req.body;
      if (!bookingId || typeof bookingId !== "string") {
        return res.status(400).json({ error: "Valid bookingId is required" });
      }
      if (!rating || typeof rating !== "number" || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        return res.status(400).json({ error: "Rating must be an integer between 1 and 5" });
      }
      if (comment && typeof comment !== "string") {
        return res.status(400).json({ error: "Comment must be a string" });
      }
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      if (booking.passengerId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to rate this booking" });
      }
      if (booking.status !== "completed") {
        return res.status(400).json({ error: "Can only rate completed bookings" });
      }
      if (!booking.driverId) {
        return res.status(400).json({ error: "Booking has no assigned driver" });
      }
      const existingRating = await storage.getBookingRating(bookingId);
      if (existingRating) {
        return res.status(400).json({ error: "Booking already rated" });
      }
      const newRating = await storage.createDriverRating({
        bookingId,
        driverId: booking.driverId,
        // Derive from booking, not client
        passengerId: req.user.id,
        rating,
        comment: comment || void 0
      });
      res.json(newRating);
    } catch (error) {
      console.error("Create rating error:", error);
      res.status(500).json({ error: "Failed to create rating" });
    }
  });
  app2.get("/api/drivers/:driverId/ratings", async (req, res) => {
    try {
      const { driverId } = req.params;
      const ratings = await storage.getDriverRatings(driverId);
      res.json(ratings);
    } catch (error) {
      console.error("Get ratings error:", error);
      res.status(500).json({ error: "Failed to get ratings" });
    }
  });
  app2.get("/api/drivers/:driverId/average-rating", async (req, res) => {
    try {
      const { driverId } = req.params;
      const avgRating = await storage.getDriverAverageRating(driverId);
      res.json({ averageRating: avgRating });
    } catch (error) {
      console.error("Get average rating error:", error);
      res.status(500).json({ error: "Failed to get average rating" });
    }
  });
  app2.get("/api/bookings/:bookingId/rating", async (req, res) => {
    try {
      const { bookingId } = req.params;
      const rating = await storage.getBookingRating(bookingId);
      if (!rating) {
        return res.status(404).json({ error: "Rating not found" });
      }
      res.json(rating);
    } catch (error) {
      console.error("Get booking rating error:", error);
      res.status(500).json({ error: "Failed to get booking rating" });
    }
  });
  app2.post("/api/drivers/:id/location", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { latitude, longitude } = req.body;
      if (req.user.id !== id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized to update this driver location" });
      }
      if (typeof latitude !== "number" || typeof longitude !== "number") {
        return res.status(400).json({ error: "Invalid coordinates" });
      }
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ error: "Coordinates out of range" });
      }
      await storage.updateUserLocation(id, latitude, longitude);
      res.json({ success: true, message: "Location updated successfully" });
    } catch (error) {
      console.error("Update driver location error:", error);
      res.status(500).json({ error: "Failed to update location" });
    }
  });
  app2.get("/api/drivers/locations", isAuthenticated, async (req, res) => {
    try {
      if (!["admin", "dispatcher", "driver"].includes(req.user.role)) {
        return res.status(403).json({ error: "Not authorized to view driver locations" });
      }
      const locations = await storage.getDriverLocations();
      res.json(locations);
    } catch (error) {
      console.error("Get driver locations error:", error);
      res.status(500).json({ error: "Failed to get driver locations" });
    }
  });
  app2.get("/api/admin/smtp-settings", isAuthenticated, async (req, res) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const [host, port, secure, user, fromEmail, fromName] = await Promise.all([
        storage.getSystemSetting("SMTP_HOST"),
        storage.getSystemSetting("SMTP_PORT"),
        storage.getSystemSetting("SMTP_SECURE"),
        storage.getSystemSetting("SMTP_USER"),
        storage.getSystemSetting("SMTP_FROM_EMAIL"),
        storage.getSystemSetting("SMTP_FROM_NAME")
      ]);
      res.json({
        host: host?.value || "",
        port: port?.value || "587",
        secure: secure?.value === "true",
        user: user?.value || "",
        hasPassword: !!(await storage.getSystemSetting("SMTP_PASSWORD"))?.value,
        fromEmail: fromEmail?.value || "",
        fromName: fromName?.value || "USA Luxury Limo"
      });
    } catch (error) {
      console.error("Get SMTP settings error:", error);
      res.status(500).json({ error: "Failed to get SMTP settings" });
    }
  });
  app2.post("/api/admin/smtp-settings", isAuthenticated, async (req, res) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { host, port, secure, user, password, fromEmail, fromName } = req.body;
      const settingsToUpdate = [
        { key: "SMTP_HOST", value: host },
        { key: "SMTP_PORT", value: port?.toString() || "587" },
        { key: "SMTP_SECURE", value: secure ? "true" : "false" },
        { key: "SMTP_USER", value: user },
        { key: "SMTP_FROM_EMAIL", value: fromEmail },
        { key: "SMTP_FROM_NAME", value: fromName || "USA Luxury Limo" }
      ];
      if (password) {
        settingsToUpdate.push({ key: "SMTP_PASSWORD", value: password });
      }
      await Promise.all(
        settingsToUpdate.map((setting) => storage.updateSystemSetting(setting.key, setting.value, req.user.id))
      );
      clearEmailCache();
      res.json({ success: true, message: "SMTP settings updated successfully" });
    } catch (error) {
      console.error("Update SMTP settings error:", error);
      res.status(500).json({ error: "Failed to update SMTP settings" });
    }
  });
  app2.post("/api/admin/smtp-test", isAuthenticated, async (req, res) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { testEmail } = req.body;
      if (!testEmail) {
        return res.status(400).json({ error: "Test email address is required" });
      }
      const connectionTest = await testSMTPConnection();
      if (!connectionTest.success) {
        return res.status(400).json({
          success: false,
          message: connectionTest.message
        });
      }
      const emailSent = await sendEmail({
        to: testEmail,
        subject: "USA Luxury Limo - SMTP Test Email",
        html: getTestEmailHTML()
      });
      if (emailSent) {
        res.json({
          success: true,
          message: `Test email sent successfully to ${testEmail}. Please check your inbox.`
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to send test email. Please check your SMTP settings and try again."
        });
      }
    } catch (error) {
      console.error("SMTP test error:", error);
      res.status(500).json({
        success: false,
        message: "SMTP test failed. Please check your settings."
      });
    }
  });
  app2.post("/api/admin/minio/test", isAuthenticated, async (req, res) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { endpoint, accessKey, secretKey, bucket } = req.body;
      if (!endpoint || !accessKey || !secretKey) {
        return res.status(400).json({
          success: false,
          message: "MinIO endpoint, access key, and secret key are required"
        });
      }
      const bucketName = bucket || "usa-luxury-limo";
      try {
        const testClient = new S3Client2({
          endpoint,
          region: "us-east-1",
          credentials: {
            accessKeyId: accessKey,
            secretAccessKey: secretKey
          },
          forcePathStyle: true
          // Required for MinIO
        });
        try {
          await testClient.send(new ListBucketsCommand({}));
        } catch (listError) {
          console.error("MinIO list buckets error:", listError);
          return res.status(400).json({
            success: false,
            message: `Failed to connect to MinIO endpoint. Error: ${listError.message || "Invalid credentials or endpoint"}`,
            details: listError.message
          });
        }
        try {
          await testClient.send(new HeadBucketCommand2({ Bucket: bucketName }));
          return res.json({
            success: true,
            message: `Successfully connected to MinIO! Endpoint is reachable, credentials are valid, and bucket "${bucketName}" is accessible.`,
            bucketExists: true
          });
        } catch (bucketError) {
          if (bucketError.name === "NotFound" || bucketError.$metadata?.httpStatusCode === 404) {
            return res.json({
              success: true,
              message: `Connection successful! Credentials are valid, but bucket "${bucketName}" does not exist. It will be created automatically when needed.`,
              bucketExists: false,
              warning: `Bucket "${bucketName}" not found`
            });
          } else {
            return res.status(400).json({
              success: false,
              message: `Credentials are valid, but cannot access bucket "${bucketName}". Error: ${bucketError.message}`,
              details: bucketError.message
            });
          }
        }
      } catch (error) {
        console.error("MinIO connection test error:", error);
        return res.status(500).json({
          success: false,
          message: `MinIO connection test failed: ${error.message || "Unknown error"}`,
          details: error.message
        });
      }
    } catch (error) {
      console.error("MinIO test endpoint error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to test MinIO connection. Please try again.",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/minio/browse", isAuthenticated, async (req, res) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const prefix = req.query.prefix;
      const folder = req.query.folder;
      let searchPrefix = prefix || "";
      if (folder) {
        searchPrefix = folder;
      }
      try {
        const adapter = await getObjectStorage();
        const result2 = await adapter.listWithMetadata(searchPrefix);
        if (!result2.ok) {
          return res.status(500).json({
            success: false,
            message: "Failed to list objects from storage",
            error: result2.error
          });
        }
        const folders = /* @__PURE__ */ new Set();
        const files = result2.objects?.map((obj) => {
          if (!obj.key) {
            return null;
          }
          const parts = obj.key.split("/");
          if (parts.length > 1) {
            folders.add(parts[0]);
          }
          return {
            key: obj.key,
            name: parts[parts.length - 1],
            folder: parts.length > 1 ? parts.slice(0, -1).join("/") : "",
            size: obj.size,
            lastModified: obj.lastModified,
            url: obj.url,
            isImage: /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(obj.key)
          };
        }).filter(Boolean) || [];
        res.json({
          success: true,
          files,
          folders: Array.from(folders),
          totalFiles: files.length
        });
      } catch (error) {
        console.error("MinIO browse error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to browse MinIO storage",
          error: error.message
        });
      }
    } catch (error) {
      console.error("MinIO browse endpoint error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to browse MinIO storage",
        error: error.message
      });
    }
  });
  app2.post("/api/admin/minio/upload", isAuthenticated, requireAdmin, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const { folder = "cms/general" } = req.body;
      const sanitizedFolder = folder.replace(/\.\./g, "").replace(/^\/+/, "").replace(/\/+$/, "");
      const folderPath = sanitizedFolder ? `${sanitizedFolder}/` : "";
      const timestamp2 = Date.now();
      const fileExtension = req.file.originalname.split(".").pop();
      const fileName = `upload-${timestamp2}.${fileExtension}`;
      const filePath = `${folderPath}${fileName}`;
      const extension = fileExtension?.toLowerCase();
      const contentTypeMap = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp",
        "heic": "image/heic"
      };
      const contentType = contentTypeMap[extension || ""] || "application/octet-stream";
      const objStorage = await getObjectStorage();
      const { ok, error } = await objStorage.uploadFromBytes(filePath, req.file.buffer, { contentType });
      if (!ok) {
        console.error("Upload to Object Storage failed:", error);
        return res.status(500).json({ message: `Upload failed: ${error}` });
      }
      const { ok: urlOk, url, error: urlError } = await objStorage.getDownloadUrl(filePath);
      if (!urlOk) {
        console.error("Failed to get download URL:", urlError);
      }
      const parts = filePath.split("/");
      const folderName = parts.length > 1 ? parts.slice(0, -1).join("/") : "";
      res.json({
        success: true,
        file: {
          key: filePath,
          name: fileName,
          folder: folderName,
          size: req.file.size,
          lastModified: /* @__PURE__ */ new Date(),
          url: url || filePath,
          isImage: /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(filePath)
        }
      });
    } catch (error) {
      console.error("MinIO upload error:", error);
      res.status(500).json({ message: "Failed to upload file", error: error.message });
    }
  });
  app2.delete("/api/admin/minio/file", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { key } = req.body;
      if (!key) {
        return res.status(400).json({ message: "File key is required" });
      }
      const sanitizedKey = key.replace(/\.\./g, "").replace(/^\/+/, "");
      if (!sanitizedKey) {
        return res.status(400).json({ message: "Invalid file key" });
      }
      const objStorage = await getObjectStorage();
      const { ok, error } = await objStorage.delete(sanitizedKey);
      if (!ok) {
        console.error("Delete from Object Storage failed:", error);
        return res.status(500).json({ message: `Delete failed: ${error}` });
      }
      res.json({
        success: true,
        message: "File deleted successfully"
      });
    } catch (error) {
      console.error("MinIO delete error:", error);
      res.status(500).json({ message: "Failed to delete file", error: error.message });
    }
  });
  app2.get("/api/admin/sms/status", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const status = await getTwilioConnectionStatus();
      const enabledSetting = await storage.getSetting("TWILIO_ENABLED");
      const enabled = enabledSetting?.value === "true";
      const authTokenSetting = await storage.getSetting("TWILIO_AUTH_TOKEN");
      const hasAuthToken = !!authTokenSetting?.value;
      res.json({ ...status, enabled, hasAuthToken });
    } catch (error) {
      console.error("SMS status check error:", error);
      res.status(500).json({
        connected: false,
        enabled: false,
        hasAuthToken: false,
        error: "Failed to check SMS connection status"
      });
    }
  });
  app2.post("/api/admin/sms/credentials", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { accountSid, authToken, phoneNumber, enabled } = req.body;
      if (!accountSid || !phoneNumber) {
        return res.status(400).json({ message: "Account SID and Phone Number are required" });
      }
      await storage.setSetting("TWILIO_ACCOUNT_SID", accountSid, userId);
      await storage.setSetting("TWILIO_PHONE_NUMBER", phoneNumber, userId);
      if (authToken) {
        await storage.setSetting("TWILIO_AUTH_TOKEN", authToken, userId);
      }
      await storage.setSetting("TWILIO_ENABLED", enabled ? "true" : "false", userId);
      res.json({ success: true, message: "Twilio credentials saved successfully" });
    } catch (error) {
      console.error("Save credentials error:", error);
      res.status(500).json({ message: "Failed to save Twilio credentials" });
    }
  });
  app2.post("/api/admin/sms/toggle", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { enabled } = req.body;
      await storage.setSetting("TWILIO_ENABLED", enabled ? "true" : "false", userId);
      res.json({ success: true, enabled });
    } catch (error) {
      console.error("Toggle SMS error:", error);
      res.status(500).json({ message: "Failed to toggle SMS status" });
    }
  });
  app2.post("/api/admin/sms/test", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }
      const result2 = await sendTestSMS(phoneNumber);
      if (result2.success) {
        res.json({
          success: true,
          message: `Test SMS sent successfully to ${phoneNumber}`,
          messageId: result2.messageId
        });
      } else {
        res.status(500).json({
          success: false,
          message: result2.error || "Failed to send test SMS"
        });
      }
    } catch (error) {
      console.error("SMS test error:", error);
      res.status(500).json({
        success: false,
        message: "SMS test failed. Please check your Twilio configuration."
      });
    }
  });
  app2.get("/api/admin/cms/settings", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getCmsSettings();
      res.json(settings);
    } catch (error) {
      console.error("Get CMS settings error:", error);
      res.status(500).json({ message: "Failed to fetch CMS settings" });
    }
  });
  app2.get("/api/admin/cms/settings/category/:category", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { category } = req.params;
      const settings = await storage.getCmsSettingsByCategory(category);
      res.json(settings);
    } catch (error) {
      console.error("Get CMS settings by category error:", error);
      res.status(500).json({ message: "Failed to fetch CMS settings" });
    }
  });
  app2.put("/api/admin/cms/settings", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const userId = req.adminUser.id;
      const validationResult = insertCmsSettingSchema.safeParse({
        ...req.body,
        updatedBy: userId
      });
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid setting data",
          errors: validationResult.error.errors
        });
      }
      const setting = await storage.upsertCmsSetting(validationResult.data);
      res.json(setting);
    } catch (error) {
      console.error("Upsert CMS setting error:", error);
      res.status(500).json({ message: "Failed to save CMS setting" });
    }
  });
  app2.delete("/api/admin/cms/settings/:key", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      await storage.deleteCmsSetting(key);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete CMS setting error:", error);
      res.status(500).json({ message: "Failed to delete CMS setting" });
    }
  });
  app2.get("/api/admin/cms/content", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const content = await storage.getCmsContent(false);
      res.json(content);
    } catch (error) {
      console.error("Get CMS content error:", error);
      res.status(500).json({ message: "Failed to fetch CMS content" });
    }
  });
  app2.get("/api/admin/cms/content/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const content = await storage.getCmsContentById(id);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      console.error("Get CMS content by ID error:", error);
      res.status(500).json({ message: "Failed to fetch CMS content" });
    }
  });
  app2.get("/api/admin/cms/content/type/:blockType", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { blockType } = req.params;
      const content = await storage.getCmsContentByType(blockType, false);
      res.json(content);
    } catch (error) {
      console.error("Get CMS content by type error:", error);
      res.status(500).json({ message: "Failed to fetch CMS content" });
    }
  });
  app2.post("/api/admin/cms/content", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const userId = req.adminUser.id;
      const validationResult = insertCmsContentSchema.safeParse({
        ...req.body,
        updatedBy: userId
      });
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid content data",
          errors: validationResult.error.errors
        });
      }
      const content = await storage.createCmsContent(validationResult.data);
      res.json(content);
    } catch (error) {
      console.error("Create CMS content error:", error);
      res.status(500).json({ message: "Failed to create CMS content" });
    }
  });
  app2.put("/api/admin/cms/content/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const userId = req.adminUser.id;
      const { id } = req.params;
      const validationResult = insertCmsContentSchema.partial().safeParse({
        ...req.body,
        updatedBy: userId
      });
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid content data",
          errors: validationResult.error.errors
        });
      }
      const content = await storage.updateCmsContent(id, validationResult.data);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      console.error("Update CMS content error:", error);
      res.status(500).json({ message: "Failed to update CMS content" });
    }
  });
  app2.delete("/api/admin/cms/content/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCmsContent(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete CMS content error:", error);
      res.status(500).json({ message: "Failed to delete CMS content" });
    }
  });
  app2.get("/api/site-logo", async (req, res) => {
    try {
      const logoSetting = await storage.getCmsSetting("site_logo");
      if (!logoSetting || !logoSetting.value) {
        return res.json({ logo: null });
      }
      const media = await storage.getCmsMediaById(logoSetting.value);
      if (!media) {
        return res.json({ logo: null });
      }
      res.json({
        logo: {
          id: media.id,
          url: media.fileUrl,
          altText: media.altText,
          fileName: media.fileName
        }
      });
    } catch (error) {
      console.error("Get site logo error:", error);
      res.status(500).json({ message: "Failed to fetch site logo" });
    }
  });
  app2.post("/api/admin/site-logo", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { mediaId } = req.body;
      const userId = req.adminUser.id;
      if (!mediaId) {
        return res.status(400).json({ message: "Media ID is required" });
      }
      const media = await storage.getCmsMediaById(mediaId);
      if (!media) {
        return res.status(404).json({ message: "Media not found" });
      }
      await storage.upsertCmsSetting({
        key: "site_logo",
        value: mediaId,
        category: "branding",
        description: "Site-wide logo",
        updatedBy: userId
      });
      res.json({ success: true, media });
    } catch (error) {
      console.error("Set site logo error:", error);
      res.status(500).json({ message: "Failed to set site logo" });
    }
  });
  app2.get("/api/site-hero", async (req, res) => {
    try {
      const heroSetting = await storage.getCmsSetting("site_hero");
      if (!heroSetting || !heroSetting.value) {
        return res.json({ hero: null });
      }
      const media = await storage.getCmsMediaById(heroSetting.value);
      if (!media) {
        return res.json({ hero: null });
      }
      res.json({
        hero: {
          id: media.id,
          url: media.fileUrl,
          altText: media.altText,
          fileName: media.fileName
        }
      });
    } catch (error) {
      console.error("Get site hero error:", error);
      res.status(500).json({ message: "Failed to fetch site hero image" });
    }
  });
  app2.post("/api/admin/site-hero", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { mediaId } = req.body;
      const userId = req.adminUser.id;
      if (!mediaId) {
        return res.status(400).json({ message: "Media ID is required" });
      }
      const media = await storage.getCmsMediaById(mediaId);
      if (!media) {
        return res.status(404).json({ message: "Media not found" });
      }
      await storage.upsertCmsSetting({
        key: "site_hero",
        value: mediaId,
        category: "branding",
        description: "Site-wide hero background image",
        updatedBy: userId
      });
      res.json({ success: true, media });
    } catch (error) {
      console.error("Set site hero error:", error);
      res.status(500).json({ message: "Failed to set site hero image" });
    }
  });
  app2.get("/api/site-favicon", async (req, res) => {
    try {
      const faviconSetting = await storage.getCmsSetting("site_favicon");
      if (!faviconSetting || !faviconSetting.value) {
        return res.json({ favicon: null });
      }
      const media = await storage.getCmsMediaById(faviconSetting.value);
      if (!media) {
        return res.json({ favicon: null });
      }
      res.json({
        favicon: {
          id: media.id,
          url: media.fileUrl,
          altText: media.altText,
          fileName: media.fileName
        }
      });
    } catch (error) {
      console.error("Get site favicon error:", error);
      res.status(500).json({ message: "Failed to fetch site favicon" });
    }
  });
  app2.post("/api/admin/site-favicon", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { mediaId } = req.body;
      const userId = req.adminUser.id;
      if (!mediaId) {
        return res.status(400).json({ message: "Media ID is required" });
      }
      const media = await storage.getCmsMediaById(mediaId);
      if (!media) {
        return res.status(404).json({ message: "Media not found" });
      }
      await storage.upsertCmsSetting({
        key: "site_favicon",
        value: mediaId,
        category: "branding",
        description: "Site-wide favicon",
        updatedBy: userId
      });
      res.json({ success: true, media });
    } catch (error) {
      console.error("Set site favicon error:", error);
      res.status(500).json({ message: "Failed to set site favicon" });
    }
  });
  app2.get("/api/site-company-name", async (req, res) => {
    try {
      const companyNameSetting = await storage.getCmsSetting("BRAND_COMPANY_NAME");
      res.json({
        companyName: companyNameSetting?.value || "USA Luxury Limo"
      });
    } catch (error) {
      console.error("Get company name error:", error);
      res.status(500).json({ message: "Failed to fetch company name" });
    }
  });
  app2.get("/api/branding", async (req, res) => {
    try {
      const [
        companyName,
        tagline,
        description,
        logoUrl,
        faviconUrl,
        primaryColor,
        secondaryColor,
        accentColor
      ] = await Promise.all([
        storage.getCmsSetting("BRAND_COMPANY_NAME"),
        storage.getCmsSetting("BRAND_TAGLINE"),
        storage.getCmsSetting("BRAND_DESCRIPTION"),
        storage.getCmsSetting("BRAND_LOGO_URL"),
        storage.getCmsSetting("BRAND_FAVICON_URL"),
        storage.getCmsSetting("BRAND_PRIMARY_COLOR"),
        storage.getCmsSetting("BRAND_SECONDARY_COLOR"),
        storage.getCmsSetting("BRAND_ACCENT_COLOR")
      ]);
      res.json({
        companyName: companyName?.value || "USA Luxury Limo",
        tagline: tagline?.value || "Premium Transportation Excellence",
        description: description?.value || "Premium luxury transportation services across the United States. Experience comfort, reliability, and professionalism with every ride.",
        logoUrl: logoUrl?.value || "/images/logo_1759125364025.png",
        faviconUrl: faviconUrl?.value || "/images/favicon_1759253989963.png",
        colors: {
          primary: primaryColor?.value || "#1a1a1a",
          secondary: secondaryColor?.value || "#666666",
          accent: accentColor?.value || "#d4af37"
        }
      });
    } catch (error) {
      console.error("Get branding error:", error);
      res.status(500).json({ message: "Failed to fetch branding settings" });
    }
  });
  app2.get("/manifest.json", async (req, res) => {
    try {
      const faviconSetting = await storage.getCmsSetting("site_favicon");
      let faviconUrl = null;
      let faviconMimeType = null;
      let etag = '"static"';
      if (faviconSetting?.value) {
        const media = await storage.getCmsMediaById(faviconSetting.value);
        if (media) {
          faviconUrl = media.fileUrl;
          faviconMimeType = media.fileType;
          etag = `"${media.id}"`;
        }
      }
      const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
      const icons = iconSizes.map((size) => ({
        src: faviconUrl || `/icon-${size}x${size}.png`,
        sizes: `${size}x${size}`,
        type: faviconUrl && faviconMimeType ? faviconMimeType : "image/png",
        // Use actual MIME type from CMS or PNG for static fallback
        purpose: "any maskable"
      }));
      const manifest = {
        name: "USA Luxury Limo",
        short_name: "USA Limo",
        description: "Professional luxury transportation booking platform for passengers, drivers, and dispatchers",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        orientation: "portrait-primary",
        icons,
        categories: ["travel", "transportation", "business"]
      };
      res.setHeader("Content-Type", "application/manifest+json");
      res.setHeader("Cache-Control", "public, max-age=300, must-revalidate");
      res.setHeader("ETag", etag);
      const clientETag = req.headers["if-none-match"];
      if (clientETag === etag) {
        return res.status(304).end();
      }
      res.json(manifest);
    } catch (error) {
      console.error("Generate manifest error:", error);
      res.status(500).json({ error: "Failed to generate manifest" });
    }
  });
  app2.get("/api/admin/cms/media", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const media = await storage.getCmsMedia();
      const mediaWithUrls = await Promise.all(
        media.map(async (item) => ({
          ...item,
          fileUrl: await getPresignedUrl(item.fileUrl)
        }))
      );
      res.json(mediaWithUrls);
    } catch (error) {
      console.error("Get CMS media error:", error);
      res.status(500).json({ message: "Failed to fetch CMS media" });
    }
  });
  app2.get("/api/admin/cms/media/folder/:folder", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { folder } = req.params;
      const media = await storage.getCmsMediaByFolder(folder);
      const mediaWithUrls = await Promise.all(
        media.map(async (item) => ({
          ...item,
          fileUrl: await getPresignedUrl(item.fileUrl)
        }))
      );
      res.json(mediaWithUrls);
    } catch (error) {
      console.error("Get CMS media by folder error:", error);
      res.status(500).json({ message: "Failed to fetch CMS media" });
    }
  });
  app2.post("/api/admin/cms/media/upload", isAuthenticated, requireAdmin, upload.single("file"), async (req, res) => {
    try {
      const userId = req.adminUser.id;
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const { folder = "general", altText, description } = req.body;
      const timestamp2 = Date.now();
      const fileExtension = req.file.originalname.split(".").pop();
      const fileName = `cms-${folder}-${timestamp2}.${fileExtension}`;
      const filePath = `/cms/${folder}/${fileName}`;
      const objStorage = await getObjectStorage();
      const { ok, error } = await objStorage.uploadFromBytes(filePath, req.file.buffer);
      if (!ok) {
        console.error("Upload to Object Storage failed:", error);
        return res.status(500).json({ message: `Upload failed: ${error}` });
      }
      const fileUrl = filePath;
      const validationResult = insertCmsMediaSchema.safeParse({
        fileName: req.file.originalname,
        fileUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        folder,
        altText: altText || "",
        description: description || "",
        uploadedBy: userId
      });
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid media data",
          errors: validationResult.error.errors
        });
      }
      const media = await storage.createCmsMedia(validationResult.data);
      res.json(media);
    } catch (error) {
      console.error("Upload CMS media error:", error);
      res.status(500).json({ message: "Failed to upload media" });
    }
  });
  app2.put("/api/admin/cms/media/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validationResult = insertCmsMediaSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid media data",
          errors: validationResult.error.errors
        });
      }
      const media = await storage.updateCmsMedia(id, validationResult.data);
      if (!media) {
        return res.status(404).json({ message: "Media not found" });
      }
      res.json(media);
    } catch (error) {
      console.error("Update CMS media error:", error);
      res.status(500).json({ message: "Failed to update media" });
    }
  });
  app2.delete("/api/admin/cms/media/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const media = await storage.getCmsMediaById(id);
      if (!media) {
        return res.status(404).json({ message: "Media not found" });
      }
      const logoSetting = await storage.getCmsSetting("site_logo");
      if (logoSetting && logoSetting.value === id) {
        await storage.deleteCmsSetting("site_logo");
      }
      const heroSetting = await storage.getCmsSetting("site_hero");
      if (heroSetting && heroSetting.value === id) {
        await storage.deleteCmsSetting("site_hero");
      }
      const faviconSetting = await storage.getCmsSetting("site_favicon");
      if (faviconSetting && faviconSetting.value === id) {
        await storage.deleteCmsSetting("site_favicon");
      }
      try {
        const objStorage = await getObjectStorage();
        const storageKey = extractStorageKey(media.fileUrl);
        await objStorage.delete(storageKey);
      } catch (storageError) {
        console.error("Object storage deletion error:", storageError);
      }
      await storage.deleteCmsMedia(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete CMS media error:", error);
      res.status(500).json({ message: "Failed to delete media" });
    }
  });
  app2.get("/cms/:folder/:filename", async (req, res) => {
    try {
      const { folder, filename } = req.params;
      const filePath = `/cms/${folder}/${filename}`;
      const objStorage = await getObjectStorage();
      const { ok, value, error } = await objStorage.downloadAsBytes(filePath);
      if (!ok) {
        return res.status(404).json({ message: `File not found: ${error}` });
      }
      const extension = filename.split(".").pop()?.toLowerCase();
      const contentTypeMap = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp",
        "svg": "image/svg+xml",
        "pdf": "application/pdf",
        "ico": "image/x-icon"
      };
      const contentType = contentTypeMap[extension || ""] || "application/octet-stream";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=31536000");
      let buffer;
      if (Buffer.isBuffer(value)) {
        buffer = value;
      } else if (Array.isArray(value) && value.length > 0) {
        buffer = Buffer.from(Object.values(value[0]));
      } else if (typeof value === "object" && value !== null) {
        buffer = Buffer.from(Object.values(value));
      } else {
        throw new Error("Unexpected value format from object storage");
      }
      res.send(buffer);
    } catch (error) {
      console.error("Error serving CMS media:", error);
      res.status(500).json({ message: "Failed to serve media" });
    }
  });
  app2.post("/api/driver-messages", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = await storage.getUser(userId);
      if (!user || user.role !== "dispatcher" && user.role !== "admin") {
        return res.status(403).json({ message: "Dispatcher or Admin access required" });
      }
      const { driverId, messageType, subject, message, priority, deliveryMethod } = req.body;
      if (!message || !deliveryMethod) {
        return res.status(400).json({ message: "Message and delivery method are required" });
      }
      if (messageType === "individual" && driverId) {
        const driver = await storage.getUser(driverId);
        if (!driver) {
          return res.status(400).json({ message: "Driver not found" });
        }
        if (driver.role !== "driver") {
          return res.status(400).json({ message: `Invalid role: ${driver.role}. Must be a driver.` });
        }
      }
      const driverMessage = await storage.createDriverMessage({
        senderId: userId,
        driverId: messageType === "broadcast" ? null : driverId || null,
        messageType: messageType || "individual",
        subject,
        message,
        priority: priority || "normal",
        deliveryMethod
      });
      let smsSent = false;
      let emailSent = false;
      let errors = [];
      const targetDrivers = driverId ? [await storage.getUser(driverId)] : await storage.getAllUsers().then(
        (users2) => users2.filter((u) => u.role === "driver" && u.isActive)
      );
      for (const driver of targetDrivers) {
        if (!driver) continue;
        try {
          if (deliveryMethod === "sms" || deliveryMethod === "both") {
            if (driver.phone) {
              const smsResult = await sendSMS(driver.phone, message);
              if (smsResult.success) {
                smsSent = true;
              } else {
                errors.push(`SMS failed for ${driver.firstName}: ${smsResult.error}`);
              }
            }
          }
          if (deliveryMethod === "email" || deliveryMethod === "both") {
            if (driver.email) {
              const emailHTML = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #1a202c;">${subject || "Message from Dispatch"}</h2>
                  <p style="color: #4a5568; line-height: 1.6;">${message}</p>
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                  <p style="color: #718096; font-size: 14px;">This message was sent via the USA Luxury Limo dispatch system.</p>
                </div>
              `;
              const emailResult = await sendEmail({
                to: driver.email,
                subject: subject || "Message from Dispatch",
                html: emailHTML
              });
              if (emailResult) {
                emailSent = true;
              } else {
                errors.push(`Email failed for ${driver.firstName}`);
              }
            }
          }
        } catch (error) {
          console.error(`Error sending message to driver ${driver.id}:`, error);
          errors.push(`Failed to send to ${driver.firstName}`);
        }
      }
      const status = errors.length === 0 ? "sent" : errors.length < targetDrivers.length ? "sent" : "failed";
      await storage.updateDriverMessageStatus(
        driverMessage.id,
        status,
        /* @__PURE__ */ new Date(),
        smsSent || emailSent ? /* @__PURE__ */ new Date() : void 0,
        errors.length > 0 ? errors.join("; ") : void 0
      );
      res.json({
        success: true,
        message: driverMessage,
        smsSent,
        emailSent,
        errors: errors.length > 0 ? errors : void 0
      });
    } catch (error) {
      console.error("Error sending driver message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  app2.get("/api/driver-messages", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = await storage.getUser(userId);
      if (!user || user.role !== "dispatcher" && user.role !== "admin") {
        return res.status(403).json({ message: "Dispatcher or Admin access required" });
      }
      const { driverId } = req.query;
      const messages = await storage.getDriverMessages(driverId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching driver messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app2.post("/api/emergency-incidents", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = await storage.getUser(userId);
      if (!user || user.role !== "dispatcher" && user.role !== "admin") {
        return res.status(403).json({ message: "Dispatcher or Admin access required" });
      }
      const incident = await storage.createEmergencyIncident({
        ...req.body,
        reporterId: userId
      });
      res.json({ success: true, incident });
    } catch (error) {
      console.error("Error creating emergency incident:", error);
      res.status(500).json({ message: "Failed to create incident" });
    }
  });
  app2.get("/api/emergency-incidents", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = await storage.getUser(userId);
      if (!user || user.role !== "dispatcher" && user.role !== "admin") {
        return res.status(403).json({ message: "Dispatcher or Admin access required" });
      }
      const { status } = req.query;
      const incidents = await storage.getEmergencyIncidents(status);
      const enrichedIncidents = await Promise.all(
        incidents.map(async (incident) => {
          const reporter = await storage.getUser(incident.reporterId);
          const driver = incident.driverId ? await storage.getUser(incident.driverId) : null;
          const assignee = incident.assignedTo ? await storage.getUser(incident.assignedTo) : null;
          return {
            ...incident,
            reporterName: reporter ? `${reporter.firstName} ${reporter.lastName}` : "Unknown",
            driverName: driver ? `${driver.firstName} ${driver.lastName}` : null,
            assigneeName: assignee ? `${assignee.firstName} ${assignee.lastName}` : null
          };
        })
      );
      res.json(enrichedIncidents);
    } catch (error) {
      console.error("Error fetching emergency incidents:", error);
      res.status(500).json({ message: "Failed to fetch incidents" });
    }
  });
  app2.patch("/api/emergency-incidents/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = await storage.getUser(userId);
      if (!user || user.role !== "dispatcher" && user.role !== "admin") {
        return res.status(403).json({ message: "Dispatcher or Admin access required" });
      }
      const { id } = req.params;
      const incident = await storage.updateEmergencyIncident(id, req.body);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }
      res.json({ success: true, incident });
    } catch (error) {
      console.error("Error updating emergency incident:", error);
      res.status(500).json({ message: "Failed to update incident" });
    }
  });
  app2.post("/api/stripe-webhook", async (req, res) => {
    try {
      const event = req.body;
      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.bookingId;
        if (bookingId) {
          await storage.updateBookingPayment(bookingId, paymentIntent.id, "paid");
          await storage.updateBookingStatus(bookingId, "confirmed");
        }
      }
      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// node_modules/nanoid/index.js
import crypto3 from "crypto";

// node_modules/nanoid/url-alphabet/index.js
var urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

// node_modules/nanoid/index.js
var POOL_SIZE_MULTIPLIER = 128;
var pool2;
var poolOffset;
var fillPool = (bytes) => {
  if (!pool2 || pool2.length < bytes) {
    pool2 = Buffer.allocUnsafe(bytes * POOL_SIZE_MULTIPLIER);
    crypto3.randomFillSync(pool2);
    poolOffset = 0;
  } else if (poolOffset + bytes > pool2.length) {
    crypto3.randomFillSync(pool2);
    poolOffset = 0;
  }
  poolOffset += bytes;
};
var nanoid = (size = 21) => {
  fillPool(size |= 0);
  let id = "";
  for (let i = poolOffset - size; i < poolOffset; i++) {
    id += urlAlphabet[pool2[i] & 63];
  }
  return id;
};

// server/vite.ts
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import session2 from "express-session";
import connectPgSimple from "connect-pg-simple";
import path3 from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path3.dirname(__filename);
var app = express2();
app.set("trust proxy", 1);
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.stripe.com https://*.tiles.mapbox.com https://api.tomtom.com; frame-src https://js.stripe.com;"
  );
  next();
});
app.use(express2.json({ limit: "10mb" }));
app.use(express2.urlencoded({ extended: false, limit: "10mb" }));
var PgSession2 = connectPgSimple(session2);
var sessionConfig = {
  store: new PgSession2({
    conObject: {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("sslmode=require") ? { rejectUnauthorized: false } : false
    },
    tableName: "session",
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || "usa-luxury-limo-secret-key-change-this",
  resave: false,
  saveUninitialized: false,
  name: "sessionId",
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1e3,
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax"
  },
  rolling: true
};
app.use(session2(sessionConfig));
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    env: process.env.NODE_ENV
  });
});
app.get("/favicon.ico", (req, res) => {
  res.status(404).send("");
});
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  try {
    await registerRoutes(app);
    app.use((err, req, res, next) => {
      console.error("Global error handler:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      if (process.env.NODE_ENV === "production" && status === 500) {
        res.status(500).json({
          message: "An unexpected error occurred",
          error: "INTERNAL_SERVER_ERROR"
        });
      } else {
        res.status(status).json({
          message,
          error: err.code || "ERROR",
          ...process.env.NODE_ENV !== "production" && { stack: err.stack }
        });
      }
    });
    const PORT = Number(process.env.PORT) || 5e3;
    const HOST = "0.0.0.0";
    const server = createServer2(app);
    app.use("/api/*", (req, res) => {
      res.status(404).json({ message: "Not found" });
    });
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    server.listen(PORT, HOST, () => {
      log(`Server running on http://${HOST}:${PORT}`);
      log(`Environment: ${process.env.NODE_ENV || "development"}`);
      log(`Database: ${process.env.DATABASE_URL ? "Connected" : "Not configured"}`);
    });
    process.on("SIGTERM", () => {
      log("SIGTERM signal received: closing HTTP server");
      server.close(() => {
        log("HTTP server closed");
        process.exit(0);
      });
    });
    process.on("SIGINT", () => {
      log("SIGINT signal received: closing HTTP server");
      server.close(() => {
        log("HTTP server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
