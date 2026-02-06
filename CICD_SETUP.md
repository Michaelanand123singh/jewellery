# CI/CD Setup Guide - GitHub Actions

This guide explains how to set up continuous integration and deployment (CI/CD) for the Adorné Luxe Jewels application using GitHub Actions.

## Overview

The CI/CD pipeline includes:

1. **CI Pipeline** (`ci.yml`): Runs on pull requests and pushes to validate code quality
2. **Staging Deployment** (`deploy-staging.yml`): Automatically deploys to staging when code is pushed to `staging` branch
3. **Production Deployment** (`deploy-production.yml`): Automatically deploys to production when code is pushed to `main` branch

## Prerequisites

- GitHub repository with Actions enabled
- VPS server with SSH access
- Node.js 20+ installed on the server
- PM2 installed on the server
- Git repository cloned on the server at `/var/www/staging` and `/var/www/production`

## Step 1: Generate SSH Key for GitHub Actions

On your VPS server, generate a dedicated SSH key for GitHub Actions:

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N ""

# Add public key to authorized_keys
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys

# Set proper permissions
chmod 600 ~/.ssh/github_actions_deploy
chmod 644 ~/.ssh/authorized_keys

# Display the private key (copy this for GitHub Secrets)
cat ~/.ssh/github_actions_deploy
```

## Step 2: Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add the following secrets:

### Staging Environment Secrets

- **`STAGING_HOST`**: Your staging server IP address or domain (e.g., `123.45.67.89` or `staging.adorneluxejewels.com`)
- **`STAGING_SSH_USER`**: SSH username (usually `root`)
- **`STAGING_SSH_KEY`**: The private SSH key content (from Step 1)

### Production Environment Secrets

- **`PRODUCTION_HOST`**: Your production server IP address or domain (e.g., `123.45.67.89` or `adorneluxejewels.com`)
- **`PRODUCTION_SSH_USER`**: SSH username (usually `root`)
- **`PRODUCTION_SSH_KEY`**: The private SSH key content (from Step 1)

**Note**: You can use the same SSH key for both environments if they're on the same server.

## Step 3: Set Up Server Directories

Ensure your server has the following structure:

```bash
/var/www/staging/     # Staging environment
/var/www/production/  # Production environment
```

Each directory should:
- Be a git repository (cloned from your GitHub repo)
- Have a `.env` file with proper environment variables
- Have an `ecosystem.config.js` file for PM2

## Step 4: Configure PM2 on Server

### For Staging

Create `/var/www/staging/ecosystem.config.js`:

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

### For Production

Create `/var/www/production/ecosystem.config.js`:

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

### Start PM2 Applications

```bash
# Start staging
cd /var/www/staging
pm2 start ecosystem.config.js
pm2 save

# Start production
cd /var/www/production
pm2 start ecosystem.config.js
pm2 save

# Enable PM2 to start on system boot
pm2 startup
```

## Step 5: Create Log Directory

```bash
mkdir -p /var/log/jewellery
chmod 755 /var/log/jewellery
```

## Step 6: Configure Git on Server

Ensure git is configured in both directories:

```bash
# For staging
cd /var/www/staging
git remote set-url origin https://github.com/Michaelanand123singh/jewellery.git
git checkout staging

# For production
cd /var/www/production
git remote set-url origin https://github.com/Michaelanand123singh/jewellery.git
git checkout main
```

## Step 7: Test the Deployment

### Test Staging Deployment

1. Push to `staging` branch:
   ```bash
   git checkout staging
   git push origin staging
   ```

2. Check GitHub Actions tab to see the deployment progress

3. Verify deployment:
   ```bash
   ssh your-server
   pm2 status
   curl https://staging.adorneluxejewels.com/api/health
   ```

### Test Production Deployment

1. Push to `main` branch:
   ```bash
   git checkout main
   git push origin main
   ```

2. Check GitHub Actions tab to see the deployment progress

3. Verify deployment:
   ```bash
   ssh your-server
   pm2 status
   curl https://adorneluxejewels.com/api/health
   ```

## Deployment Process

When code is pushed:

1. **GitHub Actions triggers** the appropriate workflow
2. **Code is checked out** in the GitHub Actions runner
3. **Dependencies are installed** and **tests are run**
4. **Application is built** for production
5. **SSH connection is established** to the server
6. **Code is pulled** from the repository
7. **Dependencies are installed** on the server
8. **Application is built** on the server
9. **Database migrations** are run
10. **PM2 restarts** the application
11. **Health check** is performed

## Manual Deployment

If you need to deploy manually, you can use the deployment scripts:

```bash
# Staging
cd /var/www/staging
bash scripts/deploy-staging.sh

# Production
cd /var/www/production
bash scripts/deploy-production.sh
```

Or use the GitHub Actions workflow_dispatch feature to trigger deployments manually from the GitHub UI.

## Troubleshooting

### SSH Connection Issues

- Verify SSH key is correctly added to GitHub Secrets
- Test SSH connection manually: `ssh -i ~/.ssh/github_actions_deploy user@host`
- Check server firewall allows SSH connections

### PM2 Issues

- Check PM2 logs: `pm2 logs jewellery-staging` or `pm2 logs jewellery-production`
- Verify PM2 is running: `pm2 status`
- Restart PM2: `pm2 restart jewellery-staging`

### Build Failures

- Check Node.js version on server: `node --version` (should be 20+)
- Verify all dependencies are installed: `npm ci`
- Check build logs in GitHub Actions

### Database Migration Issues

- Verify database connection in `.env` file
- Check Prisma schema is up to date
- Run migrations manually: `npx prisma migrate deploy`

## Security Best Practices

1. **Never commit** `.env` files or SSH keys to the repository
2. **Use strong passwords** for database and other services
3. **Rotate SSH keys** periodically
4. **Monitor** GitHub Actions logs for any suspicious activity
5. **Use environment protection rules** for production deployments (requires approval)

## Environment Protection Rules (Optional)

For production, you can set up environment protection rules:

1. Go to **Settings** → **Environments** → **New environment**
2. Name it `production`
3. Add required reviewers
4. Add deployment branches (only `main`)

This will require manual approval before production deployments.

---

**Last Updated**: 2025-02-06

