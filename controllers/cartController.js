const User = require('../models/User');
const Product = require('../models/Product');

const TAX_RATE = 0.08; // 8% flat demo tax rate
const FREE_SHIPPING_THRESHOLD = 100;
const FLAT_SHIPPING = 9.99;

// Recomputes cart totals using CURRENT DATABASE prices — the frontend's
// numbers are never trusted for money calculations.
const buildCartResponse = async (user) => {
  const populated = await user.populate('cart.product');
  const items = populated.cart
    .filter((item) => item.product) // drop items whose product was deleted
    .map((item) => ({
      product: item.product,
      quantity: item.quantity,
      lineTotal: Number((item.product.price * item.quantity).toFixed(2)),
    }));

  const subtotal = Number(items.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2));
  const discount = 0; // placeholder for future coupon logic
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const tax = Number(((subtotal - discount) * TAX_RATE).toFixed(2));
  const total = Number((subtotal - discount + shipping + tax).toFixed(2));

  return { items, subtotal, discount, shipping, tax, total };
};

// GET /api/cart
const getCart = async (req, res, next) => {
  try {
    const cart = await buildCartResponse(req.user);
    res.status(200).json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};

// POST /api/cart  Body: { productId, quantity }
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId || !Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
      return res.status(400).json({ success: false, message: 'productId and a valid quantity are required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Not enough stock available' });
    }

    const user = await User.findById(req.user._id);
    const existing = user.cart.find((item) => item.product.toString() === productId);
    if (existing) {
      existing.quantity += Number(quantity);
    } else {
      user.cart.push({ product: productId, quantity });
    }
    await user.save();

    const cart = await buildCartResponse(user);
    res.status(200).json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};

// PUT /api/cart/:productId  Body: { quantity }
const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
      return res.status(400).json({ success: false, message: 'A valid quantity is required' });
    }

    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Not enough stock available' });
    }

    const user = await User.findById(req.user._id);
    const item = user.cart.find((i) => i.product.toString() === req.params.productId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }
    item.quantity = Number(quantity);
    await user.save();

    const cart = await buildCartResponse(user);
    res.status(200).json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/cart/:productId
const removeCartItem = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = user.cart.filter((i) => i.product.toString() !== req.params.productId);
    await user.save();

    const cart = await buildCartResponse(user);
    res.status(200).json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/cart
const clearCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = [];
    await user.save();
    res.status(200).json({ success: true, cart: { items: [], subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0 } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart, buildCartResponse };
