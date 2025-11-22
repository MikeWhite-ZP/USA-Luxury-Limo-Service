import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { startScheduledJobs } from "./scheduledJobs";

const log = console.log;
const app = express();

// Enable CORS with credentials support
// Parse allowed origins from environment variable or allow all in development
const getAllowedOrigins = (): string[] | boolean => {
  // Development mode - allow all origins
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  // Production mode - only allow specified origins
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
  if (!allowedOriginsEnv) {
    log('WARNING: ALLOWED_ORIGINS not set in production! Allowing all origins.');
    return true;
  }

  // Parse comma-separated list of allowed origins
  return allowedOriginsEnv.split(',').map(origin => origin.trim()).filter(Boolean);
};

app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint (add this BEFORE other middleware)
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Favicon endpoint - CRITICAL: Must be BEFORE async startup to prevent 503 errors
// This prevents browser errors when app is starting up or if routes fail to register
app.get("/favicon.ico", (_req, res) => {
  res.status(204).end();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
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
    // Seed email templates on startup (idempotent - safe to run every time)
    // Note: Database migrations run in entrypoint.sh before this script starts
    log("Ensuring email templates are seeded...");
    const { ensureEmailTemplatesSeeded } = await import("./seedEmailTemplates.js");
    await ensureEmailTemplatesSeeded();
    
    // Register API routes first
    const server = await registerRoutes(app);

    // Setup Vite dev server or serve static files
    if (process.env.NODE_ENV !== "production") {
      log("Starting in development mode with Vite...");
      const { setupVite } = await import("./vite.js");
      await setupVite(app, server);
    } else {
      log("Starting in production mode...");
      const { serveStatic } = await import("./static.js");
      serveStatic(app);
    }

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    });

    // Use PORT env var or default to 5000
    const port = parseInt(process.env.PORT || '5000', 10);

    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Server running on port ${port} (${process.env.NODE_ENV || 'development'} mode)`);
      startScheduledJobs();
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();