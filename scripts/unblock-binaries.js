// Script to unblock Next.js and Prisma binaries blocked by Windows Application Control
// This must be run before starting the dev server or building

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');
const nodeModulesPath = path.join(projectRoot, 'node_modules');

console.log('🔓 Unblocking Next.js and Prisma binaries...\n');

const filesToUnblock = [
  // Next.js SWC binaries
  path.join(nodeModulesPath, '@next', 'swc-win32-x64-msvc', 'next-swc.win32-x64-msvc.node'),
  // Prisma query engine
  path.join(nodeModulesPath, '.prisma', 'client', 'query_engine-windows.dll.node'),
  // Prisma engines
  path.join(nodeModulesPath, '@prisma', 'engines', '**', 'query_engine-windows.exe'),
  path.join(nodeModulesPath, '@prisma', 'engines', '**', 'schema-engine-windows.exe'),
  path.join(nodeModulesPath, '@prisma', 'engines', '**', 'migration-engine-windows.exe'),
];

let unblockedCount = 0;
let failedCount = 0;

// Function to unblock a single file
function unblockFile(filePath) {
  try {
    // Use PowerShell Unblock-File command
    const command = `powershell -Command "if (Test-Path '${filePath}') { Unblock-File -Path '${filePath}' -ErrorAction SilentlyContinue; Write-Host 'Unblocked: ${filePath}' }"`;
    execSync(command, { stdio: 'pipe' });
    unblockedCount++;
    return true;
  } catch (error) {
    failedCount++;
    return false;
  }
}

// Unblock specific files
filesToUnblock.forEach(file => {
  if (fs.existsSync(file)) {
    unblockFile(file);
  }
});

// Also try to unblock all .node and .exe files in @next and @prisma directories
const directoriesToCheck = [
  path.join(nodeModulesPath, '@next'),
  path.join(nodeModulesPath, '@prisma'),
  path.join(nodeModulesPath, '.prisma'),
];

directoriesToCheck.forEach(dir => {
  if (fs.existsSync(dir)) {
    try {
      // Use PowerShell to unblock all .node and .exe files recursively
      const command = `powershell -Command "Get-ChildItem -Path '${dir}' -Recurse -Include '*.node','*.exe' -ErrorAction SilentlyContinue | ForEach-Object { Unblock-File -Path $_.FullName -ErrorAction SilentlyContinue }"`;
      execSync(command, { stdio: 'pipe' });
    } catch (error) {
      // Ignore errors - might not have admin rights
    }
  }
});

console.log(`✅ Unblocked ${unblockedCount} files`);
if (failedCount > 0) {
  console.log(`⚠️  ${failedCount} files could not be unblocked (may require admin rights)`);
}
console.log('');

// Check if we need admin rights
if (failedCount > 0) {
  console.log('💡 If unblocking failed, run PowerShell as Administrator:');
  console.log('   Get-ChildItem -Path "node_modules\\@next" -Recurse -Include "*.node" | Unblock-File');
  console.log('   Get-ChildItem -Path "node_modules\\@prisma" -Recurse -Include "*.exe","*.node" | Unblock-File');
  console.log('   Get-ChildItem -Path "node_modules\\.prisma" -Recurse -Include "*.node" | Unblock-File');
}


