import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import MemoryStore from "memorystore";
import path from "path";
import { fileURLToPath } from "url";
import { isSetupComplete, getSetupConfig } from "./setupConfig";
import { getDatabaseUrl, initializeDatabase } from "./dynamicDb";
import setupRoutes from "./setupRoutes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("trust proxy", 1);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  
  if (process.env.NODE_ENV === "production") {
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.stripe.com https://*.tiles.mapbox.com https://api.tomtom.com wss://*.replit.dev; frame-src https://js.stripe.com; frame-ancestors 'self';"
    );
  }
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

function createSessionMiddleware() {
  const setupComplete = isSetupComplete();
  const config = getSetupConfig();
  const databaseUrl = getDatabaseUrl();
  
  if (setupComplete && databaseUrl) {
    const PgSession = connectPgSimple(session);
    return session({
      store: new PgSession({
        conObject: {
          connectionString: databaseUrl,
          ssl: databaseUrl.includes("sslmode=require")
            ? { rejectUnauthorized: false }
            : false,
        },
        tableName: "session",
        createTableIfMissing: true,
      }),
      secret: config?.sessionSecret || process.env.SESSION_SECRET || "usa-luxury-limo-secret-key-change-this",
      resave: false,
      saveUninitialized: false,
      name: "sessionId",
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      },
      rolling: true,
    });
  } else {
    const MemStore = MemoryStore(session);
    return session({
      store: new MemStore({
        checkPeriod: 86400000,
      }),
      secret: "setup-mode-temporary-secret",
      resave: false,
      saveUninitialized: false,
      name: "setupSessionId",
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 60 * 60 * 1000,
      },
    });
  }
}

app.use(createSessionMiddleware());

app.get("/health", (req, res) => {
  const setupComplete = isSetupComplete();
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    setupComplete
  });
});

app.use(setupRoutes);

app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
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
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const setupComplete = isSetupComplete();
    
    if (setupComplete) {
      const dbConnection = initializeDatabase();
      if (!dbConnection) {
        console.warn('[SERVER] Setup marked as complete but database connection failed');
      }
    } else {
      log('[SERVER] Running in SETUP MODE - no database configured');
      log('[SERVER] Visit the application to complete initial setup');
    }

    const server = await registerRoutes(app);

    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
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
          ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
        });
      }
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    app.use((req, res) => {
      if (req.path.startsWith("/api")) {
        res.status(404).json({ message: "Not found" });
      } else {
        res.sendFile(path.join(__dirname, "../dist/public/index.html"));
      }
    });

    const PORT = parseInt(process.env.PORT || '5000', 10);
    const HOST = "0.0.0.0";

    server.listen(PORT, HOST, () => {
      log(`Server running on http://${HOST}:${PORT}`);
      log(`Environment: ${process.env.NODE_ENV || "development"}`);
      log(`Setup Complete: ${setupComplete}`);
      if (setupComplete) {
        log(`Database: Connected`);
      } else {
        log(`Database: Awaiting setup`);
      }
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
