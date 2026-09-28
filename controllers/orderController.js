const Order = require('../models/Order');
const User = require('../models/User');
const { buildCartResponse } = require('./cartController');

// POST /api/orders  Body: { shippingAddress }
// Creates a Pending order snapshot from the user's CURRENT server-priced
// cart. Payment is handled separately via /api/payment/create-checkout-session.
const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress } = req.body;
    const required = ['fullName', 'phone', 'address', 'city', 'state', 'postalCode', 'country'];
    if (!shippingAddress || !required.every((f) => typeof shippingAddress[f] === 'string' && shippingAddress[f].trim())) {
      return res.status(400).json({ success: false, message: 'Complete shipping address is required' });
    }
    const phone = shippingAddress.phone.replace(/\s|[-()]/g, '');
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit Indian mobile number' });
    }
    if (!/^[1-9]\d{5}$/.test(shippingAddress.postalCode.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 6-digit postal code' });
    }
    shippingAddress.fullName = shippingAddress.fullName.trim();
    shippingAddress.phone = phone;
    shippingAddress.address = shippingAddress.address.trim();
    shippingAddress.city = shippingAddress.city.trim();
    shippingAddress.state = shippingAddress.state.trim();
    shippingAddress.postalCode = shippingAddress.postalCode.trim();
    shippingAddress.country = shippingAddress.country.trim();
    if (shippingAddress.fullName.length < 2 || shippingAddress.address.length < 8 || shippingAddress.city.length < 2 || shippingAddress.state.length < 2 || shippingAddress.country.length < 2) {
      return res.status(400).json({ success: false, message: 'Please provide complete and valid shipping details' });
    }

    const user = await User.findById(req.user._id);
    const cart = await buildCartResponse(user);

    if (cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    // Re-validate stock at order-creation time.
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.product.name}`,
        });
      }
    }

    const order = await Order.create({
      user: user._id,
      items: cart.items.map((i) => ({
        product: i.product._id,
        name: i.product.name,
        image: i.product.images?.[0],
        price: i.product.price,
        quantity: i.quantity,
      })),
      shippingAddress,
      subtotal: cart.subtotal,
      discount: cart.discount,
      shipping: cart.shipping,
      tax: cart.tax,
      totalAmount: cart.total,
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders — current user's own orders
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id — must belong to the requesting user (or be an admin)
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }
    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

module.exports = { createOrder, getMyOrders, getOrderById };
