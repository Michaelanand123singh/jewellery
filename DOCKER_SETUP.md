# Docker Setup Guide - PostgreSQL, Redis, and MinIO

## Overview

This guide explains how to set up and use PostgreSQL, Redis, and MinIO using Docker for the Jewellery E-commerce application.

## Prerequisites

- Docker and Docker Compose installed and running
- At least 4GB of available RAM
- At least 10GB of available disk space

## Services Included

1. **PostgreSQL 16** - Database
2. **Redis 7** - Caching and session storage
3. **MinIO** - Object storage for images and files
4. **Next.js Application** (optional) - The main application

## Quick Start

### Option 1: Run Infrastructure Services Only (Recommended for Development)

If you want to run the app locally but use Docker services:

```bash
# Start only infrastructure services (PostgreSQL, Redis, MinIO)
docker-compose -f docker-compose.infrastructure.yml up -d

# Setup MinIO bucket (run once)
docker-compose -f docker-compose.infrastructure.yml --profile setup up minio-setup

# View logs
docker-compose -f docker-compose.infrastructure.yml logs -f
```

### Option 2: Run Everything in Docker (Development)

```bash
# Start all services including database, Redis, MinIO, and app
docker-compose -f docker-compose.dev.yml up -d

# Setup MinIO bucket (run once)
docker-compose -f docker-compose.dev.yml --profile setup up minio-setup

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Option 3: Production Setup

```bash
# Build and start production services
docker-compose up -d

# Setup MinIO bucket (run once)
docker-compose --profile setup up minio-setup

# View logs
docker-compose logs -f
```

## Service Details

### PostgreSQL

- **Container**: `jewellery_postgres` (dev: `jewellery_postgres_dev`)
- **Port**: `5432`
- **Database**: `jewellery_db`
- **User**: `jewellery_user`
- **Password**: `jewellery_password`
- **Data Volume**: `postgres_data` (persistent)

**Connection String (Local):**
```
postgresql://jewellery_user:jewellery_password@localhost:5432/jewellery_db?schema=public
```

**Connection String (Docker Internal):**
```
postgresql://jewellery_user:jewellery_password@postgres:5432/jewellery_db?schema=public
```

### Redis

- **Container**: `jewellery_redis` (dev: `jewellery_redis_dev`)
- **Port**: `6379`
- **Password**: `redis_password`
- **Data Volume**: `redis_data` (persistent)
- **Persistence**: AOF (Append Only File) enabled

**Connection String (Local):**
```
redis://:redis_password@localhost:6379
```

**Connection String (Docker Internal):**
```
redis://:redis_password@redis:6379
```

### MinIO

- **Container**: `jewellery_minio` (dev: `jewellery_minio_dev`)
- **API Port**: `9000`
- **Console Port**: `9001`
- **Root User**: `minioadmin`
- **Root Password**: `minioadmin123`
- **Data Volume**: `minio_data` (persistent)
- **Default Bucket**: `products` (auto-created)

**Access Points:**
- **API**: http://localhost:9000
- **Console**: http://localhost:9001
- **Public URL**: http://localhost:9000/products/

**Docker Internal:**
- **API**: http://minio:9000
- **Console**: http://minio:9001

## Environment Variables

### For Local Development (App runs outside Docker)

Add to your `.env` file:

```env
# Database
DATABASE_URL="postgresql://jewellery_user:jewellery_password@localhost:5432/jewellery_db?schema=public"
DIRECT_URL="postgresql://jewellery_user:jewellery_password@localhost:5432/jewellery_db?schema=public"

# Redis
REDIS_URL="redis://:redis_password@localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD="redis_password"

# MinIO
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin123"
MINIO_BUCKET_NAME="products"
MINIO_PUBLIC_URL="http://localhost:9000"
```

### For Docker Development (App runs in Docker)

The `docker-compose.dev.yml` automatically sets these variables. You can override them in your `.env` file if needed.

## MinIO Setup

### Initial Bucket Creation

The MinIO setup container automatically creates the `products` bucket and sets it to public. Run:

```bash
# Infrastructure only
docker-compose -f docker-compose.infrastructure.yml --profile setup up minio-setup

# Development
docker-compose -f docker-compose.dev.yml --profile setup up minio-setup

# Production
docker-compose --profile setup up minio-setup
```

### Manual Setup via Console

1. Open MinIO Console: http://localhost:9001
2. Login with:
   - Username: `minioadmin`
   - Password: `minioadmin123`
3. Create bucket named `products`
4. Set bucket policy to "Public" or "Download"

## Database Migrations

### First Time Setup

```bash
# If running app in Docker
docker-compose -f docker-compose.dev.yml exec app npx prisma migrate deploy

# If running app locally
npx prisma migrate deploy
```

### Generate Prisma Client

```bash
# If running app in Docker
docker-compose -f docker-compose.dev.yml exec app npx prisma generate

# If running app locally
npx prisma generate
```

### Seed Database

```bash
# If running app in Docker
docker-compose -f docker-compose.dev.yml exec app npm run db:seed

# If running app locally
npm run db:seed
```

## Useful Commands

### View Logs

```bash
# All services (infrastructure only)
docker-compose -f docker-compose.infrastructure.yml logs -f

# All services (development)
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.infrastructure.yml logs -f postgres
docker-compose -f docker-compose.infrastructure.yml logs -f redis
docker-compose -f docker-compose.infrastructure.yml logs -f minio
```

### Stop Services

```bash
# Stop all services
docker-compose -f docker-compose.infrastructure.yml down

# Stop and remove volumes (⚠️ deletes data)
docker-compose -f docker-compose.infrastructure.yml down -v
```

### Restart Services

```bash
# Restart all services
docker-compose -f docker-compose.infrastructure.yml restart

# Restart specific service
docker-compose -f docker-compose.infrastructure.yml restart postgres
```

### Check Service Status

```bash
docker-compose -f docker-compose.infrastructure.yml ps
```

### Access Service Shells

```bash
# PostgreSQL
docker-compose -f docker-compose.infrastructure.yml exec postgres psql -U jewellery_user -d jewellery_db

# Redis
docker-compose -f docker-compose.infrastructure.yml exec redis redis-cli -a redis_password

# MinIO (via mc client)
docker-compose -f docker-compose.infrastructure.yml exec minio-setup mc alias set myminio http://minio:9000 minioadmin minioadmin123
docker-compose -f docker-compose.infrastructure.yml exec minio-setup mc ls myminio
```

## Health Checks

All services include health checks:

- **PostgreSQL**: Checks if database is ready
- **Redis**: Tests connection with ping
- **MinIO**: Verifies API is responding
- **App**: Checks if Next.js server is running

## Data Persistence

All data is stored in Docker volumes:

- `postgres_data` / `postgres_dev_data` - Database files
- `redis_data` / `redis_dev_data` - Redis persistence files
- `minio_data` / `minio_dev_data` - MinIO object storage

**Important**: Data persists even when containers are stopped. To remove data, use `docker-compose down -v`.

## Security Notes

⚠️ **For Production:**

1. **Change all default passwords** in `docker-compose.yml`:
   - PostgreSQL password
   - Redis password
   - MinIO root credentials

2. **Use environment variables** for sensitive data:
   ```yaml
   environment:
     POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
     REDIS_PASSWORD: ${REDIS_PASSWORD}
   ```

3. **Restrict port exposure** - Only expose necessary ports

4. **Use SSL/TLS** for MinIO in production

5. **Set up proper firewall rules**

## Troubleshooting

### PostgreSQL Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose -f docker-compose.infrastructure.yml ps postgres

# Check logs
docker-compose -f docker-compose.infrastructure.yml logs postgres

# Test connection
docker-compose -f docker-compose.infrastructure.yml exec postgres psql -U jewellery_user -d jewellery_db -c "SELECT 1;"
```

### Redis Connection Issues

```bash
# Check if Redis is running
docker-compose -f docker-compose.infrastructure.yml ps redis

# Test connection
docker-compose -f docker-compose.infrastructure.yml exec redis redis-cli -a redis_password ping
```

### MinIO Connection Issues

```bash
# Check if MinIO is running
docker-compose -f docker-compose.infrastructure.yml ps minio

# Check MinIO health
curl http://localhost:9000/minio/health/live

# Access console
# Open http://localhost:9001 in browser
```

### Port Conflicts

If ports are already in use:

1. Stop conflicting services
2. Or change ports in `docker-compose.yml`:
   ```yaml
   ports:
     - "5433:5432"  # PostgreSQL on 5433
     - "6380:6379"  # Redis on 6380
     - "9002:9000"  # MinIO API on 9002
     - "9003:9001"  # MinIO Console on 9003
   ```

## Next Steps

1. ✅ Services are running
2. ✅ MinIO bucket is created
3. 🔄 Update application code to use Redis and MinIO
4. 🔄 Test all integrations
5. 🔄 Configure production environment variables

## Support

For issues:
1. Check service logs: `docker-compose logs [service]`
2. Verify health checks: `docker-compose ps`
3. Check environment variables in `.env`
4. Ensure ports are not in use
