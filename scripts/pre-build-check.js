// Pre-build check to ensure dependencies are installed
const fs = require('fs');
const path = require('path');

const nodeModulesPath = path.resolve(__dirname, '..', 'node_modules');
const nextPath = path.resolve(nodeModulesPath, '.bin', 'next');

if (!fs.existsSync(nodeModulesPath)) {
  console.error('❌ node_modules directory not found!');
  console.error('💡 Run: npm install');
  process.exit(1);
}

if (!fs.existsSync(nextPath)) {
  console.error('❌ Next.js binary not found!');
  console.error('💡 Run: npm install');
  process.exit(1);
}

console.log('✅ Dependencies check passed');
