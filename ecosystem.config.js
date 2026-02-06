// PM2 Ecosystem Configuration
// This file is used by PM2 to manage the application processes
// Copy this to /var/www/staging/ecosystem.config.js and /var/www/production/ecosystem.config.js
// and adjust the configuration as needed for each environment

module.exports = {
  apps: [
    {
      name: 'jewellery-staging',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/var/www/staging',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/var/log/jewellery/staging-error.log',
      out_file: '/var/log/jewellery/staging-out.log',
      log_file: '/var/log/jewellery/staging.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', '.next', '.git'],
    },
    {
      name: 'jewellery-production',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/var/www/production',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/jewellery/production-error.log',
      out_file: '/var/log/jewellery/production-out.log',
      log_file: '/var/log/jewellery/production.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', '.next', '.git'],
    },
  ],
};

