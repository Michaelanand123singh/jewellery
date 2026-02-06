# CI/CD Setup Summary

## ✅ What Has Been Created

### GitHub Actions Workflows

1. **`.github/workflows/ci.yml`**
   - Runs on pull requests and pushes to main/staging/develop
   - Validates code with linting and tests
   - Builds the application to ensure it compiles

2. **`.github/workflows/deploy-staging.yml`**
   - Triggers on push to `staging` branch
   - Can also be triggered manually via `workflow_dispatch`
   - Deploys to staging environment at `/var/www/staging`
   - Uses PM2 to manage the application process

3. **`.github/workflows/deploy-production.yml`**
   - Triggers on push to `main` branch
   - Can also be triggered manually via `workflow_dispatch`
   - Deploys to production environment at `/var/www/production`
   - Uses PM2 to manage the application process

### Deployment Scripts

1. **`scripts/deploy-staging.sh`**
   - Standalone deployment script for staging
   - Can be run manually on the server
   - Handles git pull, npm install, build, migrations, and PM2 restart

2. **`scripts/deploy-production.sh`**
   - Standalone deployment script for production
   - Can be run manually on the server
   - Handles git pull, npm install, build, migrations, and PM2 restart

### Configuration Files

1. **`ecosystem.config.js`**
   - PM2 configuration template
   - Contains settings for both staging and production
   - Should be copied to each environment directory

### Documentation

1. **`CICD_SETUP.md`**
   - Complete setup guide
   - Instructions for generating SSH keys
   - GitHub Secrets configuration
   - Server setup requirements
   - Troubleshooting guide

2. **`README.md`** (Updated)
   - Updated deployment section
   - Removed Docker-specific instructions
   - Added PM2 and non-Docker deployment info

## 🚀 Next Steps

### 1. Set Up GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:
- `STAGING_HOST` - Your staging server IP/domain
- `STAGING_SSH_USER` - SSH username (usually `root`)
- `STAGING_SSH_KEY` - SSH private key
- `PRODUCTION_HOST` - Your production server IP/domain
- `PRODUCTION_SSH_USER` - SSH username (usually `root`)
- `PRODUCTION_SSH_KEY` - SSH private key

### 2. Generate SSH Key on Server

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N ""
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_actions_deploy  # Copy this to GitHub Secrets
```

### 3. Ensure PM2 Ecosystem Configs Exist

**Staging** (`/var/www/staging/ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
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
  }],
};
```

**Production** (`/var/www/production/ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
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
  }],
};
```

### 4. Create Log Directory

```bash
mkdir -p /var/log/jewellery
chmod 755 /var/log/jewellery
```

### 5. Test the Deployment

1. Push to `staging` branch to test staging deployment
2. Check GitHub Actions tab for deployment status
3. Verify the application is running: `pm2 status`
4. Test the health endpoint: `curl https://staging.adorneluxejewels.com/api/health`

## 📋 Deployment Flow

### Staging (on push to `staging` branch)
1. GitHub Actions runner checks out code
2. Installs dependencies
3. Runs linter and tests
4. Builds the application
5. Connects to server via SSH
6. Pulls latest code from `staging` branch
7. Installs dependencies on server
8. Builds application on server
9. Runs Prisma migrations
10. Restarts PM2 process (`jewellery-staging`)
11. Performs health check

### Production (on push to `main` branch)
1. GitHub Actions runner checks out code
2. Installs dependencies
3. Runs linter and tests
4. Builds the application
5. Connects to server via SSH
6. Pulls latest code from `main` branch
7. Installs dependencies on server
8. Builds application on server
9. Runs Prisma migrations
10. Restarts PM2 process (`jewellery-production`)
11. Performs health check

## 🔍 Monitoring

### Check Application Status
```bash
pm2 status
pm2 logs jewellery-staging
pm2 logs jewellery-production
```

### View Logs
```bash
# PM2 logs
pm2 logs jewellery-staging --lines 100
pm2 logs jewellery-production --lines 100

# Application logs
tail -f /var/log/jewellery/staging.log
tail -f /var/log/jewellery/production.log
```

### Health Checks
```bash
curl https://staging.adorneluxejewels.com/api/health
curl https://adorneluxejewels.com/api/health
```

## 🛠️ Troubleshooting

### Deployment Fails
1. Check GitHub Actions logs
2. Verify SSH connection works: `ssh -i ~/.ssh/github_actions_deploy user@host`
3. Check server logs: `pm2 logs`
4. Verify Node.js version: `node --version` (should be 20+)

### Application Not Starting
1. Check PM2 status: `pm2 status`
2. View PM2 logs: `pm2 logs jewellery-staging`
3. Check environment variables: `cat /var/www/staging/.env`
4. Verify database connection

### Build Failures
1. Check Node.js version
2. Clear node_modules and reinstall: `rm -rf node_modules && npm ci`
3. Check for TypeScript errors: `npm run build`

## 📚 Additional Resources

- [CICD_SETUP.md](./CICD_SETUP.md) - Detailed setup guide
- [README.md](./README.md) - Project documentation
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)

---

**Setup Completed**: 2025-02-06
**Deployment Method**: Non-Docker (PM2 + Node.js)

