// Build script wrapper to ensure webpack is used instead of Turbopack
// 
// ROOT CAUSE: Windows Application Control policy blocks Next.js native binaries
// When native SWC binary fails, Next.js 15.x falls back to WASM and tries Turbopack
// Turbopack WASM bindings don't support turbo.createProject, causing build failure
//
// ROOT LEVEL FIX: Patch Next.js at module level to prevent Turbopack detection

const { execSync } = require('child_process');
const path = require('path');

// Unblock binaries first (Windows Application Control fix)
try {
  require('./unblock-binaries.js');
} catch (error) {
  console.log('⚠️  Could not unblock binaries automatically. Continuing anyway...\n');
}

// Set all possible environment variables to disable Turbopack
const env = {
  ...process.env,
  NEXT_PRIVATE_SKIP_TURBO: '1',
  NEXT_PRIVATE_DISABLE_TURBO: '1',
  NEXT_PRIVATE_SKIP_TURBO_BUILD: '1',
  NEXT_PRIVATE_SKIP_TURBO_DEV: '1',
  NEXT_FORCE_WEBPACK: '1',
  NEXT_PRIVATE_SKIP_TURBO_DETECT: '1',
  TURBOPACK: '0',
  TURBO: '0',
};

console.log('🔨 Building with webpack (Turbopack disabled at root level)...');
console.log('📦 Using installed SWC packages: @swc/core-win32-x64-msvc');
console.log('🛡️  Root-level patch applied via -r flag to prevent Turbopack detection');
console.log('⚠️  If this fails, Windows Application Control is blocking Next.js binaries.');
console.log('💡 Recommended: Use Docker for builds (docker-compose up --build)\n');

try {
  // Use NODE_OPTIONS to preload the wrapper BEFORE Next.js loads
  // This ensures patches are applied in the spawned process
  const wrapperPath = path.resolve(__dirname, 'next-wrapper.js').replace(/\\/g, '/');
  env.NODE_OPTIONS = `--require "${wrapperPath}" ${env.NODE_OPTIONS || ''}`.trim();
  
  // Run next build - the wrapper will be loaded automatically via NODE_OPTIONS
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
  console.error('\n📋 ROOT CAUSE:');
  console.error('   Windows Application Control policy may be blocking Next.js binaries');
  console.error('   Or Next.js is still detecting Turbopack despite root-level patches');
  console.error('\n🔧 ROOT LEVEL FIXES:');
  console.error('   1. ✅ USE DOCKER (Recommended - bypasses Windows policy):');
  console.error('      docker-compose up --build');
  console.error('\n   2. Run PowerShell as Administrator to unblock binaries:');
  console.error('      npm run unblock');
  console.error('      Or manually:');
  console.error('      Get-ChildItem -Path "node_modules\\@next" -Recurse -Include "*.node" | Unblock-File');
  console.error('      Get-ChildItem -Path "node_modules\\@prisma" -Recurse -Include "*.exe","*.node" | Unblock-File');
  console.error('      Get-ChildItem -Path "node_modules\\@swc" -Recurse -Include "*.node" | Unblock-File');
  process.exit(1);
}
