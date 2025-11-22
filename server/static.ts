import express, { type Express } from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { cwd } from "process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function serveStatic(app: Express) {
  // In production (bundled), use cwd() to get the correct path
  // In development, use __dirname relative path
  const publicDir = process.env.NODE_ENV === 'production' 
    ? join(cwd(), 'dist/public')
    : join(__dirname, "../dist/public");

  console.log(`[STATIC] Serving static files from: ${publicDir}`);

  // Serve static files with proper MIME types
  app.use(express.static(publicDir, {
    maxAge: '1d',
    etag: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=UTF-8');
      } else if (filePath.endsWith('.ico')) {
        res.setHeader('Content-Type', 'image/x-icon');
      } else if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (filePath.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      } else if (filePath.endsWith('.webp')) {
        res.setHeader('Content-Type', 'image/webp');
      }
    }
  }));

  // SPA fallback - only for non-API, non-static-file routes
  app.get("*", (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/api")) {
      return next();
    }

    // If it looks like a static file request that wasn't found, return 404
    // This prevents serving index.html for missing JS/CSS files
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|map)$/i)) {
      return res.status(404).send('File not found');
    }

    // Serve index.html for all other routes (SPA routing)
    res.sendFile(join(publicDir, "index.html"));
  });
}