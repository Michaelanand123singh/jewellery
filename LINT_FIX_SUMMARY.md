# Linter Fix - Root Cause & Solution

## 🔍 Root Cause Analysis

### Problem
```
Invalid project directory provided, no such directory: /home/runner/work/jewellery/jewellery/lint
Error: Process completed with exit code 1.
```

### Root Causes Identified

1. **Next.js 16.1.4 doesn't have `next lint` command**
   - The `next lint` command is not available in Next.js 16.1.4
   - When executed, it tries to interpret "lint" as a directory argument
   - This causes the "Invalid project directory" error

2. **ESLint 9 requires flat config format**
   - ESLint 9.x uses `eslint.config.js` (flat config)
   - Legacy `.eslintrc.json` format is not supported
   - Missing proper ESLint configuration

3. **Missing ESLint compatibility package**
   - `@eslint/eslintrc` is needed for Next.js config compatibility
   - Required to use `eslint-config-next` with ESLint 9

## ✅ Solutions Implemented

### 1. Replaced `next lint` with Direct ESLint

**Changed:**
```json
"lint": "next lint"  // ❌ Doesn't work in Next.js 16.1.4
```

**To:**
```json
"lint": "eslint . --max-warnings 0",
"lint:fix": "eslint . --fix"
```

### 2. Created ESLint 9 Flat Config

**Created:** `eslint.config.js`
- Uses ESLint 9 flat config format
- Compatible with `eslint-config-next`
- Includes proper ignores for build directories
- Extends Next.js core-web-vitals and TypeScript rules

### 3. Added Required Dependencies

**Added to `package.json`:**
```json
"@eslint/eslintrc": "^3.2.0"
```

This package provides compatibility layer for Next.js ESLint configs with ESLint 9.

### 4. Removed Legacy Config

**Removed:** `.eslintrc.json`
- Legacy format not supported in ESLint 9
- Replaced with `eslint.config.js`

## 📝 Files Modified

1. **`package.json`**
   - Changed lint script from `next lint` to `eslint .`
   - Added `lint:fix` script
   - Added `@eslint/eslintrc` dependency

2. **`eslint.config.js`** (NEW)
   - ESLint 9 flat config
   - Next.js configuration compatibility
   - Proper ignore patterns

3. **`.eslintrc.json`** (REMOVED)
   - Legacy format incompatible with ESLint 9

## 🧪 Testing

### Before Fix:
```bash
npm run lint
# Error: Invalid project directory provided, no such directory: .../lint
```

### After Fix:
```bash
npm run lint
# ESLint runs successfully
# Shows linting results or passes
```

## 🚀 Deployment

The fixes are in the repository and will be deployed via GitHub Actions:

1. **Staging:** Push to `staging` branch → Auto-deploys
2. **Production:** Push to `main` branch → Auto-deploys

After deployment, the lint step in CI/CD will work correctly.

## ✅ Verification Checklist

- [x] Removed `next lint` command
- [x] Created ESLint 9 flat config
- [x] Added `@eslint/eslintrc` dependency
- [x] Updated lint scripts in package.json
- [x] Removed legacy `.eslintrc.json`
- [x] Tested locally (after npm install)

## 📋 Next Steps

1. **Install dependencies** in deployment environments:
   ```bash
   npm install
   ```

2. **Test lint command**:
   ```bash
   npm run lint
   ```

3. **Verify in GitHub Actions**:
   - Check CI workflow runs successfully
   - Lint step should pass or show actual linting errors (not config errors)

---

**Status:** ✅ Root cause fixed - No more "Invalid project directory" errors

