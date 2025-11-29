--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    passenger_id character varying NOT NULL,
    driver_id uuid,
    vehicle_type_id uuid NOT NULL,
    vehicle_id uuid,
    booking_type character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying,
    pickup_address text NOT NULL,
    pickup_lat numeric(10,8),
    pickup_lon numeric(11,8),
    destination_address text,
    destination_lat numeric(10,8),
    destination_lon numeric(11,8),
    via_points jsonb,
    scheduled_date_time timestamp without time zone NOT NULL,
    estimated_duration integer,
    estimated_distance numeric(8,2),
    requested_hours integer,
    base_fare numeric(10,2),
    distance_fare numeric(10,2),
    time_fare numeric(10,2),
    gratuity_amount numeric(10,2),
    airport_fee_amount numeric(10,2),
    surge_pricing_multiplier numeric(5,2),
    surge_pricing_amount numeric(10,2),
    surcharges jsonb DEFAULT '[]'::jsonb,
    regular_price numeric(10,2),
    discount_percentage numeric(5,2),
    discount_amount numeric(10,2),
    total_amount numeric(10,2),
    driver_payment numeric(10,2),
    payment_status character varying DEFAULT 'pending'::character varying,
    payment_intent_id character varying,
    special_instructions text,
    passenger_count integer DEFAULT 1,
    luggage_count integer DEFAULT 0,
    baby_seat boolean DEFAULT false,
    booking_for character varying DEFAULT 'self'::character varying,
    passenger_name character varying,
    passenger_phone character varying,
    passenger_email character varying,
    flight_number character varying,
    flight_name character varying,
    flight_airline character varying,
    flight_departure_airport character varying,
    flight_arrival_airport character varying,
    flight_departure character varying,
    flight_arrival character varying,
    no_flight_info boolean DEFAULT false,
    booked_by character varying,
    booked_at timestamp without time zone,
    confirmed_at timestamp without time zone,
    assigned_at timestamp without time zone,
    accepted_at timestamp without time zone,
    reminder_sent_at timestamp without time zone,
    on_the_way_at timestamp without time zone,
    arrived_at timestamp without time zone,
    on_board_at timestamp without time zone,
    auto_cancelled_at timestamp without time zone,
    accepted_location jsonb,
    started_at timestamp without time zone,
    started_location jsonb,
    dod_at timestamp without time zone,
    dod_location jsonb,
    pob_at timestamp without time zone,
    pob_location jsonb,
    ended_at timestamp without time zone,
    ended_location jsonb,
    payment_at timestamp without time zone,
    cancelled_at timestamp without time zone,
    cancel_reason text,
    no_show boolean DEFAULT false,
    refund_invoice_sent boolean DEFAULT false,
    marked_completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT bookings_booked_by_check CHECK (((booked_by)::text = ANY ((ARRAY['admin'::character varying, 'passenger'::character varying])::text[]))),
    CONSTRAINT bookings_booking_for_check CHECK (((booking_for)::text = ANY ((ARRAY['self'::character varying, 'someone_else'::character varying])::text[]))),
    CONSTRAINT bookings_booking_type_check CHECK (((booking_type)::text = ANY ((ARRAY['transfer'::character varying, 'hourly'::character varying])::text[]))),
    CONSTRAINT bookings_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'failed'::character varying, 'refunded'::character varying])::text[]))),
    CONSTRAINT bookings_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'pending_driver_acceptance'::character varying, 'confirmed'::character varying, 'on_the_way'::character varying, 'arrived'::character varying, 'on_board'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.bookings OWNER TO postgres;

--
-- Name: cms_content; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cms_content (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    block_type character varying NOT NULL,
    identifier character varying NOT NULL,
    title character varying,
    content text,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    updated_by character varying,
    updated_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT cms_content_block_type_check CHECK (((block_type)::text = ANY ((ARRAY['hero'::character varying, 'about'::character varying, 'services'::character varying, 'contact'::character varying, 'footer'::character varying, 'testimonial'::character varying])::text[])))
);


ALTER TABLE public.cms_content OWNER TO postgres;

--
-- Name: cms_media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cms_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    file_name character varying NOT NULL,
    file_url text NOT NULL,
    file_type character varying NOT NULL,
    file_size integer,
    folder character varying DEFAULT 'general'::character varying,
    alt_text text,
    description text,
    width integer,
    height integer,
    uploaded_by character varying NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT cms_media_folder_check CHECK (((folder)::text = ANY ((ARRAY['logos'::character varying, 'hero-images'::character varying, 'favicon'::character varying, 'vehicles'::character varying, 'testimonials'::character varying, 'general'::character varying])::text[])))
);


ALTER TABLE public.cms_media OWNER TO postgres;

--
-- Name: cms_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cms_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key character varying NOT NULL,
    value text,
    category character varying NOT NULL,
    description text,
    updated_by character varying,
    updated_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT cms_settings_category_check CHECK (((category)::text = ANY ((ARRAY['branding'::character varying, 'colors'::character varying, 'social'::character varying, 'contact'::character varying, 'seo'::character varying])::text[])))
);


ALTER TABLE public.cms_settings OWNER TO postgres;

--
-- Name: contact_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    email character varying NOT NULL,
    phone character varying,
    service_type character varying,
    message text NOT NULL,
    status character varying DEFAULT 'new'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT contact_submissions_status_check CHECK (((status)::text = ANY ((ARRAY['new'::character varying, 'contacted'::character varying, 'resolved'::character varying])::text[])))
);


ALTER TABLE public.contact_submissions OWNER TO postgres;

--
-- Name: driver_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.driver_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    driver_id uuid NOT NULL,
    document_type character varying NOT NULL,
    document_url text NOT NULL,
    expiration_date timestamp without time zone,
    vehicle_plate character varying,
    status character varying DEFAULT 'pending'::character varying,
    rejection_reason text,
    whatsapp_number character varying,
    uploaded_at timestamp without time zone DEFAULT now(),
    reviewed_at timestamp without time zone,
    reviewed_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT driver_documents_document_type_check CHECK (((document_type)::text = ANY ((ARRAY['driver_license'::character varying, 'limo_license'::character varying, 'insurance_certificate'::character varying, 'vehicle_image'::character varying, 'profile_photo'::character varying])::text[]))),
    CONSTRAINT driver_documents_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.driver_documents OWNER TO postgres;

--
-- Name: driver_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.driver_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id character varying NOT NULL,
    driver_id character varying,
    message_type character varying DEFAULT 'individual'::character varying NOT NULL,
    subject character varying,
    message text NOT NULL,
    priority character varying DEFAULT 'normal'::character varying,
    delivery_method character varying DEFAULT 'both'::character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying,
    sent_at timestamp without time zone,
    delivered_at timestamp without time zone,
    error_message text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT driver_messages_delivery_method_check CHECK (((delivery_method)::text = ANY ((ARRAY['sms'::character varying, 'email'::character varying, 'both'::character varying])::text[]))),
    CONSTRAINT driver_messages_message_type_check CHECK (((message_type)::text = ANY ((ARRAY['individual'::character varying, 'broadcast'::character varying, 'alert'::character varying])::text[]))),
    CONSTRAINT driver_messages_priority_check CHECK (((priority)::text = ANY ((ARRAY['normal'::character varying, 'high'::character varying, 'urgent'::character varying])::text[]))),
    CONSTRAINT driver_messages_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'sent'::character varying, 'delivered'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.driver_messages OWNER TO postgres;

--
-- Name: driver_ratings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.driver_ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    driver_id uuid NOT NULL,
    passenger_id character varying NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT driver_ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.driver_ratings OWNER TO postgres;

--
-- Name: drivers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.drivers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    license_number character varying,
    license_expiry timestamp without time zone,
    license_document_url character varying,
    insurance_document_url character varying,
    vehicle_plate character varying,
    driver_credentials character varying,
    background_check_status character varying DEFAULT 'pending'::character varying,
    verification_status character varying DEFAULT 'pending'::character varying,
    rating numeric(3,2) DEFAULT 0.00,
    total_rides integer DEFAULT 0,
    is_available boolean DEFAULT false,
    current_location text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT drivers_background_check_status_check CHECK (((background_check_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]))),
    CONSTRAINT drivers_verification_status_check CHECK (((verification_status)::text = ANY ((ARRAY['pending'::character varying, 'verified'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.drivers OWNER TO postgres;

--
-- Name: emergency_incidents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.emergency_incidents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reporter_id character varying NOT NULL,
    incident_type character varying NOT NULL,
    severity character varying DEFAULT 'medium'::character varying NOT NULL,
    booking_id uuid,
    driver_id character varying,
    location character varying,
    location_coordinates character varying,
    description text NOT NULL,
    status character varying DEFAULT 'open'::character varying NOT NULL,
    assigned_to character varying,
    resolution_notes text,
    emergency_services_contacted boolean DEFAULT false,
    resolved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT emergency_incidents_incident_type_check CHECK (((incident_type)::text = ANY ((ARRAY['accident'::character varying, 'breakdown'::character varying, 'medical'::character varying, 'safety'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT emergency_incidents_severity_check CHECK (((severity)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::text[]))),
    CONSTRAINT emergency_incidents_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'in_progress'::character varying, 'resolved'::character varying, 'closed'::character varying])::text[])))
);


ALTER TABLE public.emergency_incidents OWNER TO postgres;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    invoice_number character varying NOT NULL,
    base_fare numeric(10,2),
    gratuity_amount numeric(10,2),
    airport_fee_amount numeric(10,2),
    surge_pricing_multiplier numeric(5,2),
    surge_pricing_amount numeric(10,2),
    subtotal numeric(10,2) NOT NULL,
    discount_percentage numeric(5,2),
    discount_amount numeric(10,2),
    tax_amount numeric(10,2) DEFAULT 0.00,
    total_amount numeric(10,2) NOT NULL,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    token character varying NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- Name: payment_systems; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_systems (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider character varying NOT NULL,
    is_active boolean DEFAULT false,
    public_key text,
    secret_key text,
    webhook_secret text,
    config jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT payment_systems_provider_check CHECK (((provider)::text = ANY ((ARRAY['stripe'::character varying, 'paypal'::character varying, 'square'::character varying])::text[])))
);


ALTER TABLE public.payment_systems OWNER TO postgres;

--
-- Name: payment_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    token character varying(64) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false,
    used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.payment_tokens OWNER TO postgres;

--
-- Name: pricing_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pricing_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vehicle_type character varying NOT NULL,
    service_type character varying NOT NULL,
    base_rate numeric(10,2),
    per_mile_rate numeric(10,2),
    hourly_rate numeric(10,2),
    minimum_hours integer,
    minimum_fare numeric(10,2),
    gratuity_percent numeric(5,2) DEFAULT 20.00,
    airport_fees jsonb DEFAULT '[]'::jsonb,
    meet_and_greet jsonb DEFAULT '{"charge": 0, "enabled": false}'::jsonb,
    surge_pricing jsonb DEFAULT '[]'::jsonb,
    distance_tiers jsonb DEFAULT '[]'::jsonb,
    overtime_rate numeric(10,2),
    effective_start timestamp without time zone,
    effective_end timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT pricing_rules_service_type_check CHECK (((service_type)::text = ANY ((ARRAY['transfer'::character varying, 'hourly'::character varying])::text[]))),
    CONSTRAINT pricing_rules_vehicle_type_check CHECK (((vehicle_type)::text = ANY ((ARRAY['business_sedan'::character varying, 'business_suv'::character varying, 'first_class_sedan'::character varying, 'first_class_suv'::character varying, 'business_van'::character varying])::text[])))
);


ALTER TABLE public.pricing_rules OWNER TO postgres;

--
-- Name: saved_addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.saved_addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    label character varying NOT NULL,
    address text NOT NULL,
    lat numeric(10,8),
    lon numeric(11,8),
    is_default boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.saved_addresses OWNER TO postgres;

--
-- Name: schema_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schema_version (
    id integer NOT NULL,
    version character varying NOT NULL,
    applied_at timestamp without time zone DEFAULT now(),
    description text
);


ALTER TABLE public.schema_version OWNER TO postgres;

--
-- Name: schema_version_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.schema_version_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schema_version_id_seq OWNER TO postgres;

--
-- Name: schema_version_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.schema_version_id_seq OWNED BY public.schema_version.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying NOT NULL,
    title character varying NOT NULL,
    subtitle character varying,
    description text NOT NULL,
    icon character varying NOT NULL,
    features text[] DEFAULT '{}'::text[] NOT NULL,
    image_url character varying,
    image_alt character varying,
    cta_label character varying,
    cta_url character varying,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT services_icon_check CHECK (((icon)::text = ANY ((ARRAY['Plane'::character varying, 'Briefcase'::character varying, 'Heart'::character varying, 'Clock'::character varying, 'Car'::character varying, 'Users'::character varying, 'Star'::character varying, 'Shield'::character varying, 'Calendar'::character varying, 'MapPin'::character varying])::text[])))
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key character varying NOT NULL,
    value text,
    description text,
    is_encrypted boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by character varying
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    username character varying,
    password character varying,
    oauth_provider character varying DEFAULT 'local'::character varying,
    oauth_id character varying,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    phone character varying,
    role character varying DEFAULT 'passenger'::character varying,
    is_active boolean DEFAULT true,
    pay_later_enabled boolean DEFAULT false,
    cash_payment_enabled boolean DEFAULT false,
    discount_type character varying,
    discount_value numeric(10,2) DEFAULT 0,
    stripe_customer_id character varying,
    stripe_subscription_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    password_reset_token text,
    password_reset_expires timestamp without time zone,
    CONSTRAINT users_discount_type_check CHECK (((discount_type)::text = ANY ((ARRAY['percentage'::character varying, 'fixed'::character varying])::text[]))),
    CONSTRAINT users_oauth_provider_check CHECK (((oauth_provider)::text = ANY ((ARRAY['local'::character varying, 'google'::character varying, 'apple'::character varying])::text[]))),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['passenger'::character varying, 'driver'::character varying, 'dispatcher'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: vehicle_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicle_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    description text,
    passenger_capacity integer NOT NULL,
    luggage_capacity character varying,
    hourly_rate numeric(10,2),
    per_mile_rate numeric(10,2),
    minimum_fare numeric(10,2),
    image_url character varying,
    features jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.vehicle_types OWNER TO postgres;

--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vehicle_type_id uuid NOT NULL,
    driver_id uuid,
    make character varying NOT NULL,
    model character varying NOT NULL,
    year integer NOT NULL,
    color character varying,
    license_plate character varying,
    vin character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.vehicles OWNER TO postgres;

--
-- Name: schema_version id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_version ALTER COLUMN id SET DEFAULT nextval('public.schema_version_id_seq'::regclass);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: cms_content cms_content_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cms_content
    ADD CONSTRAINT cms_content_pkey PRIMARY KEY (id);


--
-- Name: cms_media cms_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cms_media
    ADD CONSTRAINT cms_media_pkey PRIMARY KEY (id);


--
-- Name: cms_settings cms_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cms_settings
    ADD CONSTRAINT cms_settings_key_key UNIQUE (key);


--
-- Name: cms_settings cms_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cms_settings
    ADD CONSTRAINT cms_settings_pkey PRIMARY KEY (id);


--
-- Name: contact_submissions contact_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_submissions
    ADD CONSTRAINT contact_submissions_pkey PRIMARY KEY (id);


--
-- Name: driver_documents driver_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_documents
    ADD CONSTRAINT driver_documents_pkey PRIMARY KEY (id);


--
-- Name: driver_messages driver_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_messages
    ADD CONSTRAINT driver_messages_pkey PRIMARY KEY (id);


--
-- Name: driver_ratings driver_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_ratings
    ADD CONSTRAINT driver_ratings_pkey PRIMARY KEY (id);


--
-- Name: drivers drivers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_pkey PRIMARY KEY (id);


--
-- Name: emergency_incidents emergency_incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emergency_incidents
    ADD CONSTRAINT emergency_incidents_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- Name: payment_systems payment_systems_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_systems
    ADD CONSTRAINT payment_systems_pkey PRIMARY KEY (id);


--
-- Name: payment_systems payment_systems_provider_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_systems
    ADD CONSTRAINT payment_systems_provider_key UNIQUE (provider);


--
-- Name: payment_tokens payment_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_tokens
    ADD CONSTRAINT payment_tokens_pkey PRIMARY KEY (id);


--
-- Name: payment_tokens payment_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_tokens
    ADD CONSTRAINT payment_tokens_token_key UNIQUE (token);


--
-- Name: pricing_rules pricing_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pricing_rules
    ADD CONSTRAINT pricing_rules_pkey PRIMARY KEY (id);


--
-- Name: saved_addresses saved_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_addresses
    ADD CONSTRAINT saved_addresses_pkey PRIMARY KEY (id);


--
-- Name: schema_version schema_version_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_version
    ADD CONSTRAINT schema_version_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: services services_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_slug_key UNIQUE (slug);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: system_settings system_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_key_key UNIQUE (key);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: vehicle_types vehicle_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_types
    ADD CONSTRAINT vehicle_types_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: cms_content_block_identifier_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX cms_content_block_identifier_idx ON public.cms_content USING btree (block_type, identifier);


--
-- Name: services_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX services_slug_idx ON public.services USING btree (slug);


--
-- Name: unique_vehicle_service; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX unique_vehicle_service ON public.pricing_rules USING btree (vehicle_type, service_type);


--
-- Name: bookings bookings_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE SET NULL;


--
-- Name: bookings bookings_passenger_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_passenger_id_fkey FOREIGN KEY (passenger_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE SET NULL;


--
-- Name: bookings bookings_vehicle_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_vehicle_type_id_fkey FOREIGN KEY (vehicle_type_id) REFERENCES public.vehicle_types(id);


--
-- Name: cms_content cms_content_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cms_content
    ADD CONSTRAINT cms_content_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: cms_media cms_media_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cms_media
    ADD CONSTRAINT cms_media_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: cms_settings cms_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cms_settings
    ADD CONSTRAINT cms_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: driver_documents driver_documents_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_documents
    ADD CONSTRAINT driver_documents_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE CASCADE;


--
-- Name: driver_documents driver_documents_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_documents
    ADD CONSTRAINT driver_documents_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: driver_messages driver_messages_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_messages
    ADD CONSTRAINT driver_messages_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.users(id);


--
-- Name: driver_messages driver_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_messages
    ADD CONSTRAINT driver_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: driver_ratings driver_ratings_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_ratings
    ADD CONSTRAINT driver_ratings_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: driver_ratings driver_ratings_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_ratings
    ADD CONSTRAINT driver_ratings_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE CASCADE;


--
-- Name: driver_ratings driver_ratings_passenger_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_ratings
    ADD CONSTRAINT driver_ratings_passenger_id_fkey FOREIGN KEY (passenger_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: drivers drivers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: emergency_incidents emergency_incidents_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emergency_incidents
    ADD CONSTRAINT emergency_incidents_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: emergency_incidents emergency_incidents_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emergency_incidents
    ADD CONSTRAINT emergency_incidents_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- Name: emergency_incidents emergency_incidents_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emergency_incidents
    ADD CONSTRAINT emergency_incidents_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.users(id);


--
-- Name: emergency_incidents emergency_incidents_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emergency_incidents
    ADD CONSTRAINT emergency_incidents_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id);


--
-- Name: invoices invoices_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: payment_tokens payment_tokens_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_tokens
    ADD CONSTRAINT payment_tokens_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: saved_addresses saved_addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_addresses
    ADD CONSTRAINT saved_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: system_settings system_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: vehicles vehicles_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE SET NULL;


--
-- Name: vehicles vehicles_vehicle_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_vehicle_type_id_fkey FOREIGN KEY (vehicle_type_id) REFERENCES public.vehicle_types(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

