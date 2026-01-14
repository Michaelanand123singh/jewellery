# Docker Troubleshooting Guide

## Error: "The system cannot find the file specified" / "dockerDesktopLinuxEngine"

### Root Cause
**Docker Desktop is not running** or not properly started.

### Solution

#### Step 1: Start Docker Desktop
1. **Open Docker Desktop** from Start Menu
   - Search for "Docker Desktop" in Windows Start Menu
   - Click to launch

2. **Wait for Docker to start**
   - Look for Docker icon in system tray (bottom right)
   - Icon should be **green/steady** (not red or animated)
   - Wait 30-60 seconds for full startup

3. **Verify Docker is running**
   ```powershell
   docker ps
   ```
   - Should show empty list (no error)
   - If error, Docker is still starting - wait more

#### Step 2: Verify Docker Desktop Status

**Check system tray:**
- ✅ **Green whale icon** = Running
- ⚠️ **Animated/loading icon** = Starting (wait)
- ❌ **Red icon or no icon** = Not running (start Docker Desktop)

**Check via PowerShell:**
```powershell
# Check if Docker Desktop process is running
Get-Process "Docker Desktop" -ErrorAction SilentlyContinue

# Test Docker connection
docker ps
```

#### Step 3: If Docker Desktop Won't Start

1. **Restart Docker Desktop:**
   - Right-click Docker icon in system tray
   - Select "Quit Docker Desktop"
   - Wait 10 seconds
   - Start Docker Desktop again

2. **Check Windows Services:**
   ```powershell
   # Run as Administrator
   Get-Service | Where-Object {$_.Name -like "*docker*"}
   ```

3. **Restart Docker Service (if needed):**
   ```powershell
   # Run PowerShell as Administrator
   Restart-Service docker
   ```

4. **Reinstall Docker Desktop (last resort):**
   - Download from: https://www.docker.com/products/docker-desktop
   - Uninstall current version
   - Install fresh copy
   - Restart computer

## Other Common Issues

### Issue: "version is obsolete" Warning
**Fixed!** Removed `version: '3.8'` from docker-compose.dev.yml

### Issue: Port Already in Use
```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Issue: Permission Denied
- Make sure Docker Desktop is running
- Try running PowerShell as Administrator
- Check Docker Desktop settings → Resources → File Sharing (add your project folder)

### Issue: "Cannot connect to Docker daemon"
- Docker Desktop is not running
- Start Docker Desktop and wait for it to fully start
- Check system tray icon is green

## Quick Checklist

Before running `npm run dev:docker`:

- [ ] Docker Desktop is installed
- [ ] Docker Desktop is running (green icon in system tray)
- [ ] `docker ps` command works (no errors)
- [ ] `.env` file exists with Supabase credentials
- [ ] No other services using port 3000

## Verification Commands

```powershell
# 1. Check Docker is running
docker ps

# 2. Check Docker version
docker --version

# 3. Check Docker Compose version
docker-compose --version

# 4. Test Docker connection
docker info
```

All commands should work without errors if Docker Desktop is running properly.

## Still Having Issues?

1. **Restart Docker Desktop** (most common fix)
2. **Restart your computer**
3. **Check Docker Desktop logs:**
   - Docker Desktop → Troubleshoot → View logs
4. **Check Windows Event Viewer** for Docker errors


