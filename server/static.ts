import express, { type Express } from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function serveStatic(app: Express) {
  // FIX: Change "../public" to "../dist/public"
  // This directs the server to the build output folder inside the container.
  const publicDir = join(__dirname, "../dist/public"); 

  // Serve static files
  app.use(express.static(publicDir));

  // SPA fallback - serve index.html for all non-API routes
  app.get("*", (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/api")) {
      return next();
    }

    res.sendFile(join(publicDir, "index.html"));
  });
}
