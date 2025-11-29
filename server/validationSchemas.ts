import { z } from 'zod';

// =====================================================
// USER VALIDATION SCHEMAS
// =====================================================

export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must not exceed 100 characters')
    .toLowerCase()
    .trim(),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .trim(),
  
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .trim(),
  
  phoneNumber: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (E.164)')
    .optional()
    .or(z.literal('')),
});

export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  
  password: z.string()
    .min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .trim()
    .optional(),
  
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .trim()
    .optional(),
  
  phoneNumber: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  
  address: z.string()
    .max(200, 'Address must not exceed 200 characters')
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

// =====================================================
// BOOKING VALIDATION SCHEMAS
// =====================================================

export const bookingQuoteSchema = z.object({
  vehicleTypeId: z.number()
    .int('Vehicle type ID must be an integer')
    .positive('Invalid vehicle type'),
  
  serviceType: z.enum(['transfer', 'hourly', 'airport'], {
    errorMap: () => ({ message: 'Service type must be transfer, hourly, or airport' }),
  }),
  
  pickupAddress: z.string()
    .min(5, 'Pickup address must be at least 5 characters')
    .max(200, 'Pickup address is too long'),
  
  dropoffAddress: z.string()
    .min(5, 'Dropoff address must be at least 5 characters')
    .max(200, 'Dropoff address is too long')
    .optional(),
  
  hours: z.number()
    .int('Hours must be an integer')
    .min(2, 'Minimum 2 hours for hourly bookings')
    .max(24, 'Maximum 24 hours per booking')
    .optional(),
  
  pickupDate: z.string()
    .datetime('Invalid pickup date format')
    .refine(
      (date) => new Date(date) > new Date(),
      'Pickup date must be in the future'
    ),
  
  passengers: z.number()
    .int('Passengers must be an integer')
    .min(1, 'At least 1 passenger required')
    .max(50, 'Too many passengers'),
  
  luggage: z.number()
    .int('Luggage count must be an integer')
    .min(0, 'Luggage cannot be negative')
    .max(100, 'Too much luggage')
    .optional()
    .default(0),
});

export const createBookingSchema = bookingQuoteSchema.extend({
  paymentMethod: z.enum(['stripe', 'paypal', 'cash', 'pay_later'], {
    errorMap: () => ({ message: 'Invalid payment method' }),
  }),
  
  specialRequests: z.string()
    .max(500, 'Special requests must not exceed 500 characters')
    .optional(),
  
  flightNumber: z.string()
    .max(20, 'Flight number must not exceed 20 characters')
    .optional(),
  
  stripePaymentMethodId: z.string()
    .optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'assigned',
    'in_progress',
    'completed',
    'cancelled',
  ], {
    errorMap: () => ({ message: 'Invalid booking status' }),
  }),
  
  cancellationReason: z.string()
    .max(500, 'Cancellation reason must not exceed 500 characters')
    .optional(),
});

// =====================================================
// DRIVER VALIDATION SCHEMAS
// =====================================================

export const driverLocationSchema = z.object({
  latitude: z.number()
    .min(-90, 'Invalid latitude')
    .max(90, 'Invalid latitude'),
  
  longitude: z.number()
    .min(-180, 'Invalid longitude')
    .max(180, 'Invalid longitude'),
  
  heading: z.number()
    .min(0, 'Heading must be between 0 and 360')
    .max(360, 'Heading must be between 0 and 360')
    .optional(),
  
  speed: z.number()
    .min(0, 'Speed cannot be negative')
    .optional(),
});

export const driverJobActionSchema = z.object({
  action: z.enum(['accept', 'decline', 'start', 'arrive', 'complete'], {
    errorMap: () => ({ message: 'Invalid action' }),
  }),
  
  eta: z.number()
    .int('ETA must be an integer')
    .min(0, 'ETA cannot be negative')
    .optional(),
  
  notes: z.string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional(),
});

export const uploadDocumentSchema = z.object({
  documentType: z.enum([
    'license',
    'insurance',
    'vehicle_registration',
    'background_check',
    'other',
  ], {
    errorMap: () => ({ message: 'Invalid document type' }),
  }),
  
  expiryDate: z.string()
    .datetime('Invalid expiry date format')
    .refine(
      (date) => new Date(date) > new Date(),
      'Expiry date must be in the future'
    )
    .optional(),
  
  notes: z.string()
    .max(200, 'Notes must not exceed 200 characters')
    .optional(),
});

// =====================================================
// ADMIN VALIDATION SCHEMAS
// =====================================================

export const createVehicleTypeSchema = z.object({
  name: z.string()
    .min(2, 'Vehicle name must be at least 2 characters')
    .max(50, 'Vehicle name must not exceed 50 characters')
    .trim(),
  
  description: z.string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  
  capacity: z.number()
    .int('Capacity must be an integer')
    .min(1, 'Capacity must be at least 1')
    .max(50, 'Capacity cannot exceed 50'),
  
  luggageCapacity: z.number()
    .int('Luggage capacity must be an integer')
    .min(0, 'Luggage capacity cannot be negative')
    .max(100, 'Luggage capacity is too high'),
  
  basePrice: z.number()
    .min(0, 'Base price cannot be negative')
    .max(10000, 'Base price is too high'),
  
  pricePerMile: z.number()
    .min(0, 'Price per mile cannot be negative')
    .max(100, 'Price per mile is too high'),
  
  pricePerHour: z.number()
    .min(0, 'Price per hour cannot be negative')
    .max(1000, 'Price per hour is too high'),
  
  isActive: z.boolean()
    .default(true),
});

export const assignDriverSchema = z.object({
  bookingId: z.number()
    .int('Booking ID must be an integer')
    .positive('Invalid booking ID'),
  
  driverId: z.number()
    .int('Driver ID must be an integer')
    .positive('Invalid driver ID'),
  
  notes: z.string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional(),
});

// =====================================================
// PAYMENT VALIDATION SCHEMAS
// =====================================================

export const stripePaymentSchema = z.object({
  bookingId: z.number()
    .int('Booking ID must be an integer')
    .positive('Invalid booking ID'),
  
  paymentMethodId: z.string()
    .min(1, 'Payment method ID is required'),
  
  saveCard: z.boolean()
    .default(false),
});

// =====================================================
// SEARCH & FILTER SCHEMAS
// =====================================================

export const bookingSearchSchema = z.object({
  status: z.string()
    .optional(),
  
  startDate: z.string()
    .datetime('Invalid start date format')
    .optional(),
  
  endDate: z.string()
    .datetime('Invalid end date format')
    .optional(),
  
  driverId: z.number()
    .int('Driver ID must be an integer')
    .optional(),
  
  page: z.number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(1),
  
  limit: z.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
});

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

// Validate and sanitize input
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

// Validate with safe parse (returns errors)
export function safeValidateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

// Example usage in route:
/*
import { validateInput, createBookingSchema } from './validationSchemas';
import { ValidationError } from './apiErrorHandler';

router.post('/api/bookings', async (req, res, next) => {
  try {
    const validatedData = validateInput(createBookingSchema, req.body);
    
    // Use validatedData (TypeScript will know the exact type)
    const booking = await createBooking(validatedData);
    
    res.status(201).json(booking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(formatZodError(error)));
    } else {
      next(error);
    }
  }
});
*/
