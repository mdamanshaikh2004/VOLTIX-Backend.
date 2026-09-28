const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redisClient, connectRedis } = require('../config/redis');

connectRedis();

const envNumber = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const authWindowMs = envNumber('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000);
const authMax = envNumber('AUTH_RATE_LIMIT_MAX', process.env.NODE_ENV === 'production' ? 10 : 30);

const buildLimiter = ({ windowMs, max, message, prefix }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message },
    statusCode: 429,
    passOnStoreError: true,
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: `rl:${prefix}:`,
    }),
  });

const registerLimiter = buildLimiter({
  windowMs: authWindowMs, max: authMax,
  message: 'Too many registration attempts. Please try again shortly.',
  prefix: 'register',
});

const loginLimiter = buildLimiter({
  windowMs: authWindowMs, max: authMax,
  message: 'Too many login attempts. Please try again shortly.',
  prefix: 'login',
});


const emailVerificationLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000, max: process.env.NODE_ENV === 'production' ? 5 : 15,
  message: 'Too many email verification requests. Please try again later.',
  prefix: 'email-verification',
});

const passwordResetLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000, max: process.env.NODE_ENV === 'production' ? 8 : 20,
  message: 'Too many password reset requests. Please try again later.',
  prefix: 'password-reset',
});

const paymentLimiter = buildLimiter({
  windowMs: 10 * 60 * 1000, max: 20,
  message: 'Too many payment requests. Please slow down.',
  prefix: 'payment',
});

const generalLimiter = buildLimiter({
  windowMs: 60 * 1000, max: 120,
  message: 'Too many requests. Please slow down.',
  prefix: 'general',
});

module.exports = { registerLimiter, loginLimiter, passwordResetLimiter, emailVerificationLimiter, paymentLimiter, generalLimiter };
