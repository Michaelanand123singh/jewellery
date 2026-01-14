# PowerShell script to unblock Next.js and Prisma binaries
# MUST be run as Administrator
# Right-click PowerShell and select "Run as Administrator", then run this script

Write-Host "🔓 Unblocking Next.js and Prisma binaries (Admin required)..." -ForegroundColor Yellow
Write-Host ""

$projectRoot = "C:\Users\anand\Documents\NEXTIN VISION\Jewellery-master"
$nodeModules = Join-Path $projectRoot "node_modules"

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To run as Administrator:" -ForegroundColor Yellow
    Write-Host "1. Right-click PowerShell" -ForegroundColor Cyan
    Write-Host "2. Select 'Run as Administrator'" -ForegroundColor Cyan
    Write-Host "3. Navigate to: $projectRoot" -ForegroundColor Cyan
    Write-Host "4. Run: .\scripts\unblock-binaries-admin.ps1" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green
Write-Host ""

# Unblock Next.js binaries
Write-Host "Unblocking Next.js binaries..." -ForegroundColor Cyan
$nextFiles = Get-ChildItem -Path "$nodeModules\@next" -Recurse -Include "*.node" -ErrorAction SilentlyContinue
if ($nextFiles) {
    $nextFiles | ForEach-Object {
        Unblock-File -Path $_.FullName -ErrorAction SilentlyContinue
        Write-Host "  ✓ Unblocked: $($_.Name)" -ForegroundColor Green
    }
} else {
    Write-Host "  ⚠ No Next.js binaries found" -ForegroundColor Yellow
}

# Unblock Prisma binaries
Write-Host ""
Write-Host "Unblocking Prisma binaries..." -ForegroundColor Cyan

# Prisma query engine
$prismaClientFiles = Get-ChildItem -Path "$nodeModules\.prisma" -Recurse -Include "*.node" -ErrorAction SilentlyContinue
if ($prismaClientFiles) {
    $prismaClientFiles | ForEach-Object {
        Unblock-File -Path $_.FullName -ErrorAction SilentlyContinue
        Write-Host "  ✓ Unblocked: $($_.Name)" -ForegroundColor Green
    }
}

# Prisma engines
$prismaEngineFiles = Get-ChildItem -Path "$nodeModules\@prisma" -Recurse -Include "*.exe","*.node","*.dll" -ErrorAction SilentlyContinue
if ($prismaEngineFiles) {
    $prismaEngineFiles | ForEach-Object {
        Unblock-File -Path $_.FullName -ErrorAction SilentlyContinue
        Write-Host "  ✓ Unblocked: $($_.Name)" -ForegroundColor Green
    }
}

# Also check prisma package directory
$prismaPackageFiles = Get-ChildItem -Path "$nodeModules\prisma" -Recurse -Include "*.exe","*.node","*.dll" -ErrorAction SilentlyContinue
if ($prismaPackageFiles) {
    $prismaPackageFiles | ForEach-Object {
        Unblock-File -Path $_.FullName -ErrorAction SilentlyContinue
        Write-Host "  ✓ Unblocked: $($_.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ All binaries unblocked!" -ForegroundColor Green
Write-Host ""
Write-Host "Now you can run: npm run dev" -ForegroundColor Cyan


