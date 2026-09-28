const Stripe = require('stripe');

// Single Stripe SDK instance, configured with the secret key.
// Runs in TEST MODE as long as STRIPE_SECRET_KEY is a sk_test_ key.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = stripe;
