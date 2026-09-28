const express = require('express');
const router = express.Router();
const { createCheckoutSessionHandler } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { paymentLimiter } = require('../middleware/rateLimiter');

// NOTE: the webhook route (/api/payment/webhook) is intentionally NOT here —
// it's registered directly in server.js with express.raw() before the
// global express.json() middleware, since Stripe needs the raw request body
// to verify its signature. See server.js for details.

router.post('/create-checkout-session', protect, paymentLimiter, createCheckoutSessionHandler);

module.exports = router;
