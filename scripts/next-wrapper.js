// Root-level fix: Patch Next.js to prevent Turbopack detection
// This wrapper is loaded via Node's -r flag BEFORE Next.js initializes
// It patches Module.require to intercept and block Turbopack modules

const Module = require('module');

// Set environment variables BEFORE anything else loads
process.env.NEXT_PRIVATE_SKIP_TURBO = '1';
process.env.NEXT_PRIVATE_DISABLE_TURBO = '1';
process.env.NEXT_PRIVATE_SKIP_TURBO_BUILD = '1';
process.env.NEXT_PRIVATE_SKIP_TURBO_DEV = '1';
process.env.NEXT_FORCE_WEBPACK = '1';
process.env.NEXT_PRIVATE_SKIP_TURBO_DETECT = '1';

// Remove any Turbopack-related env vars
delete process.env.TURBOPACK;
delete process.env.TURBO;

// Monkey-patch Module.require to intercept Turbopack requires
const originalRequire = Module.prototype.require;

// Patch require to block Turbopack modules at the root level
Module.prototype.require = function(id) {
  // Block any Turbopack-related requires
  if (id && typeof id === 'string') {
    const lowerId = id.toLowerCase();
    // Block turbopack but allow turborepo and swc (which contains 'turbo' in name)
    if (lowerId.includes('turbopack') || 
        (lowerId.includes('@turbo') && !lowerId.includes('turborepo'))) {
      // Return a mock module to prevent crashes
      const mockModule = { default: null, __esModule: true };
      return mockModule;
    }
  }
  return originalRequire.apply(this, arguments);
};

// Also patch Module._resolveFilename to prevent resolving Turbopack
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain, options) {
  if (request && typeof request === 'string') {
    const lowerRequest = request.toLowerCase();
    if (lowerRequest.includes('turbopack') || 
        (lowerRequest.includes('@turbo') && !lowerRequest.includes('turborepo'))) {
      // Return a fake path to prevent resolution
      throw new Error(`Turbopack module blocked: ${request}`);
    }
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

// This module is loaded via -r flag, so it just sets up patches
// Next.js will be loaded after this, and will use our patched require

