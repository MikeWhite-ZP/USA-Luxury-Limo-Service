/**
 * Clean Console Setup
 * Filters out browser extension errors and unnecessary service worker logs
 */

export function setupCleanConsole() {
  // Filter console errors from browser extensions
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';

    const extensionErrorPatterns = [
      'content_script.js',
      'can\'t access property "control"',
      'extension context invalidated',
      'chrome-extension://',
      'moz-extension://',
    ];

    const isExtensionError = extensionErrorPatterns.some(pattern => 
      message.includes(pattern)
    );

    if (!isExtensionError) {
      originalError.apply(console, args);
    }
  };

  // Filter console warnings from browser extensions
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';

    const extensionWarningPatterns = [
      'extension',
      'content_script',
    ];

    const isExtensionWarning = extensionWarningPatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );

    if (!isExtensionWarning) {
      originalWarn.apply(console, args);
    }
  };

  // Suppress Service Worker success messages in production
  if (import.meta.env.PROD) {
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      if (!message.includes('Service Worker registered')) {
        originalLog.apply(console, args);
      }
    };
  }

  // Global error handler
  window.addEventListener('error', (event) => {
    if (event.filename && (
      event.filename.includes('content_script') ||
      event.filename.includes('extension') ||
      event.filename.includes('chrome-extension') ||
      event.filename.includes('moz-extension')
    )) {
      event.preventDefault();
      return false;
    }
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.toString() || '';
    if (reason.includes('content_script') || 
        reason.includes('extension') ||
        reason.includes('chrome-extension') ||
        reason.includes('moz-extension')) {
      event.preventDefault();
      return false;
    }
  });
}

// Optional: Development mode logger
export function devLog(...args: any[]) {
  if (import.meta.env.DEV) {
    console.log('[DEV]', ...args);
  }
}

// Optional: Production error reporter
export function reportError(error: Error, context?: string) {
  if (import.meta.env.PROD) {
    // Send to your error tracking service (Sentry, LogRocket, etc.)
    console.error(`[${context || 'Error'}]:`, error);
    // Example: Sentry.captureException(error);
  } else {
    console.error(`[${context || 'Error'}]:`, error);
  }
}