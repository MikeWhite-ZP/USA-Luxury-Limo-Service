import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { db } from "./db";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("trust proxy", 1);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.stripe.com https://*.tiles.mapbox.com https://api.tomtom.com; frame-src https://js.stripe.com;"
  );
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

const PgSession = connectPgSimple(session);

const sessionConfig: session.SessionOptions = {
  store: new PgSession({
    conObject: {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : false,
    },
    tableName: "session",
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || "usa-luxury-limo-secret-key-change-this",
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
};

app.use(session(sessionConfig));

app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV 
  });
});

app.get("/favicon.ico", (req, res) => {
  res.status(404).send("");
});

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
    await registerRoutes(app);

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

    const PORT = Number(process.env.PORT) || 5000;
    const HOST = "0.0.0.0";

    const server = createServer(app);

    app.use("/api/*", (req, res) => {
      res.status(404).json({ message: "Not found" });
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    server.listen(PORT, HOST, () => {
      log(`Server running on http://${HOST}:${PORT}`);
      log(`Environment: ${process.env.NODE_ENV || "development"}`);
      log(`Database: ${process.env.DATABASE_URL ? "Connected" : "Not configured"}`);
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
