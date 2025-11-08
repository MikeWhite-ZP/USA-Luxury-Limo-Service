import express, { type Express } from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function serveStatic(app: Express) {
  // Serve static files from the public directory
  const publicDir = join(__dirname, "../public");

  app.use(express.static(publicDir));

  // Serve index.html for all non-API routes (SPA routing)
  app.get("*", (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/api")) {
      return next();
    }

    res.sendFile(join(publicDir, "index.html"));
  });
}