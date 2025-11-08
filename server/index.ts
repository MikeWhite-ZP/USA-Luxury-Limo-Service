import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { startScheduledJobs } from "./scheduledJobs";

const log = console.log;
const app = express();

// Enable CORS with credentials support (needed for Replit webview environment)
app.use(cors({
  origin: true, // Allow same-origin requests
  credentials: true, // Enable credentials (cookies, authorization headers, etc.)
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  // Register API routes first, before Vite middleware
  const server = await registerRoutes(app);

  // Setup Vite dev server or serve static files AFTER routes are registered
  if (process.env.NODE_ENV !== "production") {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    const { serveStatic } = await import("./static");
    serveStatic(app);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // FIXED: Use port 3000 for the Node server in production
  // Caddy will proxy external requests from 5000 to 3000
  // In development, still use PORT env var or default to 5000
  let port = 5000;
  if (process.env.NODE_ENV === "production") {
    port = 3000; // Internal port when behind Caddy proxy
  } else {
    port = parseInt(process.env.PORT || '5000', 10); // Dev uses 5000
  }

  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    // Start scheduled jobs for auto-cancellation and reminders
    startScheduledJobs();
  });
})();