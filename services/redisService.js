const { redisClient, connectRedis } = require('../config/redis');

const DEFAULT_TTL_SECONDS = 60 * 5; // 5 minutes for product list/detail caches

// Reads a JSON value from Redis. Returns null on cache miss OR if Redis is
// unavailable, so callers can transparently fall back to MongoDB.
const getCache = async (key) => {
  try {
    await connectRedis();
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    console.error(`Redis GET failed for ${key}:`, err.message);
    return null;
  }
};

const setCache = async (key, value, ttlSeconds = DEFAULT_TTL_SECONDS) => {
  try {
    await connectRedis();
    await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (err) {
    console.error(`Redis SET failed for ${key}:`, err.message);
  }
};

// Deletes all keys matching a prefix, e.g. "products:*" after a product
// is created/updated/deleted so stale lists are never served.
const invalidateByPrefix = async (prefix) => {
  try {
    await connectRedis();
    let cursor = 0;
    do {
      const result = await redisClient.scan(cursor, { MATCH: `${prefix}*`, COUNT: 100 });
      cursor = result.cursor;
      if (result.keys.length) {
        await redisClient.del(result.keys);
      }
    } while (cursor !== 0);
  } catch (err) {
    console.error(`Redis invalidation failed for prefix ${prefix}:`, err.message);
  }
};

module.exports = { getCache, setCache, invalidateByPrefix, DEFAULT_TTL_SECONDS };
