// Server-side only: Prevent bundling ioredis in browser/edge runtime
// Dynamic import to prevent bundling in browser
let RedisModule: any = null;
type RedisClient = any; // Type from ioredis

// Lazy load Redis only on server-side
function getRedisModule(): any {
    // Only load on server-side (Node.js environment)
    if (typeof window !== 'undefined') {
        return null; // Browser environment
    }
    
    if (!RedisModule) {
        try {
            // Use require to prevent bundling in browser
            // This will only execute in Node.js runtime
            const ioredis = require('ioredis');
            RedisModule = ioredis.default || ioredis;
        } catch (error) {
            // Redis not available (e.g., in edge runtime or browser)
            return null;
        }
    }
    return RedisModule;
}

// Get Redis configuration from environment
function getRedisConfig() {
    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    const redisPassword = process.env.REDIS_PASSWORD;

    // Prefer individual config if all components are available (more reliable for password)
    if (redisHost && redisPort && redisPassword) {
        return {
            host: redisHost,
            port: redisPort,
            password: redisPassword,
            retryStrategy: (times: number) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            enableOfflineQueue: false,
        };
    }

    // Fallback to URL if individual config not available
    if (redisUrl) {
        return { 
            url: redisUrl,
            password: redisPassword, // Include password for fallback
        };
    }

    // Default config
    return {
        host: redisHost,
        port: redisPort,
        password: redisPassword || undefined,
        retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: false,
    };
}

let redisClient: RedisClient | null = null;

/**
 * Reset Redis client (useful for reconnection after errors)
 */
export function resetRedisClient() {
    if (redisClient) {
        redisClient.disconnect();
        redisClient = null;
    }
}

/**
 * Get or create Redis client instance
 * Singleton pattern to reuse connection
 */
export function getRedisClient(): RedisClient | null {
    // Always reset if client exists and has errors (especially auth errors)
    if (redisClient) {
        const status = redisClient.status;
        // Reset if not ready or if there were previous errors
        if (status !== 'ready' && status !== 'connecting') {
            resetRedisClient();
        } else if (status === 'ready') {
            // Client is ready, return it
            return redisClient;
        }
    }

    try {
        // Ensure Redis module is loaded (server-side only)
        const RedisModule = getRedisModule();
        if (!RedisModule) {
            console.warn('Redis module not available (likely in browser/edge runtime)');
            return null;
        }

        const config = getRedisConfig();
        
        // ALWAYS prefer individual config if available (more reliable for password)
        // Check if we have individual config components
        const hasIndividualConfig = config.host && config.port && config.password;
        
        if (hasIndividualConfig) {
            console.log('Using individual Redis config:', {
                host: config.host,
                port: config.port,
                passwordSet: !!config.password,
                passwordLength: config.password?.length || 0
            });
            redisClient = new RedisModule({
                    host: config.host!,
                    port: config.port!,
                    password: config.password! || '',
                retryStrategy: config.retryStrategy,
                maxRetriesPerRequest: config.maxRetriesPerRequest,
                enableReadyCheck: config.enableReadyCheck,
                enableOfflineQueue: config.enableOfflineQueue,
            });
        } else if (config.url) {
            console.log('Using Redis URL config');
            // Parse URL to extract components
            // URL format: redis://:password@host:port or redis://password@host:port
            try {
                const urlObj = new URL(config.url);
                const host = urlObj.hostname || 'localhost';
                const port = parseInt(urlObj.port || '6379', 10);
                // Extract password from URL (format: redis://:password@host or redis://password@host)
                // The format redis://:password@host means empty username, password after colon
                let password: string | undefined = urlObj.password;
                
                // If no password in URL, try username (some formats use username for password)
                if (!password && urlObj.username) {
                    password = urlObj.username;
                }
                
                // Fallback to explicit password from config/environment (critical for authentication)
                if (!password && config.password) {
                    password = config.password;
                }
                
                // If still no password, try environment variable directly
                if (!password) {
                    password = process.env.REDIS_PASSWORD;
                }
                
                // Ensure password is set - required for authenticated Redis
                if (!password) {
                    console.error('Redis password not found. Please set REDIS_PASSWORD environment variable.');
                    throw new Error('Redis password required but not found');
                }
                
                // At this point, TypeScript knows password is defined
                const finalPassword: string = password;
                
                redisClient = new RedisModule({
                    host,
                    port,
                    password: finalPassword,
                    retryStrategy: (times: number) => {
                        const delay = Math.min(times * 50, 2000);
                        return delay;
                    },
                    maxRetriesPerRequest: 3,
                    enableReadyCheck: true,
                    enableOfflineQueue: false,
                });
            } catch (error: any) {
                // If URL parsing fails, use individual config
                redisClient = new RedisModule({
                    host: config.host || 'localhost',
                    port: config.port || 6379,
                    password: config.password,
                    retryStrategy: (times: number) => {
                        const delay = Math.min(times * 50, 2000);
                        return delay;
                    },
                    maxRetriesPerRequest: 3,
                    enableReadyCheck: true,
                    enableOfflineQueue: false,
                });
            }
        } else {
            redisClient = new RedisModule({
                host: config.host,
                port: config.port,
                password: config.password,
                retryStrategy: config.retryStrategy,
                maxRetriesPerRequest: config.maxRetriesPerRequest,
                enableReadyCheck: config.enableReadyCheck,
                enableOfflineQueue: config.enableOfflineQueue,
            });
        }

        // Error handling
        redisClient.on('error', (error: any) => {
            console.error('Redis connection error:', error);
            // Reset client on authentication errors to allow retry with correct credentials
            if (error.message && (error.message.includes('NOAUTH') || error.message.includes('Authentication'))) {
                console.warn('Redis authentication failed, resetting client for retry...');
                setTimeout(() => {
                    resetRedisClient();
                }, 1000);
            }
            // Don't throw - allow graceful degradation
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis connected');
        });

        redisClient.on('ready', () => {
            console.log('✅ Redis ready');
        });

        return redisClient;
    } catch (error) {
        console.error('Failed to create Redis client:', error);
        return null;
    }
}

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
    const client = getRedisClient();
    if (!client) {
        return false;
    }

    try {
        // Wait for client to be ready if it's connecting
        if (client.status === 'connecting' || client.status === 'wait') {
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Redis connection timeout'));
                }, 5000);
                
                client.once('ready', () => {
                    clearTimeout(timeout);
                    resolve();
                });
                
                client.once('error', (error: any) => {
                    clearTimeout(timeout);
                    reject(error);
                });
            });
        }
        
        // Test with ping
        const result = await client.ping();
        return result === 'PONG';
    } catch (error: any) {
        // If authentication error, reset client
        if (error.message && error.message.includes('NOAUTH')) {
            resetRedisClient();
        }
        return false;
    }
}

/**
 * Wait for Redis client to be ready
 */
async function waitForRedisReady(client: RedisClient | null): Promise<boolean> {
    if (!client) {
        return false;
    }

    if (client.status === 'ready') {
        return true;
    }

    if (client.status === 'end' || client.status === 'close') {
        return false;
    }

    // Wait for ready event
    return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
            resolve(false);
        }, 5000);

        if (client.status === 'ready') {
            clearTimeout(timeout);
            resolve(true);
            return;
        }

        client.once('ready', () => {
            clearTimeout(timeout);
            resolve(true);
        });

        client.once('error', () => {
            clearTimeout(timeout);
            resolve(false);
        });
    });
}

/**
 * Cache helper functions
 */
export class CacheService {
    /**
     * Get Redis client (always get fresh client to ensure correct credentials)
     */
    private getClient(): RedisClient | null {
        return getRedisClient();
    }

    /**
     * Get value from cache
     */
    async get<T>(key: string): Promise<T | null> {
        const client = this.getClient();
        if (!client) {
            return null;
        }

        // Ensure client is ready before operations
        const ready = await waitForRedisReady(client);
        if (!ready) {
            return null;
        }

        try {
            const value = await client.get(key);
            if (!value) {
                return null;
            }
            return JSON.parse(value) as T;
        } catch (error) {
            console.error(`Redis GET error for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Set value in cache with optional TTL
     */
    async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
        const client = this.getClient();
        if (!client) {
            return false;
        }

        // Ensure client is ready before operations
        const ready = await waitForRedisReady(client);
        if (!ready) {
            return false;
        }

        try {
            const serialized = JSON.stringify(value);
            if (ttlSeconds) {
                await client.setex(key, ttlSeconds, serialized);
            } else {
                await client.set(key, serialized);
            }
            return true;
        } catch (error) {
            console.error(`Redis SET error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Delete value from cache
     */
    async delete(key: string): Promise<boolean> {
        const client = this.getClient();
        if (!client) {
            return false;
        }

        // Ensure client is ready before operations
        const ready = await waitForRedisReady(client);
        if (!ready) {
            return false;
        }

        try {
            await client.del(key);
            return true;
        } catch (error) {
            console.error(`Redis DELETE error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Delete multiple keys matching pattern
     */
    async deletePattern(pattern: string): Promise<number> {
        const client = this.getClient();
        if (!client) {
            return 0;
        }

        // Ensure client is ready before operations
        const ready = await waitForRedisReady(client);
        if (!ready) {
            return 0;
        }

        try {
            const keys = await client.keys(pattern);
            if (keys.length === 0) {
                return 0;
            }
            return await client.del(...keys);
        } catch (error) {
            console.error(`Redis DELETE PATTERN error for ${pattern}:`, error);
            return 0;
        }
    }

    /**
     * Check if key exists
     */
    async exists(key: string): Promise<boolean> {
        const client = this.getClient();
        if (!client) {
            return false;
        }

        // Ensure client is ready before operations
        const ready = await waitForRedisReady(client);
        if (!ready) {
            return false;
        }

        try {
            const result = await client.exists(key);
            return result === 1;
        } catch (error) {
            console.error(`Redis EXISTS error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Increment counter
     */
    async increment(key: string, by: number = 1): Promise<number | null> {
        const client = this.getClient();
        if (!client) {
            return null;
        }

        // Ensure client is ready before operations
        const ready = await waitForRedisReady(client);
        if (!ready) {
            return null;
        }

        try {
            return await client.incrby(key, by);
        } catch (error) {
            console.error(`Redis INCREMENT error for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Set expiration on key
     */
    async expire(key: string, seconds: number): Promise<boolean> {
        const client = this.getClient();
        if (!client) {
            return false;
        }

        // Ensure client is ready before operations
        const ready = await waitForRedisReady(client);
        if (!ready) {
            return false;
        }

        try {
            const result = await client.expire(key, seconds);
            return result === 1;
        } catch (error) {
            console.error(`Redis EXPIRE error for key ${key}:`, error);
            return false;
        }
    }
}

// Export singleton instance
export const cache = new CacheService();

// Close Redis connection on process exit
// Only register handlers in Node.js runtime (not Edge Runtime)
// Edge Runtime doesn't support process.on, so we check for it
if (typeof process !== 'undefined' && 
    process.env && 
    typeof process.on === 'function' &&
    // Check if we're NOT in Edge Runtime
    process.env.NEXT_RUNTIME !== 'edge') {
    try {
        process.on('SIGTERM', () => {
            if (redisClient) {
                redisClient.disconnect();
            }
        });

        process.on('SIGINT', () => {
            if (redisClient) {
                redisClient.disconnect();
            }
        });
    } catch (error) {
        // Ignore errors in Edge Runtime or other unsupported environments
        // This is expected and safe to ignore
    }
}

