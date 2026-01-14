# Docker Setup Guide - Complete Instructions

## Prerequisites

1. **Docker Desktop** installed and running
   - Download: https://www.docker.com/products/docker-desktop
   - Verify: Docker icon should be green in system tray

2. **`.env` file** with Supabase credentials
   - Copy `env.example` to `.env`
   - Fill in your Supabase credentials

## Quick Start

```bash
# 1. Navigate to project
cd "C:\Users\anand\Documents\NEXTIN VISION\Jewellery-master"

# 2. Make sure .env file exists with Supabase credentials
# (If not, copy from env.example)

# 3. Start Docker development environment
docker-compose -f docker-compose.dev.yml up

# 4. Access your app at http://localhost:3000
```

## What Happens Automatically

1. ✅ **Builds Docker image** (first time only, ~2-3 minutes)
2. ✅ **Installs all dependencies** (npm ci)
3. ✅ **Generates Prisma Client**
4. ✅ **Runs database migrations** (connects to Supabase)
5. ✅ **Seeds database** (creates admin user + 30 products)
6. ✅ **Starts Next.js dev server** with hot reload

## Daily Usage

### Start Development
```bash
docker-compose -f docker-compose.dev.yml up
```

### Start in Background (Detached)
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Stop Development
```bash
# Press Ctrl+C if running in foreground
# Or if in background:
docker-compose -f docker-compose.dev.yml down
```

### View Logs
```bash
# Follow logs
docker-compose -f docker-compose.dev.yml logs -f

# View logs for specific service
docker-compose -f docker-compose.dev.yml logs -f app
```

### Rebuild After Changes
```bash
# Rebuild if Dockerfile or dependencies change
docker-compose -f docker-compose.dev.yml up --build
```

## Accessing Services

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3000/api
- **Prisma Studio:** Run inside container (see below)

## Useful Commands

### Run Commands Inside Container

```bash
# Open shell in container
docker-compose -f docker-compose.dev.yml exec app sh

# Run Prisma Studio
docker-compose -f docker-compose.dev.yml exec app npx prisma studio

# Run database migrations manually
docker-compose -f docker-compose.dev.yml exec app npx prisma migrate deploy

# Seed database manually
docker-compose -f docker-compose.dev.yml exec app npm run db:seed

# Check Prisma connection
docker-compose -f docker-compose.dev.yml exec app npx prisma db pull
```

### Database Operations

```bash
# Reset database (WARNING: Deletes all data)
docker-compose -f docker-compose.dev.yml exec app npx prisma migrate reset

# Create new migration
docker-compose -f docker-compose.dev.yml exec app npx prisma migrate dev --name migration_name

# View database schema
docker-compose -f docker-compose.dev.yml exec app npx prisma studio
# Then open http://localhost:5555 in browser
```

## Troubleshooting

### Port Already in Use
```bash
# Stop any existing Next.js servers on port 3000
# Or change port in docker-compose.dev.yml:
ports:
  - "3001:3000"  # Use 3001 instead
```

### Environment Variables Not Loading
```bash
# Make sure .env file exists in project root
# Check it's being loaded:
docker-compose -f docker-compose.dev.yml exec app env | grep DATABASE_URL
```

### Prisma Connection Errors
```bash
# Verify Supabase credentials in .env
# Test connection:
docker-compose -f docker-compose.dev.yml exec app npx prisma db pull
```

### Container Won't Start
```bash
# View detailed logs
docker-compose -f docker-compose.dev.yml logs

# Rebuild from scratch
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up
```

### Hot Reload Not Working
```bash
# Make sure volumes are mounted correctly
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up
```

### Clear Everything and Start Fresh
```bash
# Stop and remove containers, volumes, networks
docker-compose -f docker-compose.dev.yml down -v

# Remove images
docker rmi jewellery-app_dev

# Start fresh
docker-compose -f docker-compose.dev.yml up --build
```

## File Changes

- ✅ **Code changes:** Automatically reflected (hot reload)
- ✅ **New dependencies:** Rebuild required (`--build` flag)
- ✅ **Prisma schema changes:** Run `prisma generate` inside container
- ✅ **Environment variables:** Restart container after changing `.env`

## Production Build

For production builds, use the production Dockerfile:

```bash
# Build production image
docker-compose -f docker-compose.yml build

# Run production
docker-compose -f docker-compose.yml up
```

## Benefits

- ✅ **No Windows Application Control issues** - Runs in Linux container
- ✅ **Consistent environment** - Same for all developers
- ✅ **Isolated dependencies** - Doesn't affect system Node.js
- ✅ **Easy cleanup** - Just delete container
- ✅ **Production-like** - Similar to deployment environment

## Next Steps

1. Start Docker Desktop
2. Run `docker-compose -f docker-compose.dev.yml up`
3. Open http://localhost:3000
4. Start developing! 🚀


