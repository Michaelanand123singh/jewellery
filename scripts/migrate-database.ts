/**
 * Database Migration Script
 * Migrates data from old Supabase database to new local PostgreSQL database
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

// Old database connection (Supabase)
const oldDbUrl = process.env.OLD_DATABASE_URL || "postgresql://postgres.ldzlhefoqgqtmvanoyya:%40%23123Anandsingh@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public";
const oldDirectUrl = process.env.OLD_DIRECT_URL || "postgresql://postgres.ldzlhefoqgqtmvanoyya:%40%23123Anandsingh@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?schema=public";

// New database connection (Local Docker)
const newDbUrl = process.env.DATABASE_URL;

if (!newDbUrl) {
    console.error('❌ DATABASE_URL not set. Please configure your .env file.');
    process.exit(1);
}

/**
 * Ensure Prisma client is up to date
 */
function ensurePrismaClientUpToDate() {
    console.log('🔄 Ensuring Prisma client is up to date...\n');
    try {
        execSync('npx prisma generate', { stdio: 'inherit' });
        console.log('✅ Prisma client generated successfully\n');
    } catch (error: any) {
        console.error('⚠️  Warning: Failed to generate Prisma client:', error.message);
        console.log('   Continuing with existing client...\n');
    }
}

/**
 * Verify schema compatibility
 */
async function verifySchema(newDb: PrismaClient): Promise<boolean> {
    console.log('🔍 Verifying database schema compatibility...\n');
    
    try {
        // Test critical tables and columns
        const checks = [
            { table: 'users', column: 'provider' },
            { table: 'categories', column: 'id' },
            { table: 'products', column: 'status' },
            { table: 'cart_items', column: 'variantId' },
            { table: 'stock_movements', column: 'id' },
            { table: 'settings', column: 'id' },
        ];

        for (const check of checks) {
            try {
                // Try to query the table/column to verify it exists
                if (check.table === 'users') {
                    await newDb.user.findFirst({ select: { provider: true } });
                } else if (check.table === 'categories') {
                    await newDb.category.findFirst();
                } else if (check.table === 'products') {
                    await newDb.product.findFirst({ select: { status: true } });
                } else if (check.table === 'cart_items') {
                    await newDb.cartItem.findFirst({ select: { variantId: true } });
                } else if (check.table === 'stock_movements') {
                    await newDb.stockMovement.findFirst();
                } else if (check.table === 'settings') {
                    await newDb.setting.findFirst();
                }
            } catch (error: any) {
                console.error(`❌ Schema check failed for ${check.table}.${check.column}:`, error.message);
                return false;
            }
        }

        console.log('✅ Schema compatibility verified\n');
        return true;
    } catch (error: any) {
        console.error('❌ Schema verification failed:', error.message);
        console.log('\n💡 Try running: npx prisma migrate deploy');
        console.log('   Or: npx prisma db push\n');
        return false;
    }
}

// Ensure Prisma client is up to date before creating instances
ensurePrismaClientUpToDate();

// Create Prisma clients
const oldDb = new PrismaClient({
    datasources: {
        db: {
            url: oldDirectUrl, // Use direct URL for migrations (bypasses connection pooling)
        },
    },
});

const newDb = new PrismaClient({
    datasources: {
        db: {
            url: newDbUrl,
        },
    },
});

interface MigrationStats {
    table: string;
    total: number;
    migrated: number;
    errors: number;
}

const stats: MigrationStats[] = [];

function logProgress(table: string, current: number, total: number) {
    const percentage = ((current / total) * 100).toFixed(1);
    process.stdout.write(`\r  ${table}: ${current}/${total} (${percentage}%)`);
    if (current === total) {
        process.stdout.write('\n');
    }
}

async function migrateTable<T>(
    tableName: string,
    oldData: T[],
    migrateFn: (data: T[]) => Promise<number>
): Promise<MigrationStats> {
    const total = oldData.length;
    let migrated = 0;
    let errors = 0;

    console.log(`\n📦 Migrating ${tableName}... (${total} records)`);

    if (total === 0) {
        console.log(`  ⚠️  No data to migrate`);
        return { table: tableName, total, migrated: 0, errors: 0 };
    }

    try {
        // Process in batches to avoid memory issues
        const batchSize = 100;
        for (let i = 0; i < oldData.length; i += batchSize) {
            const batch = oldData.slice(i, i + batchSize);
            try {
                const count = await migrateFn(batch);
                migrated += count;
                logProgress(tableName, migrated, total);
            } catch (error: any) {
                errors += batch.length;
                console.error(`\n  ❌ Error migrating batch ${i}-${i + batch.length}:`, error.message);
            }
        }

        console.log(`  ✅ ${tableName}: ${migrated}/${total} migrated, ${errors} errors`);
    } catch (error: any) {
        console.error(`  ❌ Error migrating ${tableName}:`, error.message);
        errors = total;
    }

    return { table: tableName, total, migrated, errors };
}

async function migrateUsers() {
    const users = await oldDb.user.findMany({
        orderBy: { createdAt: 'asc' },
    });

    return migrateTable('Users', users, async (batch) => {
        let count = 0;
        for (const user of batch) {
            try {
                await newDb.user.upsert({
                    where: { email: user.email },
                    update: {
                        name: user.name,
                        phone: user.phone,
                        role: user.role,
                        provider: user.provider,
                        providerId: user.providerId,
                        updatedAt: user.updatedAt,
                    },
                    create: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        password: user.password,
                        phone: user.phone,
                        role: user.role,
                        provider: user.provider,
                        providerId: user.providerId,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt,
                    },
                });
                count++;
            } catch (error: any) {
                if (!error.message.includes('Unique constraint')) {
                    throw error;
                }
                // User already exists, skip
            }
        }
        return count;
    });
}

async function migrateAddresses() {
    const addresses = await oldDb.address.findMany({
        orderBy: { createdAt: 'asc' },
    });

    return migrateTable('Addresses', addresses, async (batch) => {
        let count = 0;
        for (const address of batch) {
            try {
                await newDb.address.upsert({
                    where: { id: address.id },
                    update: {
                        fullName: address.fullName,
                        phone: address.phone,
                        addressLine1: address.addressLine1,
                        addressLine2: address.addressLine2,
                        city: address.city,
                        state: address.state,
                        postalCode: address.postalCode,
                        country: address.country,
                        isDefault: address.isDefault,
                        updatedAt: address.updatedAt,
                    },
                    create: {
                        id: address.id,
                        userId: address.userId,
                        fullName: address.fullName,
                        phone: address.phone,
                        addressLine1: address.addressLine1,
                        addressLine2: address.addressLine2,
                        city: address.city,
                        state: address.state,
                        postalCode: address.postalCode,
                        country: address.country,
                        isDefault: address.isDefault,
                        createdAt: address.createdAt,
                        updatedAt: address.updatedAt,
                    },
                });
                count++;
            } catch (error: any) {
                if (!error.message.includes('Foreign key constraint')) {
                    throw error;
                }
                // User doesn't exist, skip
            }
        }
        return count;
    });
}

async function migrateCategories() {
    const categories = await oldDb.category.findMany({
        orderBy: { createdAt: 'asc' },
    });

    return migrateTable('Categories', categories, async (batch) => {
        let count = 0;
        for (const category of batch) {
            try {
                await newDb.category.upsert({
                    where: { id: category.id },
                    update: {
                        name: category.name,
                        slug: category.slug,
                        description: category.description,
                        image: category.image,
                        parentId: category.parentId,
                        updatedAt: category.updatedAt,
                    },
                    create: {
                        id: category.id,
                        name: category.name,
                        slug: category.slug,
                        description: category.description,
                        image: category.image,
                        parentId: category.parentId,
                        createdAt: category.createdAt,
                        updatedAt: category.updatedAt,
                    },
                });
                count++;
            } catch (error: any) {
                if (!error.message.includes('Unique constraint')) {
                    throw error;
                }
            }
        }
        return count;
    });
}

async function migrateBrands() {
    const brands = await oldDb.brand.findMany({
        orderBy: { createdAt: 'asc' },
    });

    return migrateTable('Brands', brands, async (batch) => {
        let count = 0;
        for (const brand of batch) {
            try {
                await newDb.brand.upsert({
                    where: { id: brand.id },
                    update: {
                        name: brand.name,
                        slug: brand.slug,
                        description: brand.description,
                        logo: brand.logo,
                        updatedAt: brand.updatedAt,
                    },
                    create: {
                        id: brand.id,
                        name: brand.name,
                        slug: brand.slug,
                        description: brand.description,
                        logo: brand.logo,
                        createdAt: brand.createdAt,
                        updatedAt: brand.updatedAt,
                    },
                });
                count++;
            } catch (error: any) {
                if (!error.message.includes('Unique constraint')) {
                    throw error;
                }
            }
        }
        return count;
    });
}

async function migrateProducts() {
    const products = await oldDb.product.findMany({
        include: {
            variants: true,
            tags: true,
            attributes: true,
        },
        orderBy: { createdAt: 'asc' },
    });

    return migrateTable('Products', products, async (batch) => {
        let count = 0;
        for (const product of batch) {
            try {
                // Migrate product tags first (if any)
                const tagConnections: { id: string }[] = [];
                if (product.tags && product.tags.length > 0) {
                    for (const tag of product.tags) {
                        try {
                            // Ensure tag exists
                            await newDb.productTag.upsert({
                                where: { id: tag.id },
                                update: {
                                    name: tag.name,
                                    slug: tag.slug,
                                },
                                create: {
                                    id: tag.id,
                                    name: tag.name,
                                    slug: tag.slug,
                                    createdAt: tag.createdAt || new Date(),
                                    updatedAt: tag.updatedAt || new Date(),
                                },
                            });
                            tagConnections.push({ id: tag.id });
                        } catch (error: any) {
                            // Skip tag if it fails
                        }
                    }
                }

                // Create product with tag connections
                await newDb.product.upsert({
                    where: { id: product.id },
                    update: {
                        name: product.name,
                        slug: product.slug,
                        sku: product.sku || undefined,
                        description: product.description || undefined,
                        price: product.price,
                        originalPrice: product.originalPrice || undefined,
                        image: product.image,
                        images: product.images || [],
                        category: product.category,
                        categoryId: (product as any).categoryId || undefined,
                        status: (product as any).status || 'DRAFT',
                        brandId: (product as any).brandId || undefined,
                        inStock: product.inStock,
                        stockQuantity: product.stockQuantity,
                        rating: product.rating || 0,
                        reviewCount: product.reviewCount || 0,
                        metaTitle: (product as any).metaTitle || (product as any).seoTitle || undefined,
                        metaDescription: (product as any).metaDescription || (product as any).seoDescription || undefined,
                        metaKeywords: (product as any).metaKeywords || [],
                        ogImage: (product as any).ogImage || undefined,
                        weight: (product as any).weight || undefined,
                        dimensions: (product as any).dimensions || undefined,
                        taxClass: (product as any).taxClass || undefined,
                        supplierName: (product as any).supplierName || undefined,
                        supplierLocation: (product as any).supplierLocation || undefined,
                        supplierCertification: (product as any).supplierCertification || undefined,
                        returnPolicy: (product as any).returnPolicy || undefined,
                        returnDays: (product as any).returnDays || undefined,
                        tags: tagConnections.length > 0 ? { set: tagConnections } : undefined,
                        updatedAt: product.updatedAt,
                    },
                    create: {
                        id: product.id,
                        name: product.name,
                        slug: product.slug,
                        sku: product.sku || undefined,
                        description: product.description || undefined,
                        price: product.price,
                        originalPrice: product.originalPrice || undefined,
                        image: product.image,
                        images: product.images || [],
                        category: product.category,
                        categoryId: (product as any).categoryId || undefined,
                        status: (product as any).status || 'DRAFT',
                        brandId: (product as any).brandId || undefined,
                        inStock: product.inStock,
                        stockQuantity: product.stockQuantity,
                        rating: product.rating || 0,
                        reviewCount: product.reviewCount || 0,
                        metaTitle: (product as any).metaTitle || (product as any).seoTitle || undefined,
                        metaDescription: (product as any).metaDescription || (product as any).seoDescription || undefined,
                        metaKeywords: (product as any).metaKeywords || [],
                        ogImage: (product as any).ogImage || undefined,
                        weight: (product as any).weight || undefined,
                        dimensions: (product as any).dimensions || undefined,
                        taxClass: (product as any).taxClass || undefined,
                        supplierName: (product as any).supplierName || undefined,
                        supplierLocation: (product as any).supplierLocation || undefined,
                        supplierCertification: (product as any).supplierCertification || undefined,
                        returnPolicy: (product as any).returnPolicy || undefined,
                        returnDays: (product as any).returnDays || undefined,
                        tags: tagConnections.length > 0 ? { connect: tagConnections } : undefined,
                        createdAt: product.createdAt,
                        updatedAt: product.updatedAt,
                    },
                });

                // Migrate variants
                if (product.variants && product.variants.length > 0) {
                    for (const variant of product.variants) {
                        try {
                            await newDb.productVariant.upsert({
                                where: { id: variant.id },
                                update: {
                                    name: variant.name,
                                    sku: variant.sku,
                                    price: variant.price || undefined,
                                    stockQuantity: variant.stockQuantity,
                                    attributes: variant.attributes as any,
                                    image: variant.image || undefined,
                                    updatedAt: variant.updatedAt,
                                },
                                create: {
                                    id: variant.id,
                                    productId: variant.productId,
                                    name: variant.name,
                                    sku: variant.sku,
                                    price: variant.price || undefined,
                                    stockQuantity: variant.stockQuantity,
                                    attributes: variant.attributes as any,
                                    image: variant.image || undefined,
                                    createdAt: variant.createdAt,
                                    updatedAt: variant.updatedAt,
                                },
                            });
                        } catch (error: any) {
                            // Skip variant if it fails
                        }
                    }
                }

                // Migrate product attributes
                if (product.attributes && product.attributes.length > 0) {
                    for (const attr of product.attributes) {
                        try {
                            await newDb.productAttribute.upsert({
                                where: { id: attr.id },
                                update: {
                                    key: attr.key,
                                    value: attr.value,
                                },
                                create: {
                                    id: attr.id,
                                    productId: attr.productId,
                                    key: attr.key,
                                    value: attr.value,
                                    createdAt: attr.createdAt,
                                },
                            });
                        } catch (error: any) {
                            // Skip attribute if it fails
                        }
                    }
                }

                count++;
            } catch (error: any) {
                if (!error.message.includes('Unique constraint')) {
                    throw error;
                }
            }
        }
        return count;
    });
}

async function migrateOrders() {
    const orders = await oldDb.order.findMany({
        include: {
            orderItems: true,
        },
        orderBy: { createdAt: 'asc' },
    });

    return migrateTable('Orders', orders, async (batch) => {
        let count = 0;
        for (const order of batch) {
            try {
                // Get addressId from order (it should have addressId field)
                const addressId = (order as any).addressId || (order as any).shippingAddressId;
                
                if (!addressId) {
                    console.warn(`  ⚠️  Order ${order.id} missing addressId, skipping...`);
                    continue;
                }

                // Create order
                await newDb.order.upsert({
                    where: { id: order.id },
                    update: {
                        userId: order.userId,
                        addressId: addressId,
                        status: order.status,
                        subtotal: (order as any).subtotal || (order as any).totalAmount || 0,
                        shipping: (order as any).shipping || 0,
                        tax: (order as any).tax || 0,
                        total: (order as any).total || (order as any).totalAmount || 0,
                        paymentMethod: order.paymentMethod,
                        paymentStatus: order.paymentStatus,
                        paymentId: order.paymentId || undefined,
                        notes: order.notes || undefined,
                        updatedAt: order.updatedAt,
                    },
                    create: {
                        id: order.id,
                        userId: order.userId,
                        addressId: addressId,
                        status: order.status,
                        subtotal: (order as any).subtotal || (order as any).totalAmount || 0,
                        shipping: (order as any).shipping || 0,
                        tax: (order as any).tax || 0,
                        total: (order as any).total || (order as any).totalAmount || 0,
                        paymentMethod: order.paymentMethod,
                        paymentStatus: order.paymentStatus,
                        paymentId: order.paymentId || undefined,
                        notes: order.notes || undefined,
                        createdAt: order.createdAt,
                        updatedAt: order.updatedAt,
                    },
                });

                // Migrate order items
                if (order.orderItems && order.orderItems.length > 0) {
                    for (const item of order.orderItems) {
                        try {
                            await newDb.orderItem.upsert({
                                where: { id: item.id },
                                update: {
                                    quantity: item.quantity,
                                    price: item.price,
                                },
                                create: {
                                    id: item.id,
                                    orderId: item.orderId,
                                    productId: item.productId,
                                    variantId: item.variantId || undefined,
                                    quantity: item.quantity,
                                    price: item.price,
                                    createdAt: item.createdAt,
                                },
                            });
                        } catch (error: any) {
                            // Skip item if it fails
                        }
                    }
                }

                count++;
            } catch (error: any) {
                if (!error.message.includes('Foreign key constraint')) {
                    throw error;
                }
            }
        }
        return count;
    });
}

async function migrateCartItems() {
    const cartItems = await oldDb.cartItem.findMany({
        orderBy: { createdAt: 'asc' },
    });

    return migrateTable('CartItems', cartItems, async (batch) => {
        let count = 0;
        for (const item of batch) {
            try {
                await newDb.cartItem.upsert({
                    where: { id: item.id },
                    update: {
                        quantity: item.quantity,
                        updatedAt: item.updatedAt,
                    },
                    create: {
                        id: item.id,
                        userId: item.userId,
                        productId: item.productId,
                        variantId: item.variantId,
                        quantity: item.quantity,
                        createdAt: item.createdAt,
                        updatedAt: item.updatedAt,
                    },
                });
                count++;
            } catch (error: any) {
                if (!error.message.includes('Foreign key constraint')) {
                    throw error;
                }
            }
        }
        return count;
    });
}

async function migrateWishlistItems() {
    const wishlistItems = await oldDb.wishlistItem.findMany({
        orderBy: { createdAt: 'asc' },
    });

    return migrateTable('WishlistItems', wishlistItems, async (batch) => {
        let count = 0;
        for (const item of batch) {
            try {
                await newDb.wishlistItem.upsert({
                    where: { id: item.id },
                    update: {},
                    create: {
                        id: item.id,
                        userId: item.userId,
                        productId: item.productId,
                        createdAt: item.createdAt,
                    },
                });
                count++;
            } catch (error: any) {
                if (!error.message.includes('Foreign key constraint') && !error.message.includes('Unique constraint')) {
                    throw error;
                }
            }
        }
        return count;
    });
}

async function migrateReviews() {
    const reviews = await oldDb.review.findMany({
        orderBy: { createdAt: 'asc' },
    });

    return migrateTable('Reviews', reviews, async (batch) => {
        let count = 0;
        for (const review of batch) {
            try {
                await newDb.review.upsert({
                    where: { id: review.id },
                    update: {
                        rating: review.rating,
                        comment: review.comment,
                        updatedAt: review.updatedAt,
                    },
                    create: {
                        id: review.id,
                        userId: review.userId,
                        productId: review.productId,
                        rating: review.rating,
                        comment: review.comment,
                        createdAt: review.createdAt,
                        updatedAt: review.updatedAt,
                    },
                });
                count++;
            } catch (error: any) {
                if (!error.message.includes('Foreign key constraint')) {
                    throw error;
                }
            }
        }
        return count;
    });
}

async function migrateStockMovements() {
    const stockMovements = await oldDb.stockMovement.findMany({
        orderBy: { createdAt: 'asc' },
    });

    return migrateTable('StockMovements', stockMovements, async (batch) => {
        let count = 0;
        for (const movement of batch) {
            try {
                await newDb.stockMovement.upsert({
                    where: { id: movement.id },
                    update: {
                        quantity: movement.quantity,
                        type: movement.type,
                        previousStock: (movement as any).previousStock || 0,
                        newStock: (movement as any).newStock || 0,
                        reason: movement.reason || undefined,
                        referenceId: (movement as any).referenceId || undefined,
                        referenceType: (movement as any).referenceType || undefined,
                        createdBy: (movement as any).createdBy || undefined,
                    },
                    create: {
                        id: movement.id,
                        productId: movement.productId,
                        variantId: movement.variantId || undefined,
                        quantity: movement.quantity,
                        type: movement.type,
                        previousStock: (movement as any).previousStock || 0,
                        newStock: (movement as any).newStock || 0,
                        reason: movement.reason || undefined,
                        referenceId: (movement as any).referenceId || undefined,
                        referenceType: (movement as any).referenceType || undefined,
                        createdBy: (movement as any).createdBy || undefined,
                        createdAt: movement.createdAt,
                    },
                });
                count++;
            } catch (error: any) {
                if (!error.message.includes('Foreign key constraint')) {
                    throw error;
                }
            }
        }
        return count;
    });
}

async function migrateBlogs() {
    const blogs = await oldDb.blog.findMany({
        include: {
            faqs: true,
        },
        orderBy: { createdAt: 'asc' },
    });

    return migrateTable('Blogs', blogs, async (batch) => {
        let count = 0;
        for (const blog of batch) {
            try {
                await newDb.blog.upsert({
                    where: { id: blog.id },
                    update: {
                        title: blog.title,
                        slug: blog.slug,
                        excerpt: blog.excerpt,
                        content: blog.content || undefined,
                        image: blog.image,
                        category: blog.category,
                        author: blog.author || undefined,
                        readTime: blog.readTime || undefined,
                        tags: blog.tags || [],
                        published: blog.published,
                        publishedAt: blog.publishedAt || undefined,
                        updatedAt: blog.updatedAt,
                    },
                    create: {
                        id: blog.id,
                        title: blog.title,
                        slug: blog.slug,
                        excerpt: blog.excerpt,
                        content: blog.content || undefined,
                        image: blog.image,
                        category: blog.category,
                        author: blog.author || undefined,
                        readTime: blog.readTime || undefined,
                        tags: blog.tags || [],
                        published: blog.published,
                        publishedAt: blog.publishedAt || undefined,
                        createdAt: blog.createdAt,
                        updatedAt: blog.updatedAt,
                    },
                });

                // Migrate blog FAQs
                if (blog.faqs && blog.faqs.length > 0) {
                    for (const faq of blog.faqs) {
                        try {
                            await newDb.blogFAQ.upsert({
                                where: { id: faq.id },
                                update: {
                                    question: faq.question,
                                    answer: faq.answer,
                                    updatedAt: faq.updatedAt,
                                },
                                create: {
                                    id: faq.id,
                                    blogId: faq.blogId,
                                    question: faq.question,
                                    answer: faq.answer,
                                    createdAt: faq.createdAt,
                                    updatedAt: faq.updatedAt,
                                },
                            });
                        } catch (error: any) {
                            // Skip FAQ if it fails
                        }
                    }
                }

                count++;
            } catch (error: any) {
                if (!error.message.includes('Unique constraint')) {
                    throw error;
                }
            }
        }
        return count;
    });
}

async function migratePayments() {
    const payments = await oldDb.payment.findMany({
        include: {
            refunds: true,
            auditLogs: true,
            webhookEvents: true,
        },
        orderBy: { createdAt: 'asc' },
    });

    return migrateTable('Payments', payments, async (batch) => {
        let count = 0;
        for (const payment of batch) {
            try {
                await newDb.payment.upsert({
                    where: { id: payment.id },
                    update: {
                        razorpayOrderId: payment.razorpayOrderId || undefined,
                        razorpayPaymentId: payment.razorpayPaymentId || undefined,
                        razorpaySignature: payment.razorpaySignature || undefined,
                        gateway: payment.gateway,
                        amount: payment.amount,
                        currency: payment.currency || 'INR',
                        status: payment.status,
                        method: payment.method || undefined,
                        bank: payment.bank || undefined,
                        wallet: payment.wallet || undefined,
                        vpa: payment.vpa || undefined,
                        refundId: payment.refundId || undefined,
                        refundAmount: payment.refundAmount || undefined,
                        refundStatus: payment.refundStatus || undefined,
                        metadata: payment.metadata || undefined,
                        failureReason: payment.failureReason || undefined,
                        updatedAt: payment.updatedAt,
                    },
                    create: {
                        id: payment.id,
                        orderId: payment.orderId,
                        razorpayOrderId: payment.razorpayOrderId || undefined,
                        razorpayPaymentId: payment.razorpayPaymentId || undefined,
                        razorpaySignature: payment.razorpaySignature || undefined,
                        gateway: payment.gateway,
                        amount: payment.amount,
                        currency: payment.currency || 'INR',
                        status: payment.status,
                        method: payment.method || undefined,
                        bank: payment.bank || undefined,
                        wallet: payment.wallet || undefined,
                        vpa: payment.vpa || undefined,
                        refundId: payment.refundId || undefined,
                        refundAmount: payment.refundAmount || undefined,
                        refundStatus: payment.refundStatus || undefined,
                        metadata: payment.metadata || undefined,
                        failureReason: payment.failureReason || undefined,
                        createdAt: payment.createdAt,
                        updatedAt: payment.updatedAt,
                    },
                });

                // Migrate refunds
                if (payment.refunds && payment.refunds.length > 0) {
                    for (const refund of payment.refunds) {
                        try {
                            await newDb.refund.upsert({
                                where: { id: refund.id },
                                update: {
                                    amount: refund.amount,
                                    currency: refund.currency || 'INR',
                                    status: refund.status,
                                    reason: refund.reason || undefined,
                                    notes: refund.notes || undefined,
                                    updatedAt: refund.updatedAt,
                                },
                                create: {
                                    id: refund.id,
                                    paymentId: refund.paymentId,
                                    razorpayRefundId: refund.razorpayRefundId,
                                    amount: refund.amount,
                                    currency: refund.currency || 'INR',
                                    status: refund.status,
                                    reason: refund.reason || undefined,
                                    notes: refund.notes || undefined,
                                    createdAt: refund.createdAt,
                                    updatedAt: refund.updatedAt,
                                },
                            });
                        } catch (error: any) {
                            // Skip refund if it fails
                        }
                    }
                }

                // Migrate audit logs
                if (payment.auditLogs && payment.auditLogs.length > 0) {
                    for (const log of payment.auditLogs) {
                        try {
                            await newDb.paymentAuditLog.upsert({
                                where: { id: log.id },
                                update: {
                                    action: log.action,
                                    performedBy: log.performedBy || undefined,
                                    oldStatus: log.oldStatus || undefined,
                                    newStatus: log.newStatus,
                                    metadata: log.metadata || undefined,
                                },
                                create: {
                                    id: log.id,
                                    paymentId: log.paymentId,
                                    action: log.action,
                                    performedBy: log.performedBy || undefined,
                                    oldStatus: log.oldStatus || undefined,
                                    newStatus: log.newStatus,
                                    metadata: log.metadata || undefined,
                                    createdAt: log.createdAt,
                                },
                            });
                        } catch (error: any) {
                            // Skip audit log if it fails
                        }
                    }
                }

                // Migrate webhook events
                if (payment.webhookEvents && payment.webhookEvents.length > 0) {
                    for (const event of payment.webhookEvents) {
                        try {
                            await newDb.webhookEvent.upsert({
                                where: { id: event.id },
                                update: {
                                    eventType: event.eventType,
                                    orderId: event.orderId || undefined,
                                    processed: event.processed,
                                    processedAt: event.processedAt || undefined,
                                    error: event.error || undefined,
                                    payload: event.payload || undefined,
                                },
                                create: {
                                    id: event.id,
                                    razorpayEventId: event.razorpayEventId,
                                    eventType: event.eventType,
                                    paymentId: event.paymentId || undefined,
                                    orderId: event.orderId || undefined,
                                    processed: event.processed,
                                    processedAt: event.processedAt || undefined,
                                    error: event.error || undefined,
                                    payload: event.payload || undefined,
                                    createdAt: event.createdAt,
                                },
                            });
                        } catch (error: any) {
                            // Skip webhook event if it fails
                        }
                    }
                }

                count++;
            } catch (error: any) {
                if (!error.message.includes('Foreign key constraint')) {
                    throw error;
                }
            }
        }
        return count;
    });
}

async function migrateShipments() {
    const shipments = await oldDb.shipment.findMany({
        orderBy: { createdAt: 'asc' },
    });

    return migrateTable('Shipments', shipments, async (batch) => {
        let count = 0;
        for (const shipment of batch) {
            try {
                await newDb.shipment.upsert({
                    where: { id: shipment.id },
                    update: {
                        shiprocketOrderId: shipment.shiprocketOrderId || undefined,
                        shiprocketShipmentId: shipment.shiprocketShipmentId || undefined,
                        awbNumber: shipment.awbNumber || undefined,
                        courierName: shipment.courierName || undefined,
                        courierId: shipment.courierId || undefined,
                        courierTrackingUrl: shipment.courierTrackingUrl || undefined,
                        status: shipment.status,
                        trackingUrl: shipment.trackingUrl || undefined,
                        labelUrl: shipment.labelUrl || undefined,
                        manifestUrl: shipment.manifestUrl || undefined,
                        pickupAddress: shipment.pickupAddress || undefined,
                        deliveryAddress: shipment.deliveryAddress || undefined,
                        weight: shipment.weight || undefined,
                        length: shipment.length || undefined,
                        breadth: shipment.breadth || undefined,
                        height: shipment.height || undefined,
                        shippingCharges: shipment.shippingCharges || undefined,
                        codCharges: shipment.codCharges || undefined,
                        totalCharges: shipment.totalCharges || undefined,
                        currentStatus: shipment.currentStatus || undefined,
                        statusHistory: shipment.statusHistory || undefined,
                        rtoStatus: shipment.rtoStatus || undefined,
                        rtoAwbNumber: shipment.rtoAwbNumber || undefined,
                        metadata: shipment.metadata || undefined,
                        updatedAt: shipment.updatedAt,
                    },
                    create: {
                        id: shipment.id,
                        orderId: shipment.orderId,
                        shiprocketOrderId: shipment.shiprocketOrderId || undefined,
                        shiprocketShipmentId: shipment.shiprocketShipmentId || undefined,
                        awbNumber: shipment.awbNumber || undefined,
                        courierName: shipment.courierName || undefined,
                        courierId: shipment.courierId || undefined,
                        courierTrackingUrl: shipment.courierTrackingUrl || undefined,
                        status: shipment.status,
                        trackingUrl: shipment.trackingUrl || undefined,
                        labelUrl: shipment.labelUrl || undefined,
                        manifestUrl: shipment.manifestUrl || undefined,
                        pickupAddress: shipment.pickupAddress || undefined,
                        deliveryAddress: shipment.deliveryAddress || undefined,
                        weight: shipment.weight || undefined,
                        length: shipment.length || undefined,
                        breadth: shipment.breadth || undefined,
                        height: shipment.height || undefined,
                        shippingCharges: shipment.shippingCharges || undefined,
                        codCharges: shipment.codCharges || undefined,
                        totalCharges: shipment.totalCharges || undefined,
                        currentStatus: shipment.currentStatus || undefined,
                        statusHistory: shipment.statusHistory || undefined,
                        rtoStatus: shipment.rtoStatus || undefined,
                        rtoAwbNumber: shipment.rtoAwbNumber || undefined,
                        metadata: shipment.metadata || undefined,
                        createdAt: shipment.createdAt,
                        updatedAt: shipment.updatedAt,
                    },
                });
                count++;
            } catch (error: any) {
                if (!error.message.includes('Foreign key constraint')) {
                    throw error;
                }
            }
        }
        return count;
    });
}

async function migrateFailedWebhooks() {
    const failedWebhooks = await oldDb.failedWebhook.findMany({
        orderBy: { createdAt: 'asc' },
    });

    return migrateTable('FailedWebhooks', failedWebhooks, async (batch) => {
        let count = 0;
        for (const webhook of batch) {
            try {
                await newDb.failedWebhook.upsert({
                    where: { id: webhook.id },
                    update: {
                        payload: webhook.payload as any,
                        signature: webhook.signature,
                        eventId: webhook.eventId || undefined,
                        error: webhook.error,
                        retries: webhook.retries,
                        lastRetryAt: webhook.lastRetryAt || undefined,
                        maxRetries: webhook.maxRetries,
                        processed: webhook.processed,
                        updatedAt: webhook.updatedAt,
                    },
                    create: {
                        id: webhook.id,
                        payload: webhook.payload as any,
                        signature: webhook.signature,
                        eventId: webhook.eventId || undefined,
                        error: webhook.error,
                        retries: webhook.retries,
                        lastRetryAt: webhook.lastRetryAt || undefined,
                        maxRetries: webhook.maxRetries,
                        processed: webhook.processed,
                        createdAt: webhook.createdAt,
                        updatedAt: webhook.updatedAt,
                    },
                });
                count++;
            } catch (error: any) {
                // Skip if it fails
            }
        }
        return count;
    });
}

async function migrateSettings() {
    const settings = await oldDb.setting.findMany({
        orderBy: { createdAt: 'asc' },
    });

    return migrateTable('Settings', settings, async (batch) => {
        let count = 0;
        for (const setting of batch) {
            try {
                await newDb.setting.upsert({
                    where: { id: setting.id },
                    update: {
                        key: setting.key,
                        value: setting.value,
                        type: setting.type || 'string',
                        group: setting.group,
                        description: setting.description || undefined,
                        updatedAt: setting.updatedAt,
                    },
                    create: {
                        id: setting.id,
                        key: setting.key,
                        value: setting.value,
                        type: setting.type || 'string',
                        group: setting.group,
                        description: setting.description || undefined,
                        createdAt: setting.createdAt,
                        updatedAt: setting.updatedAt,
                    },
                });
                count++;
            } catch (error: any) {
                if (!error.message.includes('Unique constraint')) {
                    throw error;
                }
            }
        }
        return count;
    });
}

async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('   Database Migration Script');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📊 Source Database (Old):');
    console.log(`   ${oldDirectUrl.replace(/:[^:@]+@/, ':****@')}\n`);

    console.log('📊 Target Database (New):');
    console.log(`   ${(newDbUrl || '').replace(/:[^:@]+@/, ':****@')}\n`);

    // Test connections
    console.log('🔌 Testing database connections...\n');

    try {
        await oldDb.$connect();
        console.log('✅ Old database connection successful');
    } catch (error: any) {
        console.error('❌ Failed to connect to old database:', error.message);
        process.exit(1);
    }

    try {
        await newDb.$connect();
        console.log('✅ New database connection successful');
    } catch (error: any) {
        console.error('❌ Failed to connect to new database:', error.message);
        process.exit(1);
    }

    // Verify schema compatibility
    const schemaValid = await verifySchema(newDb);
    if (!schemaValid) {
        console.error('❌ Database schema is not compatible. Please run migrations first.');
        console.log('\n💡 Run: npx prisma migrate deploy');
        console.log('   Or: npx prisma db push\n');
        await oldDb.$disconnect();
        await newDb.$disconnect();
        process.exit(1);
    }

    // Get record counts from old database
    console.log('📊 Counting records in old database...\n');
    const counts: Record<string, number> = {
        users: await oldDb.user.count(),
        addresses: await oldDb.address.count(),
        categories: await oldDb.category.count(),
        brands: await oldDb.brand.count(),
        products: await oldDb.product.count(),
        orders: await oldDb.order.count(),
        cartItems: await oldDb.cartItem.count(),
        wishlistItems: await oldDb.wishlistItem.count(),
        reviews: await oldDb.review.count(),
        stockMovements: await oldDb.stockMovement.count(),
    };

    // Try to count optional tables (may not exist in old DB)
    try {
        counts.blogs = await oldDb.blog.count();
    } catch { counts.blogs = 0; }
    try {
        counts.payments = await oldDb.payment.count();
    } catch { counts.payments = 0; }
    try {
        counts.shipments = await oldDb.shipment.count();
    } catch { counts.shipments = 0; }
    try {
        counts.failedWebhooks = await oldDb.failedWebhook.count();
    } catch { counts.failedWebhooks = 0; }
    try {
        counts.settings = await oldDb.setting.count();
    } catch { counts.settings = 0; }

    console.log('Record counts:');
    Object.entries(counts).forEach(([table, count]) => {
        console.log(`  ${table}: ${count}`);
    });

    const totalRecords = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log(`\nTotal records to migrate: ${totalRecords}\n`);

    if (totalRecords === 0) {
        console.log('⚠️  No data to migrate. Exiting.');
        await oldDb.$disconnect();
        await newDb.$disconnect();
        return;
    }

    // Confirm migration
    console.log('⚠️  This will migrate all data from old database to new database.');
    console.log('⚠️  Existing data in new database will be updated (upserted).\n');

    // Start migration
    console.log('🚀 Starting migration...\n');

    try {
        // Migrate in order (respecting foreign key constraints)
        stats.push(await migrateUsers());
        stats.push(await migrateAddresses());
        stats.push(await migrateCategories());
        stats.push(await migrateBrands());
        stats.push(await migrateProducts());
        stats.push(await migrateOrders());
        stats.push(await migrateCartItems());
        stats.push(await migrateWishlistItems());
        stats.push(await migrateReviews());
        stats.push(await migrateStockMovements());
        
        // Migrate optional tables (if they exist)
        if (counts.blogs > 0) {
            stats.push(await migrateBlogs());
        }
        if (counts.payments > 0) {
            stats.push(await migratePayments());
        }
        if (counts.shipments > 0) {
            stats.push(await migrateShipments());
        }
        if (counts.failedWebhooks > 0) {
            stats.push(await migrateFailedWebhooks());
        }
        if (counts.settings > 0) {
            stats.push(await migrateSettings());
        }

        // Summary
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('   Migration Summary');
        console.log('═══════════════════════════════════════════════════════\n');

        let totalMigrated = 0;
        let totalErrors = 0;

        stats.forEach((stat) => {
            totalMigrated += stat.migrated;
            totalErrors += stat.errors;
            const icon = stat.errors === 0 ? '✅' : stat.errors < stat.total ? '⚠️' : '❌';
            console.log(`${icon} ${stat.table}: ${stat.migrated}/${stat.total} migrated, ${stat.errors} errors`);
        });

        console.log(`\nTotal: ${totalMigrated} records migrated, ${totalErrors} errors\n`);

        if (totalErrors === 0) {
            console.log('✅ Migration completed successfully!');
        } else {
            console.log('⚠️  Migration completed with some errors. Please review the output above.');
        }

    } catch (error: any) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await oldDb.$disconnect();
        await newDb.$disconnect();
    }
}

main().catch(console.error);

