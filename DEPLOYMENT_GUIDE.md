# Hostinger VPS Deployment Guide
## Complete Setup Instructions for Staging and Production Environments

**Domain**: `adorneluxejewels.com`  
**Staging Domain**: `staging.adorneluxejewels.com`  
**Production URL**: `https://adorneluxejewels.com`  
**GitHub Repository**: `https://github.com/Michaelanand123singh/jewellery`  
**Default Branch**: `main`

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Prerequisites](#prerequisites)
3. [Server Requirements](#server-requirements)
4. [Initial Server Setup](#initial-server-setup)
5. [Staging Environment Setup](#staging-environment-setup)
6. [Production Environment Setup](#production-environment-setup)
7. [Database Setup](#database-setup)
8. [Nginx Configuration](#nginx-configuration)
9. [SSL Certificate Setup](#ssl-certificate-setup)
10. [Environment Variables](#environment-variables)
11. [Service Management](#service-management)
12. [CI/CD with GitHub Actions](#cicd-with-github-actions)
13. [Monitoring & Logging](#monitoring--logging)
14. [Backup Strategy](#backup-strategy)
15. [Security Hardening](#security-hardening)
16. [Troubleshooting](#troubleshooting)
17. [Maintenance & Updates](#maintenance--updates)

---

## 🎯 System Overview

### Application Stack
- **Framework**: Next.js 16 (App Router) with standalone output
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Storage**: MinIO (Object Storage)
- **Runtime**: Node.js 20
- **Reverse Proxy**: Nginx
- **Process Manager**: PM2
- **Containerization**: Docker & Docker Compose

### Key Services
- **PostgreSQL**: Primary database
- **Redis**: Caching and session storage
- **MinIO**: Image and file storage
- **Next.js App**: Main application server
- **Nginx**: Reverse proxy and static file serving

---

## ✅ Prerequisites

### Required Accounts & Services
1. **Hostinger VPS** with root/SSH access
2. **Domain Name**: `adorneluxejewels.com` (configured)
3. **Razorpay Account** (for payments)
4. **Shiprocket Account** (for logistics)
5. **Google OAuth Credentials** (for Google login)
6. **SMTP Email Service** (Gmail, SendGrid, etc.)

### Domain Configuration
- **Production**: `https://adorneluxejewels.com`
- **Staging**: `https://staging.adorneluxejewels.com`
- **DNS Records**: Ensure A records point to your VPS IP address

**Important**: Before starting deployment, configure your DNS records:

1. **Get your VPS IP address** from Hostinger control panel
2. **Log in to your domain registrar** (where you purchased `adorneluxejewels.com`)
3. **Add/Update DNS A Records**:
   - **Type**: A, **Name**: `@` (root domain), **Value**: Your VPS IP
   - **Type**: A, **Name**: `www`, **Value**: Your VPS IP
   - **Type**: A, **Name**: `staging`, **Value**: Your VPS IP
4. **Wait for DNS propagation** (usually 1-24 hours)
5. **Verify**: `nslookup adorneluxejewels.com` should return your VPS IP

### Required Knowledge
- Basic Linux command line
- SSH access
- Git basics
- Docker basics

---

## 💻 Server Requirements

### Minimum Requirements (Staging)
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 40GB SSD
- **Bandwidth**: 1TB/month
- **OS**: Ubuntu 22.04 LTS

### Recommended Requirements (Production)
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 100GB+ SSD
- **Bandwidth**: 2TB+/month
- **OS**: Ubuntu 22.04 LTS

---

## 🚀 Initial Server Setup

### 1. Connect to Your VPS

```bash
ssh root@your-server-ip
```

### 2. Update System Packages

```bash
# Update package list
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git build-essential software-properties-common
```

### 3. Set Up SSH Key Authentication (Recommended)

```bash
# On your local machine, generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy public key to server
ssh-copy-id root@your-server-ip
```

### 4. Configure Firewall

```bash
# Install UFW (Uncomplicated Firewall)
apt install -y ufw

# Allow SSH
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

### 5. Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version
```

### 6. Install Node.js (for PM2 and direct deployment option)

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 7. Install PM2 (Process Manager)

```bash
npm install -g pm2
```

### 8. Install Nginx

```bash
apt install -y nginx

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx
```

---

## 🧪 Staging Environment Setup

### Directory Structure

```bash
# Create staging directory
mkdir -p /var/www/staging
cd /var/www/staging
```

### Clone Repository

```bash
# Clone your repository
git clone https://github.com/Michaelanand123singh/jewellery.git .

# Create and switch to staging branch
git checkout -b staging

# Push staging branch to GitHub
git push -u origin staging

# Or if staging branch already exists on GitHub
git fetch origin
git checkout staging
```

### Set Up Environment File

```bash
# Copy example env file
cp env.example .env.staging

# Edit environment file
nano .env.staging
```

**Staging `.env.staging` Configuration:**

```env
# Database Configuration
DATABASE_URL="postgresql://jewellery_user:staging_password_here@postgres:5432/jewellery_db_staging?schema=public"
DIRECT_URL="postgresql://jewellery_user:staging_password_here@postgres:5432/jewellery_db_staging?schema=public"

# Redis Configuration
REDIS_URL="redis://:staging_redis_password@redis:6379"
REDIS_HOST="redis"
REDIS_PORT="6379"
REDIS_PASSWORD="staging_redis_password"

# MinIO Configuration
MINIO_ENDPOINT="minio"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="staging_minio_key"
MINIO_SECRET_KEY="staging_minio_secret"
MINIO_BUCKET_NAME="products-staging"
MINIO_PUBLIC_URL="http://staging.adorneluxejewels.com:9000"

# Application Configuration
JWT_SECRET="staging-jwt-secret-minimum-32-characters-long-change-this"
NODE_ENV="production"
CSRF_SECRET="staging-csrf-secret-minimum-32-characters-long"
ENABLE_STRICT_CSRF="true"
NEXT_PUBLIC_APP_URL="https://staging.adorneluxejewels.com"

# Razorpay Configuration (Use Test Mode)
RAZORPAY_KEY_ID="your-razorpay-test-key-id"
RAZORPAY_KEY_SECRET="your-razorpay-test-key-secret"
RAZORPAY_WEBHOOK_SECRET="your-razorpay-test-webhook-secret"

# Shiprocket Configuration (Use Test Account)
SHIPROCKET_EMAIL="staging@yourdomain.com"
SHIPROCKET_PASSWORD="staging_password"
SHIPROCKET_BASE_URL="https://apiv2.shiprocket.in/v1/external"

# Shiprocket Pickup Address
SHIPROCKET_PICKUP_NAME="Nextin Jewellery Staging"
SHIPROCKET_PICKUP_PHONE="+91XXXXXXXXXX"
SHIPROCKET_PICKUP_EMAIL="staging@yourdomain.com"
SHIPROCKET_PICKUP_ADDRESS="Staging Warehouse Address"
SHIPROCKET_PICKUP_ADDRESS_LINE2="Floor, Building"
SHIPROCKET_PICKUP_CITY="Mumbai"
SHIPROCKET_PICKUP_STATE="Maharashtra"
SHIPROCKET_PICKUP_COUNTRY="India"
SHIPROCKET_PICKUP_PINCODE="400001"

# Google OAuth (Use Test Credentials)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="https://staging.adorneluxejewels.com/api/auth/google/callback"
```

### Create Docker Compose for Staging

```bash
# Create staging docker-compose file
nano docker-compose.staging.yml
```

**`docker-compose.staging.yml`:**

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: jewellery_postgres_staging
    restart: unless-stopped
    environment:
      POSTGRES_USER: jewellery_user
      POSTGRES_PASSWORD: staging_password_here
      POSTGRES_DB: jewellery_db_staging
      POSTGRES_INITDB_ARGS: "-E UTF8"
    ports:
      - "5433:5432"  # Different port to avoid conflicts
    volumes:
      - postgres_data_staging:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U jewellery_user -d jewellery_db_staging"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - jewellery_network_staging

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: jewellery_redis_staging
    restart: unless-stopped
    command: redis-server --requirepass staging_redis_password --appendonly yes
    ports:
      - "6380:6379"  # Different port
    volumes:
      - redis_data_staging:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - jewellery_network_staging

  # MinIO Object Storage
  minio:
    image: minio/minio:latest
    container_name: jewellery_minio_staging
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: staging_minio_key
      MINIO_ROOT_PASSWORD: staging_minio_secret
    ports:
      - "9002:9000"  # API port
      - "9003:9001"  # Console port
    volumes:
      - minio_data_staging:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
    networks:
      - jewellery_network_staging

  # MinIO Setup
  minio-setup:
    image: minio/mc:latest
    container_name: jewellery_minio_setup_staging
    depends_on:
      minio:
        condition: service_healthy
    entrypoint: >
      /bin/sh -c "
      sleep 5 &&
      mc alias set myminio http://minio:9000 staging_minio_key staging_minio_secret &&
      mc mb myminio/products-staging --ignore-existing &&
      mc anonymous set download myminio/products-staging &&
      mc policy set public myminio/products-staging &&
      echo 'MinIO setup completed successfully'
      "
    networks:
      - jewellery_network_staging
    profiles:
      - setup

  # Next.js Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: jewellery_app_staging
    restart: unless-stopped
    ports:
      - "3001:3000"  # Different port
    env_file:
      - .env.staging
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio:
        condition: service_healthy
    volumes:
      - ./public:/app/public:ro
    command: >
      sh -c "
        prisma generate &&
        prisma migrate deploy &&
        node server.js
      "
    networks:
      - jewellery_network_staging

volumes:
  postgres_data_staging:
  redis_data_staging:
  minio_data_staging:

networks:
  jewellery_network_staging:
    driver: bridge
```

### Deploy Staging

```bash
# Build and start services
docker-compose -f docker-compose.staging.yml --profile setup up -d --build

# Check logs
docker-compose -f docker-compose.staging.yml logs -f

# Check status
docker-compose -f docker-compose.staging.yml ps
```

---

## 🏭 Production Environment Setup

### Directory Structure

```bash
# Create production directory
mkdir -p /var/www/production
cd /var/www/production
```

### Clone Repository

```bash
# Clone your repository
git clone https://github.com/Michaelanand123singh/jewellery.git .

# Checkout production branch (main is the default branch)
git checkout main
```

### Set Up Environment File

```bash
# Copy example env file
cp env.example .env.production

# Edit environment file (use strong passwords!)
nano .env.production
```

**Production `.env.production` Configuration:**

```env
# Database Configuration (USE STRONG PASSWORDS!)
DATABASE_URL="postgresql://jewellery_user:STRONG_PASSWORD_HERE@postgres:5432/jewellery_db?schema=public"
DIRECT_URL="postgresql://jewellery_user:STRONG_PASSWORD_HERE@postgres:5432/jewellery_db?schema=public"

# Redis Configuration
REDIS_URL="redis://:STRONG_REDIS_PASSWORD@redis:6379"
REDIS_HOST="redis"
REDIS_PORT="6379"
REDIS_PASSWORD="STRONG_REDIS_PASSWORD"

# MinIO Configuration
MINIO_ENDPOINT="minio"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="STRONG_MINIO_KEY"
MINIO_SECRET_KEY="STRONG_MINIO_SECRET"
MINIO_BUCKET_NAME="products"
MINIO_PUBLIC_URL="https://adorneluxejewels.com:9000"

# Application Configuration
JWT_SECRET="PRODUCTION-JWT-SECRET-MINIMUM-32-CHARACTERS-LONG-GENERATE-RANDOM"
NODE_ENV="production"
CSRF_SECRET="PRODUCTION-CSRF-SECRET-MINIMUM-32-CHARACTERS-LONG-GENERATE-RANDOM"
ENABLE_STRICT_CSRF="true"
NEXT_PUBLIC_APP_URL="https://adorneluxejewels.com"

# Razorpay Configuration (Production Keys)
RAZORPAY_KEY_ID="your-razorpay-production-key-id"
RAZORPAY_KEY_SECRET="your-razorpay-production-key-secret"
RAZORPAY_WEBHOOK_SECRET="your-razorpay-production-webhook-secret"

# Shiprocket Configuration
SHIPROCKET_EMAIL="your-shiprocket-email"
SHIPROCKET_PASSWORD="your-shiprocket-password"
SHIPROCKET_BASE_URL="https://apiv2.shiprocket.in/v1/external"

# Shiprocket Pickup Address
SHIPROCKET_PICKUP_NAME="Nextin Jewellery"
SHIPROCKET_PICKUP_PHONE="+91XXXXXXXXXX"
SHIPROCKET_PICKUP_EMAIL="pickup@yourdomain.com"
SHIPROCKET_PICKUP_ADDRESS="Your Warehouse Address"
SHIPROCKET_PICKUP_ADDRESS_LINE2="Floor, Building"
SHIPROCKET_PICKUP_CITY="Mumbai"
SHIPROCKET_PICKUP_STATE="Maharashtra"
SHIPROCKET_PICKUP_COUNTRY="India"
SHIPROCKET_PICKUP_PINCODE="400001"

# Google OAuth (Production Credentials)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="https://adorneluxejewels.com/api/auth/google/callback"
```

### Generate Strong Secrets

```bash
# Generate JWT Secret
openssl rand -base64 32

# Generate CSRF Secret
openssl rand -base64 32

# Generate Database Password
openssl rand -base64 24

# Generate Redis Password
openssl rand -base64 24
```

### Use Production Docker Compose

The existing `docker-compose.yml` can be used for production. Update it with production values:

```bash
# Edit docker-compose.yml
nano docker-compose.yml
```

Update passwords and ensure production settings.

### Deploy Production

```bash
# Build and start services
docker-compose --profile setup up -d --build

# Check logs
docker-compose logs -f

# Check status
docker-compose ps
```

---

## 🗄️ Database Setup

### Initialize Database

```bash
# For staging
cd /var/www/staging
docker-compose -f docker-compose.staging.yml exec app npx prisma migrate deploy

# For production
cd /var/www/production
docker-compose exec app npx prisma migrate deploy
```

### Seed Database (Staging Only)

```bash
# Only for staging - never seed production!
cd /var/www/staging
docker-compose -f docker-compose.staging.yml exec app npm run db:seed
```

### Create Admin User (Manual)

```bash
# Connect to database
docker-compose exec postgres psql -U jewellery_user -d jewellery_db

# Or for staging
docker-compose -f docker-compose.staging.yml exec postgres psql -U jewellery_user -d jewellery_db_staging

# Create admin user (use bcrypt hash for password)
# Password: YourAdminPassword123
# Hash can be generated using: node -e "console.log(require('bcryptjs').hashSync('YourAdminPassword123', 10))"
```

---

## 🌐 Nginx Configuration

### Staging Nginx Configuration

```bash
nano /etc/nginx/sites-available/staging.adorneluxejewels.com
```

**Staging Config:**

```nginx
# Staging Server Configuration
server {
    listen 80;
    server_name staging.adorneluxejewels.com;

    # Redirect HTTP to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    # For initial setup, allow HTTP
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # MinIO Proxy (if needed)
    location /minio/ {
        proxy_pass http://localhost:9002/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Production Nginx Configuration

```bash
nano /etc/nginx/sites-available/adorneluxejewels.com
```

**Production Config:**

```nginx
# Production Server Configuration
server {
    listen 80;
    server_name adorneluxejewels.com www.adorneluxejewels.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name adorneluxejewels.com www.adorneluxejewels.com;

    # SSL Configuration (will be set up with Certbot)
    ssl_certificate /etc/letsencrypt/live/adorneluxejewels.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/adorneluxejewels.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Proxy to Next.js App
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static Files (served directly by Nginx)
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # MinIO Proxy (if needed)
    location /minio/ {
        proxy_pass http://localhost:9000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Enable Sites

```bash
# Create symlinks
ln -s /etc/nginx/sites-available/staging.adorneluxejewels.com /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/adorneluxejewels.com /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## 🔒 SSL Certificate Setup

### Install Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### Get SSL Certificate for Production

```bash
# For production domain
certbot --nginx -d adorneluxejewels.com -d www.adorneluxejewels.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

### Get SSL Certificate for Staging

```bash
# For staging domain
certbot --nginx -d staging.adorneluxejewels.com

# Follow prompts
```

### Auto-Renewal Setup

Certbot automatically sets up renewal. Test it:

```bash
# Test renewal
certbot renew --dry-run
```

---

## 🔐 Environment Variables

### Critical Environment Variables

All environment variables are loaded from `.env.production` or `.env.staging` files.

**Required Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Minimum 32 characters
- `NEXT_PUBLIC_APP_URL` - Your domain URL
- `CSRF_SECRET` - Minimum 32 characters

**Optional but Recommended:**
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` - For payments
- `SHIPROCKET_EMAIL` & `SHIPROCKET_PASSWORD` - For shipping
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - For Google login

**Email Configuration:**
Email settings are configured through the admin panel (Settings → Email), not environment variables.

---

## ⚙️ Service Management

### Docker Compose Commands

**Staging:**
```bash
cd /var/www/staging

# Start services
docker-compose -f docker-compose.staging.yml up -d

# Stop services
docker-compose -f docker-compose.staging.yml down

# View logs
docker-compose -f docker-compose.staging.yml logs -f app

# Restart services
docker-compose -f docker-compose.staging.yml restart

# Update and rebuild
git pull
docker-compose -f docker-compose.staging.yml up -d --build
```

**Production:**
```bash
cd /var/www/production

# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f app

# Restart services
docker-compose restart

# Update and rebuild (with zero-downtime)
git pull
docker-compose up -d --build --no-deps app
```

---

## 🚀 CI/CD with GitHub Actions

### Overview

GitHub Actions will automatically deploy your application to staging and production environments when code is pushed to specific branches.

**Deployment Flow:**
- **Staging**: Automatically deploys when code is pushed to `staging` branch
- **Production**: Automatically deploys when code is pushed to `main` branch

### Step 1: Generate SSH Key for GitHub Actions

On your VPS server:

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N ""

# Display public key (add to authorized_keys)
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys

# Display private key (copy this - you'll add it to GitHub Secrets)
cat ~/.ssh/github_actions_deploy
```

**Important**: Copy the private key output - you'll need it for GitHub Secrets.

### Step 2: Configure GitHub Secrets

1. Go to your GitHub repository: `https://github.com/Michaelanand123singh/jewellery`
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add the following:

**Required Secrets:**

| Secret Name | Description | Example |
|------------|-------------|---------|
| `STAGING_HOST` | Staging server IP or domain | `staging.adorneluxejewels.com` or `123.456.789.0` |
| `STAGING_SSH_KEY` | Private SSH key for staging | (paste private key from Step 1) |
| `STAGING_SSH_USER` | SSH username | `root` |
| `PRODUCTION_HOST` | Production server IP or domain | `adorneluxejewels.com` or `123.456.789.0` |
| `PRODUCTION_SSH_KEY` | Private SSH key for production | (paste private key from Step 1) |
| `PRODUCTION_SSH_USER` | SSH username | `root` |
| `STAGING_SSH_PORT` | SSH port (optional, default 22) | `22` |
| `PRODUCTION_SSH_PORT` | SSH port (optional, default 22) | `22` |

### Step 3: Create Deployment Scripts on Server

Create deployment scripts that GitHub Actions will execute:

**Staging Deployment Script:**

```bash
# Create staging deployment script
nano /root/deploy-staging.sh
```

Add this content:

```bash
#!/bin/bash
set -e

echo "🚀 Starting staging deployment..."

cd /var/www/staging

# Pull latest code
echo "📥 Pulling latest code..."
git fetch origin
git reset --hard origin/staging

# Backup current deployment
echo "💾 Creating backup..."
if [ -d ".next" ]; then
    cp -r .next .next.backup.$(date +%Y%m%d_%H%M%S) || true
fi

# Rebuild and restart services
echo "🔨 Rebuilding Docker containers..."
docker-compose -f docker-compose.staging.yml down
docker-compose -f docker-compose.staging.yml build --no-cache app
docker-compose -f docker-compose.staging.yml up -d

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.staging.yml exec -T app npx prisma migrate deploy || true

# Health check
echo "🏥 Performing health check..."
sleep 10
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Staging deployment successful!"
    # Remove old backup
    rm -rf .next.backup.* 2>/dev/null || true
else
    echo "❌ Health check failed! Rolling back..."
    # Rollback logic can be added here
    exit 1
fi

echo "✨ Staging deployment completed!"
```

```bash
# Make executable
chmod +x /root/deploy-staging.sh
```

**Production Deployment Script:**

```bash
# Create production deployment script
nano /root/deploy-production.sh
```

Add this content:

```bash
#!/bin/bash
set -e

echo "🚀 Starting production deployment..."

cd /var/www/production

# Pull latest code
echo "📥 Pulling latest code..."
git fetch origin
git reset --hard origin/main

# Backup current deployment
echo "💾 Creating backup..."
if [ -d ".next" ]; then
    cp -r .next .next.backup.$(date +%Y%m%d_%H%M%S) || true
fi

# Rebuild and restart services (zero-downtime)
echo "🔨 Rebuilding Docker containers..."
docker-compose build --no-cache app
docker-compose up -d --no-deps app

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose exec -T app npx prisma migrate deploy || true

# Health check
echo "🏥 Performing health check..."
sleep 10
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Production deployment successful!"
    # Remove old backup
    rm -rf .next.backup.* 2>/dev/null || true
else
    echo "❌ Health check failed! Rolling back..."
    # Rollback logic can be added here
    exit 1
fi

echo "✨ Production deployment completed!"
```

```bash
# Make executable
chmod +x /root/deploy-production.sh
```

### Step 4: GitHub Actions Workflows

The workflow files are already in the repository:
- `.github/workflows/deploy-staging.yml` - Staging deployment
- `.github/workflows/deploy-production.yml` - Production deployment

These workflows will automatically:
1. Checkout code
2. Set up SSH connection
3. Execute deployment scripts on server
4. Report deployment status

### Step 5: Test CI/CD Pipeline

**Test Staging Deployment:**

```bash
# On your local machine
git checkout staging
# Make a small change
echo "# Test" >> README.md
git add .
git commit -m "Test staging deployment"
git push origin staging
```

Check GitHub Actions tab to see the deployment progress.

**Test Production Deployment:**

```bash
# On your local machine
git checkout main
# Merge staging to main (after testing)
git merge staging
git push origin main
```

### CI/CD Workflow Summary

**Staging Flow:**
1. Developer pushes to `staging` branch
2. GitHub Actions triggers
3. Code is checked out
4. SSH connection established to staging server
5. Deployment script runs:
   - Pulls latest code
   - Rebuilds Docker containers
   - Runs database migrations
   - Performs health check
6. Deployment status reported

**Production Flow:**
1. Code merged to `main` branch
2. GitHub Actions triggers (with environment protection)
3. Code is checked out
4. SSH connection established to production server
5. Deployment script runs:
   - Pulls latest code
   - Rebuilds Docker containers (zero-downtime)
   - Runs database migrations
   - Performs health check
6. Deployment status reported

---

## 📊 Monitoring & Logging

### Docker Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
docker-compose logs -f postgres

# View last 100 lines
docker-compose logs --tail=100 app
```

### Application Logs

Application logs are written to stdout/stderr and captured by Docker.

### System Monitoring

```bash
# Install monitoring tools
apt install -y htop iotop

# Check system resources
htop

# Check disk usage
df -h

# Check Docker resource usage
docker stats
```

### Set Up Log Rotation

```bash
nano /etc/logrotate.d/docker-containers
```

Add:
```
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
```

---

## 💾 Backup Strategy

### Database Backup Script

```bash
# Create backup directory
mkdir -p /root/backups

# Create backup script
nano /root/backup-database.sh
```

**Backup Script:**

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="jewellery_db"
DB_USER="jewellery_user"
CONTAINER_NAME="jewellery_postgres"

# Create backup
docker exec $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME > "$BACKUP_DIR/db_backup_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/db_backup_$DATE.sql"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
```

```bash
# Make executable
chmod +x /root/backup-database.sh

# Test backup
/root/backup-database.sh
```

### Automated Daily Backups

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /root/backup-database.sh >> /root/backup.log 2>&1
```

### MinIO Backup

```bash
# Create MinIO backup script
nano /root/backup-minio.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="jewellery_minio"

# Backup MinIO data
docker exec $CONTAINER_NAME mc mirror /data "$BACKUP_DIR/minio_backup_$DATE"

# Compress
tar -czf "$BACKUP_DIR/minio_backup_$DATE.tar.gz" "$BACKUP_DIR/minio_backup_$DATE"
rm -rf "$BACKUP_DIR/minio_backup_$DATE"

# Keep only last 7 days
find $BACKUP_DIR -name "minio_backup_*.tar.gz" -mtime +7 -delete

echo "MinIO backup completed: minio_backup_$DATE.tar.gz"
```

---

## 🔐 Security Hardening

### 1. Firewall Configuration

```bash
# Review and tighten firewall rules
ufw status verbose

# Only allow necessary ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
```

### 2. SSH Hardening

```bash
# Edit SSH config
nano /etc/ssh/sshd_config

# Recommended settings:
# PermitRootLogin yes (since we're using root)
# PasswordAuthentication no (if using keys - recommended)
# Port 22 (or change to custom port like 2222)

# Restart SSH
systemctl restart sshd
```

### 3. Fail2Ban Setup

```bash
# Install Fail2Ban
apt install -y fail2ban

# Configure
systemctl enable fail2ban
systemctl start fail2ban
```

### 4. Regular Security Updates

```bash
# Set up automatic security updates
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

### 5. Database Security

- Use strong passwords
- Don't expose database port to public
- Use connection pooling
- Regular backups

### 6. Application Security

- Keep dependencies updated: `npm audit fix`
- Use environment variables for secrets
- Enable CSRF protection
- Use HTTPS only in production
- Regular security audits

---

## 🐛 Troubleshooting

### Application Not Starting

```bash
# Check Docker logs
docker-compose logs app

# Check if containers are running
docker-compose ps

# Check database connection
docker-compose exec app npx prisma db pull
```

### Database Connection Issues

```bash
# Check if database is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U jewellery_user -d jewellery_db
```

### Nginx 502 Bad Gateway

```bash
# Check if app is running
docker-compose ps app

# Check app logs
docker-compose logs app

# Check Nginx error logs
tail -f /var/log/nginx/error.log
```

### SSL Certificate Issues

```bash
# Check certificate status
certbot certificates

# Renew certificate manually
certbot renew

# Check Nginx SSL configuration
nginx -t
```

### Out of Memory

```bash
# Check memory usage
free -h

# Check Docker memory limits
docker stats

# Increase swap if needed
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

---

## 🔄 Maintenance & Updates

### Application Updates

```bash
# Staging
cd /var/www/staging
git pull origin staging
docker-compose -f docker-compose.staging.yml up -d --build

# Production (with zero-downtime)
cd /var/www/production
git pull origin main
docker-compose up -d --build --no-deps app
```

### Database Migrations

```bash
# Run migrations
docker-compose exec app npx prisma migrate deploy

# Check migration status
docker-compose exec app npx prisma migrate status
```

### Dependency Updates

```bash
# Check for outdated packages
npm outdated

# Update packages (test in staging first!)
npm update

# Rebuild
docker-compose up -d --build
```

### System Updates

```bash
# Update system packages
apt update && apt upgrade -y

# Reboot if kernel updated
reboot
```

---

## 📝 Quick Reference Commands

### Staging

```bash
cd /var/www/staging

# Start
docker-compose -f docker-compose.staging.yml up -d

# Stop
docker-compose -f docker-compose.staging.yml down

# Logs
docker-compose -f docker-compose.staging.yml logs -f

# Restart
docker-compose -f docker-compose.staging.yml restart

# Update
git pull && docker-compose -f docker-compose.staging.yml up -d --build
```

### Production

```bash
cd /var/www/production

# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f

# Restart
docker-compose restart

# Update
git pull && docker-compose up -d --build --no-deps app
```

---

## ✅ Deployment Checklist

### Pre-Deployment

- [ ] Server provisioned and accessible
- [ ] Domain DNS configured
- [ ] Firewall configured
- [ ] Docker and Docker Compose installed
- [ ] Nginx installed and configured
- [ ] SSL certificates obtained
- [ ] Environment variables configured
- [ ] Strong passwords generated
- [ ] Database credentials secured

### Staging Deployment

- [ ] Repository cloned
- [ ] Staging branch checked out
- [ ] Environment file created
- [ ] Docker Compose file configured
- [ ] Services started
- [ ] Database migrations run
- [ ] Database seeded (if needed)
- [ ] Nginx configured
- [ ] SSL certificate installed
- [ ] Application accessible
- [ ] Email service configured
- [ ] Payment gateway configured (test mode)
- [ ] Shipping service configured (test mode)
- [ ] GitHub Actions configured
- [ ] Deployment scripts created

### Production Deployment

- [ ] Repository cloned
- [ ] Production branch checked out
- [ ] Environment file created with strong secrets
- [ ] Docker Compose file configured
- [ ] Services started
- [ ] Database migrations run
- [ ] Admin user created
- [ ] Nginx configured
- [ ] SSL certificate installed
- [ ] Application accessible
- [ ] Email service configured
- [ ] Payment gateway configured (production)
- [ ] Shipping service configured (production)
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Security hardening completed
- [ ] GitHub Actions configured
- [ ] Deployment scripts created

---

## 🆘 Support & Resources

### Useful Commands

```bash
# Check system resources
htop
df -h
free -h

# Check Docker
docker ps
docker stats
docker-compose ps

# Check Nginx
nginx -t
systemctl status nginx

# Check logs
journalctl -u nginx -f
docker-compose logs -f
```

### Important Files

- Environment: `/var/www/production/.env.production`
- Docker Compose: `/var/www/production/docker-compose.yml`
- Nginx Config: `/etc/nginx/sites-available/adorneluxejewels.com`
- SSL Certs: `/etc/letsencrypt/live/adorneluxejewels.com/`
- Backups: `/root/backups/`
- Deployment Scripts: `/root/deploy-staging.sh`, `/root/deploy-production.sh`

---

## 📞 Next Steps

1. **Complete Initial Setup** - Follow sections 1-5
2. **Deploy Staging** - Test everything in staging first
3. **Configure Services** - Set up email, payments, shipping
4. **Set Up CI/CD** - Configure GitHub Actions
5. **Deploy Production** - Only after staging is verified
6. **Set Up Monitoring** - Monitor logs and performance
7. **Configure Backups** - Ensure data safety
8. **Security Audit** - Review all security settings

---

**Last Updated**: 2026-02-06  
**Version**: 2.0

