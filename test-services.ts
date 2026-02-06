/**
 * Comprehensive Service Testing Script
 * Tests Redis, MinIO, and PostgreSQL connections and operations
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import { getRedisClient, cache, isRedisAvailable } from './lib/redis';
import { getStorageClient, storage, isStorageConfigured, getPublicUrl } from './lib/storage';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
    service: string;
    status: 'PASS' | 'FAIL' | 'SKIP';
    message: string;
    details?: any;
}

const results: TestResult[] = [];

function logResult(result: TestResult) {
    results.push(result);
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${result.service}: ${result.message}`);
    if (result.details) {
        console.log(`   Details:`, result.details);
    }
}

async function testPostgreSQL() {
    console.log('\n📊 Testing PostgreSQL...\n');
    
    try {
        // Test connection
        await prisma.$connect();
        logResult({
            service: 'PostgreSQL',
            status: 'PASS',
            message: 'Connection successful'
        });

        // Test query
        const result = await prisma.$queryRaw`SELECT version() as version`;
        logResult({
            service: 'PostgreSQL',
            status: 'PASS',
            message: 'Query execution successful',
            details: result
        });

        // Test table access (check if tables exist)
        try {
            const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
                SELECT tablename FROM pg_tables WHERE schemaname = 'public' LIMIT 5
            `;
            logResult({
                service: 'PostgreSQL',
                status: 'PASS',
                message: `Database accessible - ${tables.length} tables found`,
                details: { tables: tables.map(t => t.tablename) }
            });
        } catch (error: any) {
            logResult({
                service: 'PostgreSQL',
                status: 'SKIP',
                message: 'Tables not found - migrations may need to be run',
                details: { hint: 'Run: npx prisma migrate deploy' }
            });
        }

    } catch (error: any) {
        logResult({
            service: 'PostgreSQL',
            status: 'FAIL',
            message: `Connection failed: ${error.message}`,
            details: error
        });
    } finally {
        await prisma.$disconnect();
    }
}

async function testRedis() {
    console.log('\n🔴 Testing Redis...\n');
    
    try {
        // Test connection
        const available = await isRedisAvailable();
        if (!available) {
            logResult({
                service: 'Redis',
                status: 'FAIL',
                message: 'Redis not available - connection failed'
            });
            return;
        }

        logResult({
            service: 'Redis',
            status: 'PASS',
            message: 'Connection successful'
        });

        // Test SET operation
        const setResult = await cache.set('test:key', { test: 'value' }, 60);
        if (setResult) {
            logResult({
                service: 'Redis',
                status: 'PASS',
                message: 'SET operation successful'
            });
        } else {
            logResult({
                service: 'Redis',
                status: 'FAIL',
                message: 'SET operation failed'
            });
        }

        // Test GET operation
        const getResult = await cache.get<{ test: string }>('test:key');
        if (getResult && getResult.test === 'value') {
            logResult({
                service: 'Redis',
                status: 'PASS',
                message: 'GET operation successful',
                details: getResult
            });
        } else {
            logResult({
                service: 'Redis',
                status: 'FAIL',
                message: 'GET operation failed or returned incorrect value'
            });
        }

        // Test DELETE operation
        const deleteResult = await cache.delete('test:key');
        if (deleteResult) {
            logResult({
                service: 'Redis',
                status: 'PASS',
                message: 'DELETE operation successful'
            });
        } else {
            logResult({
                service: 'Redis',
                status: 'FAIL',
                message: 'DELETE operation failed'
            });
        }

        // Test INCREMENT
        await cache.set('test:counter', 0, 60);
        const incResult = await cache.increment('test:counter', 1);
        if (incResult === 1) {
            logResult({
                service: 'Redis',
                status: 'PASS',
                message: 'INCREMENT operation successful'
            });
        } else {
            logResult({
                service: 'Redis',
                status: 'FAIL',
                message: 'INCREMENT operation failed'
            });
        }

        // Cleanup
        await cache.delete('test:counter');

    } catch (error: any) {
        logResult({
            service: 'Redis',
            status: 'FAIL',
            message: `Redis test failed: ${error.message}`,
            details: error
        });
    }
}

async function testMinIO() {
    console.log('\n📦 Testing MinIO...\n');
    
    try {
        // Test configuration
        if (!isStorageConfigured()) {
            logResult({
                service: 'MinIO',
                status: 'FAIL',
                message: 'MinIO not configured - missing environment variables'
            });
            return;
        }

        logResult({
            service: 'MinIO',
            status: 'PASS',
            message: 'Configuration valid'
        });

        // Test client creation
        const client = getStorageClient();
        if (client) {
            logResult({
                service: 'MinIO',
                status: 'PASS',
                message: 'Client created successfully'
            });
        } else {
            logResult({
                service: 'MinIO',
                status: 'FAIL',
                message: 'Client creation failed'
            });
            return;
        }

        // Test public URL generation
        const testUrl = getPublicUrl('test/file.jpg');
        logResult({
            service: 'MinIO',
            status: 'PASS',
            message: 'Public URL generation works',
            details: { url: testUrl }
        });

        // Note: Actual upload/delete tests require file operations
        // These would be tested via API endpoints

    } catch (error: any) {
        logResult({
            service: 'MinIO',
            status: 'FAIL',
            message: `MinIO test failed: ${error.message}`,
            details: error
        });
    }
}

async function testEnvironmentVariables() {
    console.log('\n🔧 Testing Environment Variables...\n');
    
    const requiredVars = {
        'DATABASE_URL': process.env.DATABASE_URL,
        'REDIS_URL': process.env.REDIS_URL || (process.env.REDIS_HOST && process.env.REDIS_PORT ? 'configured' : undefined),
        'MINIO_ENDPOINT': process.env.MINIO_ENDPOINT,
        'MINIO_ACCESS_KEY': process.env.MINIO_ACCESS_KEY,
        'MINIO_SECRET_KEY': process.env.MINIO_SECRET_KEY,
        'MINIO_BUCKET_NAME': process.env.MINIO_BUCKET_NAME,
    };

    for (const [key, value] of Object.entries(requiredVars)) {
        if (value) {
            logResult({
                service: 'Environment',
                status: 'PASS',
                message: `${key} is set`
            });
        } else {
            logResult({
                service: 'Environment',
                status: 'FAIL',
                message: `${key} is missing`
            });
        }
    }
}

async function runAllTests() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('   Service Integration Test Suite');
    console.log('═══════════════════════════════════════════════════════\n');

    await testEnvironmentVariables();
    await testPostgreSQL();
    await testRedis();
    await testMinIO();

    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('   Test Summary');
    console.log('═══════════════════════════════════════════════════════\n');

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const skipped = results.filter(r => r.status === 'SKIP').length;

    console.log(`Total Tests: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Skipped: ${skipped}`);

    if (failed > 0) {
        console.log('\n❌ Failed Tests:');
        results.filter(r => r.status === 'FAIL').forEach(r => {
            console.log(`   - ${r.service}: ${r.message}`);
        });
    }

    console.log('\n═══════════════════════════════════════════════════════\n');

    process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(console.error);

