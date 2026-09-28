const express = require('express');
const router = express.Router();
const { getProducts, getProductById, getRelatedProducts } = require('../controllers/productController');
const { getProductReviews, createReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { generalLimiter } = require('../middleware/rateLimiter');

router.get('/', generalLimiter, getProducts);
router.get('/:id', generalLimiter, getProductById);
router.get('/:id/related', generalLimiter, getRelatedProducts);

// Reviews are read/created in the context of a specific product.
router.get('/:id/reviews', generalLimiter, getProductReviews);
router.post('/:id/reviews', protect, createReview);

module.exports = router;
