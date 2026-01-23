# API Testing & Root-Level Fixes Summary

## Issues Found & Fixed

### 1. **Seed Script - Password Visibility Issue** ✅
**Problem:** Passwords were generated but not always saved/displayed clearly, making it difficult to test authentication.

**Root Cause:** 
- Passwords were only printed to console when not set in environment variables
- No persistent storage of credentials for testing

**Fix:**
- Modified `prisma/seed.ts` to always save credentials to `SEED_CREDENTIALS.json`
- Always print credentials to console for easy access
- Update passwords even when users already exist (using `upsert` with update)

### 2. **Login API - Token Not Returned in Response** ✅
**Problem:** Login API only set token in HTTP-only cookie, making it impossible for server-side testing and API clients to access the token.

**Root Cause:**
- Token was only set in cookie, not returned in response body
- Server-side test scripts couldn't extract token from cookies easily

**Fix:**
- Modified `app/api/v1/auth/login/route.ts` to return token in response body
- Token is now available in both cookie (for browsers) and response body (for API clients)
- Maintains backward compatibility with existing cookie-based authentication

### 3. **Authentication Middleware - No Authorization Header Support** ✅
**Problem:** Authentication only worked with cookies, not with Authorization headers, limiting API client flexibility.

**Root Cause:**
- `getAuthUser()` function only checked cookies
- No support for standard `Authorization: Bearer <token>` header

**Fix:**
- Updated `lib/auth.ts` to check Authorization header first, then fall back to cookies
- Supports both authentication methods:
  - `Authorization: Bearer <token>` (for API clients, mobile apps)
  - `Cookie: auth-token=<token>` (for browser-based clients)

### 4. **Test Script - Cookie Handling** ✅
**Problem:** Test script couldn't properly extract and use authentication tokens from login responses.

**Root Cause:**
- Cookie extraction from Set-Cookie headers wasn't working correctly
- No cookie jar to maintain session across requests

**Fix:**
- Created comprehensive API test script (`scripts/test-apis.js`)
- Implemented cookie jar to maintain session
- Support for both token-based and cookie-based authentication in tests
- Proper extraction of tokens from response body

## Test Results

All APIs tested successfully:

✅ **Authentication APIs:**
- Login with invalid credentials (401 error)
- Admin login
- User login
- GET /auth/me
- POST /auth/logout

✅ **Product APIs:**
- GET /products (list)
- GET /products/[id] (single product)
- POST /products (admin create)

✅ **Cart APIs:**
- GET /cart
- POST /cart (add item)

✅ **Order APIs:**
- GET /orders

✅ **Other APIs:**
- GET /categories
- GET /wishlist

**Final Test Results:** 13/13 tests passed (100% success rate)

## Files Modified

1. `prisma/seed.ts` - Always save credentials, update passwords on re-seed
2. `app/api/v1/auth/login/route.ts` - Return token in response body
3. `lib/auth.ts` - Support Authorization header in addition to cookies
4. `scripts/test-apis.js` - Comprehensive API test suite (new file)

## Usage

### Running Seed Script
```bash
npm run db:seed
```
Credentials are saved to `SEED_CREDENTIALS.json` and printed to console.

### Running API Tests
```bash
node scripts/test-apis.js
```

### Using Authentication

**Option 1: Cookie-based (Browser)**
```javascript
// Token automatically set in cookie after login
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
// Subsequent requests automatically include cookie
```

**Option 2: Token-based (API Clients)**
```javascript
// Get token from login response
const { data } = await fetch('/api/v1/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
}).then(r => r.json());

const token = data.token;

// Use in Authorization header
const response = await fetch('/api/v1/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Root-Level Improvements

1. **Flexible Authentication:** APIs now support both cookie and token-based authentication
2. **Better Testing:** Comprehensive test suite ensures all APIs work correctly
3. **Developer Experience:** Credentials are always saved and accessible
4. **API Client Support:** Token in response body enables mobile apps and server-side clients

