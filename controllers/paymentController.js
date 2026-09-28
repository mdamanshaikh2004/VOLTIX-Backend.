const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const User = require('../models/User');
const { createCheckoutSession, constructWebhookEvent } = require('../services/stripeService');
const { invalidateProductCache } = require('./productController');

// POST /api/payment/create-checkout-session  Body: { orderId }
const createCheckoutSessionHandler = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this order' });
    }
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Order has already been paid' });
    }

    const session = await createCheckoutSession({ order, user: req.user });

    order.stripeSessionId = session.id;
    await order.save();

    await Payment.create({
      order: order._id,
      user: req.user._id,
      stripeSessionId: session.id,
      amount: order.totalAmount,
      currency: 'inr',
      status: 'pending',
    });

    res.status(200).json({ success: true, checkoutUrl: session.url });
  } catch (err) {
    next(err);
  }
};

// POST /api/payment/webhook
// IMPORTANT: this route is mounted with express.raw() BEFORE express.json()
// in server.js, because Stripe's signature check needs the raw request body.
const handleStripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = constructWebhookEvent(req.body, signature);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      const order = await Order.findOne({ stripeSessionId: session.id });
      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.orderStatus = 'Confirmed';
        await order.save();

        // Decrement stock for each purchased item now that payment is confirmed.
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
        }
        await invalidateProductCache();

        await Payment.findOneAndUpdate({ stripeSessionId: session.id }, { status: 'succeeded' });

        // Clear the cart now that the order is placed.
        await User.findByIdAndUpdate(order.user, { cart: [] });
      }
    }

    if (event.type === 'checkout.session.expired') {
      await Payment.findOneAndUpdate({ stripeSessionId: event.data.object.id }, { status: 'failed' });
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error processing Stripe webhook:', err.message);
    // Respond 200 anyway once signature is verified, per Stripe's guidance,
    // to avoid endless retries for an application-side bug; log for follow-up.
    res.status(200).json({ received: true });
  }
};

module.exports = { createCheckoutSessionHandler, handleStripeWebhook };
