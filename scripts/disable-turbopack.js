// Patch Next.js to disable Turbopack before it initializes
// This runs before Next.js loads to prevent Turbopack detection

// Override process.env before Next.js reads it
process.env.NEXT_PRIVATE_SKIP_TURBO = '1';
process.env.NEXT_PRIVATE_DISABLE_TURBO = '1';
process.env.NEXT_PRIVATE_SKIP_TURBO_BUILD = '1';
process.env.NEXT_PRIVATE_SKIP_TURBO_DEV = '1';

// Prevent Turbopack from being detected
delete process.env.TURBOPACK;
delete process.env.TURBO;

// Force webpack
process.env.NEXT_FORCE_WEBPACK = '1';

// Monkey-patch Next.js to prevent Turbopack initialization
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  // Intercept any Turbopack-related requires
  if (id && (id.includes('turbo') || id.includes('turbopack'))) {
    throw new Error(`Turbopack is disabled: ${id}`);
  }
  return originalRequire.apply(this, arguments);
};

// Now require and run Next.js build
require('next/dist/bin/next');


