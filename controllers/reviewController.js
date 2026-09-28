const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { invalidateProductCache } = require('./productController');

// Recalculates and persists a product's storefront rating and customer review count.
// Recalculates the storefront rating from the admin starting rating and customer reviews.
// If customer reviews exist: final = average(admin rating, customer-review average).
// If no customer reviews exist: final = admin rating. If admin rating is 0, customer average is used.
const recalculateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: '$product', avgUserRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const product = await Product.findById(productId).select('initialRating');
  if (!product) return;

  const adminRating = Number(product.initialRating || 0);
  const userCount = stats.length ? stats[0].count : 0;
  const userAverage = stats.length ? Number(stats[0].avgUserRating) : 0;

  let rating = 0;
  if (adminRating > 0 && userCount > 0) {
    rating = Number(((adminRating + userAverage) / 2).toFixed(1));
  } else if (adminRating > 0) {
    rating = Number(adminRating.toFixed(1));
  } else if (userCount > 0) {
    rating = Number(userAverage.toFixed(1));
  }

  await Product.findByIdAndUpdate(productId, { rating, reviewCount: userCount });
  await invalidateProductCache();
};

// GET /api/products/:id/reviews
const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.id })
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 });

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    });

    res.status(200).json({ success: true, reviews, distribution, count: reviews.length });
  } catch (err) {
    next(err);
  }
};

// POST /api/products/:id/reviews  Body: { rating, comment }
const createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5 || typeof comment !== 'string' || comment.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'A rating (1-5) and comment are required' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const alreadyReviewed = await Review.findOne({ user: req.user._id, product: req.params.id });
    if (alreadyReviewed) {
      return res.status(409).json({ success: false, message: 'You already reviewed this product. Edit your existing review instead.' });
    }

    // "Verified Purchase" only if the user has a delivered/paid order containing this product.
    const purchase = await Order.findOne({
      user: req.user._id,
      paymentStatus: 'paid',
      'items.product': req.params.id,
    });

    const review = await Review.create({
      user: req.user._id,
      product: req.params.id,
      rating: Number(rating),
      comment: comment.trim(),
      verifiedPurchase: Boolean(purchase),
    });

    await recalculateProductRating(req.params.id);
    res.status(201).json({ success: true, review });
  } catch (err) {
    next(err);
  }
};

// PUT /api/reviews/:id  Body: { rating, comment }
const updateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own review' });
    }

    const { rating, comment } = req.body;
    if (rating !== undefined && (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5)) {
      return res.status(400).json({ success: false, message: 'Rating must be a whole number from 1 to 5' });
    }
    if (comment !== undefined && (typeof comment !== 'string' || comment.trim().length < 2)) {
      return res.status(400).json({ success: false, message: 'Review comment must contain at least 2 characters' });
    }
    if (rating !== undefined) review.rating = Number(rating);
    if (comment !== undefined) review.comment = comment.trim();
    await review.save();

    await recalculateProductRating(review.product);
    res.status(200).json({ success: true, review });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/reviews/:id  (owner or admin)
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
    }

    const productId = review.product;
    await review.deleteOne();
    await recalculateProductRating(productId);

    res.status(200).json({ success: true, message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProductReviews, createReview, updateReview, deleteReview };
