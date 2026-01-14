# 🚀 Start Your Project with Docker

## One Command to Rule Them All

```bash
docker-compose -f docker-compose.dev.yml up
```

**That's it!** Your project will:
- ✅ Build Docker image (first time only)
- ✅ Install all dependencies
- ✅ Connect to Supabase database
- ✅ Run migrations
- ✅ Seed sample data
- ✅ Start dev server on http://localhost:3000

## Prerequisites

1. **Docker Desktop** running (green icon in system tray)
2. **`.env` file** with Supabase credentials (already exists ✅)

## Quick Commands

```bash
# Start development
npm run dev:docker

# Start with rebuild
npm run dev:docker:build

# Or use docker-compose directly
docker-compose -f docker-compose.dev.yml up

# Stop (Ctrl+C or)
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

## What You Get

- ✅ **No Windows Application Control issues** - Runs in Linux container
- ✅ **Hot reload** - Edit files, see changes instantly
- ✅ **Database connected** - Supabase PostgreSQL ready
- ✅ **Sample data** - 30 products + 2 users pre-loaded
- ✅ **Full development environment** - Everything works!

## Access Your App

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3000/api

## Need Help?

See `DOCKER_SETUP.md` for detailed instructions and troubleshooting.

---

**Ready? Run this now:**
```bash
docker-compose -f docker-compose.dev.yml up
```


