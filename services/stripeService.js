const stripe = require('../config/stripe');

// Creates a Stripe Checkout Session using SERVER-CALCULATED prices only.
// `order` must already have its final totalAmount computed from DB data.
const createCheckoutSession = async ({ order, user }) => {
  const lineItems = order.items.map((item) => ({
    price_data: {
      currency: 'inr',
      product_data: { name: item.name },
      unit_amount: Math.round(item.price * 100), // Stripe expects cents
    },
    quantity: item.quantity,
  }));

  // Shipping and tax are added as a single line item so the Stripe total
  // matches order.totalAmount exactly.
  const extras = order.shipping + order.tax - order.discount;
  if (extras !== 0) {
    lineItems.push({
      price_data: {
        currency: 'inr',
        product_data: { name: 'Shipping, tax & discount adjustment' },
        unit_amount: Math.round(extras * 100),
      },
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: lineItems,
    customer_email: user.email,
    success_url: `${process.env.CLIENT_URL}/orders/${order._id}?payment=success`,
    cancel_url: `${process.env.CLIENT_URL}/checkout?payment=cancelled`,
    metadata: { orderId: order._id.toString(), userId: user._id.toString() },
  });

  return session;
};

// Verifies the raw webhook payload against the Stripe signature header.
// Throws if the signature is invalid — caller must respond 400 in that case.
const constructWebhookEvent = (rawBody, signature) => {
  return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
};

module.exports = { createCheckoutSession, constructWebhookEvent };
