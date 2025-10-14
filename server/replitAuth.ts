import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

// Admin user validation - add authorized admin emails here
function isAdminUser(email: string | undefined): boolean {
  if (!email) return false;
  
  const adminEmails: string[] = [
    // Add authorized admin email addresses here
    // 'admin@usaluxurylimo.com',
    // 'super.admin@usaluxurylimo.com'
  ];
  
  return adminEmails.includes(email.toLowerCase());
}

async function upsertUser(
  claims: any,
  role?: "passenger" | "driver" | "dispatcher" | "admin"
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    role: role || "passenger", // Default to passenger if no role specified
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify = async (
    req: any,
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user: any = {};
    updateUserSession(user, tokens);
    
    // Get role from session (more secure than query param)
    const selectedRole = (req?.session as any)?.selectedRole;
    
    // Validate admin role access
    const userEmail = tokens.claims()?.email as string | undefined;
    const isAuthorizedAdmin = isAdminUser(userEmail);
    
    let role: "passenger" | "driver" | "dispatcher" | "admin";
    
    if (selectedRole === 'admin' && !isAuthorizedAdmin) {
      // Prevent unauthorized admin access - fallback to passenger
      role = 'passenger';
    } else if (selectedRole === 'passenger' || selectedRole === 'driver' || 
               selectedRole === 'dispatcher' || (selectedRole === 'admin' && isAuthorizedAdmin)) {
      role = selectedRole;
    } else {
      role = 'passenger'; // Default fallback
    }
    
    await upsertUser(tokens.claims(), role);
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
        passReqToCallback: true, // Enable request object in verify function
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    // Store the selected role in session for use in callback
    if (req.query.role) {
      (req.session as any).selectedRole = req.query.role;
    }
    
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      failureRedirect: "/login",
    })(req, res, (err: any) => {
      if (err) return next(err);
      
      // Get user role for redirect
      const selectedRole = (req.session as any)?.selectedRole;
      
      // Clean up session data
      delete (req.session as any).selectedRole;
      
      // Redirect based on role
      switch (selectedRole) {
        case 'admin':
          res.redirect('/admin');
          break;
        case 'driver':
          res.redirect('/driver');
          break;
        case 'dispatcher':
          res.redirect('/dispatcher');
          break;
        case 'passenger':
        default:
          res.redirect('/passenger');
          break;
      }
    });
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
