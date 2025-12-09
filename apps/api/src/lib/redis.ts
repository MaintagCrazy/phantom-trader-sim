import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (!redis) {
    try {
      redis = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) {
            console.warn('Redis connection failed, falling back to no cache');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
      });

      redis.on('error', (err) => {
        console.error('Redis error:', err.message);
      });

      redis.on('connect', () => {
        console.log('✅ Connected to Redis');
      });
    } catch (error) {
      console.warn('Redis not available, running without cache');
      return null;
    }
  }
  return redis;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Ignore cache errors
  }
}

export async function cacheDel(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.del(key);
  } catch {
    // Ignore cache errors
  }
}

export default { getRedis, cacheGet, cacheSet, cacheDel };
