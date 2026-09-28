const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Review = require('../models/Review');
const { invalidateProductCache } = require('./productController');

// GET /api/admin/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    const [totalUsers, totalProducts, totalOrders, revenueAgg, pendingOrders, lowStockProducts] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.countDocuments({ orderStatus: 'Pending' }),
      Product.countDocuments({ stock: { $lte: 5 } }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        revenue: revenueAgg[0]?.total || 0,
        pendingOrders,
        lowStockProducts,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ---------- Products ----------

// POST /api/admin/products
const createProduct = async (req, res, next) => {
  try {
    const { name, brand, description, majorCategory, subcategory, price, originalPrice, stock, sku } = req.body;
    if (typeof name !== 'string' || name.trim().length < 2 || typeof brand !== 'string' || brand.trim().length < 2 || typeof description !== 'string' || description.trim().length < 2 || !majorCategory || !subcategory || typeof sku !== 'string' || sku.trim().length < 2 || !Number.isFinite(Number(price)) || Number(price) <= 0 || !Number.isInteger(Number(stock)) || Number(stock) < 0) {
      return res.status(400).json({ success: false, message: 'Please provide valid required product fields, price and stock.' });
    }
    if (originalPrice != null && originalPrice !== '' && (!Number.isFinite(Number(originalPrice)) || Number(originalPrice) < Number(price))) {
      return res.status(400).json({ success: false, message: 'Original/MRP price cannot be lower than the selling price.' });
    }
    if (req.body.discount != null && (!Number.isFinite(Number(req.body.discount)) || Number(req.body.discount) < 0 || Number(req.body.discount) > 100)) {
      return res.status(400).json({ success: false, message: 'Discount must be between 0 and 100.' });
    }
    if (req.body.initialRating != null && (!Number.isFinite(Number(req.body.initialRating)) || Number(req.body.initialRating) < 0 || Number(req.body.initialRating) > 5)) {
      return res.status(400).json({ success: false, message: 'Admin rating must be between 0 and 5.' });
    }
    if (!Array.isArray(req.body.images) || req.body.images.length < 1 || req.body.images.length > 8) {
      return res.status(400).json({ success: false, message: 'Add 1 to 8 real product photo URLs before publishing.' });
    }
    if (req.body.images.some((src) => { try { const u = new URL(String(src)); return !['http:', 'https:'].includes(u.protocol); } catch { return true; } })) {
      return res.status(400).json({ success: false, message: 'Every product photo must be a valid http(s) URL.' });
    }
    const productData = { ...req.body };
    delete productData.rating;
    delete productData.reviewCount;
    productData.initialRating = Number(productData.initialRating || 0);
    productData.rating = productData.initialRating;
    productData.reviewCount = 0;
    const product = await Product.create(productData);
    await invalidateProductCache();
    res.status(201).json({ success: true, product });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ success: false, message: 'SKU already exists. Use a unique SKU.' });
    next(err);
  }
};

// PUT /api/admin/products/:id
const updateProduct = async (req, res, next) => {
  try {
    if (req.body.originalPrice != null && req.body.originalPrice !== '' && Number(req.body.originalPrice) < Number(req.body.price)) {
      return res.status(400).json({ success: false, message: 'Original/MRP price cannot be lower than the selling price.' });
    }
    if (req.body.initialRating !== undefined && (!Number.isFinite(Number(req.body.initialRating)) || Number(req.body.initialRating) < 0 || Number(req.body.initialRating) > 5)) {
      return res.status(400).json({ success: false, message: 'Admin rating must be between 0 and 5.' });
    }
    if (req.body.images !== undefined) {
      if (!Array.isArray(req.body.images) || req.body.images.length < 1 || req.body.images.length > 8) {
        return res.status(400).json({ success: false, message: 'Add 1 to 8 real product photo URLs before publishing.' });
      }
      if (req.body.images.some((src) => { try { const u = new URL(String(src)); return !['http:', 'https:'].includes(u.protocol); } catch { return true; } })) {
        return res.status(400).json({ success: false, message: 'Every product photo must be a valid http(s) URL.' });
      }
    }
    const updates = { ...req.body };
    delete updates.rating;
    delete updates.reviewCount;
    if (updates.initialRating !== undefined) updates.initialRating = Number(updates.initialRating);

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (product) {
      // Rebuild final rating after an admin changes the starting rating.
      const userStats = await Review.aggregate([
        { $match: { product: product._id } },
        { $group: { _id: '$product', avgUserRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);
      const adminRating = Number(product.initialRating || 0);
      const userCount = userStats.length ? userStats[0].count : 0;
      const userAverage = userStats.length ? Number(userStats[0].avgUserRating) : 0;
      let finalRating = 0;
      if (adminRating > 0 && userCount > 0) finalRating = Number(((adminRating + userAverage) / 2).toFixed(1));
      else if (adminRating > 0) finalRating = Number(adminRating.toFixed(1));
      else if (userCount > 0) finalRating = Number(userAverage.toFixed(1));
      product.rating = finalRating;
      product.reviewCount = userCount;
      await product.save();
    }
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    await invalidateProductCache();
    res.status(200).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    await invalidateProductCache();
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};

// ---------- Orders ----------

// GET /api/admin/orders
const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate('user', 'firstName lastName email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (err) {
    next(err);
  }
};

const VALID_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

// PUT /api/admin/orders/:id/status  Body: { orderStatus }
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;
    if (!VALID_STATUSES.includes(orderStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { orderStatus }, { new: true });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// ---------- Users ----------

// GET /api/admin/users
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-cart').sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

// ---------- Reviews ----------

// GET /api/admin/reviews
const getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'firstName lastName')
      .populate('product', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, reviews });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  getAllReviews,
};
