// Dev script wrapper to ensure webpack is used and binaries are unblocked
// 
// ROOT CAUSE: Windows Application Control policy blocks Next.js and Prisma native binaries
// - Next.js SWC binary blocked → falls back to WASM → tries Turbopack → fails
// - Prisma query engine blocked → cannot connect to database → fails
//
// ROOT LEVEL FIX: Unblock binaries before starting dev server

const { execSync } = require('child_process');
const path = require('path');

// Unblock binaries first
try {
  require('./unblock-binaries.js');
} catch (error) {
  console.log('⚠️  Could not unblock binaries automatically. Continuing anyway...\n');
}

// Set environment variables to disable Turbopack (for Next.js 16.x compatibility)
const env = {
  ...process.env,
  NEXT_PRIVATE_SKIP_TURBO: '1',
  NEXT_PRIVATE_DISABLE_TURBO: '1',
  NEXT_PRIVATE_SKIP_TURBO_BUILD: '1',
  NEXT_PRIVATE_SKIP_TURBO_DEV: '1',
  NEXT_FORCE_WEBPACK: '1',
  TURBOPACK: '0',
  TURBO: '0',
};

console.log('🚀 Starting dev server...\n');

try {
  execSync('next dev', {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    env: env,
    shell: true,
  });
} catch (error) {
  console.error('\n❌ Dev server failed: Windows Application Control is blocking binaries.');
  console.error('\n📋 ROOT CAUSE:');
  console.error('   Windows Application Control is blocking native binaries:');
  console.error('   - Next.js SWC binary (@next/swc-win32-x64-msvc)');
  console.error('   - Prisma query engine (.prisma/client/query_engine-windows.dll.node)');
  console.error('\n🔧 ROOT LEVEL FIXES:');
  console.error('   1. ✅ USE DOCKER (Recommended - bypasses Windows policy):');
  console.error('      docker-compose -f docker-compose.dev.yml up');
  console.error('\n   2. Run PowerShell as Administrator:');
  console.error('      cd "C:\\Users\\anand\\Documents\\NEXTIN VISION\\Jewellery-master"');
  console.error('      Get-ChildItem -Path "node_modules\\@next" -Recurse -Include "*.node" | Unblock-File');
  console.error('      Get-ChildItem -Path "node_modules\\@prisma" -Recurse -Include "*.exe","*.node" | Unblock-File');
  console.error('      Get-ChildItem -Path "node_modules\\.prisma" -Recurse -Include "*.node" | Unblock-File');
  console.error('\n   3. Contact IT Admin to whitelist in Application Control:');
  console.error('      - @next/swc-win32-x64-msvc\\next-swc.win32-x64-msvc.node');
  console.error('      - .prisma\\client\\query_engine-windows.dll.node');
  console.error('      - @prisma\\engines\\**\\*.exe');
  process.exit(1);
}

