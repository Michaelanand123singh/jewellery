// Build wrapper.
//
// NOTE: This project previously used a Node `-r` wrapper to block Turbopack.
// With Next.js 16.x, blocking Turbopack modules can crash the build
// (e.g. turbopackBuild is not a function). For CI/Vercel we should run the
// normal Next.js build, and rely on Next's own configuration.

const { execSync } = require('child_process');
const path = require('path');

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

try {
  execSync('next build', {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    env: env,
    shell: true,
  });
  console.log('\n✅ Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
