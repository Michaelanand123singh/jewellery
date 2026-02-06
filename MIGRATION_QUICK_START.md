# Database Migration - Quick Start Guide

## Prerequisites

✅ Docker PostgreSQL running on port 5434  
✅ Old Supabase database accessible  
✅ `.env` file configured with database URLs

## Step 1: Update .env File

Add these lines to your `.env` file:

```env
# Old Database (Supabase) - Source
OLD_DATABASE_URL="postgresql://postgres.ldzlhefoqgqtmvanoyya:%40%23123Anandsingh@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public"
OLD_DIRECT_URL="postgresql://postgres.ldzlhefoqgqtmvanoyya:%40%23123Anandsingh@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?schema=public"

# New Database (Local Docker) - Target
DATABASE_URL="postgresql://jewellery_user:jewellery_password@localhost:5434/jewellery_db?schema=public"
DIRECT_URL="postgresql://jewellery_user:jewellery_password@localhost:5434/jewellery_db?schema=public"
```

## Step 2: Ensure Database is Ready

```bash
# Check if PostgreSQL is running
docker-compose -f docker-compose.infrastructure.yml ps postgres

# If not running, start it
docker-compose -f docker-compose.infrastructure.yml up -d postgres

# Run migrations to ensure schema is up to date
npx prisma migrate deploy
```

## Step 3: Run Migration

```bash
npm run db:migrate-data
```

Or directly:

```bash
npx tsx scripts/migrate-database.ts
```

## What Gets Migrated

The script migrates all tables in dependency order:

1. **Users** → User accounts
2. **Addresses** → Shipping addresses
3. **Categories** → Product categories
4. **Brands** → Product brands
5. **Products** → Products with variants, tags, and attributes
6. **Orders** → Orders with order items
7. **CartItems** → Shopping cart items
8. **WishlistItems** → Wishlist items
9. **Reviews** → Product reviews
10. **StockMovements** → Inventory movements
11. **Blogs** → Blog posts with FAQs (if exists)
12. **Payments** → Payment records with refunds, audit logs, webhooks (if exists)
13. **Shipments** → Shipment records (if exists)
14. **FailedWebhooks** → Failed webhook records (if exists)
15. **Settings** → Application settings (if exists)

## Migration Behavior

- **Upsert Strategy**: Uses `upsert` to avoid duplicates
  - Updates existing records if found
  - Creates new records if not found
- **Batch Processing**: Processes 100 records at a time
- **Error Handling**: 
  - Foreign key errors are skipped (missing parent records)
  - Unique constraint errors are skipped (duplicates)
  - Other errors are logged
- **Progress Tracking**: Real-time progress for each table

## Expected Output

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

**"Failed to connect to old database"**
- Check network connectivity to Supabase
- Verify credentials in `.env`
- Ensure Supabase allows connections from your IP

**"Failed to connect to new database"**
- Ensure Docker PostgreSQL is running
- Verify DATABASE_URL in `.env`
- Check port 5434 is accessible

### Foreign Key Errors

These are normal for dependent records. The script will skip them and continue.

### Verify Migration

```bash
# Check record counts in new database
docker-compose -f docker-compose.infrastructure.yml exec postgres psql -U jewellery_user -d jewellery_db -c "
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'orders', COUNT(*) FROM orders;
"
```

## Next Steps

1. ✅ Verify data in new database
2. ✅ Test application with migrated data
3. ✅ Update application to use new database
4. ✅ Test all functionality
5. ✅ Consider backing up old database

---

**Script**: `scripts/migrate-database.ts`  
**Command**: `npm run db:migrate-data`

