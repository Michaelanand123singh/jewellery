#!/bin/bash
# Deployment script for production environment
# This script is executed on the server via SSH from GitHub Actions

set -e

ENV="production"
APP_DIR="/var/www/production"
APP_NAME="jewellery-production"
PORT=3000

echo "🚀 Starting deployment for $ENV environment..."

cd "$APP_DIR"

# Pull latest changes
echo "📥 Pulling latest changes..."
git fetch origin main
git reset --hard origin/main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Build application
echo "🔨 Building application..."
npm run build

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy || {
    echo "⚠️ Migration failed, but continuing deployment..."
}

# Restart application with PM2
echo "🔄 Restarting application..."
if pm2 list | grep -q "$APP_NAME"; then
    pm2 restart "$APP_NAME"
else
    pm2 start ecosystem.config.js
fi

# Wait for app to start
echo "⏳ Waiting for application to start..."
sleep 5

# Check application status
pm2 status "$APP_NAME"

echo "✅ Deployment completed successfully!"
echo "🌐 Application should be available at: https://adorneluxejewels.com"

