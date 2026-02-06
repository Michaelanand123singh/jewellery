import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/redis';

const RATE_LIMIT_WINDOW = 60; // 60 seconds
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute per IP
const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB

// Fallback in-memory rate limiting (if Redis is not available)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Clean up every 5 minutes
const MAX_MAP_SIZE = 10000; // Prevent unbounded growth

let lastCleanup = Date.now();

function cleanupExpiredEntries() {
    const now = Date.now();
    
    if (now - lastCleanup < CLEANUP_INTERVAL && rateLimitMap.size < MAX_MAP_SIZE) {
        return;
    }
    
    lastCleanup = now;
    
    for (const [key, record] of rateLimitMap.entries()) {
        if (now > record.resetTime) {
            rateLimitMap.delete(key);
        }
    }
    
    if (rateLimitMap.size > MAX_MAP_SIZE) {
        const entries = Array.from(rateLimitMap.entries())
            .sort((a, b) => a[1].resetTime - b[1].resetTime);
        
        const toRemove = entries.slice(0, Math.floor(entries.length * 0.2));
        toRemove.forEach(([key]) => rateLimitMap.delete(key));
    }
}

function getRateLimitKey(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    const path = request.nextUrl.pathname;
    return `rate_limit:${ip}:${path}`;
}

async function checkRateLimit(key: string, maxRequests: number = RATE_LIMIT_MAX_REQUESTS): Promise<boolean> {
    // Try Redis first
    const redisAvailable = await cache.exists(key);
    
    if (redisAvailable) {
        try {
            const count = await cache.increment(key, 1);
            if (count && count > maxRequests) {
                return false;
            }
            // Set expiration if this is the first request
            if (count === 1) {
                await cache.expire(key, RATE_LIMIT_WINDOW);
            }
            return true;
        } catch (error) {
            // Fall back to in-memory if Redis fails
            console.warn('Redis rate limit check failed, falling back to in-memory:', error);
        }
    } else {
        // First request - initialize in Redis
        try {
            await cache.set(key, 1, RATE_LIMIT_WINDOW);
            return true;
        } catch (error) {
            // Fall back to in-memory if Redis fails
            console.warn('Redis rate limit set failed, falling back to in-memory:', error);
        }
    }

    // Fallback to in-memory rate limiting
    cleanupExpiredEntries();
    
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW * 1000 });
        return true;
    }

    if (record.count >= maxRequests) {
        return false;
    }

    record.count++;
    return true;
}

function checkRequestSize(request: NextRequest): boolean {
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
        return parseInt(contentLength, 10) <= MAX_REQUEST_SIZE;
    }
    return true;
}

export async function middleware(request: NextRequest) {
    // Skip rate limiting for static assets
    if (
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.startsWith('/api/health') ||
        request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
    ) {
        return NextResponse.next();
    }

    // Check request size
    if (!checkRequestSize(request)) {
        return NextResponse.json(
            { success: false, error: 'Request too large' },
            { status: 413 }
        );
    }

    // Apply rate limiting to API routes
    if (request.nextUrl.pathname.startsWith('/api')) {
        const path = request.nextUrl.pathname;
        
        // Stricter rate limiting for payment endpoints
        let maxRequests = RATE_LIMIT_MAX_REQUESTS;
        if (path.startsWith('/api/v1/payments')) {
            maxRequests = 10; // 10 requests per minute for payment endpoints
        } else if (path.startsWith('/api/webhooks/razorpay')) {
            maxRequests = 30; // 30 requests per minute for webhooks
        }
        
        const rateLimitKey = getRateLimitKey(request);
        
        const allowed = await checkRateLimit(rateLimitKey, maxRequests);
        
        if (!allowed) {
            return NextResponse.json(
                { success: false, error: 'Too many requests. Please try again later.' },
                { 
                    status: 429,
                    headers: {
                        'Retry-After': '60',
                    },
                }
            );
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
