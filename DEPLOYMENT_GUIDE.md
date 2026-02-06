# Deployment Guide - Adorné Luxe Jewels

This guide provides step-by-step instructions for deploying the jewellery e-commerce application to a Hostinger VPS with both staging and production environments.

## Prerequisites

- Ubuntu 22.04 LTS VPS
- Root access to the server
- Domain names configured:
  - Production: `adorneluxejewels.com`
  - Staging: `staging.adorneluxejewels.com`
- DNS records pointing to your VPS IP address

## Table of Contents

1. [Initial Server Setup](#initial-server-setup)
2. [Install Required Software](#install-required-software)
3. [Set Up Staging Environment](#set-up-staging-environment)
4. [Set Up Production Environment](#set-up-production-environment)
5. [Configure Docker Services](#configure-docker-services)
6. [Configure Nginx](#configure-nginx)
7. [Set Up SSL Certificates](#set-up-ssl-certificates)
8. [Configure Environment Variables](#configure-environment-variables)
9. [Set Up Automated Backups](#set-up-automated-backups)
10. [Security Hardening](#security-hardening)
11. [Monitoring and Logging](#monitoring-and-logging)
12. [Deployment Scripts](#deployment-scripts)

---

## Initial Server Setup

### 1. Update System Packages

```bash
apt update && apt upgrade -y
```

### 2. Install Essential Tools

```bash
apt install -y curl wget git ufw fail2ban htop nano
```

### 3. Configure Firewall

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

---

## Install Required Software

### 1. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install -y docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

### 2. Install Nginx

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

### 3. Install Certbot (Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
```

---

## Set Up Staging Environment

### 1. Create Directory Structure

```bash
mkdir -p /var/www/staging
cd /var/www/staging
```

### 2. Clone Repository (Staging Branch)

```bash
git clone -b staging https://github.com/Michaelanand123singh/jewellery.git .
# If staging branch doesn't exist, use main branch
# git clone https://github.com/Michaelanand123singh/jewellery.git .
```

### 3. Create Docker Compose File for Staging

Create `/var/www/staging/docker-compose.staging.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: jewellery_postgres_staging
    restart: unless-stopped
    environment:
      POSTGRES_USER: jewellery_user_staging
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-jewellery_password_staging}
      POSTGRES_DB: jewellery_db_staging
      POSTGRES_INITDB_ARGS: "-E UTF8"
    ports:
      - "5433:5432"
    volumes:
      - postgres_data_staging:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U jewellery_user_staging -d jewellery_db_staging"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - jewellery_network_staging

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: jewellery_redis_staging
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD:-redis_password_staging} --appendonly yes
    ports:
      - "6380:6379"
    volumes:
      - redis_data_staging:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 10s
    networks:
      - jewellery_network_staging

  # MinIO Object Storage
  minio:
    image: minio/minio:latest
    container_name: jewellery_minio_staging
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin123}
    ports:
      - "9004:9000"  # API port
      - "9005:9001"  # Console port
    volumes:
      - minio_data_staging:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
      start_period: 40s
    networks:
      - jewellery_network_staging

  # MinIO Client (for initial bucket setup)
  minio-setup:
    image: minio/mc:latest
    container_name: jewellery_minio_setup_staging
    depends_on:
      minio:
        condition: service_healthy
    entrypoint: >
      /bin/sh -c "
      sleep 5 &&
      mc alias set myminio http://minio:9000 ${MINIO_ROOT_USER:-minioadmin} ${MINIO_ROOT_PASSWORD:-minioadmin123} &&
      mc mb myminio/products --ignore-existing &&
      mc anonymous set download myminio/products &&
      mc policy set public myminio/products &&
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
      - "3001:3000"
    env_file:
      - .env
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
    driver: local
  redis_data_staging:
    driver: local
  minio_data_staging:
    driver: local

networks:
  jewellery_network_staging:
    driver: bridge
```

---

## Set Up Production Environment

### 1. Create Directory Structure

```bash
mkdir -p /var/www/production
cd /var/www/production
```

### 2. Clone Repository (Main Branch)

```bash
git clone https://github.com/Michaelanand123singh/jewellery.git .
```

### 3. Production uses the default `docker-compose.yml` file

---

## Configure Docker Services

### 1. Start Infrastructure Services

For both environments, start PostgreSQL, Redis, and MinIO:

**Staging:**
```bash
cd /var/www/staging
docker compose -f docker-compose.staging.yml up -d postgres redis minio
docker compose -f docker-compose.staging.yml --profile setup run --rm minio-setup
```

**Production:**
```bash
cd /var/www/production
docker compose up -d postgres redis minio
docker compose --profile setup run --rm minio-setup
```

---

## Configure Nginx

### 1. Staging Nginx Configuration

Create `/etc/nginx/sites-available/staging.adorneluxejewels.com`:

```nginx
server {
    listen 80;
    server_name staging.adorneluxejewels.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name staging.adorneluxejewels.com;

    ssl_certificate /etc/letsencrypt/live/staging.adorneluxejewels.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.adorneluxejewels.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logging
    access_log /var/log/nginx/staging.access.log;
    error_log /var/log/nginx/staging.error.log;

    # Proxy to Next.js app
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # MinIO Console (optional, for admin access)
    location /minio-console {
        proxy_pass http://localhost:9005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Production Nginx Configuration

Create `/etc/nginx/sites-available/adorneluxejewels.com`:

```nginx
server {
    listen 80;
    server_name adorneluxejewels.com www.adorneluxejewels.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name adorneluxejewels.com www.adorneluxejewels.com;

    ssl_certificate /etc/letsencrypt/live/adorneluxejewels.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/adorneluxejewels.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logging
    access_log /var/log/nginx/production.access.log;
    error_log /var/log/nginx/production.error.log;

    # Proxy to Next.js app
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # MinIO Console (optional, for admin access)
    location /minio-console {
        proxy_pass http://localhost:9001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Enable Sites

```bash
ln -s /etc/nginx/sites-available/staging.adorneluxejewels.com /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/adorneluxejewels.com /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## Set Up SSL Certificates

### 1. Obtain Certificates

```bash
# Staging
certbot --nginx -d staging.adorneluxejewels.com --non-interactive --agree-tos --email admin@adorneluxejewels.com

# Production
certbot --nginx -d adorneluxejewels.com -d www.adorneluxejewels.com --non-interactive --agree-tos --email admin@adorneluxejewels.com
```

### 2. Auto-Renewal

```bash
# Test renewal
certbot renew --dry-run

# Certbot auto-renewal is already configured via systemd timer
systemctl status certbot.timer
```

---

## Configure Environment Variables

### 1. Staging Environment

Create `/var/www/staging/.env`:

```bash
# Database Configuration
DATABASE_URL="postgresql://jewellery_user_staging:CHANGE_THIS_PASSWORD@postgres:5432/jewellery_db_staging?schema=public"
DIRECT_URL="postgresql://jewellery_user_staging:CHANGE_THIS_PASSWORD@postgres:5432/jewellery_db_staging?schema=public"

# Redis Configuration
REDIS_URL="redis://:CHANGE_THIS_PASSWORD@redis:6379"
REDIS_HOST="redis"
REDIS_PORT="6379"
REDIS_PASSWORD="CHANGE_THIS_PASSWORD"

# MinIO Configuration
MINIO_ENDPOINT="minio"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="CHANGE_THIS"
MINIO_SECRET_KEY="CHANGE_THIS"
MINIO_BUCKET_NAME="products"
MINIO_PUBLIC_URL="https://staging.adorneluxejewels.com"

# Application Configuration
JWT_SECRET="CHANGE_THIS_TO_A_RANDOM_32_CHARACTER_STRING_MINIMUM"
NODE_ENV="production"
CSRF_SECRET="CHANGE_THIS_TO_A_RANDOM_32_CHARACTER_STRING"
NEXT_PUBLIC_APP_URL="https://staging.adorneluxejewels.com"

# Payment & Shipping (configure as needed)
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
RAZORPAY_WEBHOOK_SECRET=""
SHIPROCKET_EMAIL=""
SHIPROCKET_PASSWORD=""

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="https://staging.adorneluxejewels.com/api/auth/google/callback"
```

### 2. Production Environment

Create `/var/www/production/.env`:

```bash
# Database Configuration
DATABASE_URL="postgresql://jewellery_user:CHANGE_THIS_PASSWORD@postgres:5432/jewellery_db?schema=public"
DIRECT_URL="postgresql://jewellery_user:CHANGE_THIS_PASSWORD@postgres:5432/jewellery_db?schema=public"

# Redis Configuration
REDIS_URL="redis://:CHANGE_THIS_PASSWORD@redis:6379"
REDIS_HOST="redis"
REDIS_PORT="6379"
REDIS_PASSWORD="CHANGE_THIS_PASSWORD"

# MinIO Configuration
MINIO_ENDPOINT="minio"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="CHANGE_THIS"
MINIO_SECRET_KEY="CHANGE_THIS"
MINIO_BUCKET_NAME="products"
MINIO_PUBLIC_URL="https://adorneluxejewels.com"

# Application Configuration
JWT_SECRET="CHANGE_THIS_TO_A_RANDOM_32_CHARACTER_STRING_MINIMUM"
NODE_ENV="production"
CSRF_SECRET="CHANGE_THIS_TO_A_RANDOM_32_CHARACTER_STRING"
NEXT_PUBLIC_APP_URL="https://adorneluxejewels.com"

# Payment & Shipping (configure as needed)
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
RAZORPAY_WEBHOOK_SECRET=""
SHIPROCKET_EMAIL=""
SHIPROCKET_PASSWORD=""

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="https://adorneluxejewels.com/api/auth/google/callback"
```

**⚠️ IMPORTANT:** Generate strong passwords for all `CHANGE_THIS` placeholders!

---

## Set Up Automated Backups

### 1. Create Backup Script

Create `/root/backup-jewellery.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup staging database
docker exec jewellery_postgres_staging pg_dump -U jewellery_user_staging jewellery_db_staging | gzip > $BACKUP_DIR/staging_db_$DATE.sql.gz

# Backup production database
docker exec jewellery_postgres docker exec jewellery_postgres pg_dump -U jewellery_user jewellery_db | gzip > $BACKUP_DIR/production_db_$DATE.sql.gz

# Backup MinIO data (staging)
docker run --rm -v jewellery_minio_data_staging:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/staging_minio_$DATE.tar.gz -C /data .

# Backup MinIO data (production)
docker run --rm -v jewellery_minio_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/production_minio_$DATE.tar.gz -C /data .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### 2. Make Script Executable

```bash
chmod +x /root/backup-jewellery.sh
```

### 3. Set Up Cron Job

```bash
# Daily backup at 2 AM
echo "0 2 * * * /root/backup-jewellery.sh" | crontab -
```

---

## Security Hardening

### 1. Configure Fail2Ban

Create `/etc/fail2ban/jail.local`:

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/*error.log
```

Restart fail2ban:
```bash
systemctl restart fail2ban
```

### 2. Disable Root SSH Login (Optional but Recommended)

Edit `/etc/ssh/sshd_config`:
```
PermitRootLogin no
```

Then create a sudo user:
```bash
adduser deploy
usermod -aG sudo deploy
```

### 3. Set Up Log Rotation

Create `/etc/logrotate.d/jewellery`:

```
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

---

## Monitoring and Logging

### 1. View Application Logs

**Staging:**
```bash
docker logs -f jewellery_app_staging
```

**Production:**
```bash
docker logs -f jewellery_app
```

### 2. View Service Logs

```bash
# Database
docker logs jewellery_postgres

# Redis
docker logs jewellery_redis

# MinIO
docker logs jewellery_minio
```

### 3. Health Check Endpoint

The application includes a health check endpoint:
- Staging: `https://staging.adorneluxejewels.com/api/health`
- Production: `https://adorneluxejewels.com/api/health`

---

## Deployment Scripts

### 1. Staging Deployment Script

Create `/root/deploy-staging.sh`:

```bash
#!/bin/bash
set -e
cd /var/www/staging
git fetch origin
git reset --hard origin/staging || git reset --hard origin/main
docker compose -f docker-compose.staging.yml build --no-cache app
docker compose -f docker-compose.staging.yml up -d --no-deps app
docker compose -f docker-compose.staging.yml exec -T app npx prisma migrate deploy || true
echo "Staging deployment completed!"
```

### 2. Production Deployment Script

Create `/root/deploy-production.sh`:

```bash
#!/bin/bash
set -e
cd /var/www/production
git fetch origin
git reset --hard origin/main
docker compose build --no-cache app
docker compose up -d --no-deps app
docker compose exec -T app npx prisma migrate deploy || true
echo "Production deployment completed!"
```

### 3. Make Scripts Executable

```bash
chmod +x /root/deploy-staging.sh
chmod +x /root/deploy-production.sh
```

---

## Quick Start Commands

### Start Services

**Staging:**
```bash
cd /var/www/staging
docker compose -f docker-compose.staging.yml up -d
```

**Production:**
```bash
cd /var/www/production
docker compose up -d
```

### Stop Services

**Staging:**
```bash
cd /var/www/staging
docker compose -f docker-compose.staging.yml down
```

**Production:**
```bash
cd /var/www/production
docker compose down
```

### Restart Services

**Staging:**
```bash
cd /var/www/staging
docker compose -f docker-compose.staging.yml restart
```

**Production:**
```bash
cd /var/www/production
docker compose restart
```

---

## Troubleshooting

### Check Service Status

```bash
docker ps
docker compose ps
systemctl status nginx
```

### Check Logs

```bash
# Application logs
docker logs jewellery_app_staging
docker logs jewellery_app

# Nginx logs
tail -f /var/log/nginx/staging.error.log
tail -f /var/log/nginx/production.error.log
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
docker exec -it jewellery_postgres_staging psql -U jewellery_user_staging -d jewellery_db_staging

# Test Redis connection
docker exec -it jewellery_redis_staging redis-cli -a redis_password_staging ping
```

---

## Next Steps

1. Configure environment variables with real credentials
2. Set up payment gateway (Razorpay)
3. Configure shipping (Shiprocket)
4. Set up email service through admin panel
5. Configure Google OAuth (if needed)
6. Test both staging and production environments
7. Set up monitoring alerts (optional)

---

**Last Updated:** 2025-01-27
