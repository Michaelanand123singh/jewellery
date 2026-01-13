// Build script wrapper to ensure webpack is used instead of Turbopack
// This prevents the "turbo.createProject not supported by WASM bindings" error
// 
// Root cause: Next.js 16.0.10 tries to use Turbopack when native SWC binary is blocked
// by Application Control policy. Turbopack's WASM bindings don't support createProject.
// Solution: Force webpack by ensuring Turbopack is not invoked at all.

const { spawn } = require('child_process');
const path = require('path');

// Set environment variables to disable Turbopack
process.env.NEXT_PRIVATE_SKIP_TURBO = '1';
process.env.NEXT_PRIVATE_DISABLE_TURBO = '1';

console.log('Building with webpack (Turbopack disabled)...');

const buildProcess = spawn('npx', ['next', 'build'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NEXT_PRIVATE_SKIP_TURBO: '1',
    NEXT_PRIVATE_DISABLE_TURBO: '1',
  },
});

buildProcess.on('close', (code) => {
  process.exit(code || 0);
});

buildProcess.on('error', (error) => {
  console.error('Build process error:', error);
  process.exit(1);
});
