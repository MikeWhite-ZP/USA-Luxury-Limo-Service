import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { UnauthorizedError, ForbiddenError } from './apiErrorHandler';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        firstName: string;
        lastName: string;
      };
    }
  }
}

// Check if user is authenticated
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check session
    if (!req.session || !req.session.userId) {
      throw new UnauthorizedError('Authentication required');
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.session.userId),
      columns: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    if (!user) {
      // Clear invalid session
      req.session.destroy(() => {});
      throw new UnauthorizedError('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is disabled');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Check if user has specific role
export const requireRole = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!roles.includes(req.user.role)) {
        throw new ForbiddenError(
          `Access denied. Required role: ${roles.join(' or ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Shorthand role checks
export const requireAdmin = requireRole('admin');
export const requireDriver = requireRole('driver', 'admin');
export const requireDispatcher = requireRole('dispatcher', 'admin');

// Check if user owns the resource or is admin
export const requireOwnershipOrAdmin = (
  getUserIdFromResource: (req: Request) => number | Promise<number>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      // Admins can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      const resourceUserId = await getUserIdFromResource(req);

      if (resourceUserId !== req.user.id) {
        throw new ForbiddenError('Access denied to this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Rate limiting per user (for authenticated endpoints)
const userRequestCounts = new Map<number, { count: number; resetTime: number }>();

export const rateLimitByUser = (
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    const userLimit = userRequestCounts.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      // Reset counter
      userRequestCounts.set(userId, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (userLimit.count >= maxRequests) {
      const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      return res.status(429).json({
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter,
      });
    }

    userLimit.count++;
    next();
  };
};

// =====================================================
// IP-BASED RATE LIMITING (for unauthenticated endpoints like login/register)
// =====================================================

interface IpRateLimitEntry {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

const ipRequestCounts = new Map<string, IpRateLimitEntry>();

// Clean up expired entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(ipRequestCounts.entries());
  for (let i = 0; i < entries.length; i++) {
    const [ip, entry] = entries[i];
    if (now > entry.resetTime && (!entry.blockedUntil || now > entry.blockedUntil)) {
      ipRequestCounts.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * IP-based rate limiting for unauthenticated endpoints
 * Protects against brute-force attacks on login, register, password reset
 * 
 * @param maxRequests - Maximum requests allowed in the window (default: 5)
 * @param windowMs - Time window in milliseconds (default: 15 minutes)
 * @param blockDurationMs - How long to block after exceeding limit (default: 30 minutes)
 */
export const rateLimitByIP = (
  maxRequests: number = 5,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  blockDurationMs: number = 30 * 60 * 1000 // 30 minutes block after exceeding
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get client IP (considers proxy headers)
    const clientIP = getClientIP(req);
    const now = Date.now();
    
    let entry = ipRequestCounts.get(clientIP);
    
    // Check if IP is currently blocked
    if (entry?.blockedUntil && now < entry.blockedUntil) {
      const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      console.warn(`[SECURITY] Blocked IP ${clientIP} attempted access. Blocked for ${retryAfter}s more.`);
      return res.status(429).json({
        message: 'Too many failed attempts. Please try again later.',
        code: 'IP_RATE_LIMIT_EXCEEDED',
        retryAfter,
      });
    }
    
    // Reset if window expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + windowMs,
      };
      ipRequestCounts.set(clientIP, entry);
      return next();
    }
    
    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      // Block the IP for the specified duration
      entry.blockedUntil = now + blockDurationMs;
      ipRequestCounts.set(clientIP, entry);
      
      const retryAfter = Math.ceil(blockDurationMs / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      console.warn(`[SECURITY] IP ${clientIP} exceeded rate limit (${maxRequests} requests). Blocking for ${retryAfter}s.`);
      return res.status(429).json({
        message: 'Too many requests. Please try again later.',
        code: 'IP_RATE_LIMIT_EXCEEDED',
        retryAfter,
      });
    }
    
    // Increment counter
    entry.count++;
    next();
  };
};

/**
 * Stricter rate limiting for sensitive auth endpoints (login, password reset)
 * 5 attempts per 15 minutes, 30 minute block
 */
export const strictAuthRateLimit = rateLimitByIP(5, 15 * 60 * 1000, 30 * 60 * 1000);

/**
 * Moderate rate limiting for less sensitive auth endpoints (register)
 * 10 attempts per 15 minutes, 15 minute block
 */
export const moderateAuthRateLimit = rateLimitByIP(10, 15 * 60 * 1000, 15 * 60 * 1000);

/**
 * Get client IP address, accounting for proxies
 */
function getClientIP(req: Request): string {
  // Trust X-Forwarded-For if behind proxy (app.set('trust proxy', 1) is set)
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    // X-Forwarded-For can contain multiple IPs, first one is the client
    return forwarded.split(',')[0].trim();
  }
  
  // Fallback to direct connection IP
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

// Optional authentication (doesn't fail if not authenticated)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.session && req.session.userId) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId),
        columns: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          isActive: true,
        },
      });

      if (user && user.isActive) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Don't throw error, just continue without user
    next();
  }
};

// Email verification check
export const requireEmailVerified = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
      columns: {
        emailVerified: true,
      },
    });

    if (!user?.emailVerified) {
      throw new ForbiddenError('Email verification required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Session activity tracking
export const trackSessionActivity = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.session) {
    req.session.lastActivity = new Date().toISOString();
  }
  next();
};

// Example usage in routes:
/*
import { 
  requireAuth, 
  requireAdmin, 
  requireOwnershipOrAdmin,
  rateLimitByUser 
} from './authMiddleware';

// Protected route - any authenticated user
router.get('/profile', requireAuth, async (req, res) => {
  res.json(req.user);
});

// Admin only route
router.get('/admin/users', requireAuth, requireAdmin, async (req, res) => {
  const allUsers = await db.query.users.findMany();
  res.json(allUsers);
});

// Owner or admin can access
router.get('/bookings/:id', 
  requireAuth,
  requireOwnershipOrAdmin(async (req) => {
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, parseInt(req.params.id))
    });
    return booking?.userId || 0;
  }),
  async (req, res) => {
    // Return booking data
  }
);

// Rate limited endpoint
router.post('/api/bookings', 
  requireAuth, 
  rateLimitByUser(10, 60 * 1000), // 10 requests per minute
  async (req, res) => {
    // Create booking
  }
);
*/
