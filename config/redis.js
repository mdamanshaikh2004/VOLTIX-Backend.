const { createClient } = require('redis');

// Single shared Redis client used for product caching and rate limiting.
// REDIS_URL must be a plain connection string, e.g.
//   redis://default:PASSWORD@HOST:PORT
const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => {
  // Log but don't crash the app — routes fall back to MongoDB if Redis is down.
  console.error('Redis Client Error:', err.message);
});

redisClient.on('connect', () => {
  console.log('Redis connected');
});

let isConnecting = null;

// Lazily connect once; safe to call multiple times.
const connectRedis = async () => {
  if (redisClient.isOpen) return redisClient;
  if (!isConnecting) {
    isConnecting = redisClient.connect().catch((err) => {
      console.error('Redis connection failed, continuing without cache:', err.message);
      isConnecting = null;
    });
  }
  await isConnecting;
  return redisClient;
};

module.exports = { redisClient, connectRedis };
