import Redis from 'ioredis';
import { logger } from '../utils/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  retryStrategy(times) {
    if (times > 5) return null; // Stop retrying after 5 attempts
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

let redisConnected = false;

redis.on('connect', () => {
  redisConnected = true;
  logger.info('Redis client connected');
});

redis.on('error', (err) => {
  redisConnected = false;
  logger.warn('Redis client error (cache disabled):', err.message);
});

// Cache utilities with graceful fallback
export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (!redisConnected) return null;
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
};

export const cacheSet = async (
  key: string,
  value: unknown,
  ttlSeconds: number = 3600
): Promise<void> => {
  if (!redisConnected) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // Silently fail - cache is optional
  }
};

export const cacheDelete = async (key: string): Promise<void> => {
  if (!redisConnected) return;
  try {
    await redis.del(key);
  } catch {
    // Silently fail
  }
};

export const cacheDeletePattern = async (pattern: string): Promise<void> => {
  if (!redisConnected) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // Silently fail
  }
};
