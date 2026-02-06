// Build wrapper.
//
// NOTE: This project previously used a Node `-r` wrapper to block Turbopack.
// With Next.js 16.x, blocking Turbopack modules can crash the build
// (e.g. turbopackBuild is not a function). For CI/Vercel we should run the
// normal Next.js build, and rely on Next's own configuration.

const { execSync } = require('child_process');
const path = require('path');

// Pre-build check
try {
  require('./pre-build-check.js');
} catch (error) {
  console.error('❌ Pre-build check failed:', error.message);
  process.exit(1);
}

// Unblock binaries first (Windows Application Control fix)
try {
  require('./unblock-binaries.js');
} catch (error) {
  console.log('⚠️  Could not unblock binaries automatically. Continuing anyway...\n');
}

const env = {
  ...process.env,
  // Avoid Next picking the wrong workspace root when multiple lockfiles exist.
  // (Next config also pins this, but env is harmless.)
  NEXT_TELEMETRY_DISABLED: '1',
};

console.log('🔨 Building...');

// Ensure node_modules/.bin is in PATH
const nodeBinPath = path.resolve(__dirname, '..', 'node_modules', '.bin');
const pathSeparator = process.platform === 'win32' ? ';' : ':';
const pathEnv = process.env.PATH || '';
const updatedPath = `${nodeBinPath}${pathSeparator}${pathEnv}`;

const buildEnv = {
  ...env,
  PATH: updatedPath,
};

// Use npx to ensure next is found, or try direct path
const nextPath = path.resolve(__dirname, '..', 'node_modules', '.bin', 'next');
const fs = require('fs');

let buildCommand = 'next build';
if (fs.existsSync(nextPath)) {
  // Use full path if available
  buildCommand = `"${nextPath}" build`;
} else {
  // Fallback to npx
  buildCommand = 'npx next build';
}

try {
  execSync(buildCommand, {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    env: buildEnv,
    shell: true,
  });
  console.log('\n✅ Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  console.error('\n💡 Tip: Make sure dependencies are installed: npm install');
  process.exit(1);
}
