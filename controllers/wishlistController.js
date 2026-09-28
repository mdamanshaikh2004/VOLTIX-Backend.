const Wishlist = require('../models/Wishlist');
const User = require('../models/User');
const Product = require('../models/Product');

const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
  }
  return wishlist;
};

// GET /api/wishlist
const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await getOrCreateWishlist(req.user._id);
    await wishlist.populate('products');
    res.status(200).json({ success: true, wishlist: wishlist.products });
  } catch (err) {
    next(err);
  }
};

// POST /api/wishlist/:productId
const addToWishlist = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const wishlist = await getOrCreateWishlist(req.user._id);
    if (!wishlist.products.some((p) => p.toString() === req.params.productId)) {
      wishlist.products.push(req.params.productId);
      await wishlist.save();
    }
    await wishlist.populate('products');
    res.status(200).json({ success: true, wishlist: wishlist.products });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/wishlist/:productId
const removeFromWishlist = async (req, res, next) => {
  try {
    const wishlist = await getOrCreateWishlist(req.user._id);
    wishlist.products = wishlist.products.filter((p) => p.toString() !== req.params.productId);
    await wishlist.save();
    await wishlist.populate('products');
    res.status(200).json({ success: true, wishlist: wishlist.products });
  } catch (err) {
    next(err);
  }
};

// POST /api/wishlist/:productId/move-to-cart
const moveToCart = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (product.stock < 1) {
      return res.status(400).json({ success: false, message: 'Product is out of stock' });
    }

    const user = await User.findById(req.user._id);
    const existing = user.cart.find((i) => i.product.toString() === req.params.productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      user.cart.push({ product: req.params.productId, quantity: 1 });
    }
    await user.save();

    const wishlist = await getOrCreateWishlist(req.user._id);
    wishlist.products = wishlist.products.filter((p) => p.toString() !== req.params.productId);
    await wishlist.save();

    res.status(200).json({ success: true, message: 'Moved to cart' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, moveToCart };
