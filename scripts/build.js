// Build script wrapper to ensure webpack is used instead of Turbopack
// 
// ROOT CAUSE: Windows Application Control policy blocks Next.js native binaries
// When native SWC binary fails, Next.js 16.x falls back to WASM and tries Turbopack
// Turbopack WASM bindings don't support turbo.createProject, causing build failure
//
// ROOT LEVEL FIX: Use Docker for builds (bypasses Windows Application Control)
// Alternative: Contact IT to whitelist Next.js binaries in Application Control policy

const { execSync } = require('child_process');
const path = require('path');

// Set all possible environment variables to disable Turbopack
const env = {
  ...process.env,
  NEXT_PRIVATE_SKIP_TURBO: '1',
  NEXT_PRIVATE_DISABLE_TURBO: '1',
  NEXT_PRIVATE_SKIP_TURBO_BUILD: '1',
  NEXT_PRIVATE_SKIP_TURBO_DEV: '1',
  NEXT_FORCE_WEBPACK: '1',
  TURBOPACK: '0',
  TURBO: '0',
  // Disable Turbopack detection
  NEXT_PRIVATE_SKIP_TURBO_DETECT: '1',
};

console.log('🔨 Building with webpack (Turbopack disabled)...');
console.log('⚠️  If this fails, Windows Application Control is blocking Next.js binaries.');
console.log('💡 Recommended: Use Docker for builds (docker-compose up --build)\n');

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
  console.error('\n❌ Build failed: Windows Application Control is blocking Next.js binaries.');
  console.error('\n📋 ROOT CAUSE:');
  console.error('   Windows Application Control policy is blocking @next/swc-win32-x64-msvc.node');
  console.error('   Next.js falls back to WASM → tries Turbopack → WASM bindings fail');
  console.error('\n🔧 ROOT LEVEL FIXES:');
  console.error('   1. ✅ USE DOCKER (Recommended - bypasses Windows policy):');
  console.error('      docker-compose up --build');
  console.error('\n   2. Contact IT Admin to whitelist in Application Control:');
  console.error('      - @next/swc-win32-x64-msvc\\next-swc.win32-x64-msvc.node');
  console.error('      - @prisma\\engines\\schema-engine-windows.exe');
  console.error('      - @prisma\\client\\query_engine-windows.dll.node');
  console.error('\n   3. Run PowerShell as Administrator:');
  console.error('      Get-ChildItem -Path "node_modules\\@next" -Recurse -Include "*.node" | Unblock-File');
  console.error('      Get-ChildItem -Path "node_modules\\@prisma" -Recurse -Include "*.exe","*.node" | Unblock-File');
  process.exit(1);
}
