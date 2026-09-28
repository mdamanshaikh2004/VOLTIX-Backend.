require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');
const { connectRedis, redisClient } = require('./config/redis');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { handleStripeWebhook } = require('./controllers/paymentController');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
app.disable('x-powered-by');

connectDB();
connectRedis();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// ---------------------------------------------------------------------
// IMPORTANT: The Stripe webhook route MUST be registered with express.raw()
// BEFORE express.json() is applied globally. Stripe signs the raw request
// body, so if express.json() parses it first, signature verification in
// stripeService.constructWebhookEvent() will always fail.
// ---------------------------------------------------------------------
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Now safe to apply JSON body parsing globally for every other route.
app.use(express.json({ limit: '1mb' }));

const { isConfigured: emailConfigured } = require('./services/emailService');

app.get('/api/health', (req, res) => {
  const services = {
    database: mongoose.connection.readyState === 1,
    redis: Boolean(redisClient.isOpen),
    email: emailConfigured,
  };
  const healthy = services.database && services.email;
  res.status(healthy ? 200 : 503).json({ success: healthy, message: healthy ? 'VOLTIX API is healthy' : 'VOLTIX API is not ready', services });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
  console.log(`VOLTIX API listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
    console.error(`Stop the process using port ${PORT}, or set PORT to another free port in .env.`);
    process.exit(1);
  }
  console.error('Failed to start VOLTIX API:', error);
  process.exit(1);
});
