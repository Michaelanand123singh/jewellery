# Build Error Fix - Windows Application Control

## Root Cause

Windows Application Control policy is blocking Next.js native binaries:
- `@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` (blocked)
- Next.js falls back to WASM bindings
- Next.js 16.x then tries to use Turbopack (also WASM-based)
- Turbopack WASM bindings don't support `turbo.createProject` → Build fails

## Root Level Fixes

### Option 1: Use Docker (Recommended ✅)
Docker bypasses Windows Application Control completely:

```bash
docker-compose up --build
```

### Option 2: Whitelist Binaries in Application Control
Contact your IT administrator to whitelist:
- `node_modules\@next\swc-win32-x64-msvc\next-swc.win32-x64-msvc.node`
- `node_modules\@prisma\engines\schema-engine-windows.exe`
- `node_modules\@prisma\client\query_engine-windows.dll.node`

### Option 3: Unblock Files (Requires Admin)
Run PowerShell as Administrator:

```powershell
cd "C:\Users\anand\Documents\NEXTIN VISION\Jewellery-master"
Get-ChildItem -Path "node_modules\@next" -Recurse -Include "*.node","*.exe" | Unblock-File
Get-ChildItem -Path "node_modules\@prisma" -Recurse -Include "*.exe","*.node" | Unblock-File
```

### Option 4: Downgrade Next.js (Not Recommended)
Downgrade to Next.js 15.x which doesn't have Turbopack auto-detection:
```bash
npm install next@15.1.6 --save
```

## Current Status

- ✅ Database: Connected to Supabase
- ✅ Migrations: Completed
- ✅ Seeding: 30 products + 2 users created
- ❌ Build: Blocked by Windows Application Control

## Quick Fix

**Use Docker for builds:**
```bash
docker-compose up --build
```

This completely bypasses Windows Application Control and will work immediately.


