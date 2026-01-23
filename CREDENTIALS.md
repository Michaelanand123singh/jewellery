# Login Credentials

## Default User Accounts

### Admin User
- **Email:** `admin@jewellery.com`
- **Role:** `ADMIN`
- **Password:** Set via `ADMIN_PASSWORD` environment variable or randomly generated during seed

### Test User (Development Only)
- **Email:** `user@example.com`
- **Role:** `USER`
- **Password:** Set via `TEST_USER_PASSWORD` environment variable or randomly generated during seed

## How Passwords Work

The seed script (`prisma/seed.ts`) creates these users when you run:
```bash
npm run db:seed
```

### Password Behavior:
1. **If `ADMIN_PASSWORD` is set in `.env`:** Uses that password
2. **If `ADMIN_PASSWORD` is NOT set:** Generates a random 20-character password and **prints it to the console**

3. **If `TEST_USER_PASSWORD` is set in `.env`:** Uses that password
4. **If `TEST_USER_PASSWORD` is NOT set:** Generates a random 12-character password and **prints it to the console**

## Setting Custom Passwords

### Option 1: Set in `.env` file (Recommended)
Add these to your `.env` file:
```env
ADMIN_PASSWORD="YourSecureAdminPassword123!"
TEST_USER_PASSWORD="YourTestUserPassword123!"
```

Then re-seed the database:
```bash
npm run db:seed
```

### Option 2: Check Seed Output
If you've already seeded without setting passwords, check the console output from when you ran `npm run db:seed`. The passwords were printed there.

### Option 3: Re-seed to See Generated Passwords
Run the seed script again to see the generated passwords:
```bash
npm run db:seed
```

Look for output like:
```
⚠️  IMPORTANT: Admin password generated, save this: [PASSWORD]
   Password: [PASSWORD]
⚠️  Test user password: [PASSWORD]
```

## Quick Setup

1. **Set passwords in `.env`:**
   ```env
   ADMIN_PASSWORD="Admin@123"
   TEST_USER_PASSWORD="User@123"
   ```

2. **Re-seed the database:**
   ```bash
   npm run db:seed
   ```

3. **Login with:**
   - Admin: `admin@jewellery.com` / `Admin@123`
   - User: `user@example.com` / `User@123`

## Important Notes

- ⚠️ **Change default passwords in production!**
- 🔒 Passwords are hashed using bcrypt (10 rounds)
- 📝 User passwords must meet these requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- 🧪 Test user is only created in development (`NODE_ENV=development`)

## Resetting Passwords

If you've forgotten the passwords:
1. Set `ADMIN_PASSWORD` and/or `TEST_USER_PASSWORD` in `.env`
2. Run `npm run db:seed` again (seed script uses `upsert`, so it updates existing users)
3. Use the new passwords to login

## Login URLs

- **Login Page:** `http://localhost:3000/login`
- **Register Page:** `http://localhost:3000/register`
- **Admin Dashboard:** (After login as admin)

















