CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"passenger_id" varchar NOT NULL,
	"driver_id" uuid,
	"vehicle_type_id" uuid NOT NULL,
	"vehicle_id" uuid,
	"booking_type" varchar NOT NULL,
	"status" varchar DEFAULT 'pending',
	"pickup_address" text NOT NULL,
	"pickup_lat" numeric(10, 8),
	"pickup_lon" numeric(11, 8),
	"destination_address" text,
	"destination_lat" numeric(10, 8),
	"destination_lon" numeric(11, 8),
	"via_points" jsonb,
	"scheduled_date_time" timestamp NOT NULL,
	"estimated_duration" integer,
	"estimated_distance" numeric(8, 2),
	"requested_hours" integer,
	"base_fare" numeric(10, 2),
	"distance_fare" numeric(10, 2),
	"time_fare" numeric(10, 2),
	"gratuity_amount" numeric(10, 2),
	"airport_fee_amount" numeric(10, 2),
	"surge_pricing_multiplier" numeric(5, 2),
	"surge_pricing_amount" numeric(10, 2),
	"surcharges" jsonb DEFAULT '[]'::jsonb,
	"regular_price" numeric(10, 2),
	"discount_percentage" numeric(5, 2),
	"discount_amount" numeric(10, 2),
	"total_amount" numeric(10, 2),
	"driver_payment" numeric(10, 2),
	"payment_status" varchar DEFAULT 'pending',
	"payment_intent_id" varchar,
	"special_instructions" text,
	"passenger_count" integer DEFAULT 1,
	"luggage_count" integer DEFAULT 0,
	"baby_seat" boolean DEFAULT false,
	"booking_for" varchar DEFAULT 'self',
	"passenger_name" varchar,
	"passenger_phone" varchar,
	"passenger_email" varchar,
	"flight_number" varchar,
	"flight_name" varchar,
	"flight_airline" varchar,
	"flight_departure_airport" varchar,
	"flight_arrival_airport" varchar,
	"flight_departure" varchar,
	"flight_arrival" varchar,
	"no_flight_info" boolean DEFAULT false,
	"booked_by" varchar,
	"booked_at" timestamp,
	"confirmed_at" timestamp,
	"assigned_at" timestamp,
	"accepted_at" timestamp,
	"reminder_sent_at" timestamp,
	"on_the_way_at" timestamp,
	"arrived_at" timestamp,
	"on_board_at" timestamp,
	"auto_cancelled_at" timestamp,
	"accepted_location" jsonb,
	"started_at" timestamp,
	"started_location" jsonb,
	"dod_at" timestamp,
	"dod_location" jsonb,
	"pob_at" timestamp,
	"pob_location" jsonb,
	"ended_at" timestamp,
	"ended_location" jsonb,
	"payment_at" timestamp,
	"cancelled_at" timestamp,
	"cancel_reason" text,
	"no_show" boolean DEFAULT false,
	"refund_invoice_sent" boolean DEFAULT false,
	"marked_completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cms_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"block_type" varchar NOT NULL,
	"identifier" varchar NOT NULL,
	"title" varchar,
	"content" text,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cms_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" varchar NOT NULL,
	"file_url" text NOT NULL,
	"file_type" varchar NOT NULL,
	"file_size" integer,
	"folder" varchar DEFAULT 'general',
	"alt_text" text,
	"description" text,
	"width" integer,
	"height" integer,
	"uploaded_by" varchar NOT NULL,
	"uploaded_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cms_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar NOT NULL,
	"value" text,
	"category" varchar NOT NULL,
	"description" text,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "cms_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "contact_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"phone" varchar,
	"service_type" varchar,
	"message" text NOT NULL,
	"status" varchar DEFAULT 'new',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "driver_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"document_type" varchar NOT NULL,
	"document_url" text NOT NULL,
	"expiration_date" timestamp,
	"vehicle_plate" varchar,
	"status" varchar DEFAULT 'pending',
	"rejection_reason" text,
	"whatsapp_number" varchar,
	"uploaded_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp,
	"reviewed_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "driver_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" varchar NOT NULL,
	"driver_id" varchar,
	"message_type" varchar DEFAULT 'individual' NOT NULL,
	"subject" varchar,
	"message" text NOT NULL,
	"priority" varchar DEFAULT 'normal',
	"delivery_method" varchar DEFAULT 'both' NOT NULL,
	"status" varchar DEFAULT 'pending',
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "driver_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"passenger_id" varchar NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"license_number" varchar,
	"license_expiry" timestamp,
	"license_document_url" varchar,
	"insurance_document_url" varchar,
	"vehicle_plate" varchar,
	"driver_credentials" varchar,
	"background_check_status" varchar DEFAULT 'pending',
	"verification_status" varchar DEFAULT 'pending',
	"rating" numeric(3, 2) DEFAULT '0.00',
	"total_rides" integer DEFAULT 0,
	"is_available" boolean DEFAULT false,
	"current_location" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "emergency_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" varchar NOT NULL,
	"incident_type" varchar NOT NULL,
	"severity" varchar DEFAULT 'medium' NOT NULL,
	"booking_id" uuid,
	"driver_id" varchar,
	"location" varchar,
	"location_coordinates" varchar,
	"description" text NOT NULL,
	"status" varchar DEFAULT 'open' NOT NULL,
	"assigned_to" varchar,
	"resolution_notes" text,
	"emergency_services_contacted" boolean DEFAULT false,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "frontend_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar NOT NULL,
	"title" varchar NOT NULL,
	"content" jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "frontend_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"invoice_number" varchar NOT NULL,
	"base_fare" numeric(10, 2),
	"gratuity_amount" numeric(10, 2),
	"airport_fee_amount" numeric(10, 2),
	"surge_pricing_multiplier" numeric(5, 2),
	"surge_pricing_amount" numeric(10, 2),
	"subtotal" numeric(10, 2) NOT NULL,
	"discount_percentage" numeric(5, 2),
	"discount_amount" numeric(10, 2),
	"tax_amount" numeric(10, 2) DEFAULT '0.00',
	"total_amount" numeric(10, 2) NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "payment_systems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" varchar NOT NULL,
	"is_active" boolean DEFAULT false,
	"public_key" text,
	"secret_key" text,
	"webhook_secret" text,
	"config" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "payment_systems_provider_unique" UNIQUE("provider")
);
--> statement-breakpoint
CREATE TABLE "payment_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"token" varchar(64) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "payment_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "pricing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_type" varchar NOT NULL,
	"service_type" varchar NOT NULL,
	"base_rate" numeric(10, 2),
	"per_mile_rate" numeric(10, 2),
	"hourly_rate" numeric(10, 2),
	"minimum_hours" integer,
	"minimum_fare" numeric(10, 2),
	"gratuity_percent" numeric(5, 2) DEFAULT '20.00',
	"airport_fees" jsonb DEFAULT '[]'::jsonb,
	"meet_and_greet" jsonb DEFAULT '{"enabled": false, "charge": 0}'::jsonb,
	"surge_pricing" jsonb DEFAULT '[]'::jsonb,
	"distance_tiers" jsonb DEFAULT '[]'::jsonb,
	"overtime_rate" numeric(10, 2),
	"effective_start" timestamp,
	"effective_end" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "saved_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"label" varchar NOT NULL,
	"address" text NOT NULL,
	"lat" numeric(10, 8),
	"lon" numeric(11, 8),
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar NOT NULL,
	"title" varchar NOT NULL,
	"subtitle" varchar,
	"description" text NOT NULL,
	"icon" varchar NOT NULL,
	"features" text[] DEFAULT '{}'::text[] NOT NULL,
	"image_url" varchar,
	"image_alt" varchar,
	"cta_label" varchar,
	"cta_url" varchar,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar NOT NULL,
	"value" text,
	"description" text,
	"is_encrypted" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" varchar,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar,
	"password" varchar,
	"oauth_provider" varchar DEFAULT 'local',
	"oauth_id" varchar,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"phone" varchar,
	"role" varchar DEFAULT 'passenger',
	"is_active" boolean DEFAULT true,
	"pay_later_enabled" boolean DEFAULT false,
	"cash_payment_enabled" boolean DEFAULT false,
	"discount_type" varchar,
	"discount_value" numeric(10, 2) DEFAULT '0',
	"stripe_customer_id" varchar,
	"stripe_subscription_id" varchar,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"last_location_update" timestamp,
	"password_reset_token" varchar,
	"password_reset_expires" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicle_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"passenger_capacity" integer NOT NULL,
	"luggage_capacity" varchar,
	"hourly_rate" numeric(10, 2),
	"per_mile_rate" numeric(10, 2),
	"minimum_fare" numeric(10, 2),
	"image_url" varchar,
	"features" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_type_id" uuid NOT NULL,
	"driver_id" uuid,
	"make" varchar NOT NULL,
	"model" varchar NOT NULL,
	"year" integer NOT NULL,
	"color" varchar,
	"license_plate" varchar,
	"vin" varchar,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_passenger_id_users_id_fk" FOREIGN KEY ("passenger_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_type_id_vehicle_types_id_fk" FOREIGN KEY ("vehicle_type_id") REFERENCES "public"."vehicle_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_content" ADD CONSTRAINT "cms_content_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_media" ADD CONSTRAINT "cms_media_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_settings" ADD CONSTRAINT "cms_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_documents" ADD CONSTRAINT "driver_documents_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_documents" ADD CONSTRAINT "driver_documents_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_messages" ADD CONSTRAINT "driver_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_messages" ADD CONSTRAINT "driver_messages_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_ratings" ADD CONSTRAINT "driver_ratings_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_ratings" ADD CONSTRAINT "driver_ratings_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_ratings" ADD CONSTRAINT "driver_ratings_passenger_id_users_id_fk" FOREIGN KEY ("passenger_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_incidents" ADD CONSTRAINT "emergency_incidents_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_incidents" ADD CONSTRAINT "emergency_incidents_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_incidents" ADD CONSTRAINT "emergency_incidents_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_incidents" ADD CONSTRAINT "emergency_incidents_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frontend_pages" ADD CONSTRAINT "frontend_pages_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_tokens" ADD CONSTRAINT "payment_tokens_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_addresses" ADD CONSTRAINT "saved_addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_vehicle_type_id_vehicle_types_id_fk" FOREIGN KEY ("vehicle_type_id") REFERENCES "public"."vehicle_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "frontend_pages_slug_idx" ON "frontend_pages" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_vehicle_service" ON "pricing_rules" USING btree ("vehicle_type","service_type");--> statement-breakpoint
CREATE UNIQUE INDEX "services_slug_idx" ON "services" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");