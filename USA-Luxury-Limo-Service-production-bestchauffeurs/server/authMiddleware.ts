import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '@db/schema';
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

// Rate limiting per user
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
