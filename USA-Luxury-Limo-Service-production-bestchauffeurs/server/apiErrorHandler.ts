import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Custom error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error types
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', code?: string) {
    super(message, 400, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code?: string) {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', code?: string) {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not Found', code?: string) {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', code?: string) {
    super(message, 409, code);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation Failed', code?: string) {
    super(message, 422, code);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal Server Error', code?: string) {
    super(message, 500, code);
  }
}

// Format Zod validation errors
function formatZodError(error: ZodError): string {
  const errors = error.errors.map((err) => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });
  return errors.join(', ');
}

// Async handler wrapper to catch errors
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handler middleware
export const errorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
      code: 'VALIDATION_ERROR',
    });
  }

  // Custom application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      code: err.code || 'ERROR',
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
  }

  // Database errors
  if (err.message.includes('unique constraint')) {
    return res.status(409).json({
      message: 'Resource already exists',
      code: 'DUPLICATE_ERROR',
    });
  }

  if (err.message.includes('foreign key constraint')) {
    return res.status(400).json({
      message: 'Invalid reference to related resource',
      code: 'FOREIGN_KEY_ERROR',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
  }

  // Multer file upload errors
  if (err.message.includes('File too large')) {
    return res.status(413).json({
      message: 'File size exceeds limit',
      code: 'FILE_TOO_LARGE',
    });
  }

  // Payment errors (Stripe, etc.)
  if (err.message.includes('Stripe') || err.message.includes('payment')) {
    return res.status(402).json({
      message: 'Payment processing failed',
      code: 'PAYMENT_ERROR',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    });
  }

  // Default to 500 server error
  const statusCode = 'statusCode' in err ? (err as any).statusCode : 500;
  
  res.status(statusCode).json({
    message:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.path} not found`,
    code: 'NOT_FOUND',
  });
};

// Example usage in routes:
/*
import { asyncHandler, BadRequestError, NotFoundError } from './apiErrorHandler';

router.get('/bookings/:id', asyncHandler(async (req, res) => {
  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.id, parseInt(req.params.id))
  });
  
  if (!booking) {
    throw new NotFoundError('Booking not found');
  }
  
  res.json(booking);
}));

router.post('/bookings', asyncHandler(async (req, res) => {
  const validation = bookingSchema.safeParse(req.body);
  
  if (!validation.success) {
    throw new ValidationError('Invalid booking data');
  }
  
  const booking = await createBooking(validation.data);
  res.status(201).json(booking);
}));
*/
