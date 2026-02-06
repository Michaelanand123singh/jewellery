# Database Migration Guide

## Overview

This guide explains how to migrate data from your old Supabase database to the new local PostgreSQL database running in Docker.

## Prerequisites

1. ✅ Docker services running (PostgreSQL, Redis, MinIO)
2. ✅ New database migrations applied
3. ✅ Old database credentials available
4. ✅ Network access to old Supabase database

## Migration Process

### Step 1: Configure Environment Variables

Add these to your `.env` file:

```env
# Old Database (Supabase) - Source
OLD_DATABASE_URL="postgresql://postgres.ldzlhefoqgqtmvanoyya:%40%23123Anandsingh@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public"
OLD_DIRECT_URL="postgresql://postgres.ldzlhefoqgqtmvanoyya:%40%23123Anandsingh@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?schema=public"

# New Database (Local Docker) - Target
DATABASE_URL="postgresql://jewellery_user:jewellery_password@localhost:5434/jewellery_db?schema=public"
DIRECT_URL="postgresql://jewellery_user:jewellery_password@localhost:5434/jewellery_db?schema=public"
```

### Step 2: Verify Connections

Test both database connections:

```bash
# Test old database
psql "postgresql://postgres.ldzlhefoqgqtmvanoyya:%40%23123Anandsingh@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?schema=public" -c "SELECT COUNT(*) FROM users;"

# Test new database
docker-compose -f docker-compose.infrastructure.yml exec postgres psql -U jewellery_user -d jewellery_db -c "SELECT COUNT(*) FROM users;"
```

### Step 3: Run Migration

Execute the migration script:

```bash
npm run db:migrate-data
```

Or directly:

```bash
npx tsx scripts/migrate-database.ts
```

## What Gets Migrated

The migration script migrates all tables in this order (respecting foreign key constraints):

1. **Users** - All user accounts
2. **Addresses** - User shipping addresses
3. **Categories** - Product categories
4. **Brands** - Product brands
5. **Products** - All products with:
   - Product variants
   - Product tags
   - Tag relations
6. **Orders** - All orders with:
   - Order items
7. **CartItems** - Shopping cart items
8. **WishlistItems** - Wishlist items
9. **Reviews** - Product reviews
10. **StockMovements** - Inventory movements

## Migration Behavior

- **Upsert Strategy**: Uses `upsert` to avoid duplicates
  - If record exists (by ID or unique key), it updates
  - If record doesn't exist, it creates
- **Error Handling**: 
  - Foreign key errors are skipped (missing parent records)
  - Unique constraint errors are skipped (duplicates)
  - Other errors are logged and counted
- **Batch Processing**: Processes in batches of 100 records
- **Progress Tracking**: Shows real-time progress for each table

## Migration Output

The script will show:

```
═══════════════════════════════════════════════════════
   Database Migration Script
═══════════════════════════════════════════════════════

📊 Source Database (Old): ...
📊 Target Database (New): ...

🔌 Testing database connections...
✅ Old database connection successful
✅ New database connection successful

📊 Counting records in old database...
Record counts:
  users: 10
  products: 150
  ...

🚀 Starting migration...

📦 Migrating Users... (10 records)
  ✅ Users: 10/10 migrated, 0 errors

📦 Migrating Products... (150 records)
  ✅ Products: 150/150 migrated, 0 errors

...

═══════════════════════════════════════════════════════
   Migration Summary
═══════════════════════════════════════════════════════

✅ Users: 10/10 migrated, 0 errors
✅ Products: 150/150 migrated, 0 errors
...

Total: 500 records migrated, 0 errors

✅ Migration completed successfully!
```

## Troubleshooting

### Connection Errors

**Error: "Failed to connect to old database"**
- Check network connectivity to Supabase
- Verify credentials in `.env`
- Ensure Supabase allows connections from your IP

**Error: "Failed to connect to new database"**
- Ensure Docker PostgreSQL is running: `docker-compose ps postgres`
- Verify DATABASE_URL in `.env`
- Check port 5434 is accessible

### Foreign Key Errors

If you see foreign key constraint errors:
- This is normal for dependent records (addresses, orders, etc.)
- The script will skip these and continue
- Ensure parent records (users, products) are migrated first

### Duplicate Errors

If you see unique constraint errors:
- Records already exist in new database
- The script uses upsert, so it will update existing records
- This is expected if you run migration multiple times

### Large Dataset

For large datasets (>10,000 records):
- Migration may take several minutes
- Progress is shown in real-time
- Consider running during off-peak hours

## Post-Migration

### Verify Data

```bash
# Check record counts
docker-compose -f docker-compose.infrastructure.yml exec postgres psql -U jewellery_user -d jewellery_db -c "
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'orders', COUNT(*) FROM orders;
"
```

### Test Application

1. Start your application: `npm run dev`
2. Login with migrated user accounts
3. Verify products are visible
4. Check orders are accessible
5. Test file uploads (images should work with MinIO)

### Clean Up

After successful migration:
1. Remove old database credentials from `.env` (optional)
2. Update application to use new database
3. Test all functionality
4. Consider backing up old database before decommissioning

## Rollback

If migration fails or you need to rollback:

1. **Stop the application**
2. **Drop and recreate new database:**
   ```bash
   docker-compose -f docker-compose.infrastructure.yml down -v
   docker-compose -f docker-compose.infrastructure.yml up -d postgres
   npx prisma migrate deploy
   ```
3. **Re-run migration** after fixing issues

## Important Notes

⚠️ **Backup First**: Always backup your old database before migration

⚠️ **Test Environment**: Test migration in a development environment first

⚠️ **Downtime**: Plan for brief downtime during migration

⚠️ **File Storage**: Image URLs from Supabase will need to be migrated to MinIO separately (if needed)

## Support

For issues:
1. Check migration script output for specific errors
2. Verify database connections
3. Check foreign key relationships
4. Review Prisma schema for table structure

---

**Migration Script**: `scripts/migrate-database.ts`
**Run Command**: `npm run db:migrate-data`
