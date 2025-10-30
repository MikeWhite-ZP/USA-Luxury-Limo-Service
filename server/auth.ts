import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// @ts-ignore - passport-apple doesn't have types
import { Strategy as AppleStrategy } from "passport-apple";
import { Express } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import type { User as SelectUser } from "@shared/schema";

const PgSession = connectPg(session);
const MemStore = MemoryStore(session);

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
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
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    return false;
  }
}

export function setupAuth(app: Express) {
  // Enable trust proxy for Replit environment
  app.set('trust proxy', 1);

  // Use memory store for better compatibility
  const sessionStore = new MemStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  });

  const sessionSettings: session.SessionOptions = {
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false, // Don't save if unmodified (best practice)
    saveUninitialized: false, // Don't create session until something stored
    rolling: true, // Reset maxAge on every request
    name: 'connect.sid',
    proxy: true, // Trust the proxy for Replit environment
    cookie: {
      secure: false, // HTTP in development
      httpOnly: true, // Prevent XSS attacks
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    },
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy - Username/Password Authentication
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log('[AUTH] Login attempt for username:', username);
        const user = await storage.getUserByUsername(username);
        console.log('[AUTH] User found:', user ? 'Yes' : 'No');
        if (!user || !user.password) {
          console.log('[AUTH] User not found or no password');
          return done(null, false, { message: "Invalid username or password" });
        }
        
        console.log('[AUTH] Stored password hash:', user.password);
        console.log('[AUTH] Password length:', password.length);
        const isValid = await comparePasswords(password, user.password);
        console.log('[AUTH] Password valid:', isValid);
        if (!isValid) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Check if user account is active
        if (!user.isActive) {
          console.log('[AUTH] Account is inactive');
          return done(null, false, { message: "Account is inactive. Please contact an administrator." });
        }
        
        return done(null, user);
      } catch (error) {
        console.error('[AUTH] Error during authentication:', error);
        return done(error);
      }
    })
  );

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
          passReqToCallback: true,
        },
        async (req: any, accessToken, refreshToken, profile, done) => {
          try {
            // Check if user exists with this Google ID
            let user = await storage.getUserByOAuth("google", profile.id);
            
            if (!user) {
              // Create new user from Google profile
              const email = profile.emails?.[0]?.value;
              const firstName = profile.name?.givenName || "";
              const lastName = profile.name?.familyName || "";
              const profileImageUrl = profile.photos?.[0]?.value;
              
              // Get role from session if available
              const role = (req.session as any)?.selectedRole || "passenger";
              
              user = await storage.createUser({
                email,
                firstName,
                lastName,
                profileImageUrl,
                oauthProvider: "google",
                oauthId: profile.id,
                role,
                isActive: true,
              });
            }
            
            return done(null, user);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );
  }

  // Apple OAuth Strategy
  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
    passport.use(
      new AppleStrategy(
        {
          clientID: process.env.APPLE_CLIENT_ID,
          teamID: process.env.APPLE_TEAM_ID,
          keyID: process.env.APPLE_KEY_ID,
          privateKeyString: process.env.APPLE_PRIVATE_KEY,
          callbackURL: "/api/auth/apple/callback",
          passReqToCallback: true,
        },
        async (req: any, accessToken: string, refreshToken: string, idToken: any, profile: any, done: any) => {
          try {
            // Check if user exists with this Apple ID
            let user = await storage.getUserByOAuth("apple", profile.id);
            
            if (!user) {
              // Create new user from Apple profile
              const email = profile.email;
              const firstName = profile.name?.firstName || "";
              const lastName = profile.name?.lastName || "";
              
              // Get role from session if available
              const role = (req.session as any)?.selectedRole || "passenger";
              
              user = await storage.createUser({
                email,
                firstName,
                lastName,
                oauthProvider: "apple",
                oauthId: profile.id,
                role,
                isActive: true,
              });
            }
            
            return done(null, user);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );
  }

  // Passport serialization - store full user ID as string
  passport.serializeUser((user, done) => {
    console.log("🔵 Serializing user:", user.id);
    done(null, String(user.id));
  });

  passport.deserializeUser(async (id: string | number, done) => {
    try {
      const userId = String(id);
      console.log("🔵 Deserializing user ID:", userId);
      const user = await storage.getUser(userId);
      if (!user) {
        console.error("🔴 User not found for ID:", userId);
        return done(null, false);
      }
      console.log("🔵 User found:", user.username || user.email);
      done(null, user);
    } catch (error) {
      console.error("🔴 Deserialization error:", error);
      done(error, false);
    }
  });

  // Authentication routes
  
  // Local registration
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, email, firstName, lastName, role } = req.body;
      
      // Validate required fields
      if (!username || !password || !email) {
        return res.status(400).json({ message: "Username, password, and email are required" });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Create user with hashed password
      const hashedPassword = await hashPassword(password);
      
      // Determine default isActive based on role
      // Admin accounts start as inactive and must be activated by existing admins
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
        isActive: defaultIsActive,
      });
      
      // Log the user in
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("🔴 Registration login error:", loginErr);
          return next(loginErr);
        }
        
        // Explicitly save the session before responding
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("🔴 Registration session save error:", saveErr);
            return next(saveErr);
          }
          
          console.log("✅ Registration successful for user:", user.id);
          console.log("✅ SessionID:", req.sessionID);
          
          // Send user data without password
          const { password: _, ...userWithoutPassword } = user;
          res.status(201).json(userWithoutPassword);
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Local login
  app.post("/api/login", (req, res, next) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error("🔴 Login error:", err);
        return next(err);
      }
      if (!user) {
        console.log("🔴 Authentication failed:", info?.message);
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("🔴 req.login error:", loginErr);
          return next(loginErr);
        }
        
        // Session is automatically saved by passport, but we'll ensure it
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("🔴 Session save error:", saveErr);
            return next(saveErr);
          }
          
          console.log("✅ Login successful for user:", user.id);
          console.log("✅ SessionID:", req.sessionID);
          console.log("✅ Session passport:", (req.session as any).passport);
          console.log("✅ Cookie settings:", {
            secure: req.session.cookie.secure,
            httpOnly: req.session.cookie.httpOnly,
            sameSite: req.session.cookie.sameSite,
            path: req.session.cookie.path,
            domain: req.session.cookie.domain,
            maxAge: req.session.cookie.maxAge
          });
          console.log("✅ Response will set cookie header");
          
          // Log response headers after they're set
          res.on('finish', () => {
            console.log("✅ Response sent with headers:", res.getHeaders());
          });
          
          // Send user data without password
          const { password: _, ...userWithoutPassword } = user;
          res.status(200).json(userWithoutPassword);
        });
      });
    })(req, res, next);
  });

  // Google OAuth routes
  app.get("/api/auth/google", (req, res, next) => {
    // Store selected role in session before OAuth redirect
    if (req.query.role) {
      (req.session as any).selectedRole = req.query.role;
    }
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
  });

  app.get("/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      // Redirect based on user role
      const role = req.user?.role;
      const redirectPath = role === "admin" ? "/admin" :
                          role === "driver" ? "/driver" :
                          role === "dispatcher" ? "/dispatcher" :
                          "/passenger";
      res.redirect(redirectPath);
    }
  );

  // Apple OAuth routes
  app.post("/api/auth/apple", (req, res, next) => {
    // Store selected role in session before OAuth redirect
    if (req.body.role) {
      (req.session as any).selectedRole = req.body.role;
    }
    passport.authenticate("apple")(req, res, next);
  });

  app.post("/api/auth/apple/callback",
    passport.authenticate("apple", { failureRedirect: "/login" }),
    (req, res) => {
      // Redirect based on user role
      const role = req.user?.role;
      const redirectPath = role === "admin" ? "/admin" :
                          role === "driver" ? "/driver" :
                          role === "dispatcher" ? "/dispatcher" :
                          "/passenger";
      res.redirect(redirectPath);
    }
  );

  // Logout
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Logout via GET (for direct navigation) - redirects to home page
  app.get("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error('Session destroy error:', destroyErr);
        }
        res.clearCookie('connect.sid');
        res.redirect("/");
      });
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });

  // Debug endpoint for session troubleshooting
  app.get("/api/debug/session", (req, res) => {
    res.json({
      sessionID: req.sessionID,
      sessionExists: !!req.session,
      sessionPassport: (req.session as any)?.passport,
      isAuthenticated: req.isAuthenticated(),
      userId: req.user?.id,
      cookies: req.headers.cookie,
      protocol: req.protocol,
      secure: req.secure,
      headers: {
        'x-forwarded-proto': req.get('x-forwarded-proto'),
        'x-forwarded-host': req.get('x-forwarded-host'),
        'x-forwarded-for': req.get('x-forwarded-for'),
      }
    });
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: any, res: any, next: any) {
  console.log("🔍 Auth check - Path:", req.path);
  console.log("🔍 SessionID:", req.sessionID);
  console.log("🔍 Session exists?", !!req.session);
  console.log("🔍 Session.passport:", (req.session as any)?.passport);
  console.log("🔍 req.isAuthenticated():", req.isAuthenticated());
  console.log("🔍 req.user:", req.user?.id);
  
  if (req.isAuthenticated() && req.user) {
    console.log("✅ Authentication successful for user:", req.user.id);
    return next();
  }
  
  console.log("❌ Authentication failed for:", req.path);
  console.log("❌ Reason: isAuthenticated =", req.isAuthenticated(), "user =", !!req.user);
  res.status(401).json({ message: "Not authenticated" });
}
